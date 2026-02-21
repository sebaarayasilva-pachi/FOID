'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveBankBalance, deleteBankBalance } from './actions';

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'ingresos', label: 'Ingresos', href: '/dashboard/ingresos' },
  { id: 'banco', label: 'Banco', href: '/dashboard/banco' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
];

type BankBalanceEntry = {
  id: string;
  date: string;
  balance: number;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mi = parseInt(m ?? '1', 10) - 1;
  return `${day ?? ''} ${months[mi >= 0 && mi < 12 ? mi : 0]} ${y}`;
}

export function BancoClient({ balances: initialBalances }: { balances: BankBalanceEntry[] }) {
  const router = useRouter();
  const [balances, setBalances] = useState(initialBalances);
  const [editing, setEditing] = useState<BankBalanceEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveBankBalance(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok && 'id' in result) {
      setEditing(null);
      const formId = formData.get('id') as string | null;
      const date = (formData.get('date') as string)?.slice(0, 10) ?? '';
      const balance = parseFloat((formData.get('balance') as string) || '0');
      const newEntry: BankBalanceEntry = { id: result.id, date, balance };
      if (formId) {
        setBalances((prev) => prev.map((b) => (b.id === formId ? newEntry : b)).sort((a, b) => b.date.localeCompare(a.date)));
      } else {
        const existing = balances.find((b) => b.date === date);
        if (existing) {
          setBalances((prev) => prev.map((b) => (b.id === existing.id ? newEntry : b)).sort((a, b) => b.date.localeCompare(a.date)));
        } else {
          setBalances((prev) => [...prev, newEntry].sort((a, b) => b.date.localeCompare(a.date)));
        }
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de saldo?')) return;
    setLoading(true);
    const result = await deleteBankBalance(id);
    if (result.ok) {
      setBalances((prev) => prev.filter((b) => b.id !== id));
      setEditing(null);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
  }

  const latestBalance = balances.length > 0 ? balances[0] : null;

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
                item.id === 'banco' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
            <h1 className="text-2xl font-bold text-slate-100">Banco</h1>
            <p className="text-slate-400 text-sm mt-1">
              {latestBalance
                ? `Saldo más reciente (${formatDate(latestBalance.date)}): ${formatCurrency(latestBalance.balance)}`
                : 'Registra el saldo diario de tu cuenta corriente'}
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
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Historial de saldos</h2>
            <div className="space-y-3">
              {balances.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay registros. Agrega un saldo con el formulario.</p>
              ) : (
                balances.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{formatDate(b.date)}</p>
                      <p className="text-sm text-emerald-400">{formatCurrency(b.balance)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(b)}
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
              {editing ? 'Modificar saldo' : 'Registrar saldo diario'}
            </h2>
            <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editing?.id ?? ''} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={editing?.date ?? today}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Saldo (CLP)</label>
                <input
                  type="number"
                  name="balance"
                  step={1000}
                  defaultValue={editing?.balance ?? ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: 2500000"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar'}
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
