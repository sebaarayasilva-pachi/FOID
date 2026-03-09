'use client';

import Link from 'next/link';

const MENU_STRUCTURE = [
  { id: 'overview', label: 'Overview', href: '/dashboard', icon: 'home', isHeader: false },
  { id: 'activos', label: 'Activos', href: null, icon: 'trendingUp', isHeader: true },
  { id: 'inversiones', label: 'Inversiones', href: '/dashboard/inversiones', icon: 'list', isHeader: false, parent: 'activos' },
  { id: 'ingresos', label: 'Ingresos', href: '/dashboard/ingresos', icon: 'currency', isHeader: false, parent: 'activos' },
  { id: 'arriendos', label: 'Arriendos', href: '/dashboard/arriendos', icon: 'building', isHeader: false, parent: 'activos' },
  { id: 'banco', label: 'Banco', href: '/dashboard/banco', icon: 'bank', isHeader: false, parent: 'activos' },
  { id: 'pasivos', label: 'Pasivos', href: null, icon: 'chart', isHeader: true },
  { id: 'obligaciones', label: 'Obligaciones', href: '/dashboard/obligaciones', icon: 'chart', isHeader: false, parent: 'pasivos' },
  { id: 'presupuesto', label: 'Presupuesto', href: '/dashboard/presupuesto', icon: 'wallet', isHeader: false },
] as const;

export function NavIcon({ icon }: { icon: string }) {
  const size = 16;
  switch (icon) {
    case 'home':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'upload':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    case 'chart':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'list':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'currency':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'building':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'bank':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      );
    case 'bell':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'trendingUp':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'wallet':
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    default:
      return null;
  }
}

type DashboardSidebarProps = {
  currentItemId?: string;
};

export function DashboardSidebar({ currentItemId = 'overview' }: DashboardSidebarProps) {
  return (
    <aside className="w-48 flex flex-col py-3 bg-slate-900/80 border-r border-slate-800 shrink-0">
      <h2 className="text-[10px] font-bold text-slate-400 mb-4 px-3 tracking-widest">FOID</h2>
      <nav className="flex flex-col gap-0.5 px-2">
        {MENU_STRUCTURE.map((item) => {
          if (item.isHeader) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 mt-2 first:mt-0 cursor-default"
              >
                <NavIcon icon={item.icon} />
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            );
          }
          const isActive = item.id === currentItemId;
          const href = item.href ?? '#';
          return (
            <Link
              key={item.id}
              href={href}
              className={`flex items-center gap-2 px-3 py-1.5 pl-8 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-300'
              }`}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
