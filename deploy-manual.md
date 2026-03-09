# Deploy manual a Cloud Run

Cuando `git push` no dispara el deploy automático, ejecuta:

```bash
# 1. Autenticarse (si no lo has hecho)
gcloud auth login

# 2. Configurar proyecto
gcloud config set project foid-5e5e8
# Imagen: us-east5-docker.pkg.dev/foid-5e5e8/cloud-run-source-deploy/foid-web

# 3. Ejecutar deploy (usa cloudbuild.yaml)
gcloud builds submit --config=cloudbuild.yaml .
```

Esto construye la imagen Docker y la despliega en Cloud Run. Tarda ~5-10 min.

**Verificar:** Tras el deploy, entra a `/dashboard` — si ves el banner rojo "Build OK", el deploy funcionó.
