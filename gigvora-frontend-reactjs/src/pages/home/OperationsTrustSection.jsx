import { Link } from 'react-router-dom';
import {
  BuildingLibraryIcon,
  ShieldCheckIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

const FALLBACK_OPERATIONS_METRICS = {
  escrowHealth: {
    label: 'Escrow health',
    value: '99.2% uptime',
    change: '+1.4%',
    trend: [74, 82, 88, 91, 95, 98, 99],
  },
  disputeVelocity: {
    label: 'Dispute velocity',
    value: '3.2 hrs median',
    change: '-22%',
    trend: [18, 16, 14, 12, 9, 7, 6],
  },
  evidencePipelines: {
    label: 'Evidence pipelines',
    value: '87% automated',
    change: '+9%',
    trend: [45, 48, 56, 62, 70, 78, 84],
  },
};

function normaliseMetric(source = {}, fallback = {}) {
  const trendArray = Array.isArray(source?.trend)
    ? source.trend.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value))
    : undefined;

  return {
    label: source?.label ?? fallback.label,
    value: source?.value ?? source?.metric ?? fallback.value,
    change: source?.change ?? source?.delta ?? fallback.change,
    trend: trendArray && trendArray.length ? trendArray : fallback.trend,
  };
}

function normaliseOperationsSummary(summary) {
  const escrowHealth = normaliseMetric(summary?.escrowHealth, FALLBACK_OPERATIONS_METRICS.escrowHealth);
  const disputeVelocity = normaliseMetric(summary?.disputeVelocity, FALLBACK_OPERATIONS_METRICS.disputeVelocity);
  const evidencePipelines = normaliseMetric(summary?.evidencePipelines, FALLBACK_OPERATIONS_METRICS.evidencePipelines);

  return {
    escrowHealth,
    disputeVelocity,
    evidencePipelines,
  };
}

function SparkBarChart({ values, tone = 'accent' }) {
  const safeValues = Array.isArray(values) && values.length ? values : [50];
  const max = Math.max(...safeValues, 1);
  const paletteClass =
    tone === 'rose'
      ? 'from-rose-500/20 via-rose-400/40 to-rose-300/70'
      : 'from-accent/30 via-accent/50 to-accent/80';

  return (
    <div className="mt-6 flex h-12 items-end gap-1" aria-hidden="true">
      {safeValues.map((value, index) => {
        const height = Math.max((value / max) * 100, 4);
        return (
          <span
            key={`spark-${index}`}
            style={{ height: `${height}%` }}
            className={`w-1.5 rounded-full bg-gradient-to-t ${paletteClass}`}
          />
        );
      })}
    </div>
  );
}

function MetricSummary({ label, value, change }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-2">
      <p className="text-base font-semibold text-slate-900">{value}</p>
      {change ? <span className="text-xs font-semibold text-emerald-600">{change}</span> : null}
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">{label}</span>
    </div>
  );
}

function AnimatedCard({ icon: Icon, title, description, metric, tone = 'accent', footer }) {
  const hoverBorderClass = tone === 'rose' ? 'hover:border-rose-300' : 'hover:border-accent/60';
  const gradientClass = tone === 'rose' ? 'from-rose-50 via-white to-white' : 'from-sky-50 via-white to-white';
  const iconClass = tone === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-accent/10 text-accent';

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft transition duration-300 hover:-translate-y-1 ${hoverBorderClass}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100" aria-hidden="true">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
      </div>
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <MetricSummary {...metric} />
      <SparkBarChart values={metric.trend} tone={tone} />
      {footer ? <div className="mt-6 text-xs font-medium text-slate-500">{footer}</div> : null}
    </article>
  );
}

export function OperationsTrustSection({ homeData, loading, error }) {
  const { escrowHealth, disputeVelocity, evidencePipelines } = normaliseOperationsSummary(homeData?.operationsSummary ?? {});

  return (
    <section className="relative overflow-hidden bg-slate-50 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[15%] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Trust operations
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Control the heartbeat of finance, security, and admin in one sweep
            </h2>
            <p className="text-base text-slate-600">
              Monitor escrow health, dispute velocity, and evidence pipelines before you even open the console. The control tower keeps the signals warm so every admin move lands safely.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            {error ? (
              <span className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-600 shadow-soft">
                {typeof error === 'string' ? error : 'Unable to refresh operations metrics.'}
              </span>
            ) : null}
            {loading ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 shadow-soft">
                Syncing telemetry…
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <AnimatedCard
            icon={BuildingLibraryIcon}
            title="Finance control tower"
            description="Escrow health stays in the green with proactive release queues and reserve checks."
            metric={escrowHealth}
            footer="Tap into the finance workspace for live release approvals and ledger exports."
          />
          <AnimatedCard
            icon={ShieldCheckIcon}
            title="Security & compliance telemetry"
            description="Dispute velocity highlights which cases need live intervention."
            metric={disputeVelocity}
            tone="rose"
            footer="Drill into the Trust Center to escalate cases or trigger mediation playbooks."
          />
          <AnimatedCard
            icon={SwatchIcon}
            title="Admin controls"
            description="Evidence pipelines prime decision logs before audits arrive."
            metric={evidencePipelines}
            footer="One jump away from analytics dashboards and policy guardrails."
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 text-sm font-semibold text-accent md:flex-row md:items-center md:justify-between">
          <Link
            to="/trust-center"
            className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/80 px-5 py-2 text-accent shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
          >
            Open Trust Center
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/dashboard/company/analytics"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-400"
          >
            Jump to company analytics
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OperationsTrustSection;
