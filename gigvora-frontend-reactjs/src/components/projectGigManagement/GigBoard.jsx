import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime, formatDateLabel } from '../../utils/date.js';

const PIPELINE_STAGES = [
  {
    id: 'discovery',
    label: 'Discovery',
    description:
      'Brief intake, qualification, and persona fit analysis to confirm the request is actionable for the workspace.',
  },
  {
    id: 'pitching',
    label: 'Pitching',
    description:
      'Invited talent prepares proposals, attaches credentials, and collaborates asynchronously with reviewers.',
  },
  {
    id: 'interview',
    label: 'Interview',
    description:
      'Live conversations, async Q&A, and capability walkthroughs resolve outstanding questions before decision.',
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    description:
      'Scope, timeline, and commercials are refined with legal, compliance, and finance signals surfaced inline.',
  },
  {
    id: 'awarded',
    label: 'Awarded',
    description:
      'Selected partner is confirmed, kickoff assets are shared, and downstream project orchestration takes over.',
  },
];

const CONFIDENCE_SEGMENTS = [
  { id: 'all', label: 'All confidence' },
  { id: 'high', label: 'High confidence', min: 70 },
  { id: 'medium', label: 'Medium', min: 40, max: 69 },
  { id: 'low', label: 'Needs attention', max: 39 },
];

const SUCCESS_METRICS = [
  {
    id: 'fillRate',
    label: 'Fill rate',
    helper: 'Awarded gigs divided by submitted proposals within the last 30 days.',
    formatter: (value) => `${Math.round(value * 100)}%`,
  },
  {
    id: 'timeToInterview',
    label: 'Time to interview',
    helper: 'Median hours from pitch submission to first interview scheduling.',
    formatter: (value) => `${value?.toFixed?.(1) ?? value}h`,
  },
  {
    id: 'proposalQualityScore',
    label: 'Proposal quality index',
    helper: 'Composite score blending reviewer ratings, compliance completeness, and pitch resonance.',
    formatter: (value) => `${Math.round(value ?? 0)}/100`,
  },
];

function normaliseString(value) {
  return value?.toString().toLowerCase().trim() ?? '';
}

function opportunityMatchesQuery(opportunity, queryTokens) {
  if (!queryTokens.length) return true;
  const haystack = [
    opportunity.title,
    opportunity.client,
    opportunity.workspace,
    opportunity.nextAction,
    ...(opportunity.tags ?? []),
  ]
    .filter(Boolean)
    .map(normaliseString);
  return queryTokens.every((token) => haystack.some((value) => value.includes(token)));
}

function opportunityMatchesConfidence(opportunity, confidenceFilter) {
  if (confidenceFilter.id === 'all') return true;
  const score = opportunity.healthScore ?? 0;
  if (confidenceFilter.min && score < confidenceFilter.min) return false;
  if (confidenceFilter.max && score > confidenceFilter.max) return false;
  return true;
}

function computePipelineMetrics(opportunities) {
  const base = {
    total: opportunities.length,
    pipelineValue: 0,
    submittedProposals: 0,
    shortlisted: 0,
    awarded: 0,
    averageHealth: 0,
    responseTimeHours: [],
    proposalQuality: [],
  };

  if (!opportunities.length) {
    return { ...base, stageBreakdown: {} };
  }

  const stageBreakdown = {};
  let healthSum = 0;

  opportunities.forEach((opportunity) => {
    base.pipelineValue += opportunity.value ?? 0;
    base.submittedProposals += opportunity.proposals?.submitted ?? 0;
    base.shortlisted += opportunity.proposals?.shortlisted ?? 0;
    if (opportunity.stage === 'awarded') {
      base.awarded += 1;
    }
    healthSum += opportunity.healthScore ?? 0;
    if (typeof opportunity.responseTimeHours === 'number') {
      base.responseTimeHours.push(opportunity.responseTimeHours);
    }
    if (typeof opportunity.proposalQualityScore === 'number') {
      base.proposalQuality.push(opportunity.proposalQualityScore);
    }
    stageBreakdown[opportunity.stage] = (stageBreakdown[opportunity.stage] ?? 0) + 1;
  });

  return {
    ...base,
    stageBreakdown,
    averageHealth: healthSum / opportunities.length,
    averageResponseTime:
      base.responseTimeHours.reduce((sum, value) => sum + value, 0) /
      Math.max(base.responseTimeHours.length, 1),
    averageProposalQuality:
      base.proposalQuality.reduce((sum, value) => sum + value, 0) /
      Math.max(base.proposalQuality.length, 1),
  };
}

const opportunityShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  client: PropTypes.string.isRequired,
  workspace: PropTypes.string,
  stage: PropTypes.oneOf(PIPELINE_STAGES.map((stage) => stage.id)).isRequired,
  value: PropTypes.number,
  currency: PropTypes.string,
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  tags: PropTypes.arrayOf(PropTypes.string),
  proposals: PropTypes.shape({
    submitted: PropTypes.number,
    shortlisted: PropTypes.number,
  }),
  healthScore: PropTypes.number,
  responseTimeHours: PropTypes.number,
  proposalQualityScore: PropTypes.number,
  nextAction: PropTypes.string,
  owner: PropTypes.string,
  summary: PropTypes.string,
  personaFit: PropTypes.arrayOf(PropTypes.string),
  sentimentTrend: PropTypes.string,
  lastActivity: PropTypes.shape({
    at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    by: PropTypes.string,
  }),
  blockers: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      owner: PropTypes.string,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  activityLog: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      actor: PropTypes.string.isRequired,
    }),
  ),
  fillRate: PropTypes.number,
  timeToInterview: PropTypes.number,
});

function GigBoard({
  opportunities,
  persona,
  defaultStage = 'all',
  defaultQuery = '',
  onOpportunitySelect,
  onTelemetry,
}) {
  const [stageFilter, setStageFilter] = useState(defaultStage);
  const [confidenceFilterId, setConfidenceFilterId] = useState('all');
  const [query, setQuery] = useState(defaultQuery);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);

  const confidenceFilter = useMemo(
    () => CONFIDENCE_SEGMENTS.find((segment) => segment.id === confidenceFilterId) ?? CONFIDENCE_SEGMENTS[0],
    [confidenceFilterId],
  );

  const metrics = useMemo(() => computePipelineMetrics(opportunities), [opportunities]);

  const filteredOpportunities = useMemo(() => {
    const tokens = query
      .split(/\s+/)
      .map(normaliseString)
      .filter(Boolean);

    return opportunities
      .filter((opportunity) =>
        stageFilter === 'all' ? true : opportunity.stage === stageFilter,
      )
      .filter((opportunity) => opportunityMatchesConfidence(opportunity, confidenceFilter))
      .filter((opportunity) => opportunityMatchesQuery(opportunity, tokens))
      .sort((a, b) => {
        const aScore = a.healthScore ?? 0;
        const bScore = b.healthScore ?? 0;
        if (aScore === bScore) {
          const aUpdated = new Date(a.lastActivity?.at ?? 0).getTime();
          const bUpdated = new Date(b.lastActivity?.at ?? 0).getTime();
          return bUpdated - aUpdated;
        }
        return bScore - aScore;
      });
  }, [opportunities, stageFilter, confidenceFilter, query]);

  useEffect(() => {
    if (filteredOpportunities.length === 0) {
      setSelectedOpportunityId(null);
      return;
    }
    const match = filteredOpportunities.find((item) => item.id === selectedOpportunityId);
    setSelectedOpportunityId(match ? match.id : filteredOpportunities[0]?.id ?? null);
  }, [filteredOpportunities, selectedOpportunityId]);

  const selectedOpportunity = useMemo(
    () => filteredOpportunities.find((item) => item.id === selectedOpportunityId) ?? null,
    [filteredOpportunities, selectedOpportunityId],
  );

  useEffect(() => {
    if (!selectedOpportunity) return;
    onOpportunitySelect?.(selectedOpportunity);
  }, [selectedOpportunity, onOpportunitySelect]);

  useEffect(() => {
    if (!selectedOpportunity) return;
    onTelemetry?.('gigboard:view', {
      persona,
      stageFilter,
      confidenceFilter: confidenceFilter.id,
      opportunityId: selectedOpportunity.id,
    });
  }, [selectedOpportunity, persona, stageFilter, confidenceFilter, onTelemetry]);

  return (
    <div className="rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-10 shadow-soft">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Opportunities & execution
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">GigBoard</h2>
          <p className="text-sm text-slate-600">
            Command your pipeline with stage-aware analytics, confident prioritisation, and persona-calibrated cues that mirror
            the polish of LinkedIn or Instagram business surfaces.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricPill label="Active gigs" value={metrics.total} tone="indigo" />
          <MetricPill
            label="Pipeline value"
            value={metrics.pipelineValue ? `\u0024${metrics.pipelineValue.toLocaleString()}` : '—'}
            tone="emerald"
          />
          <MetricPill
            label="Avg. health"
            value={`${Math.round(metrics.averageHealth || 0)} / 100`}
            tone={metrics.averageHealth > 70 ? 'emerald' : metrics.averageHealth > 40 ? 'amber' : 'rose'}
          />
        </div>
      </header>

      <FilterBar
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        confidenceFilter={confidenceFilterId}
        onConfidenceChange={setConfidenceFilterId}
        query={query}
        onQueryChange={setQuery}
        metrics={metrics}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <EmptyState persona={persona} query={query} />
          ) : (
            filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                selected={opportunity.id === selectedOpportunityId}
                onSelect={() => setSelectedOpportunityId(opportunity.id)}
              />
            ))
          )}
        </div>
        <InsightsPanel metrics={metrics} selectedOpportunity={selectedOpportunity} />
      </div>
    </div>
  );
}

function MetricPill({ label, value, tone }) {
  const toneMap = {
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${toneMap[tone] ?? toneMap.indigo}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-base">{value}</p>
    </div>
  );
}

function FilterBar({
  stageFilter,
  onStageChange,
  confidenceFilter,
  onConfidenceChange,
  query,
  onQueryChange,
  metrics,
}) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStageChange('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              stageFilter === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({metrics.total})
          </button>
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageChange(stage.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                stageFilter === stage.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
              aria-pressed={stageFilter === stage.id}
            >
              {stage.label} ({metrics.stageBreakdown?.[stage.id] ?? 0})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={confidenceFilter}
            onChange={(event) => onConfidenceChange(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {CONFIDENCE_SEGMENTS.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-indigo-200">
            <span className="font-semibold uppercase tracking-wide text-slate-400">Search</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Title, client, tags"
              className="w-48 border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none"
              type="search"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity, selected, onSelect }) {
  return (
    <article
      className={`cursor-pointer rounded-3xl border p-5 transition shadow-sm ${
        selected
          ? 'border-indigo-300 bg-white shadow-lg shadow-indigo-200/40'
          : 'border-slate-200 bg-white/80 hover:border-indigo-200 hover:shadow-md'
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {opportunity.workspace ?? 'Workspace'}
            </span>
            {opportunity.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"
              >
                {tag}
              </span>
            ))}
            {opportunity.tags?.length > 3 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                +{opportunity.tags.length - 3}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{opportunity.title}</h3>
          <p className="text-sm text-slate-500">{opportunity.client}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
            {PIPELINE_STAGES.find((stage) => stage.id === opportunity.stage)?.label ?? opportunity.stage}
          </span>
          <span>Last touch {formatRelativeTime(opportunity.lastActivity?.at)}</span>
          {opportunity.lastActivity?.by ? <span>by {opportunity.lastActivity.by}</span> : null}
        </div>
      </header>

      <div className="mt-4 grid gap-4 text-sm text-slate-600 lg:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Value</p>
          <p className="text-base font-semibold text-slate-900">
            {opportunity.value
              ? `${opportunity.currency ?? '$'}${opportunity.value.toLocaleString()}`
              : 'Budget TBD'}
          </p>
          <p className="text-xs text-slate-500">Next milestone {formatDateLabel(opportunity.dueDate)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Proposals</p>
          <p>
            {opportunity.proposals?.shortlisted ?? 0} shortlisted · {opportunity.proposals?.submitted ?? 0} submitted
          </p>
          <p className="text-xs text-slate-500">Response in {opportunity.responseTimeHours ?? '—'}h</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Health</p>
          <div className="flex items-center gap-2">
            <div className="relative h-2 w-20 overflow-hidden rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: `${Math.max(Math.min(opportunity.healthScore ?? 0, 100), 0)}%` }}
              />
            </div>
            <span className="font-semibold text-slate-900">{Math.round(opportunity.healthScore ?? 0)}</span>
          </div>
          <p className="text-xs text-slate-500">Trend {opportunity.sentimentTrend ?? 'stable'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next action</p>
          <p className="font-semibold text-slate-900">{opportunity.nextAction ?? 'Review proposals'}</p>
          <p className="text-xs text-slate-500">Owner {opportunity.owner ?? 'Unassigned'}</p>
        </div>
      </div>

      {opportunity.blockers?.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <p className="font-semibold uppercase tracking-wide">Attention</p>
          <ul className="mt-2 space-y-1">
            {opportunity.blockers.map((blocker) => (
              <li key={blocker.label}>
                • {blocker.label}
                {blocker.owner ? ` · ${blocker.owner}` : ''}
                {blocker.dueDate ? ` · due ${formatDateLabel(blocker.dueDate, { includeTime: true })}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {opportunity.summary ? (
        <p className="mt-4 text-sm text-slate-600">{opportunity.summary}</p>
      ) : null}
    </article>
  );
}

function EmptyState({ persona, query }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-inner">
      <p className="text-sm font-semibold text-slate-900">No gigs match {query ? `“${query}”` : 'the filters'} yet.</p>
      <p className="mt-2 text-sm text-slate-500">
        {persona === 'founder'
          ? 'Invite your operations partner to publish upcoming gigs or sync CRM imports to populate the board.'
          : 'Adjust filters, connect sourcing integrations, or publish new opportunities to keep the pipeline active.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-2 text-white shadow hover:bg-slate-700"
        >
          Create gig
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-5 py-2 text-slate-600 hover:border-slate-400"
        >
          Import from ATS
        </button>
      </div>
    </div>
  );
}

function InsightsPanel({ metrics, selectedOpportunity }) {
  const aggregateFillRate = useMemo(() => {
    if (!metrics.submittedProposals) return null;
    return metrics.awarded / metrics.submittedProposals;
  }, [metrics.awarded, metrics.submittedProposals]);

  const aggregateTimeToInterview = useMemo(() => {
    if (!Number.isFinite(metrics.averageResponseTime)) return null;
    return metrics.averageResponseTime;
  }, [metrics.averageResponseTime]);

  const aggregateProposalQuality = useMemo(() => {
    if (!Number.isFinite(metrics.averageProposalQuality)) return null;
    return metrics.averageProposalQuality;
  }, [metrics.averageProposalQuality]);

  return (
    <aside className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline diagnostics</h3>
        <dl className="mt-4 grid gap-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conversion</dt>
            <dd className="text-base font-semibold text-slate-900">
              {metrics.submittedProposals ? `${Math.round((metrics.awarded / metrics.submittedProposals) * 100)}%` : '—'}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">Awarded vs submissions</dd>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Response speed</dt>
            <dd className="text-base font-semibold text-slate-900">
              {Number.isFinite(metrics.averageResponseTime)
                ? `${metrics.averageResponseTime.toFixed(1)}h`
                : '—'}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">Median time to acknowledge pitches</dd>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quality index</dt>
            <dd className="text-base font-semibold text-slate-900">
              {Number.isFinite(metrics.averageProposalQuality)
                ? `${Math.round(metrics.averageProposalQuality)}/100`
                : '—'}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">Reviewer feedback + compliance readiness</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Flow intelligence</h3>
        <ul className="mt-4 space-y-4">
          {PIPELINE_STAGES.map((stage, index) => {
            const isComplete = selectedOpportunity
              ? PIPELINE_STAGES.findIndex((item) => item.id === selectedOpportunity.stage) >= index
              : false;
            return (
              <li key={stage.id} className="rounded-2xl border border-indigo-200 bg-white/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-indigo-700">{stage.label}</p>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isComplete ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {isComplete ? 'In motion' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-indigo-600">{stage.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Success metrics</h3>
        <dl className="mt-4 space-y-4">
          {SUCCESS_METRICS.map((metric) => {
            let value = null;
            if (selectedOpportunity && metric.id in selectedOpportunity) {
              value = selectedOpportunity[metric.id];
            } else if (metric.id === 'fillRate') {
              value = aggregateFillRate;
            } else if (metric.id === 'timeToInterview') {
              value = aggregateTimeToInterview;
            } else if (metric.id === 'proposalQualityScore') {
              value = aggregateProposalQuality;
            }

            return (
              <div key={metric.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</dt>
                <dd className="text-base font-semibold text-slate-900">
                  {value == null ? '—' : metric.formatter(value)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">{metric.helper}</dd>
              </div>
            );
          })}
        </dl>
        {selectedOpportunity?.activityLog?.length ? (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest activity</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-500">
              {selectedOpportunity.activityLog.slice(0, 4).map((event) => (
                <li key={`${event.at}-${event.label}`} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-700">{event.label}</p>
                    <p className="text-[11px] text-slate-500">{formatRelativeTime(event.at)} · {event.actor}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </aside>
  );
}

GigBoard.propTypes = {
  opportunities: PropTypes.arrayOf(opportunityShape).isRequired,
  persona: PropTypes.string,
  defaultStage: PropTypes.oneOf(['all', ...PIPELINE_STAGES.map((stage) => stage.id)]),
  defaultQuery: PropTypes.string,
  onOpportunitySelect: PropTypes.func,
  onTelemetry: PropTypes.func,
};

GigBoard.defaultProps = {
  persona: 'operator',
  defaultStage: 'all',
  defaultQuery: '',
  onOpportunitySelect: undefined,
  onTelemetry: undefined,
};

MetricPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['indigo', 'emerald', 'amber', 'rose']).isRequired,
};

FilterBar.propTypes = {
  stageFilter: PropTypes.oneOf(['all', ...PIPELINE_STAGES.map((stage) => stage.id)]).isRequired,
  onStageChange: PropTypes.func.isRequired,
  confidenceFilter: PropTypes.string.isRequired,
  onConfidenceChange: PropTypes.func.isRequired,
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  metrics: PropTypes.shape({
    total: PropTypes.number,
    stageBreakdown: PropTypes.object,
  }).isRequired,
};

OpportunityCard.propTypes = {
  opportunity: opportunityShape.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

EmptyState.propTypes = {
  persona: PropTypes.string.isRequired,
  query: PropTypes.string.isRequired,
};

InsightsPanel.propTypes = {
  metrics: PropTypes.object.isRequired,
  selectedOpportunity: PropTypes.oneOfType([opportunityShape, PropTypes.oneOf([null])]),
};

InsightsPanel.defaultProps = {
  selectedOpportunity: null,
};

export default GigBoard;
