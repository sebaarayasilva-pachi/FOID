'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export async function saveRental(formData: FormData) {
  const id = formData.get('id') as string | null;
  const propertyName = (formData.get('propertyName') as string)?.trim();
  const monthlyRent = parseFloat((formData.get('monthlyRent') as string) || '0');
  const status = (formData.get('status') as string) || 'VACANT';
  const tenantName = (formData.get('tenantName') as string)?.trim() || null;

  if (!propertyName) {
    return { ok: false as const, error: 'Nombre de propiedad es requerido' };
  }

  try {
    const data = {
      propertyName,
      monthlyRent: isNaN(monthlyRent) ? 0 : monthlyRent,
      status: status === 'RENTED' ? 'RENTED' : 'VACANT',
      tenantName,
    };
    if (id) {
      await prisma.rental.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.rental.create({
        data: { tenantId: TENANT_ID, ...data },
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save rental error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteRental(id: string) {
  try {
    await prisma.rental.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete rental error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}
