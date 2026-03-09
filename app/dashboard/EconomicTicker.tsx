'use client';

import { useEffect, useState } from 'react';

type IndicatorItem = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

const FALLBACK_ITEMS: IndicatorItem[] = [
  { id: 'uf', label: 'UF', value: '—' },
  { id: 'dolar', label: 'Dólar', value: '—' },
  { id: 'euro', label: 'Euro', value: '—' },
  { id: 'tpm', label: 'TPM', value: '—' },
  { id: 'cobre', label: 'Cobre', value: '—', unit: 'USD/lb' },
  { id: 'ipc', label: 'IPC', value: '—' },
  { id: 'btc', label: 'Bitcoin', value: '—' },
];

export function EconomicTicker() {
  const [items, setItems] = useState<IndicatorItem[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/indicators')
      .then((r) => r.json())
      .then((data) => {
        if (data.items?.length) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayItems = items.length > 0 ? items : FALLBACK_ITEMS;
  const duplicated = [...displayItems, ...displayItems, ...displayItems, ...displayItems];

  return (
    <div className="shrink-0 h-8 min-h-8 bg-slate-900/95 border-t border-slate-800 overflow-hidden flex items-center">
      <div className="flex-1 overflow-hidden">
        <div className={`flex items-center gap-8 py-1 w-max ${!loading && items.length > 0 ? 'animate-ticker-scroll' : ''}`}>
          {duplicated.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="flex items-center gap-2 shrink-0 text-xs"
            >
              <span className="text-slate-500 font-medium">{item.label}</span>
              <span className="text-slate-200 font-semibold tabular-nums">
                {item.value}
                {item.unit && <span className="text-slate-500 ml-0.5">{item.unit}</span>}
              </span>
              <span className="text-slate-600">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
