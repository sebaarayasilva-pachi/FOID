import { NextRequest } from 'next/server';

const API_KEY = process.env.FOID_API_KEY;

export function validateApiKey(request: NextRequest): boolean {
  if (!API_KEY) return false;
  const key = request.headers.get('x-foid-key');
  return key === API_KEY;
}

export function requireAuth(request: NextRequest): { ok: true } | { ok: false; status: 401 } {
  if (!validateApiKey(request)) {
    return { ok: false, status: 401 };
  }
  return { ok: true };
}
