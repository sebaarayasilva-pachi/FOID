#!/bin/sh
set -e

# Inicia Cloud SQL Auth Proxy en background (TCP localhost:5432)
cloud-sql-proxy "${CLOUD_SQL_INSTANCE}" --port=5432 &
PROXY_PID=$!

# Espera a que el proxy esté listo (máx 15s) - no fallar si timeout
echo "Esperando Cloud SQL Proxy..."
node -e "
const net = require('net');
let attempts = 0;
const max = 15;
function check() {
  const s = net.createConnection(5432, '127.0.0.1');
  s.on('connect', () => { s.destroy(); process.exit(0); });
  s.on('error', () => {
    if (++attempts >= max) { console.log('Timeout proxy'); process.exit(1); }
    setTimeout(check, 1000);
  });
}
check();
" && echo "Proxy listo." || echo "Proxy timeout - arrancando app."

# Migraciones en background (no bloquean el arranque de Cloud Run)
(npx prisma migrate deploy || echo "Migrate: falló o ya aplicado") &

# Arranque inmediato para pasar el health check de Cloud Run
exec npx next start -p 8080
