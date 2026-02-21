import { prisma } from '@/src/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'number' ? d : Number(d);
}

export async function getOverview(tenantId: string) {
  const [investments, liabilities, rentals, cashflowMonths, otherIncomes] = await Promise.all([
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
    prisma.otherIncome.findMany({ where: { tenantId } }),
  ]);

  // Otros ingresos: monto mensual equivalente (se suma al flujo de caja)
  const otherIncomeMonthly = otherIncomes.reduce((s, i) => {
    const amt = toNum(i.amount);
    switch (i.frequency) {
      case 'MENSUAL': return s + amt;
      case 'SEMANAL': return s + amt * 4.33;
      case 'TRIMESTRAL': return s + amt / 3;
      case 'ANUAL': return s + amt / 12;
      default: return s + amt;
    }
  }, 0);

  const totalInvestments = investments.reduce(
    (sum, i) => sum + toNum(i.currentValue ?? i.capitalInvested),
    0
  );
  const totalLiabilities = liabilities.reduce((sum, l) => sum + toNum(l.balance), 0);
  const monthlyRentIncome = rentals
    .filter((r) => (r.status ?? '').toUpperCase() === 'RENTED')
    .reduce((sum, r) => sum + toNum(r.monthlyRent), 0);

  // Rescates por mes (intereses/dividendos de inversiones → integrados al flujo como ingreso)
  const rescatesByMonth: Record<string, number> = {};
  for (const inv of investments) {
    for (const mov of inv.movements) {
      if (mov.tipo === 'RESCATE') {
        const d = new Date(mov.fecha);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        rescatesByMonth[monthStr] = (rescatesByMonth[monthStr] ?? 0) + toNum(mov.monto);
      }
    }
  }

  let monthlyIncome: number;
  let monthlyExpenses: number;
  let monthlyNetCashflow: number;

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const rescatesLastMonth = rescatesByMonth[currentMonthStr] ?? 0;

  const lastCashflow = cashflowMonths[cashflowMonths.length - 1];
  if (lastCashflow) {
    const rescatesInLast = rescatesByMonth[lastCashflow.month] ?? 0;
    monthlyIncome = toNum(lastCashflow.income) + rescatesInLast + otherIncomeMonthly;
    monthlyExpenses = toNum(lastCashflow.expenses);
    monthlyNetCashflow = monthlyIncome - monthlyExpenses;
  } else {
    monthlyIncome =
      monthlyRentIncome + investments.reduce((sum, i) => sum + toNum(i.monthlyIncome), 0) + rescatesLastMonth + otherIncomeMonthly;
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
  const rawSeries = investments.map((inv, idx) => {
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
    const sorted = points.sort((a, b) => a[0] - b[0]);
    return { name: inv.name, data: sorted, color: COLORS[idx % COLORS.length] };
  });

  // Extender series con 1 solo punto hasta la fecha más reciente para que todas las líneas sean visibles
  const maxTime = Math.max(...rawSeries.flatMap((s) => s.data.map((p) => p[0])), now.getTime());
  const investmentTrendDaily = rawSeries.map((s) => {
    const data = [...s.data];
    if (data.length === 1 && data[0][0] < maxTime) {
      data.push([maxTime, data[0][1]]);
    }
    return {
      name: s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name,
      data,
      color: s.color,
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

  // Flujo de caja: si hay CashflowMonth usamos eso; si no, estimamos desde arriendos + inversiones + otros ingresos - pasivos
  // Rescates se integran como ingreso (intereses/dividendos de inversiones)
  const baseIncome = monthlyRentIncome + investments.reduce((s, i) => s + toNum(i.monthlyIncome), 0) + otherIncomeMonthly;
  const baseExpenses = liabilities.reduce((s, l) => s + toNum(l.monthlyPayment), 0);
  const cashflowTrend =
    cashflowMonths.length > 0
      ? cashflowMonths.slice(-12).map((c) => {
          const rescates = rescatesByMonth[c.month] ?? 0;
          const income = toNum(c.income) + rescates + otherIncomeMonthly;
          return {
            month: c.month,
            income,
            expenses: toNum(c.expenses),
            net: income - toNum(c.expenses),
          };
        })
      : last12Months.map((monthStr) => {
          const rescates = rescatesByMonth[monthStr] ?? 0;
          const income = baseIncome + rescates;
          return {
            month: monthStr,
            income,
            expenses: baseExpenses,
            net: income - baseExpenses,
          };
        });

  const rentalsList = rentals.map((r) => ({
    id: r.id,
    propertyName: r.propertyName,
    monthlyRent: toNum(r.monthlyRent),
    status: r.status,
    tenantName: r.tenantName ?? '',
  }));

  const cashflowForSparkline = cashflowTrend.slice(-6).map((c) => ({
    income: c.income,
    expenses: c.expenses,
    net: c.net,
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
