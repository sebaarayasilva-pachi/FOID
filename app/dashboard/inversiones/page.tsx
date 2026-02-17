import { prisma } from '@/src/lib/prisma';
import { InversionesClient } from './InversionesClient';

export const dynamic = 'force-dynamic';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function InversionesPage() {
  const investments = await prisma.investment.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { name: 'asc' },
  });

  const data = investments.map((i) => ({
    id: i.id,
    agf: i.agf,
    name: i.name,
    category: i.category,
    capitalInvested: Number(i.capitalInvested),
    fechaApertura: i.fechaApertura ? i.fechaApertura.toISOString() : null,
    currentValue: i.currentValue != null ? Number(i.currentValue) : null,
    returnPct: i.returnPct != null ? Number(i.returnPct) : null,
    monthlyIncome: i.monthlyIncome != null ? Number(i.monthlyIncome) : null,
    rescates: i.rescates != null ? Number(i.rescates) : null,
    units: i.units != null ? Number(i.units) : null,
  }));

  return <InversionesClient investments={data} />;
}
