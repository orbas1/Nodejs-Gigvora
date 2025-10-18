import { useMemo } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import IdVerificationManagement from '../../../components/admin/id-verification/IdVerificationManagement.jsx';
import useSession from '../../../hooks/useSession.js';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../../constants/adminDashboardMenu.js';

const ACTIVE_MENU_ITEM_ID = 'admin-identity-verification';

const AVAILABLE_DASHBOARDS = Object.freeze(['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']);

export default function AdminIdentityVerificationPage() {
  const { session } = useSession();

  const operator = useMemo(() => {
    const name = session?.name ?? session?.user?.name ?? 'Admin';
    const email = session?.email ?? session?.user?.email ?? null;
    return {
      name,
      email,
    };
  }, [session]);

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Identity"
      subtitle="Verification"
      description="Queue, review, and automation controls"
      menuSections={ADMIN_DASHBOARD_MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={ACTIVE_MENU_ITEM_ID}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-60px_rgba(15,118,110,0.45)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">ID Desk</h1>
              <p className="text-sm text-slate-600">Everything for KYC in one workspace.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 shadow-inner">
              <p className="font-semibold text-emerald-800">{operator.name}</p>
              {operator.email ? <p className="text-xs text-emerald-600">{operator.email}</p> : null}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <IdVerificationManagement />
        </section>
      </div>
    </DashboardLayout>
  );
}
