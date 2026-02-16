'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveRental, deleteRental } from './actions';

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
];

type Rental = {
  id: string;
  propertyName: string;
  monthlyRent: number;
  status: string;
  tenantName: string;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ArriendosClient({ rentals: initialRentals }: { rentals: Rental[] }) {
  const router = useRouter();
  const [rentals, setRentals] = useState(initialRentals);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await saveRental(formData);
    setMessage(result.ok ? { ok: true, text: 'Guardado correctamente' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok && 'id' in result) {
      setEditing(null);
      const formId = formData.get('id') as string | null;
      const propertyName = (formData.get('propertyName') as string)?.trim() ?? '';
      const monthlyRent = parseFloat((formData.get('monthlyRent') as string) || '0');
      const status = (formData.get('status') as string) || 'VACANT';
      const tenantName = (formData.get('tenantName') as string)?.trim() ?? '';
      const newRental: Rental = { id: result.id, propertyName, monthlyRent, status, tenantName };
      if (formId) {
        setRentals((prev) => prev.map((r) => (r.id === formId ? newRental : r)));
      } else {
        setRentals((prev) => [...prev, newRental].sort((a, b) => a.propertyName.localeCompare(b.propertyName)));
      }
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta propiedad?')) return;
    setLoading(true);
    const result = await deleteRental(id);
    if (result.ok) {
      setRentals((prev) => prev.filter((r) => r.id !== id));
      setEditing(null);
    }
    setMessage(result.ok ? { ok: true, text: 'Eliminado' } : { ok: false, text: result.error ?? 'Error' });
    setLoading(false);
  }

  const totalRent = rentals.filter((r) => r.status === 'RENTED').reduce((s, r) => s + r.monthlyRent, 0);

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
                item.id === 'arriendos' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
            <h1 className="text-2xl font-bold text-slate-100">Arriendos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Ingreso total: {formatCurrency(totalRent)} / mes
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-200"
          >
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
          {/* Lista de propiedades */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Propiedades</h2>
            <div className="space-y-3">
              {rentals.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay propiedades. Agrega una con el formulario.</p>
              ) : (
                rentals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{r.propertyName}</p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(r.monthlyRent)} / mes
                        {r.tenantName && ` · ${r.tenantName}`}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          r.status === 'RENTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {r.status === 'RENTED' ? 'Arrendado' : 'Vacante'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
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

          {/* Formulario agregar / modificar */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">
              {editing ? 'Modificar propiedad' : 'Agregar propiedad'}
            </h2>
            <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editing?.id ?? ''} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre de la propiedad</label>
                <input
                  type="text"
                  name="propertyName"
                  required
                  defaultValue={editing?.propertyName}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: Depto Las Condes"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Arriendo mensual (CLP)</label>
                <input
                  type="number"
                  name="monthlyRent"
                  min={0}
                  step={1000}
                  defaultValue={editing?.monthlyRent ?? ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="450000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre del arrendatario</label>
                <input
                  type="text"
                  name="tenantName"
                  defaultValue={editing?.tenantName ?? ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Estado</label>
                <select
                  name="status"
                  defaultValue={editing?.status ?? 'VACANT'}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="RENTED">Arrendado</option>
                  <option value="VACANT">Vacante</option>
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
