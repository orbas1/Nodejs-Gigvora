import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeOpenIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';
import {
  formatMetricCurrency,
  formatMetricNumber,
  formatMetricPercent,
} from '../../utils/metrics.js';

function formatCurrency(amount, currency = 'USD') {
  const numeric = Number(amount);
  const safeCurrency = currency || 'USD';
  if (!Number.isFinite(numeric)) {
    return formatMetricCurrency(0, {
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  const digits = Math.abs(numeric) >= 1000 ? 0 : 2;
  return formatMetricCurrency(numeric, {
    currency: safeCurrency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatNumber(value) {
  return formatMetricNumber(value, { fallback: '0' });
}

function formatPercent(value) {
  return formatMetricPercent(value, { fallback: '0%', decimals: 1 });
}

function formatHealth(value) {
  return formatMetricPercent(value, { fallback: 'n/a', decimals: 0 });
}

function renderSkeletonRow(key) {
  return (
    <div
      key={key}
      className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 p-4"
    >
      <div className="h-4 w-2/3 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
    </div>
  );
}

export default function AgencyCollaborationsPanel({ data, loading, error, onRetry }) {
  const summary = data?.summary ?? {};
  const invitations = data?.invitations?.pending ?? [];
  const activeCollaborations = data?.collaborations?.active ?? [];
  const rateCards = data?.rateCards ?? [];
  const openNegotiations = data?.negotiations?.open ?? [];
  const recentEvents = data?.negotiations?.recentEvents ?? [];
  const delivery = data?.delivery ?? { deliverables: [], milestones: [], resources: [] };
  const renewals = data?.renewals ?? { upcoming: [], atRisk: [], retentionScore: null };

  const summaryCards = [
    {
      name: 'Active collaborations',
      value: formatNumber(summary.activeCollaborations),
      icon: UsersIcon,
      description: `${formatCurrency(summary.monthlyRetainerValue, summary.monthlyRetainerCurrency)} retained this month`,
    },
    {
      name: 'Pending invitations',
      value: formatNumber(summary.pendingInvitations),
      icon: EnvelopeOpenIcon,
      description: `${formatPercent(summary.acceptanceRate)} acceptance in 90 days`,
    },
    {
      name: 'Negotiations in play',
      value: formatNumber(summary.openNegotiations),
      icon: CurrencyDollarIcon,
      description: `${formatCurrency(summary.negotiationPipelineValue, summary.negotiationPipelineCurrency)} in pipeline`,
    },
    {
      name: 'Renewal health',
      value: formatHealth(summary.averageHealthScore),
      icon: SparklesIcon,
      description: `${formatNumber(renewals.upcoming?.length ?? 0)} renewals in next quarter`,
    },
  ];

  const showSkeleton = loading && !data;

  return (
    <section
      id="agency-collaborations"
      className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]"
    >
      <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Growth & partnerships</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Agency collaborations & retainers</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage incoming invitations, keep rate cards aligned with agency pods, coordinate shared delivery plans,
              and stay ahead of retainer renewals from a single collaboration command center.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-500 md:items-end">
            {error ? (
              <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>{loading ? 'Refreshing metrics…' : 'Live data snapshot'}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRetry?.()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin text-blue-500' : 'text-slate-400')} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {showSkeleton
            ? summaryCards.map((card, index) => renderSkeletonRow(`summary-${index}`))
            : summaryCards.map((card) => (
                <div
                  key={card.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{card.name}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                    </div>
                    <card.icon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{card.description}</p>
                </div>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Invitation desk</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Pending agency invitations</h3>
                </div>
                <EnvelopeOpenIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-4 space-y-4">
                {showSkeleton
                  ? [renderSkeletonRow('invite-skeleton')]
                  : invitations.length > 0
                  ? invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {invite.workspace?.name ?? 'Agency workspace'}
                            </p>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              {invite.roleTitle ?? 'Specialist'} · {invite.engagementType?.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            {invite.responseDueAt ? (
                              <span title={formatAbsolute(invite.responseDueAt)}>
                                Respond {formatRelativeTime(invite.responseDueAt)}
                              </span>
                            ) : (
                              <span>No deadline</span>
                            )}
                            <div className="text-slate-900">
                              {formatCurrency(invite.proposedRetainer, invite.currency)}
                            </div>
                          </div>
                        </div>
                        {invite.message ? (
                          <p className="mt-3 text-xs text-slate-600">{invite.message}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                          <span
                            className={classNames(
                              'inline-flex items-center rounded-full px-2 py-0.5 font-semibold',
                              invite.isOverdue
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-emerald-100 text-emerald-600',
                            )}
                          >
                            {invite.isOverdue ? 'Follow up required' : 'On track'}
                          </span>
                          {invite.sentBy ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                              From {invite.sentBy.firstName} {invite.sentBy.lastName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  : (
                      <p className="text-sm text-slate-500">
                        No pending invites — agencies see your latest availability and rate cards in real time.
                      </p>
                    )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Active retainers</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Agency pods & delivery health</h3>
                </div>
                <BuildingOffice2Icon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-4 space-y-4">
                {showSkeleton
                  ? [renderSkeletonRow('collaboration-skeleton')]
                  : activeCollaborations.length > 0
                  ? activeCollaborations.map((collab) => {
                      const next = collab.upcomingDeliverable;
                      return (
                        <div
                          key={collab.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {collab.workspace?.name ?? 'Agency workspace'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatCurrency(collab.retainerAmountMonthly, collab.currency)} / month · {collab.collaborationType.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-600">
                                <SparklesIcon className="h-3.5 w-3.5" /> {formatHealth(collab.healthScore)} health
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-600">
                                <ChartPieIcon className="h-3.5 w-3.5" /> {formatNumber(collab.activeBriefsCount)} briefs
                              </span>
                            </div>
                          </div>
                          {next ? (
                            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-700">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <div className="font-semibold">{next.title}</div>
                              <span title={formatAbsolute(next.dueAt)}>
                                Due {formatRelativeTime(next.dueAt)}
                              </span>
                              {next.owner ? <span>· Owner {next.owner}</span> : null}
                            </div>
                          ) : null}
                          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-600">Negotiations:</span>{' '}
                              {collab.negotiations.length}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-600">Upsell forecast:</span>{' '}
                              {formatCurrency(collab.forecastedUpsellValue, collab.forecastedUpsellCurrency)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : (
                      <p className="text-sm text-slate-500">
                        No live retainers yet. Share a tailored rate card to unlock dedicated agency pods.
                      </p>
                    )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Rate card studio</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Shared pricing packs</h3>
                </div>
                <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-4 space-y-4">
                {showSkeleton
                  ? [renderSkeletonRow('rate-card-skeleton')]
                  : rateCards.length > 0
                  ? rateCards.map((card) => (
                      <div key={card.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {card.status === 'shared' ? 'Shared with agency partners' : card.status}
                        </p>
                        <ul className="mt-3 space-y-1 text-xs text-slate-500">
                          {card.items.slice(0, 3).map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3">
                              <span>{item.name}</span>
                              <span className="font-semibold text-slate-600">
                                {formatCurrency(item.unitPrice, item.currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  : (
                      <p className="text-sm text-slate-500">
                        No rate cards shared yet. Publish a pricing pack to accelerate future invitations.
                      </p>
                    )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Negotiation room</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Retainer pipeline</h3>
                </div>
                <ClockIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-4 space-y-3">
                {showSkeleton
                  ? [renderSkeletonRow('negotiation-skeleton')]
                  : openNegotiations.length > 0
                  ? openNegotiations.map((negotiation) => (
                      <div key={negotiation.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-sm font-semibold text-slate-900">{negotiation.name}</p>
                        <p className="text-xs text-slate-500">
                          {negotiation.workspace?.name ?? 'Agency workspace'} · Stage {negotiation.stage?.replace(/_/g, ' ')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-600">
                            {formatCurrency(negotiation.proposedAmount, negotiation.currency)} proposal
                          </span>
                          {Number.isFinite(negotiation.confidence) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-600">
                              Win probability {formatPercent(Number(negotiation.confidence) * 100)}
                            </span>
                          ) : null}
                          {Number.isFinite(negotiation.responseCycleHours) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                              Response cycle {negotiation.responseCycleHours.toFixed(1)}h
                            </span>
                          ) : null}
                        </div>
                        {negotiation.nextStep ? (
                          <p className="mt-3 text-xs text-slate-500">
                            Next step: <span className="font-semibold text-slate-700">{negotiation.nextStep}</span>
                            {negotiation.nextStepDueAt ? ` · due ${formatRelativeTime(negotiation.nextStepDueAt)}` : ''}
                          </p>
                        ) : null}
                      </div>
                    ))
                  : (
                      <p className="text-sm text-slate-500">
                        No open negotiations. Follow up on pending invitations or craft a new strategic pitch.
                      </p>
                    )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Shared delivery plan</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Upcoming milestones & resources</h3>
              </div>
              <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-4 space-y-4">
              {(delivery.deliverables ?? []).slice(0, 3).map((deliverable) => (
                <div key={`${deliverable.collaborationId}-${deliverable.title}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-sm font-semibold text-slate-900">{deliverable.title}</p>
                  <p className="text-xs text-slate-500">
                    {deliverable.workspaceName ?? 'Agency workspace'} · {deliverable.owner ?? 'Shared owner'}
                  </p>
                  {deliverable.dueAt ? (
                    <p className="mt-2 text-xs text-blue-600" title={formatAbsolute(deliverable.dueAt)}>
                      Due {formatRelativeTime(deliverable.dueAt)} · {deliverable.status}
                    </p>
                  ) : null}
                </div>
              ))}
              {(delivery.resources ?? []).length ? (
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resource lanes</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600">
                    {delivery.resources.map((resource) => (
                      <li key={resource.role} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-700">{resource.role}</span>
                        <span>
                          {resource.committedHours}h committed · {resource.availableHours}h free
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Renewal insights</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Retention dashboard</h3>
              </div>
              <ChartPieIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-700">
                Retention score{' '}
                <span className="font-semibold text-blue-900">
                  {renewals.retentionScore != null ? `${Math.round(renewals.retentionScore)} / 100` : 'n/a'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming renewals</p>
                <ul className="mt-2 space-y-2 text-xs text-slate-600">
                  {(renewals.upcoming ?? []).slice(0, 4).map((entry) => (
                    <li key={`upcoming-${entry.collaborationId}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{entry.workspace?.name ?? 'Agency workspace'}</span>
                        <span title={formatAbsolute(entry.renewalDate)}>{formatRelativeTime(entry.renewalDate)}</span>
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        {formatCurrency(entry.monthlyValue, entry.currency)} · Health {formatHealth(entry.healthScore)}
                      </div>
                    </li>
                  ))}
                  {(renewals.upcoming ?? []).length === 0 ? (
                    <li className="text-xs text-slate-500">No renewals scheduled in the next 90 days.</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">At-risk relationships</p>
                <ul className="mt-2 space-y-2 text-xs text-rose-600">
                  {(renewals.atRisk ?? []).slice(0, 3).map((entry) => (
                    <li key={`risk-${entry.collaborationId}`} className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
                      <span className="font-semibold text-rose-700">{entry.workspace?.name ?? 'Agency workspace'}</span>
                      <span title={formatAbsolute(entry.renewalDate)}>{formatRelativeTime(entry.renewalDate)}</span>
                    </li>
                  ))}
                  {(renewals.atRisk ?? []).length === 0 ? (
                    <li className="text-xs text-slate-500">All retainers are tracking within safe thresholds.</li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {recentEvents.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ClockIcon className="h-5 w-5 text-blue-500" />
              Latest negotiation activity
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {recentEvents.slice(0, 6).map((event) => (
                <li key={`${event.negotiationId}-${event.occurredAt}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{event.negotiationName}</span>
                    <span className="text-xs text-slate-500" title={formatAbsolute(event.occurredAt)}>
                      {formatRelativeTime(event.occurredAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {event.workspace?.name ?? 'Agency workspace'} · {event.eventType?.replace(/_/g, ' ')}
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{event.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

