import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

async function main() {
  console.log('Seeding database for tenant:', TENANT_ID);

  await prisma.investment.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        name: 'Fondo A',
        category: 'FFMM',
        capitalInvested: 5000000,
        currentValue: 5200000,
        returnPct: 0.04,
        monthlyIncome: 20000,
      },
      {
        tenantId: TENANT_ID,
        name: 'Acción X',
        category: 'ACCIONES',
        capitalInvested: 1000000,
        currentValue: 1100000,
        returnPct: 0.1,
        monthlyIncome: 0,
      },
    ],
  });

  await prisma.liability.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        name: 'Crédito Hipotecario',
        category: 'HIPOTECARIO',
        balance: 80000000,
        monthlyPayment: 450000,
        interestRate: 0.089,
      },
    ],
  });

  await prisma.cashflowMonth.upsert({
    where: { tenantId_month: { tenantId: TENANT_ID, month: '2026-01' } },
    create: {
      tenantId: TENANT_ID,
      month: '2026-01',
      income: 1250000,
      expenses: 630000,
    },
    update: {},
  });

  await prisma.rental.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        propertyName: 'Depto Las Condes',
        monthlyRent: 450000,
        status: 'RENTED',
      },
    ],
  });

  console.log('✓ Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
