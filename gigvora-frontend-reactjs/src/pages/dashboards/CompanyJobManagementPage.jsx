
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowsPointingOutIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import JobAdvertList from '../../components/company/jobManagement/JobAdvertList.jsx';
import JobAdvertForm from '../../components/company/jobManagement/JobAdvertForm.jsx';
import ApplicantKanbanBoard from '../../components/company/jobManagement/ApplicantKanbanBoard.jsx';
import InterviewManager from '../../components/company/jobManagement/InterviewManager.jsx';
import CandidateResponsesPanel from '../../components/company/jobManagement/CandidateResponsesPanel.jsx';
import JobHistoryTimeline from '../../components/company/jobManagement/JobHistoryTimeline.jsx';
import KeywordMatcher from '../../components/company/jobManagement/KeywordMatcher.jsx';
import CandidateList from '../../components/company/jobManagement/CandidateList.jsx';
import CandidateNotesPanel from '../../components/company/jobManagement/CandidateNotesPanel.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { useCompanyJobOperations } from '../../hooks/useCompanyJobOperations.js';
import { useSession } from '../../context/SessionContext.jsx';
import {
  createJobAdvert,
  updateJobAdvert,
  updateJobKeywords,
  createJobFavorite,
  scheduleInterview as apiScheduleInterview,
  updateInterview as apiUpdateInterview,
  recordCandidateResponse as apiRecordCandidateResponse,
  addCandidateNote as apiAddCandidateNote,
} from '../../services/companyJobOperations.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 180];
const AVAILABLE_DASHBOARDS = ['company', 'headhunter', 'user', 'agency'];
const PANEL_OPTIONS = [
  { id: 'board', label: 'Board', requiresJob: true },
  { id: 'match', label: 'Match', requiresJob: true },
  { id: 'apps', label: 'Applicants', requiresJob: true },
  { id: 'meet', label: 'Meet', requiresJob: true },
  { id: 'chat', label: 'Messages', requiresJob: true },
  { id: 'notes', label: 'Notes', requiresJob: true },
  { id: 'history', label: 'History', requiresJob: true },
];

function resolveJobId(job) {
  if (!job) return null;
  return job.job?.id ?? job.jobId ?? job.advert?.jobId ?? job.id ?? null;
}

function formatCandidateName(candidate) {
  if (!candidate) {
    return 'Candidate';
  }
  return candidate.candidate?.name ?? candidate.candidateName ?? candidate.name ?? 'Candidate';
}

function formatStatus(value) {
  if (!value) return 'Status';
  return value
    .toString()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function PanelPlaceholder({ message }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function CompanyJobManagementPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 90, 7) : 90;

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const panelLookup = useMemo(() => {
    const map = new Map();
    PANEL_OPTIONS.forEach((panel) => {
      map.set(panel.id, panel);
    });
    return map;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? memberships.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/job-management' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, memberships, session?.primaryDashboard]);

  const { data, error, loading, refresh, fromCache, lastUpdated } = useCompanyJobOperations({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
    enabled: isAuthenticated && isCompanyMember,
  });

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
  const jobs = data?.jobAdverts ?? [];
  const summary = data?.summary ?? {};
  const lookups = data?.lookups ?? {};
  const applications = data?.applications ?? [];
  const interviews = data?.interviews ?? [];
  const responses = data?.responses ?? [];
  const notes = data?.notes ?? [];
  const kanban = data?.kanban ?? [];
  const workspaceId = workspaceIdParam ?? data?.meta?.selectedWorkspaceId ?? null;

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [updatingKeywords, setUpdatingKeywords] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [activePanel, setActivePanel] = useState(PANEL_OPTIONS[0].id);
  const [panelExpanded, setPanelExpanded] = useState(null);
  const [focusedCandidate, setFocusedCandidate] = useState(null);
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);

  useEffect(() => {
    if (!selectedJobId && jobs.length) {
      const initialJobId = resolveJobId(jobs[0]);
      setSelectedJobId(initialJobId);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => jobs.find((job) => resolveJobId(job) === selectedJobId) ?? null, [jobs, selectedJobId]);

  const selectedApplications = useMemo(() => {
    if (!selectedJob) {
      return [];
    }
    return (selectedJob.applicants ?? applications.filter((application) => application.jobId === selectedJobId)) ?? [];
  }, [selectedJob, applications, selectedJobId]);

  const selectedResponses = useMemo(() => {
    if (!selectedJob) {
      return [];
    }
    return responses.filter((response) => response.jobId === selectedJobId);
  }, [responses, selectedJob]);

  const selectedNotes = useMemo(() => {
    if (!selectedJob) {
      return [];
    }
    return notes.filter((note) => note.jobId === selectedJobId);
  }, [notes, selectedJob]);

  const selectedHistory = useMemo(() => selectedJob?.history ?? [], [selectedJob]);
  const keywordMatches = useMemo(() => selectedJob?.keywordMatches ?? [], [selectedJob]);
  const jobKanban = useMemo(() => {
    if (!selectedJobId) {
      return kanban;
    }
    return (kanban ?? []).map((column) => ({
      ...column,
      applications: (column.applications ?? []).filter((application) => application.jobId === selectedJobId),
    }));
  }, [kanban, selectedJobId]);

  const focusedCandidateId = focusedCandidate?.id ?? null;
  const focusedCandidateNotes = useMemo(() => {
    if (!focusedCandidateId) return [];
    return selectedNotes.filter((note) => note.applicationId === focusedCandidateId);
  }, [selectedNotes, focusedCandidateId]);
  const focusedCandidateResponses = useMemo(() => {
    if (!focusedCandidateId) return [];
    return selectedResponses.filter((response) => response.applicationId === focusedCandidateId);
  }, [selectedResponses, focusedCandidateId]);
  const focusedCandidateInterviews = useMemo(() => {
    if (!focusedCandidateId) return [];
    return interviews.filter((interview) => {
      const applicationId = interview.applicationId ?? interview.application?.id ?? interview.application?.targetId;
      return applicationId === focusedCandidateId;
    });
  }, [interviews, focusedCandidateId]);

  useEffect(() => {
    setCandidateDrawerOpen(false);
    setFocusedCandidate(null);
  }, [selectedJobId]);

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
      next.delete('workspaceSlug');
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

  const handleCreateJob = () => {
    setFormMode('create');
    setEditingJob(null);
    setFormOpen(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setEditingJob(null);
    setFormMode(null);
    setFormOpen(false);
  };

  const handleSubmitJob = async ({ payload, keywords }) => {
    if (!workspaceId) {
      return;
    }
    setSavingJob(true);
    try {
      if (formMode === 'create') {
        const result = await createJobAdvert({ workspaceId, ...payload });
        const jobId = result?.job?.id ?? result?.advert?.jobId;
        if (jobId && Array.isArray(keywords) && keywords.length) {
          setUpdatingKeywords(true);
          try {
            await updateJobKeywords(jobId, { workspaceId, keywords });
          } finally {
            setUpdatingKeywords(false);
          }
        }
      } else if (formMode === 'edit' && editingJob) {
        const jobId = resolveJobId(editingJob);
        await updateJobAdvert(jobId, { workspaceId, ...payload });
        if (Array.isArray(keywords)) {
          setUpdatingKeywords(true);
          try {
            await updateJobKeywords(jobId, { workspaceId, keywords });
          } finally {
            setUpdatingKeywords(false);
          }
        }
      }
      setFormMode(null);
      setEditingJob(null);
      setFormOpen(false);
      await refresh({ force: true });
    } finally {
      setSavingJob(false);
    }
  };

  const handleSelectJob = (job) => {
    const jobId = resolveJobId(job);
    setSelectedJobId(jobId);
    setEditingJob(null);
    setFormMode(null);
    setFormOpen(false);
  };

  const handleFavoriteJob = async (job) => {
    if (!workspaceId) return;
    const jobId = resolveJobId(job);
    await createJobFavorite(jobId, {
      workspaceId,
      userId: session?.id ?? null,
      notes: 'dashboard',
    });
    await refresh({ force: true });
  };

  const handleUpdateKeywords = async (keywordsList) => {
    if (!workspaceId || !selectedJob) {
      return;
    }
    const jobId = resolveJobId(selectedJob);
    setUpdatingKeywords(true);
    try {
      await updateJobKeywords(jobId, { workspaceId, keywords: keywordsList });
      await refresh({ force: true });
    } finally {
      setUpdatingKeywords(false);
    }
  };

  const handleScheduleInterview = async ({ applicationId, interviewStage, scheduledAt, durationMinutes }) => {
    if (!workspaceId || !selectedJobId) return;
    await apiScheduleInterview(selectedJobId, {
      workspaceId,
      applicationId,
      interviewStage,
      scheduledAt,
      durationMinutes,
    });
    await refresh({ force: true });
  };

  const handleCompleteInterview = async ({ id, completedAt, interviewStage }) => {
    if (!workspaceId || !selectedJobId || !id) return;
    await apiUpdateInterview(selectedJobId, id, {
      workspaceId,
      completedAt,
      interviewStage,
    });
    await refresh({ force: true });
  };

  const handleSendResponse = async ({ applicationId, channel, message }) => {
    if (!workspaceId || !selectedJobId) return;
    await apiRecordCandidateResponse(selectedJobId, {
      workspaceId,
      applicationId,
      channel,
      message,
    });
    await refresh({ force: true });
  };

  const handleAddNote = async ({ applicationId, summary, stage, sentiment, nextSteps }) => {
    if (!workspaceId || !selectedJobId) return;
    await apiAddCandidateNote(selectedJobId, applicationId, {
      workspaceId,
      summary,
      stage,
      sentiment,
      nextSteps,
    });
    await refresh({ force: true });
  };

  const handleOpenCandidate = (candidate) => {
    if (!candidate) return;
    setFocusedCandidate(candidate);
    setCandidateDrawerOpen(true);
  };

  const handleCloseCandidate = () => {
    setCandidateDrawerOpen(false);
    setFocusedCandidate(null);
  };

  const renderPanelContent = (panelId) => {
    if (!selectedJob && panelLookup.get(panelId)?.requiresJob) {
      return <PanelPlaceholder message="Select a job" />;
    }

    switch (panelId) {
      case 'board':
        return <ApplicantKanbanBoard columns={jobKanban} onSelectApplication={handleOpenCandidate} />;
      case 'match':
        return (
          <KeywordMatcher
            keywords={selectedJob?.keywords}
            matches={keywordMatches}
            onUpdate={handleUpdateKeywords}
            loading={updatingKeywords}
          />
        );
      case 'apps':
        return (
          <CandidateList
            candidates={selectedApplications}
            onSelect={handleOpenCandidate}
            selectedId={candidateDrawerOpen ? focusedCandidateId : null}
          />
        );
      case 'meet':
        return (
          <InterviewManager
            interviews={interviews.filter(
              (interview) => interview.jobId === selectedJobId || interview.application?.targetId === selectedJobId,
            )}
            applications={selectedApplications}
            onSchedule={handleScheduleInterview}
            onUpdate={handleCompleteInterview}
          />
        );
      case 'chat':
        return (
          <CandidateResponsesPanel
            responses={selectedResponses}
            applications={selectedApplications}
            onSend={handleSendResponse}
          />
        );
      case 'notes':
        return (
          <CandidateNotesPanel
            notes={selectedNotes}
            applications={selectedApplications}
            onAdd={handleAddNote}
            onUpdate={null}
          />
        );
      case 'history':
        return <JobHistoryTimeline items={selectedHistory} />;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout currentDashboard="company" menuSections={COMPANY_DASHBOARD_MENU_SECTIONS} availableDashboards={AVAILABLE_DASHBOARDS}>
        <AccessDeniedPanel title="Sign in required" description="Sign in to access job management." />
      </DashboardLayout>
    );
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout currentDashboard="company" menuSections={COMPANY_DASHBOARD_MENU_SECTIONS} availableDashboards={AVAILABLE_DASHBOARDS}>
        <AccessDeniedPanel title="Workspace membership required" description="You need company workspace access to view this dashboard." />
      </DashboardLayout>
    );
  }

  const activePanelConfig = panelLookup.get(activePanel) ?? PANEL_OPTIONS[0];
  const expandedPanelConfig = panelExpanded ? panelLookup.get(panelExpanded) : null;
  const editingJobTitle = editingJob?.job?.title ?? editingJob?.advert?.title ?? editingJob?.title ?? null;
  const selectedJobTitle = selectedJob?.job?.title ?? selectedJob?.advert?.title ?? selectedJob?.title ?? null;
  const formHeaderTitle = formMode === 'edit' ? editingJobTitle : selectedJobTitle;

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Jobs"
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="jobs"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Workspace
              <select
                value={workspaceIdParam ?? data?.meta?.selectedWorkspaceId ?? ''}
                onChange={handleWorkspaceChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select</option>
                {workspaceOptions.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Lookback
              <select
                value={lookbackDays}
                onChange={handleLookbackChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {LOOKBACK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} days
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
            statusLabel="Jobs"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <JobAdvertList
              jobs={jobs}
              summary={summary}
              selectedJobId={selectedJobId}
              onSelect={handleSelectJob}
              onEdit={handleEditJob}
              onFavorite={handleFavoriteJob}
              onCreate={handleCreateJob}
            />
          </aside>
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="flex flex-wrap gap-2">
                {PANEL_OPTIONS.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActivePanel(panel.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      activePanel === panel.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => setPanelExpanded(activePanelConfig.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
                Expand
              </button>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{activePanelConfig.label}</h3>
              <div className="mt-4 space-y-4">
                {renderPanelContent(activePanelConfig.id)}
              </div>
            </div>
          </section>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <button type="button" aria-label="Close job form" className="flex-1 bg-slate-900/50" onClick={handleCancelForm} />
          <div className="relative h-full w-full max-w-3xl overflow-y-auto bg-white px-6 py-8 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{formMode === 'create' ? 'New job' : 'Edit job'}</h3>
                {formHeaderTitle ? <p className="text-xs text-slate-500">{formHeaderTitle}</p> : null}
              </div>
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <JobAdvertForm
                initialJob={formMode === 'edit' ? editingJob : null}
                lookups={lookups}
                submitting={savingJob}
                onSubmit={handleSubmitJob}
                onCancel={handleCancelForm}
                submitLabel={formMode === 'create' ? 'Create job' : 'Save changes'}
              />
            </div>
          </div>
        </div>
      ) : null}

      {panelExpanded && expandedPanelConfig ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 px-4 py-10">
          <div className="relative h-full max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{expandedPanelConfig.label}</h3>
              <button
                type="button"
                onClick={() => setPanelExpanded(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(90vh-4.5rem)] overflow-y-auto px-6 py-6">
              {renderPanelContent(expandedPanelConfig.id)}
            </div>
          </div>
        </div>
      ) : null}

      {candidateDrawerOpen && focusedCandidate ? (
        <div className="fixed inset-0 z-50 flex">
          <button type="button" aria-label="Close candidate" className="flex-1 bg-slate-900/40" onClick={handleCloseCandidate} />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-10 w-10 text-blue-500" />
                <div>
                  <p className="text-base font-semibold text-slate-900">{formatCandidateName(focusedCandidate)}</p>
                  <p className="text-xs text-slate-500">{focusedCandidate.jobTitle ?? selectedJob?.job?.title ?? selectedJob?.advert?.title ?? ''}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCandidate}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 px-6 py-6 text-sm text-slate-600">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {formatStatus(focusedCandidate.status)}
                </div>
              </div>
              {focusedCandidateNotes.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Notes</h4>
                  <ul className="mt-3 space-y-2">
                    {focusedCandidateNotes.map((note) => (
                      <li key={note.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{note.summary}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</p>
                        {note.nextSteps ? <p className="text-xs text-slate-500">Next: {note.nextSteps}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {focusedCandidateInterviews.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Interviews</h4>
                  <ul className="mt-3 space-y-2">
                    {focusedCandidateInterviews.map((interview) => (
                      <li key={interview.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{interview.interviewStage ?? 'Interview'}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(interview.scheduledAt ?? interview.startAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {focusedCandidateResponses.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Messages</h4>
                  <ul className="mt-3 space-y-2">
                    {focusedCandidateResponses.map((response) => (
                      <li key={response.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                        <p className="text-xs text-slate-500">{response.channel ?? 'message'} • {formatDateTime(response.sentAt)}</p>
                        <p className="text-sm text-slate-700">{response.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
