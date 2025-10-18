import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminJobPosts,
  createAdminJobPost,
  updateAdminJobPost,
  publishAdminJobPost,
  archiveAdminJobPost,
  deleteAdminJobPost,
} from '../../../services/adminJobPosts.js';
import JobPostBoard from './JobPostBoard.jsx';
import JobPostDetailDrawer from './JobPostDetailDrawer.jsx';
import JobPostWizard from './JobPostWizard.jsx';
import {
  createEmptyForm,
  buildFormFromJob,
  buildPayloadFromForm,
} from './jobPostFormUtils.js';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const DEFAULT_FILTERS = {
  search: '',
  status: undefined,
  workflowStage: undefined,
  visibility: undefined,
  page: 1,
  pageSize: 20,
};

function InlineBanner({ type = 'success', message, onClose }) {
  if (!message) {
    return null;
  }
  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircleIcon : ExclamationCircleIcon;
  const toneClass = isSuccess
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-600';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" aria-hidden="true" />
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-current transition hover:border-current"
      >
        Dismiss
      </button>
    </div>
  );
}

function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = 'primary',
  noteLabel = 'Notes',
  noteValue,
  onNoteChange,
  showNote = false,
  showHardDelete = false,
  hardDelete = false,
  onHardDeleteChange,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) {
    return null;
  }

  const confirmClass =
    confirmTone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-500'
      : confirmTone === 'warning'
      ? 'bg-amber-500 hover:bg-amber-400 focus-visible:ring-amber-500'
      : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <header className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </header>
        <div className="mt-4 space-y-4">
          {showNote && (
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">{noteLabel}</span>
              <textarea
                value={noteValue ?? ''}
                onChange={(event) => onNoteChange?.(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          )}
          {showHardDelete && (
            <label className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <span>Remove permanently</span>
              <input
                type="checkbox"
                checked={hardDelete}
                onChange={(event) => onHardDeleteChange?.(event.target.checked)}
                className="h-5 w-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
            </label>
          )}
        </div>
        <footer className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function JobPostManagementWorkspace() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState({ statusCounts: {} });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ type: 'success', message: '' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState('create');
  const [wizardForm, setWizardForm] = useState(createEmptyForm());
  const [savingWizard, setSavingWizard] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, note: '', hardDelete: false, loading: false });

  const loadJobs = useCallback(
    async (nextFilters = filters) => {
      setLoading(true);
      try {
        const payload = await fetchAdminJobPosts({
          ...nextFilters,
          page: nextFilters.page ?? 1,
          pageSize: nextFilters.pageSize ?? 20,
        });
        setJobs(payload.results ?? []);
        setSummary(payload.summary ?? { statusCounts: {} });
        setPagination(payload.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 });
      } catch (error) {
        console.error('Failed to load job posts', error);
        setBanner({ type: 'error', message: 'Unable to load job posts right now. Please retry.' });
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  const handleFiltersChange = (nextFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...nextFilters,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({
      ...prev,
      page: Math.max(page, 1),
    }));
  };

  const openDrawer = (job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const openWizard = (mode, job) => {
    setWizardMode(mode);
    setWizardForm(job ? buildFormFromJob(job) : createEmptyForm());
    setWizardOpen(true);
  };

  const handleCreate = () => {
    openWizard('create', null);
  };

  const handleEdit = () => {
    if (!selectedJob) {
      return;
    }
    openWizard('edit', selectedJob);
  };

  const handleClone = () => {
    if (!selectedJob) {
      return;
    }
    const cloneForm = buildFormFromJob(selectedJob);
    cloneForm.id = null;
    cloneForm.slug = '';
    cloneForm.title = `${cloneForm.title ?? ''} copy`.trim();
    setWizardMode('clone');
    setWizardForm(cloneForm);
    setWizardOpen(true);
  };

  const handleWizardSubmit = async (formState) => {
    setSavingWizard(true);
    try {
      const payload = buildPayloadFromForm(formState);
      let saved;
      if (wizardMode === 'edit' && formState.id) {
        saved = await updateAdminJobPost(formState.id, payload);
        setBanner({ type: 'success', message: 'Job updated.' });
      } else {
        saved = await createAdminJobPost(payload);
        setBanner({ type: 'success', message: 'Job created.' });
      }
      setWizardOpen(false);
      setSelectedJob(saved);
      setDrawerOpen(true);
      await loadJobs(filters);
    } catch (error) {
      console.error('Failed to save job', error);
      throw error;
    } finally {
      setSavingWizard(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedJob) {
      return;
    }
    try {
      const result = await publishAdminJobPost(selectedJob.id, { publishedAt: new Date().toISOString() });
      setSelectedJob(result);
      setBanner({ type: 'success', message: 'Job published.' });
      await loadJobs(filters);
    } catch (error) {
      console.error('Publish failed', error);
      setBanner({ type: 'error', message: 'Publish failed. Check permissions and try again.' });
    }
  };

  const showArchiveDialog = () => {
    if (!selectedJob) {
      return;
    }
    setActionDialog({
      open: true,
      type: 'archive',
      note: '',
      hardDelete: false,
      loading: false,
      title: 'Archive job',
      description: 'Move this job to the archive. You can restore it later.',
      confirmLabel: 'Archive',
      confirmTone: 'warning',
      showNote: true,
      noteLabel: 'Archive note',
    });
  };

  const showDeleteDialog = () => {
    if (!selectedJob) {
      return;
    }
    setActionDialog({
      open: true,
      type: 'delete',
      note: '',
      hardDelete: false,
      loading: false,
      title: 'Delete job',
      description: 'Choose whether to remove this job permanently or keep an audit trail.',
      confirmLabel: 'Delete',
      confirmTone: 'danger',
      showNote: false,
      showHardDelete: true,
    });
  };

  const closeActionDialog = () => {
    setActionDialog((prev) => ({ ...prev, open: false, loading: false }));
  };

  const handleArchiveConfirm = async () => {
    if (!selectedJob) {
      return;
    }
    setActionDialog((prev) => ({ ...prev, loading: true }));
    try {
      const result = await archiveAdminJobPost(selectedJob.id, { reason: actionDialog.note });
      setSelectedJob(result);
      setBanner({ type: 'success', message: 'Job archived.' });
      closeActionDialog();
      await loadJobs(filters);
    } catch (error) {
      console.error('Archive failed', error);
      setActionDialog((prev) => ({ ...prev, loading: false }));
      setBanner({ type: 'error', message: 'Archive failed. Please retry.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedJob) {
      return;
    }
    setActionDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await deleteAdminJobPost(selectedJob.id, { hardDelete: actionDialog.hardDelete });
      if (actionDialog.hardDelete) {
        setSelectedJob(null);
        setDrawerOpen(false);
        setBanner({ type: 'success', message: 'Job removed.' });
      } else if (response) {
        setSelectedJob(response);
        setBanner({ type: 'success', message: 'Job archived.' });
      }
      closeActionDialog();
      await loadJobs(filters);
    } catch (error) {
      console.error('Delete failed', error);
      setActionDialog((prev) => ({ ...prev, loading: false }));
      setBanner({ type: 'error', message: 'Delete failed. Please retry.' });
    }
  };

  const actionDialogProps = useMemo(() => {
    if (!actionDialog.open) {
      return { open: false };
    }
    if (actionDialog.type === 'archive') {
      return {
        open: true,
        title: actionDialog.title,
        description: actionDialog.description,
        confirmLabel: actionDialog.confirmLabel,
        confirmTone: actionDialog.confirmTone,
        showNote: true,
        noteLabel: actionDialog.noteLabel,
        noteValue: actionDialog.note,
        onNoteChange: (value) => setActionDialog((prev) => ({ ...prev, note: value })),
        onConfirm: handleArchiveConfirm,
        onCancel: closeActionDialog,
        loading: actionDialog.loading,
      };
    }
    if (actionDialog.type === 'delete') {
      return {
        open: true,
        title: actionDialog.title,
        description: actionDialog.description,
        confirmLabel: actionDialog.confirmLabel,
        confirmTone: actionDialog.confirmTone,
        showHardDelete: true,
        hardDelete: actionDialog.hardDelete,
        onHardDeleteChange: (value) => setActionDialog((prev) => ({ ...prev, hardDelete: value })),
        onConfirm: handleDeleteConfirm,
        onCancel: closeActionDialog,
        loading: actionDialog.loading,
      };
    }
    return { open: false };
  }, [actionDialog, handleArchiveConfirm, handleDeleteConfirm]);

  return (
    <div className="space-y-8">
      <InlineBanner type={banner.type} message={banner.message} onClose={() => setBanner({ type: 'success', message: '' })} />

      <JobPostBoard
        jobs={jobs}
        summary={summary}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSelectJob={(job) => openDrawer(job)}
        onNewJob={handleCreate}
        onRefresh={() => loadJobs(filters)}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <JobPostDetailDrawer
        job={selectedJob}
        open={drawerOpen && Boolean(selectedJob)}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEdit}
        onDuplicate={handleClone}
        onPublish={handlePublish}
        onArchive={showArchiveDialog}
        onDelete={showDeleteDialog}
      />

      <JobPostWizard
        open={wizardOpen}
        mode={wizardMode}
        initialForm={wizardForm}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleWizardSubmit}
        saving={savingWizard}
      />

      <ActionDialog {...actionDialogProps} />
    </div>
  );
}
