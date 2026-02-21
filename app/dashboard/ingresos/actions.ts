'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

const TYPES = ['OTROS', 'DIVIDENDOS_EMPRESAS'] as const;
const FREQUENCIES = ['MENSUAL', 'SEMANAL', 'TRIMESTRAL', 'ANUAL'] as const;

export async function saveOtherIncome(formData: FormData) {
  const id = formData.get('id') as string | null;
  const description = (formData.get('description') as string)?.trim();
  const amount = parseFloat((formData.get('amount') as string) || '0');
  const frequency = (formData.get('frequency') as string) || 'MENSUAL';
  const type = (formData.get('type') as string) || 'OTROS';

  if (!description) {
    return { ok: false as const, error: 'Descripción es requerida' };
  }

  if (!TYPES.includes(type as (typeof TYPES)[number]) || !FREQUENCIES.includes(frequency as (typeof FREQUENCIES)[number])) {
    return { ok: false as const, error: 'Tipo o frecuencia inválido' };
  }

  try {
    const data = {
      description,
      amount: isNaN(amount) ? 0 : amount,
      frequency,
      type,
    };
    if (id) {
      await prisma.otherIncome.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.otherIncome.create({
        data: { tenantId: TENANT_ID, ...data },
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save other income error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteOtherIncome(id: string) {
  try {
    await prisma.otherIncome.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete other income error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}
