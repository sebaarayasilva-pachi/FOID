import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';
import { ArriendosClient } from './ArriendosClient';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function ArriendosPage() {
  const rentals = await prisma.rental.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { propertyName: 'asc' },
  });

  const data = rentals.map((r) => ({
    id: r.id,
    propertyName: r.propertyName,
    monthlyRent: Number(r.monthlyRent),
    status: r.status,
    tenantName: r.tenantName ?? '',
  }));

  return <ArriendosClient rentals={data} />;
}
