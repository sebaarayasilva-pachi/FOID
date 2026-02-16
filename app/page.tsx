import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-100 mb-4">FOID</h1>
      <p className="text-slate-400 mb-8">Financial Overview & Investment Dashboard</p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
      >
        Ir al Dashboard
      </Link>
    </div>
  );
}
