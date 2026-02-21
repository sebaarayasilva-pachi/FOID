'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export async function saveBankBalance(formData: FormData) {
  const id = formData.get('id') as string | null;
  const dateRaw = formData.get('date') as string;
  const balance = parseFloat((formData.get('balance') as string) || '0');

  if (!dateRaw) {
    return { ok: false as const, error: 'Fecha es requerida' };
  }

  const dateStr = dateRaw.includes('T') ? dateRaw.slice(0, 10) : dateRaw;

  try {
    const data = { date: dateStr, balance: isNaN(balance) ? 0 : balance };
    if (id) {
      await prisma.bankBalance.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.bankBalance.upsert({
        where: {
          tenantId_date: { tenantId: TENANT_ID, date: dateStr },
        },
        create: { tenantId: TENANT_ID, ...data },
        update: data,
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save bank balance error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteBankBalance(id: string) {
  try {
    await prisma.bankBalance.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete bank balance error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}
