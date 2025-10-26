import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  InboxStackIcon,
} from '@heroicons/react/24/outline';
import { getSupportDeskSnapshot } from '../../services/supportDesk.js';

function humanizeLabel(value) {
  if (!value) return '—';
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (absMinutes < 60) {
    return formatter.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

function formatDurationMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const minutes = Number(value);
  if (minutes < 60) {
    return `${minutes.toFixed(1)} mins`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

function MetricCard({ icon: Icon, label, value, caption, loading }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-100/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <Icon className="h-5 w-5 text-blue-500" />
      </div>
      <p className={`mt-3 text-2xl font-semibold ${loading ? 'text-slate-300' : 'text-slate-900'}`}>
        {loading ? <span className="inline-flex h-6 w-20 animate-pulse rounded bg-slate-200" /> : value}
      </p>
      {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
    </div>
  );
}

function TranscriptItem({ message }) {
  return (
    <div className="relative pl-5">
      <span className="absolute left-0 top-2 h-2 w-2 -translate-x-1.5 rounded-full bg-blue-400" />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{message.sender?.name ?? 'System'}</p>
        <p className="text-xs text-slate-500">{formatDateTime(message.createdAt)}</p>
      </div>
      {message.body ? <p className="mt-1 text-sm text-slate-600">{message.body}</p> : null}
      {Array.isArray(message.attachments) && message.attachments.length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          {message.attachments.map((attachment) => (
            <li key={attachment.id ?? attachment.storageKey} className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-300" />
              <span>
                {attachment.fileName}
                {attachment.fileSize ? ` • ${(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function SupportDeskPanel({
  userId: userIdProp = null,
  freelancerId = null,
  initialSnapshot = null,
  onClose = null,
}) {
  const resolvedUserId = useMemo(() => {
    const candidates = [userIdProp, freelancerId];
    for (const candidate of candidates) {
      if (candidate == null) {
        continue;
      }
      const parsed = Number.parseInt(candidate, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  }, [userIdProp, freelancerId]);

  const seededSnapshot = useMemo(() => {
    if (!initialSnapshot) {
      return null;
    }
    if (initialSnapshot.data) {
      return {
        data: initialSnapshot.data,
        cachedAt: initialSnapshot.cachedAt ?? null,
        fromCache: initialSnapshot.fromCache ?? false,
      };
    }
    return { data: initialSnapshot, cachedAt: null, fromCache: false };
  }, [initialSnapshot]);

  const [state, setState] = useState(() =>
    seededSnapshot
      ? { loading: false, error: null, data: seededSnapshot.data, cachedAt: seededSnapshot.cachedAt ?? null }
      : { loading: true, error: null, data: null, cachedAt: null },
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadSnapshot = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!resolvedUserId) {
        setState({
          loading: false,
          error: 'User context is missing for the support desk module.',
          data: null,
          cachedAt: null,
        });
        return;
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setState((prev) => ({ ...prev, loading: prev.data == null, error: null }));
      }

      try {
        const result = await getSupportDeskSnapshot(resolvedUserId, { forceRefresh });
        setState({ loading: false, error: null, data: result.data, cachedAt: result.cachedAt ?? null });
      } catch (error) {
        const message = error?.message ?? 'Unable to load support desk insights.';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      } finally {
        setRefreshing(false);
      }
    },
    [resolvedUserId],
  );

  useEffect(() => {
    if (seededSnapshot) {
      setState({
        loading: false,
        error: null,
        data: seededSnapshot.data,
        cachedAt: seededSnapshot.cachedAt ?? null,
      });
      return;
    }
    if (!resolvedUserId) {
      setState({
        loading: false,
        error: 'User context is missing for the support desk module.',
        data: null,
        cachedAt: null,
      });
      return;
    }
    loadSnapshot();
  }, [seededSnapshot, resolvedUserId, loadSnapshot]);

  const isLoading = state.loading && !state.data;
  const hasBlockingError = state.error && !state.data;
  const metrics = state.data?.metrics ?? {};
  const supportCases = state.data?.supportCases ?? [];
  const disputes = state.data?.disputes ?? [];
  const playbooks = state.data?.playbooks ?? [];
  const knowledgeBase = state.data?.knowledgeBase ?? [];

  const metricCards = useMemo(
    () => [
      {
        key: 'openSupportCases',
        label: 'Open support cases',
        value: formatNumber(metrics.openSupportCases ?? supportCases.length ?? 0),
        caption: `${formatNumber(supportCases.length)} case${supportCases.length === 1 ? '' : 's'} loaded`,
        icon: ChatBubbleLeftRightIcon,
      },
      {
        key: 'openDisputes',
        label: 'Active disputes',
        value: formatNumber(metrics.openDisputes ?? disputes.length ?? 0),
        caption: disputes.length ? 'Includes linked escrow transactions' : 'No disputes linked to your gigs',
        icon: ShieldCheckIcon,
      },
      {
        key: 'averageFirstResponseMinutes',
        label: 'Avg first reply',
        value: formatDurationMinutes(metrics.averageFirstResponseMinutes),
        caption: 'Measured from escalation to first response',
        icon: ClockIcon,
      },
      {
        key: 'averageResolutionMinutes',
        label: 'Avg resolution time',
        value: formatDurationMinutes(metrics.averageResolutionMinutes),
        caption: 'Across all closed support cases',
        icon: InboxStackIcon,
      },
      {
        key: 'csatScore',
        label: 'CSAT (lifetime)',
        value: metrics.csatScore != null ? `${Number(metrics.csatScore).toFixed(2)}/5` : '—',
        caption:
          metrics.csatResponses != null
            ? `${formatNumber(metrics.csatResponses)} responses • ${metrics.csatResponseRate != null ? `${metrics.csatResponseRate}% response rate` : 'response rate pending'}`
            : undefined,
        icon: SparklesIcon,
      },
      {
        key: 'csatTrailing30DayScore',
        label: 'CSAT (30 days)',
        value:
          metrics.csatTrailing30DayScore != null ? `${Number(metrics.csatTrailing30DayScore).toFixed(2)}/5` : '—',
        caption: 'Most recent customer pulse checks',
        icon: SparklesIcon,
      },
    ],
    [metrics, supportCases.length, disputes.length],
  );

  if (hasBlockingError) {
    return (
      <section className="space-y-6 rounded-3xl border border-rose-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(190,18,60,0.25)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Support desk unavailable</p>
            <h2 className="mt-1 text-2xl font-semibold text-rose-700">We couldn’t load your resolution workspace</h2>
            <p className="mt-2 max-w-2xl text-sm text-rose-600">{state.error}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadSnapshot({ forceRefresh: true })}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 shadow-sm transition hover:border-rose-400 hover:bg-rose-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Try again
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-200"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
                Back to overview
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-8 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-6 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.25)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Support & dispute desk</p>
            <h2 className="mt-1 text-2xl font-semibold text-blue-900">Resolution control centre</h2>
            <p className="mt-2 max-w-3xl text-sm text-blue-900/80">
              Monitor every escalation, replay transcripts with linked gig orders, and apply resolution playbooks without
              leaving your dashboard. Finance sync and CSAT tracking keep payouts, refunds, and goodwill credits aligned.
            </p>
            {state.data?.refreshedAt ? (
              <p className="mt-3 text-xs text-blue-700/80">
                Snapshot refreshed {formatRelativeTime(state.data.refreshedAt)} · {formatDateTime(state.data.refreshedAt)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadSnapshot({ forceRefresh: true })}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
              disabled={refreshing}
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh snapshot
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
                Back to overview
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">We’re showing your last known data while we retry in the background.</p>
          <p className="text-xs">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.key}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            caption={metric.caption}
            loading={false}
          />
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Active support cases</h3>
            <p className="text-sm text-slate-500">Latest transcripts, assignments, and SLA checkpoints.</p>
          </div>
        </div>
        {supportCases.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No escalations are currently open. When you escalate a conversation, the full transcript and guidance will appear
            here automatically.
          </div>
        ) : (
          <div className="space-y-6">
            {supportCases.map((supportCase) => {
              const transcript = Array.isArray(supportCase.transcript)
                ? supportCase.transcript.slice(-12)
                : [];
              const latestSurvey = supportCase.surveys?.[0];
              const linkedOrder = supportCase.linkedOrder ?? null;
              return (
                <article
                  key={supportCase.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.18)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                          Case #{supportCase.id}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                          {humanizeLabel(supportCase.status)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                          Priority: {humanizeLabel(supportCase.priority)}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{supportCase.reason}</p>
                      <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                        <span>Escalated {formatDateTime(supportCase.escalatedAt)}</span>
                        <span>First reply {formatDateTime(supportCase.firstResponseAt)}</span>
                        {supportCase.resolvedAt ? <span>Resolved {formatDateTime(supportCase.resolvedAt)}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {supportCase.assignedAgent ? (
                          <span>
                            Assigned to <span className="font-medium text-slate-700">{supportCase.assignedAgent.name}</span>
                          </span>
                        ) : (
                          <span>Awaiting assignment</span>
                        )}
                        {linkedOrder ? (
                          <span>
                            Linked order: <span className="font-medium text-slate-700">{linkedOrder.reference}</span>{' '}
                            {linkedOrder.amount != null
                              ? formatCurrency(linkedOrder.amount, linkedOrder.currencyCode ?? 'USD')
                              : null}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transcript</h4>
                      <div className="mt-3 space-y-4 border-l border-slate-200 pl-4">
                        {transcript.map((message, index) => (
                          <TranscriptItem key={message.id ?? `${supportCase.id}-${index}`} message={message} />
                        ))}
                      </div>
                    </div>

                    {supportCase.playbooks?.length ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">Assigned playbooks</p>
                        <div className="mt-3 space-y-3">
                          {supportCase.playbooks.map((casePlaybook) => (
                            <div key={casePlaybook.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {casePlaybook.playbook?.title ?? 'Resolution playbook'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {casePlaybook.playbook?.summary ?? 'Follow the guided steps to reach resolution.'}
                                  </p>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                                  {humanizeLabel(casePlaybook.status)}
                                </span>
                              </div>
                              {casePlaybook.playbook?.steps?.length ? (
                                <ol className="mt-3 space-y-2 text-sm text-slate-600">
                                  {casePlaybook.playbook.steps.map((step) => (
                                    <li key={step.id ?? `${casePlaybook.id}-${step.stepNumber}`} className="flex gap-2">
                                      <span className="font-semibold text-blue-600">{step.stepNumber}.</span>
                                      <span>
                                        <span className="font-medium text-slate-700">{step.title}</span>
                                        {step.instructions ? ` — ${step.instructions}` : ''}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              ) : null}
                              {casePlaybook.notes ? (
                                <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                  {casePlaybook.notes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {latestSurvey ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800">
                        <p className="text-xs font-semibold uppercase tracking-wide">Latest CSAT pulse</p>
                        <p className="mt-1 text-sm">
                          {latestSurvey.score}/5 — {latestSurvey.comment || 'Feedback captured without additional comment.'}
                        </p>
                        <p className="text-xs text-emerald-700/80">Captured {formatDateTime(latestSurvey.capturedAt)}</p>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Dispute queue & timeline</h3>
            <p className="text-sm text-slate-500">Linked escrow disputes with the latest event per case.</p>
          </div>
        </div>
        {disputes.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No disputes are currently tied to your gigs. When a client escalates through escrow, the live case status will
            surface here along with mediation notes.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Last update</th>
                  <th className="px-4 py-3">Latest note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((dispute) => {
                  const transaction = dispute.transaction ?? {};
                  const lastEvent = Array.isArray(dispute.events) && dispute.events.length
                    ? dispute.events[dispute.events.length - 1]
                    : null;
                  return (
                    <tr key={dispute.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">#{dispute.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{humanizeLabel(dispute.stage)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{humanizeLabel(dispute.priority)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{humanizeLabel(dispute.status)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {transaction.amount != null
                          ? formatCurrency(transaction.amount, transaction.currencyCode ?? 'USD')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(dispute.updatedAt ?? dispute.openedAt)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {lastEvent?.notes ?? humanizeLabel(lastEvent?.actionType) ?? 'Awaiting next action'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Resolution playbooks</h3>
            <p className="text-sm text-slate-500">Library of Gigvora-sanctioned workflows you can assign to any escalation.</p>
          </div>
        </div>
        {playbooks.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Playbooks will appear here as Gigvora publishes new guidance. Assign a playbook from any support case to see its
            steps inline.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {playbooks.map((playbook) => (
              <div key={playbook.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
                      {humanizeLabel(playbook.stage)} · {humanizeLabel(playbook.persona)}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{playbook.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{playbook.summary}</p>
                  </div>
                  <BookOpenIcon className="h-6 w-6 text-blue-500" />
                </div>
                {playbook.csatImpact ? (
                  <p className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    {playbook.csatImpact}
                  </p>
                ) : null}
                {playbook.steps?.length ? (
                  <ol className="mt-4 space-y-2 text-sm text-slate-600">
                    {playbook.steps.map((step) => (
                      <li key={step.id ?? `${playbook.id}-${step.stepNumber}`} className="flex gap-2">
                        <span className="font-semibold text-blue-600">{step.stepNumber}.</span>
                        <span>
                          <span className="font-medium text-slate-700">{step.title}</span>
                          {step.instructions ? ` — ${step.instructions}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Knowledge base highlights</h3>
            <p className="text-sm text-slate-500">Gigvora policies, financial guardrails, and evidence playbooks curated for freelancers.</p>
          </div>
        </div>
        {knowledgeBase.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Once Gigvora publishes support articles for your segment, they will be pinned here for quick reference.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {knowledgeBase.map((article) => (
              <article key={article.id ?? article.slug} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {humanizeLabel(article.category)} · {humanizeLabel(article.audience)}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{article.title}</h4>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{article.summary}</p>
                {Array.isArray(article.tags) && article.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {Array.isArray(article.resourceLinks) && article.resourceLinks.length ? (
                  <ul className="mt-3 space-y-1 text-sm text-blue-600">
                    {article.resourceLinks.map((resource) => (
                      <li key={resource.url ?? resource.label}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <BookOpenIcon className="h-4 w-4" />
                          {resource.label ?? resource.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {article.lastReviewedAt ? (
                  <p className="mt-3 text-xs text-slate-400">
                    Last reviewed {formatDateTime(article.lastReviewedAt)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

SupportDeskPanel.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  freelancerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialSnapshot: PropTypes.oneOfType([PropTypes.object, PropTypes.shape({})]),
  onClose: PropTypes.func,
};

