import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  HandThumbUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import { useHeadhunterDashboard } from '../../hooks/useHeadhunterDashboard.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const menuSections = [
  {
    label: 'Prospecting',
    items: [
      {
        name: 'Prospect discovery',
        description: 'Advanced search across Gigvora talent, projects, referrals, and external signals.',
        tags: ['AI sourcing'],
      },
      {
        name: 'Market maps',
        description: 'Track target companies, competitor org charts, and hiring movements.',
      },
      {
        name: 'Outreach playbooks',
        description: 'Sequenced campaigns, messaging templates, and analytics for conversions.',
      },
    ],
  },
  {
    label: 'Pipeline execution',
    items: [
      {
        name: 'Prospect pipeline',
        description: 'Stage-based pipeline from discovery to offer with scoring, notes, and attachments.',
      },
      {
        name: 'Interview coordination',
        description: 'Plan intro calls, client interviews, prep sessions, and debriefs in one hub.',
      },
      {
        name: 'Pass-on center',
        description: 'Share candidates with partner companies or agencies with insights and fit notes.',
      },
    ],
  },
  {
    label: 'Partnerships & insights',
    items: [
      {
        name: 'Client management',
        description: 'Manage retainers, success fees, contracts, and hiring mandates.',
      },
      {
        name: 'Performance analytics',
        description: 'Placement rates, time-to-submit, interview-to-offer ratios, and revenue.',
      },
      {
        name: 'Calendar & availability',
        description: 'Personal calendar, shared calendars with clients, and availability broadcasting.',
      },
    ],
  },
];

const availableDashboards = ['headhunter', 'company', 'agency'];

const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const SUMMARY_ICONS = [BriefcaseIcon, UserGroupIcon, ClockIcon, ChartBarIcon];

const DEFAULT_PROFILE = {
  name: 'Skyline Search',
  role: 'Executive Headhunter Collective',
  initials: 'SS',
  status: 'Active mandates in 3 sectors',
  badges: ['Platinum headhunter', 'Preferred partner'],
  metrics: [
    { label: 'Active mandates', value: '12' },
    { label: 'Candidates interviewing', value: '37' },
    { label: 'Placements YTD', value: '18' },
    { label: 'Win rate', value: '72%' },
  ],
};

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  return formatAbsolute(value, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatStageValue(stage, currency) {
  if (!stage) return '—';
  return formatCurrency(stage.valueTotal ?? 0, currency);
}

export default function HeadhunterDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const {
    data,
    error,
    loading,
    refresh,
    fromCache,
    lastUpdated,
    summaryCards,
  } = useHeadhunterDashboard({ workspaceId: workspaceIdParam, lookbackDays });

  const selectedWorkspaceId = data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? null;

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const currency = data?.workspaceSummary?.defaultCurrency ?? 'USD';

  const activeProfile = useMemo(() => {
    if (!data?.workspaceSummary) {
      return DEFAULT_PROFILE;
    }
    const workspace = data.workspaceSummary;
    const initials = workspace.name
      ? workspace.name
          .split(' ')
          .map((part) => part.charAt(0))
          .join('')
          .slice(0, 3)
          .toUpperCase()
      : 'HH';

    const derivedMetrics = summaryCards.map((card) => ({ label: card.label, value: `${card.value}` }));

    return {
      name: workspace.name ?? DEFAULT_PROFILE.name,
      role: workspace.type ? `${workspace.type.charAt(0).toUpperCase()}${workspace.type.slice(1)} workspace` : DEFAULT_PROFILE.role,
      initials,
      status: workspace.health?.badges?.[0] ?? DEFAULT_PROFILE.status,
      badges: workspace.health?.badges?.length ? workspace.health.badges : DEFAULT_PROFILE.badges,
      metrics: derivedMetrics,
    };
  }, [data?.workspaceSummary, summaryCards]);

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const nextLookback = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextLookback) {
      next.set('lookbackDays', nextLookback);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  const pipelineSummary = data?.pipelineSummary ?? {};
  const stageBreakdown = pipelineSummary.stageBreakdown ?? [];
  const agingBuckets = pipelineSummary.agingBuckets ?? {};
  const candidateSpotlight = data?.candidateSpotlight ?? [];
  const mandatePortfolio = data?.mandatePortfolio ?? { totals: {}, mandates: [] };
  const outreachPerformance = data?.outreachPerformance ?? {};
  const passOnNetwork = data?.passOnNetwork ?? { candidates: [] };
  const activityTimeline = data?.activityTimeline ?? [];
  const calendar = data?.calendar ?? { upcoming: [], workload: {} };
  const clientPartnerships = data?.clientPartnerships ?? { topContacts: [] };
  const hasWorkspaceScopedData = data?.meta?.hasWorkspaceScopedData ?? false;
  const fallbackReason = data?.meta?.fallbackReason ?? null;

  return (
    <DashboardLayout
      currentDashboard="headhunter"
      title="Headhunter Deal Desk"
      subtitle="Prospecting, pipeline, and partnerships"
      description="Purpose-built for executive search teams to discover prospects, manage pipelines, orchestrate interviews, and collaborate with clients using pass-on workflows."
      menuSections={menuSections}
      profile={activeProfile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Command center overview</h2>
              <p className="text-sm text-slate-600">
                Monitor mandate load, candidate momentum, and team performance in one view.
              </p>
            </div>
            <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={refresh} />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message ?? 'Failed to load headhunter metrics. Please try refreshing.'}
            </div>
          ) : null}

          {fallbackReason && !loading ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {fallbackReason}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Workspace
              <select
                value={selectedWorkspaceId ?? ''}
                onChange={handleWorkspaceChange}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {workspaceOptions.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Lookback
              <select
                value={lookbackDays}
                onChange={handleLookbackChange}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {LOOKBACK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} days
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => {
              const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
              return (
                <div
                  key={card.label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pipeline health</h2>
              <p className="text-sm text-slate-600">
                Stage progression, conversion velocity, and bottlenecks across the active search portfolio.
              </p>
            </div>
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Screening conversion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.screening)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Interview conversion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.interviewing)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Offer acceptance</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.offers)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Placements from offers</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.placements)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stageBreakdown.map((stage) => (
              <div key={stage.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{stage.label}</p>
                  <span className="text-xs text-slate-500">{stage.count} candidates</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(stage.percentage ?? 0, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatStageValue(stage, currency)} • {formatPercent(stage.percentage)} of pipeline
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {Object.entries(agingBuckets).map(([bucket, count]) => (
              <span
                key={bucket}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1"
              >
                <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  {bucket} days: <strong className="text-slate-800">{count}</strong>
                </span>
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Candidate spotlight</h3>
              <UserGroupIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Candidate</th>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Interviews</th>
                    <th className="px-3 py-2 text-left">Last interaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidateSpotlight.length ? (
                    candidateSpotlight.map((candidate) => (
                      <tr key={candidate.userId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{candidate.name}</div>
                          <div className="text-xs text-slate-500">{candidate.headline ?? '—'}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {candidate.activeApplication?.stage ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{candidate.interviews ?? 0}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {candidate.lastInteractionAt ? formatRelativeTime(candidate.lastInteractionAt) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">
                        No candidates are currently spotlighted for this workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Pass-on network</h3>
              <HandThumbUpIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-600">
              Managed referrals ready to be matched with partner mandates.
            </p>
            <div className="space-y-3">
              {passOnNetwork.candidates?.length ? (
                passOnNetwork.candidates.map((entry) => (
                  <div
                    key={`${entry.applicantId}-${entry.sharedAt}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
                        <p className="text-xs text-slate-500">{entry.primarySkill ?? 'Generalist'}</p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {entry.lastStage}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                        {entry.referredTo ?? 'Open referral'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                        {entry.sharedAt ? formatRelativeTime(entry.sharedAt) : 'Pending share'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <EnvelopeOpenIcon className="h-4 w-4 text-blue-500" />
                        {entry.nextStep ?? 'Awaiting update'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No pass-on candidates logged in the selected window.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Mandate portfolio</h3>
            <BriefcaseIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Mandate</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Pipeline value</th>
                  <th className="px-3 py-2 text-left">Open roles</th>
                  <th className="px-3 py-2 text-left">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mandatePortfolio.mandates?.length ? (
                  mandatePortfolio.mandates.map((mandate) => (
                    <tr key={mandate.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{mandate.title}</div>
                        <div className="text-xs text-slate-500">{mandate.location ?? 'Remote'}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{mandate.status ?? 'active'}</td>
                      <td className="px-3 py-2 text-slate-600">{formatCurrency(mandate.value, currency)}</td>
                      <td className="px-3 py-2 text-slate-600">{mandate.openRoles}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {mandate.lastActivityAt ? formatRelativeTime(mandate.lastActivityAt) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">
                      No mandates are linked to this workspace during the selected lookback.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Outreach performance</h3>
            <ArrowPathIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active campaigns</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{outreachPerformance.campaignCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total touchpoints</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{outreachPerformance.totalMessages ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg response time</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {outreachPerformance.averageResponseHours != null
                  ? `${outreachPerformance.averageResponseHours.toFixed(1)}h`
                  : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Response rate</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatPercent((outreachPerformance.responseRate ?? 0) * 100)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Channel breakdown</h4>
              <div className="space-y-2">
                {outreachPerformance.channelBreakdown?.length ? (
                  outreachPerformance.channelBreakdown.map((entry) => (
                    <div
                      key={entry.channel}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <span className="capitalize">{entry.channel}</span>
                      <span>
                        {entry.responses ?? 0}/{entry.sent ?? 0} responses • {formatPercent((entry.conversion ?? 0) * 100)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No outreach sequences logged during this window.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Latest campaigns</h4>
              <div className="space-y-2">
                {outreachPerformance.latestCampaigns?.length ? (
                  outreachPerformance.latestCampaigns.map((campaign) => (
                    <div
                      key={campaign.threadId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <p className="font-semibold text-slate-800">{campaign.subject}</p>
                      <p className="text-xs text-slate-500">
                        {campaign.touchpoints} touchpoints • Last reply{' '}
                        {campaign.lastReplyAt ? formatRelativeTime(campaign.lastReplyAt) : 'pending'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No active campaigns to display.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Client partnerships</h3>
              <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              {clientPartnerships.topContacts?.length ? (
                clientPartnerships.topContacts.map((contact) => (
                  <div
                    key={contact.userId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">{contact.name}</p>
                    <p className="text-xs text-slate-500">{contact.company ?? contact.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last interaction: {contact.lastInteractionAt ? formatRelativeTime(contact.lastInteractionAt) : '—'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No recent client interactions logged.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Upcoming schedule</h3>
              <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              {calendar.upcoming?.length ? (
                calendar.upcoming.map((event, index) => (
                  <div
                    key={`${event.applicationId}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">{event.label}</p>
                    <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No upcoming events scheduled in this timeframe.
                </div>
              )}
            </div>
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                Interviews this week: <strong className="text-slate-800">{calendar.workload?.interviewsThisWeek ?? 0}</strong>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                Offers pending: <strong className="text-slate-800">{calendar.workload?.offersPending ?? 0}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Activity timeline</h3>
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {activityTimeline.length ? (
              activityTimeline.map((event, index) => (
                <div
                  key={`${event.label}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{event.label}</p>
                    <p className="text-xs text-slate-500">{event.stage}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatRelativeTime(event.date)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No timeline events recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
