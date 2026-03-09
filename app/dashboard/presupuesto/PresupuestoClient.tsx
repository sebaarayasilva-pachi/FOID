'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '../DashboardSidebar';
import { saveBudget, deleteBudget } from './actions';

type BudgetEntry = {
  id: string;
  month: string;
  budgetIncome: number;
  budgetExpenses: number;
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMonth(monthStr: string) {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [y, m] = monthStr.split('-');
  const mi = parseInt(m ?? '1', 10) - 1;
  return `${MONTHS[mi >= 0 && mi < 12 ? mi : 0]} ${y}`;
}

export function PresupuestoClient({ budgets: initialBudgets }: { budgets: BudgetEntry[] }) {
  const router = useRouter();
  const [budgets, setBudgets] = useState(initialBudgets);
  const [editing, setEditing] = useState<BudgetEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const defaultMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveBudget(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setEditing(null);
      setShowForm(false);
      const formId = formData.get('id') as string | null;
      const month = (formData.get('month') as string)?.trim() ?? '';
      const budgetIncome = parseFloat((formData.get('budgetIncome') as string) || '0');
      const budgetExpenses = parseFloat((formData.get('budgetExpenses') as string) || '0');
      const entry: BudgetEntry = { id: result.id, month, budgetIncome, budgetExpenses };
      if (formId) {
        setBudgets((prev) => prev.map((b) => (b.id === formId ? entry : b)).sort((a, b) => b.month.localeCompare(a.month)));
      } else {
        setBudgets((prev) => [...prev.filter((b) => b.month !== month), entry].sort((a, b) => b.month.localeCompare(a.month)));
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    setLoading(true);
    const result = await deleteBudget(id);
    if (result.ok) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      setEditing(null);
      setShowForm(false);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <DashboardSidebar currentItemId="presupuesto" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Presupuesto</h1>
            <p className="text-slate-400 text-sm mt-1">
              Define ingresos y egresos presupuestados por mes. Se contrastan en el gráfico Flujo de Caja.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium"
            >
              Nuevo presupuesto
            </button>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
              ← Dashboard
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
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Presupuestos por mes</h2>
            <div className="space-y-3">
              {budgets.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay presupuestos. Agrega uno con el formulario.</p>
              ) : (
                budgets.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{formatMonth(b.month)}</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Ingresos: <span className="text-emerald-400">{formatCurrency(b.budgetIncome)}</span>
                        {' · '}
                        Egresos: <span className="text-rose-400">{formatCurrency(b.budgetExpenses)}</span>
                        {' · '}
                        Neto: <span className={b.budgetIncome - b.budgetExpenses >= 0 ? 'text-teal-400' : 'text-rose-400'}>
                          {formatCurrency(b.budgetIncome - b.budgetExpenses)}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditing(b); setShowForm(true); }}
                        className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
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

          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">
              {editing ? 'Modificar presupuesto' : showForm ? 'Agregar presupuesto' : 'Formulario'}
            </h2>
            {(showForm || editing) ? (
              <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={editing?.id ?? ''} />
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mes (YYYY-MM)</label>
                  <input
                    type="month"
                    name="month"
                    required
                    defaultValue={editing?.month ?? defaultMonth}
                    disabled={!!editing}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ingresos presupuestados (CLP)</label>
                  <input
                    type="number"
                    name="budgetIncome"
                    min={0}
                    step={1000}
                    defaultValue={editing?.budgetIncome ?? ''}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej: 2000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Egresos presupuestados (CLP)</label>
                  <input
                    type="number"
                    name="budgetExpenses"
                    min={0}
                    step={1000}
                    defaultValue={editing?.budgetExpenses ?? ''}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej: 1500000"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setShowForm(false); }}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-500 text-sm">Haz clic en &quot;Nuevo presupuesto&quot; para agregar un mes.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
