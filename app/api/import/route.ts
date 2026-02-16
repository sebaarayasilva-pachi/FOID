import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { importData } from '@/src/services/import.service';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantId, investmentsCsv, liabilitiesCsv, cashflowCsv, rentalsCsv } = body;

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    await importData({
      tenantId,
      investmentsCsv,
      liabilitiesCsv,
      cashflowCsv,
      rentalsCsv,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Import error:', e);
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    );
  }
}
