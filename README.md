# FOID – Financial Overview & Investment Dashboard

Dashboard único con gráficos para inversiones, pasivos, flujo de caja y arriendos.

## Stack

- **Next.js 14** + App Router
- **Prisma** + PostgreSQL
- **Highcharts** para gráficos
- **Tailwind CSS**

## Setup local

1. Copiar variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Configurar `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/foid?schema=public"
   FOID_API_KEY="tu-api-key"
   FOID_TENANT_ID="g3"
   ```

3. Instalar y migrar:
   ```bash
   npm install
   npx prisma migrate deploy
   ```

4. Ejecutar:
   ```bash
   npm run dev
   ```

- Home: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Import: http://localhost:3000/dashboard/import

5. (Opcional) Cargar datos de ejemplo:
   - **Sin servidor**: `npx prisma db seed` (usa Prisma directamente)
   - **Con servidor**: `npm run seed` (vía API) o el botón "Cargar datos de ejemplo" en /dashboard/import

## API

### GET /api/health
Retorna `{ ok: true }`

### POST /api/import
Headers: `x-foid-key: <FOID_API_KEY>`

Body JSON:
```json
{
  "tenantId": "g3",
  "investmentsCsv": "name,category,capitalInvested,currentValue,returnPct,monthlyIncome\n...",
  "liabilitiesCsv": "name,category,balance,monthlyPayment,interestRate\n...",
  "cashflowCsv": "month,income,expenses\n...",
  "rentalsCsv": "propertyName,monthlyRent,status\n..."
}
```

### GET /api/overview?tenantId=g3
Headers: `x-foid-key: <FOID_API_KEY>`

Retorna KPIs y datasets para gráficos.

## Deploy Google Cloud Run

Ver especificación en el documento de arquitectura. Resumen:

1. Habilitar APIs (Cloud Run, Cloud SQL, Secret Manager, Cloud Build)
2. Crear Cloud SQL (Postgres 15)
3. Guardar secrets: `FOID_API_KEY`, `DATABASE_URL`, `FOID_TENANT_ID`
4. `gcloud run deploy foid-app --source .` con Cloud SQL y secrets configurados
