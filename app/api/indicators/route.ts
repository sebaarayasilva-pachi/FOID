import { NextResponse } from 'next/server';

const MINDICADOR_URL = 'https://mindicador.cl/api';
const CACHE_MAX_AGE = 300; // 5 minutos

type MindicadorItem = {
  codigo: string;
  nombre: string;
  unidad_medida: string;
  fecha: string;
  valor: number;
};

type MindicadorResponse = {
  uf?: MindicadorItem;
  dolar?: MindicadorItem;
  euro?: MindicadorItem;
  ipc?: MindicadorItem;
  tpm?: MindicadorItem;
  libra_cobre?: MindicadorItem;
  bitcoin?: MindicadorItem;
};

export type IndicatorItem = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

export async function GET() {
  try {
    const res = await fetch(MINDICADOR_URL, {
      next: { revalidate: CACHE_MAX_AGE },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Mindicador ${res.status}`);
    const data = (await res.json()) as MindicadorResponse;

    const formatClp = (n: number) =>
      new Intl.NumberFormat('es-CL', { style: 'decimal', maximumFractionDigits: 0 }).format(n);
    const formatPct = (n: number) =>
      `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    const formatUsd = (n: number) =>
      `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const items: IndicatorItem[] = [];

    if (data.uf?.valor != null) {
      items.push({ id: 'uf', label: 'UF', value: `$${formatClp(data.uf.valor)}` });
    }
    if (data.dolar?.valor != null) {
      items.push({ id: 'dolar', label: 'Dólar', value: `$${formatClp(data.dolar.valor)}` });
    }
    if (data.euro?.valor != null) {
      items.push({ id: 'euro', label: 'Euro', value: `$${formatClp(data.euro.valor)}` });
    }
    if (data.tpm?.valor != null) {
      items.push({ id: 'tpm', label: 'TPM', value: formatPct(data.tpm.valor) });
    }
    if (data.libra_cobre?.valor != null) {
      items.push({ id: 'cobre', label: 'Cobre', value: formatUsd(data.libra_cobre.valor), unit: 'USD/lb' });
    }
    if (data.ipc?.valor != null) {
      items.push({ id: 'ipc', label: 'IPC', value: formatPct(data.ipc.valor) });
    }
    if (data.bitcoin?.valor != null) {
      items.push({ id: 'btc', label: 'Bitcoin', value: formatUsd(data.bitcoin.valor) });
    }

    return NextResponse.json({ items, fecha: data.uf?.fecha ?? new Date().toISOString() });
  } catch (e) {
    console.error('Indicators API error:', e);
    return NextResponse.json(
      { items: [], error: 'Error al cargar indicadores' },
      { status: 502 }
    );
  }
}
