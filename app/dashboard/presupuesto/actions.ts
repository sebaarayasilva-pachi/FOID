'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

function parseNum(val: string | null): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

export async function saveBudget(formData: FormData) {
  const id = formData.get('id') as string | null;
  const month = (formData.get('month') as string)?.trim();
  const budgetIncome = parseNum(formData.get('budgetIncome') as string) ?? 0;
  const budgetExpenses = parseNum(formData.get('budgetExpenses') as string) ?? 0;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return { ok: false as const, error: 'Mes inválido (formato YYYY-MM)' };
  }

  try {
    const data = { budgetIncome, budgetExpenses };
    if (id) {
      await prisma.budget.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.budget.upsert({
        where: { tenantId_month: { tenantId: TENANT_ID, month } },
        create: { tenantId: TENANT_ID, month, ...data },
        update: data,
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save budget error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteBudget(id: string) {
  try {
    await prisma.budget.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete budget error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}
