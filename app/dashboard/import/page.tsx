'use client';

import { useState } from 'react';
import Link from 'next/link';
import { importCsv, importSampleData } from './actions';

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'import', label: 'Import', href: '/dashboard/import' },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones' },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones' },
  { id: 'ingresos', label: 'Ingresos', href: '/dashboard/ingresos' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos' },
  { id: 'alertas', label: 'Alertas', href: '#' },
];

const CSV_TEMPLATES = {
  investments: `name,category,capitalInvested,currentValue,returnPct,monthlyIncome
Fondo A,FFMM,5000000,5200000,0.04,20000
Acción X,ACCIONES,1000000,1100000,0.10,0`,
  liabilities: `name,category,balance,monthlyPayment,interestRate
Crédito Hipotecario,HIPOTECARIO,80000000,450000,0.089
Tarjeta SANTANDER,SANTANDER,500000,150000,0.24`,
  cashflow: `month,income,expenses
2026-01,1200000,600000
2026-02,1150000,620000`,
  rentals: `propertyName,monthlyRent,status
Depto Las Condes,450000,RENTED
Casa Providencia,0,VACANT`,
};

export default function ImportPage() {
  const [investmentsCsv, setInvestmentsCsv] = useState('');
  const [liabilitiesCsv, setLiabilitiesCsv] = useState('');
  const [cashflowCsv, setCashflowCsv] = useState('');
  const [rentalsCsv, setRentalsCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set('investmentsCsv', investmentsCsv);
    formData.set('liabilitiesCsv', liabilitiesCsv);
    formData.set('cashflowCsv', cashflowCsv);
    formData.set('rentalsCsv', rentalsCsv);

    const data = await importCsv(formData);
    setResult(data);
    setLoading(false);
  }

  function loadSample() {
    setInvestmentsCsv(CSV_TEMPLATES.investments);
    setLiabilitiesCsv(CSV_TEMPLATES.liabilities);
    setCashflowCsv(CSV_TEMPLATES.cashflow);
    setRentalsCsv(CSV_TEMPLATES.rentals);
  }

  async function handleLoadAndSave() {
    setLoading(true);
    setResult(null);
    const data = await importSampleData();
    setResult(data);
    if (data.ok) loadSample();
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-800/50 border-r border-slate-700 p-4">
        <h2 className="text-lg font-semibold text-slate-100 mb-6">FOID</h2>
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                item.id === 'import'
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Importar CSV</h1>
        <p className="text-slate-400 text-sm mb-8">
          Pega el contenido de cada CSV o usa datos de ejemplo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={handleLoadAndSave}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors font-medium"
            >
              {loading ? 'Guardando...' : 'Cargar y guardar ejemplo'}
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm transition-colors"
            >
              Solo cargar en formulario
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {result.ok ? (
                <>
                  Importación exitosa.{' '}
                  <Link href="/dashboard" className="underline hover:no-underline">
                    Ver dashboard
                  </Link>
                </>
              ) : (
                result.error
              )}
            </div>
          )}

          <CsvField
            label="Inversiones"
            hint="name, category, capitalInvested, currentValue, returnPct, monthlyIncome | Categorías: FFMM, ACCIONES, RENTA_FIJA, INMOBILIARIO, OTROS"
            value={investmentsCsv}
            onChange={setInvestmentsCsv}
          />
          <CsvField
            label="Pasivos"
            hint="name, category, balance, monthlyPayment, interestRate | Categorías: SUELDOS, TENEDOR, SANTANDER, HIPOTECARIO, OTRO"
            value={liabilitiesCsv}
            onChange={setLiabilitiesCsv}
          />
          <CsvField
            label="Flujo de caja"
            hint="month, income, expenses | month formato YYYY-MM"
            value={cashflowCsv}
            onChange={setCashflowCsv}
          />
          <CsvField
            label="Arriendos"
            hint="propertyName, monthlyRent, status | status: RENTED, VACANT"
            value={rentalsCsv}
            onChange={setRentalsCsv}
          />
        </form>
      </main>
    </div>
  );
}

function CsvField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <p className="text-xs text-slate-500 mb-2">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Pega el CSV aquí..."
      />
    </div>
  );
}
