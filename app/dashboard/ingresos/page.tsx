import { prisma } from '@/src/lib/prisma';
import { IngresosClient } from './IngresosClient';

export const dynamic = 'force-dynamic';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function IngresosPage() {
  const incomes = await prisma.otherIncome.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { description: 'asc' },
  });

  const data = incomes.map((i) => ({
    id: i.id,
    description: i.description,
    amount: Number(i.amount),
    frequency: i.frequency,
    type: i.type,
  }));

  return <IngresosClient incomes={data} />;
}
