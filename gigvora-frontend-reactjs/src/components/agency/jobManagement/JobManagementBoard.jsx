import { useCallback, useEffect, useRef, useState } from 'react';
import useSession from '../../../hooks/useSession.js';
import JobSummaryHeader from './JobSummaryHeader.jsx';
import JobCreationForm from './JobCreationForm.jsx';
import JobListPanel from './JobListPanel.jsx';
import JobDetailsPanel from './JobDetailsPanel.jsx';
import {
  fetchJobManagementMetadata,
  fetchJobManagementSummary,
  fetchAgencyJobs,
  fetchAgencyJob,
  createAgencyJob,
  updateAgencyJob,
  favoriteAgencyJob,
  unfavoriteAgencyJob,
  createAgencyApplication,
  updateAgencyApplication,
  createAgencyInterview,
  updateAgencyInterview,
  createAgencyResponse,
} from '../../../services/agencyJobManagement.js';

function resolveWorkspaceId(workspaceId, session) {
  if (workspaceId) return workspaceId;
  if (session?.primaryWorkspaceId) return session.primaryWorkspaceId;
  if (session?.workspaceId) return session.workspaceId;
  return 'agency_main_workspace';
}

export default function JobManagementBoard({ workspaceId: workspaceIdProp, jobId: jobIdProp, onJobSelectionChange }) {
  const { session } = useSession();
  const workspaceId = resolveWorkspaceId(workspaceIdProp, session);

  const [metadata, setMetadata] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [interviewSummary, setInterviewSummary] = useState({});
  const [filters, setFilters] = useState({ search: '', status: undefined });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailFullscreen, setDetailFullscreen] = useState(false);
  const selectedJobIdRef = useRef(null);
  const jobIdPropRef = useRef(jobIdProp ?? null);

  const setLoading = useCallback((key, value) => {
    setLoadingStates((previous) => ({ ...previous, [key]: value }));
  }, []);

  useEffect(() => {
    jobIdPropRef.current = jobIdProp ?? null;
  }, [jobIdProp]);

  useEffect(() => {
    selectedJobIdRef.current = selectedJob?.id ?? null;
  }, [selectedJob?.id]);

  useEffect(() => {
    if (!selectedJobIdRef.current) {
      setDetailFullscreen(false);
    }
  }, [selectedJob?.id]);

  useEffect(() => {
    let isMounted = true;
    fetchJobManagementMetadata()
      .then((result) => {
        if (!isMounted) return;
        setMetadata(result?.data ?? result);
      })
      .catch((err) => {
        console.warn('Failed to load metadata', err);
        if (isMounted) setError('Unable to load metadata for job management.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const result = await fetchJobManagementSummary({ workspaceId });
      setInterviewSummary(result?.data?.interviewStatusCounts ?? {});
    } catch (err) {
      console.warn('Failed to load summary', err);
    }
  }, [workspaceId]);

  const loadJob = useCallback(
    async (jobId) => {
      if (!jobId) return null;
      setLoading('jobDetail', true);
      let resolvedJob = null;
      try {
        const result = await fetchAgencyJob({ jobId, workspaceId });
        const job = result?.data ?? result;
        setSelectedJob(job);
        setApplications(job?.applications ?? []);
        setInterviews(
          job?.applications?.flatMap((application) =>
            (application.interviews ?? []).map((interview) => ({ ...interview, applicationId: application.id })),
          ) ?? [],
        );
        setResponses(
          job?.applications?.flatMap((application) =>
            (application.responses ?? []).map((response) => ({ ...response, applicationId: application.id })),
          ) ?? [],
        );
        resolvedJob = job;
      } catch (err) {
        console.error('Failed to load job detail', err);
        setError('Unable to load job detail.');
      } finally {
        setLoading('jobDetail', false);
      }
      return resolvedJob;
    },
    [workspaceId],
  );

  const selectJob = useCallback(
    async (jobId, { notify = true } = {}) => {
      if (!jobId) {
        setSelectedJob(null);
        setApplications([]);
        setInterviews([]);
        setResponses([]);
        selectedJobIdRef.current = null;
        if (notify) {
          onJobSelectionChange?.(null);
        }
        return null;
      }

      const job = await loadJob(jobId);
      if (job && notify) {
        onJobSelectionChange?.(job.id ?? jobId);
      }
      return job;
    },
    [loadJob, onJobSelectionChange],
  );

  const refreshJobs = useCallback(
    async (options = {}) => {
      setLoading('jobs', true);
      setError(null);
      try {
        const result = await fetchAgencyJobs({
          workspaceId,
          status: options.status ?? filters.status,
          search: options.search ?? filters.search,
        });
        const data = result?.data ?? result?.data?.data ?? result?.jobs ?? result;
        const normalizedJobs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setJobs(normalizedJobs);
        setMetrics(result?.metrics ?? data?.metrics ?? result?.data?.metrics ?? {});

        if (!normalizedJobs.length) {
          await selectJob(null, { notify: !options.silentNotify });
          return;
        }

        if (options.skipSelect) {
          return;
        }

        const preferredId = options.jobId ?? jobIdPropRef.current ?? selectedJobIdRef.current;
        let jobToSelect = null;
        if (preferredId != null) {
          jobToSelect = normalizedJobs.find((job) => String(job.id) === String(preferredId)) ?? null;
        }

        if (!jobToSelect && preferredId == null) {
          jobToSelect = normalizedJobs[0];
        }

        if (jobToSelect) {
          const shouldNotify = options.notify ?? (!jobIdPropRef.current && !options.silentNotify);
          await selectJob(jobToSelect.id, { notify: shouldNotify });
        }
      } catch (err) {
        console.error('Failed to load jobs', err);
        setError('Unable to load jobs. Please retry in a moment.');
      } finally {
        setLoading('jobs', false);
      }
    },
    [workspaceId, filters.status, filters.search, selectJob],
  );

  useEffect(() => {
    if (!jobIdProp) {
      return;
    }
    if (String(jobIdProp) === String(selectedJobIdRef.current)) {
      return;
    }
    selectJob(jobIdProp, { notify: false });
  }, [jobIdProp, selectJob]);

  useEffect(() => {
    refreshJobs();
    refreshSummary();
  }, [refreshJobs, refreshSummary]);

  const handleCreateJob = async (payload) => {
    setLoading('createJob', true);
    try {
      const result = await createAgencyJob({ workspaceId, payload });
      const created = result?.data ?? result;
      setFeedback('Job created.');
      setComposerOpen(false);
      await refreshJobs({ notify: true, jobId: created?.id });
      await refreshSummary();
    } catch (err) {
      console.error('Failed to create job', err);
      setError(err?.body?.message ?? 'Unable to create job.');
    } finally {
      setLoading('createJob', false);
    }
  };

  const handleUpdateJob = async (payload) => {
    if (!selectedJob) return;
    setLoading('job', true);
    try {
      await updateAgencyJob({ jobId: selectedJob.id, workspaceId, payload });
      setFeedback('Job details updated.');
      await loadJob(selectedJob.id);
      await refreshJobs({ jobId: selectedJob.id, skipSelect: true, silentNotify: true });
    } catch (err) {
      console.error('Failed to update job', err);
      setError(err?.body?.message ?? 'Unable to update job.');
    } finally {
      setLoading('job', false);
    }
  };

  const handleFavoriteToggle = async (job) => {
    if (!job) return;
    const actorId = session?.id ?? null;
    if (!actorId) {
      setError('You must be signed in to star jobs.');
      return;
    }
    const hasFavorite = job.favoriteMemberIds?.includes(actorId);
    setLoading('favorite', true);
    try {
      if (hasFavorite) {
        await unfavoriteAgencyJob({ jobId: job.id, workspaceId, memberId: actorId });
      } else {
        await favoriteAgencyJob({ jobId: job.id, workspaceId, memberId: actorId });
      }
      await refreshJobs({ jobId: job.id, skipSelect: true, silentNotify: true });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      setError(err?.body?.message ?? 'Unable to update favorite.');
    } finally {
      setLoading('favorite', false);
    }
  };

  const handleCreateApplication = async (payload) => {
    if (!selectedJob) return;
    setLoading('createApplication', true);
    try {
      await createAgencyApplication({ jobId: selectedJob.id, workspaceId, payload });
      setFeedback('Candidate added to the pipeline.');
      await loadJob(selectedJob.id);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to create application', err);
      setError(err?.body?.message ?? 'Unable to add candidate.');
    } finally {
      setLoading('createApplication', false);
    }
  };

  const handleUpdateApplication = async (application, payload) => {
    if (!application) return;
    setLoading('application', true);
    try {
      await updateAgencyApplication({ applicationId: application.id, workspaceId, payload });
      await loadJob(application.jobId ?? selectedJob?.id);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to update application', err);
      setError(err?.body?.message ?? 'Unable to update application.');
    } finally {
      setLoading('application', false);
    }
  };

  const handleCreateInterview = async (application, payload) => {
    if (!application) return;
    setLoading('interview', true);
    try {
      await createAgencyInterview({ applicationId: application.id, workspaceId, payload });
      setFeedback('Interview scheduled.');
      await loadJob(application.jobId ?? selectedJob?.id);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to schedule interview', err);
      setError(err?.body?.message ?? 'Unable to schedule interview.');
    } finally {
      setLoading('interview', false);
    }
  };

  const handleUpdateInterview = async (interview, payload) => {
    if (!interview) return;
    setLoading('interview', true);
    try {
      await updateAgencyInterview({ interviewId: interview.id, workspaceId, payload });
      await loadJob(selectedJob?.id ?? interview.jobId);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to update interview', err);
      setError(err?.body?.message ?? 'Unable to update interview.');
    } finally {
      setLoading('interview', false);
    }
  };

  const handleCreateResponse = async (application, payload) => {
    if (!application) return;
    setLoading('response', true);
    try {
      await createAgencyResponse({ applicationId: application.id, workspaceId, payload });
      setFeedback('Response captured.');
      await loadJob(application.jobId ?? selectedJob?.id);
    } catch (err) {
      console.error('Failed to create response', err);
      setError(err?.body?.message ?? 'Unable to log response.');
    } finally {
      setLoading('response', false);
    }
  };

  const handleSelectJob = useCallback(
    (job) => {
      if (!job) return;
      selectJob(job.id, { notify: true });
    },
    [selectJob],
  );

  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const closeDetailFullscreen = useCallback(() => setDetailFullscreen(false), []);

  return (
    <>
      <div className="flex flex-col gap-6">
        {feedback ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        <JobSummaryHeader
          metrics={metrics}
          interviewSummary={interviewSummary}
          isRefreshing={Boolean(loadingStates.jobs)}
          onRefresh={() => refreshJobs({ jobId: selectedJobIdRef.current, notify: false })}
          onCreate={openComposer}
          workspaceId={workspaceId}
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          <JobListPanel
            jobs={jobs}
            metadata={metadata}
            filters={filters}
            onFilterChange={(nextFilters) => {
              setFilters(nextFilters);
              refreshJobs({ status: nextFilters.status, search: nextFilters.search });
            }}
            onSelectJob={handleSelectJob}
            selectedJobId={selectedJob?.id}
            onFavoriteToggle={handleFavoriteToggle}
            isLoading={Boolean(loadingStates.jobs)}
            workspaceId={workspaceId}
            onCreateJob={openComposer}
          />
          <div className="min-h-[680px]">
            <JobDetailsPanel
              job={selectedJob}
              metadata={metadata}
              applications={applications}
              interviews={interviews}
              responses={responses}
              onUpdateJob={handleUpdateJob}
              onCreateApplication={handleCreateApplication}
              onUpdateApplication={handleUpdateApplication}
              onCreateInterview={handleCreateInterview}
              onUpdateInterview={handleUpdateInterview}
              onCreateResponse={handleCreateResponse}
              loadingStates={loadingStates}
              workspaceId={workspaceId}
              onExpand={() => setDetailFullscreen(true)}
            />
          </div>
        </div>
      </div>
      {composerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeComposer}
              className="absolute right-6 top-6 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Close composer"
            >
              ×
            </button>
            <JobCreationForm
              metadata={metadata}
              onSubmit={handleCreateJob}
              isSubmitting={Boolean(loadingStates.createJob)}
              workspaceId={workspaceId}
              onCancel={closeComposer}
            />
          </div>
        </div>
      ) : null}
      {detailFullscreen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="h-full w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <JobDetailsPanel
              job={selectedJob}
              metadata={metadata}
              applications={applications}
              interviews={interviews}
              responses={responses}
              onUpdateJob={handleUpdateJob}
              onCreateApplication={handleCreateApplication}
              onUpdateApplication={handleUpdateApplication}
              onCreateInterview={handleCreateInterview}
              onUpdateInterview={handleUpdateInterview}
              onCreateResponse={handleCreateResponse}
              loadingStates={loadingStates}
              workspaceId={workspaceId}
              isFullscreen
              onCloseFullscreen={closeDetailFullscreen}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
