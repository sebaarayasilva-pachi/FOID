#!/bin/sh
set -e

# Cloud Run con --add-cloudsql-instances monta el socket en /cloudsql/INSTANCE
# DATABASE_URL debe usar ?host=/cloudsql/PROJECT:REGION:INSTANCE
# No se necesita cloud-sql-proxy

# Migraciones en background (no bloquean)
(npx prisma migrate deploy 2>/dev/null || true) &

# Arranque de Next.js
echo "Iniciando Next.js en puerto 8080..."
exec npx next start -p 8080
