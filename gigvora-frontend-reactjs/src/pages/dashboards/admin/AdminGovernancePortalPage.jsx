import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminGovernanceLayout from '../../../components/admin/AdminGovernanceLayout.jsx';
import GovernanceSummaryCards from '../../../components/admin/governance/GovernanceSummaryCards.jsx';
import GovernancePolicySnapshot from '../../../components/admin/governance/GovernancePolicySnapshot.jsx';
import GovernanceActivityTimeline from '../../../components/admin/governance/GovernanceActivityTimeline.jsx';
import ContentApprovalQueue from '../../../components/admin/governance/ContentApprovalQueue.jsx';
import useSession from '../../../hooks/useSession.js';
import { fetchAdminGovernanceOverview } from '../../../services/adminGovernance.js';

const MENU_CONFIG = [
  {
    label: 'Governance',
    items: [
      { id: 'governance-overview', name: 'Overview', sectionId: 'governance-overview' },
      { id: 'governance-content', name: 'Content queue', sectionId: 'governance-content' },
      { id: 'governance-legal', name: 'Legal & policies', sectionId: 'governance-legal' },
    ],
  },
  {
    label: 'Shortcuts',
    items: [
      { id: 'governance-policies', name: 'Policy manager', href: '/dashboard/admin/governance/policies' },
      { id: 'governance-documents', name: 'Document workflows', href: '/dashboard/admin/governance/documents' },
      { id: 'moderation-console', name: 'Moderation', href: '/dashboard/admin/moderation' },
    ],
  },
];

const SECTIONS = [
  { id: 'governance-overview', title: 'Overview' },
  { id: 'governance-content', title: 'Content queue' },
  { id: 'governance-legal', title: 'Legal & policies' },
];

const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_QUEUE_LIMIT = 6;
const DEFAULT_TIMELINE_LIMIT = 10;

export default function AdminGovernancePortalPage() {
  const navigate = useNavigate();
  const { session } = useSession();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdminGovernanceOverview({
        lookbackDays: DEFAULT_LOOKBACK_DAYS,
        queueLimit: DEFAULT_QUEUE_LIMIT,
        timelineLimit: DEFAULT_TIMELINE_LIMIT,
      });
      const payload = response?.data ?? response;
      setOverview(payload ?? null);
      setFromCache(Boolean(payload?.fromCache));
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load governance overview.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const lookbackDays = overview?.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const contentSummary = overview?.contentQueue?.summary ?? {};
  const topSubmissions = overview?.contentQueue?.topSubmissions ?? [];
  const legalPolicies = overview?.legalPolicies ?? {};
  const activity = overview?.activity ?? [];

  const headerActions = useMemo(
    () => [
      {
        label: 'Policy manager',
        onClick: () => navigate('/dashboard/admin/governance/policies'),
        variant: 'primary',
      },
      {
        label: 'Document workflows',
        onClick: () => navigate('/dashboard/admin/governance/documents'),
        variant: 'secondary',
      },
    ],
    [navigate],
  );

  const statusDescription = overview ? (
    <p className="text-xs text-slate-500">
      Covering the last {lookbackDays} days of content moderation, policy publications, and audit activity.
    </p>
  ) : null;

  const currentUserId = session?.user?.id ?? null;

  return (
    <AdminGovernanceLayout
      session={session}
      title="Governance control centre"
      subtitle="Admin portal & compliance"
      description="Monitor moderation load, policy status, and legal audits from one enterprise console."
      menuConfig={MENU_CONFIG}
      sections={SECTIONS}
      statusLabel="Live telemetry"
      statusChildren={statusDescription}
      lastUpdated={overview?.generatedAt}
      loading={loading}
      error={error}
      onRefresh={loadOverview}
      fromCache={fromCache}
      headerActions={headerActions}
      onNavigate={(href) => navigate(href)}
    >
      <section id="governance-overview" className="space-y-6">
        <GovernanceSummaryCards
          contentSummary={contentSummary}
          policyTotals={legalPolicies?.totals}
          versionTotals={legalPolicies?.versionTotals}
          upcomingCount={legalPolicies?.upcomingEffective?.length ?? 0}
          lookbackDays={lookbackDays}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Queue highlights</h3>
            <p className="text-xs text-slate-400">Top {DEFAULT_QUEUE_LIMIT} submissions in review</p>
          </div>
          {topSubmissions.length ? (
            <ul className="mt-4 space-y-3">
              {topSubmissions.map((submission) => (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{submission.title}</p>
                    <p className="text-xs text-slate-500">
                      {submission.referenceType.replace(/_/g, ' ')} · {submission.referenceId}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1 shadow-sm">{submission.status}</span>
                    <span className="rounded-full bg-white px-2 py-1 shadow-sm">Priority {submission.priority}</span>
                    <span className="rounded-full bg-white px-2 py-1 shadow-sm">Severity {submission.severity}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              The moderation queue is clear. New submissions will appear here as they are flagged for review.
            </p>
          )}
        </div>
      </section>

      <section id="governance-content" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Content approval queue</h2>
          <p className="text-xs text-slate-500">Claim, assign, and triage high-impact submissions.</p>
        </div>
        <ContentApprovalQueue currentUserId={currentUserId} defaultFilters={{ pageSize: DEFAULT_QUEUE_LIMIT }} />
      </section>

      <section id="governance-legal" className="space-y-6">
        <GovernancePolicySnapshot
          recentPublications={legalPolicies?.recentPublications}
          upcomingEffective={legalPolicies?.upcomingEffective}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Activity timeline</h3>
            <p className="text-xs text-slate-500">Latest moderation actions and policy audit events.</p>
          </div>
          <GovernanceActivityTimeline events={activity} />
        </div>
      </section>
    </AdminGovernanceLayout>
  );
}
