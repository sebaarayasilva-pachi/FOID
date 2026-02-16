'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { saveLiability, deleteLiability } from './actions';

const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#2dd4bf', '#f43f5e'];

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
];

const CATEGORIES = [
  { value: 'SUELDOS', label: 'Sueldos' },
  { value: 'TENEDOR', label: 'Tenedor' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'HIPOTECARIO', label: 'Hipotecario' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de crédito' },
  { value: 'CREDITO_CONSUMO', label: 'Crédito de consumo' },
  { value: 'OTRO', label: 'Otro' },
];

type Liability = {
  id: string;
  name: string;
  category: string;
  balance: number | null;
  monthlyPayment: number;
  interestRate: number | null;
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

const DARK_THEME = {
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
  title: { style: { color: '#94a3b8' } },
  xAxis: { gridLineColor: '#334155', labels: { style: { color: '#94a3b8' } }, lineColor: '#475569', tickColor: '#475569' },
  yAxis: { gridLineColor: '#334155', labels: { style: { color: '#94a3b8' } }, lineColor: '#475569', tickColor: '#475569' },
  tooltip: { backgroundColor: '#1e293b', borderColor: '#475569', style: { color: '#e2e8f0' } },
};

export function ObligacionesClient({
  liabilities: initialLiabilities,
}: {
  liabilities: Liability[];
}) {
  const router = useRouter();
  const [liabilities, setLiabilities] = useState(initialLiabilities);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Agrupar por categoría para el gráfico (igual que dashboard)
  const liabilitiesByCategory = liabilities.reduce<Record<string, { balance: number; monthlyPayment: number }>>(
    (acc, l) => {
      const cat = l.category || 'OTRO';
      if (!acc[cat]) acc[cat] = { balance: 0, monthlyPayment: 0 };
      acc[cat].balance += l.balance ?? 0;
      acc[cat].monthlyPayment += l.monthlyPayment ?? 0;
      return acc;
    },
    {}
  );
  const chartData = Object.entries(liabilitiesByCategory).map(([category, v]) => ({
    category,
    balance: v.balance,
    monthlyPayment: v.monthlyPayment,
  }));
  const totalLiabilities = chartData.reduce((s, c) => s + c.balance, 0);

  const pieChartOptions: Highcharts.Options = {
    ...DARK_THEME,
    chart: { ...DARK_THEME.chart, height: 220, type: 'pie' },
    title: { text: undefined },
    tooltip: {
      ...DARK_THEME.tooltip,
      pointFormatter: function () {
        return `<span style="color:${this.color}">●</span> ${this.name}: <b>${formatCurrency(Number(this.y))}</b>`;
      },
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
      data: chartData.map((l, i) => ({ name: l.category, y: l.balance, color: COLORS[i % COLORS.length] })),
    }],
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveLiability(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok && 'id' in result) {
      setEditing(null);
      setShowForm(false);
      const formId = formData.get('id') as string | null;
      const liab: Liability = {
        id: result.id,
        name: (formData.get('name') as string)?.trim() ?? '',
        category: (formData.get('category') as string) ?? 'OTRO',
        balance: parseFloat((formData.get('balance') as string) || '') || null,
        monthlyPayment: parseFloat((formData.get('monthlyPayment') as string) || '0'),
        interestRate: parseFloat((formData.get('interestRate') as string) || '') || null,
      };
      if (formId) {
        setLiabilities((prev) => prev.map((l) => (l.id === formId ? liab : l)));
      } else {
        setLiabilities((prev) => [...prev, liab].sort((a, b) => a.name.localeCompare(b.name)));
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta obligación?')) return;
    setLoading(true);
    const result = await deleteLiability(id);
    if (result.ok) {
      setLiabilities((prev) => prev.filter((l) => l.id !== id));
      setEditing(null);
      setShowForm(false);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
    router.refresh();
  }

  const totalMonthly = liabilities.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 bg-slate-900/80 border-r border-slate-800 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-400 mb-6 tracking-widest">FOID</h2>
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                item.id === 'obligaciones' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Obligaciones</h1>
            <p className="text-slate-400 text-sm mt-1">
              Total deuda: {formatCurrency(totalLiabilities)} · Cuota mensual: {formatCurrency(totalMonthly)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium"
            >
              Crear obligación
            </button>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
              ← Volver al dashboard
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico Deuda por Categoría */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Deuda por Categoría</h2>
            {chartData.length > 0 ? (
              <div className="flex flex-col gap-4">
                <HighchartsReact highcharts={Highcharts} options={pieChartOptions} containerProps={{ style: { height: 220 } }} />
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  {chartData.map((l, i) => (
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
                              width: `${Math.min(100, totalLiabilities > 0 ? (l.balance / totalLiabilities) * 100 : 0)}%`,
                              backgroundColor: '#f43f5e',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-800">Total {formatCurrency(totalLiabilities)}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-8 text-center">No hay obligaciones. Crea una para ver el gráfico.</p>
            )}
          </div>

          {/* Lista y formulario */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Lista de obligaciones</h2>
              <div className="space-y-3">
                {liabilities.length === 0 ? (
                  <p className="text-slate-500 text-sm">No hay obligaciones. Haz clic en &quot;Crear obligación&quot; para agregar una.</p>
                ) : (
                  liabilities.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div>
                        <p className="font-medium text-slate-200">{l.name}</p>
                        <p className="text-sm text-slate-400">{l.category}</p>
                        <div className="flex justify-between gap-4 mt-1 text-xs text-slate-400">
                          <span>Saldo: {formatCurrency(l.balance ?? 0)}</span>
                          <span className="text-rose-400">Cuota: {formatCurrency(l.monthlyPayment)}/mes</span>
                          {l.interestRate != null && <span>Tasa: {(l.interestRate * 100).toFixed(1)}%</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditing(l); setShowForm(true); }}
                          className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">
                {editing ? 'Modificar obligación' : showForm ? 'Crear obligación' : 'Agregar obligación'}
              </h2>
              {(showForm || editing) ? (
                <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="id" value={editing?.id ?? ''} />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editing?.name}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Ej: Crédito hipotecario"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                    <select
                      name="category"
                      defaultValue={editing?.category ?? 'OTRO'}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Saldo (CLP)</label>
                      <input
                        type="number"
                        name="balance"
                        min={0}
                        step={1}
                        defaultValue={editing?.balance ?? ''}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Cuota mensual (CLP)</label>
                      <input
                        type="number"
                        name="monthlyPayment"
                        min={0}
                        step={1}
                        required
                        defaultValue={editing?.monthlyPayment ?? ''}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tasa de interés (% anual, opcional)</label>
                    <input
                      type="number"
                      name="interestRate"
                      min={0}
                      max={100}
                      step={0.1}
                      defaultValue={editing?.interestRate != null ? editing.interestRate * 100 : ''}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Ej: 8.9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(null); setShowForm(false); }}
                      className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setShowForm(true); }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm"
                >
                  + Agregar obligación
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
