import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import GigOperationsWorkspace from '../../components/projectGigManagement/GigOperationsWorkspace.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanyOrders } from '../../hooks/useCompanyOrders.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const MENU_SECTIONS = COMPANY_DASHBOARD_MENU_SECTIONS;
const AVAILABLE_DASHBOARDS = ['company', 'agency', 'headhunter', 'user'];

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function CompanyOrdersPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const {
    data,
    metrics,
    permissions,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    createOrder,
    updateOrder,
    addTimelineEvent,
    postMessage,
    createEscrow,
    updateEscrow,
    submitReview,
  } = useCompanyOrders({ enabled: isAuthenticated && isCompanyMember });

  const summaryCards = useMemo(() => {
    return [
      {
        label: 'Total orders',
        value: metrics.totalOrders ?? 0,
      },
      {
        label: 'Open orders',
        value: metrics.openOrders ?? 0,
      },
      {
        label: 'Value in flight',
        value: formatCurrency(metrics.valueInFlight ?? 0, metrics.currency ?? 'USD'),
      },
      {
        label: 'Escrow held',
        value: formatCurrency(metrics.escrowHeldAmount ?? 0, metrics.currency ?? 'USD'),
      },
    ];
  }, [metrics.currency, metrics.escrowHeldAmount, metrics.openOrders, metrics.totalOrders, metrics.valueInFlight]);

  const defaultAuthorName = useMemo(() => session?.displayName ?? session?.name ?? session?.email ?? null, [session]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/orders' }} />;
  }

  if (!isCompanyMember) {
    const fallbackDashboards = memberships.filter((membership) => membership !== 'company');
    const alternativeDashboards = fallbackDashboards.length
      ? fallbackDashboards
      : AVAILABLE_DASHBOARDS.filter((dashboard) => dashboard !== 'company');
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Orders control center"
        subtitle="Coordinate vendor fulfilment and delivery milestones"
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <AccessDeniedPanel
          role="company"
          availableDashboards={alternativeDashboards}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Orders control center"
      subtitle="Coordinate vendor fulfilment, monitor escrow, and keep delivery timelines on track."
      description="Track every gig order in one production-grade console. Launch new vendor engagements, capture updates, and release escrow with executive oversight."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Gig delivery operations</h1>
            <p className="text-sm text-slate-600">
              Review order health, orchestrate milestones, and communicate with vendors in real time.
            </p>
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load orders workspace.'}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm">
          <GigOperationsWorkspace
            data={data ?? { purchasedGigs: { orders: [] } }}
            canManage={permissions?.canManageOrders !== false}
            onCreateOrder={createOrder}
            onUpdateOrder={updateOrder}
            onAddTimelineEvent={addTimelineEvent}
            onPostMessage={postMessage}
            onCreateEscrow={createEscrow}
            onUpdateEscrow={(orderId, checkpointId, payload) => updateEscrow(orderId, checkpointId, payload)}
            onSubmitReview={submitReview}
            defaultAuthorName={defaultAuthorName}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
