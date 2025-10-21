import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

MetricCard.defaultProps = {
  hint: null,
};

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}

Pill.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function AgencyHubSection({ dashboard, loading, error, lastUpdated, fromCache, onRefresh }) {
  const summary = dashboard?.summary ?? {};
  const creationStudio = dashboard?.creationStudio ?? {};
  const upcomingLaunches = creationStudio?.summary?.upcomingLaunches ?? [];
  const leadership = dashboard?.marketplaceLeadership ?? {};
  const talentLifecycle = dashboard?.talentLifecycle ?? {};
  const orchestratorHighlights = dashboard?.operations?.workspaceOrchestrator?.clientDashboards ?? [];
  const brand = dashboard?.agencyProfile ?? {};

  const metrics = [
    {
      label: 'Active members',
      value: formatNumber(summary.members?.active ?? summary.members ?? 0),
      hint: 'Advisors, producers, and operators onboarded.',
    },
    {
      label: 'Projects in flight',
      value: formatNumber(summary.projects?.active ?? summary.projects ?? 0),
      hint: 'Managed service engagements currently running.',
    },
    {
      label: 'Gig programmes',
      value: formatNumber(summary.gigs?.total ?? 0),
      hint: 'Packages live across the marketplace.',
    },
    {
      label: 'Job placements',
      value: formatNumber(summary.jobs?.total ?? 0),
      hint: 'Opportunities curated for talent pods.',
    },
    {
      label: 'Payments distributed',
      value: formatCurrency(summary.paymentsDistribution?.totalValue ?? 0, summary.financials?.currency ?? 'USD'),
      hint: 'Cleared to creators, partners, and teams this quarter.',
    },
    {
      label: 'Client NPS',
      value: summary.clients?.nps != null ? Number(summary.clients.nps).toFixed(1) : '4.7',
      hint: 'Satisfaction across retained accounts.',
    },
  ];

  const studioStats = [
    { label: 'Drafts', value: creationStudio?.summary?.drafts ?? 0 },
    { label: 'Scheduled', value: creationStudio?.summary?.scheduled ?? 0 },
    { label: 'Published', value: creationStudio?.summary?.published ?? 0 },
  ];

  const leadershipHighlights = (
    leadership?.studio?.insights ?? leadership?.studio?.summary ?? creationStudio?.summary?.highlights ?? []
  )
    .slice(0, 3)
    .map((entry) => (typeof entry === 'string' ? entry : entry?.title ?? entry?.label))
    .filter(Boolean);

  const talentSignals = [
    talentLifecycle?.summary?.headline,
    talentLifecycle?.summary?.placementVelocity
      ? `${talentLifecycle.summary.placementVelocity} days to placement`
      : null,
    talentLifecycle?.summary?.favourites
      ? `${formatNumber(talentLifecycle.summary.favourites)} favourited mentors`
      : null,
  ].filter(Boolean);

  const brandPills = [
    brand?.tagline,
    brand?.sectorFocus,
    brand?.region,
    brand?.websiteUrl,
  ].filter(Boolean);

  return (
    <section
      id="agency-hub"
      className="space-y-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Hub</p>
          <h2 className="text-3xl font-semibold text-slate-900">Profile, community, and talent HQ</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Operate your brand, collaborations, and launchpads with live intelligence that keeps clients, talent, and partners aligned.
          </p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          fromCache={fromCache}
          onRefresh={onRefresh}
          statusLabel="Hub telemetry"
        />
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Creation Studio pipeline</h3>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {studioStats.map((stat) => (
              <Pill key={stat.label}>
                {stat.label}: {formatNumber(stat.value)}
              </Pill>
            ))}
          </div>
          {upcomingLaunches.length ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {upcomingLaunches.slice(0, 3).map((launch) => (
                <div key={launch.id ?? launch.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-500">
                    <span>{launch.targetType ?? launch.type ?? 'Launch'}</span>
                    <span>{formatDate(launch.launchDate ?? launch.goLiveAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{launch.title ?? 'Untitled launch'}</p>
                  {launch.summary ? <p className="mt-1 text-xs text-slate-500">{launch.summary}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No launches queued. Use Creation Studio to draft your next gig, CV, or community activation.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Brand snapshot</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {brandPills.length ? brandPills.map((item) => <Pill key={item}>{item}</Pill>) : <p className="text-sm text-slate-500">Add brand tagline, sectors, and URL from profile management.</p>}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              HQ: <span className="font-semibold text-slate-900">{brand.headquarters ?? 'Remote-first'}</span>
            </p>
            <p>
              Operating model: <span className="font-semibold text-slate-900">{brand.operatingModel ?? 'Hybrid crews'}</span>
            </p>
            <p>
              Preferred verticals: <span className="font-semibold text-slate-900">{brand.verticals?.join(', ') ?? 'Multi-sector'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Client dashboards</h3>
          {orchestratorHighlights.length ? (
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {orchestratorHighlights.slice(0, 4).map((item) => (
                <li key={item.blueprintId ?? item.clientName ?? item.status} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.clientName ?? 'Client workspace'}</p>
                  <p className="text-xs text-slate-500">{item.status ?? 'Active'}</p>
                  {item.experienceSummary ? <p className="mt-1 text-xs text-slate-500">{item.experienceSummary}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Keep client dashboards linked to share experience notes and SOW guardrails.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Leadership signals</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {leadershipHighlights.length ? (
              leadershipHighlights.map((entry) => (
                <div key={entry} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  {entry}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Use marketplace leadership panels to log alliances, advocacy plays, and marketing experiments.</p>
            )}
          </div>
          {talentSignals.length ? (
            <div className="mt-4 space-y-2 text-xs uppercase tracking-wide text-slate-400">
              {talentSignals.map((signal) => (
                <div key={signal}>{signal}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

AgencyHubSection.propTypes = {
  dashboard: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object, PropTypes.string]),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  onRefresh: PropTypes.func,
};

AgencyHubSection.defaultProps = {
  dashboard: null,
  loading: false,
  error: null,
  lastUpdated: null,
  fromCache: false,
  onRefresh: null,
};

