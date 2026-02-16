'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';
const CATEGORIES = ['SUELDOS', 'TENEDOR', 'SANTANDER', 'HIPOTECARIO', 'TARJETA_CREDITO', 'CREDITO_CONSUMO', 'OTRO'];

function parseNum(val: string | null): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const n = parseFloat(val.replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

export async function saveLiability(formData: FormData) {
  const id = formData.get('id') as string | null;
  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string) || 'OTRO';
  const balance = parseNum(formData.get('balance') as string);
  const monthlyPayment = parseNum(formData.get('monthlyPayment') as string) ?? 0;
  const interestRate = parseNum(formData.get('interestRate') as string);

  if (!name) {
    return { ok: false as const, error: 'Nombre es requerido' };
  }

  const cat = CATEGORIES.includes(category) ? category : 'OTRO';

  try {
    const data = {
      name,
      category: cat,
      balance: balance ?? null,
      monthlyPayment,
      interestRate: interestRate != null ? (Math.abs(interestRate) > 1 ? interestRate / 100 : interestRate) : null,
    };
    if (id) {
      await prisma.liability.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.liability.create({
        data: { tenantId: TENANT_ID, ...data },
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save liability error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteLiability(id: string) {
  try {
    await prisma.liability.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete liability error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}
