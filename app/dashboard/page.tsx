import { getOverview } from '@/src/services/overview.service';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const tenantId = process.env.FOID_TENANT_ID || 'g3';
  let data;
  try {
    data = await getOverview(tenantId);
  } catch (e) {
    console.error('Overview error:', e);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Error al cargar datos. Verifica la conexión a la base de datos.</p>
      </div>
    );
  }

  return <DashboardClient data={data} />;
}
