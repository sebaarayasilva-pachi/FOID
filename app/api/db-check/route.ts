import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

/** Endpoint para depurar conexión a la base de datos. Devuelve error sanitizado. */
export async function GET() {
  const hasUrl = !!process.env.DATABASE_URL;
  const urlPreview = hasUrl
    ? `${process.env.DATABASE_URL!.slice(0, 30)}...${process.env.DATABASE_URL!.slice(-20)}`
    : '(no definido)';

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      message: 'Conexión OK',
      hasDatabaseUrl: hasUrl,
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        name: err.name,
        hasDatabaseUrl: hasUrl,
        urlPreview,
      },
      { status: 500 }
    );
  }
}
