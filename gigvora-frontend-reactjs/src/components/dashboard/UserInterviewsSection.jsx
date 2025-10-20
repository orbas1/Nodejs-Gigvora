import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CalendarDaysIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import InterviewsPanel from '../jobApplications/panels/InterviewsPanel.jsx';
import WorkspaceDrawer from '../jobApplications/WorkspaceDrawer.jsx';
import InterviewForm from '../jobApplications/forms/InterviewForm.jsx';
import {
  fetchJobApplicationWorkspace,
  createWorkspaceJobApplicationInterview,
  updateWorkspaceJobApplicationInterview,
  deleteWorkspaceJobApplicationInterview,
} from '../../services/jobApplications.js';

const INITIAL_FORM_STATE = {
  open: false,
  mode: 'create',
  record: null,
  busy: false,
  error: null,
};

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  try {
    return new Intl.NumberFormat('en-US').format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

function buildSummaryCards(workspace, interviews) {
  const summary = workspace?.summary ?? {};
  const scheduled = summary.interviewsScheduled ?? interviews.filter((item) => item.status === 'scheduled').length;
  const completed = summary.interviewsCompleted ?? interviews.filter((item) => item.status === 'completed').length;
  const pendingResponses = summary.pendingResponses ?? 0;

  return [
    {
      id: 'scheduled-interviews',
      label: 'Scheduled interviews',
      value: formatNumber(scheduled),
      icon: CalendarDaysIcon,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      id: 'completed-interviews',
      label: 'Completed debriefs',
      value: formatNumber(completed),
      icon: CheckCircleIcon,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      id: 'pending-follow-ups',
      label: 'Replies to send',
      value: formatNumber(pendingResponses),
      icon: ChatBubbleLeftRightIcon,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ];
}

function RecommendedActionList({ actions }) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Recommended follow-ups</h3>
      <p className="mt-1 text-sm text-slate-500">
        Keep your process sharp by tackling the next best actions surfaced from your pipeline and responses.
      </p>
      <ol className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <li key={action.title ?? index} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{action.title ?? 'Follow-up'}</p>
              {action.detail ? <p>{action.detail}</p> : null}
              {action.recommendation ? (
                <p className="text-xs text-slate-500">{action.recommendation}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

RecommendedActionList.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default function UserInterviewsSection({ userId, initialWorkspace }) {
  const [workspace, setWorkspace] = useState(initialWorkspace ?? null);
  const [loading, setLoading] = useState(!initialWorkspace);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [actionError, setActionError] = useState(null);

  const interviews = useMemo(() => workspace?.interviews ?? [], [workspace?.interviews]);
  const applications = useMemo(() => workspace?.applications ?? [], [workspace?.applications]);
  const formOptions = workspace?.formOptions ?? {};

  const loadWorkspace = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchJobApplicationWorkspace(userId);
      setWorkspace(snapshot);
    } catch (loadError) {
      console.error('Failed to load interviews workspace', loadError);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (initialWorkspace) {
      setWorkspace(initialWorkspace);
      setLoading(false);
      setError(null);
      return;
    }
    if (userId) {
      loadWorkspace();
    }
  }, [initialWorkspace, loadWorkspace, userId]);

  const openForm = useCallback((mode = 'create', record = null) => {
    setFormState({ open: true, mode, record, busy: false, error: null });
  }, []);

  const closeForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
  }, []);

  const handleDeleteInterview = useCallback(
    async (interview) => {
      if (!interview) {
        return;
      }
      try {
        setActionError(null);
        await deleteWorkspaceJobApplicationInterview(userId, interview.applicationId, interview.id);
        await loadWorkspace();
      } catch (deleteError) {
        console.error('Failed to delete interview', deleteError);
        setActionError(deleteError);
      }
    },
    [userId, loadWorkspace],
  );

  const submitForm = useCallback(
    async (state, values) => {
      if (!state?.mode) {
        return;
      }
      setFormState((prev) => ({ ...prev, busy: true, error: null }));
      try {
        const { applicationId, ...payload } = values;
        if (state.mode === 'edit' && state.record) {
          await updateWorkspaceJobApplicationInterview(userId, state.record.applicationId, state.record.id, payload);
        } else {
          await createWorkspaceJobApplicationInterview(userId, applicationId, payload);
        }
        setActionError(null);
        await loadWorkspace();
        setFormState(INITIAL_FORM_STATE);
      } catch (submitError) {
        console.error('Failed to save interview', submitError);
        setFormState((prev) => ({ ...prev, busy: false, error: submitError }));
      }
    },
    [userId, loadWorkspace],
  );

  const summaryCards = useMemo(() => buildSummaryCards(workspace, interviews), [workspace, interviews]);
  const recommendedActions = useMemo(
    () => (Array.isArray(workspace?.recommendedActions) ? workspace.recommendedActions : []),
    [workspace?.recommendedActions],
  );

  return (
    <section id="interview-operations" className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Interview operations</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Coordinate every interview loop across roles, sync follow-ups, and keep transcripts ready for debrief in seconds.
            </p>
          </div>
          <DataStatus
            loading={loading}
            error={error}
            lastUpdated={workspace?.lastUpdated}
            onRefresh={loadWorkspace}
            statusLabel="Interview data"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`flex items-center justify-between rounded-3xl border px-5 py-4 shadow-sm ${card.tone}`}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600/80">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <span className="rounded-2xl bg-white/70 p-3 text-slate-600 shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>

        {actionError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {actionError.message ?? 'We could not update the interview workspace. Please try again shortly.'}
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
          <InterviewsPanel
            interviews={interviews}
            applications={applications}
            onCreate={() => openForm('create')}
            onEdit={(interview) => openForm('edit', interview)}
            onDelete={handleDeleteInterview}
          />
        </div>

        {recommendedActions.length ? (
          <div className="mt-8">
            <RecommendedActionList actions={recommendedActions} />
          </div>
        ) : null}
      </div>

      <WorkspaceDrawer
        open={formState.open}
        title={formState.mode === 'edit' ? 'Edit interview' : 'Schedule interview'}
        description="Reserve time with hiring teams, share prep links, and confirm the agenda with one submit."
        onClose={closeForm}
      >
        {formState.open ? (
          <InterviewForm
            mode={formState.mode}
            applications={applications}
            initialInterview={formState.record}
            statusOptions={formOptions.interviewStatuses ?? []}
            typeOptions={formOptions.interviewTypes ?? []}
            busy={formState.busy}
            error={formState.error}
            onSubmit={(values) => submitForm(formState, values)}
            onCancel={closeForm}
            onDelete={formState.mode === 'edit' ? () => handleDeleteInterview(formState.record) : undefined}
          />
        ) : null}
      </WorkspaceDrawer>
    </section>
  );
}

UserInterviewsSection.propTypes = {
  userId: PropTypes.number.isRequired,
  initialWorkspace: PropTypes.shape({
    interviews: PropTypes.array,
    applications: PropTypes.array,
    formOptions: PropTypes.object,
    summary: PropTypes.object,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    recommendedActions: PropTypes.array,
  }),
};

UserInterviewsSection.defaultProps = {
  initialWorkspace: null,
};
