import { prisma } from '@/src/lib/prisma';
import { PresupuestoClient } from './PresupuestoClient';

export const dynamic = 'force-dynamic';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function PresupuestoPage() {
  const budgets = await prisma.budget.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { month: 'desc' },
  });

  const data = budgets.map((b) => ({
    id: b.id,
    month: b.month,
    budgetIncome: Number(b.budgetIncome),
    budgetExpenses: Number(b.budgetExpenses),
  }));

  return <PresupuestoClient budgets={data} />;
}
