# Configurar deploy automático (GitHub Actions)

Para que el deploy funcione en cada push, agrega estos **secrets** en GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

## Secrets requeridos

| Secret | Cómo obtenerlo |
|--------|----------------|
| **GCP_SA_KEY** | En GCP Console → IAM → Service Accounts → Crear clave JSON. La SA debe tener: Cloud Build Editor, Cloud Run Admin, Artifact Registry Writer |
| **GCP_PROJECT_ID** | `foid-5e5e8` (tu proyecto) |

## Pasos

1. GCP Console → IAM & Admin → Service Accounts
2. Create Service Account → nombre ej: `github-deploy`
3. Roles: **Cloud Build Editor**, **Cloud Run Admin**, **Artifact Registry Writer**
4. Create Key → JSON → descargar
5. GitHub → repo → Settings → Secrets → New secret
   - Name: `GCP_SA_KEY`
   - Value: pegar todo el contenido del JSON
6. New secret: `GCP_PROJECT_ID` = `foid-5e5e8`

Tras guardar los secrets, el próximo push a `main` ejecutará el deploy.
