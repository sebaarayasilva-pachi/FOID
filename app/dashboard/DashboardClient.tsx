'use client';

import Link from 'next/link';
import Highcharts from 'highcharts/highstock';
import { DashboardSidebar, NavIcon } from './DashboardSidebar';
import { EconomicTicker } from './EconomicTicker';
import HighchartsReact from 'highcharts-react-official';

const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#2dd4bf'];
const CHART_HEIGHT = 220;
const INVESTMENT_CHART_HEIGHT = 340;

const DARK_THEME = {
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
  title: { style: { color: '#94a3b8' } },
  subtitle: { style: { color: '#64748b' } },
  xAxis: {
    gridLineColor: '#334155',
    labels: { style: { color: '#94a3b8', fontSize: '10px', textOutline: 'none' } },
    lineColor: '#475569',
    tickColor: '#475569',
  },
  yAxis: {
    gridLineColor: '#334155',
    labels: { style: { color: '#94a3b8', fontSize: '11px' } },
    lineColor: '#475569',
    tickColor: '#475569',
    title: { style: { color: '#94a3b8' } },
  },
  legend: {
    itemStyle: { color: '#94a3b8', fontSize: '10px' },
    itemHoverStyle: { color: '#e2e8f0' },
  },
  tooltip: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    style: { color: '#e2e8f0', fontSize: '12px' },
  },
  plotOptions: {
    series: { dataLabels: { style: { color: '#94a3b8' } } },
  },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCurrencyShort(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return formatCurrency(n);
}

function formatMonth(month: string) {
  if (!month || !month.includes('-')) return month;
  const [, m] = month.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mi = parseInt(m, 10) - 1;
  return months[mi >= 0 && mi < 12 ? mi : 0];
}

function formatPct(n: number) {
  const pct = (n * 100).toFixed(1);
  return n >= 0 ? `+${pct}%` : `${pct}%`;
}

type OverviewData = {
  kpis: {
    totalInvestments: number;
    totalLiabilities: number;
    latestBankBalance: number;
    totalAssets: number;
    netWorth: number;
    monthlyRentIncome: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyNetCashflow: number;
    netTrendPct?: number;
  };
  sparklineData?: {
    net: number[];
    income: number[];
  };
  charts: {
    investmentAllocation: { category: string; value: number }[];
    investmentReturns: {
      name: string;
      value: number;
      returnPct: number;
      monthlyIncome: number;
      share?: number;
    }[];
    investmentTrend?: Record<string, string | number>[];
    investmentTrendDaily?: { name: string; data: [number, number][]; color: string }[];
    bankTrendDaily?: { name: string; data: [number, number][]; color: string }[];
    assetsBreakdown: { category: string; value: number }[];
    liabilitiesBreakdown: { category: string; monthlyPayment: number; balance: number }[];
    cashflowTrend: { month: string; income: number; expenses: number; net: number }[];
    rentals: { id: string; propertyName: string; monthlyRent: number; status: string }[];
  };
};

function Sparkline({ data, positive }: { data: number[]; positive?: boolean }) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 18;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${Math.max(0, Math.min(h, y))}`;
    })
    .join(' ');
  const color = positive !== false ? '#22c55e' : '#f43f5e';
  return (
    <svg width={w} height={h} className="mt-1">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function DashboardClient({ data }: { data: OverviewData }) {
  const { kpis, charts, sparklineData } = data;
  const totalInv = charts.investmentReturns.reduce((s, i) => s + (i.value ?? 0), 0);

  const trendData = charts.investmentTrend && charts.investmentTrend.length > 0
    ? charts.investmentTrend
    : charts.investmentReturns.length > 0
      ? [{ month: 'Actual', ...Object.fromEntries(charts.investmentReturns.map((i) => [i.name, i.value])), 'Saldo total': charts.investmentReturns.reduce((s, i) => s + i.value, 0) }]
      : [];

  const useDailyChart = (charts.investmentTrendDaily?.some((s) => s.data.length > 0) ?? false) || (charts.bankTrendDaily?.some((s) => s.data.length > 0) ?? false);

  const monthToTimestamp = (monthStr: string | number): number => {
    if (typeof monthStr !== 'string' || !monthStr.includes('-')) return Date.now();
    const parts = monthStr.split('-').map(Number);
    const [y, m, d] = parts;
    if (parts.length >= 3 && d) {
      return new Date(y, m - 1, d).getTime();
    }
    return new Date(y, m - 1, 1).getTime();
  };

  const hexToRgba = (hex: string, a: number) => {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
  };

  const allDailySeries = [
    ...(charts.investmentTrendDaily ?? []),
    ...(charts.bankTrendDaily ?? []),
  ];
  const investmentSeries: Highcharts.SeriesOptionsType[] = useDailyChart && allDailySeries.length > 0
    ? allDailySeries.map((s) => ({
        type: 'area' as const,
        name: s.name,
        data: s.data,
        color: s.color,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, hexToRgba(s.color, 0.35)], [1, hexToRgba(s.color, 0.05)]] as [number, string][],
        },
        fillOpacity: 0.35,
        lineWidth: 2.5,
        marker: { radius: 3, symbol: 'circle' },
        showInNavigator: true,
      }))
    : [
        ...(trendData.some((d) => d['Saldo total'] != null)
          ? [{
              type: 'area' as const,
              name: 'Saldo total',
              data: trendData.map((d) => [monthToTimestamp(String(d.month ?? '')), Number(d['Saldo total'] ?? 0)]),
              color: '#38bdf8',
              fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(56,189,248,0.5)'], [1, 'rgba(56,189,248,0)']] as [number, string][] },
              fillOpacity: 0.4,
              lineWidth: 3,
              marker: { radius: 4, symbol: 'circle' },
              shadow: { color: 'rgba(56,189,248,0.3)', width: 8, offsetY: 2 },
            }]
          : []),
        ...charts.investmentReturns.map((inv, i) => {
          const c = COLORS[(i + 1) % COLORS.length];
          return {
            type: 'area' as const,
            name: inv.name.length > 14 ? inv.name.slice(0, 12) + '…' : inv.name,
            data: trendData.map((d) => [monthToTimestamp(String(d.month ?? '')), Number(d[inv.name] ?? 0)]),
            color: c,
            fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, hexToRgba(c, 0.35)], [1, hexToRgba(c, 0)]] as [number, string][] },
            fillOpacity: 0.3,
            lineWidth: 2.5,
            marker: { radius: 3, symbol: 'circle' },
          };
        }),
      ];

  const investmentChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: {
      ...DARK_THEME.chart,
      height: INVESTMENT_CHART_HEIGHT,
      spacing: [0, 6, 6, 6],
      style: { fontFamily: 'system-ui, -apple-system, sans-serif' },
    },
    title: { text: undefined },
    credits: { enabled: false },
    rangeSelector: {
      selected: 4,
      buttons: [
        { type: 'month', count: 3, text: '3m' },
        { type: 'month', count: 6, text: '6m' },
        { type: 'ytd', text: 'YTD' },
        { type: 'year', count: 1, text: '1y' },
        { type: 'all', text: 'Todo' },
      ],
      inputEnabled: false,
      buttonSpacing: 2,
      buttonTheme: {
        fill: 'rgba(51,65,85,0.8)',
        stroke: '#475569',
        style: { color: '#94a3b8', fontSize: '10px' },
        r: 3,
        states: {
          select: { fill: '#38bdf8', stroke: '#0ea5e9', style: { color: '#0f172a' } },
          hover: { fill: '#475569', style: { color: '#e2e8f0' } },
        },
      },
    },
    navigator: {
      enabled: true,
      height: 18,
      margin: 2,
      outlineWidth: 0,
      maskFill: 'rgba(56,189,248,0.15)',
      series: { type: 'line', lineWidth: 2, color: '#38bdf8' },
      xAxis: { gridLineColor: '#334155', labels: { style: { color: '#64748b', fontSize: '10px', textOutline: 'none' } } },
    },
    scrollbar: {
      enabled: true,
      barBackgroundColor: '#334155',
      barBorderRadius: 3,
      buttonArrowColor: '#94a3b8',
      buttonBackgroundColor: '#334155',
      trackBackgroundColor: '#1e293b',
      trackBorderRadius: 3,
      height: 8,
    },
    xAxis: {
      ...DARK_THEME.xAxis,
      type: 'datetime',
      lineWidth: 1,
      tickWidth: 0,
      crosshair: { width: 1, color: '#64748b', dashStyle: 'ShortDot' },
    },
    yAxis: {
      ...DARK_THEME.yAxis,
      title: { text: undefined },
      gridLineColor: 'rgba(51,65,85,0.6)',
      labels: {
        style: { fontSize: '11px', fontWeight: '500' },
        formatter: useDailyChart
          ? function () { return formatCurrencyShort(Number(this.value)); }
          : function () { return (Number(this.value) >= 0 ? '+' : '') + this.value + '%'; },
      },
      plotLines: useDailyChart ? undefined : [{ value: 0, width: 1.5, color: '#475569', dashStyle: 'Dot' }],
    },
    tooltip: {
      ...DARK_THEME.tooltip,
      backgroundColor: 'rgba(30,41,59,0.98)',
      borderWidth: 0,
      borderRadius: 8,
      padding: 12,
      shadow: { color: 'rgba(0,0,0,0.4)', width: 8, offsetY: 4 },
      ...(useDailyChart
        ? {
            formatter: function () {
              const t = this as unknown as { points?: { color?: string; series: { name: string }; y?: number }[]; point?: { color?: string; series: { name: string }; y?: number } };
              const pts = t.points ?? (t.point ? [t.point] : []);
              return pts.map((p) => `<span style="color:${p.color ?? '#94a3b8'};font-weight:600">${p.series.name}</span>: <b>${formatCurrency(Number(p.y ?? 0))}</b>`).join('<br/>');
            },
            split: true,
          }
        : {
            pointFormat: '<span style="color:{series.color};font-weight:600">{series.name}</span>: <b>{point.y}%</b> ({point.change}%)<br/>',
            valueDecimals: 2,
            split: true,
          }),
    },
    legend: {
      ...DARK_THEME.legend,
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: { fontSize: '10px', fontWeight: '500' },
      itemDistance: 12,
      symbolRadius: 0,
      symbolHeight: 8,
      symbolWidth: 12,
      margin: 6,
    },
    plotOptions: {
      series: {
        ...(useDailyChart ? {} : { compare: 'percent' }),
        showInNavigator: true,
        marker: { radius: 4, lineWidth: 2, lineColor: '#0f172a' },
        lineWidth: 3.5,
        states: { hover: { lineWidthPlus: 1 } },
      },
      area: {
        fillOpacity: 0.3,
      },
    },
    series: investmentSeries,
  };

  const cashflowChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: CHART_HEIGHT, type: 'area' },
    title: { text: undefined },
    xAxis: {
      ...DARK_THEME.xAxis,
      categories: charts.cashflowTrend.map((c) => formatMonth(c.month)),
    },
    yAxis: {
      ...DARK_THEME.yAxis,
      title: { text: undefined },
      labels: { formatter: function () { return formatCurrencyShort(Number(this.value)); } },
    },
    tooltip: {
      ...DARK_THEME.tooltip,
      shared: true,
      formatter: function () {
        const idx = (this as { point?: { index?: number } }).point?.index ?? (this as { x?: number }).x ?? 0;
        const d = charts.cashflowTrend[idx];
        return `<b>${formatMonth(d?.month ?? '')}</b><br/>Ingresos: ${formatCurrency(d?.income ?? 0)}<br/>Egresos: ${formatCurrency(d?.expenses ?? 0)}<br/>Neto: ${formatCurrency(d?.net ?? 0)}`;
      },
    },
    legend: { enabled: false },
    plotOptions: {
      area: {
        fillOpacity: 0.4,
        marker: { radius: 4 },
        lineWidth: 2,
      },
    },
    series: [
      {
        type: 'area',
        name: 'Ingresos',
        data: charts.cashflowTrend.map((c) => c.income),
        color: '#22c55e',
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(34,197,94,0.5)'], [1, 'rgba(34,197,94,0)']] },
      },
      {
        type: 'area',
        name: 'Egresos',
        data: charts.cashflowTrend.map((c) => c.expenses),
        color: '#f43f5e',
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(244,63,94,0.5)'], [1, 'rgba(244,63,94,0)']] },
      },
      {
        type: 'area',
        name: 'Neto',
        data: charts.cashflowTrend.map((c) => c.net),
        color: '#14b8a6',
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(20,184,166,0.5)'], [1, 'rgba(20,184,166,0)']] },
        lineWidth: 2.5,
      },
    ],
  };

  const PIE_CHART_HEIGHT = 180;
  const pieChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: PIE_CHART_HEIGHT, type: 'pie' },
    title: { text: undefined },
    tooltip: {
      ...DARK_THEME.tooltip,
      pointFormatter: function () { return `<span style="color:${this.color}">●</span> ${this.name}: <b>${formatCurrency(Number(this.y))}</b>`; },
    },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        innerSize: '60%',
        dataLabels: { enabled: false },
        colors: COLORS,
      },
    },
    series: [{
      type: 'pie',
      name: 'Deuda',
      data: charts.liabilitiesBreakdown.map((l, i) => ({ name: l.category, y: l.balance, color: COLORS[i % COLORS.length] })),
    }],
  };

  const assetsPieChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: PIE_CHART_HEIGHT, type: 'pie' },
    title: { text: undefined },
    tooltip: {
      ...DARK_THEME.tooltip,
      pointFormatter: function () { return `<span style="color:${this.color}">●</span> ${this.name}: <b>${formatCurrency(Number(this.y))}</b>`; },
    },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        innerSize: '60%',
        dataLabels: { enabled: false },
        colors: COLORS,
      },
    },
    series: [{
      type: 'pie',
      name: 'Activos',
      data: charts.assetsBreakdown.map((a, i) => ({ name: a.category, y: a.value, color: COLORS[i % COLORS.length] })),
    }],
  };

  const patrimonioBarOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: CHART_HEIGHT, type: 'bar' },
    title: { text: undefined },
    xAxis: {
      ...DARK_THEME.xAxis,
      categories: ['Activos', 'Pasivos', 'Patrimonio'],
    },
    yAxis: {
      ...DARK_THEME.yAxis,
      title: { text: undefined },
      labels: { formatter: function () { return formatCurrencyShort(Number(this.value)); } },
    },
    tooltip: {
      ...DARK_THEME.tooltip,
      pointFormatter: function () { return `<span style="color:${this.color}">●</span> ${this.x}: <b>${formatCurrency(Number(this.y ?? 0))}</b>`; },
    },
    legend: { enabled: false },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          formatter: function () { return formatCurrencyShort(Number(this.y ?? 0)); },
          style: { color: '#e2e8f0', fontSize: '10px', textOutline: 'none' },
        },
      },
    },
    series: [{
      type: 'bar',
      name: 'Monto',
      data: [
        { y: kpis.totalAssets, color: '#22c55e' },
        { y: kpis.totalLiabilities, color: '#f43f5e' },
        { y: kpis.netWorth, color: kpis.netWorth >= 0 ? '#14b8a6' : '#f43f5e' },
      ],
    }],
  };

  const areaChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: CHART_HEIGHT, type: 'area' },
    title: { text: undefined },
    xAxis: {
      ...DARK_THEME.xAxis,
      categories: charts.cashflowTrend.length > 0
        ? charts.cashflowTrend.map((c) => formatMonth(c.month))
        : charts.rentals.map((r) => r.propertyName.slice(0, 8)),
    },
    yAxis: {
      ...DARK_THEME.yAxis,
      title: { text: undefined },
      labels: { formatter: function () { return formatCurrencyShort(Number(this.value)); } },
    },
    tooltip: {
      ...DARK_THEME.tooltip,
      formatter: function () {
        const val = this.y;
        const label = this.x;
        return `<b>${label}</b><br/>Ingresos: ${formatCurrency(Number(val ?? 0))}`;
      },
    },
    legend: { enabled: false },
    plotOptions: {
      area: {
        fillOpacity: 0.4,
        marker: { radius: 4 },
        lineWidth: 2,
      },
    },
    series: [{
      type: 'area',
      name: 'Ingresos',
      data: charts.cashflowTrend.length > 0
        ? charts.cashflowTrend.map((c) => c.income)
        : charts.rentals.map((r) => r.monthlyRent),
      color: '#14b8a6',
      fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(20,184,166,0.5)'], [1, 'rgba(20,184,166,0)']] },
    }],
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <DashboardSidebar currentItemId="overview" />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 shrink-0">
          <h1 className="text-sm font-semibold text-slate-100 truncate">FOID — Family Office Invest Dashboard</h1>
          <span className="text-xs text-slate-500 shrink-0">Última actualización: Hoy</span>
        </header>

        <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-y-auto overflow-x-hidden">
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            <KpiCard
              title="Total Inversiones"
              value={formatCurrencyShort(kpis.totalInvestments)}
              fullValue={formatCurrency(kpis.totalInvestments)}
              trend={charts.investmentReturns.length ? (charts.investmentReturns[0]?.returnPct ?? 0) * 100 : undefined}
              sparkline={sparklineData?.income}
              positive
            />
            <KpiCard
              title="Saldo Banco"
              value={formatCurrencyShort(kpis.latestBankBalance)}
              fullValue={formatCurrency(kpis.latestBankBalance)}
              positive
            />
            <KpiCard
              title="Total Pasivos"
              value={formatCurrencyShort(kpis.totalLiabilities)}
              fullValue={formatCurrency(kpis.totalLiabilities)}
              positive={false}
            />
            <KpiCard
              title="Ingreso Arriendos"
              value={`${formatCurrencyShort(kpis.monthlyRentIncome)} / mes`}
              fullValue={formatCurrency(kpis.monthlyRentIncome)}
              sparkline={sparklineData?.income}
              positive
              icon="building"
            />
            <KpiCard
              title="Flujo Neto"
              value={`${kpis.monthlyNetCashflow >= 0 ? '+' : ''}${formatCurrencyShort(kpis.monthlyNetCashflow)} / mes`}
              fullValue={formatCurrency(kpis.monthlyNetCashflow)}
              trend={kpis.netTrendPct}
              sparkline={sparklineData?.net}
              highlight={kpis.monthlyNetCashflow >= 0}
            />
          </section>

          <section className="flex-1 min-h-0 grid gap-3 overflow-hidden" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"activos flujo" "pasivos patrimonio"' }}>
            <ChartCard title="Activos" compact href="/dashboard/inversiones" style={{ gridArea: 'activos' }}>
              {charts.assetsBreakdown.length > 0 ? (
                <div className="flex flex-col min-h-0 gap-2">
                  <div className="shrink-0">
                    <HighchartsReact highcharts={Highcharts} options={assetsPieChartOptions} containerProps={{ style: { height: PIE_CHART_HEIGHT } }} />
                  </div>
                  <div className="shrink-0 pt-2 border-t border-slate-800 space-y-1.5">
                    {charts.assetsBreakdown.map((a, i) => (
                      <div key={a.category} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-300">{a.category}</span>
                            <span className="text-slate-100 font-medium">{formatCurrencyShort(a.value)}</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (a.value / (kpis.totalAssets || 1)) * 100)}%`,
                                backgroundColor: '#22c55e',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-800">Total activos {formatCurrencyShort(kpis.totalAssets)}</p>
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Flujo de Caja" compact href="/dashboard/ingresos" style={{ gridArea: 'flujo' }}>
              {charts.cashflowTrend.length > 0 ? (
                <div className="space-y-1 min-h-0 flex flex-col">
                  <HighchartsReact highcharts={Highcharts} options={cashflowChartOptions} containerProps={{ style: { height: CHART_HEIGHT } }} />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1 border-t border-slate-800 shrink-0">
                    {charts.liabilitiesBreakdown.slice(0, 4).map((l) => (
                      <div key={l.category} className="flex justify-between text-xs">
                        <span className="text-slate-400">{l.category}</span>
                        <span className="text-slate-200">{formatCurrencyShort(l.balance)} · Pago {formatCurrencyShort(l.monthlyPayment)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Pasivos" compact href="/dashboard/obligaciones" style={{ gridArea: 'pasivos' }}>
              {charts.liabilitiesBreakdown.length > 0 ? (
                <div className="flex flex-col min-h-0 gap-2">
                  <div className="shrink-0">
                    <HighchartsReact highcharts={Highcharts} options={pieChartOptions} containerProps={{ style: { height: PIE_CHART_HEIGHT } }} />
                  </div>
                  <div className="shrink-0 pt-2 border-t border-slate-800 space-y-1.5">
                    {charts.liabilitiesBreakdown.map((l, i) => (
                      <div key={l.category} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-300">{l.category}</span>
                            <span className="text-slate-100 font-medium">{formatCurrencyShort(l.balance)}</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (l.balance / (kpis.totalLiabilities || 1)) * 100)}%`,
                                backgroundColor: '#f43f5e',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-800">Pasivos {formatCurrencyShort(kpis.totalLiabilities)}</p>
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Patrimonio" compact href="/dashboard" style={{ gridArea: 'patrimonio' }}>
              {(kpis.totalAssets > 0 || kpis.totalLiabilities > 0) ? (
                <div className="space-y-1 min-h-0 flex flex-col">
                  <HighchartsReact highcharts={Highcharts} options={patrimonioBarOptions} containerProps={{ style: { height: CHART_HEIGHT } }} />
                  <div className="pt-2 border-t border-slate-800 shrink-0">
                    <p className="text-slate-500 text-xs">
                      Patrimonio = Activos − Pasivos = <span className={kpis.netWorth >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{formatCurrency(kpis.netWorth)}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </section>
        </div>
        <EconomicTicker />
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  fullValue,
  trend,
  sparkline,
  positive,
  highlight,
  icon,
}: {
  title: string;
  value: string;
  fullValue?: string;
  trend?: number;
  sparkline?: number[];
  positive?: boolean;
  highlight?: boolean;
  icon?: string;
}) {
  const isPositive = highlight ?? positive ?? true;
  const color = isPositive ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
          <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
          {trend !== undefined && !isNaN(trend) && (
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>
        {icon === 'building' && (
          <div className="text-slate-600">
            <NavIcon icon="building" />
          </div>
        )}
      </div>
      {sparkline && sparkline.length > 0 && <Sparkline data={sparkline} positive={isPositive} />}
    </div>
  );
}

function ChartCard({ title, children, compact, href, style }: { title: string; children: React.ReactNode; compact?: boolean; href?: string; style?: React.CSSProperties }) {
  const card = (
    <div className={`bg-slate-900/60 rounded-lg border border-slate-800/80 shadow flex flex-col min-h-0 overflow-hidden transition-colors ${href ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-900/80' : ''} ${compact ? 'p-3' : 'p-6'}`}>
      <h3 className={`font-semibold text-slate-200 shrink-0 ${compact ? 'text-xs mb-2' : 'text-sm mb-5'}`}>{title}</h3>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
  if (href) return <Link href={href} className="block min-h-0" style={style}>{card}</Link>;
  return <div className="min-h-0" style={style}>{card}</div>;
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1" style={{ height: CHART_HEIGHT }}>
      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Sin datos para mostrar
    </div>
  );
}
