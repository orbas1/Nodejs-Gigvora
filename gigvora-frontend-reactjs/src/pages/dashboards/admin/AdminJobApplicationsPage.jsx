import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { AdjustmentsHorizontalIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import JobApplicationFilters from '../../../components/admin/jobApplications/JobApplicationFilters.jsx';
import JobApplicationTable from '../../../components/admin/jobApplications/JobApplicationTable.jsx';
import JobApplicationDrawer from '../../../components/admin/jobApplications/JobApplicationDrawer.jsx';
import JobApplicationCreateDrawer from '../../../components/admin/jobApplications/JobApplicationCreateDrawer.jsx';
import {
  createJobApplication,
  createJobApplicationDocument,
  createJobApplicationInterview,
  createJobApplicationNote,
  deleteJobApplication,
  deleteJobApplicationDocument,
  deleteJobApplicationInterview,
  deleteJobApplicationNote,
  fetchJobApplication,
  listJobApplications,
  updateJobApplication,
  updateJobApplicationDocument,
  updateJobApplicationInterview,
  updateJobApplicationNote,
} from '../../../services/jobApplications.js';

const TABS = [
  { id: 'flow', label: 'Flow' },
  { id: 'meet', label: 'Meet' },
  { id: 'docs', label: 'Docs' },
];

const MENU_SECTIONS = [
  {
    label: 'Hire',
    items: TABS.map((tab) => ({ name: tab.label, sectionId: tab.id })),
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  status: '',
  stage: '',
  priority: '',
  source: '',
  assignedRecruiterId: '',
});

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function AdminJobApplicationsPage() {
  const { profile } = useSession();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12 });
  const [listData, setListData] = useState({
    data: [],
    pagination: { page: 1, totalPages: 1, totalItems: 0, pageSize: 12 },
    facets: {},
    metrics: {},
  });
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const sanitizedFilters = useMemo(() => {
    const entries = Object.entries(filters).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      return `${value}`.trim() !== '';
    });
    return Object.fromEntries(entries);
  }, [filters]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const response = await listJobApplications({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...sanitizedFilters,
      });
      setListData({
        data: Array.isArray(response?.data) ? response.data : [],
        pagination: {
          page: response?.pagination?.page ?? pagination.page,
          totalPages: response?.pagination?.totalPages ?? 1,
          totalItems: response?.pagination?.totalItems ?? response?.data?.length ?? 0,
          pageSize: response?.pagination?.pageSize ?? pagination.pageSize,
        },
        facets: response?.facets ?? {},
        metrics: response?.metrics ?? {},
      });
    } catch (error) {
      console.error('Failed to load job applications', error);
      setListError(error?.message ?? 'Unable to load job applications.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sanitizedFilters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const openCreateDrawer = () => {
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleSelectApplication = async (application) => {
    setPanelError('');
    setSelectedApplication(application);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchJobApplication(application.id);
      setSelectedApplication(detail);
    } catch (error) {
      console.error('Failed to load job application detail', error);
      setPanelError(error?.message ?? 'Unable to load application detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedApplication(null);
    setPanelError('');
  };

  const handleCreateApplication = async (payload) => {
    setCreateBusy(true);
    setCreateError(null);
    try {
      const created = await createJobApplication(payload);
      setCreateOpen(false);
      await fetchList();
      setSelectedApplication(created);
      setDrawerOpen(true);
    } catch (error) {
      console.error('Failed to create job application', error);
      setCreateError(error?.message ?? 'Unable to create job application.');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleUpdateApplication = async (applicationId, payload) => {
    setSaving(true);
    setPanelError('');
    try {
      const updated = await updateJobApplication(applicationId, payload);
      setSelectedApplication(updated);
      await fetchList();
    } catch (error) {
      console.error('Failed to update job application', error);
      setPanelError(error?.message ?? 'Unable to update job application.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    setRemoving(true);
    setPanelError('');
    try {
      await deleteJobApplication(applicationId);
      closeDrawer();
      await fetchList();
    } catch (error) {
      console.error('Failed to delete job application', error);
      setPanelError(error?.message ?? 'Unable to delete job application.');
    } finally {
      setRemoving(false);
    }
  };

  const applyDetailUpdate = useCallback((updater) => {
    setSelectedApplication((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const handleCreateNote = async (applicationId, payload) => {
    setPanelError('');
    try {
      const note = await createJobApplicationNote(applicationId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        notes: [note, ...(prev.notes ?? [])],
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to create note', error);
      setPanelError(error?.message ?? 'Unable to add note.');
    }
  };

  const handleUpdateNote = async (applicationId, noteId, payload) => {
    setPanelError('');
    try {
      const note = await updateJobApplicationNote(applicationId, noteId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        notes: (prev.notes ?? []).map((existing) => (existing.id === note.id ? note : existing)),
      }));
    } catch (error) {
      console.error('Failed to update note', error);
      setPanelError(error?.message ?? 'Unable to update note.');
    }
  };

  const handleDeleteNote = async (applicationId, noteId) => {
    setPanelError('');
    try {
      await deleteJobApplicationNote(applicationId, noteId);
      applyDetailUpdate((prev) => ({
        ...prev,
        notes: (prev.notes ?? []).filter((note) => note.id !== noteId),
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to delete note', error);
      setPanelError(error?.message ?? 'Unable to delete note.');
    }
  };

  const handleCreateInterview = async (applicationId, payload) => {
    setPanelError('');
    try {
      const interview = await createJobApplicationInterview(applicationId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        interviews: [...(prev.interviews ?? []), interview],
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to create interview', error);
      setPanelError(error?.message ?? 'Unable to schedule interview.');
    }
  };

  const handleUpdateInterview = async (applicationId, interviewId, payload) => {
    setPanelError('');
    try {
      const interview = await updateJobApplicationInterview(applicationId, interviewId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        interviews: (prev.interviews ?? []).map((existing) => (existing.id === interview.id ? interview : existing)),
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to update interview', error);
      setPanelError(error?.message ?? 'Unable to update interview.');
    }
  };

  const handleDeleteInterview = async (applicationId, interviewId) => {
    setPanelError('');
    try {
      await deleteJobApplicationInterview(applicationId, interviewId);
      applyDetailUpdate((prev) => ({
        ...prev,
        interviews: (prev.interviews ?? []).filter((interview) => interview.id !== interviewId),
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to delete interview', error);
      setPanelError(error?.message ?? 'Unable to delete interview.');
    }
  };

  const handleCreateDocument = async (applicationId, payload) => {
    setPanelError('');
    try {
      const document = await createJobApplicationDocument(applicationId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        documents: [...(prev.documents ?? []), document],
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to add document', error);
      setPanelError(error?.message ?? 'Unable to attach document.');
    }
  };

  const handleUpdateDocument = async (applicationId, documentId, payload) => {
    setPanelError('');
    try {
      const document = await updateJobApplicationDocument(applicationId, documentId, payload);
      applyDetailUpdate((prev) => ({
        ...prev,
        documents: (prev.documents ?? []).map((existing) => (existing.id === document.id ? document : existing)),
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to update document', error);
      setPanelError(error?.message ?? 'Unable to update document.');
    }
  };

  const handleDeleteDocument = async (applicationId, documentId) => {
    setPanelError('');
    try {
      await deleteJobApplicationDocument(applicationId, documentId);
      applyDetailUpdate((prev) => ({
        ...prev,
        documents: (prev.documents ?? []).filter((document) => document.id !== documentId),
      }));
      await fetchList();
    } catch (error) {
      console.error('Failed to delete document', error);
      setPanelError(error?.message ?? 'Unable to delete document.');
    }
  };

  const tablePagination = useMemo(
    () => ({
      page: listData.pagination?.page ?? pagination.page,
      totalPages: listData.pagination?.totalPages ?? 1,
    }),
    [listData.pagination, pagination.page],
  );

  const totalItems = listData.pagination?.totalItems ?? listData.data?.length ?? 0;
  const upcomingInterviews = useMemo(() => listData.metrics?.upcomingInterviews ?? [], [listData.metrics]);
  const documentHighlights = useMemo(
    () => (listData.data ?? []).filter((application) => (application.documentCount ?? 0) > 0).slice(0, 9),
    [listData.data],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Hiring"
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
      profile={profile}
    >
      <div className="flex h-full flex-col gap-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Filters
            </button>
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              New
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{totalItems} total</span>
            <button
              type="button"
              onClick={fetchList}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={loading ? 'h-4 w-4 animate-spin text-blue-600' : 'h-4 w-4 text-slate-400'} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <div className="flex h-full flex-col">
              <Tab.List className="flex gap-2 border-b border-slate-200 bg-slate-50 p-4">
                {TABS.map((tab) => (
                  <Tab
                    key={tab.id}
                    className={({ selected }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selected ? 'bg-white text-blue-600 shadow-sm shadow-blue-100' : 'text-slate-600 hover:bg-white/70'
                      }`
                    }
                  >
                    {tab.label}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="flex-1 overflow-hidden">
                <Tab.Panel className="flex h-full flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {listError ? (
                      <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        {listError}
                      </div>
                    ) : null}
                    <JobApplicationTable
                      applications={listData.data}
                      loading={loading}
                      onSelect={handleSelectApplication}
                      onCreate={openCreateDrawer}
                      selectedId={selectedApplication?.id}
                      pagination={tablePagination}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </Tab.Panel>

                <Tab.Panel className="flex h-full flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {upcomingInterviews.length ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {upcomingInterviews.map((interview) => (
                          <div
                            key={interview.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-700 shadow-sm"
                          >
                            <p className="text-sm font-semibold text-slate-900">{formatDateTime(interview.scheduledAt)}</p>
                            <p className="mt-2 text-xs text-slate-500">{interview.candidateName}</p>
                            <p className="text-xs text-slate-400">{interview.jobTitle}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <span>{interview.type?.replace(/_/g, ' ')}</span>
                              <span>{interview.interviewerName || 'Unassigned'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                        No interviews
                      </div>
                    )}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="flex h-full flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {documentHighlights.length ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {documentHighlights.map((application) => (
                          <div
                            key={application.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-700 shadow-sm"
                          >
                            <p className="text-sm font-semibold text-slate-900">{application.candidateName}</p>
                            <p className="text-xs text-slate-500">{application.jobTitle}</p>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {application.documentCount} file{application.documentCount === 1 ? '' : 's'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                        No files
                      </div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </div>

      <JobApplicationDrawer
        open={drawerOpen}
        application={selectedApplication}
        facets={listData.facets}
        saving={saving}
        deleting={removing}
        error={panelError}
        loadingDetail={detailLoading}
        onClose={closeDrawer}
        onUpdate={handleUpdateApplication}
        onDelete={handleDeleteApplication}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onCreateInterview={handleCreateInterview}
        onUpdateInterview={handleUpdateInterview}
        onDeleteInterview={handleDeleteInterview}
        onCreateDocument={handleCreateDocument}
        onUpdateDocument={handleUpdateDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      <JobApplicationCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateApplication}
        busy={createBusy}
        error={createError}
        facets={listData.facets}
      />

      <Transition show={filtersOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={setFiltersOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="flex h-[90vh] w-full max-w-3xl transform flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                <JobApplicationFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  facets={listData.facets}
                  metrics={listData.metrics}
                  onClose={() => setFiltersOpen(false)}
                  initialFilters={DEFAULT_FILTERS}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
}
