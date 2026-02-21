'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveOtherIncome, deleteOtherIncome } from './actions';

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'ingresos', label: 'Ingresos', href: '/dashboard/ingresos' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
];

const TYPE_OPTIONS = [
  { value: 'OTROS', label: 'Otros ingresos' },
  { value: 'DIVIDENDOS_EMPRESAS', label: 'Dividendos o retiros de empresas' },
];

const FREQUENCY_OPTIONS = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'ANUAL', label: 'Anual' },
];

type OtherIncome = {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  type: string;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function toMonthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case 'MENSUAL':
      return amount;
    case 'SEMANAL':
      return amount * 4.33;
    case 'TRIMESTRAL':
      return amount / 3;
    case 'ANUAL':
      return amount / 12;
    default:
      return amount;
  }
}

export function IngresosClient({ incomes: initialIncomes }: { incomes: OtherIncome[] }) {
  const router = useRouter();
  const [incomes, setIncomes] = useState(initialIncomes);
  const [editing, setEditing] = useState<OtherIncome | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveOtherIncome(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok && 'id' in result) {
      setEditing(null);
      const formId = formData.get('id') as string | null;
      const description = (formData.get('description') as string)?.trim() ?? '';
      const amount = parseFloat((formData.get('amount') as string) || '0');
      const frequency = (formData.get('frequency') as string) || 'MENSUAL';
      const type = (formData.get('type') as string) || 'OTROS';
      const newIncome: OtherIncome = { id: result.id, description, amount, frequency, type };
      if (formId) {
        setIncomes((prev) => prev.map((i) => (i.id === formId ? newIncome : i)));
      } else {
        setIncomes((prev) => [...prev, newIncome].sort((a, b) => a.description.localeCompare(b.description)));
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ingreso?')) return;
    setLoading(true);
    const result = await deleteOtherIncome(id);
    if (result.ok) {
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      setEditing(null);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
  }

  const totalMonthly = incomes.reduce((s, i) => s + toMonthlyEquivalent(i.amount, i.frequency), 0);

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
                item.id === 'ingresos' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
            <h1 className="text-2xl font-bold text-slate-100">Ingresos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Total equivalente mensual: {formatCurrency(totalMonthly)}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">
            ← Volver al dashboard
          </Link>
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
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Registro de ingresos</h2>
            <div className="space-y-3">
              {incomes.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay ingresos. Agrega uno con el formulario.</p>
              ) : (
                incomes.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{i.description}</p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(i.amount)} / {FREQUENCY_OPTIONS.find((f) => f.value === i.frequency)?.label?.toLowerCase() ?? i.frequency}
                        {' · '}
                        <span className="text-emerald-400">{formatCurrency(toMonthlyEquivalent(i.amount, i.frequency))} / mes</span>
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-600 text-slate-300">
                        {TYPE_OPTIONS.find((t) => t.value === i.type)?.label ?? i.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(i)}
                        className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(i.id)}
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
              {editing ? 'Modificar ingreso' : 'Agregar ingreso'}
            </h2>
            <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editing?.id ?? ''} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Descripción</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={editing?.description}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: Honorarios consultoría"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  name="amount"
                  min={0}
                  step={1000}
                  defaultValue={editing?.amount ?? ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Frecuencia</label>
                <select
                  name="frequency"
                  defaultValue={editing?.frequency ?? 'MENSUAL'}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                <select
                  name="type"
                  defaultValue={editing?.type ?? 'OTROS'}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
