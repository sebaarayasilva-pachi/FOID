'use server';

import { prisma } from '@/src/lib/prisma';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';
const CATEGORIES = ['FFMM', 'ACCIONES', 'RENTA_FIJA', 'INMOBILIARIO', 'OTROS'];

function parseNum(val: string | null): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const n = parseFloat(val.replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function parseDate(val: string | null): Date | null {
  if (!val || val.trim() === '') return null;
  const trimmed = val.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Date.UTC(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10), 12, 0, 0));
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export async function saveInvestment(formData: FormData) {
  const id = formData.get('id') as string | null;
  const agf = (formData.get('agf') as string)?.trim() || null;
  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string) || 'OTROS';
  const capitalInvested = parseNum(formData.get('capitalInvested') as string) ?? 0;
  const fechaApertura = parseDate(formData.get('fechaApertura') as string);
  const currentValue = parseNum(formData.get('currentValue') as string);
  const returnPctRaw = parseNum(formData.get('returnPct') as string);
  const returnPct = returnPctRaw != null ? (Math.abs(returnPctRaw) > 1 ? returnPctRaw / 100 : returnPctRaw) : undefined;
  const monthlyIncome = parseNum(formData.get('monthlyIncome') as string);
  const rescates = parseNum(formData.get('rescates') as string);
  const units = parseNum(formData.get('units') as string);

  if (!name) {
    return { ok: false as const, error: 'Nombre del producto es requerido' };
  }

  const cat = CATEGORIES.includes(category) ? category : 'OTROS';

  try {
    const data = {
      agf,
      name,
      category: cat,
      capitalInvested,
      fechaApertura,
      currentValue: currentValue ?? null,
      returnPct: returnPct ?? null,
      monthlyIncome: monthlyIncome ?? null,
      rescates: rescates ?? null,
      units: units ?? null,
    };
    if (id) {
      await prisma.investment.update({ where: { id }, data });
      return { ok: true as const, id };
    } else {
      const created = await prisma.investment.create({
        data: { tenantId: TENANT_ID, ...data },
      });
      return { ok: true as const, id: created.id };
    }
  } catch (e) {
    console.error('Save investment error:', e);
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

export async function deleteInvestment(id: string) {
  try {
    await prisma.investment.delete({ where: { id } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete investment error:', e);
    return { ok: false as const, error: 'Error al eliminar' };
  }
}

export async function addMovement(investmentId: string, tipo: 'INGRESO' | 'RESCATE', monto: number, fecha: string) {
  try {
    const d = parseDate(fecha);
    if (!d) {
      return { ok: false as const, error: 'Fecha inválida' };
    }
    if (monto <= 0) {
      return { ok: false as const, error: 'El monto debe ser mayor a 0' };
    }
    await prisma.investmentMovement.create({
      data: { investmentId, tipo, monto, fecha: d },
    });
    return { ok: true as const };
  } catch (e) {
    console.error('Add movement error:', e);
    return { ok: false as const, error: 'Error al registrar movimiento' };
  }
}

export async function updateMovement(
  movementId: string,
  data: { tipo?: 'INGRESO' | 'RESCATE' | 'VALOR_DIA'; monto?: number; fecha?: string }
) {
  try {
    const mov = await prisma.investmentMovement.findUnique({ where: { id: movementId } });
    if (!mov) return { ok: false as const, error: 'Movimiento no encontrado' };

    const update: { tipo?: string; monto?: number; fecha?: Date } = {};
    if (data.tipo) update.tipo = data.tipo;
    if (data.monto != null) {
      if (mov.tipo !== 'VALOR_DIA' && data.monto <= 0) {
        return { ok: false as const, error: 'El monto debe ser mayor a 0' };
      }
      update.monto = data.monto;
    }
    if (data.fecha) {
      const d = parseDate(data.fecha);
      if (!d) return { ok: false as const, error: 'Fecha inválida' };
      update.fecha = d;
    }
    if (Object.keys(update).length === 0) return { ok: true as const };

    await prisma.investmentMovement.update({ where: { id: movementId }, data: update });
    return { ok: true as const };
  } catch (e) {
    console.error('Update movement error:', e);
    return { ok: false as const, error: 'Error al actualizar movimiento' };
  }
}

export async function deleteMovement(movementId: string) {
  try {
    await prisma.investmentMovement.delete({ where: { id: movementId } });
    return { ok: true as const };
  } catch (e) {
    console.error('Delete movement error:', e);
    return { ok: false as const, error: 'Error al eliminar movimiento' };
  }
}

export async function updateInvestmentApertura(
  investmentId: string,
  capitalInvested: number,
  fechaApertura: string
) {
  try {
    const d = parseDate(fechaApertura);
    if (!d) {
      return { ok: false as const, error: 'Fecha de apertura inválida' };
    }
    if (capitalInvested < 0) {
      return { ok: false as const, error: 'El monto debe ser mayor o igual a 0' };
    }
    await prisma.investment.update({
      where: { id: investmentId },
      data: { capitalInvested, fechaApertura: d },
    });
    return { ok: true as const };
  } catch (e) {
    console.error('Update apertura error:', e);
    return { ok: false as const, error: 'Error al actualizar apertura' };
  }
}

export async function updateCurrentValue(investmentId: string, currentValue: number, fechaValor: string) {
  try {
    const d = parseDate(fechaValor);
    if (!d) {
      return { ok: false as const, error: 'Fecha inválida' };
    }
    const inv = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: { movements: { orderBy: { fecha: 'asc' } } },
    });
    if (!inv) return { ok: false as const, error: 'Inversión no encontrada' };
    let valorAnterior = Number(inv.capitalInvested);
    for (const m of inv.movements) {
      if (m.tipo === 'INGRESO') valorAnterior += Number(m.monto);
      else if (m.tipo === 'RESCATE') valorAnterior -= Number(m.monto);
      else if (m.tipo === 'VALOR_DIA') valorAnterior += Number(m.monto);
    }
    const diff = currentValue - valorAnterior;
    await prisma.$transaction([
      prisma.investment.update({
        where: { id: investmentId },
        data: { currentValue, fechaValor: d },
      }),
      prisma.investmentMovement.create({
        data: { investmentId, tipo: 'VALOR_DIA', monto: diff, fecha: d },
      }),
    ]);
    return { ok: true as const };
  } catch (e) {
    console.error('Update current value error:', e);
    return { ok: false as const, error: 'Error al actualizar valor' };
  }
}
