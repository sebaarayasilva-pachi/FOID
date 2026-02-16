import { prisma } from '@/src/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'number' ? d : Number(d);
}

export async function getOverview(tenantId: string) {
  const [investments, liabilities, rentals, cashflowMonths] = await Promise.all([
    prisma.investment.findMany({
      where: { tenantId },
      include: { movements: { orderBy: { fecha: 'asc' } } },
    }),
    prisma.liability.findMany({ where: { tenantId } }),
    prisma.rental.findMany({ where: { tenantId } }),
    prisma.cashflowMonth.findMany({
      where: { tenantId },
      orderBy: { month: 'asc' },
    }),
  ]);

  const totalInvestments = investments.reduce(
    (sum, i) => sum + toNum(i.currentValue ?? i.capitalInvested),
    0
  );
  const totalLiabilities = liabilities.reduce((sum, l) => sum + toNum(l.balance), 0);
  const monthlyRentIncome = rentals
    .filter((r) => (r.status ?? '').toUpperCase() === 'RENTED')
    .reduce((sum, r) => sum + toNum(r.monthlyRent), 0);

  let monthlyIncome: number;
  let monthlyExpenses: number;
  let monthlyNetCashflow: number;

  const lastCashflow = cashflowMonths[cashflowMonths.length - 1];
  if (lastCashflow) {
    monthlyIncome = toNum(lastCashflow.income);
    monthlyExpenses = toNum(lastCashflow.expenses);
    monthlyNetCashflow = monthlyIncome - monthlyExpenses;
  } else {
    monthlyIncome =
      monthlyRentIncome + investments.reduce((sum, i) => sum + toNum(i.monthlyIncome), 0);
    monthlyExpenses = liabilities.reduce((sum, l) => sum + toNum(l.monthlyPayment), 0);
    monthlyNetCashflow = monthlyIncome - monthlyExpenses;
  }

  const investmentAllocation = Object.entries(
    investments.reduce<Record<string, number>>((acc, i) => {
      const cat = i.category;
      const val = toNum(i.currentValue ?? i.capitalInvested);
      acc[cat] = (acc[cat] ?? 0) + val;
      return acc;
    }, {})
  ).map(([category, value]) => ({ category, value }));

  const totalInv = investments.reduce(
    (s, i) => s + toNum(i.currentValue ?? i.capitalInvested),
    0
  );
  const investmentReturns = investments.map((i) => {
    const val = toNum(i.currentValue ?? i.capitalInvested);
    return {
      name: i.name,
      value: val,
      returnPct: toNum(i.returnPct),
      monthlyIncome: toNum(i.monthlyIncome),
      share: totalInv > 0 ? val / totalInv : 0,
    };
  });

  const liabilitiesBreakdown = liabilities.map((l) => ({
    category: l.category,
    monthlyPayment: toNum(l.monthlyPayment),
    balance: toNum(l.balance ?? 0),
  }));

  // Serie temporal: variación del saldo en función del tiempo (últimos 12 meses)
  const now = new Date();
  const last12Months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last12Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const lastMonthStr = last12Months[last12Months.length - 1];
  const invsWithValor = investments.filter((i) => i.currentValue != null && i.fechaValor != null);
  const maxFechaValor = invsWithValor.length > 0
    ? invsWithValor.reduce((max, i) => {
        const d = new Date(i.fechaValor!);
        return d > max ? d : max;
      }, new Date(0))
    : null;
  const [ly, lm] = lastMonthStr.split('-').map(Number);
  const lastMonthStart = new Date(ly, lm - 1, 1);
  const useValorDiaDate = maxFechaValor && maxFechaValor >= lastMonthStart;

  // Saldo diario por inversión: una serie de [timestamp, balance] por cada inversión
  const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#2dd4bf'];
  const investmentTrendDaily: { name: string; data: [number, number][]; color: string }[] = investments.map((inv, idx) => {
    const points: [number, number][] = [];
    const apertura = inv.fechaApertura ? new Date(inv.fechaApertura) : new Date(inv.createdAt);
    let balance = toNum(inv.capitalInvested);
    points.push([apertura.getTime(), balance]);
    for (const mov of inv.movements) {
      const movDate = new Date(mov.fecha);
      if (mov.tipo === 'INGRESO') balance += toNum(mov.monto);
      else if (mov.tipo === 'RESCATE') balance -= toNum(mov.monto);
      else if (mov.tipo === 'VALOR_DIA') balance += toNum(mov.monto);
      balance = Math.max(0, balance);
      points.push([movDate.getTime(), balance]);
    }
    if (inv.currentValue != null && inv.fechaValor != null) {
      const fv = new Date(inv.fechaValor);
      const lastPoint = points[points.length - 1];
      if (lastPoint && fv.getTime() > lastPoint[0]) {
        points.push([fv.getTime(), toNum(inv.currentValue)]);
      } else if (points.length > 0) {
        points[points.length - 1] = [points[points.length - 1][0], toNum(inv.currentValue)];
      }
    }
    return {
      name: inv.name.length > 14 ? inv.name.slice(0, 12) + '…' : inv.name,
      data: points.sort((a, b) => a[0] - b[0]),
      color: COLORS[idx % COLORS.length],
    };
  });

  const investmentTrend = last12Months.map((monthStr, idx) => {
    const [y, m] = monthStr.split('-').map(Number);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);
    const isLastMonth = monthStr === lastMonthStr;
    const row: Record<string, string | number> = {
      month: isLastMonth && useValorDiaDate && maxFechaValor
        ? `${maxFechaValor.getFullYear()}-${String(maxFechaValor.getMonth() + 1).padStart(2, '0')}-${String(maxFechaValor.getDate()).padStart(2, '0')}`
        : monthStr,
    };
    let saldoTotal = 0;
    for (const inv of investments) {
      let val = toNum(inv.capitalInvested);
      const apertura = inv.fechaApertura ? new Date(inv.fechaApertura) : new Date(inv.createdAt);
      if (apertura > endOfMonth) {
        row[inv.name] = 0;
        continue;
      }
      for (const mov of inv.movements) {
        const movDate = new Date(mov.fecha);
        if (movDate <= endOfMonth) {
          if (mov.tipo === 'INGRESO') val += toNum(mov.monto);
          else if (mov.tipo === 'RESCATE') val -= toNum(mov.monto);
          else if (mov.tipo === 'VALOR_DIA') val += toNum(mov.monto);
        }
      }
      if (isLastMonth && inv.currentValue != null) {
        val = toNum(inv.currentValue);
      }
      const saldo = Math.max(0, val);
      row[inv.name] = saldo;
      saldoTotal += saldo;
    }
    row['Saldo total'] = saldoTotal;
    return row;
  });

  const cashflowTrend = cashflowMonths.slice(-12).map((c) => ({
    month: c.month,
    income: toNum(c.income),
    expenses: toNum(c.expenses),
    net: toNum(c.income) - toNum(c.expenses),
  }));

  const rentalsList = rentals.map((r) => ({
    id: r.id,
    propertyName: r.propertyName,
    monthlyRent: toNum(r.monthlyRent),
    status: r.status,
    tenantName: r.tenantName ?? '',
  }));

  const cashflowForSparkline = cashflowMonths.slice(-6).map((c) => ({
    income: toNum(c.income),
    expenses: toNum(c.expenses),
    net: toNum(c.income) - toNum(c.expenses),
  }));
  const prevNet = cashflowForSparkline.length >= 2 ? cashflowForSparkline[cashflowForSparkline.length - 2].net : 0;
  const currNet = monthlyNetCashflow;
  const netTrendPct = prevNet !== 0 ? ((currNet - prevNet) / Math.abs(prevNet)) * 100 : 0;

  return {
    kpis: {
      totalInvestments,
      totalLiabilities,
      monthlyRentIncome,
      monthlyIncome,
      monthlyExpenses,
      monthlyNetCashflow,
      netTrendPct,
    },
    sparklineData: {
      net: cashflowForSparkline.map((c) => c.net),
      income: cashflowForSparkline.map((c) => c.income),
    },
    charts: {
      investmentAllocation,
      investmentReturns,
      investmentTrend,
      investmentTrendDaily,
      liabilitiesBreakdown,
      cashflowTrend,
      rentals: rentalsList,
    },
  };
}
