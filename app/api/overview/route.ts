import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { getOverview } from '@/src/services/overview.service';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json(
      { error: 'tenantId is required' },
      { status: 400 }
    );
  }

  try {
    const overview = await getOverview(tenantId);
    return NextResponse.json(overview);
  } catch (e) {
    console.error('Overview error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
