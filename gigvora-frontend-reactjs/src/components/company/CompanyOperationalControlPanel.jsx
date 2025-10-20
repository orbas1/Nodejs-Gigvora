import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowsPointingOutIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import WalletListPanel from './wallet/WalletListPanel.jsx';
import CompanyWalletDetailPanel from './wallet/CompanyWalletDetailPanel.jsx';
import JobAdvertList from './jobManagement/JobAdvertList.jsx';
import JobAdvertForm from './jobManagement/JobAdvertForm.jsx';
import CandidateList from './jobManagement/CandidateList.jsx';
import CandidateResponsesPanel from './jobManagement/CandidateResponsesPanel.jsx';
import CandidateNotesPanel from './jobManagement/CandidateNotesPanel.jsx';
import InterviewManager from './jobManagement/InterviewManager.jsx';
import ApplicantKanbanBoard from './jobManagement/ApplicantKanbanBoard.jsx';
import KeywordMatcher from './jobManagement/KeywordMatcher.jsx';
import JobHistoryTimeline from './jobManagement/JobHistoryTimeline.jsx';
import useCompanyWallets from '../../hooks/useCompanyWallets.js';
import useCompanyWalletDetail from '../../hooks/useCompanyWalletDetail.js';
import useCompanyJobOperations from '../../hooks/useCompanyJobOperations.js';
import {
  createCompanyWallet,
  updateCompanyWallet,
  createWalletTransaction,
  createWalletFundingSource,
  updateWalletFundingSource,
  createWalletPayoutMethod,
  updateWalletPayoutMethod,
  createWalletSpendingPolicy,
  updateWalletSpendingPolicy,
  retireWalletSpendingPolicy,
  addWalletMember,
  updateWalletMember,
  removeWalletMember,
} from '../../services/companyWallets.js';
import {
  createJobAdvert,
  updateJobAdvert,
  updateJobKeywords,
  createJobApplication,
  updateJobApplication,
  scheduleInterview,
  updateInterview,
  recordCandidateResponse,
  addCandidateNote,
  createJobFavorite,
} from '../../services/companyJobOperations.js';

const PANEL_TABS = [
  {
    id: 'home',
    label: 'Home',
    description: 'Snapshot, key metrics, and quick actions.',
    icon: BuildingLibraryIcon,
  },
  {
    id: 'finance',
    label: 'Finance management',
    description: 'Wallets, cash flow, and treasury automation.',
    icon: CurrencyDollarIcon,
  },
  {
    id: 'applications',
    label: 'Job applications',
    description: 'Manage pipelines, communication, and feedback.',
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'interviews',
    label: 'Interviews',
    description: 'Schedule panels, capture scorecards, and close loops.',
    icon: UserCircleIcon,
  },
  {
    id: 'ats',
    label: 'ATS system',
    description: 'Automation coverage, history, and kanban flows.',
    icon: Cog6ToothIcon,
  },
];

const SUMMARY_ICON_CLASSES = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-slate-100 text-slate-700',
  'bg-rose-100 text-rose-700',
];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function SummaryDeck({ cards = [], onOpenFinance, onOpenJobs }) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(0, 6).map((card, index) => (
          <div
            key={card.label}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-soft"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value ?? '—'}</p>
              {card.helper ? <p className="mt-1 text-xs text-slate-500">{card.helper}</p> : null}
            </div>
            <div
              className={classNames(
                'rounded-2xl p-3 shadow-sm',
                SUMMARY_ICON_CLASSES[index % SUMMARY_ICON_CLASSES.length],
              )}
              aria-hidden="true"
            >
              <ArrowsPointingOutIcon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpenFinance}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
        >
          Open finance workspace
        </button>
        <button
          type="button"
          onClick={onOpenJobs}
          className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
        >
          Review job funnels
        </button>
      </div>
    </div>
  );
}

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

function CandidateDrawer({
  open,
  candidate,
  job,
  notes,
  responses,
  interviews,
  onClose,
  onUpdate,
  onUpdateStatus,
  lookups,
}) {
  const [formState, setFormState] = useState({
    status: candidate?.status ?? '',
    decisionAt: candidate?.decisionAt ? candidate.decisionAt.slice(0, 10) : '',
  });
  const applicationStatuses = lookups?.applicationStatuses ?? [];

  useEffect(() => {
    setFormState({
      status: candidate?.status ?? '',
      decisionAt: candidate?.decisionAt ? candidate.decisionAt.slice(0, 10) : '',
    });
  }, [candidate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!candidate) {
      return;
    }
    await onUpdateStatus?.({
      status: formState.status || undefined,
      decisionAt: formState.decisionAt || undefined,
    });
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserCircleIcon className="h-10 w-10 text-blue-500" />
                        <div>
                          <Dialog.Title className="text-base font-semibold text-slate-900">
                            {formatCandidateName(candidate)}
                          </Dialog.Title>
                          <p className="text-xs text-slate-500">{job?.job?.title ?? job?.advert?.title ?? job?.title ?? ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 text-sm text-slate-600">
                      <form className="space-y-3" onSubmit={handleSubmit}>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                          <select
                            value={formState.status}
                            onChange={(event) =>
                              setFormState((previous) => ({ ...previous, status: event.target.value }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="">Select</option>
                            {applicationStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex flex-col gap-1 text-sm">
                          Decision date
                          <input
                            type="date"
                            value={formState.decisionAt}
                            onChange={(event) =>
                              setFormState((previous) => ({ ...previous, decisionAt: event.target.value }))
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            Update status
                          </button>
                        </div>
                      </form>

                      {notes?.length ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Notes</h4>
                          <ul className="mt-3 space-y-2">
                            {notes.map((note) => (
                              <li key={note.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                                <p className="text-sm font-semibold text-slate-900">{note.summary}</p>
                                <p className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</p>
                                {note.nextSteps ? (
                                  <p className="text-xs text-slate-500">Next: {note.nextSteps}</p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {interviews?.length ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Interviews</h4>
                          <ul className="mt-3 space-y-2">
                            {interviews.map((interview) => (
                              <li key={interview.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {interview.interviewStage ?? 'Interview'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatDateTime(interview.scheduledAt ?? interview.startAt)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {responses?.length ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Messages</h4>
                          <ul className="mt-3 space-y-2">
                            {responses.map((response) => (
                              <li key={response.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                                <p className="text-xs text-slate-500">
                                  {response.channel ?? 'message'} • {formatDateTime(response.sentAt)}
                                </p>
                                <p className="text-sm text-slate-700">{response.message}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function CompanyOperationalControlPanel({
  workspaceId,
  workspaceSlug,
  lookbackDays = 90,
  summaryCards = [],
  session,
}) {
  const [activeTab, setActiveTab] = useState('home');

  const {
    data: walletsData,
    loading: walletsLoading,
    error: walletsError,
    refresh: refreshWallets,
  } = useCompanyWallets({ workspaceId, workspaceSlug, enabled: Boolean(workspaceId) });

  const wallets = walletsData?.wallets ?? [];
  const walletSummary = walletsData?.summary ?? {};

  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [walletView, setWalletView] = useState('overview');

  useEffect(() => {
    if (!selectedWalletId && wallets.length) {
      setSelectedWalletId(`${wallets[0].id}`);
    }
  }, [wallets, selectedWalletId]);

  const {
    data: walletDetail,
    loading: walletDetailLoading,
    refresh: refreshWalletDetail,
  } = useCompanyWalletDetail(selectedWalletId, {
    workspaceId,
    workspaceSlug,
    enabled: Boolean(workspaceId) && Boolean(selectedWalletId),
  });

  const walletWorkspaceIdentifier = useMemo(
    () => ({ workspaceId, workspaceSlug }),
    [workspaceId, workspaceSlug],
  );

  const handleCreateWallet = async (payload) => {
    const result = await createCompanyWallet(payload, walletWorkspaceIdentifier);
    await refreshWallets({ force: true });
    setSelectedWalletId(`${result.id}`);
    return result;
  };

  const handleUpdateWallet = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateCompanyWallet(selectedWalletId, payload, walletWorkspaceIdentifier);
    await Promise.all([refreshWallets({ force: false }), refreshWalletDetail({ force: true })]);
    return updated;
  };

  const handleCreateTransaction = async (transaction) => {
    if (!selectedWalletId) return null;
    const result = await createWalletTransaction(selectedWalletId, transaction, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleCreateFundingSource = async (payload) => {
    if (!selectedWalletId) return null;
    const result = await createWalletFundingSource(selectedWalletId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleUpdateFundingSource = async (sourceId, payload) => {
    if (!selectedWalletId) return null;
    const result = await updateWalletFundingSource(selectedWalletId, sourceId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleCreatePayoutMethod = async (payload) => {
    if (!selectedWalletId) return null;
    const result = await createWalletPayoutMethod(selectedWalletId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleUpdatePayoutMethod = async (methodId, payload) => {
    if (!selectedWalletId) return null;
    const result = await updateWalletPayoutMethod(selectedWalletId, methodId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleCreatePolicy = async (payload) => {
    if (!selectedWalletId) return null;
    const result = await createWalletSpendingPolicy(selectedWalletId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleUpdatePolicy = async (policyId, payload) => {
    if (!selectedWalletId) return null;
    const result = await updateWalletSpendingPolicy(selectedWalletId, policyId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleRetirePolicy = async (policyId) => {
    if (!selectedWalletId) return null;
    const result = await retireWalletSpendingPolicy(selectedWalletId, policyId, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleAddMember = async (payload) => {
    if (!selectedWalletId) return null;
    const result = await addWalletMember(selectedWalletId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleUpdateMember = async (memberId, payload) => {
    if (!selectedWalletId) return null;
    const result = await updateWalletMember(selectedWalletId, memberId, payload, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedWalletId) return null;
    const result = await removeWalletMember(selectedWalletId, memberId, walletWorkspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return result;
  };

  const {
    data: jobOpsData,
    loading: jobOpsLoading,
    error: jobOpsError,
    refresh: refreshJobOps,
  } = useCompanyJobOperations({ workspaceId, workspaceSlug, lookbackDays, enabled: Boolean(workspaceId) });

  const jobs = jobOpsData?.jobAdverts ?? [];
  const lookups = jobOpsData?.lookups ?? {};
  const applications = jobOpsData?.applications ?? [];
  const interviews = jobOpsData?.interviews ?? [];
  const responses = jobOpsData?.responses ?? [];
  const notes = jobOpsData?.notes ?? [];
  const kanban = jobOpsData?.kanban ?? [];

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingJob, setEditingJob] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [updatingKeywords, setUpdatingKeywords] = useState(false);

  const [applicationForm, setApplicationForm] = useState({
    applicantId: '',
    status: 'submitted',
    sourceChannel: 'web',
    submittedAt: '',
  });
  const [creatingApplication, setCreatingApplication] = useState(false);

  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [focusedCandidate, setFocusedCandidate] = useState(null);

  useEffect(() => {
    if (!selectedJobId && jobs.length) {
      setSelectedJobId(resolveJobId(jobs[0]));
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => resolveJobId(job) === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const jobApplications = useMemo(() => {
    if (!selectedJobId) return [];
    return (applications ?? []).filter((application) => application.jobId === selectedJobId);
  }, [applications, selectedJobId]);

  const jobResponses = useMemo(() => {
    if (!selectedJobId) return [];
    return (responses ?? []).filter((response) => response.jobId === selectedJobId);
  }, [responses, selectedJobId]);

  const jobNotes = useMemo(() => {
    if (!selectedJobId) return [];
    return (notes ?? []).filter((note) => note.jobId === selectedJobId);
  }, [notes, selectedJobId]);

  const jobKanban = useMemo(() => {
    if (!selectedJobId) return kanban;
    return (kanban ?? []).map((column) => ({
      ...column,
      applications: (column.applications ?? []).filter((application) => application.jobId === selectedJobId),
    }));
  }, [kanban, selectedJobId]);

  const focusedCandidateId = focusedCandidate?.id ?? null;
  const focusedCandidateNotes = useMemo(() => {
    if (!focusedCandidateId) return [];
    return jobNotes.filter((note) => note.applicationId === focusedCandidateId);
  }, [jobNotes, focusedCandidateId]);
  const focusedCandidateResponses = useMemo(() => {
    if (!focusedCandidateId) return [];
    return jobResponses.filter((response) => response.applicationId === focusedCandidateId);
  }, [jobResponses, focusedCandidateId]);
  const focusedCandidateInterviews = useMemo(() => {
    if (!focusedCandidateId) return [];
    return (interviews ?? []).filter((interview) => {
      const applicationId = interview.applicationId ?? interview.application?.id ?? interview.application?.targetId;
      return applicationId === focusedCandidateId;
    });
  }, [interviews, focusedCandidateId]);

  const handleSelectJob = (job) => {
    const jobId = resolveJobId(job);
    setSelectedJobId(jobId);
    setFocusedCandidate(null);
    setCandidateDrawerOpen(false);
  };

  const handleCreateJob = () => {
    setFormMode('create');
    setEditingJob(null);
    setFormOpen(true);
  };

  const handleEditJob = (job) => {
    setFormMode('edit');
    setEditingJob(job);
    setFormOpen(true);
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
        setSelectedJobId(jobId ?? null);
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
      setFormOpen(false);
      setEditingJob(null);
      setFormMode('create');
      await refreshJobOps({ force: true });
    } finally {
      setSavingJob(false);
    }
  };

  const handleCreateApplication = async (event) => {
    event.preventDefault();
    if (!selectedJobId || !workspaceId) {
      return;
    }
    if (!applicationForm.applicantId) {
      return;
    }
    setCreatingApplication(true);
    try {
      await createJobApplication(selectedJobId, {
        workspaceId,
        applicantId: Number(applicationForm.applicantId),
        status: applicationForm.status,
        sourceChannel: applicationForm.sourceChannel,
        submittedAt: applicationForm.submittedAt || undefined,
      });
      setApplicationForm({ applicantId: '', status: 'submitted', sourceChannel: 'web', submittedAt: '' });
      await refreshJobOps({ force: true });
    } finally {
      setCreatingApplication(false);
    }
  };

  const handleUpdateApplicationStatus = async (payload) => {
    if (!selectedJobId || !focusedCandidateId || !workspaceId) {
      return;
    }
    await updateJobApplication(selectedJobId, focusedCandidateId, {
      workspaceId,
      ...payload,
    });
    await refreshJobOps({ force: true });
  };

  const handleScheduleInterview = async ({ applicationId, interviewStage, scheduledAt, durationMinutes }) => {
    if (!selectedJobId || !workspaceId) {
      return;
    }
    await scheduleInterview(selectedJobId, {
      workspaceId,
      applicationId,
      interviewStage,
      scheduledAt,
      durationMinutes,
    });
    await refreshJobOps({ force: true });
  };

  const handleUpdateInterview = async ({ id, completedAt, interviewStage }) => {
    if (!selectedJobId || !workspaceId || !id) {
      return;
    }
    await updateInterview(selectedJobId, id, {
      workspaceId,
      completedAt,
      interviewStage,
    });
    await refreshJobOps({ force: true });
  };

  const handleRecordResponse = async ({ applicationId, channel, message }) => {
    if (!selectedJobId || !workspaceId) {
      return;
    }
    await recordCandidateResponse(selectedJobId, {
      workspaceId,
      applicationId,
      channel,
      message,
    });
    await refreshJobOps({ force: true });
  };

  const handleAddNote = async ({ applicationId, summary, stage, sentiment, nextSteps }) => {
    if (!selectedJobId || !workspaceId) {
      return;
    }
    await addCandidateNote(selectedJobId, applicationId, {
      workspaceId,
      summary,
      stage,
      sentiment,
      nextSteps,
    });
    await refreshJobOps({ force: true });
  };

  const handleOpenCandidate = (candidate) => {
    if (!candidate) return;
    setFocusedCandidate(candidate);
    setCandidateDrawerOpen(true);
  };

  const handleCloseCandidate = () => {
    setFocusedCandidate(null);
    setCandidateDrawerOpen(false);
  };

  const keywordMatches = useMemo(() => selectedJob?.keywordMatches ?? [], [selectedJob]);
  const jobHistory = useMemo(() => selectedJob?.history ?? [], [selectedJob]);

  const renderHome = () => (
    <SummaryDeck
      cards={summaryCards}
      onOpenFinance={() => setActiveTab('finance')}
      onOpenJobs={() => setActiveTab('applications')}
    />
  );

  const renderFinance = () => (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)]">
      <WalletListPanel
        summary={walletSummary}
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelect={(wallet) => setSelectedWalletId(wallet ? `${wallet.id}` : null)}
        onRefresh={() => refreshWallets({ force: true })}
        includeInactive={false}
        onToggleIncludeInactive={() => {}}
        onCreateWallet={handleCreateWallet}
        busy={walletsLoading}
        error={walletsError}
      />
      <CompanyWalletDetailPanel
        wallet={walletDetail?.wallet}
        fundingSources={walletDetail?.fundingSources}
        payoutMethods={walletDetail?.payoutMethods}
        spendingPolicies={walletDetail?.spendingPolicies}
        onUpdateWallet={handleUpdateWallet}
        onCreateTransaction={handleCreateTransaction}
        onCreateFundingSource={handleCreateFundingSource}
        onUpdateFundingSource={handleUpdateFundingSource}
        onCreatePayoutMethod={handleCreatePayoutMethod}
        onUpdatePayoutMethod={handleUpdatePayoutMethod}
        onCreatePolicy={handleCreatePolicy}
        onUpdatePolicy={handleUpdatePolicy}
        onRetirePolicy={handleRetirePolicy}
        onAddMember={handleAddMember}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={handleRemoveMember}
        onRefreshWallet={() => refreshWalletDetail({ force: true })}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        view={walletView}
        onChangeView={setWalletView}
      />
      {walletDetailLoading ? (
        <p className="text-sm text-slate-500">Loading wallet details…</p>
      ) : null}
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Jobs & applications</h3>
          <p className="text-sm text-slate-600">
            Manage requisitions, pipeline stages, candidate communication, and hiring notes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCreateJob}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
          >
            New job
          </button>
          {selectedJob ? (
            <button
              type="button"
              onClick={() => handleEditJob(selectedJob)}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Edit job
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
        <JobAdvertList
          jobs={jobs}
          summary={jobOpsData?.summary}
          selectedJobId={selectedJobId}
          onSelect={handleSelectJob}
          onEdit={handleEditJob}
          onFavorite={async (job) => {
            if (!workspaceId) return;
            const jobId = resolveJobId(job);
            if (!jobId) return;
            await createJobFavorite(jobId, {
              workspaceId,
              userId: session?.id ?? undefined,
              notes: 'dashboard-favorite',
            });
            await refreshJobOps({ force: true });
          }}
          onCreate={handleCreateJob}
        />
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <h4 className="text-lg font-semibold text-slate-900">Add application</h4>
            <p className="mt-1 text-sm text-slate-600">
              Provide an applicant ID from your talent cloud to track submissions in this requisition.
            </p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreateApplication}>
              <label className="flex flex-col gap-1 text-sm">
                Applicant ID
                <input
                  value={applicationForm.applicantId}
                  onChange={(event) =>
                    setApplicationForm((previous) => ({ ...previous, applicantId: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="12345"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Status
                <select
                  value={applicationForm.status}
                  onChange={(event) =>
                    setApplicationForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {(lookups.applicationStatuses ?? ['submitted', 'interviewing', 'offer', 'hired']).map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Source channel
                <input
                  value={applicationForm.sourceChannel}
                  onChange={(event) =>
                    setApplicationForm((previous) => ({ ...previous, sourceChannel: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="web, referral"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Submitted date
                <input
                  type="date"
                  value={applicationForm.submittedAt}
                  onChange={(event) =>
                    setApplicationForm((previous) => ({ ...previous, submittedAt: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingApplication}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {creatingApplication ? 'Saving…' : 'Add application'}
                </button>
              </div>
            </form>
          </section>

          <CandidateList
            candidates={jobApplications}
            onSelect={handleOpenCandidate}
            selectedId={candidateDrawerOpen ? focusedCandidateId : null}
          />

          <CandidateResponsesPanel
            responses={jobResponses}
            applications={jobApplications}
            onSend={handleRecordResponse}
          />

          <CandidateNotesPanel
            notes={jobNotes}
            applications={jobApplications}
            onAdd={handleAddNote}
            onUpdate={null}
          />
        </div>
      </div>

      {jobOpsError ? (
        <p className="text-sm text-rose-600">{jobOpsError.message ?? 'Unable to load job operations data.'}</p>
      ) : null}
    </div>
  );

  const renderInterviews = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <h3 className="text-xl font-semibold text-slate-900">Interview operations</h3>
        <p className="mt-1 text-sm text-slate-600">
          Coordinate panels, capture scorecards, and keep candidates informed.
        </p>
        <div className="mt-6">
          <InterviewManager
            interviews={(interviews ?? []).filter(
              (interview) => interview.jobId === selectedJobId || !selectedJobId,
            )}
            applications={jobApplications}
            onSchedule={handleScheduleInterview}
            onUpdate={handleUpdateInterview}
          />
        </div>
      </div>
    </div>
  );

  const renderAts = () => (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Keyword intelligence</h3>
          <KeywordMatcher
            keywords={selectedJob?.keywords}
            matches={keywordMatches}
            onUpdate={async (keywordsList) => {
              if (!selectedJobId || !workspaceId) return;
              setUpdatingKeywords(true);
              try {
                await updateJobKeywords(selectedJobId, { workspaceId, keywords: keywordsList });
                await refreshJobOps({ force: true });
              } finally {
                setUpdatingKeywords(false);
              }
            }}
            loading={updatingKeywords}
          />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Lifecycle history</h3>
          <JobHistoryTimeline items={jobHistory} />
        </div>
      </div>

      <ApplicantKanbanBoard columns={jobKanban} onSelectApplication={handleOpenCandidate} />
    </div>
  );

  let tabContent;
  if (activeTab === 'finance') {
    tabContent = renderFinance();
  } else if (activeTab === 'applications') {
    tabContent = renderApplications();
  } else if (activeTab === 'interviews') {
    tabContent = renderInterviews();
  } else if (activeTab === 'ats') {
    tabContent = renderAts();
  } else {
    tabContent = renderHome();
  }

  const formHeaderTitle = formMode === 'edit'
    ? editingJob?.job?.title ?? editingJob?.advert?.title ?? editingJob?.title ?? 'Edit job'
    : selectedJob?.job?.title ?? selectedJob?.advert?.title ?? selectedJob?.title ?? 'New job';

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Company command center</h2>
          <p className="mt-1 text-sm text-slate-600">
            Switch between the mission-critical workspaces powering hiring, finance, and ATS operations.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PANEL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-soft'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-8">
        {tabContent}
      </div>

      <Transition show={formOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setFormOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        {formMode === 'create' ? 'Create job' : 'Edit job'}
                      </Dialog.Title>
                      <p className="text-xs text-slate-500">{formHeaderTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
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
                      onCancel={() => setFormOpen(false)}
                      submitLabel={formMode === 'create' ? 'Create job' : 'Save changes'}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <CandidateDrawer
        open={candidateDrawerOpen}
        candidate={focusedCandidate}
        job={selectedJob}
        notes={focusedCandidateNotes}
        responses={focusedCandidateResponses}
        interviews={focusedCandidateInterviews}
        onClose={handleCloseCandidate}
        onUpdate={() => refreshJobOps({ force: true })}
        onUpdateStatus={handleUpdateApplicationStatus}
        lookups={lookups}
      />

      {jobOpsLoading ? <p className="mt-6 text-sm text-slate-500">Loading job operations…</p> : null}
    </section>
  );
}
