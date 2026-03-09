'use client';

import Link from 'next/link';

export default function DebugPage() {
  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <div
        style={{
          background: 'red',
          color: 'white',
          padding: '24px',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '24px',
          border: '4px solid yellow',
        }}
      >
        ✅ DEBUG: Si ves este banner rojo, el build está aplicando los cambios
      </div>
      <p className="text-slate-300 mb-4">
        Fecha/hora de build: {new Date().toLocaleString('es-CL')}
      </p>
      <Link href="/dashboard" className="text-cyan-400 hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
