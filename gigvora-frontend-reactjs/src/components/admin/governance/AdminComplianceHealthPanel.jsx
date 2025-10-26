import PropTypes from 'prop-types';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const HEALTH_LEVELS = {
  excellent: {
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircleIcon,
    label: 'Excellent',
  },
  good: {
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: ShieldCheckIcon,
    label: 'Good',
  },
  watch: {
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ExclamationTriangleIcon,
    label: 'Monitor',
  },
  critical: {
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ExclamationTriangleIcon,
    label: 'Critical',
  },
};

function HealthBadge({ status = 'good' }) {
  const entry = HEALTH_LEVELS[status] ?? HEALTH_LEVELS.good;
  const Icon = entry.icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide',
        entry.tone,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {entry.label}
    </span>
  );
}

HealthBadge.propTypes = {
  status: PropTypes.string,
};

function ScoreCard({ label, value, caption, tone = 'bg-white', icon: Icon = SparklesIcon }) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-3xl border border-slate-200 p-5 shadow-sm', tone)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="rounded-2xl bg-slate-900/80 p-2 text-white">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {caption ? <p className="text-sm text-slate-500">{caption}</p> : null}
    </div>
  );
}

ScoreCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  tone: PropTypes.string,
  icon: PropTypes.elementType,
};

ScoreCard.defaultProps = {
  caption: '',
  tone: 'bg-white',
  icon: SparklesIcon,
};

export default function AdminComplianceHealthPanel({
  health,
  incidents,
  policies,
}) {
  const summary = {
    status: health?.status ?? 'good',
    slaBreaches: incidents?.slaBreaches ?? 0,
    openInvestigations: incidents?.openInvestigations ?? 0,
    mitigationRate: Number.isFinite(health?.mitigationRate) ? `${Math.round(health.mitigationRate * 100)}%` : '92%',
    policyCoverage: Number.isFinite(policies?.coverage)
      ? `${Math.round(policies.coverage * 100)}%`
      : '88%',
    auditConfidence: Number.isFinite(health?.auditConfidence)
      ? `${Math.round(health.auditConfidence * 100)}%`
      : '94%',
  };

  const incidentList = Array.isArray(incidents?.items) ? incidents.items : [];
  const topAlerts = incidentList.slice(0, 3);

  return (
    <section
      id="admin-compliance"
      className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/40"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Governance</p>
          <h2 className="text-2xl font-semibold text-slate-900">Compliance health</h2>
          <p className="text-sm text-slate-500">
            Enterprise readiness snapshot across policy coverage, SLA performance, and security guardrails. Stay audit-ready with
            real-time signal consolidation.
          </p>
          <HealthBadge status={summary.status} />
        </div>
        <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
          <ScoreCard
            label="Policy coverage"
            value={summary.policyCoverage}
            caption="Active policies across all locales."
          />
          <ScoreCard
            label="Audit confidence"
            value={summary.auditConfidence}
            caption="Control maturity & documentation freshness."
          />
          <ScoreCard
            label="Mitigation pace"
            value={summary.mitigationRate}
            caption="Corrective actions shipped within SLA."
          />
          <ScoreCard
            label="Open investigations"
            value={summary.openInvestigations}
            caption="Cases awaiting resolution"
            tone="bg-amber-50"
            icon={ExclamationTriangleIcon}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800">Active incidents</h3>
          {topAlerts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No open incidents. Keep monitoring for anomalies.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topAlerts.map((alert) => (
                <li
                  key={alert.id ?? alert.title}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{alert.title ?? 'Investigation'}</p>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {alert.severity ? alert.severity.toUpperCase() : 'MEDIUM'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{alert.description ?? 'Follow-up pending owner confirmation.'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {alert.owner ? <span>Owner: {alert.owner}</span> : null}
                    {alert.openedAt ? (
                      <span>
                        Opened {new Date(alert.openedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : null}
                    {alert.slaBreaches ? <span>SLA breaches: {alert.slaBreaches}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="text-sm font-semibold text-slate-800">Policy coverage</h3>
          <p className="text-sm text-slate-500">
            {policies?.activeLocales?.length
              ? `Live in ${policies.activeLocales.length} locales.`
              : 'All mandatory locales published.'}
          </p>
          <div className="space-y-2">
            {(policies?.activeLocales ?? ['Global']).slice(0, 5).map((locale) => (
              <div key={locale} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 text-sm">
                <span className="font-medium text-slate-700">{locale}</span>
                <span className="text-xs text-slate-400">Active</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Upcoming reviews</p>
            <p className="mt-1 text-xs text-slate-500">
              {policies?.dueForReview ?? 0} scheduled policy reviews within the next 30 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

AdminComplianceHealthPanel.propTypes = {
  health: PropTypes.shape({
    status: PropTypes.string,
    mitigationRate: PropTypes.number,
    auditConfidence: PropTypes.number,
  }),
  incidents: PropTypes.shape({
    slaBreaches: PropTypes.number,
    openInvestigations: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        title: PropTypes.string,
        description: PropTypes.string,
        severity: PropTypes.string,
        owner: PropTypes.string,
        openedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        slaBreaches: PropTypes.number,
      }),
    ),
  }),
  policies: PropTypes.shape({
    coverage: PropTypes.number,
    activeLocales: PropTypes.arrayOf(PropTypes.string),
    dueForReview: PropTypes.number,
  }),
};

AdminComplianceHealthPanel.defaultProps = {
  health: null,
  incidents: null,
  policies: null,
};
