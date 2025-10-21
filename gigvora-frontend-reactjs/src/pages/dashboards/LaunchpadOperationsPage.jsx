import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useOpportunityListing from '../../hooks/useOpportunityListing.js';
import { fetchLaunchpadWorkflow } from '../../services/launchpad.js';
import { formatRelativeTime } from '../../utils/date.js';

const MENU_SECTIONS = [
  {
    label: 'Workflow views',
    items: [
      {
        id: 'overview',
        sectionId: 'overview',
        name: 'Mission control',
        description: 'Readiness, velocity, and intake posture.',
      },
      {
        id: 'intake-triage',
        sectionId: 'intake-triage',
        name: 'Intake triage',
        description: 'Prioritise screening queues.',
      },
      {
        id: 'interview-coordination',
        sectionId: 'interview-coordination',
        name: 'Interview coordination',
        description: 'Schedule and move talent through conversations.',
      },
      {
        id: 'placements',
        sectionId: 'placements',
        name: 'Placement runway',
        description: 'Track experience assignments and alumni.',
      },
      {
        id: 'employer-briefs',
        sectionId: 'employer-briefs',
        name: 'Employer briefs',
        description: 'Manage partner demand and SLAs.',
      },
      {
        id: 'automation',
        sectionId: 'automation',
        name: 'Automation radar',
        description: 'Auto-assignments and matching insights.',
      },
    ],
  },
];

const LOOKBACK_OPTIONS = [
  { value: 30, label: 'Last 30 days' },
  { value: 45, label: 'Last 45 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
];

const ALLOWED_ROLES = ['admin', 'mentor'];

function formatScore(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(1)}`;
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-2 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}

function CandidateList({ items, emptyState }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">{emptyState ?? 'Nothing in this lane just yet.'}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const applicant = item.applicant ?? {};
        const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ').trim();
        const readiness = item.readiness ?? {};
        const score = readiness.score == null ? null : Math.round(readiness.score);
        return (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{fullName || `Application #${item.id}`}</div>
                <div className="text-xs text-slate-500">{applicant.email ?? 'Email shared post-confirmation'}</div>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Readiness {score ?? '—'}</span>
              {item.queueReason ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.queueReason}</span> : null}
              {readiness.targetSkills?.length ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                  Growth: {readiness.targetSkills.slice(0, 3).join(', ')}
                </span>
              ) : null}
            </div>
            <div className="mt-3 text-xs text-slate-400">Updated {formatRelativeTime(item.updatedAt)}</div>
          </li>
        );
      })}
    </ul>
  );
}

function PlacementList({ items, emptyState }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">{emptyState ?? 'No placements yet.'}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((placement) => {
        const candidate = placement.candidate ?? {};
        const applicant = candidate.applicant ?? {};
        const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ').trim();
        const employer = placement.employerRequest ?? {};
        return (
          <li key={placement.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{fullName || 'Launchpad candidate'}</div>
                <div className="text-xs text-slate-500">
                  {placement.targetType} • {placement.targetId ?? 'TBC'}
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {placement.status}
              </span>
            </div>
            {employer.organizationName ? (
              <div className="mt-2 text-xs text-slate-500">{employer.organizationName}</div>
            ) : null}
            <div className="mt-2 text-xs text-slate-400">
              {placement.placementDate ? `Placed ${formatRelativeTime(placement.placementDate)}` : 'Placement scheduling pending'}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MatchList({ items }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No automated matches detected in the selected window.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((match) => {
        const bestCandidate = match.bestCandidate ?? {};
        const percentage = Math.round((bestCandidate.score ?? 0) * 100);
        return (
          <li key={match.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{match.opportunity?.title ?? 'Experience opportunity'}</div>
                <div className="text-xs text-slate-500">{match.targetType} • {match.targetId ?? 'TBC'}</div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  match.autoAssigned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {match.autoAssigned ? 'Auto-assign ready' : 'Recommended'}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {bestCandidate.name ?? 'Candidate'} • Match score {Number.isFinite(percentage) ? `${percentage}%` : '—'}
            </div>
            {bestCandidate.matchedSkills?.length ? (
              <div className="mt-1 text-xs text-slate-500">Skills: {bestCandidate.matchedSkills.join(', ')}</div>
            ) : null}
            {bestCandidate.learningMatches?.length ? (
              <div className="mt-1 text-xs text-slate-500">Learning goals: {bestCandidate.learningMatches.join(', ')}</div>
            ) : null}
            {match.opportunity?.summary ? (
              <div className="mt-2 text-xs text-slate-500">{match.opportunity.summary}</div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function LaunchpadOperationsPage() {
  const [query, setQuery] = useState('');
  const [selectedLaunchpadId, setSelectedLaunchpadId] = useState(null);
  const [lookback, setLookback] = useState(45);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { data: launchpadListing, loading: listingLoading, error: listingError } = useOpportunityListing(
    'launchpads',
    query,
    { pageSize: 50 },
  );

  const launchpads = useMemo(
    () => (Array.isArray(launchpadListing?.items) ? launchpadListing.items : []),
    [launchpadListing?.items],
  );

  useEffect(() => {
    if (!selectedLaunchpadId && launchpads.length) {
      setSelectedLaunchpadId(launchpads[0].id);
    }
  }, [launchpads, selectedLaunchpadId]);

  const loadWorkflow = useCallback(
    async (launchpadId, options = {}) => {
      if (!launchpadId) {
        setWorkflow(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLaunchpadWorkflow({ launchpadId, lookbackDays: options.lookbackDays ?? lookback });
        setWorkflow(result);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [lookback],
  );

  useEffect(() => {
    if (selectedLaunchpadId) {
      loadWorkflow(selectedLaunchpadId, { lookbackDays: lookback });
    }
  }, [selectedLaunchpadId, lookback, loadWorkflow]);

  const readinessSummary = workflow?.readinessSummary ?? {};

  const profile = useMemo(
    () => ({
      name: workflow?.launchpad?.title ?? 'Launchpad operations',
      role: workflow?.launchpad?.track ? `${workflow.launchpad.track} experience track` : 'Experience Launchpad mission control',
      initials: workflow?.launchpad?.title ? workflow.launchpad.title.slice(0, 2).toUpperCase() : 'LP',
      metrics: [
        {
          label: 'Active applications',
          value: readinessSummary.totalApplications ?? 0,
        },
        {
          label: 'Auto-interview recommended',
          value: readinessSummary.autoInterviewRecommended ?? 0,
        },
      ],
    }),
    [workflow?.launchpad, readinessSummary.totalApplications, readinessSummary.autoInterviewRecommended],
  );

  const handleRefresh = useCallback(() => {
    if (selectedLaunchpadId) {
      loadWorkflow(selectedLaunchpadId, { lookbackDays: lookback });
    }
  }, [selectedLaunchpadId, lookback, loadWorkflow]);

  const menuSections = useMemo(() => MENU_SECTIONS, []);

  const intakeQueue = workflow?.intake?.queue ?? [];
  const interviewQueue = workflow?.interviews?.queue ?? [];
  const placementActive = workflow?.placements?.active ?? [];
  const placementReady = workflow?.placements?.readyCandidates ?? [];
  const placementCompleted = workflow?.placements?.completed ?? [];
  const employerQueue = workflow?.employerBriefs?.queue ?? [];
  const matchHighlights = workflow?.automation?.highlights ?? [];

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="launchpad"
        title="Experience Launchpad operations"
        subtitle="Coordinate talent, interviews, and partner demand from a single mission control."
        description="Monitor readiness, orchestrate assignments, and keep cohorts on track with the latest telemetry."
        menuSections={menuSections}
        profile={profile}
        activeMenuItem={null}
      >
      <div className="space-y-12">
        <section id="overview" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Mission control</h2>
                <p className="text-sm text-slate-600">
                  Select a cohort to analyse readiness, respond to bottlenecks, and deploy experiences.
                </p>
              </div>
              <DataStatus loading={loading} fromCache={false} lastUpdated={lastUpdated} onRefresh={handleRefresh} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cohort
                <select
                  value={selectedLaunchpadId ?? ''}
                  onChange={(event) => setSelectedLaunchpadId(event.target.value || null)}
                  className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="" disabled>
                    {listingLoading ? 'Loading cohorts…' : 'Select cohort'}
                  </option>
                  {launchpads.map((launchpad) => (
                    <option key={launchpad.id} value={launchpad.id}>
                      {launchpad.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lookback window
                <select
                  value={lookback}
                  onChange={(event) => setLookback(Number(event.target.value))}
                  className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {LOOKBACK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search cohorts
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by track or mentor"
                  className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>
            {listingError ? (
              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Unable to load launchpad listing. {listingError.message ?? 'Please retry.'}
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Unable to load workflow telemetry. {error.message ?? 'Please retry.'}
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Active applications"
              value={readinessSummary.totalApplications ?? 0}
              helper={`${readinessSummary.flaggedCandidates ?? 0} waitlisted · ${readinessSummary.upskillingCandidates ?? 0} building skills`}
            />
            <SummaryCard
              label="Average readiness"
              value={formatScore(readinessSummary.averageReadinessScore)}
              helper={`${readinessSummary.autoInterviewRecommended ?? 0} recommended for interview`}
            />
            <SummaryCard
              label="Matches tracked"
              value={workflow?.automation?.totalMatches ?? 0}
              helper={`${workflow?.automation?.autoAssignable ?? 0} auto-assign ready`}
            />
            <SummaryCard
              label="Placements in motion"
              value={workflow?.placements?.active?.length ?? 0}
              helper={`${workflow?.placements?.totals?.scheduled ?? 0} scheduled · ${workflow?.placements?.totals?.in_progress ?? 0} delivering`}
            />
          </div>
        </section>

        <section id="intake-triage" className="space-y-4">
          <SectionHeader
            title="Intake triage"
            description="Review new applicants and prioritise those aligned to growth goals or employer demand."
            icon={UsersIcon}
          />
          <CandidateList
            items={intakeQueue}
            emptyState={loading ? 'Syncing intake queue…' : 'Intake queue is clear.'}
          />
        </section>

        <section id="interview-coordination" className="space-y-4">
          <SectionHeader
            title="Interview coordination"
            description="Track scheduling gaps and keep interview-ready talent moving."
            icon={ClipboardDocumentCheckIcon}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="text-sm font-semibold text-slate-900">Upcoming interviews</div>
              <CandidateList
                items={workflow?.interviews?.upcoming ?? []}
                emptyState={loading ? 'Gathering interview roster…' : 'No scheduled interviews in this window.'}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="text-sm font-semibold text-slate-900">Needs scheduling</div>
              <CandidateList
                items={interviewQueue.filter((entry) => !entry.interviewScheduledAt)}
                emptyState={loading ? 'Reviewing interview queue…' : 'Every interview is scheduled. Great work!'}
              />
            </div>
          </div>
        </section>

        <section id="placements" className="space-y-6">
          <SectionHeader
            title="Placement runway"
            description="Manage active experiences, deployment-ready talent, and alumni outcomes."
            icon={BriefcaseIcon}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">In delivery</div>
                <span className="text-xs text-slate-500">
                  {workflow?.placements?.totals?.in_progress ?? 0} active
                </span>
              </div>
              <PlacementList items={placementActive} emptyState={loading ? 'Loading placements…' : 'No live placements right now.'} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Ready for placement</div>
                <span className="text-xs text-slate-500">{placementReady.length} candidates</span>
              </div>
              <CandidateList
                items={placementReady}
                emptyState={loading ? 'Evaluating candidate bench…' : 'No accepted candidates awaiting placement.'}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Alumni wrap-up</div>
                <span className="text-xs text-slate-500">{placementCompleted.length} recent</span>
              </div>
              <PlacementList
                items={placementCompleted}
                emptyState={loading ? 'Checking alumni outcomes…' : 'No completed placements in this window.'}
              />
            </div>
          </div>
        </section>

        <section id="employer-briefs" className="space-y-4">
          <SectionHeader
            title="Employer briefs"
            description="Align partner demand, respond to SLAs, and unlock new experiences."
            icon={ArrowPathIcon}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            {employerQueue?.length ? (
              <ul className="space-y-3">
                {employerQueue.map((brief) => (
                  <li key={brief.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{brief.organizationName}</div>
                        <div className="text-xs text-slate-500">
                          {brief.engagementTypes?.join(', ') || 'Flexible engagement'} • Headcount {brief.headcount ?? 'TBC'}
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {brief.status}
                      </span>
                    </div>
                    {brief.idealCandidateProfile ? (
                      <div className="mt-2 text-xs text-slate-500">Ideal profile: {brief.idealCandidateProfile}</div>
                    ) : null}
                    <div className="mt-2 text-xs text-slate-400">Updated {formatRelativeTime(brief.updatedAt)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{loading ? 'Syncing employer demand…' : 'No employer briefs pending review.'}</p>
            )}
          </div>
        </section>

        <section id="automation" className="space-y-4">
          <SectionHeader
            title="Automation radar"
            description="Surface machine-suggested pairings and monitor match quality."
            icon={BoltIcon}
          />
          <MatchList items={matchHighlights} />
        </section>
      </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
