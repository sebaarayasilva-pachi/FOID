/**
 * Script para cargar datos de ejemplo vía API.
 * Uso: npx tsx scripts/seed-sample.ts
 *
 * Requiere: FOID_API_KEY y API_URL (opcional, default http://localhost:3000)
 * Ejemplo: FOID_API_KEY=test123 API_URL=http://localhost:3000 npx tsx scripts/seed-sample.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.FOID_API_KEY || 'dev-key'; // debe coincidir con .env FOID_API_KEY
const TENANT_ID = process.env.TENANT_ID || 'g3';

const SAMPLE = {
  investmentsCsv: `name,category,capitalInvested,currentValue,returnPct,monthlyIncome
Fondo A,FFMM,5000000,5200000,4,20000
Fondo B,FFMM,3000000,3150000,5,12500
Acción X,ACCIONES,1000000,1100000,10,0
Depósito Renta Fija,RENTA_FIJA,2000000,2050000,2.5,4000`,
  liabilitiesCsv: `name,category,balance,monthlyPayment,interestRate
Crédito Hipotecario,HIPOTECARIO,80000000,450000,8.9
Tarjeta SANTANDER,SANTANDER,500000,150000,24`,
  cashflowCsv: `month,income,expenses
2025-09,1100000,580000
2025-10,1150000,600000
2025-11,1200000,620000
2025-12,1180000,610000
2026-01,1250000,630000
2026-02,1220000,625000`,
  rentalsCsv: `propertyName,monthlyRent,status
Depto Las Condes,450000,RENTED
Casa Providencia,0,VACANT`,
};

async function main() {
  console.log('Cargando datos de ejemplo...');
  console.log(`API: ${API_URL} | Tenant: ${TENANT_ID}`);

  const res = await fetch(`${API_URL}/api/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-foid-key': API_KEY,
    },
    body: JSON.stringify({
      tenantId: TENANT_ID,
      ...SAMPLE,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Error:', data.error || res.status);
    process.exit(1);
  }

  console.log('✓ Datos cargados correctamente');
  console.log('  Visita', `${API_URL}/dashboard`, 'para ver el dashboard');
}

main();
