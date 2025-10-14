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
  LightBulbIcon,
  BookOpenIcon,
  HeartIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  GlobeAmericasIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  MagnifyingGlassCircleIcon,
  MapIcon,
  ChartPieIcon,
  BeakerIcon,
  MapIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import { useHeadhunterDashboard } from '../../hooks/useHeadhunterDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import PartnershipsInsightsSection from './headhunter/sections/PartnershipsInsightsSection.jsx';

const MENU_SECTIONS = [
  {
    label: 'Executive overview',
    items: [
      {
        name: 'Workspace summary',
        description: 'Performance, lookback, and workspace level context.',
        sectionId: 'executive-summary',
      },
      {
        name: 'Pipeline health',
        description: 'Stage velocity, bottlenecks, and service levels.',
        sectionId: 'pipeline-health',
      },
      {
        name: 'Candidate spotlight',
        description: 'Priority prospects, signals, and comp guardrails.',
        sectionId: 'candidate-spotlight',
      },
    ],
  },
  {
    label: 'Mandates & outreach',
    items: [
      {
        name: 'Mandate portfolio',
        description: 'Active mandates, values, risk status, and owners.',
        sectionId: 'mandate-portfolio',
      },
      {
        name: 'Outreach performance',
        description: 'Channel effectiveness, sequences, and conversion.',
        sectionId: 'outreach-performance',
      },
      {
        name: 'Pass-on exchange',
        description: 'Shares, compliance, and partner-ready candidates.',
        sectionId: 'pass-on-network',
      },
    ],
  },
  {
    label: 'Insights & planning',
    items: [
      {
        name: 'Insights centre',
        description: 'Scorecards, risks, and recommended actions.',
        sectionId: 'insights-centre',
      },
      {
        name: 'Activity timeline',
        description: 'Key events and playbook execution history.',
        sectionId: 'activity-timeline',
      },
      {
        name: 'Calendar orchestration',
        description: 'Availability broadcasts, focus blocks, and load.',
        sectionId: 'calendar-orchestration',
      },
    ],
  },
  {
    label: 'Partnership excellence',
    items: [
      {
        name: 'Client partnerships',
        description: 'Client reporting, portals, and commercial insights.',
        sectionId: 'client-partnerships',
      },
    ],
  },
];

const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const SUMMARY_ICONS = [BriefcaseIcon, UserGroupIcon, ClockIcon, ChartBarIcon];
const AVAILABLE_DASHBOARDS = ['headhunter', 'company', 'agency'];

const DEFAULT_PROFILE = {
  name: 'Skyline Search',
  role: 'Executive headhunter collective',
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

function formatNumber(value, { maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number(value));
}

function formatCurrency(value, currency = 'USD', { maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(digits)}%`;
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function SummaryGrid({ cards }) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
              <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
            {card.helper ? <p className="mt-1 text-xs text-slate-500">{card.helper}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function StageBreakdownTable({ stages = [], currency }) {
  if (!stages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No stage movement recorded for this window.
      </div>
    );
  }

  const cleanStart = start ? start.toString().slice(0, 5) : null;
  const cleanEnd = end ? end.toString().slice(0, 5) : null;
  if (cleanStart && cleanEnd) {
    return `${cleanStart} – ${cleanEnd} ${timezone ?? 'UTC'}`;
  }
  return cleanStart ?? cleanEnd ?? '—';
}

function formatCompRange(comp, fallbackCurrency = 'USD') {
  if (!comp) return '—';
  const currency = comp.currency ?? fallbackCurrency;
  if (comp.min != null && comp.max != null) {
    return `${formatCurrency(comp.min, currency)} – ${formatCurrency(comp.max, currency)}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Stage
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Active prospects
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Velocity (days)
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Pipeline value
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Conversion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {stages.map((stage) => (
            <tr key={stage.name ?? stage.stage} className="bg-white">
              <td className="px-4 py-3 text-slate-900">{stage.name ?? stage.stage ?? 'Stage'}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(stage.activeCandidates ?? stage.active)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(stage.avgDays, { maximumFractionDigits: 1 })}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(stage.valueTotal, currency)}</td>
              <td className="px-4 py-3 text-slate-600">{formatPercent(stage.conversionRate, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CandidateSpotlightList({ candidates = [], currency }) {
  if (!candidates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Activate sourcing automations to surface candidate spotlights.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {candidates.map((candidate) => {
        const relocationLabel = candidate.relocation ? candidate.relocation.replace(/_/g, ' ') : 'Preference pending';
        return (
          <div key={candidate.id ?? candidate.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{candidate.name ?? 'Candidate'}</p>
                <p className="text-sm text-slate-500">{candidate.headline ?? candidate.role ?? 'Role pending'}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                {candidate.seniority ?? 'Unassigned'}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-violet-500" aria-hidden="true" />
                <span>{candidate.aiHighlights?.[0] ?? 'AI insights will populate as new signals arrive.'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span>{candidate.availability ?? 'Availability pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span className="capitalize">{relocationLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span>{formatCurrency(candidate.compensation?.target ?? candidate.compensation?.expected, currency)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarDaysIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span>
                  Last signal {candidate.signals?.[0]?.occurredAt ? formatRelativeTime(candidate.signals[0].occurredAt) : 'pending'}
                </span>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function MandatePortfolioTable({ mandates = [], currency }) {
  if (!mandates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No active mandates logged. Import briefs or sync ATS data to populate this portfolio.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Mandate</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Client</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Stage</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Owner</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Target comp</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Pipeline value</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {mandates.map((mandate) => (
            <tr key={mandate.id ?? mandate.title} className="bg-white">
              <td className="px-4 py-3 text-slate-900">
                <div className="flex flex-col">
                  <span className="font-semibold">{mandate.title ?? 'Mandate'}</span>
                  {mandate.priority ? (
                    <span className="text-xs uppercase tracking-wide text-blue-600">{mandate.priority} priority</span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{mandate.client ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{mandate.stage ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{mandate.owner ?? mandate.lead ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">
                {formatCurrency(mandate.compensation?.max ?? mandate.compensation?.target, mandate.compensation?.currency ?? currency)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(mandate.value ?? mandate.pipelineValue, currency)}</td>
              <td className="px-4 py-3 text-slate-600">{mandate.risk ? mandate.risk.replace(/_/g, ' ') : 'Healthy'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutreachPerformanceSection({ performance = {}, currency }) {
  const totals = performance.totals ?? {};
  const channels = performance.channels ?? [];
  const sequences = performance.bestSequences ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Engaged prospects</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.engagedProspects)}</p>
            <p className="text-xs text-slate-500">{formatPercent(totals.replyRate)} reply rate</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Meetings booked</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.meetingsBooked)}</p>
            <p className="text-xs text-slate-500">{formatPercent(totals.meetingConversion)} meeting conversion</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Offers influenced</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.offersInfluenced)}</p>
            <p className="text-xs text-slate-500">{formatCurrency(totals.feeImpact, currency)} in projected fees</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sequences live</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.activeSequences)}</p>
            <p className="text-xs text-slate-500">{formatPercent(totals.sequenceHealth)} sequence health</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">Channel performance</p>
          <div className="mt-4 space-y-3">
            {channels.length ? (
              channels.map((channel) => (
                <div key={channel.name ?? channel.channel} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{channel.name ?? channel.channel}</p>
                    <p className="text-xs text-slate-500">{formatNumber(channel.messagesSent)} messages · {formatPercent(channel.replyRate)} replies</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {formatPercent(channel.conversion)} conversion
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No outreach channel data recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Top performing sequences</p>
        <div className="mt-4 space-y-4">
          {sequences.length ? (
            sequences.map((sequence) => (
              <div key={sequence.name ?? sequence.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{sequence.name ?? 'Sequence'}</p>
                <p className="mt-1 text-xs text-slate-500">{sequence.audience ?? 'Audience pending'}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                    <PaperAirplaneIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    {formatNumber(sequence.sent)} sent
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                    <EnvelopeOpenIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    {formatPercent(sequence.replyRate)} reply
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                    <MegaphoneIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    {formatPercent(sequence.meetingRate)} meeting
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Set live sequences to unlock engagement analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PassOnNetworkSection({ network = {}, currency }) {
  const candidates = network.candidates ?? [];
  const summary = network.summary ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
        <p className="text-sm font-semibold text-slate-900">Pass-on metrics</p>
        <dl className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Total shares</dt>
            <dd className="font-semibold text-slate-900">{formatNumber(summary.totalShares)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Consent pending</dt>
            <dd className="font-semibold text-slate-900">{formatNumber(summary.pendingConsent)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Accepted matches</dt>
            <dd className="font-semibold text-slate-900">{formatNumber(summary.accepted)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Projected revenue</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(summary.projectedRevenue, currency)}</dd>
          </div>
        </dl>
      </div>
      <div className="lg:col-span-2">
        <div className="space-y-3">
          {candidates.length ? (
            candidates.map((candidate) => (
              <div key={candidate.id ?? candidate.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{candidate.name}</p>
                    <p className="text-xs text-slate-500">Shared with {candidate.sharedWith ?? '—'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
                    {candidate.status?.replace(/_/g, ' ') ?? 'Pending'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                    <BuildingOfficeIcon className="h-4 w-4" aria-hidden="true" />
                    {candidate.company ?? 'Company pending'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                    <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                    Shared {candidate.sharedAt ? formatRelativeTime(candidate.sharedAt) : 'recently'}
                  </span>
                  {candidate.feeSplit ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                      <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
                      Fee split {formatPercent(candidate.feeSplit)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Share candidates with trusted partners to unlock tracking and compliance analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No key events recorded during this period.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.id ?? index} className="flex gap-4">
          <div className="relative flex flex-col items-center">
            <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
            {index < items.length - 1 ? <span className="mt-1 h-full w-px bg-blue-100" /> : null}
          </div>
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.title ?? item.type ?? 'Activity'}</p>
              <span className="text-xs text-slate-500">
                {item.occurredAt ? formatAbsolute(item.occurredAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
              </span>
            </div>
            {item.actor ? <p className="text-xs text-slate-500">By {item.actor}</p> : null}
            {item.meta ? <p className="mt-2 text-sm text-slate-600">{item.meta}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function InsightsPanel({ insights = {}, currency }) {
  const metrics = insights.metrics ?? {};
  const scorecard = insights.scorecard ?? {};
  const actions = insights.recommendedActions ?? [];
  const gaps = insights.gaps ?? [];
  const weeklyReview = insights.weeklyReview ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Commercial scorecard</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Pipeline value</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(metrics.pipelineValue?.value, metrics.pipelineValue?.currency ?? currency)}</dd>
            <p className="text-xs text-slate-500">{metrics.pipelineValue?.trend ?? 'Pipeline is stabilised'}</p>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Forecasted placements</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(metrics.forecastedPlacements?.value, { maximumFractionDigits: 1 })}</dd>
            <p className="text-xs text-slate-500">{metrics.forecastedPlacements?.trend ?? 'Forecast refreshed'}</p>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Projected fees</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(metrics.projectedFees?.value, metrics.projectedFees?.currency ?? currency)}</dd>
            <p className="text-xs text-slate-500">{metrics.projectedFees?.trend ?? 'Monitoring retained + success fees'}</p>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Activity goal attainment</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatPercent(metrics.activityGoal?.value)}</dd>
            <p className="text-xs text-slate-500">{metrics.activityGoal?.trend ?? 'Workload balanced'}</p>
          </div>
        </dl>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Scorecard</p>
          <p className="mt-2 text-sm text-slate-600">{scorecard.summary ?? 'Scorecard will update as more activity is recorded.'}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">Recommended actions</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {actions.length ? (
              actions.map((action) => (
                <li key={action.id ?? action.title} className="flex gap-3">
                  <LightBulbIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-slate-800">{action.title ?? 'Action'}</p>
                    <p className="text-xs text-slate-500">{action.description ?? 'Review this recommendation to keep momentum.'}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No recommendations—keep executing the current playbook.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">Delivery gaps & wellbeing</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {gaps.length ? (
              gaps.map((gap, index) => <li key={gap.id ?? index}>• {gap.description ?? gap}</li>)
            ) : (
              <li className="text-sm text-slate-500">No delivery gaps flagged.</li>
            )}
          </ul>
          {weeklyReview.summary ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-500">Weekly review</p>
              <p className="mt-2">{weeklyReview.summary}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CalendarOrchestration({ calendar = {} }) {
  const workload = calendar.workload ?? {};
  const upcoming = calendar.upcoming ?? [];
  const utilization = calendar.utilization ?? {};
  const focusBlocks = calendar.focusBlocks ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Workload distribution</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Client meetings</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(workload.clientMeetings)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Candidate interviews</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(workload.candidateInterviews)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Sourcing blocks</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(workload.sourcingBlocks)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Prep sessions</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(workload.prepSessions)}</dd>
          </div>
        </dl>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-500">Utilisation</p>
          <p className="mt-2">
            Weekly capacity at {formatPercent(utilization.capacity)}. Focus blocks protected {formatNumber(utilization.focusHours)}
            h of deep work.
          </p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Upcoming commitments</p>
        <div className="space-y-3">
          {upcoming.length ? (
            upcoming.map((event) => (
              <div key={event.id ?? event.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{event.title ?? 'Event'}</p>
                <p className="text-xs text-slate-500">
                  {event.startAt
                    ? formatAbsolute(event.startAt, { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Time pending'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{event.location ?? event.context ?? 'Virtual'}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No upcoming events scheduled.</p>
          )}
        </div>
        {focusBlocks.length ? (
          <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
            <p className="text-xs uppercase tracking-wide">Focus blocks</p>
            <p className="mt-1">
              {focusBlocks.map((block) => block.label ?? block).join(' • ')}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HeadhunterDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const { data, error, loading, refresh, fromCache, lastUpdated, summaryCards } = useHeadhunterDashboard({
    workspaceId: workspaceIdParam,
    lookbackDays,
  });

  const selectedWorkspaceId = data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? null;

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const currency = data?.workspaceSummary?.defaultCurrency ?? 'USD';
  const partnerships = data?.partnerships ?? {};
  const pipelineSummary = data?.pipelineSummary ?? {};
  const candidateSpotlight = data?.candidateSpotlight ?? [];
  const mandatePortfolio = data?.mandatePortfolio ?? { totals: {}, mandates: [] };
  const outreachPerformance = data?.outreachPerformance ?? {};
  const passOnNetwork = data?.passOnNetwork ?? {};
  const activityTimeline = data?.activityTimeline ?? [];
  const calendar = data?.calendar ?? {};
  const insights = data?.insights ?? {};

  const profile = useMemo(() => {
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

    return {
      name: workspace.name ?? DEFAULT_PROFILE.name,
      role: workspace.type ? `${workspace.type.charAt(0).toUpperCase()}${workspace.type.slice(1)} workspace` : DEFAULT_PROFILE.role,
      initials,
      status: workspace.health?.badges?.[0] ?? DEFAULT_PROFILE.status,
      badges: workspace.health?.badges?.length ? workspace.health.badges : DEFAULT_PROFILE.badges,
      metrics: summaryCards.map((card) => ({ label: card.label, value: card.value })),
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

  const stageBreakdown = pipelineSummary.stageBreakdown ?? [];
  const totals = mandatePortfolio.totals ?? {};

  const enhancedSummaryCards = summaryCards.map((card) => {
    if (card.label === 'Active mandates') {
      return { ...card, helper: `${formatNumber(totals.openMandates ?? totals.activeMandates)} open` };
    }
    if (card.label === 'Pipeline candidates') {
      return { ...card, helper: `${formatNumber(pipelineSummary.agingBuckets?.active ?? pipelineSummary.totals?.active)} active` };
    }
    if (card.label === 'Pipeline value') {
      return { ...card, helper: `Projected fees ${formatCurrency(mandatePortfolio.totals?.projectedFees, currency)}` };
    }
    return card;
  });

  return (
    <DashboardAccessGuard requiredRoles={['headhunter']} requiredPermissions={['headhunter_dashboard', 'dashboard:headhunter']}>
      <DashboardLayout
        currentDashboard="headhunter"
        title="Headhunter command centre"
        subtitle="Operate sourcing, outreach, and client partnerships with enterprise telemetry."
        description="Every mandate, prospect, and client deliverable in one resilient workspace."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        profile={profile}
      >
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
          <section id="executive-summary" className="space-y-6">
            <SectionHeader
              icon={BriefcaseIcon}
              title="Executive summary"
              description="Key health indicators across mandates, pipelines, and outreach."
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-slate-600">
                    Workspace
                    <select
                      className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={selectedWorkspaceId ?? ''}
                      onChange={handleWorkspaceChange}
                    >
                      <option value="">All workspaces</option>
                      {workspaceOptions.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">
                    Lookback
                    <select
                      className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={lookbackDays}
                      onChange={handleLookbackChange}
                    >
                      {LOOKBACK_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          Last {option} days
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                  >
                    <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
                  </button>
                </div>
              }
            />
            <DataStatus
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              fromCache={fromCache}
              className="rounded-2xl border border-slate-200 bg-white"
            />
            <SummaryGrid cards={enhancedSummaryCards} />
          </section>

          <section id="pipeline-health" className="space-y-6">
            <SectionHeader
              icon={ChartBarIcon}
              title="Pipeline health"
              description="Monitor velocity, value, and risk across every stage."
            />
            <StageBreakdownTable stages={stageBreakdown} currency={currency} />
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Aging profile</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                {Object.entries(pipelineSummary.agingBuckets ?? {}).length ? (
                  Object.entries(pipelineSummary.agingBuckets).map(([bucket, value]) => (
                    <span
                      key={bucket}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"
                    >
                      <ClockIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                      {bucket.replace(/_/g, ' ')}: <strong className="text-slate-800">{formatNumber(value)}</strong>
                    </span>
                  ))
                ) : (
                  <span>No aging data available.</span>
                )}
              </div>
            </div>
          </section>

          <section id="candidate-spotlight" className="space-y-6">
            <SectionHeader
              icon={UserGroupIcon}
              title="Candidate spotlight"
              description="High-signal prospects ready for client collaboration."
            />
            <CandidateSpotlightList candidates={candidateSpotlight} currency={currency} />
          </section>

          <section id="mandate-portfolio" className="space-y-6">
            <SectionHeader
              icon={BuildingOfficeIcon}
              title="Mandate portfolio"
              description="Status, comp bands, and value across live searches."
            />
            <MandatePortfolioTable mandates={mandatePortfolio.mandates} currency={currency} />
          </section>

          <section id="outreach-performance" className="space-y-6">
            <SectionHeader
              icon={MegaphoneIcon}
              title="Outreach performance"
              description="Sequenced campaigns and conversion telemetry."
            />
            <OutreachPerformanceSection performance={outreachPerformance} currency={currency} />
          </section>

          <section id="pass-on-network" className="space-y-6">
            <SectionHeader
              icon={PaperAirplaneIcon}
              title="Pass-on exchange"
              description="Shared candidates with compliance ready audit trail."
            />
            <PassOnNetworkSection network={passOnNetwork} currency={currency} />
          </section>

          <section id="insights-centre" className="space-y-6">
            <SectionHeader
              icon={LightBulbIcon}
              title="Insights centre"
              description="Scorecards, gaps, and playbook recommendations."
            />
            <InsightsPanel insights={insights} currency={currency} />
          </section>

          <section id="activity-timeline" className="space-y-6">
            <SectionHeader
              icon={CalendarDaysIcon}
              title="Activity timeline"
              description="Chronology of outreach, submissions, and decisions."
            />
            <ActivityTimeline items={activityTimeline} />
          </section>

          <section id="calendar-orchestration" className="space-y-6">
            <SectionHeader
              icon={ClockIcon}
              title="Calendar orchestration"
              description="Load balancing across candidate and client commitments."
            />
            <CalendarOrchestration calendar={calendar} />
          </section>

          <section id="client-partnerships" className="space-y-6">
            <SectionHeader
              icon={PresentationChartLineIcon}
              title="Client partnership excellence"
              description="Financials, portals, and transparency surfaced for clients."
            />
            <PartnershipsInsightsSection partnerships={partnerships} calendar={calendar} />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
