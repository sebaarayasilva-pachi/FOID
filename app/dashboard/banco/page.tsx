import { prisma } from '@/src/lib/prisma';
import { BancoClient } from './BancoClient';

export const dynamic = 'force-dynamic';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function BancoPage() {
  const balances = await prisma.bankBalance.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { date: 'desc' },
  });

  const data = balances.map((b) => ({
    id: b.id,
    date: b.date,
    balance: Number(b.balance),
  }));

  return <BancoClient balances={data} />;
}
