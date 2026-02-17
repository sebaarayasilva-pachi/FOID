# Deploy FOID - Firebase + Cloud SQL (PostgreSQL)

Todo en Google Cloud: Firebase App Hosting + Cloud SQL.

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
gcloud services enable sqladmin.googleapis.com run.googleapis.com cloudbuild.googleapis.com
```

---

## 3. Firebase App Hosting

### Conectar repositorio

1. [Firebase Console](https://console.firebase.google.com) → proyecto FOID
2. **Build** → **App Hosting** → **Create backend**
3. Conecta GitHub → selecciona el repo FOID
4. Directorio raíz: `/`
5. Rama: `main`
6. Crea el backend (primer deploy)

### Agregar conexión Cloud SQL al servicio

Firebase App Hosting usa Cloud Run. Tras el primer deploy:

1. Ve a [Cloud Run](https://console.cloud.google.com/run)
2. Localiza el servicio creado por App Hosting (nombre del backend)
3. **Edit & deploy new revision**
4. Pestaña **Connections** → **Cloud SQL connections** → **Add connection**
5. Elige la instancia `foid-db` → **Deploy**

### Configurar secreto DATABASE_URL

Formato para Unix socket (Cloud Run):

```
postgresql://foid_user:PASSWORD@/foid?host=/cloudsql/PROJECT_ID:REGION:foid-db
```

Reemplaza:
- `PASSWORD`: contraseña de `foid_user`
- `PROJECT_ID`: ID del proyecto de Firebase/GCP
- `REGION`: ej. `us-central1`
- `foid-db`: Instance ID de Cloud SQL

En terminal:

```bash
firebase login
firebase use TU_PROJECT_ID
firebase apphosting:secrets:set DATABASE_URL
# Pega la connection string cuando lo pida
```

O en Firebase Console → App Hosting → tu backend → **Secrets** → Add secret.

---

## 4. Permisos IAM

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

## 5. Desarrollo local con Cloud SQL

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

## 6. Migraciones

Tras el primer deploy, las migraciones se ejecutan con `prisma migrate deploy` en el script de start.

Para datos iniciales (seed):

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/seed-sample.ts
```
