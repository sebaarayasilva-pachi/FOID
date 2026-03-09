#!/bin/sh
set -e

# Inicia Cloud SQL Auth Proxy en background
echo "Iniciando Cloud SQL Proxy..."
cloud-sql-proxy "${CLOUD_SQL_INSTANCE}" --port=5432 &

# Espera 5s para que el proxy arranque
sleep 5

# Migraciones en background (no bloquean)
(npx prisma migrate deploy 2>/dev/null || true) &

# Arranque de Next.js
echo "Iniciando Next.js en puerto 8080..."
exec npx next start -p 8080
