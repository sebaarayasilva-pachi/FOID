import { prisma } from '@/src/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InvestmentDetailClient } from './InvestmentDetailClient';

export const dynamic = 'force-dynamic';

const TENANT_ID = process.env.FOID_TENANT_ID || 'g3';

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investment = await prisma.investment.findFirst({
    where: { id, tenantId: TENANT_ID },
    include: {
      movements: { orderBy: { fecha: 'desc' } },
    },
  });

  if (!investment) notFound();

  const totalIngresos = investment.movements
    .filter((m) => m.tipo === 'INGRESO')
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalRescates = investment.movements
    .filter((m) => m.tipo === 'RESCATE')
    .reduce((s, m) => s + Number(m.monto), 0);
  const saldoCalculado = Number(investment.capitalInvested) + totalIngresos - totalRescates;

  const data = {
    id: investment.id,
    agf: investment.agf,
    name: investment.name,
    category: investment.category,
    capitalInvested: Number(investment.capitalInvested),
    fechaApertura: investment.fechaApertura?.toISOString() ?? null,
    currentValue: investment.currentValue != null ? Number(investment.currentValue) : null,
    fechaValor: investment.fechaValor?.toISOString() ?? null,
    saldoCalculado,
    movements: investment.movements.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      monto: Number(m.monto),
      fecha: m.fecha.toISOString(),
    })),
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 bg-slate-900/80 border-r border-slate-800 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-400 mb-6 tracking-widest">FOID</h2>
        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/import"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Import
          </Link>
          <Link
            href="/dashboard/inversiones"
            className="block px-3 py-2 rounded-lg text-sm bg-sky-500/20 text-sky-400"
          >
            Inversiones
          </Link>
          <Link
            href="/dashboard/ingresos"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Ingresos
          </Link>
          <Link
            href="/dashboard/banco"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Banco
          </Link>
          <Link
            href="/dashboard/arriendos"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Arriendos
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <Link href="/dashboard/inversiones" className="text-sm text-slate-400 hover:text-slate-200">
            ← Volver a inversiones
          </Link>
        </div>
        <InvestmentDetailClient investment={data} />
      </main>
    </div>
  );
}
