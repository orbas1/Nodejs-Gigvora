import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import EscrowSummaryCards from '../../components/company/escrow/EscrowSummaryCards.jsx';
import EscrowAccountsPanel from '../../components/company/escrow/EscrowAccountsPanel.jsx';
import EscrowTransactionsPanel from '../../components/company/escrow/EscrowTransactionsPanel.jsx';
import EscrowAutomationPanel from '../../components/company/escrow/EscrowAutomationPanel.jsx';
import EscrowDisputesPanel from '../../components/company/escrow/EscrowDisputesPanel.jsx';
import EscrowActivityPanel from '../../components/company/escrow/EscrowActivityPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanyEscrowManagement } from '../../hooks/useCompanyEscrowManagement.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];

const SECTION_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'flow', label: 'Flow' },
  { id: 'automation', label: 'Automation' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'activity', label: 'Activity' },
];

function buildProfile(data) {
  const workspace = data?.workspace ?? {};
  const profile = data?.profile ?? {};
  const displayName = profile.companyName ?? workspace.name ?? 'Company workspace';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const summary = data?.summary ?? {};

  return {
    name: displayName,
    role: 'Escrow & treasury',
    initials: initials || 'CO',
    status: summary.openDisputes ? 'Monitoring disputes' : 'Funds flowing',
    badges: summary.openDisputes ? ['Disputes active'] : ['Automated releases'],
    metrics: [
      { label: 'In escrow', value: summary.totalBalance?.toLocaleString?.() ?? summary.totalBalance ?? '—' },
      { label: 'Pending release', value: summary.pendingRelease?.toLocaleString?.() ?? summary.pendingRelease ?? '—' },
    ],
  };
}

export default function CompanyEscrowManagementPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('overview');
  const sectionRefs = useRef({});

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? memberships.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/escrow' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, memberships]);

  const {
    data,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    createAccount,
    updateAccount,
    initiateTransaction,
    releaseTransaction,
    refundTransaction,
    updateAutomation,
  } = useCompanyEscrowManagement({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
    enabled: isAuthenticated && isCompanyMember,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const topEntry = visible[0];
          setActiveSection(topEntry.target.dataset.sectionId);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    SECTION_NAV.forEach((section) => {
      const node = sectionRefs.current[section.id];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [data]);

  const registerSectionRef = (id) => (node) => {
    if (node) {
      sectionRefs.current[id] = node;
    }
  };

  useEffect(() => {
    const defaultWorkspaceId = data?.meta?.selectedWorkspaceId;

    if (workspaceIdParam == null && defaultWorkspaceId != null && defaultWorkspaceId !== '') {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const currentValue = previous.get('workspaceId');
          if (currentValue === `${defaultWorkspaceId}`) {
            return previous;
          }
          next.set('workspaceId', `${defaultWorkspaceId}`);
          return next;
        },
        { replace: true },
      );
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Escrow"
        subtitle="Company funds"
        description="Access requires company finance membership."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={['user', 'freelancer', 'agency']}
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const profile = useMemo(() => buildProfile(data), [data]);
  const currency = data?.workspace?.defaultCurrency ?? 'USD';
  const summary = data?.summary ?? null;

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
      next.delete('workspaceSlug');
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('lookbackDays', value);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  const handleNavClick = (sectionId) => {
    const node = sectionRefs.current[sectionId];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Escrow"
      subtitle="Company funds"
      description="Real-time custody, automation, and dispute controls."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      profile={profile}
      availableDashboards={['company', 'agency', 'headhunter', 'user', 'freelancer']}
      activeMenuItem="escrow-management"
    >
      <div className="lg:flex lg:items-start lg:gap-10">
        <nav className="mb-6 flex shrink-0 overflow-x-auto pb-3 lg:sticky lg:top-28 lg:mb-0 lg:h-fit lg:w-40 lg:flex-col lg:overflow-visible lg:pb-0">
          <div className="flex gap-2 lg:flex-col">
            {SECTION_NAV.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleNavClick(section.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition lg:w-full ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 space-y-12">
          <section
            id="overview"
            data-section-id="overview"
            ref={registerSectionRef('overview')}
            className="space-y-6 scroll-mt-28"
          >
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
                  Workspace
                </label>
                <select
                  id="workspace-select"
                  value={data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? ''}
                  onChange={handleWorkspaceChange}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Primary workspace</option>
                  {workspaceOptions.map((option) => (
                    <option key={option.id ?? option.slug ?? option.name} value={option.id ?? option.slug}>
                      {option.name ?? option.label ?? option.slug ?? `Workspace ${option.id}`}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lookback</span>
                <select
                  value={lookbackDays}
                  onChange={handleLookbackChange}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {LOOKBACK_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      Last {option} days
                    </option>
                  ))}
                </select>
              </div>
              <DataStatus loading={loading} error={error} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />
            </div>

            <EscrowSummaryCards
              summary={summary}
              currency={currency}
              accounts={data?.accounts ?? []}
              transactions={data?.transactions ?? []}
              releaseQueue={data?.releaseQueue ?? []}
              disputes={data?.disputes ?? []}
            />
          </section>

          <section
            id="accounts"
            data-section-id="accounts"
            ref={registerSectionRef('accounts')}
            className="scroll-mt-28"
          >
            <EscrowAccountsPanel
              accounts={data?.accounts ?? []}
              members={data?.members ?? []}
              onCreate={createAccount}
              onUpdate={updateAccount}
            />
          </section>

          <section id="flow" data-section-id="flow" ref={registerSectionRef('flow')} className="scroll-mt-28">
            <EscrowTransactionsPanel
              transactions={data?.transactions ?? []}
              releaseQueue={data?.releaseQueue ?? []}
              accounts={data?.accounts ?? []}
              onInitiate={initiateTransaction}
              onRelease={releaseTransaction}
              onRefund={refundTransaction}
              currentUserId={session?.id}
            />
          </section>

          <section
            id="automation"
            data-section-id="automation"
            ref={registerSectionRef('automation')}
            className="scroll-mt-28"
          >
            <EscrowAutomationPanel automation={data?.automation} onUpdate={updateAutomation} currentUserId={session?.id} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div id="disputes" data-section-id="disputes" ref={registerSectionRef('disputes')} className="scroll-mt-28">
              <EscrowDisputesPanel disputes={data?.disputes ?? []} />
            </div>
            <div id="activity" data-section-id="activity" ref={registerSectionRef('activity')} className="scroll-mt-28">
              <EscrowActivityPanel activity={data?.recentActivity ?? []} />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
