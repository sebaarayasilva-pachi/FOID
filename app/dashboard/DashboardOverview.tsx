'use client';

import Link from 'next/link';
import Highcharts from 'highcharts/highstock';
import { DashboardSidebar } from './DashboardSidebar';
import { EconomicTicker } from './EconomicTicker';
import HighchartsReact from 'highcharts-react-official';

const CHART_HEIGHT = 120;
const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#2dd4bf'];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatCurrencyShort(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return formatCurrency(n);
}

function EmptyChart() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-slate-500 text-xs gap-1 min-h-[120px]">
      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Sin datos para mostrar
    </div>
  );
}

function ChartCard({ title, children, compact, href, className }: { title: string; children: React.ReactNode; compact?: boolean; href?: string; className?: string }) {
  const card = (
    <div className={`bg-slate-900/60 rounded-lg border border-slate-800/80 shadow flex flex-col min-h-0 overflow-hidden h-full ${href ? 'cursor-pointer hover:border-slate-600' : ''} ${compact ? 'p-2' : 'p-6'}`}>
      <h3 className={`font-semibold text-slate-200 shrink-0 ${compact ? 'text-xs mb-1' : 'text-sm mb-5'}`}>{title}</h3>
      <div className="flex-1 min-h-0 overflow-hidden relative">{children}</div>
    </div>
  );
  const wrap = `block min-h-0 overflow-hidden h-full ${className ?? ''}`.trim();
  if (href) return <Link href={href} className={wrap}>{card}</Link>;
  return <div className={wrap}>{card}</div>;
}

type DashboardOverviewProps = {
  kpis: { latestBankBalance: number; monthlyIncome: number; monthlyExpenses: number; monthlyNetCashflow: number; netTrendPct?: number; totalAssets: number; totalLiabilities: number; netWorth: number };
  charts: { assetsBreakdown: { category: string; value: number }[]; liabilitiesBreakdown: { category: string; balance: number; monthlyPayment: number }[]; cashflowTrend: { month: string; income: number; expenses: number; net: number }[] };
  sparklineData?: { income?: number[]; net?: number[] };
  assetsPieChartOptions: Highcharts.Options;
  pieChartOptions: Highcharts.Options;
  cashflowChartOptions: Highcharts.Options;
  patrimonioBarOptions: Highcharts.Options;
};

export function DashboardOverview(props: DashboardOverviewProps) {
  const { kpis, charts, sparklineData, assetsPieChartOptions, pieChartOptions, cashflowChartOptions, patrimonioBarOptions } = props;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <DashboardSidebar currentItemId="overview" />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-1.5 bg-slate-950/95 border-b border-slate-800/80 shrink-0">
          <h1 className="text-sm font-semibold text-slate-100 truncate">FOID — Family Office Invest Dashboard</h1>
          <span className="text-xs text-slate-500 shrink-0">Última actualización: Hoy</span>
        </header>
        <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-3 pt-1.5 shrink-0">
            <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase mb-0.5">Saldo Banco</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrencyShort(kpis.latestBankBalance)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase mb-0.5">Ingresos</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrencyShort(kpis.monthlyIncome)} / mes</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase mb-0.5">Egresos</p>
              <p className="text-lg font-bold text-rose-400">{formatCurrencyShort(kpis.monthlyExpenses)} / mes</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase mb-0.5">Flujo Neto</p>
              <p className="text-lg font-bold text-emerald-400">+{formatCurrencyShort(kpis.monthlyNetCashflow)} / mes</p>
            </div>
          </section>
          <section className="grid gap-2 flex-1 min-h-0 px-3 pb-1.5" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', minHeight: 0 }}>
            <div className="min-w-0 min-h-0 overflow-hidden relative h-full" style={{ gridColumn: 1, gridRow: 1 }}>
              <ChartCard title="Activos" compact href="/dashboard/inversiones">
              {charts.assetsBreakdown.length > 0 ? (
                <div className="absolute inset-0 flex flex-col min-w-0">
                  <div className="shrink-0 w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
                    <HighchartsReact highcharts={Highcharts} options={assetsPieChartOptions} containerProps={{ style: { height: CHART_HEIGHT, width: '100%', overflow: 'hidden' } }} />
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-1.5 border-t border-slate-800 min-w-0">
                    {charts.assetsBreakdown.map((a, i) => {
                      const val = Number(a.value);
                      const pct = kpis.totalAssets > 0 ? (val / kpis.totalAssets) * 100 : 0;
                      const color = COLORS[i % COLORS.length];
                      const barWidth = Math.max(pct, pct > 0 ? 2 : 0);
                      return (
                        <div key={`${a.category}-${i}`} className="flex items-center gap-2 text-xs py-1 min-w-0">
                          <span className="truncate shrink-0 max-w-[35%]">{a.category}</span>
                          <div className="flex-1 min-w-[80px] h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                          </div>
                          <span className="shrink-0 tabular-nums text-right">{formatCurrencyShort(val)}</span>
                        </div>
                      );
                    })}
                    <p className="text-slate-500 text-xs pt-1">Total {formatCurrencyShort(kpis.totalAssets)}</p>
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            </div>
            <div className="min-w-0 min-h-0 overflow-hidden relative h-full" style={{ gridColumn: 2, gridRow: 1 }}>
              <ChartCard title="Flujo de Caja" compact href="/dashboard/ingresos">
              {charts.cashflowTrend.length > 0 ? (
                <div className="absolute inset-0 flex flex-col min-w-0">
                  <div className="shrink-0 w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
                    <HighchartsReact highcharts={Highcharts} options={cashflowChartOptions} containerProps={{ style: { height: CHART_HEIGHT, width: '100%', overflow: 'hidden' } }} />
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            </div>
            <div className="min-w-0 min-h-0 overflow-hidden relative h-full" style={{ gridColumn: 1, gridRow: 2 }}>
              <ChartCard title="Pasivos" compact href="/dashboard/obligaciones">
              {charts.liabilitiesBreakdown.length > 0 ? (
                <div className="absolute inset-0 flex flex-col min-w-0">
                  <div className="shrink-0 w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
                    <HighchartsReact highcharts={Highcharts} options={pieChartOptions} containerProps={{ style: { height: CHART_HEIGHT, width: '100%', overflow: 'hidden' } }} />
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-1.5 border-t border-slate-800 min-w-0">
                    {charts.liabilitiesBreakdown.map((l, i) => {
                      const bal = Number(l.balance ?? 0);
                      const pct = kpis.totalLiabilities > 0 ? (bal / kpis.totalLiabilities) * 100 : 0;
                      const color = COLORS[i % COLORS.length];
                      const barWidth = Math.max(pct, pct > 0 ? 2 : 0);
                      return (
                        <div key={`${l.category}-${i}`} className="flex items-center gap-2 text-xs py-1 min-w-0">
                          <span className="truncate shrink-0 max-w-[35%]">{l.category}</span>
                          <div className="flex-1 min-w-[80px] h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                          </div>
                          <span className="shrink-0 tabular-nums text-right">{formatCurrencyShort(bal)}</span>
                        </div>
                      );
                    })}
                    <p className="text-slate-500 text-xs pt-1">Total {formatCurrencyShort(kpis.totalLiabilities)}</p>
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            </div>
            <div className="min-w-0 min-h-0 overflow-hidden relative h-full" style={{ gridColumn: 2, gridRow: 2 }}>
              <ChartCard title="Patrimonio" compact href="/dashboard">
              {(kpis.totalAssets > 0 || kpis.totalLiabilities > 0) ? (
                <div className="absolute inset-0 flex flex-col min-w-0">
                  <div className="shrink-0 w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
                    <HighchartsReact highcharts={Highcharts} options={patrimonioBarOptions} containerProps={{ style: { height: CHART_HEIGHT, width: '100%', overflow: 'hidden' } }} />
                  </div>
                  <p className="text-slate-500 text-xs pt-1 shrink-0">Patrimonio = {formatCurrency(kpis.netWorth)}</p>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            </div>
          </section>
        </div>
        <EconomicTicker />
      </main>
    </div>
  );
}
