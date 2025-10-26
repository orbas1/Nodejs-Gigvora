import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';
import { getSupportDeskSnapshot } from '../../services/supportDesk.js';
import { formatRelativeTime } from '../../utils/date.js';

const STATUS_THEMES = {
  open: {
    label: 'Open',
    tone: 'border-sky-200 bg-sky-50 text-sky-600',
  },
  in_progress: {
    label: 'In progress',
    tone: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  waiting_on_customer: {
    label: 'Waiting on you',
    tone: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  escalated: {
    label: 'Escalated',
    tone: 'border-rose-200 bg-rose-50 text-rose-600',
  },
  resolved: {
    label: 'Resolved',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
};

const PRIORITY_THEMES = {
  urgent: 'border-rose-200 bg-rose-50 text-rose-600',
  high: 'border-rose-200 bg-rose-50 text-rose-600',
  medium: 'border-amber-200 bg-amber-50 text-amber-600',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-600',
};

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function hashString(value) {
  if (!value) {
    return 0;
  }
  let hash = 0;
  const stringified = `${value}`;
  for (let index = 0; index < stringified.length; index += 1) {
    hash = (hash << 5) - hash + stringified.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

const GRADIENTS = [
  'from-sky-500 via-sky-400 to-blue-500',
  'from-violet-500 via-fuchsia-500 to-purple-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-yellow-500',
  'from-rose-500 via-pink-500 to-rose-600',
];

function buildInitials(name) {
  if (!name) {
    return '?';
  }
  const parts = `${name}`
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  if (!parts.length) {
    return '?';
  }
  return parts
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function friendlyMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const minutes = Number(value);
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }
  const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  if (minutes < 60 * 24) {
    return `${formatter.format(minutes / 60)} hrs`;
  }
  if (minutes < 60 * 24 * 7) {
    return `${formatter.format(minutes / (60 * 24))} days`;
  }
  return `${formatter.format(minutes / (60 * 24 * 7))} wks`;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Math.round(Number(value));
}

function titleize(value) {
  if (!value) {
    return null;
  }
  return `${value}`
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolvePriorityIndex(priorityKey) {
  if (!priorityKey) {
    return PRIORITY_ORDER.length;
  }
  const normalised = `${priorityKey}`.toLowerCase();
  const index = PRIORITY_ORDER.indexOf(normalised);
  return index === -1 ? PRIORITY_ORDER.length : index;
}

function normaliseSnapshot(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const metrics = source.metrics && typeof source.metrics === 'object' ? source.metrics : {};
  const cases = Array.isArray(source.supportCases) ? source.supportCases.filter(Boolean) : [];
  const knowledgeBase = Array.isArray(source.knowledgeBase) ? source.knowledgeBase.filter(Boolean) : [];
  const playbooks = Array.isArray(source.playbooks) ? source.playbooks.filter(Boolean) : [];
  const specialistSource = Array.isArray(source.specialists)
    ? source.specialists.filter(Boolean)
    : cases
        .map((item) => item?.assignedAgent)
        .filter((agent) => agent && (agent.name || agent.email));

  const toFiniteNumber = (value, fallback = null) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const activeCases = cases.filter((item) => {
    const status = `${item?.status ?? ''}`.toLowerCase();
    return !['resolved', 'closed', 'completed', 'cancelled'].includes(status);
  });

  const awaitingCases = cases.filter((item) => {
    const status = `${item?.status ?? ''}`.toLowerCase();
    return ['waiting_on_customer', 'pending_customer', 'awaiting_customer'].includes(status);
  });

  const csatScore =
    metrics.csatTrailing30DayScore ?? metrics.csatScore ?? metrics.customerSatisfactionScore ?? null;
  const csatScoreNumber = toFiniteNumber(csatScore, null);
  const csatPercent = csatScoreNumber != null ? Math.round((csatScoreNumber / 5) * 100) : null;

  const disputeCandidates = Array.isArray(source.disputes) ? source.disputes.filter(Boolean) : [];

  const activeDispute = disputeCandidates
    .map((entry) => {
      const statusKey = `${entry?.status ?? ''}`.toLowerCase();
      const priorityKey = `${entry?.priority ?? ''}`.toLowerCase();
      const customerDeadlineAt = entry?.customerDeadlineAt ?? entry?.providerDeadlineAt ?? null;
      const priorityIndex = resolvePriorityIndex(priorityKey);
      return {
        id: entry?.id ?? hashString(entry?.reference ?? entry?.transaction?.reference ?? Math.random()),
        reference: entry?.transaction?.reference ?? entry?.reference ?? null,
        summary: entry?.summary ?? null,
        statusKey,
        statusLabel: titleize(statusKey) ?? 'Open',
        priorityKey,
        priorityLabel: priorityKey ? titleize(priorityKey) : null,
        priorityIndex,
        priorityTone: PRIORITY_THEMES[priorityKey] ?? PRIORITY_THEMES.high,
        customerDeadlineAt,
        deadlineRelative: customerDeadlineAt ? formatRelativeTime(customerDeadlineAt) : null,
      };
    })
    .filter((entry) => !['settled', 'closed', 'resolved'].includes(entry.statusKey))
    .sort((a, b) => {
      const priorityDelta = a.priorityIndex - b.priorityIndex;
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      const timeA = a.customerDeadlineAt ? new Date(a.customerDeadlineAt).getTime() : Number.POSITIVE_INFINITY;
      const timeB = b.customerDeadlineAt ? new Date(b.customerDeadlineAt).getTime() : Number.POSITIVE_INFINITY;
      return timeA - timeB;
    })[0] ?? null;

  return {
    lastRefreshedAt: source.refreshedAt ?? source.cachedAt ?? null,
    metrics: {
      activeCases: toFiniteNumber(metrics.openSupportCases, activeCases.length),
      awaitingReply: toFiniteNumber(metrics.awaitingReplyCases, awaitingCases.length),
      averageFirstResponseMinutes: toFiniteNumber(metrics.averageFirstResponseMinutes, null),
      averageResolutionMinutes: toFiniteNumber(metrics.averageResolutionMinutes, null),
      csatPercent,
      csatScore: csatScoreNumber,
      csatResponseRate: toFiniteNumber(metrics.csatResponseRate, null),
    },
    cases: activeCases.slice(0, 3).map((item, index) => {
      const statusKey = `${item?.status ?? ''}`.toLowerCase();
      const statusTheme = STATUS_THEMES[statusKey] ?? STATUS_THEMES.open;
      const priorityKey = `${item?.priority ?? ''}`.toLowerCase();
      const priorityTone = PRIORITY_THEMES[priorityKey] ?? PRIORITY_THEMES.medium;
      const updatedAt = item?.updatedAt ?? item?.lastMessageAt ?? item?.escalatedAt ?? null;
      const subject = item?.subject ?? item?.title ?? item?.reference ?? `Support case ${index + 1}`;
      return {
        id: item?.id ?? item?.reference ?? hashString(subject ?? Math.random()),
        reference: item?.reference ?? null,
        subject,
        summary: item?.summary ?? item?.reason ?? item?.description ?? null,
        statusKey,
        statusLabel: statusTheme.label,
        statusTone: statusTheme.tone,
        priorityLabel: priorityKey ? titleize(priorityKey) : null,
        priorityTone,
        updatedAt,
        relativeUpdatedAt: updatedAt ? formatRelativeTime(updatedAt) : null,
        assignedAgent: item?.assignedAgent
          ? {
              id: item.assignedAgent.id ?? item.assignedAgent.email ?? item.assignedAgent.name ?? index,
              name: item.assignedAgent.name ?? item.assignedAgent.email ?? null,
              role: item.assignedAgent.role ?? item.assignedAgent.title ?? null,
              presence:
                item.assignedAgent.presence ??
                item.assignedAgent.status ??
                item.assignedAgent.availability ??
                null,
            }
          : null,
        nextStep: item?.nextStep ?? item?.playbooks?.[0]?.playbook?.steps?.[0]?.instructions ?? null,
      };
    }),
    articles: knowledgeBase.slice(0, 3).map((article, index) => ({
      id: article?.id ?? article?.slug ?? hashString(article?.title ?? index ?? Math.random()),
      title: article?.title ?? null,
      summary: article?.summary ?? article?.description ?? null,
      url: article?.resourceLinks?.[0]?.url ?? null,
      label: article?.resourceLinks?.[0]?.label ?? null,
      tags: Array.isArray(article?.tags) ? article.tags.filter(Boolean).slice(0, 3) : [],
      lastReviewedAt: article?.lastReviewedAt ?? null,
    })),
    playbook: playbooks[0]
      ? {
          id: playbooks[0].id ?? hashString(playbooks[0].title ?? Math.random()),
          title: playbooks[0].title ?? null,
          summary: playbooks[0].summary ?? null,
          csatImpact: playbooks[0].csatImpact ?? null,
        }
      : null,
    specialists: specialistSource.slice(0, 3).map((specialist, index) => {
      const gradientIndex = Math.abs(hashString(specialist.id ?? specialist.name ?? index)) % GRADIENTS.length;
      const name = specialist.name ?? specialist.email ?? null;
      return {
        id: specialist.id ?? specialist.email ?? index,
        name,
        role: specialist.role ?? specialist.title ?? null,
        presence: specialist.presence ?? specialist.status ?? specialist.availability ?? null,
        initials: buildInitials(name),
        gradient: GRADIENTS[gradientIndex],
      };
    }),
    dispute: activeDispute,
  };
}

function SpecialistAvatar({ specialist }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={classNames(
          'relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-inner',
          specialist.gradient,
        )}
        aria-hidden="true"
      >
        {specialist.initials}
        <span
          className={classNames(
            'absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white',
            specialist.presence === 'online'
              ? 'bg-emerald-500'
              : specialist.presence === 'away'
                ? 'bg-amber-400'
                : 'bg-slate-300',
          )}
        />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900">{specialist.name}</span>
        <span className="text-xs text-slate-500">{specialist.role}</span>
      </div>
    </div>
  );
}

SpecialistAvatar.propTypes = {
  specialist: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    role: PropTypes.string,
    presence: PropTypes.string,
    initials: PropTypes.string,
    gradient: PropTypes.string,
  }).isRequired,
};

function CaseItem({ supportCase }) {
  return (
    <li className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {supportCase.subject}
            {supportCase.reference ? (
              <span className="ml-2 text-xs font-normal text-slate-400">{supportCase.reference}</span>
            ) : null}
          </p>
          {supportCase.summary ? (
            <p className="mt-1 text-sm text-slate-600">{supportCase.summary}</p>
          ) : null}
        </div>
        <span
          className={classNames(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            supportCase.statusTone,
          )}
        >
          {supportCase.statusLabel}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {supportCase.relativeUpdatedAt ? (
          <span className="inline-flex items-center gap-1">
            <ArrowPathIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Updated {supportCase.relativeUpdatedAt}
          </span>
        ) : null}
        {supportCase.priorityLabel ? (
          <span
            className={classNames(
              'inline-flex items-center rounded-full border px-2 py-0.5 font-medium capitalize',
              supportCase.priorityTone,
            )}
          >
            {supportCase.priorityLabel}
          </span>
        ) : null}
        {supportCase.assignedAgent?.name ? (
          <span className="inline-flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {supportCase.assignedAgent.name}
          </span>
        ) : null}
      </div>
      {supportCase.nextStep ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          {supportCase.nextStep}
        </p>
      ) : null}
    </li>
  );
}

CaseItem.propTypes = {
  supportCase: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subject: PropTypes.string,
    reference: PropTypes.string,
    summary: PropTypes.string,
    statusTone: PropTypes.string,
    statusLabel: PropTypes.string,
    priorityLabel: PropTypes.string,
    priorityTone: PropTypes.string,
    relativeUpdatedAt: PropTypes.string,
    assignedAgent: PropTypes.shape({
      name: PropTypes.string,
    }),
    nextStep: PropTypes.string,
  }).isRequired,
};

export default function SupportBubble({
  userId: userIdProp,
  snapshot: snapshotProp,
  actions,
  onAction,
  onOpenDesk,
  onScheduleCall,
  onNavigateKnowledge,
  onDismiss,
  className,
}) {
  const session = useSession();

  const resolvedUserId = useMemo(() => {
    const candidates = [
      userIdProp,
      session?.profile?.id,
      session?.user?.id,
      session?.account?.id,
      session?.organisation?.id,
    ];
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
      const stringified = `${candidate}`.trim();
      if (stringified) {
        return stringified;
      }
    }
    return null;
  }, [session, userIdProp]);

  const seededSnapshot = useMemo(() => {
    if (!snapshotProp) {
      return null;
    }
    if (snapshotProp.data) {
      return {
        data: snapshotProp.data,
        cachedAt: snapshotProp.cachedAt ?? snapshotProp.data?.refreshedAt ?? null,
        fromCache: snapshotProp.fromCache ?? false,
      };
    }
    return {
      data: snapshotProp,
      cachedAt: snapshotProp.refreshedAt ?? null,
      fromCache: false,
    };
  }, [snapshotProp]);

  const [snapshotState, setSnapshotState] = useState(() => ({
    loading: !seededSnapshot && Boolean(resolvedUserId),
    error: null,
    data: seededSnapshot?.data ?? null,
    cachedAt: seededSnapshot?.cachedAt ?? null,
    fromCache: seededSnapshot?.fromCache ?? false,
  }));

  useEffect(() => {
    if (!seededSnapshot) {
      return;
    }
    setSnapshotState({
      loading: false,
      error: null,
      data: seededSnapshot.data ?? null,
      cachedAt: seededSnapshot.cachedAt ?? null,
      fromCache: seededSnapshot.fromCache ?? false,
    });
  }, [seededSnapshot]);

  const [refreshing, setRefreshing] = useState(false);

  const loadSnapshot = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!resolvedUserId) {
        setSnapshotState({
          loading: false,
          error: 'We could not resolve a user profile for support insights.',
          data: null,
          cachedAt: null,
          fromCache: false,
        });
        return;
      }

      setSnapshotState((previous) => ({
        ...previous,
        loading: previous.data == null,
        error: null,
      }));

      if (forceRefresh) {
        setRefreshing(true);
      }

      try {
        const result = await getSupportDeskSnapshot(resolvedUserId, {
          forceRefresh,
        });
        setSnapshotState({
          loading: false,
          error: null,
          data: result.data ?? null,
          cachedAt: result.cachedAt ?? new Date(),
          fromCache: result.fromCache ?? false,
        });
      } catch (error) {
        const message = error?.message ?? 'Unable to load support insights right now.';
        setSnapshotState((previous) => ({ ...previous, loading: false, error: message }));
      } finally {
        setRefreshing(false);
      }
    },
    [resolvedUserId],
  );

  useEffect(() => {
    if (!seededSnapshot && resolvedUserId) {
      loadSnapshot();
    }
  }, [loadSnapshot, resolvedUserId, seededSnapshot]);

  const dataset = useMemo(() => {
    if (snapshotState.data) {
      return normaliseSnapshot(snapshotState.data);
    }
    if (seededSnapshot?.data) {
      return normaliseSnapshot(seededSnapshot.data);
    }
    return normaliseSnapshot(null);
  }, [seededSnapshot, snapshotState.data]);

  const isInitialLoading = snapshotState.loading && !snapshotState.data && !seededSnapshot?.data;
  const casesList = dataset.cases ?? [];
  const specialistsList = dataset.specialists ?? [];
  const articlesList = dataset.articles ?? [];
  const disputeHighlight = dataset.dispute ?? null;
  const metrics = dataset.metrics ?? {};
  const csatResponsePercent =
    metrics.csatResponseRate != null ? formatPercent(metrics.csatResponseRate) : null;

  const resolvedActions = useMemo(() => {
    if (Array.isArray(actions) && actions.length) {
      return actions;
    }
    return [
      {
        id: 'open-support-desk',
        label: 'Open support workspace',
        description: 'Jump into the full resolution centre to triage cases, analytics, and playbooks.',
        icon: LifebuoyIcon,
        tone: 'text-slate-900',
        onSelect: () => onOpenDesk?.(),
      },
      {
        id: 'schedule-concierge',
        label: 'Book a concierge session',
        description: 'Schedule a 25-minute deep dive with an operations specialist.',
        icon: CalendarDaysIcon,
        tone: 'text-violet-600',
        onSelect: () => onScheduleCall?.(),
      },
      {
        id: 'browse-knowledge',
        label: 'Review knowledge base',
        description: 'Curated guides and templates for onboarding, payouts, and growth programs.',
        icon: BookOpenIcon,
        tone: 'text-emerald-600',
        onSelect: () => {
          if (articlesList[0]?.url) {
            onNavigateKnowledge?.(articlesList[0].url, articlesList[0]);
          } else if (onNavigateKnowledge) {
            onNavigateKnowledge(null, null);
          }
        },
      },
    ];
  }, [actions, articlesList, onNavigateKnowledge, onOpenDesk, onScheduleCall]);

  const handleAction = useCallback(
    async (action) => {
      if (!action || typeof action.onSelect !== 'function') {
        return;
      }
      await action.onSelect(action);
      if (onAction) {
        onAction(action);
      }
    },
    [onAction],
  );

  const errorState = snapshotState.error;

  return (
    <section
      className={classNames(
        'relative flex w-full flex-col gap-6 rounded-[32px] border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur',
        'ring-1 ring-inset ring-slate-900/5',
        className,
      )}
      aria-live="polite"
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          aria-label="Dismiss support bubble"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Concierge support</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/20">
              <LifebuoyIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            Resolution bubble
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Stay ahead of escalations with concierge insights, curated playbooks, and actions that keep members confident.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {snapshotState.cachedAt ? (
              <>
                <ArrowPathIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Synced {formatRelativeTime(snapshotState.cachedAt)}
                {snapshotState.fromCache ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Cached</span> : null}
              </>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />
                Loading concierge data
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => loadSnapshot({ forceRefresh: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
            Refresh snapshot
          </button>
        </div>
      </header>

      {errorState ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
          <p className="flex items-center gap-2 font-semibold">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            We couldn’t load live data
          </p>
          <p className="mt-1 text-rose-500">{errorState}</p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active cases</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {isInitialLoading ? (
              <span className="inline-flex h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
            ) : (
              metrics.activeCases ?? '—'
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isInitialLoading
              ? 'Loading concierge metrics…'
              : metrics.awaitingReply > 0
                ? `${metrics.awaitingReply} waiting on your cue`
                : 'All cases have live ownership'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avg. first response</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {isInitialLoading ? (
              <span className="inline-flex h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
            ) : metrics.averageFirstResponseMinutes != null
              ? friendlyMinutes(metrics.averageFirstResponseMinutes)
              : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isInitialLoading
              ? 'Checking latest SLA performance…'
              : 'Concierge replies within the premium SLA window.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">CSAT (30d)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-slate-900">
              {isInitialLoading
                ? <span className="inline-flex h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
                : metrics.csatPercent != null
                  ? `${metrics.csatPercent}%`
                  : '—'}
            </p>
            {!isInitialLoading && metrics.csatScore != null ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                {metrics.csatScore.toFixed(2)} / 5
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isInitialLoading
              ? 'Gathering sentiment across resolutions…'
              : csatResponsePercent != null
                ? `${csatResponsePercent}% response rate`
                : 'Collecting sentiment across recent resolutions.'}
          </p>
        </div>
      </section>

      {dataset.playbook ? (
        <section className="rounded-3xl border border-violet-200 bg-violet-50/70 p-5 shadow-inner shadow-violet-200/60">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-500">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Focus playbook
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">{dataset.playbook.title}</p>
              {dataset.playbook.summary ? (
                <p className="mt-1 text-sm text-slate-600">{dataset.playbook.summary}</p>
              ) : null}
            </div>
            {dataset.playbook.csatImpact ? (
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-600 shadow-sm shadow-violet-200/70">
                {dataset.playbook.csatImpact}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Live support threads</h3>
            <span className="text-xs text-slate-500">{metrics.activeCases ?? '—'} in progress</span>
          </div>
          {isInitialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`case-skeleton-${index}`}
                  className="h-28 animate-pulse rounded-3xl border border-slate-200/70 bg-slate-100"
                />
              ))}
            </div>
          ) : casesList.length ? (
            <ul className="space-y-3">
              {casesList.map((supportCase) => (
                <CaseItem key={supportCase.id} supportCase={supportCase} />
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No active support cases right now. Your concierge team will notify you instantly when new requests arrive.
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
            <h3 className="text-sm font-semibold text-slate-900">Concierge team</h3>
            <p className="mt-1 text-xs text-slate-500">Premium specialists ready to step in.</p>
            <div className="mt-3 space-y-3">
              {isInitialLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`specialist-skeleton-${index}`}
                    className="h-12 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))
              ) : specialistsList.length ? (
                specialistsList.map((specialist) => (
                  <SpecialistAvatar key={specialist.id} specialist={specialist} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                  Your concierge squad will introduce themselves here once assigned to an active case.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
            <h3 className="text-sm font-semibold text-slate-900">Knowledge highlights</h3>
            {isInitialLoading ? (
              <div className="mt-2 space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={`knowledge-skeleton-${index}`}
                    className="h-16 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))}
              </div>
            ) : articlesList.length ? (
              <ul className="mt-2 space-y-3">
                {articlesList.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateKnowledge) {
                          onNavigateKnowledge(article.url ?? null, article);
                        }
                        if (onAction) {
                          onAction({ type: 'knowledge-navigate', article });
                        }
                      }}
                      className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-transparent px-0 py-1 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                          {article.title}
                        </p>
                        {article.summary ? (
                          <p className="mt-1 text-xs text-slate-500">{article.summary}</p>
                        ) : null}
                        {article.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {article.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <ArrowUpRightIcon className="mt-1 h-4 w-4 text-slate-400 transition group-hover:text-slate-600" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                No curated guides just yet. As new cases close, we’ll drop tailored playbooks and knowledge base picks here.
              </div>
            )}
          </div>
          {disputeHighlight ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm shadow-amber-200/40">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                Active dispute
              </p>
              <div className="mt-2 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  {disputeHighlight.summary ?? 'Review dispute details to keep funds protected.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {disputeHighlight.reference ? (
                    <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600">
                      {disputeHighlight.reference}
                    </span>
                  ) : null}
                  {disputeHighlight.priorityLabel ? (
                    <span
                      className={classNames(
                        'inline-flex items-center rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide text-[10px]',
                        disputeHighlight.priorityTone,
                      )}
                    >
                      {disputeHighlight.priorityLabel}
                    </span>
                  ) : null}
                  {disputeHighlight.deadlineRelative ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      Response due {disputeHighlight.deadlineRelative}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          Concierge SLAs monitored 24/7 with telemetry hooks.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resolvedActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
                action.tone,
              )}
            >
              {action.icon ? <action.icon className="h-4 w-4" aria-hidden="true" /> : null}
              {action.label}
            </button>
          ))}
        </div>
      </footer>
    </section>
  );
}

SupportBubble.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  snapshot: PropTypes.oneOfType([
    PropTypes.shape({
      data: PropTypes.object,
      cachedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      fromCache: PropTypes.bool,
    }),
    PropTypes.object,
  ]),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.elementType,
      onSelect: PropTypes.func,
      tone: PropTypes.string,
    }),
  ),
  onAction: PropTypes.func,
  onOpenDesk: PropTypes.func,
  onScheduleCall: PropTypes.func,
  onNavigateKnowledge: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

SupportBubble.defaultProps = {
  userId: null,
  snapshot: null,
  actions: null,
  onAction: null,
  onOpenDesk: null,
  onScheduleCall: null,
  onNavigateKnowledge: null,
  onDismiss: null,
  className: undefined,
};
