#!/bin/sh
set -e

# Cloud SQL Auth Proxy: conecta a Cloud SQL y expone en localhost:5432
# Requiere CLOUD_SQL_INSTANCE (ej: project:region:instance)
echo "Iniciando Cloud SQL Proxy..."
cloud-sql-proxy "${CLOUD_SQL_INSTANCE}" --port=5432 &

# Esperar a que el proxy conecte (Cloud SQL puede tardar en cold start)
sleep 15

# Migraciones en background (no bloquean)
(npx prisma migrate deploy 2>/dev/null || true) &

echo "Iniciando Next.js en puerto 8080..."
exec npx next start -p 8080
