import { prisma } from '@/src/lib/prisma';
import { parseCsv } from '@/src/lib/csv';

const INVESTMENT_CATEGORIES = [
  'FFMM',
  'ACCIONES',
  'RENTA_FIJA',
  'INMOBILIARIO',
  'OTROS',
];
const LIABILITY_CATEGORIES = [
  'SUELDOS',
  'TENEDOR',
  'SANTANDER',
  'HIPOTECARIO',
  'TARJETA_CREDITO',
  'CREDITO_CONSUMO',
  'OTRO',
];
const RENTAL_STATUSES = ['RENTED', 'VACANT'];

function parseDecimal(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function parseInvestmentCategory(val: string): string {
  const u = (val ?? '').toUpperCase().trim();
  return INVESTMENT_CATEGORIES.includes(u) ? u : 'OTROS';
}

function parseLiabilityCategory(val: string): string {
  const u = (val ?? '').toUpperCase().trim();
  return LIABILITY_CATEGORIES.includes(u) ? u : 'OTRO';
}

function parseRentalStatus(val: string): string {
  const u = (val ?? '').toUpperCase().trim();
  return RENTAL_STATUSES.includes(u) ? u : 'VACANT';
}

export interface ImportPayload {
  tenantId: string;
  investmentsCsv?: string;
  liabilitiesCsv?: string;
  cashflowCsv?: string;
  rentalsCsv?: string;
}

export async function importData(payload: ImportPayload) {
  const { tenantId } = payload;

  if (payload.investmentsCsv) {
    const rows = parseCsv<Record<string, string>>(
      payload.investmentsCsv,
      ['capitalInvested', 'currentValue', 'returnPct', 'monthlyIncome'],
      ['returnPct']
    );
    for (const r of rows) {
      const name = (r.name ?? '').trim();
      if (!name) continue;
      const existing = await prisma.investment.findFirst({
        where: { tenantId, name },
      });
      const fechaApertura = r.fechaApertura ? new Date(r.fechaApertura) : undefined;
      const data = {
        name,
        agf: (r.agf ?? '').trim() || undefined,
        category: parseInvestmentCategory(r.category ?? ''),
        capitalInvested: parseDecimal(r.capitalInvested),
        fechaApertura: isNaN(fechaApertura?.getTime() ?? NaN) ? undefined : fechaApertura,
        currentValue: parseDecimal(r.currentValue) || undefined,
        returnPct: parseDecimal(r.returnPct) || undefined,
        monthlyIncome: parseDecimal(r.monthlyIncome) || undefined,
        rescates: parseDecimal(r.rescates) || undefined,
        units: parseDecimal(r.units) || undefined,
      };
      if (existing) {
        await prisma.investment.update({ where: { id: existing.id }, data });
      } else {
        await prisma.investment.create({ data: { ...data, tenantId } });
      }
    }
  }

  if (payload.liabilitiesCsv) {
    const rows = parseCsv<Record<string, string>>(
      payload.liabilitiesCsv,
      ['balance', 'monthlyPayment', 'interestRate'],
      ['interestRate']
    );
    for (const r of rows) {
      const name = (r.name ?? '').trim();
      if (!name) continue;
      const existing = await prisma.liability.findFirst({
        where: { tenantId, name },
      });
      const data = {
        name,
        category: parseLiabilityCategory(r.category ?? ''),
        balance: parseDecimal(r.balance) || undefined,
        monthlyPayment: parseDecimal(r.monthlyPayment),
        interestRate: parseDecimal(r.interestRate) || undefined,
      };
      if (existing) {
        await prisma.liability.update({ where: { id: existing.id }, data });
      } else {
        await prisma.liability.create({ data: { ...data, tenantId } });
      }
    }
  }

  if (payload.cashflowCsv) {
    const rows = parseCsv<Record<string, string>>(
      payload.cashflowCsv,
      ['income', 'expenses']
    );
    for (const r of rows) {
      const month = (r.month ?? '').trim();
      if (!month) continue;
      await prisma.cashflowMonth.upsert({
        where: {
          tenantId_month: { tenantId, month },
        },
        create: {
          tenantId,
          month,
          income: parseDecimal(r.income),
          expenses: parseDecimal(r.expenses),
        },
        update: {
          income: parseDecimal(r.income),
          expenses: parseDecimal(r.expenses),
        },
      });
    }
  }

  if (payload.rentalsCsv) {
    const rows = parseCsv<Record<string, string>>(
      payload.rentalsCsv,
      ['monthlyRent']
    );
    for (const r of rows) {
      const propertyName = (r.propertyName ?? '').trim();
      if (!propertyName) continue;
      const existing = await prisma.rental.findFirst({
        where: { tenantId, propertyName },
      });
      const data = {
        propertyName,
        monthlyRent: parseDecimal(r.monthlyRent),
        status: parseRentalStatus(r.status ?? ''),
        tenantName: (r.tenantName ?? r.arrendatario ?? '').trim() || undefined,
      };
      if (existing) {
        await prisma.rental.update({ where: { id: existing.id }, data });
      } else {
        await prisma.rental.create({ data: { ...data, tenantId } });
      }
    }
  }

  return { ok: true };
}
