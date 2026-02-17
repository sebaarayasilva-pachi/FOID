# Deploy FOID - Google Cloud (Cloud Run + Cloud SQL PostgreSQL)

Cloud Build → Cloud Run + Cloud SQL. Sin Firebase.

---

## 1. Crear instancia Cloud SQL (PostgreSQL)

### En Google Cloud Console

1. Ve a [Cloud SQL](https://console.cloud.google.com/sql)
2. **Create instance** → **Choose PostgreSQL**
3. Configuración sugerida:
   - **Instance ID**: `foid-db`
   - **Password**: Define y guarda la contraseña del usuario `postgres`
   - **Region**: `us-central1` (o la misma que App Hosting)
   - **Machine type**: Shared core (1 vCPU) para empezar
4. **Create instance**

### Crear base de datos y usuario

1. En la instancia → **Databases** → **Create database** → nombre: `foid`
2. **Users** → **Add user account**:
   - Username: `foid_user`
   - Password: (guárdala para el secreto `DATABASE_URL`)

### Obtener Connection Name

En Overview de la instancia, copia **Connection name** (formato: `PROJECT_ID:REGION:INSTANCE_ID`).

---

## 2. Habilitar APIs

```bash
gcloud services enable sqladmin.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

---

## 3. Cloud Build (recomendado)

Cloud Build despliega a Cloud Run **con** la conexión Cloud SQL incluida.

### Crear repositorio Artifact Registry

```bash
gcloud config set project foid-5e5e8
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-east5 \
  --description="Imágenes para Cloud Run"
```

(Si ya existe, omite este paso.)

### Crear secreto DATABASE_URL en Secret Manager

**Formato para Cloud SQL Auth Proxy (TCP localhost:5432):**
- `DATABASE_URL`: `postgresql://user:pass@localhost:5432/foid`
- El contenedor usa Cloud SQL Auth Proxy que expone la DB en localhost:5432
- `$` en contraseña → `%24`

```powershell
[System.IO.File]::WriteAllText("$env:TEMP\db.txt", 'postgresql://foid_user:Charli01%24@localhost:5432/foid')
gcloud secrets versions add DATABASE_URL --data-file="$env:TEMP\db.txt" --project=foid-5e5e8
```

### Trigger desde GitHub

1. [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=foid-5e5e8)
2. **Create trigger** → Conecta tu repo GitHub
3. **Event**: Push to branch → `main`
4. **Configuration**: Cloud Build configuration file → `cloudbuild.yaml`
5. **Create**

### Deploy manual

```bash
gcloud builds submit --config=cloudbuild.yaml --project=foid-5e5e8
```

### Permisos Cloud SQL (cuenta de servicio de Cloud Run)

La cuenta de servicio que ejecuta Cloud Run debe tener **Cloud SQL Client** en el proyecto donde está la instancia (foid-487623):

```bash
# Obtener la cuenta de servicio de Cloud Run
gcloud run services describe foid-web --region=us-east5 --project=foid-5e5e8 --format="value(spec.template.spec.serviceAccountName)"

# Si está vacía, usa la cuenta por defecto: PROJECT_NUMBER-compute@developer.gserviceaccount.com
PROJECT_NUM=$(gcloud projects describe foid-5e5e8 --format='value(projectNumber)')
SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

# Dar Cloud SQL Client en el proyecto de la instancia (foid-487623)
gcloud projects add-iam-policy-binding foid-487623 \
  --member="serviceAccount:${SA}" \
  --role="roles/cloudsql.client"
```

### Permisos para Cloud Build

La cuenta de servicio de Cloud Build debe poder acceder al secreto y desplegar en Cloud Run:

```bash
PROJECT_ID=foid-5e5e8
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## 5. Permisos IAM

La cuenta de servicio de Cloud Run debe tener **Cloud SQL Client**:

```bash
# Obtener email de la cuenta de servicio (ej: PROJECT_NUMBER-compute@...)
gcloud run services describe BACKEND_NAME --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"

# Asignar rol
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.client"
```

---

## 6. Desarrollo local con Cloud SQL

Para desarrollo local puedes usar:

- **Cloud SQL Auth Proxy** para conectar a la instancia
- O una base PostgreSQL local / Neon para desarrollo

Con Auth Proxy:

```bash
# Descargar Cloud SQL Auth Proxy
# https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

./cloud-sql-proxy PROJECT_ID:REGION:foid-db
# Escucha en localhost:5432
```

`.env` local:

```
DATABASE_URL="postgresql://foid_user:PASSWORD@localhost:5432/foid"
FOID_TENANT_ID="g3"
```

---

## 7. Migraciones

Tras el primer deploy, las migraciones se ejecutan con `prisma migrate deploy` en el script de start.

Para datos iniciales (seed):

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/seed-sample.ts
```
