'use server';

import { importData } from '@/src/services/import.service';

const SAMPLE_DATA = {
  investmentsCsv: `name,category,capitalInvested,currentValue,returnPct,monthlyIncome
Fondo A,FFMM,5000000,5200000,0.04,20000
Acción X,ACCIONES,1000000,1100000,0.10,0`,
  liabilitiesCsv: `name,category,balance,monthlyPayment,interestRate
Crédito Hipotecario,HIPOTECARIO,80000000,450000,0.089
Tarjeta SANTANDER,SANTANDER,500000,150000,0.24`,
  cashflowCsv: `month,income,expenses
2026-01,1200000,600000
2026-02,1150000,620000`,
  rentalsCsv: `propertyName,monthlyRent,status
Depto Las Condes,450000,RENTED
Casa Providencia,0,VACANT`,
};

export async function importSampleData() {
  const tenantId = process.env.FOID_TENANT_ID || 'g3';
  try {
    await importData({
      tenantId,
      ...SAMPLE_DATA,
    });
    return { ok: true as const };
  } catch (e) {
    console.error('Import sample error:', e);
    return { ok: false as const, error: 'Error al importar datos de ejemplo' };
  }
}

export async function importCsv(formData: FormData) {
  const tenantId = process.env.FOID_TENANT_ID || 'g3';
  const investmentsCsv = (formData.get('investmentsCsv') as string)?.trim();
  const liabilitiesCsv = (formData.get('liabilitiesCsv') as string)?.trim();
  const cashflowCsv = (formData.get('cashflowCsv') as string)?.trim();
  const rentalsCsv = (formData.get('rentalsCsv') as string)?.trim();

  try {
    await importData({
      tenantId,
      investmentsCsv: investmentsCsv || undefined,
      liabilitiesCsv: liabilitiesCsv || undefined,
      cashflowCsv: cashflowCsv || undefined,
      rentalsCsv: rentalsCsv || undefined,
    });
    return { ok: true as const };
  } catch (e) {
    console.error('Import error:', e);
    return { ok: false as const, error: 'Error al importar datos' };
  }
}
