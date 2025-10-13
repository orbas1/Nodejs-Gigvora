import { useCallback, useMemo } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  HandRaisedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import InterviewVideoRoom from '../interviews/InterviewVideoRoom.jsx';
import { useInterviewRoom } from '../../hooks/useInterviewRoom.js';
import { useInterviewWorkflow } from '../../hooks/useInterviewWorkflow.js';
import { updateInterviewChecklistItem } from '../../services/interviews.js';

function formatNumber(value, { fallback = '—', maximumFractionDigits = 1 } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return `${value}`;
  }
  return numeric.toLocaleString(undefined, { maximumFractionDigits });
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function ProgressBar({ value }) {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  const width = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-blue-500" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function InterviewExperienceSection({
  data,
  interviewOperations,
  candidateExperience,
  offerOnboarding,
}) {
  const panelTemplates = data?.panelTemplates ?? {};
  const candidatePrep = data?.candidatePrep ?? {};
  const evaluationWorkspace = data?.evaluationWorkspace ?? {};
  const offerBridge = data?.offerBridge ?? {};
  const candidateCareCenter = data?.candidateCareCenter ?? {};

  const scheduler = data?.scheduler ?? {};
  const workspaceId = data?.workspaceId ?? scheduler.workspaceId ?? 'workspace_enterprise_recruiting';
  const upcomingInterviews = Array.isArray(scheduler.upcoming) ? scheduler.upcoming : [];

  const activeRoomId = useMemo(() => {
    const explicit = scheduler.highlightRoomId || scheduler.activeRoomId || scheduler.nextRoomId;
    if (explicit) {
      return explicit;
    }
    const fromUpcoming = upcomingInterviews.find((interview) => interview?.videoRoomId)?.videoRoomId;
    if (fromUpcoming) {
      return fromUpcoming;
    }
    return 'room_enterprise_final_loop';
  }, [scheduler.highlightRoomId, scheduler.activeRoomId, scheduler.nextRoomId, upcomingInterviews]);

  const {
    data: roomData,
    error: roomError,
    loading: roomLoading,
    refresh: refreshRoom,
  } = useInterviewRoom({ roomId: activeRoomId, enabled: Boolean(activeRoomId) });

  const {
    data: workflowData,
    error: workflowError,
    loading: workflowLoading,
  } = useInterviewWorkflow({ workspaceId, enabled: Boolean(workspaceId) });

  const handleChecklistToggle = useCallback(
    async (item, nextStatus) => {
      if (!item?.id || !activeRoomId) {
        return;
      }
      try {
        await updateInterviewChecklistItem(activeRoomId, item.id, { status: nextStatus });
        await refreshRoom({ force: true });
      } catch (updateError) {
        console.error('Failed to update checklist item', updateError);
      }
    },
    [activeRoomId, refreshRoom],
  );

  const summaryMetrics = [
    {
      label: 'Upcoming interviews',
      value: formatNumber(scheduler.upcomingCount ?? interviewOperations?.upcomingCount ?? 0, {
        maximumFractionDigits: 0,
      }),
      icon: CalendarDaysIcon,
    },
    {
      label: 'Reminder coverage',
      value: formatPercent(scheduler.reminderCoverage),
      icon: ClipboardDocumentCheckIcon,
    },
    {
      label: 'Templates maintained',
      value: formatNumber(panelTemplates.totalTemplates ?? 0, { maximumFractionDigits: 0 }),
      icon: SparklesIcon,
    },
    {
      label: 'Prep portals active',
      value: formatNumber(candidatePrep.activePortals ?? 0, { maximumFractionDigits: 0 }),
      icon: FunnelIcon,
    },
    {
      label: 'Evaluations submitted',
      value: formatNumber(evaluationWorkspace.evaluationsSubmitted ?? 0, { maximumFractionDigits: 0 }),
      icon: CheckCircleIcon,
    },
    {
      label: 'Open care tickets',
      value: formatNumber(candidateCareCenter.openTickets ?? 0, { maximumFractionDigits: 0 }),
      icon: HandRaisedIcon,
    },
  ];

  const recommendationEntries = Object.entries(evaluationWorkspace.recommendationMix ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const tasksBreakdown = Array.isArray(offerBridge?.tasks?.breakdown)
    ? offerBridge.tasks.breakdown.slice(0, 4)
    : [];

  const topTemplates = Array.isArray(panelTemplates.topTemplates) ? panelTemplates.topTemplates : [];
  const topPortals = Array.isArray(candidatePrep.topPortals) ? candidatePrep.topPortals : [];
  const decisionTrackers = Array.isArray(evaluationWorkspace.decisionTrackers)
    ? evaluationWorkspace.decisionTrackers
    : [];
  const upcomingStartDates = Array.isArray(offerBridge.upcomingStartDates)
    ? offerBridge.upcomingStartDates
    : [];
  const recentTickets = Array.isArray(candidateCareCenter.recentTickets)
    ? candidateCareCenter.recentTickets
    : [];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon ?? SparklesIcon;
          return (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-5"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      <InterviewVideoRoom
        room={roomData}
        workflow={workflowData}
        loading={roomLoading || workflowLoading}
        error={roomError || workflowError}
        onRefresh={() => refreshRoom({ force: true })}
        onChecklistToggle={handleChecklistToggle}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Interview scheduler</h3>
              <p className="mt-1 text-sm text-slate-600">
                Automate reminders, reserve rooms, and balance interviewer load with availability insights.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Operations
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Avg lead time</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(scheduler.averageLeadTimeHours ?? interviewOperations?.averageLeadTimeHours, {
                  fallback: '—',
                })}{' '}
                hrs
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Avg duration</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(scheduler.averageDurationMinutes ?? interviewOperations?.averageDurationMinutes, {
                  fallback: '—',
                })}{' '}
                mins
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Availability coverage</dt>
              <dd className="text-base font-semibold text-slate-900">{formatPercent(scheduler.availabilityCoverage)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Rooms reserved</dt>
              <dd className="text-base font-semibold text-slate-900">{formatNumber(scheduler.roomsReserved ?? 0)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Upcoming interviews</p>
            <ul className="mt-3 space-y-3">
              {upcomingInterviews.length ? (
                upcomingInterviews.map((interview) => (
                  <li key={interview.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{interview.stage}</span>
                      <span className="text-xs text-slate-500" title={formatAbsolute(interview.scheduledAt)}>
                        {formatRelativeTime(interview.scheduledAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{interview.interviewerCount ?? '—'} interviewers</span>
                      <span>{formatNumber(interview.durationMinutes, { fallback: '—' })} mins</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                  No interviews scheduled in this window.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Panel templates</h3>
              <p className="mt-1 text-sm text-slate-600">
                Structured guides with competencies, rubrics, and automated version control for every role.
              </p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-600">
              Templates
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Roles covered</dt>
              <dd className="text-base font-semibold text-slate-900">{formatNumber(panelTemplates.rolesCovered ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Rubric bank</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(panelTemplates.rubricLibrary?.length ?? 0)} competencies
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-3">
            {topTemplates.length ? (
              topTemplates.map((template) => (
                <div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{template.roleName}</span>
                    <span className="text-xs text-slate-500">Stage: {template.stage}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNumber(template.durationMinutes, { fallback: '—' })} mins • {template.evaluations ?? 0} evaluations
                  </p>
                  {Array.isArray(template.competencies) && template.competencies.length ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Focus: {template.competencies.slice(0, 3).join(', ')}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                Add structured panel templates to standardise interviewer experiences.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Candidate prep portals</h3>
              <p className="mt-1 text-sm text-slate-600">
                Deliver curated resources, forms, and NDAs so candidates arrive informed and compliant.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Experience
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">NDA completion</dt>
              <dd className="text-base font-semibold text-slate-900">{formatPercent(candidatePrep.ndaCompletionRate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Form completion</dt>
              <dd className="text-base font-semibold text-slate-900">{formatPercent(candidatePrep.formCompletionRate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Resource engagement</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatPercent(candidatePrep.resourceEngagementRate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Avg visits</dt>
              <dd className="text-base font-semibold text-slate-900">{formatNumber(candidatePrep.averageVisits)}</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-3">
            {topPortals.length ? (
              topPortals.map((portal) => (
                <div key={portal.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{portal.candidateName}</span>
                    <span className="text-xs text-slate-500">{portal.stage ?? '—'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    NDA status: <span className="font-medium text-slate-700">{portal.ndaStatus ?? 'not sent'}</span>
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">Resource progress</div>
                  <ProgressBar value={portal.resourceProgress} />
                  <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">Forms progress</div>
                  <ProgressBar value={portal.formsProgress} />
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                Invite candidates to prep portals to unlock engagement insights.
              </p>
            )}
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Evaluation workspace</h3>
              <p className="mt-1 text-sm text-slate-600">
                Collect structured feedback, calibrate scores, and surface decision trends with bias guardrails.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
              Feedback
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Average score</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(evaluationWorkspace.averageScore, { fallback: '—' })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Anonymized reviews</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatPercent(evaluationWorkspace.anonymizedShare)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Decision velocity</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(evaluationWorkspace.decisionVelocityDays, { fallback: '—' })} days
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Calibration sessions</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(evaluationWorkspace.calibrationSessions?.length ?? 0, { maximumFractionDigits: 0 })}
              </dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommendation mix</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {recommendationEntries.length ? (
                  recommendationEntries.map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between">
                      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(count, { maximumFractionDigits: 0 })}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No recent evaluations submitted.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active decisions</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {decisionTrackers.length ? (
                  decisionTrackers.slice(0, 4).map((decision) => (
                    <li key={decision.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">{decision.candidateName ?? 'Candidate'}</span>
                        <span className="text-xs text-slate-500">{decision.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500" title={formatAbsolute(decision.updatedAt)}>
                        Updated {formatRelativeTime(decision.updatedAt)}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">Decision trackers will appear once evaluations are submitted.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Offer & onboarding bridge</h3>
              <p className="mt-1 text-sm text-slate-600">
                Generate offers, capture approvals, and orchestrate digital signatures with day-one readiness tasks.
              </p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
              Offers
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Approvals pending</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(offerBridge.approvalsPending ?? offerOnboarding?.approvalsPending ?? 0, {
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Background checks</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(offerBridge.backgroundChecksInProgress ?? offerOnboarding?.backgroundChecksInProgress ?? 0, {
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Signatures outstanding</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(offerBridge.signaturesOutstanding ?? offerOnboarding?.signaturesOutstanding ?? 0, {
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Avg package value</dt>
              <dd className="text-base font-semibold text-slate-900">
                {offerBridge.averagePackageValue != null
                  ? `$${formatNumber(offerBridge.averagePackageValue, { maximumFractionDigits: 0 })}`
                  : '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Upcoming start dates</p>
              <ul className="mt-2 space-y-2">
                {upcomingStartDates.length ? (
                  upcomingStartDates.map((offer) => (
                    <li key={offer.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">{offer.candidateName ?? 'Candidate'}</span>
                        <span className="text-xs text-slate-500">{offer.roleName ?? 'Role'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500" title={formatAbsolute(offer.startDate)}>
                        Starts {formatRelativeTime(offer.startDate)}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No start dates scheduled in this window.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Day-one tasks</p>
              <ul className="mt-2 space-y-2">
                {tasksBreakdown.length ? (
                  tasksBreakdown.map((entry) => (
                    <li key={entry.category} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900 capitalize">{entry.category}</span>
                        <span className="text-xs text-slate-500">
                          {formatNumber(entry.completed, { maximumFractionDigits: 0 })}/
                          {formatNumber(entry.total, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <ProgressBar value={entry.completionRate} />
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">Plan onboarding checklists to monitor day-one readiness.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Candidate care center</h3>
              <p className="mt-1 text-sm text-slate-600">
                Monitor response times, satisfaction, and escalations to deliver a world-class candidate journey.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Care
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Candidate NPS</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(candidateExperience?.nps ?? candidateCareCenter.nps, { fallback: '—' })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Avg response</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(candidateCareCenter.averageResponseMinutes, { fallback: '—' })} mins
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Escalations</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(candidateCareCenter.escalations ?? 0, { maximumFractionDigits: 0 })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Follow-ups pending</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatNumber(candidateCareCenter.followUpsPending ?? candidateExperience?.followUpsPending ?? 0, {
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent tickets</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {recentTickets.length ? (
                recentTickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{ticket.candidateName ?? 'Candidate'}</span>
                      <span className="text-xs text-slate-500">{ticket.type}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span title={formatAbsolute(ticket.openedAt)}>Opened {formatRelativeTime(ticket.openedAt)}</span>
                      <span className="capitalize">{ticket.status}</span>
                    </div>
                    {ticket.inclusionCategory ? (
                      <p className="mt-1 text-xs text-slate-500">Inclusion: {ticket.inclusionCategory}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">No active care tickets this period.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
