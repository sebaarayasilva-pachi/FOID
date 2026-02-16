import { prisma } from '@/src/lib/prisma';
import { ObligacionesClient } from './ObligacionesClient';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function ObligacionesPage() {
  const liabilities = await prisma.liability.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { name: 'asc' },
  });

  const data = liabilities.map((l) => ({
    id: l.id,
    name: l.name,
    category: l.category,
    balance: l.balance != null ? Number(l.balance) : null,
    monthlyPayment: Number(l.monthlyPayment),
    interestRate: l.interestRate != null ? Number(l.interestRate) : null,
  }));

  return <ObligacionesClient liabilities={data} />;
}
