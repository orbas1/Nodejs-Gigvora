import { useMemo } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchFreelancerFinanceInsights } from '../../services/finance.js';

const DEFAULT_FREELANCER_ID = 2;

const BASE_MENU_SECTIONS = [
  {
    label: 'Service delivery',
    items: [
      {
        name: 'Project workspace dashboard',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
      },
      {
        name: 'Finance & insights',
        description: 'Loading finance insights…',
        href: '#finance-insights',
        icon: CurrencyDollarIcon,
      },
    ],
  },
];

const METRIC_ICON_MAP = {
  month_to_date_revenue: CurrencyDollarIcon,
  cash_available_for_payout: BanknotesIcon,
  outstanding_invoices: ClipboardDocumentListIcon,
  net_margin: ChartBarIcon,
};

function toNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(amount, currency = 'USD', { compact = true, maximumFractionDigits } = {}) {
  const numeric = toNumber(amount);
  if (numeric == null) {
    return '—';
  }
  const defaultMaximum = numeric >= 1000 ? 1 : 0;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: maximumFractionDigits ?? defaultMaximum,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: compact ? 'short' : undefined,
  });
  return formatter.format(numeric);
}

function formatPercentageValue(value, { decimals } = {}) {
  const numeric = toNumber(value);
  if (numeric == null) {
    return '—';
  }
  const fractionDigits = decimals ?? (Number.isInteger(numeric) ? 0 : 1);
  return `${numeric.toFixed(fractionDigits)}%`;
}

function resolveTrend(metric) {
  if (!metric) {
    return 'neutral';
  }
  if (metric.trend) {
    return metric.trend;
  }
  const change = toNumber(metric.changeValue);
  if (change == null) {
    return 'neutral';
  }
  if (change > 0) {
    return 'up';
  }
  if (change < 0) {
    return 'down';
  }
  return 'neutral';
}

function formatMetricValue(metric) {
  if (!metric) {
    return '—';
  }
  switch (metric.valueUnit) {
    case 'currency':
      return formatCurrency(metric.value, metric.currencyCode ?? 'USD');
    case 'percentage':
      return formatPercentageValue(metric.value);
    case 'ratio': {
      const numeric = toNumber(metric.value);
      if (numeric == null) {
        return '—';
      }
      return formatPercentageValue(numeric * 100, { decimals: 1 });
    }
    case 'count':
    default: {
      const numeric = toNumber(metric.value);
      return numeric == null ? '—' : numeric.toLocaleString('en-US');
    }
  }
}

function formatChange(metric) {
  if (!metric) {
    return null;
  }
  const numeric = toNumber(metric.changeValue);
  if (numeric == null || numeric === 0) {
    return null;
  }
  const sign = numeric > 0 ? '+' : '-';
  const absolute = Math.abs(numeric);
  switch (metric.changeUnit) {
    case 'currency':
      return `${sign}${formatCurrency(absolute, metric.currencyCode ?? 'USD', { compact: true })}`;
    case 'percentage': {
      const fractionDigits = Number.isInteger(absolute) ? 0 : 1;
      return `${sign}${absolute.toFixed(fractionDigits)}%`;
    }
    case 'percentage_points': {
      const fractionDigits = Number.isInteger(absolute) ? 0 : 1;
      return `${sign}${absolute.toFixed(fractionDigits)} pts`;
    }
    case 'ratio': {
      const percent = absolute * 100;
      const fractionDigits = percent < 1 ? 2 : 1;
      return `${sign}${percent.toFixed(fractionDigits)}%`;
    }
    case 'count':
    default:
      return `${sign}${absolute.toLocaleString('en-US')}`;
  }
}

function buildFinanceMenuDescription(financeData, loading) {
  if (loading && !financeData) {
    return 'Loading finance insights…';
  }
  if (!financeData) {
    return 'Monitor revenue analytics, payouts, tax filings, and profitability in one view.';
  }
  const summaryMetrics = Array.isArray(financeData.summaryMetrics) ? financeData.summaryMetrics : [];
  const revenueMetric = summaryMetrics.find((metric) => metric.metricKey === 'month_to_date_revenue');
  const marginMetric = summaryMetrics.find((metric) => metric.metricKey === 'net_margin');
  const payoutMetric = summaryMetrics.find((metric) => metric.metricKey === 'cash_available_for_payout');

  const revenueText = revenueMetric ? formatMetricValue(revenueMetric) : null;
  const marginText = marginMetric ? formatMetricValue(marginMetric) : null;
  const payoutText = payoutMetric ? formatMetricValue(payoutMetric) : null;

  if (revenueText && marginText && payoutText) {
    return `MTD revenue ${revenueText} · ${marginText} net margin · payouts ${payoutText}.`;
  }
  if (revenueText && marginText) {
    return `Revenue ${revenueText} with ${marginText} net margin. Dive deeper in finance insights.`;
  }
  return 'Track revenue trends, payout readiness, and compliance tasks in finance insights.';
}

function buildDashboardMenuSections(financeData, loading) {
  const description = buildFinanceMenuDescription(financeData, loading);
  const financeTags = [];
  if (financeData?.summaryMetrics) {
    const marginMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'net_margin');
    const payoutMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'cash_available_for_payout');
    if (marginMetric) {
      financeTags.push(formatMetricValue(marginMetric));
    }
    if (payoutMetric) {
      financeTags.push(formatMetricValue(payoutMetric));
    }
  }

  return BASE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.name !== 'Finance & insights') {
        return item;
      }
      return {
        ...item,
        description,
        tags: financeTags.filter(Boolean).slice(0, 2),
      };
    }),
  }));
}

function buildProfile(financeData) {
  const baseProfile = {
    name: 'Riley Morgan',
    role: 'Lead Brand & Product Designer',
    initials: 'RM',
    status: 'Top-rated freelancer',
    badges: ['Verified Pro', 'Gigvora Elite'],
    metrics: [
      { label: 'Active projects', value: '6' },
      { label: 'Gigs fulfilled', value: '148' },
      { label: 'Avg. CSAT', value: '4.9/5' },
      { label: 'Monthly revenue', value: '$18.4k' },
    ],
  };

  if (!financeData?.summaryMetrics) {
    return baseProfile;
  }

  const revenueMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'month_to_date_revenue');
  const marginMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'net_margin');

  const metrics = baseProfile.metrics.map((metric) => {
    if (metric.label === 'Monthly revenue' && revenueMetric) {
      return { ...metric, value: formatMetricValue(revenueMetric) };
    }
    if (metric.label === 'Avg. CSAT' && marginMetric) {
      return metric;
    }
    return metric;
  });

  return {
    ...baseProfile,
    metrics,
  };
}

function formatDateLabel(date) {
  if (!date) {
    return '—';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
}

const operationalSections = [
  {
    title: 'Project workspace excellence',
    description:
      'Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals.',
    features: [
      {
        name: 'Workspace templates',
        description:
          'Kickstart delivery with industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        bulletPoints: [
          'Standard operating procedures and checklists for repeat work.',
          'Client welcome sequences and kickoff survey automation.',
        ],
      },
      {
        name: 'Task & sprint manager',
        description:
          'Run sprints, Kanban boards, and timeline views with burn charts, dependencies, and backlog grooming.',
        bulletPoints: [
          'Time tracking per task with billable vs. non-billable flags.',
          'Risk registers and change request approvals with e-signatures.',
        ],
      },
      {
        name: 'Collaboration cockpit',
        description:
          'Host video rooms, creative proofing, code repositories, and AI assistants for documentation and QA.',
        bulletPoints: [
          'Inline annotations on files, prototypes, and project demos.',
          'Client-specific permissions with comment-only or edit access.',
        ],
      },
      {
        name: 'Deliverable vault',
        description:
          'Secure storage with version history, watermarking, NDA controls, and automated delivery packages.',
        bulletPoints: [
          'Auto-generate delivery summaries with success metrics.',
          'Long-term archiving and compliance exports.',
        ],
      },
    ],
  },
  {
    title: 'Gig marketplace operations',
    description:
      'Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews.',
    features: [
      {
        name: 'Gig builder',
        description:
          'Design irresistible gig pages with tiered pricing, add-ons, gallery media, and conversion-tested copy.',
        bulletPoints: [
          'Freelancer banner creator with dynamic call-to-actions.',
          'Preview modes for desktop, tablet, and mobile experiences.',
        ],
      },
      {
        name: 'Order pipeline',
        description:
          'Monitor incoming orders, qualification forms, kickoff calls, and delivery status from inquiry to completion.',
        bulletPoints: [
          'Automated requirement forms and revision workflows.',
          'Escrow release checkpoints tied to client satisfaction.',
        ],
      },
      {
        name: 'Client success automation',
        description:
          'Trigger onboarding sequences, educational drip emails, testimonials, and referral programs automatically.',
        bulletPoints: [
          'Smart nudges for review requests post-delivery.',
          'Affiliate and referral tracking per gig.',
        ],
      },
      {
        name: 'Catalog insights',
        description:
          'See conversion rates, top-performing gig bundles, repeat clients, and cross-sell opportunities at a glance.',
        bulletPoints: [
          'Margin calculator factoring software costs and subcontractors.',
          'Heatmaps of search keywords driving gig impressions.',
        ],
      },
    ],
  },
  {
    title: 'Growth, partnerships, & skills',
    description:
      'Scale your business with targeted marketing, agency partnerships, continuous learning, and community mentoring.',
    features: [
      {
        name: 'Pipeline CRM',
        description:
          'Track leads, proposals, follow-ups, and cross-selling campaigns separate from gig orders.',
        bulletPoints: [
          'Kanban views by industry, retainer size, or probability.',
          'Proposal templates with case studies and ROI calculators.',
        ],
      },
      {
        name: 'Agency alliance manager',
        description:
          'Collaborate with agencies, share resource calendars, negotiate revenue splits, and join pods for large engagements.',
        bulletPoints: [
          'Rate card sharing with version history and approvals.',
          'Resource heatmaps showing bandwidth across weeks.',
        ],
      },
      {
        name: 'Learning and certification hub',
        description:
          'Access curated courses, peer mentoring sessions, and skill gap diagnostics tied to your service lines.',
        bulletPoints: [
          'Certification tracker with renewal reminders.',
          'AI recommendations for new service offerings.',
        ],
      },
      {
        name: 'Community spotlight',
        description:
          'Showcase contributions, speaking engagements, and open-source work with branded banners and social share kits.',
        bulletPoints: [
          'Automated newsletter features for top-performing freelancers.',
          'Personalized marketing assets ready for social channels.',
        ],
      },
    ],
  },
];

const availableDashboards = ['freelancer', 'user', 'agency'];

function FinanceMetricCard({ metric, loading }) {
  if (loading && !metric) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <span className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
        </div>
        <span className="mt-4 h-7 w-28 animate-pulse rounded bg-slate-200" />
        <span className="mt-3 h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        <span className="mt-3 h-3 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  const iconKey = metric?.metricKey ?? '';
  const Icon = METRIC_ICON_MAP[iconKey] ?? CurrencyDollarIcon;
  const trend = resolveTrend(metric);
  const trendColor =
    trend === 'down' ? 'text-rose-600' : trend === 'up' ? 'text-emerald-600' : 'text-slate-600';
  const TrendIcon = trend === 'down' ? ArrowTrendingDownIcon : trend === 'up' ? ArrowTrendingUpIcon : ClockIcon;
  const valueText = formatMetricValue(metric);
  const changeText = formatChange(metric);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric?.label ?? 'Metric'}</p>
        <Icon className="h-5 w-5 text-blue-500" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-900">{valueText}</p>
      {changeText ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium">
          {TrendIcon ? <TrendIcon className={`${trendColor} h-4 w-4`} /> : null}
          <span className={trendColor}>{changeText}</span>
        </div>
      ) : null}
      {metric?.caption ? <p className="mt-3 text-xs text-slate-500">{metric.caption}</p> : null}
    </div>
  );
}

function RevenueTrendChart({ trend, loading }) {
  const points = Array.isArray(trend?.points) ? trend.points : [];
  const currencyCode = trend?.currencyCode ?? 'USD';

  if (loading && points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
            <p className="text-sm text-slate-500">Booked vs. realized revenue.</p>
          </div>
          <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-6 flex items-end gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-40 w-full items-end gap-1">
                <span className="flex-1 animate-pulse rounded-t-xl bg-slate-200" />
                <span className="flex-1 animate-pulse rounded-t-xl bg-slate-300" />
              </div>
              <span className="h-3 w-10 animate-pulse rounded bg-slate-200" />
              <span className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
            <p className="text-sm text-slate-500">Booked vs. realized revenue.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500">Revenue trend data will appear once transactions are recorded.</p>
      </div>
    );
  }

  const maxValue = points.reduce((max, point) => {
    const booked = toNumber(point.booked) ?? 0;
    const realized = toNumber(point.realized) ?? 0;
    return Math.max(max, booked, realized);
  }, 0);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
          <p className="text-sm text-slate-500">Booked vs. realized revenue over the last periods.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Realized
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-end gap-4">
        {points.map((point) => {
          const bookedHeight = maxValue > 0 ? Math.max(8, Math.round(((toNumber(point.booked) ?? 0) / maxValue) * 100)) : 0;
          const realizedHeight = maxValue > 0 ? Math.max(8, Math.round(((toNumber(point.realized) ?? 0) / maxValue) * 100)) : 0;
          return (
            <div key={point.monthDate ?? point.month} className="flex flex-1 flex-col items-center gap-3 text-sm">
              <div className="flex h-40 w-full items-end gap-1">
                <div
                  className="flex-1 rounded-t-xl bg-blue-500/80"
                  style={{ height: `${bookedHeight}%` }}
                  aria-hidden="true"
                />
                <div
                  className="flex-1 rounded-t-xl bg-emerald-500/80"
                  style={{ height: `${realizedHeight}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">{point.month}</div>
              <div className="text-xs text-slate-500">
                <span className="block">{`Booked ${formatter.format(toNumber(point.booked) ?? 0)}`}</span>
                <span className="block text-emerald-600">{`Realized ${formatter.format(toNumber(point.realized) ?? 0)}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CapabilitySectionList({ sections }) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  return sections.map((section) => (
    <section
      key={section.title}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
          {section.description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
          ) : null}
        </div>
        {section.meta ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            {section.meta}
          </div>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {section.features.map((feature) => (
          <div
            key={feature.name}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
              {feature.description ? <p className="mt-2 text-sm text-slate-600">{feature.description}</p> : null}
              {feature.bulletPoints?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {feature.bulletPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {feature.callout ? (
              <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                {feature.callout}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  ));
}


function FinanceInsightsSection({ data, loading, error, onRetry }) {
  const summaryMetrics = Array.isArray(data?.summaryMetrics) ? data.summaryMetrics : [];
  const metricItems = summaryMetrics.length > 0 ? summaryMetrics : loading ? Array.from({ length: 4 }).map(() => null) : [];
  const revenueTrend = data?.revenueTrend ?? null;
  const revenueStreams = Array.isArray(data?.revenueStreams) ? data.revenueStreams : [];
  const payoutHistory = Array.isArray(data?.payoutHistory) ? data.payoutHistory : [];
  const taxCompliance = data?.taxCompliance ?? {};
  const quarterlyEstimate = taxCompliance?.quarterlyEstimate ?? null;
  const filings = Array.isArray(taxCompliance?.filings) ? taxCompliance.filings : [];
  const complianceHighlights = Array.isArray(taxCompliance?.complianceHighlights)
    ? taxCompliance.complianceHighlights
    : [];
  const deductions = taxCompliance?.deductions ?? null;
  const profitability = data?.profitability ?? { metrics: [], breakdown: [], savingsGoals: [] };
  const controls = Array.isArray(data?.controls) ? data.controls : [];
  const lastUpdatedAt = data?.lastUpdatedAt;
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdatedAt))
    : null;

  return (
    <section
      id="finance-insights"
      className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-6 shadow-[0_18px_45px_-30px_rgba(30,64,175,0.45)] sm:p-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Finance & insights control tower</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Keep your revenue analytics, payout cadence, tax compliance, profitability, and automations aligned. This cockpit
            keeps earnings predictable and audits painless.
          </p>
          {lastUpdatedLabel ? <p className="mt-1 text-xs text-slate-400">Last updated {lastUpdatedLabel}</p> : null}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          <BoltIcon className="h-4 w-4" />
          Realtime-ready ledgers
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">We couldn&apos;t refresh finance insights.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span>{error?.message ?? 'Please try again in a few moments.'}</span>
            {onRetry ? (
              <button
                type="button"
                onClick={() => onRetry({ force: true })}
                className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-400"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {metricItems.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricItems.map((metric, index) => (
            <FinanceMetricCard key={metric?.metricKey ?? index} metric={metric} loading={loading} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Finance metrics will appear once you record revenue and expense activity.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Revenue composition</h3>
              <p className="text-sm text-slate-500">Where your gig and project revenue is concentrated.</p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
              Healthy mix
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {revenueStreams.length > 0 ? (
              revenueStreams.map((stream) => {
                const share = stream.sharePercent == null ? '—' : `${Math.round(stream.sharePercent)}%`;
                const mrr = formatCurrency(stream.monthlyRecurringRevenue, stream.currencyCode ?? 'USD', {
                  compact: false,
                  maximumFractionDigits: 0,
                });
                const yoyNumeric = toNumber(stream.yoyChangePercent);
                const yoy =
                  yoyNumeric == null
                    ? '—'
                    : `${yoyNumeric > 0 ? '+' : ''}${Math.abs(yoyNumeric).toFixed(Number.isInteger(Math.abs(yoyNumeric)) ? 0 : 1)}% YoY`;

                return (
                  <div key={stream.id ?? stream.stream} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-900">{stream.stream}</p>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        {share}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600">
                        MRR {mrr}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                        {yoy}
                      </span>
                      {stream.notes ? <span className="text-slate-500">{stream.notes}</span> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Revenue stream analytics will populate as you close engagements.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Payout readiness</h3>
              <p className="text-sm text-slate-500">Monitor upcoming releases, escrow milestones, and the health of your payout cadence.</p>
            </div>
            <BanknotesIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Gig
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payoutHistory.slice(0, 6).map((entry) => {
                  const statusClass =
                    entry.status === 'released'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : entry.status === 'scheduled'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : entry.status === 'in_escrow'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : entry.status === 'failed'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600';

                  return (
                    <tr key={`${entry.id ?? entry.date}-${entry.client}`} className="text-xs text-slate-600">
                      <td className="px-4 py-3 font-medium text-slate-500">{formatDateLabel(entry.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{entry.client}</td>
                      <td className="px-4 py-3">{entry.gig}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(entry.amount, entry.currencyCode ?? 'USD', { compact: false, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`${statusClass} inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wide`}>
                          {entry.statusLabel ?? entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Split payouts can be configured per gig. Clients see transparency into subcontractor shares on invoices.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Revenue trend</h3>
              <p className="text-sm text-slate-500">Dive into booked vs. realized revenue across recent months.</p>
            </div>
            <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-700">
              Forecast locked for 90 days
            </div>
          </div>
          <div className="mt-5">
            <RevenueTrendChart trend={revenueTrend} loading={loading} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Tax & compliance</h3>
                <p className="text-sm text-slate-500">
                  Keep quarterly estimates, jurisdictional filings, and compliance reminders in one place.
                </p>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
            </div>
            {quarterlyEstimate ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <p className="font-semibold">
                  Next estimate due {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(quarterlyEstimate.dueDate))}
                </p>
                <p className="text-xs text-blue-600/80">
                  Amount set aside: {formatCurrency(quarterlyEstimate.amount, quarterlyEstimate.currencyCode ?? 'USD', {
                    compact: false,
                    maximumFractionDigits: 0,
                  })}{' '}
                  · Status: {quarterlyEstimate.statusLabel ?? quarterlyEstimate.status}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No quarterly estimate configured yet.</p>
            )}
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {filings.length > 0 ? (
                filings.map((filing) => (
                  <li key={filing.id ?? filing.name} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{filing.name}</p>
                      <p className="text-xs text-slate-500">
                        Due {formatDateLabel(filing.dueDate)}
                        {filing.jurisdiction ? ` · ${filing.jurisdiction}` : ''}
                      </p>
                    </div>
                    <span
                      className={`${
                        filing.status === 'submitted'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : filing.status === 'in_progress'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : filing.status === 'overdue'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                      } inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide`}
                    >
                      {filing.statusLabel ?? filing.status}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">All tax filings are up to date.</li>
              )}
            </ul>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {deductions ? `Deductible expenses ${deductions.taxYear}` : 'Track deductible expenses'}{' '}
                {deductions ? formatCurrency(deductions.amount, deductions.currencyCode ?? 'USD', { compact: false }) : ''}
              </p>
              {deductions?.changePercentage != null ? (
                <p className="text-xs text-slate-500">
                  {deductions.changePercentage > 0 ? '+' : ''}
                  {deductions.changePercentage}% vs. last year
                </p>
              ) : null}
              {deductions?.notes ? <p className="mt-2 text-xs text-slate-500">{deductions.notes}</p> : null}
            </div>
            {complianceHighlights.length > 0 ? (
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {complianceHighlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <DocumentCheckIcon className="h-4 w-4 text-blue-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
            <p className="font-semibold">Need an accountant?</p>
            <p className="text-xs text-blue-600/80">
              Invite your finance partner into a read-only workspace with export-ready ledgers and audit trails.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Profitability cockpit</h3>
              <p className="text-sm text-slate-500">Dive into net margin, utilization, and savings goals to stay sustainable.</p>
            </div>
            <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-700">
              Forecast locked for 90 days
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {profitability.metrics.length > 0 ? (
              profitability.metrics.map((item) => (
                <div key={item.metricKey ?? item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{formatMetricValue(item)}</p>
                  {formatChange(item) ? <p className="mt-2 text-xs text-emerald-600">{formatChange(item)}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Profitability metrics will appear as soon as operating costs are tracked.</p>
            )}
          </div>
          <div className="mt-6 space-y-4">
            {profitability.breakdown.length > 0 ? (
              profitability.breakdown.map((line) => {
                const percent = toNumber(line.percent) ?? 0;
                return (
                  <div key={line.label}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-700">{line.label}</p>
                      <p className="text-slate-500">{percent}%</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, percent)}%` }} aria-hidden="true" />
                    </div>
                    {line.caption ? <p className="mt-1 text-xs text-slate-500">{line.caption}</p> : null}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Add cost categories to understand margin drivers.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Savings automations</h3>
            <p className="text-sm text-slate-500">Direct percentages of payouts into dedicated envelopes.</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {profitability.savingsGoals.length > 0 ? (
                profitability.savingsGoals.map((goal) => {
                  const percent = Math.max(0, Math.min(100, Math.round((goal.progress ?? 0) * 100)));
                  return (
                    <li key={goal.id ?? goal.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{goal.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Target {formatCurrency(goal.targetAmount, goal.currencyCode ?? 'USD', { compact: false })}
                        </p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} aria-hidden="true" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{percent}% funded</span>
                        <span>{goal.cadence}</span>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-slate-500">Set up savings envelopes to automate reserves.</li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Controls & automation</h3>
            <p className="text-sm text-slate-500">Operational guardrails to keep finance, compliance, and reputation aligned.</p>
            <div className="mt-4 space-y-4">
              {controls.length > 0 ? (
                controls.map((control) => (
                  <div key={control.id ?? control.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{control.name}</p>
                    {control.description ? <p className="mt-1 text-xs text-slate-500">{control.description}</p> : null}
                    {Array.isArray(control.bullets) && control.bullets.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-xs text-slate-500">
                        {control.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <DocumentCheckIcon className="h-4 w-4 text-blue-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Add automation controls to keep operations audit-ready.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function FreelancerDashboardPage() {
  const {
    data: financeData,
    loading: financeLoading,
    error: financeError,
    refresh: refreshFinance,
  } = useCachedResource(
    `dashboard:freelancer:finance:${DEFAULT_FREELANCER_ID}`,
    ({ signal } = {}) => fetchFreelancerFinanceInsights(DEFAULT_FREELANCER_ID, { signal }),
    { ttl: 1000 * 60 * 3 },
  );

  const remainingSections = operationalSections;
  const menuSections = useMemo(() => buildDashboardMenuSections(financeData, financeLoading), [financeData, financeLoading]);
  const profile = useMemo(() => buildProfile(financeData), [financeData]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={remainingSections}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <FinanceInsightsSection
          data={financeData}
          loading={financeLoading}
          error={financeError}
          onRetry={refreshFinance}
        />
        <CapabilitySectionList sections={remainingSections} />
      </div>
    </DashboardLayout>
  );
}
