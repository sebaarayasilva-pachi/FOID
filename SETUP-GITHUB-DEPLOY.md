# Configurar deploy automático desde GitHub

**Paso a paso – hazlo en orden.**

---

## Paso 1: Abrir Cloud Build

Abre este enlace (con tu cuenta de Google):

**https://console.cloud.google.com/cloud-build/triggers?project=foid-5e5e8**

---

## Paso 2: Conectar el repo de GitHub

1. Si ves **"Connect repository"** o **"Manage connected repositories"**, haz clic.
2. Elige **GitHub (Cloud Build GitHub App)**.
3. En la ventana de GitHub:
   - Autoriza a Google Cloud si te lo pide.
   - Selecciona **solo repos** o **todos** según prefieras.
   - Acepta.
4. Vuelve a la consola de GCP.
5. En **Repository**, elige: **sebaarayasilva-pachi/FOID**.
6. Haz clic en **Connect**.

---

## Paso 3: Crear el trigger

1. Haz clic en **Create trigger**.
2. Completa:
   - **Name**: `foid-deploy`
   - **Event**: Push to a branch
   - **Source**: Repo `FOID` (el que conectaste)
   - **Branch**: `^main$` (o escribe `main`)
   - **Configuration**: Cloud Build configuration file (repository)
   - **Cloud Build configuration file location**: `cloudbuild.yaml`
3. Haz clic en **Create**.

---

## Paso 4: Probar

1. En la lista de triggers, haz clic en **Run** en `foid-deploy`.
2. O haz un push a `main`:
   ```powershell
   git add .
   git commit -m "Deploy"
   git push origin main
   ```

---

## Ver el resultado

- [Historial de builds](https://console.cloud.google.com/cloud-build/builds?project=foid-5e5e8)
- [App desplegada](https://foid-web-24143890804.us-east5.run.app)
