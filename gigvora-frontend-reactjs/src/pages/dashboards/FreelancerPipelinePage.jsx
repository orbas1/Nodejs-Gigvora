import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import useSession from '../../hooks/useSession.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import { FREELANCER_PIPELINE_STAGES } from '../../constants/freelancerPipelineStages.js';
import { resolveFreelancerIdFromSession } from '../../utils/dashboard/freelancer.js';
import { fetchFreelancerPipelineDashboard } from '../../services/pipeline.js';
import { formatRelativeTime } from '../../utils/date.js';
import { trackDashboardEvent } from '../../utils/analytics.js';

const ALLOWED_ROLES = ['freelancer'];

function normaliseKey(value) {
  if (value == null) {
    return '';
  }
  return `${value}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const STAGE_ALIAS_LOOKUP = FREELANCER_PIPELINE_STAGES.reduce((lookup, stage, index) => {
  lookup.set(normaliseKey(stage.id), stage.id);
  lookup.set(normaliseKey(index), stage.id);
  for (const alias of stage.aliases ?? []) {
    lookup.set(normaliseKey(alias), stage.id);
  }
  return lookup;
}, new Map());

function mapPipelineStages(pipelineStages) {
  const mapping = new Map();
  if (!Array.isArray(pipelineStages)) {
    return mapping;
  }
  const sorted = [...pipelineStages].sort((a, b) => {
    const aWeight = a?.winProbability ?? a?.probability ?? 0;
    const bWeight = b?.winProbability ?? b?.probability ?? 0;
    return aWeight - bWeight;
  });

  sorted.forEach((stage, index) => {
    const candidates = [stage?.key, stage?.id, stage?.stageKey, stage?.name, stage?.stageName];
    let resolved = null;
    for (const candidate of candidates) {
      const mapped = STAGE_ALIAS_LOOKUP.get(normaliseKey(candidate));
      if (mapped) {
        resolved = mapped;
        break;
      }
    }
    if (!resolved && index < FREELANCER_PIPELINE_STAGES.length) {
      resolved = FREELANCER_PIPELINE_STAGES[index].id;
    }
    if (resolved) {
      candidates.forEach((candidate) => {
        if (candidate != null && `${candidate}`.length > 0) {
          mapping.set(normaliseKey(candidate), resolved);
        }
      });
    }
  });

  return mapping;
}

function resolveStageId(value, stageOrderMapping) {
  if (value == null) {
    return null;
  }
  const key = normaliseKey(value);
  return STAGE_ALIAS_LOOKUP.get(key) ?? stageOrderMapping.get(key) ?? null;
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return typeof value === 'number' ? value.toLocaleString() : `${value}`;
  }
}

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value)}%`;
}

function firstDate(dates) {
  return dates
    .map((value) => {
      if (!value) {
        return null;
      }
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    })
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime())[0];
}

function normalisePipelineDashboard(payload) {
  if (!payload) {
    return null;
  }

  const stageOrderMapping = mapPipelineStages(payload.stages ?? payload.stageDefinitions ?? []);
  const deals = Array.isArray(payload.deals) ? payload.deals : [];
  const followUps = Array.isArray(payload.followUps) ? payload.followUps : [];
  const summary = payload.summary ?? {};
  const analytics = payload.analytics ?? payload.metrics ?? {};
  const currency = summary.currency ?? summary.currencyCode ?? payload.currency ?? 'USD';

  const derivedStageMetrics = {};
  const suppliedStageMetrics = payload.stageMetrics ?? payload.stageSummary ?? {};
  if (suppliedStageMetrics && typeof suppliedStageMetrics === 'object') {
    Object.entries(suppliedStageMetrics).forEach(([key, metrics]) => {
      const stageId = resolveStageId(key, stageOrderMapping);
      if (!stageId) {
        return;
      }
      const count = Number(metrics?.count ?? metrics?.total ?? 0);
      const pipelineValue = Number(metrics?.pipelineValue ?? metrics?.value ?? 0);
      derivedStageMetrics[stageId] = {
        count: Number.isFinite(count) ? count : 0,
        pipelineValue: Number.isFinite(pipelineValue) ? pipelineValue : 0,
        aiCue: metrics?.aiCue ?? metrics?.coaching ?? null,
      };
    });
  }

  const stageSummaries = FREELANCER_PIPELINE_STAGES.reduce((acc, stage) => {
    const metrics = derivedStageMetrics[stage.id] ?? {};
    acc[stage.id] = {
      count: metrics.count ?? 0,
      pipelineValue: metrics.pipelineValue ?? 0,
      weightedValue: metrics.weightedValue ?? 0,
      aiCue: metrics.aiCue ?? null,
      nextFollowUp: metrics.nextFollowUp ?? null,
      reminders: [],
      notes: [],
    };
    return acc;
  }, {});

  const dealStageIndex = {};
  let totalWeightedValue = 0;
  let totalPipelineValue = 0;
  let wonCount = 0;
  let lostCount = 0;
  const dueDates = [];

  deals.forEach((deal, index) => {
    const stageId =
      resolveStageId(deal.stageId, stageOrderMapping) ??
      resolveStageId(deal.stageKey, stageOrderMapping) ??
      resolveStageId(deal.stageName, stageOrderMapping) ??
      resolveStageId(deal.stage?.id, stageOrderMapping) ??
      resolveStageId(deal.stage?.name, stageOrderMapping);

    let resolvedStageId = stageId;
    if (!resolvedStageId) {
      if (deal.status === 'won' || deal.statusCategory === 'won') {
        resolvedStageId = 'kickoff';
      } else if (deal.status === 'offer' || deal.statusCategory === 'offer') {
        resolvedStageId = 'offer';
      }
    }
    if (!resolvedStageId) {
      return;
    }

    const summaryForStage = stageSummaries[resolvedStageId];
    if (!summaryForStage) {
      return;
    }

    summaryForStage.count += 1;
    const value = Number(deal.pipelineValue ?? deal.value ?? 0);
    if (Number.isFinite(value)) {
      summaryForStage.pipelineValue += value;
      totalPipelineValue += value;
    }
    const probabilityRaw =
      deal.probability ?? deal.winProbability ?? (typeof deal.probabilityPercent === 'number' ? deal.probabilityPercent / 100 : null);
    const probability =
      probabilityRaw != null && probabilityRaw > 1 ? probabilityRaw / 100 : probabilityRaw != null ? probabilityRaw : null;
    if (Number.isFinite(value) && Number.isFinite(probability)) {
      summaryForStage.weightedValue += value * probability;
      totalWeightedValue += value * probability;
    }

    if (deal.nextFollowUpAt) {
      dueDates.push(deal.nextFollowUpAt);
      const existing = summaryForStage.nextFollowUp;
      const nextCandidate = firstDate([existing, deal.nextFollowUpAt]);
      summaryForStage.nextFollowUp = nextCandidate ?? existing;
    }

    if (deal.notes) {
      summaryForStage.notes.push({
        id: `${deal.id ?? index}-note`,
        company: deal.company ?? deal.clientName ?? 'Client',
        text: deal.notes,
      });
    }

    const idKey = `${deal.id ?? `deal-${index}`}`;
    dealStageIndex[idKey] = resolvedStageId;

    if (deal.status === 'won' || deal.statusCategory === 'won') {
      wonCount += 1;
    } else if (deal.status === 'lost' || deal.statusCategory === 'lost') {
      lostCount += 1;
    }
  });

  followUps.forEach((followUp, index) => {
    const stageId =
      resolveStageId(followUp.stageId, stageOrderMapping) ??
      dealStageIndex[`${followUp.dealId ?? ''}`] ??
      resolveStageId(followUp.stageKey, stageOrderMapping);
    if (!stageId || !stageSummaries[stageId]) {
      return;
    }
    const dueDate = followUp.dueAt ?? followUp.dueDate ?? followUp.nextDueAt;
    if (dueDate) {
      dueDates.push(dueDate);
      const existing = stageSummaries[stageId].nextFollowUp;
      const nextCandidate = firstDate([existing, dueDate]);
      stageSummaries[stageId].nextFollowUp = nextCandidate ?? existing;
    }
    stageSummaries[stageId].reminders.push({
      id: `${followUp.id ?? `follow-${index}`}`,
      ...followUp,
      dueAt: dueDate ?? null,
      stageId,
    });
  });

  FREELANCER_PIPELINE_STAGES.forEach((stage) => {
    const summaryForStage = stageSummaries[stage.id];
    if (!summaryForStage.aiCue) {
      summaryForStage.aiCue = stage.coaching;
    }
    if (summaryForStage.notes.length > 3) {
      summaryForStage.notes = summaryForStage.notes.slice(0, 3);
    }
  });

  const dueSoonThreshold = new Date();
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 2);
  const followUpsDue = followUps.filter((followUp) => {
    const dueDate = followUp.dueAt ?? followUp.dueDate ?? followUp.nextDueAt;
    if (!dueDate) {
      return false;
    }
    const date = new Date(dueDate);
    return !Number.isNaN(date.getTime()) && date <= dueSoonThreshold;
  }).length;

  const openDeals = deals.filter((deal) => deal.status !== 'lost' && deal.statusCategory !== 'lost').length;

  const computedSummary = {
    openDeals,
    offers: summary.offers ?? stageSummaries.offer?.count ?? 0,
    wonThisQuarter: summary.wonThisQuarter ?? wonCount,
    pipelineValue: summary.pipelineValue ?? totalPipelineValue,
    weightedPipelineValue: summary.weightedPipelineValue ?? totalWeightedValue,
    followUpsDue: summary.followUpsDue ?? followUpsDue,
    interviewsScheduled: summary.interviewsScheduled ?? stageSummaries.interviewing?.count ?? 0,
    currency,
  };

  const winRate = analytics.winRate ?? (wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : null);
  const velocityDays = analytics.velocityDays ?? (() => {
    const durations = deals
      .map((deal) => {
        const closeDate = deal.expectedCloseDate ?? deal.closeDate;
        if (!closeDate) {
          return null;
        }
        const parsed = new Date(closeDate);
        if (Number.isNaN(parsed.getTime())) {
          return null;
        }
        const diffMs = parsed.getTime() - Date.now();
        return diffMs / (1000 * 60 * 60 * 24);
      })
      .filter((value) => value != null);
    if (!durations.length) {
      return null;
    }
    const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return Math.round(avg);
  })();

  const normalisedAnalytics = {
    winRate,
    velocityDays,
    conversionTrend: analytics.conversionTrend ?? null,
    activeCampaigns: analytics.activeCampaigns ?? null,
  };

  return {
    summary: computedSummary,
    analytics: normalisedAnalytics,
    stageSummaries,
    deals,
    followUps,
    dealStageIndex,
    currency,
    fallback: Boolean(payload.__fallback),
    nextFollowUp: firstDate(dueDates) ?? null,
  };
}

function StageCard({ stage, summary, currency, onTrack }) {
  const Icon = stage.icon;
  const countLabel = summary.count === 1 ? 'deal' : 'deals';
  const pipelineLabel = formatCurrency(summary.pipelineValue, currency);
  const suggestion = summary.aiCue ?? stage.coaching;
  const notes = summary.notes ?? [];
  const nextFollowUp = summary.nextFollowUp ? formatRelativeTime(summary.nextFollowUp, { numeric: 'auto' }) : null;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60">
      <div className="flex items-start justify-between gap-4">
        <div className={\`flex h-12 w-12 items-center justify-center rounded-full ${stage.tone}\`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        {summary.progress != null ? (
          <span className="text-xs font-semibold text-slate-400">{Math.round(summary.progress * 100)}% of pipeline</span>
        ) : null}
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{stage.label}</h2>
          <p className="mt-1 text-sm text-slate-600">{stage.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {summary.count ? formatNumber(summary.count) : '0'} {countLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{pipelineLabel}</span>
          {nextFollowUp ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Next follow-up {nextFollowUp}</span>
          ) : (
            <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-500">No follow-ups scheduled</span>
          )}
        </div>
        <p className="text-sm text-slate-600">{suggestion}</p>
        {notes.length ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">{note.company}</p>
                <p className="mt-0.5 leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {stage.cta ? (
        <Link
          to={stage.cta.href}
          onClick={() => onTrack?.(stage)}
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
        >
          {stage.cta.label}
        </Link>
      ) : null}
    </article>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function ReminderItem({ reminder, stage, currency }) {
  const dueLabel = reminder.dueAt ? formatRelativeTime(reminder.dueAt, { numeric: 'auto' }) : 'No due date';
  const channel = reminder.channel ? reminder.channel.replace(/_/g, ' ') : 'message';
  return (
    <li className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-600">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-600">{stage?.label ?? 'Pipeline task'}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{channel}</span>
      </div>
      <p className="font-semibold text-slate-900">{reminder.subject ?? 'Follow up'}</p>
      <p className="text-xs text-slate-500">Due {dueLabel}</p>
      {reminder.link ? (
        <Link
          to={reminder.link}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
        >
          Open workspace
        </Link>
      ) : null}
      {reminder.amount ? (
        <p className="text-xs text-slate-500">Value {formatCurrency(reminder.amount, currency)}</p>
      ) : null}
    </li>
  );
}

export default function FreelancerPipelinePage() {
  const { session } = useSession();
  const freelancerId = useMemo(() => resolveFreelancerIdFromSession(session), [session]);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!freelancerId) {
        return null;
      }
      return fetchFreelancerPipelineDashboard(freelancerId, { signal });
    },
    [freelancerId],
  );

  const pipelineResource = useCachedResource(
    freelancerId ? `freelancer:${freelancerId}:pipeline-dashboard` : 'freelancer:pipeline:pending',
    fetcher,
    {
      enabled: Boolean(freelancerId),
      dependencies: [freelancerId],
      ttl: 1000 * 60,
    },
  );

  const pipeline = useMemo(() => {
    if (!pipelineResource.data) {
      return null;
    }
    return normalisePipelineDashboard(pipelineResource.data);
  }, [pipelineResource.data]);

  const currency = pipeline?.currency ?? 'USD';

  const stageSummaries = useMemo(() => {
    const base = FREELANCER_PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = {
        count: 0,
        pipelineValue: 0,
        weightedValue: 0,
        aiCue: stage.coaching,
        nextFollowUp: null,
        reminders: [],
        notes: [],
      };
      return acc;
    }, {});

    if (pipeline?.stageSummaries) {
      Object.entries(pipeline.stageSummaries).forEach(([stageId, summary]) => {
        base[stageId] = {
          ...base[stageId],
          ...summary,
        };
      });
    }

    return base;
  }, [pipeline?.stageSummaries]);

  const summary = useMemo(
    () => ({
      pipelineValue: pipeline?.summary?.pipelineValue ?? 0,
      weightedPipelineValue: pipeline?.summary?.weightedPipelineValue ?? 0,
      openDeals: pipeline?.summary?.openDeals ?? 0,
      followUpsDue: pipeline?.summary?.followUpsDue ?? 0,
      interviewsScheduled: pipeline?.summary?.interviewsScheduled ?? 0,
      offers: pipeline?.summary?.offers ?? 0,
      wonThisQuarter: pipeline?.summary?.wonThisQuarter ?? 0,
    }),
    [pipeline?.summary],
  );

  const analytics = useMemo(
    () => ({
      winRate: pipeline?.analytics?.winRate ?? null,
      velocityDays: pipeline?.analytics?.velocityDays ?? null,
      conversionTrend: pipeline?.analytics?.conversionTrend ?? null,
      activeCampaigns: pipeline?.analytics?.activeCampaigns ?? null,
    }),
    [pipeline?.analytics],
  );

  const followUps = pipeline?.followUps ?? [];
  const dealStageIndex = pipeline?.dealStageIndex ?? {};

  useEffect(() => {
    if (!pipeline || !freelancerId) {
      return;
    }
    const stageCounts = Object.fromEntries(
      Object.entries(pipeline.stageSummaries).map(([stageId, summary]) => [stageId, summary.count]),
    );
    trackDashboardEvent('freelancer.pipeline.view', {
      freelancerId,
      openDeals: pipeline.summary.openDeals,
      stageCounts,
      fallback: pipeline.fallback,
    });
  }, [freelancerId, pipeline]);

  const totalPipelineCount = useMemo(
    () =>
      FREELANCER_PIPELINE_STAGES.reduce(
        (sum, stage) => sum + (stageSummaries[stage.id]?.count ?? 0),
        0,
      ),
    [stageSummaries],
  );

  const stageCards = useMemo(
    () =>
      FREELANCER_PIPELINE_STAGES.map((stage) => {
        const summaryForStage = stageSummaries[stage.id] ?? {
          count: 0,
          pipelineValue: 0,
          weightedValue: 0,
          aiCue: stage.coaching,
          nextFollowUp: null,
          notes: [],
        };

        return {
          stage,
          summary: {
            ...summaryForStage,
            aiCue: summaryForStage.aiCue ?? stage.coaching,
            progress: totalPipelineCount ? summaryForStage.count / totalPipelineCount : 0,
          },
        };
      }),
    [stageSummaries, totalPipelineCount],
  );

  const summaryCards = useMemo(
    () => [
      {
        id: 'pipeline-value',
        label: 'Pipeline value',
        value: formatCurrency(summary.pipelineValue, currency),
        helper: `${formatNumber(summary.openDeals)} active deals`,
      },
      {
        id: 'weighted',
        label: 'Weighted pipeline',
        value: formatCurrency(summary.weightedPipelineValue, currency),
        helper: 'Weighted by win probability',
      },
      {
        id: 'win-rate',
        label: 'Win rate',
        value: formatPercent(analytics.winRate),
        helper: 'Won vs lost opportunities',
      },
      {
        id: 'velocity',
        label: 'Avg days to close',
        value: analytics.velocityDays != null ? `${analytics.velocityDays} days` : '—',
        helper: 'Based on expected close dates',
      },
      {
        id: 'follow-ups',
        label: 'Follow-ups due (48h)',
        value: formatNumber(summary.followUpsDue ?? 0),
        helper: 'Stay ahead of responses',
      },
      {
        id: 'interviews',
        label: 'Interviews scheduled',
        value: formatNumber(summary.interviewsScheduled ?? 0),
        helper: 'Coordinate with your talent partner',
      },
    ],
    [analytics.velocityDays, analytics.winRate, currency, summary],
  );

  const reminderItems = useMemo(() => {
    if (!followUps.length) {
      return [];
    }
    return [...followUps]
      .map((reminder) => ({
        ...reminder,
        stageId: reminder.stageId ?? dealStageIndex[`${reminder.dealId ?? ''}`] ?? null,
      }))
      .sort((a, b) => {
        const aDate = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return aDate - bDate;
      })
      .slice(0, 6);
  }, [followUps, dealStageIndex]);

  const noteItems = useMemo(() => {
    const notes = [];
    FREELANCER_PIPELINE_STAGES.forEach((stage) => {
      const summaryForStage = stageSummaries[stage.id];
      if (!summaryForStage?.notes?.length) {
        return;
      }
      summaryForStage.notes.forEach((note) => {
        notes.push({
          id: `${stage.id}-${note.id}`,
          stage,
          note,
        });
      });
    });
    return notes.slice(0, 6);
  }, [stageSummaries]);

  const showEmptyCallout = !pipeline && !pipelineResource.loading && !pipelineResource.error;

  const handleStageCta = useCallback(
    (stage) => {
      if (!freelancerId) {
        return;
      }
      trackDashboardEvent('freelancer.pipeline.stage.cta', {
        freelancerId,
        stage: stage.id,
      });
    },
    [freelancerId],
  );

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Pipeline HQ"
        subtitle="Keep opportunities moving"
        description="Monitor every stage from application through kickoff so you and your talent partner stay perfectly aligned."
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="pipeline"
      >
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
          <header className="space-y-3 border-b border-slate-200 pb-8">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Pipeline mission control</p>
            <h1 className="text-3xl font-semibold text-slate-900">Stay ahead of every opportunity</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Review weighted pipeline value, coaching cues, and upcoming follow-ups so you and your talent partner can respond before momentum slows down.
            </p>
          </header>

          <DataStatus
            loading={pipelineResource.loading}
            fromCache={pipelineResource.fromCache}
            lastUpdated={pipelineResource.lastUpdated}
            onRefresh={() => pipelineResource.refresh({ force: true })}
            error={pipelineResource.error}
            statusLabel="Live pipeline"
          >
            {showEmptyCallout ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Live mission control will light up as soon as opportunities sync in. Connect your applications or share pipeline deals from your talent partner to populate this view.
              </div>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summaryCards.map((card) => (
                <SummaryCard key={card.id} label={card.label} value={card.value} helper={card.helper} />
              ))}
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage momentum</h2>
                <p className="text-xs text-slate-500">
                  {totalPipelineCount ? `${formatNumber(totalPipelineCount)} deals in flight` : 'No active deals yet'}
                </p>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-200">
                {stageCards.map(({ stage, summary }) => (
                  <div
                    key={stage.id}
                    className={\`${summary.count ? stage.progressTone ?? 'bg-slate-400' : 'bg-slate-200'}\`}
                    style={{ width: `${summary.count && totalPipelineCount ? (summary.count / totalPipelineCount) * 100 : 0}%` }}
                  />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {stageCards.map(({ stage, summary }) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    summary={summary}
                    currency={currency}
                    onTrack={handleStageCta}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming reminders</h2>
                  <span className="text-xs text-slate-500">{formatNumber(reminderItems.length)} tasks</span>
                </div>
                {reminderItems.length ? (
                  <ul className="space-y-3">
                    {reminderItems.map((reminder) => (
                      <ReminderItem
                        key={reminder.id}
                        reminder={reminder}
                        stage={FREELANCER_PIPELINE_STAGES.find((stage) => stage.id === reminder.stageId)}
                        currency={currency}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No reminders scheduled. Create follow-ups from your applications to stay on track.
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline notes</h2>
                  <span className="text-xs text-slate-500">Live deal highlights</span>
                </div>
                {noteItems.length ? (
                  <ul className="space-y-3">
                    {noteItems.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-600">{item.stage.label}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                            {formatCurrency(stageSummaries[item.stage.id]?.pipelineValue ?? 0, currency)}
                          </span>
                        </div>
                        <p className="mt-2 font-semibold text-slate-900">{item.note.company}</p>
                        <p className="text-xs text-slate-500">{item.note.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Add notes to your deals so talent partners can coach and intervene quickly.
                  </p>
                )}
              </div>
            </section>
          </DataStatus>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
