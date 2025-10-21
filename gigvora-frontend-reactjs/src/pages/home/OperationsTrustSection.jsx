import { Link } from 'react-router-dom';
import {
  ArrowUpRightIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

function toArray(values, fallback) {
  if (Array.isArray(values) && values.length) {
    return values
      .map((value) => {
        const number = Number.parseFloat(value);
        return Number.isFinite(number) ? number : null;
      })
      .filter((value) => value !== null);
  }
  return fallback;
}

function extractMetric(source, { fallbackValue, fallbackChange, fallbackSpark, type = 'auto' }) {
  if (!source) {
    return {
      value: fallbackValue,
      change: fallbackChange,
      spark: fallbackSpark,
    };
  }

  const base = typeof source === 'object' && !Array.isArray(source) ? source : { value: source };

  const rawValue =
    base.display ??
    base.formatted ??
    base.value ??
    base.metric ??
    base.score ??
    base.rate ??
    base.percentage ??
    base.percent ??
    base.count ??
    base.total;

  const numericValue = Number.parseFloat(rawValue);
  const isNumeric = Number.isFinite(numericValue);

  const resolvedType =
    type === 'auto'
      ? (() => {
          if (!isNumeric) {
            return 'text';
          }
          if (numericValue <= 1) {
            return 'percent';
          }
          if (numericValue > 1000 && !String(rawValue).includes('%')) {
            return 'number';
          }
          return 'text';
        })()
      : type;

  let value;
  if (!isNumeric) {
    value = rawValue ?? fallbackValue;
  } else if (resolvedType === 'percent') {
    const scaled =
      (type === 'percent' || resolvedType === 'percent') && numericValue <= 1 ? numericValue * 100 : numericValue;
    value = `${scaled.toFixed(scaled >= 99 ? 1 : 0)}%`;
  } else if (resolvedType === 'currency') {
    const currency = base.currency ?? 'USD';
    try {
      value = new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        minimumFractionDigits: numericValue >= 1000 ? 0 : 2,
      }).format(numericValue);
    } catch (error) {
      value = `${currency} ${numericValue.toLocaleString()}`;
    }
  } else if (resolvedType === 'hours') {
    value = `${numericValue.toFixed(0)}h`;
  } else {
    const decimals = numericValue < 10 && Math.abs(Math.round(numericValue) - numericValue) > 0.001 ? 1 : 0;
    const formatted =
      resolvedType === 'number'
        ? new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(numericValue)
        : numericValue.toFixed(decimals);
    value = `${formatted}${base.unit ?? ''}`.trim();
  }

  const rawChange =
    base.change ?? base.delta ?? base.diff ?? base.difference ?? base.changePercentage ?? base.changePercent;
  let change = fallbackChange;
  if (rawChange !== undefined && rawChange !== null) {
    if (typeof rawChange === 'string') {
      change = rawChange.trim();
    } else if (Number.isFinite(Number.parseFloat(rawChange))) {
      const changeNumber = Number.parseFloat(rawChange);
      change = `${changeNumber > 0 ? '+' : ''}${changeNumber.toFixed(Math.abs(changeNumber) < 10 ? 1 : 0)}%`;
    }
  }

  const spark = toArray(base.spark ?? base.trend ?? base.history ?? base.samples ?? base.series, fallbackSpark);

  return {
    value: value ?? fallbackValue,
    change: change ?? fallbackChange,
    spark: spark ?? fallbackSpark,
  };
}

function SparkBar({ values = [], tone = 'accent', label }) {
  if (!values.length) {
    return null;
  }
  const max = Math.max(...values.map((value) => Math.abs(value)));
  const minHeight = 8;
  const palette = {
    accent: 'bg-accent/70',
    emerald: 'bg-emerald-400/80',
    sky: 'bg-sky-300/80',
  };
  const barClass = palette[tone] ?? palette.accent;

  return (
    <div className="mt-6" aria-hidden="true">
      <div className="flex h-14 items-end gap-1">
        {values.map((value, index) => {
          const height = max === 0 ? minHeight : Math.max(minHeight, Math.round((Math.abs(value) / max) * 56));
          return <span key={`${value}-${index}`} className={`flex-1 rounded-full ${barClass}`} style={{ height }} />;
        })}
      </div>
      {label ? <p className="sr-only">{label}</p> : null}
    </div>
  );
}

function ChangeBadge({ change }) {
  if (!change) {
    return null;
  }

  const normalized = typeof change === 'string' ? change.trim() : `${change}`;
  const isNegative = normalized.startsWith('-');
  const tone = isNegative ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <ArrowTrendingUpIcon className={`h-4 w-4 ${isNegative ? 'rotate-180' : ''}`} aria-hidden="true" />
      {normalized.replace(/([+-])/, '$1 ')}
    </span>
  );
}

export function OperationsTrustSection({ loading, error, summary }) {
  const cards = [
    {
      key: 'finance',
      title: 'Finance control tower',
      highlight: 'Escrow health',
      description: 'Stay ahead of releases and reconciliations with a real-time escrow control surface.',
      summaryKey: 'escrowHealth',
      fallback: {
        metric: '99.2%',
        change: '+0.4%',
        spark: [88, 90, 91, 94, 96, 98, 99],
        detail: 'On-time releases',
      },
      icon: BanknotesIcon,
      tone: 'emerald',
      link: { to: '/trust-center', label: 'Open trust centre' },
    },
    {
      key: 'security',
      title: 'Security & compliance telemetry',
      highlight: 'Dispute velocity',
      description: 'Surface caseload pace and blockers so compliance, support, and finance stay in lockstep.',
      summaryKey: 'disputeVelocity',
      fallback: {
        metric: '36h',
        change: '-12%',
        spark: [64, 58, 52, 48, 44, 40, 36],
        detail: 'Median resolution time',
      },
      icon: ShieldCheckIcon,
      tone: 'sky',
      link: { to: '/dashboard/company/analytics', label: 'View analytics' },
    },
    {
      key: 'admin',
      title: 'Admin controls',
      highlight: 'Evidence pipelines',
      description: 'Automate evidence collection across chats, files, and milestones to keep records defensible.',
      summaryKey: 'evidencePipelines',
      fallback: {
        metric: '92%',
        change: '+8%',
        spark: [68, 72, 75, 81, 86, 90, 92],
        detail: 'Pipelines auto-satisfied',
      },
      icon: Cog6ToothIcon,
      tone: 'accent',
      link: { to: '/trust-center', label: 'Review playbooks' },
    },
  ];

  const resolvedCards = cards.map((card) => {
    const metric = extractMetric(summary?.[card.summaryKey], {
      fallbackValue: card.fallback.metric,
      fallbackChange: card.fallback.change,
      fallbackSpark: card.fallback.spark,
      type: card.summaryKey === 'disputeVelocity' ? 'hours' : card.summaryKey === 'escrowHealth' ? 'percent' : 'percent',
    });

    return {
      ...card,
      metric: metric.value ?? card.fallback.metric,
      change: metric.change ?? card.fallback.change,
      spark: metric.spark ?? card.fallback.spark,
      detail: summary?.[card.summaryKey]?.detail ?? summary?.[card.summaryKey]?.label ?? card.fallback.detail,
    };
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 text-white">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -ml-96 hidden w-[1200px] rounded-full bg-accent/10 blur-3xl lg:block" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Operations trust
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">Operations telemetry, ready for launch</h2>
            <p className="text-base text-white/70">
              Monitor escrow health, dispute velocity, and evidence pipelines in one place. Metrics refresh near real-time to keep finance, compliance, and support aligned.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            {loading ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">Syncing live ops data…</span>
            ) : null}
            {error ? (
              <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                Preview metrics unavailable — showing trusted defaults.
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {resolvedCards.map((card) => (
            <article
              key={card.key}
              className="group relative overflow-hidden rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_rgba(15,23,42,0.4)] transition hover:border-accent/40 hover:bg-white/10"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <card.icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{card.highlight}</p>
                  <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
                </div>
              </div>

              <p className="mt-4 text-sm text-white/70">{card.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{card.detail}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{card.metric}</p>
                </div>
                <ChangeBadge change={card.change} />
              </div>

              <SparkBar values={card.spark} tone={card.tone} label={`${card.highlight} sparkline`} />

              <div className="mt-8">
                <Link
                  to={card.link.to}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-white"
                >
                  {card.link.label}
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OperationsTrustSection;
