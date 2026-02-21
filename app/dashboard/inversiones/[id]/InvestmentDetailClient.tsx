'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addMovement, updateCurrentValue, updateMovement, deleteMovement, updateInvestmentApertura } from '../actions';

type Investment = {
  id: string;
  agf: string | null;
  name: string;
  category: string;
  capitalInvested: number;
  fechaApertura: string | null;
  currentValue: number | null;
  fechaValor: string | null;
  saldoCalculado: number;
  movements: { id: string; tipo: string; monto: number; fecha: string }[];
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CL', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function InvestmentDetailClient({ investment: initialInvestment }: { investment: Investment }) {
  const router = useRouter();
  const [investment, setInvestment] = useState(initialInvestment);
  useEffect(() => {
    setInvestment(initialInvestment);
  }, [initialInvestment]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'ingreso' | 'valor' | 'rescate' | 'apertura' | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);

  const valorMostrar = investment.currentValue ?? investment.saldoCalculado;

  async function handleAddMovement(e: React.FormEvent<HTMLFormElement>, tipo: 'INGRESO' | 'RESCATE') {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const monto = parseFloat((form.elements.namedItem('monto') as HTMLInputElement).value);
    const fecha = (form.elements.namedItem('fecha') as HTMLInputElement).value;
    const result = await addMovement(investment.id, tipo, monto, fecha);
    setMessage(result.ok ? { ok: true, text: tipo === 'INGRESO' ? 'Ingreso registrado' : 'Rescate registrado' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setActiveTab(null);
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>, movementId: string) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const monto = parseFloat((form.elements.namedItem('monto') as HTMLInputElement).value);
    const fecha = (form.elements.namedItem('fecha') as HTMLInputElement).value;
    const result = await updateMovement(movementId, { monto, fecha });
    setMessage(result.ok ? { ok: true, text: 'Movimiento actualizado' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setEditingMovementId(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDeleteMovement(movementId: string) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    setLoading(true);
    setMessage(null);
    const result = await deleteMovement(movementId);
    setMessage(result.ok ? { ok: true, text: 'Movimiento eliminado' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setEditingMovementId(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdateValue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const currentValue = parseFloat((form.elements.namedItem('currentValue') as HTMLInputElement).value);
    const fechaValor = (form.elements.namedItem('fechaValor') as HTMLInputElement).value;
    const valorAnterior = investment.currentValue ?? investment.saldoCalculado;
    const result = await updateCurrentValue(investment.id, currentValue, fechaValor);
    const diff = currentValue - valorAnterior;
    const diffText = diff > 0 ? `UT: +${formatCurrency(diff)}` : diff < 0 ? `Pérdida: ${formatCurrency(diff)}` : '';
    setMessage(result.ok ? { ok: true, text: `Valor actualizado. ${diffText}`.trim() } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setInvestment((prev) => ({ ...prev, currentValue, fechaValor: fechaValor ? `${fechaValor}T12:00:00.000Z` : null }));
      setActiveTab(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdateApertura(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const capitalInvested = parseFloat((form.elements.namedItem('capitalInvested') as HTMLInputElement).value);
    const fechaApertura = (form.elements.namedItem('fechaApertura') as HTMLInputElement).value;
    const result = await updateInvestmentApertura(investment.id, capitalInvested, fechaApertura);
    setMessage(result.ok ? { ok: true, text: 'Apertura actualizada' } : { ok: false, text: result.error ?? 'Error' });
    if (result.ok) {
      setInvestment((prev) => ({
        ...prev,
        capitalInvested,
        fechaApertura: fechaApertura ? `${fechaApertura}T12:00:00.000Z` : null,
      }));
      setActiveTab(null);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-slate-100">{investment.name}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {investment.agf ?? '—'} · {investment.category}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-slate-500 text-xs">
            Apertura: {formatDate(investment.fechaApertura ?? new Date().toISOString())} · {formatCurrency(investment.capitalInvested)}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'apertura' ? null : 'apertura')}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            {activeTab === 'apertura' ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        <p className="text-xl font-semibold text-sky-400 mt-4">
          Valor actual: {formatCurrency(valorMostrar)}
          {investment.fechaValor && (
            <span className="text-slate-500 text-sm font-normal ml-2">
              (al {formatDate(investment.fechaValor)})
            </span>
          )}
        </p>
        {investment.currentValue != null && investment.currentValue !== investment.saldoCalculado && (
          <p className="text-xs text-slate-500 mt-1">
            Saldo calculado (apertura + ingresos - rescates): {formatCurrency(investment.saldoCalculado)}
            {' · '}
            <span className={investment.currentValue > investment.saldoCalculado ? 'text-emerald-400' : 'text-amber-400'}>
              {investment.currentValue > investment.saldoCalculado
                ? `UT: +${formatCurrency(investment.currentValue - investment.saldoCalculado)}`
                : `Pérdida: ${formatCurrency(investment.currentValue - investment.saldoCalculado)}`}
            </span>
          </p>
        )}
        {activeTab === 'apertura' && (
          <form onSubmit={handleUpdateApertura} className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
            <h4 className="text-sm font-medium text-slate-200">Modificar apertura</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monto apertura (CLP)</label>
                <input
                  type="number"
                  name="capitalInvested"
                  required
                  min={0}
                  step={1}
                  defaultValue={investment.capitalInvested}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha apertura</label>
                <input
                  type="date"
                  name="fechaApertura"
                  required
                  defaultValue={investment.fechaApertura ? investment.fechaApertura.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Nuevo ingreso</h3>
          <p className="text-xs text-slate-500 mb-4">Registrar un depósito o aporte a la inversión.</p>
          {activeTab === 'ingreso' ? (
            <form onSubmit={(e) => handleAddMovement(e, 'INGRESO')} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  name="monto"
                  required
                  min={1}
                  step={1}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  Registrar ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('ingreso')}
              className="w-full px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/30"
            >
              + Nuevo ingreso
            </button>
          )}
        </div>

        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Valor del día</h3>
          <p className="text-xs text-slate-500 mb-4">Actualizar el valor actual (ej. cotización del día).</p>
          {activeTab === 'valor' ? (
            <form onSubmit={handleUpdateValue} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor actual (CLP)</label>
                <input
                  type="number"
                  name="currentValue"
                  required
                  min={0}
                  step={1}
                  defaultValue={investment.currentValue ?? investment.saldoCalculado}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fechaValor"
                  required
                  defaultValue={investment.fechaValor ? investment.fechaValor.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  Guardar valor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('valor')}
              className="w-full px-4 py-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-sm font-medium border border-sky-500/30"
            >
              Actualizar valor
            </button>
          )}
        </div>

        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Rescate</h3>
          <p className="text-xs text-slate-500 mb-4">Registrar un retiro de la inversión.</p>
          {activeTab === 'rescate' ? (
            <form onSubmit={(e) => handleAddMovement(e, 'RESCATE')} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  name="monto"
                  required
                  min={1}
                  step={1}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  Registrar rescate
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('rescate')}
              className="w-full px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium border border-amber-500/30"
            >
              Hacer rescate
            </button>
          )}
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Historial de movimientos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4 text-right">Monto</th>
                <th className="py-2 pr-4 text-right">Saldo</th>
                <th className="py-2 w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const fechaApertura = investment.fechaApertura ?? new Date().toISOString();
                const sorted = [...investment.movements].sort(
                  (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                );
                const rows: { id: string; fecha: string; tipo: string; monto: number; isApertura?: boolean }[] = [
                  { id: 'apertura', fecha: fechaApertura, tipo: 'Apertura', monto: investment.capitalInvested, isApertura: true },
                  ...sorted.map((m) => ({ id: m.id, fecha: m.fecha, tipo: m.tipo, monto: m.monto })),
                ];
                let saldo = 0;
                return rows.map((m) => {
                  if (m.isApertura) {
                    saldo = m.monto;
                  } else if (m.tipo === 'INGRESO') {
                    saldo += m.monto;
                  } else if (m.tipo === 'RESCATE') {
                    saldo -= m.monto;
                  } else if (m.tipo === 'VALOR_DIA') {
                    saldo += m.monto;
                  }
                  saldo = Math.max(0, saldo);
                  const isUt = m.tipo === 'VALOR_DIA' && m.monto > 0;
                  const isPerdida = m.tipo === 'VALOR_DIA' && m.monto < 0;
                  const tipoLabel = m.isApertura ? 'Apertura' : m.tipo === 'INGRESO' ? 'Ingreso' : m.tipo === 'RESCATE' ? 'Rescate' : isUt ? 'UT' : 'Pérdida';
                  const tipoColor = m.isApertura ? 'text-sky-400' : m.tipo === 'INGRESO' ? 'text-emerald-400' : m.tipo === 'RESCATE' ? 'text-amber-400' : isUt ? 'text-emerald-400' : 'text-amber-400';
                  const montoDisplay = m.isApertura ? formatCurrency(m.monto) : m.tipo === 'INGRESO' ? `+ ${formatCurrency(m.monto)}` : m.tipo === 'RESCATE' ? `− ${formatCurrency(m.monto)}` : m.monto >= 0 ? `+ ${formatCurrency(m.monto)}` : formatCurrency(m.monto);
                  const isEditing = !m.isApertura && editingMovementId === m.id;
                  return (
                    <tr key={m.id} className="border-b border-slate-800/80">
                      {isEditing ? (
                        <>
                          <td colSpan={5} className="py-3 pr-4">
                            <form onSubmit={(e) => handleSaveEdit(e, m.id)} className="flex flex-wrap items-center gap-3">
                              <div>
                                <label className="sr-only">Fecha</label>
                                <input
                                  type="date"
                                  name="fecha"
                                  required
                                  defaultValue={m.fecha.slice(0, 10)}
                                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-sm"
                                />
                              </div>
                              <div>
                                <label className="sr-only">Monto</label>
                                <input
                                  type="number"
                                  name="monto"
                                  required
                                  min={m.tipo === 'VALOR_DIA' ? undefined : 1}
                                  step={1}
                                  defaultValue={m.monto}
                                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-sm w-32"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-2 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-medium"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMovementId(null)}
                                  className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded text-xs"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 pr-4 text-slate-300">{formatDate(m.fecha)}</td>
                          <td className="py-2.5 pr-4">
                            <span className={tipoColor}>{tipoLabel}</span>
                          </td>
                          <td className={`py-2.5 pr-4 text-right font-medium ${tipoColor}`}>
                            {montoDisplay}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-200 tabular-nums">{formatCurrency(saldo)}</td>
                          <td className="py-2.5 text-right">
                            {m.isApertura ? (
                              <span className="text-slate-600 text-xs">—</span>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingMovementId(m.id)}
                                  className="text-sky-400 hover:text-sky-300 text-xs px-1.5 py-0.5 rounded hover:bg-sky-500/20"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMovement(m.id)}
                                  disabled={loading}
                                  className="text-rose-400 hover:text-rose-300 text-xs px-1.5 py-0.5 rounded hover:bg-rose-500/20 disabled:opacity-50"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
