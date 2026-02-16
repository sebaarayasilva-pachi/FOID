'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveInvestment, deleteInvestment } from './actions';

const AGF_LIST = [
  'LarrainVial',
  'Capital',
  'BTG Pactual',
  'Consorcio',
  'Itaú',
  'Security',
  'Banco de Chile',
  'Santander',
  'BICE',
  'Hernández',
  'Principal',
  'Otro',
];

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
];

const CATEGORIES = [
  { value: 'FFMM', label: 'FFMM' },
  { value: 'ACCIONES', label: 'Acciones' },
  { value: 'RENTA_FIJA', label: 'Renta Fija' },
  { value: 'INMOBILIARIO', label: 'Inmobiliario' },
  { value: 'OTROS', label: 'Otros' },
];

type Investment = {
  id: string;
  agf: string | null;
  name: string;
  category: string;
  capitalInvested: number;
  fechaApertura: string | null;
  currentValue: number | null;
  returnPct: number | null;
  monthlyIncome: number | null;
  rescates: number | null;
  units: number | null;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CL', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function InversionesClient({ investments: initialInvestments }: { investments: Investment[] }) {
  const router = useRouter();
  const [investments, setInvestments] = useState(initialInvestments);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveInvestment(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok && 'id' in result) {
      setEditing(null);
      setShowForm(false);
      const formId = formData.get('id') as string | null;
      const inv: Investment = {
        id: result.id,
        agf: (formData.get('agf') as string) || null,
        name: (formData.get('name') as string)?.trim() ?? '',
        category: (formData.get('category') as string) ?? 'OTROS',
        capitalInvested: parseFloat((formData.get('capitalInvested') as string) || '0'),
        fechaApertura: (formData.get('fechaApertura') as string) || null,
        currentValue: parseFloat((formData.get('currentValue') as string) || '') || null,
        returnPct: parseFloat((formData.get('returnPct') as string) || '') || null,
        monthlyIncome: parseFloat((formData.get('monthlyIncome') as string) || '') || null,
        rescates: parseFloat((formData.get('rescates') as string) || '') || null,
        units: parseFloat((formData.get('units') as string) || '') || null,
      };
      if (formId) {
        setInvestments((prev) => prev.map((i) => (i.id === formId ? inv : i)));
      } else {
        setInvestments((prev) => [...prev, inv].sort((a, b) => a.name.localeCompare(b.name)));
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta inversión?')) return;
    setLoading(true);
    const result = await deleteInvestment(id);
    if (result.ok) {
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      setEditing(null);
      setShowForm(false);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
  }

  function openCreateForm() {
    setEditing(null);
    setShowForm(true);
  }

  const totalValue = investments.reduce((s, i) => s + (i.currentValue ?? i.capitalInvested), 0);

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
                item.id === 'inversiones' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
            <h1 className="text-2xl font-bold text-slate-100">Inversiones</h1>
            <p className="text-slate-400 text-sm mt-1">Total: {formatCurrency(totalValue)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium"
            >
              Crear inversión
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
          {/* Lista de inversiones */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Lista de inversiones</h2>
            <div className="space-y-3">
              {investments.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay inversiones. Haz clic en &quot;Crear inversión&quot; para agregar una.</p>
              ) : (
                investments.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{i.name}</p>
                      <p className="text-sm text-slate-400">
                        {i.agf ?? '—'} · {i.category}
                      </p>
                      <div className="flex justify-between gap-4 mt-1 text-xs text-slate-400">
                        <span>Monto: {formatCurrency(i.currentValue ?? i.capitalInvested)}</span>
                        {i.fechaApertura && <span>Apertura: {formatDate(i.fechaApertura)}</span>}
                        {i.monthlyIncome != null && i.monthlyIncome > 0 && (
                          <span className="text-emerald-400">Ingresos: {formatCurrency(i.monthlyIncome)}/mes</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/inversiones/${i.id}`}
                        className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded"
                      >
                        Entrar
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(i);
                          setShowForm(true);
                        }}
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

          {/* Formulario crear / modificar */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">
              {editing ? 'Modificar inversión' : showForm ? 'Crear inversión' : 'Agregar inversión'}
            </h2>
            {showForm || editing ? (
              <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={editing?.id ?? ''} />
                <div>
                  <label className="block text-xs text-slate-400 mb-1">AGF</label>
                  <select
                    name="agf"
                    defaultValue={editing?.agf ?? ''}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Seleccionar AGF</option>
                    {AGF_LIST.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre del producto</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editing?.name}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej: Fondo Mutuo ABC"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo de inversión</label>
                  <select
                    name="category"
                    defaultValue={editing?.category ?? 'FFMM'}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Monto apertura (CLP)</label>
                    <input
                      type="number"
                      name="capitalInvested"
                      min={0}
                      step={1}
                      required
                      defaultValue={editing?.capitalInvested ?? ''}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha apertura</label>
                    <input
                      type="date"
                      name="fechaApertura"
                      defaultValue={editing?.fechaApertura ? editing.fechaApertura.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                {editing && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Valor actual (CLP)</label>
                        <input
                          type="number"
                          name="currentValue"
                          min={0}
                          step={1}
                          defaultValue={editing?.currentValue ?? ''}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Ingresos mensuales (CLP)</label>
                        <input
                          type="number"
                          name="monthlyIncome"
                          min={0}
                          step={1}
                          defaultValue={editing?.monthlyIncome ?? ''}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rescates (CLP)</label>
                        <input
                          type="number"
                          name="rescates"
                          min={0}
                          step={1}
                          defaultValue={editing?.rescates ?? ''}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">UT (unidades)</label>
                        <input
                          type="number"
                          name="units"
                          min={0}
                          step={0.0001}
                          defaultValue={editing?.units ?? ''}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                  >
                    {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear inversión'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setShowForm(false);
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-500 text-sm">Haz clic en &quot;Crear inversión&quot; para agregar una nueva inversión con AGF, nombre, monto y fecha.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
