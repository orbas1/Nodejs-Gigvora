import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  fetchProject,
  updateProject,
  updateProjectWorkspace,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  createAsset,
  deleteAsset,
  createRetrospective,
} from '../../../services/adminProjectManagement.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Plan' },
  { id: 'people', label: 'People' },
  { id: 'files', label: 'Files' },
  { id: 'apps', label: 'Apps' },
  { id: 'retro', label: 'Retro' },
];

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

const RISK_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const COLLABORATOR_STATUSES = [
  { value: 'invited', label: 'Invited' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const INTEGRATION_STATUSES = [
  { value: 'connected', label: 'Connected' },
  { value: 'disconnected', label: 'Disconnected' },
  { value: 'error', label: 'Error' },
];

const EMPTY_MILESTONE = { id: null, title: '', status: 'planned', dueDate: '', description: '' };
const EMPTY_COLLABORATOR = {
  id: null,
  fullName: '',
  email: '',
  role: '',
  status: 'invited',
  hourlyRate: '',
  permissions: '{}',
};
const EMPTY_INTEGRATION = { id: null, provider: '', status: 'connected', metadata: '{}' };
const EMPTY_ASSET = {
  label: '',
  category: 'artifact',
  storageUrl: '',
  permissionLevel: 'internal',
  thumbnailUrl: '',
  sizeBytes: '',
  watermarkEnabled: true,
  metadata: '{}',
};
const EMPTY_RETRO = { milestoneTitle: '', summary: '', sentiment: '', highlights: '{}' };

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function toJsonString(value) {
  if (!value || typeof value !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function tryParseJson(value) {
  if (!value || !value.trim()) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error };
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

export default function ProjectWorkspaceDrawer({ open, projectId, owners, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  const [baseForm, setBaseForm] = useState({
    ownerId: '',
    title: '',
    description: '',
    status: 'planning',
    budgetCurrency: 'USD',
    budgetAllocated: '',
    budgetSpent: '',
    startDate: '',
    dueDate: '',
    archivedAt: '',
    metadata: '',
  });
  const [workspaceForm, setWorkspaceForm] = useState({
    status: '',
    riskLevel: '',
    progressPercent: '',
    nextMilestone: '',
    nextMilestoneDueAt: '',
    notes: '',
    metrics: '',
  });

  const [baseFeedback, setBaseFeedback] = useState(null);
  const [workspaceFeedback, setWorkspaceFeedback] = useState(null);
  const [planFeedback, setPlanFeedback] = useState(null);
  const [peopleFeedback, setPeopleFeedback] = useState(null);
  const [fileFeedback, setFileFeedback] = useState(null);
  const [appFeedback, setAppFeedback] = useState(null);
  const [retroFeedback, setRetroFeedback] = useState(null);

  const [baseSaving, setBaseSaving] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [peopleSaving, setPeopleSaving] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [appSaving, setAppSaving] = useState(false);
  const [retroSaving, setRetroSaving] = useState(false);

  const [milestoneDraft, setMilestoneDraft] = useState(EMPTY_MILESTONE);
  const [collaboratorDraft, setCollaboratorDraft] = useState(EMPTY_COLLABORATOR);
  const [integrationDraft, setIntegrationDraft] = useState(EMPTY_INTEGRATION);
  const [assetDraft, setAssetDraft] = useState(EMPTY_ASSET);
  const [retroDraft, setRetroDraft] = useState(EMPTY_RETRO);

  const ownerOptions = useMemo(
    () => (owners ?? []).map((owner) => ({ value: owner.id, label: owner.name || owner.fullName || `User ${owner.id}` })),
    [owners],
  );

  const tabIndex = Math.max(0, TABS.findIndex((tab) => tab.id === activeTab));

  useEffect(() => {
    if (open) {
      setActiveTab('overview');
      if (projectId) {
        loadProject(projectId);
      }
    } else {
      setProject(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  useEffect(() => {
    if (project) {
      seedForms(project);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const seedForms = (detail) => {
    setBaseForm({
      ownerId: detail.ownerId ? String(detail.ownerId) : '',
      title: detail.title ?? '',
      description: detail.description ?? '',
      status: detail.status ?? 'planning',
      budgetCurrency: detail.budgetCurrency ?? 'USD',
      budgetAllocated: detail.budgetAllocated != null ? String(detail.budgetAllocated) : '',
      budgetSpent: detail.budgetSpent != null ? String(detail.budgetSpent) : '',
      startDate: detail.startDate ? detail.startDate.slice(0, 10) : '',
      dueDate: detail.dueDate ? detail.dueDate.slice(0, 10) : '',
      archivedAt: detail.archivedAt ? detail.archivedAt.slice(0, 10) : '',
      metadata: toJsonString(detail.metadata),
    });
    const workspace = detail.workspace ?? {};
    setWorkspaceForm({
      status: workspace.status ?? '',
      riskLevel: workspace.riskLevel ?? '',
      progressPercent: workspace.progressPercent != null ? String(workspace.progressPercent) : '',
      nextMilestone: workspace.nextMilestone ?? '',
      nextMilestoneDueAt: workspace.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
      notes: workspace.notes ?? '',
      metrics: toJsonString(workspace.metrics),
    });
    setMilestoneDraft(EMPTY_MILESTONE);
    setCollaboratorDraft(EMPTY_COLLABORATOR);
    setIntegrationDraft(EMPTY_INTEGRATION);
    setAssetDraft(EMPTY_ASSET);
    setRetroDraft(EMPTY_RETRO);
    setBaseFeedback(null);
    setWorkspaceFeedback(null);
    setPlanFeedback(null);
    setPeopleFeedback(null);
    setAppFeedback(null);
    setFileFeedback(null);
    setRetroFeedback(null);
  };

  const loadProject = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchProject(id);
      setProject(response.project);
    } catch (err) {
      setError(err.message || 'Unable to load project.');
    } finally {
      setLoading(false);
    }
  };

  const syncProject = async (payload) => {
    if (payload?.project) {
      setProject(payload.project);
      if (onUpdated) {
        await onUpdated(payload.project);
      }
    } else if (projectId) {
      await loadProject(projectId);
      if (onUpdated) {
        await onUpdated();
      }
    }
  };

  const handleBaseChange = (event) => {
    const { name, value } = event.target;
    setBaseForm((current) => ({ ...current, [name]: value }));
  };

  const handleWorkspaceChange = (event) => {
    const { name, value } = event.target;
    setWorkspaceForm((current) => ({ ...current, [name]: value }));
  };

  const handleMilestoneChange = (event) => {
    const { name, value } = event.target;
    setMilestoneDraft((current) => ({ ...current, [name]: value }));
  };

  const handleCollaboratorChange = (event) => {
    const { name, value } = event.target;
    setCollaboratorDraft((current) => ({ ...current, [name]: value }));
  };

  const handleIntegrationChange = (event) => {
    const { name, value } = event.target;
    setIntegrationDraft((current) => ({ ...current, [name]: value }));
  };

  const handleAssetChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAssetDraft((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRetroChange = (event) => {
    const { name, value } = event.target;
    setRetroDraft((current) => ({ ...current, [name]: value }));
  };

  const handleSaveBase = async (event) => {
    event.preventDefault();
    if (!project) return;
    const metadataParse = tryParseJson(baseForm.metadata);
    if (!metadataParse.ok) {
      setBaseFeedback({ type: 'error', message: 'Metadata must be valid JSON.' });
      return;
    }
    setBaseSaving(true);
    setBaseFeedback(null);
    try {
      const payload = {
        ownerId: baseForm.ownerId ? Number(baseForm.ownerId) : undefined,
        title: baseForm.title,
        description: baseForm.description,
        status: baseForm.status,
        budgetCurrency: baseForm.budgetCurrency || 'USD',
        budgetAllocated: baseForm.budgetAllocated === '' ? undefined : Number(baseForm.budgetAllocated),
        budgetSpent: baseForm.budgetSpent === '' ? undefined : Number(baseForm.budgetSpent),
        startDate: baseForm.startDate || undefined,
        dueDate: baseForm.dueDate || undefined,
        archivedAt: baseForm.archivedAt || undefined,
        metadata: metadataParse.value,
      };
      const result = await updateProject(project.id, payload);
      await syncProject(result);
      setBaseFeedback({ type: 'success', message: 'Project saved.' });
    } catch (err) {
      setBaseFeedback({ type: 'error', message: err.message || 'Unable to save project.' });
    } finally {
      setBaseSaving(false);
    }
  };

  const handleSaveWorkspace = async (event) => {
    event.preventDefault();
    if (!project) return;
    const metricsParse = tryParseJson(workspaceForm.metrics);
    if (!metricsParse.ok) {
      setWorkspaceFeedback({ type: 'error', message: 'Metrics must be valid JSON.' });
      return;
    }
    setWorkspaceSaving(true);
    setWorkspaceFeedback(null);
    try {
      const payload = {
        status: workspaceForm.status || undefined,
        riskLevel: workspaceForm.riskLevel || undefined,
        progressPercent: workspaceForm.progressPercent === '' ? undefined : Number(workspaceForm.progressPercent),
        nextMilestone: workspaceForm.nextMilestone || undefined,
        nextMilestoneDueAt: workspaceForm.nextMilestoneDueAt || undefined,
        notes: workspaceForm.notes || undefined,
        metrics: metricsParse.value,
      };
      const result = await updateProjectWorkspace(project.id, payload);
      await syncProject(result);
      setWorkspaceFeedback({ type: 'success', message: 'Workspace updated.' });
    } catch (err) {
      setWorkspaceFeedback({ type: 'error', message: err.message || 'Unable to save workspace.' });
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleSubmitMilestone = async (event) => {
    event.preventDefault();
    if (!project) return;
    setPlanSaving(true);
    setPlanFeedback(null);
    try {
      const payload = {
        title: milestoneDraft.title,
        status: milestoneDraft.status,
        dueDate: milestoneDraft.dueDate || undefined,
        description: milestoneDraft.description || undefined,
      };
      const result = milestoneDraft.id
        ? await updateMilestone(project.id, milestoneDraft.id, payload)
        : await createMilestone(project.id, payload);
      await syncProject(result);
      setMilestoneDraft(EMPTY_MILESTONE);
      setPlanFeedback({ type: 'success', message: 'Milestone saved.' });
    } catch (err) {
      setPlanFeedback({ type: 'error', message: err.message || 'Unable to save milestone.' });
    } finally {
      setPlanSaving(false);
    }
  };

  const handleEditMilestone = (milestone) => {
    setMilestoneDraft({
      id: milestone.id,
      title: milestone.title ?? '',
      status: milestone.status ?? 'planned',
      dueDate: milestone.dueDate ? milestone.dueDate.slice(0, 10) : '',
      description: milestone.description ?? '',
    });
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!project) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this milestone?')) {
      return;
    }
    setPlanSaving(true);
    setPlanFeedback(null);
    try {
      const result = await deleteMilestone(project.id, milestoneId);
      await syncProject(result);
      setPlanFeedback({ type: 'success', message: 'Milestone removed.' });
    } catch (err) {
      setPlanFeedback({ type: 'error', message: err.message || 'Unable to remove milestone.' });
    } finally {
      setPlanSaving(false);
    }
  };

  const handleSubmitCollaborator = async (event) => {
    event.preventDefault();
    if (!project) return;
    const permissionsParse = tryParseJson(collaboratorDraft.permissions);
    if (!permissionsParse.ok) {
      setPeopleFeedback({ type: 'error', message: 'Permissions must be valid JSON.' });
      return;
    }
    setPeopleSaving(true);
    setPeopleFeedback(null);
    try {
      const payload = {
        fullName: collaboratorDraft.fullName,
        email: collaboratorDraft.email || undefined,
        role: collaboratorDraft.role || undefined,
        status: collaboratorDraft.status,
        hourlyRate: collaboratorDraft.hourlyRate === '' ? undefined : Number(collaboratorDraft.hourlyRate),
        permissions: permissionsParse.value,
      };
      const result = collaboratorDraft.id
        ? await updateCollaborator(project.id, collaboratorDraft.id, payload)
        : await createCollaborator(project.id, payload);
      await syncProject(result);
      setCollaboratorDraft(EMPTY_COLLABORATOR);
      setPeopleFeedback({ type: 'success', message: 'Collaborator saved.' });
    } catch (err) {
      setPeopleFeedback({ type: 'error', message: err.message || 'Unable to save collaborator.' });
    } finally {
      setPeopleSaving(false);
    }
  };

  const handleEditCollaborator = (collaborator) => {
    setCollaboratorDraft({
      id: collaborator.id,
      fullName: collaborator.fullName ?? '',
      email: collaborator.email ?? '',
      role: collaborator.role ?? '',
      status: collaborator.status ?? 'invited',
      hourlyRate: collaborator.hourlyRate != null ? String(collaborator.hourlyRate) : '',
      permissions: toJsonString(collaborator.permissions) || '{}',
    });
  };

  const handleDeleteCollaborator = async (collaboratorId) => {
    if (!project) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this collaborator?')) {
      return;
    }
    setPeopleSaving(true);
    setPeopleFeedback(null);
    try {
      const result = await deleteCollaborator(project.id, collaboratorId);
      await syncProject(result);
      setPeopleFeedback({ type: 'success', message: 'Collaborator removed.' });
    } catch (err) {
      setPeopleFeedback({ type: 'error', message: err.message || 'Unable to remove collaborator.' });
    } finally {
      setPeopleSaving(false);
    }
  };

  const handleSubmitIntegration = async (event) => {
    event.preventDefault();
    if (!project) return;
    const metadataParse = tryParseJson(integrationDraft.metadata);
    if (!metadataParse.ok) {
      setAppFeedback({ type: 'error', message: 'Metadata must be valid JSON.' });
      return;
    }
    setAppSaving(true);
    setAppFeedback(null);
    try {
      const payload = {
        provider: integrationDraft.provider,
        status: integrationDraft.status,
        metadata: metadataParse.value,
      };
      const result = integrationDraft.id
        ? await updateIntegration(project.id, integrationDraft.id, payload)
        : await createIntegration(project.id, payload);
      await syncProject(result);
      setIntegrationDraft(EMPTY_INTEGRATION);
      setAppFeedback({ type: 'success', message: 'Integration saved.' });
    } catch (err) {
      setAppFeedback({ type: 'error', message: err.message || 'Unable to save integration.' });
    } finally {
      setAppSaving(false);
    }
  };

  const handleEditIntegration = (integration) => {
    setIntegrationDraft({
      id: integration.id,
      provider: integration.provider ?? '',
      status: integration.status ?? 'connected',
      metadata: toJsonString(integration.metadata) || '{}',
    });
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!project) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this integration?')) {
      return;
    }
    setAppSaving(true);
    setAppFeedback(null);
    try {
      const result = await deleteIntegration(project.id, integrationId);
      await syncProject(result);
      setAppFeedback({ type: 'success', message: 'Integration removed.' });
    } catch (err) {
      setAppFeedback({ type: 'error', message: err.message || 'Unable to remove integration.' });
    } finally {
      setAppSaving(false);
    }
  };

  const handleSubmitAsset = async (event) => {
    event.preventDefault();
    if (!project) return;
    const metadataParse = tryParseJson(assetDraft.metadata);
    if (!metadataParse.ok) {
      setFileFeedback({ type: 'error', message: 'Metadata must be valid JSON.' });
      return;
    }
    setFileSaving(true);
    setFileFeedback(null);
    try {
      const payload = {
        label: assetDraft.label,
        category: assetDraft.category,
        storageUrl: assetDraft.storageUrl,
        thumbnailUrl: assetDraft.thumbnailUrl || undefined,
        sizeBytes: assetDraft.sizeBytes === '' ? undefined : Number(assetDraft.sizeBytes),
        permissionLevel: assetDraft.permissionLevel,
        watermarkEnabled: Boolean(assetDraft.watermarkEnabled),
        metadata: metadataParse.value,
      };
      const result = await createAsset(project.id, payload);
      await syncProject(result);
      setAssetDraft(EMPTY_ASSET);
      setFileFeedback({ type: 'success', message: 'Asset added.' });
    } catch (err) {
      setFileFeedback({ type: 'error', message: err.message || 'Unable to add asset.' });
    } finally {
      setFileSaving(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!project) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this asset?')) {
      return;
    }
    setFileSaving(true);
    setFileFeedback(null);
    try {
      const result = await deleteAsset(project.id, assetId);
      await syncProject(result);
      setFileFeedback({ type: 'success', message: 'Asset removed.' });
    } catch (err) {
      setFileFeedback({ type: 'error', message: err.message || 'Unable to remove asset.' });
    } finally {
      setFileSaving(false);
    }
  };

  const handleSubmitRetro = async (event) => {
    event.preventDefault();
    if (!project) return;
    const highlightsParse = tryParseJson(retroDraft.highlights);
    if (!highlightsParse.ok) {
      setRetroFeedback({ type: 'error', message: 'Highlights must be valid JSON.' });
      return;
    }
    setRetroSaving(true);
    setRetroFeedback(null);
    try {
      const payload = {
        milestoneTitle: retroDraft.milestoneTitle || undefined,
        summary: retroDraft.summary,
        sentiment: retroDraft.sentiment || undefined,
        highlights: highlightsParse.value,
      };
      const result = await createRetrospective(project.id, payload);
      await syncProject(result);
      setRetroDraft(EMPTY_RETRO);
      setRetroFeedback({ type: 'success', message: 'Retrospective recorded.' });
    } catch (err) {
      setRetroFeedback({ type: 'error', message: err.message || 'Unable to record retrospective.' });
    } finally {
      setRetroSaving(false);
    }
  };

  const renderFeedback = (feedback) => {
    if (!feedback) return null;
    return (
      <div
        className={classNames(
          'rounded-xl border px-3 py-2 text-sm',
          feedback.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700',
        )}
      >
        {feedback.message}
      </div>
    );
  };

  const renderEmptyState = (label) => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
      No {label} yet.
    </div>
  );
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="h-full w-full max-w-6xl bg-white shadow-2xl">
                <div className="flex h-full flex-col">
                  <header className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">
                        {project?.title ?? 'Project workspace'}
                      </Dialog.Title>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <span>{project?.status?.replace(/_/g, ' ') ?? 'Status unknown'}</span>
                        <span>•</span>
                        <span>Due {project?.dueDate ? formatDate(project.dueDate) : '—'}</span>
                        <span>•</span>
                        <span>{project?.owner?.name ?? project?.owner?.fullName ?? `Owner ${project?.ownerId ?? ''}`}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </header>

                  {loading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading…</div>
                  ) : error ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-rose-600">{error}</div>
                  ) : !project ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a project to view details.</div>
                  ) : (
                    <Tab.Group selectedIndex={tabIndex} onChange={(index) => setActiveTab(TABS[index].id)}>
                      <div className="border-b border-slate-200 bg-slate-50/80">
                        <Tab.List className="flex flex-wrap gap-2 px-6 py-4">
                          {TABS.map((tab) => (
                            <Tab
                              key={tab.id}
                              className={({ selected }) =>
                                classNames(
                                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                                  selected
                                    ? 'bg-accent text-white shadow-soft'
                                    : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
                                )
                              }
                            >
                              {tab.label}
                            </Tab>
                          ))}
                        </Tab.List>
                      </div>
                      <Tab.Panels className="flex-1 overflow-y-auto px-8 py-6">
                        <Tab.Panel className="space-y-8">
                          <div className="grid gap-6 lg:grid-cols-2">
                            <form onSubmit={handleSaveBase} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h3>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
                                <select
                                  name="ownerId"
                                  value={baseForm.ownerId}
                                  onChange={handleBaseChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                >
                                  <option value="">Select owner</option>
                                  {ownerOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                                <input
                                  name="title"
                                  value={baseForm.title}
                                  onChange={handleBaseChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                                <select
                                  name="status"
                                  value={baseForm.status}
                                  onChange={handleBaseChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                                <textarea
                                  name="description"
                                  value={baseForm.description}
                                  onChange={handleBaseChange}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                                  <input
                                    name="budgetCurrency"
                                    value={baseForm.budgetCurrency}
                                    onChange={handleBaseChange}
                                    maxLength={3}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allocated</span>
                                  <input
                                    name="budgetAllocated"
                                    value={baseForm.budgetAllocated}
                                    onChange={handleBaseChange}
                                    type="number"
                                    min="0"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</span>
                                  <input
                                    name="budgetSpent"
                                    value={baseForm.budgetSpent}
                                    onChange={handleBaseChange}
                                    type="number"
                                    min="0"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archive date</span>
                                  <input
                                    name="archivedAt"
                                    value={baseForm.archivedAt}
                                    onChange={handleBaseChange}
                                    type="date"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kickoff</span>
                                  <input
                                    name="startDate"
                                    value={baseForm.startDate}
                                    onChange={handleBaseChange}
                                    type="date"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due</span>
                                  <input
                                    name="dueDate"
                                    value={baseForm.dueDate}
                                    onChange={handleBaseChange}
                                    type="date"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  />
                                </label>
                              </div>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata (JSON)</span>
                                <textarea
                                  name="metadata"
                                  value={baseForm.metadata}
                                  onChange={handleBaseChange}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              {renderFeedback(baseFeedback)}
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                  disabled={baseSaving}
                                >
                                  {baseSaving ? 'Saving…' : 'Save details'}
                                </button>
                              </div>
                            </form>

                            <form onSubmit={handleSaveWorkspace} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Workspace</h3>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                                  <select
                                    name="status"
                                    value={workspaceForm.status}
                                    onChange={handleWorkspaceChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  >
                                    <option value="">Unset</option>
                                    {STATUS_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block space-y-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</span>
                                  <select
                                    name="riskLevel"
                                    value={workspaceForm.riskLevel}
                                    onChange={handleWorkspaceChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                  >
                                    {RISK_OPTIONS.map((option) => (
                                      <option key={option.value || 'none'} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress %</span>
                                <input
                                  name="progressPercent"
                                  value={workspaceForm.progressPercent}
                                  onChange={handleWorkspaceChange}
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next milestone</span>
                                <input
                                  name="nextMilestone"
                                  value={workspaceForm.nextMilestone}
                                  onChange={handleWorkspaceChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next milestone due</span>
                                <input
                                  name="nextMilestoneDueAt"
                                  value={workspaceForm.nextMilestoneDueAt}
                                  onChange={handleWorkspaceChange}
                                  type="date"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                                <textarea
                                  name="notes"
                                  value={workspaceForm.notes}
                                  onChange={handleWorkspaceChange}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metrics (JSON)</span>
                                <textarea
                                  name="metrics"
                                  value={workspaceForm.metrics}
                                  onChange={handleWorkspaceChange}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              {renderFeedback(workspaceFeedback)}
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                  disabled={workspaceSaving}
                                >
                                  {workspaceSaving ? 'Saving…' : 'Save workspace'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="space-y-4">
                            {(project.milestones ?? []).length ? (
                              <div className="grid gap-4">
                                {project.milestones.map((milestone) => (
                                  <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{milestone.title}</p>
                                        <p className="text-xs text-slate-500">
                                          {milestone.status?.replace(/_/g, ' ')} · Due {formatDate(milestone.dueDate)}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditMilestone(milestone)}
                                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMilestone(milestone.id)}
                                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    {milestone.description ? (
                                      <p className="mt-3 text-sm text-slate-600">{milestone.description}</p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState('milestones')
                            )}
                          </div>

                          <form onSubmit={handleSubmitMilestone} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {milestoneDraft.id ? 'Edit milestone' : 'Add milestone'}
                              </h3>
                              {milestoneDraft.id ? (
                                <button
                                  type="button"
                                  onClick={() => setMilestoneDraft(EMPTY_MILESTONE)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                >
                                  Reset
                                </button>
                              ) : null}
                            </div>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                              <input
                                name="title"
                                value={milestoneDraft.title}
                                onChange={handleMilestoneChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                                <select
                                  name="status"
                                  value={milestoneDraft.status}
                                  onChange={handleMilestoneChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                >
                                  <option value="planned">Planned</option>
                                  <option value="in_progress">In progress</option>
                                  <option value="waiting_on_client">Waiting on client</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</span>
                                <input
                                  name="dueDate"
                                  value={milestoneDraft.dueDate}
                                  onChange={handleMilestoneChange}
                                  type="date"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                            </div>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                              <textarea
                                name="description"
                                value={milestoneDraft.description}
                                onChange={handleMilestoneChange}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            {renderFeedback(planFeedback)}
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                disabled={planSaving}
                              >
                                {planSaving ? 'Saving…' : 'Save milestone'}
                              </button>
                            </div>
                          </form>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="space-y-4">
                            {(project.collaborators ?? []).length ? (
                              <div className="grid gap-4">
                                {project.collaborators.map((collaborator) => (
                                  <div key={collaborator.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{collaborator.fullName}</p>
                                        <p className="text-xs text-slate-500">
                                          {collaborator.role || 'Contributor'} · {collaborator.status?.replace(/_/g, ' ')}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditCollaborator(collaborator)}
                                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCollaborator(collaborator.id)}
                                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    {collaborator.email ? (
                                      <p className="mt-2 text-sm text-slate-600">{collaborator.email}</p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState('collaborators')
                            )}
                          </div>

                          <form onSubmit={handleSubmitCollaborator} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {collaboratorDraft.id ? 'Edit collaborator' : 'Add collaborator'}
                              </h3>
                              {collaboratorDraft.id ? (
                                <button
                                  type="button"
                                  onClick={() => setCollaboratorDraft(EMPTY_COLLABORATOR)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                >
                                  Reset
                                </button>
                              ) : null}
                            </div>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                              <input
                                name="fullName"
                                value={collaboratorDraft.fullName}
                                onChange={handleCollaboratorChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                              <input
                                name="email"
                                value={collaboratorDraft.email}
                                onChange={handleCollaboratorChange}
                                type="email"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                                <input
                                  name="role"
                                  value={collaboratorDraft.role}
                                  onChange={handleCollaboratorChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                                <select
                                  name="status"
                                  value={collaboratorDraft.status}
                                  onChange={handleCollaboratorChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                >
                                  {COLLABORATOR_STATUSES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hourly rate</span>
                              <input
                                name="hourlyRate"
                                value={collaboratorDraft.hourlyRate}
                                onChange={handleCollaboratorChange}
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions (JSON)</span>
                              <textarea
                                name="permissions"
                                value={collaboratorDraft.permissions}
                                onChange={handleCollaboratorChange}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            {renderFeedback(peopleFeedback)}
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                disabled={peopleSaving}
                              >
                                {peopleSaving ? 'Saving…' : 'Save collaborator'}
                              </button>
                            </div>
                          </form>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="space-y-4">
                            {(project.assets ?? []).length ? (
                              <div className="grid gap-4">
                                {project.assets.map((asset) => (
                                  <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{asset.label}</p>
                                        <p className="text-xs text-slate-500">
                                          {asset.category} · {asset.permissionLevel}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <a
                                          href={asset.storageUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                        >
                                          Open
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteAsset(asset.id)}
                                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState('files')
                            )}
                          </div>

                          <form onSubmit={handleSubmitAsset} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add file</h3>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</span>
                              <input
                                name="label"
                                value={assetDraft.label}
                                onChange={handleAssetChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link</span>
                              <input
                                name="storageUrl"
                                value={assetDraft.storageUrl}
                                onChange={handleAssetChange}
                                type="url"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
                                <input
                                  name="category"
                                  value={assetDraft.category}
                                  onChange={handleAssetChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permission</span>
                                <select
                                  name="permissionLevel"
                                  value={assetDraft.permissionLevel}
                                  onChange={handleAssetChange}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                >
                                  <option value="internal">Internal</option>
                                  <option value="shared">Shared</option>
                                  <option value="public">Public</option>
                                </select>
                              </label>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thumbnail</span>
                                <input
                                  name="thumbnailUrl"
                                  value={assetDraft.thumbnailUrl}
                                  onChange={handleAssetChange}
                                  type="url"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size (bytes)</span>
                                <input
                                  name="sizeBytes"
                                  value={assetDraft.sizeBytes}
                                  onChange={handleAssetChange}
                                  type="number"
                                  min="0"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                                />
                              </label>
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <input
                                name="watermarkEnabled"
                                type="checkbox"
                                checked={Boolean(assetDraft.watermarkEnabled)}
                                onChange={handleAssetChange}
                                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              Watermark
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata (JSON)</span>
                              <textarea
                                name="metadata"
                                value={assetDraft.metadata}
                                onChange={handleAssetChange}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            {renderFeedback(fileFeedback)}
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                disabled={fileSaving}
                              >
                                {fileSaving ? 'Saving…' : 'Add file'}
                              </button>
                            </div>
                          </form>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="space-y-4">
                            {(project.integrations ?? []).length ? (
                              <div className="grid gap-4">
                                {project.integrations.map((integration) => (
                                  <div key={integration.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{integration.provider}</p>
                                        <p className="text-xs text-slate-500">{integration.status?.replace(/_/g, ' ')}</p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditIntegration(integration)}
                                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteIntegration(integration.id)}
                                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState('integrations')
                            )}
                          </div>

                          <form onSubmit={handleSubmitIntegration} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {integrationDraft.id ? 'Edit integration' : 'Add integration'}
                              </h3>
                              {integrationDraft.id ? (
                                <button
                                  type="button"
                                  onClick={() => setIntegrationDraft(EMPTY_INTEGRATION)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                >
                                  Reset
                                </button>
                              ) : null}
                            </div>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</span>
                              <input
                                name="provider"
                                value={integrationDraft.provider}
                                onChange={handleIntegrationChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                              <select
                                name="status"
                                value={integrationDraft.status}
                                onChange={handleIntegrationChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              >
                                {INTEGRATION_STATUSES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata (JSON)</span>
                              <textarea
                                name="metadata"
                                value={integrationDraft.metadata}
                                onChange={handleIntegrationChange}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            {renderFeedback(appFeedback)}
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                disabled={appSaving}
                              >
                                {appSaving ? 'Saving…' : 'Save integration'}
                              </button>
                            </div>
                          </form>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="space-y-4">
                            {(project.retrospectives ?? []).length ? (
                              <div className="grid gap-4">
                                {project.retrospectives.map((retro) => (
                                  <div key={retro.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-900">{retro.milestoneTitle}</p>
                                    <p className="mt-2 text-sm text-slate-600">{retro.summary}</p>
                                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                                      {retro.sentiment || 'Neutral'} · {formatDate(retro.generatedAt)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState('retrospectives')
                            )}
                          </div>

                          <form onSubmit={handleSubmitRetro} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add retrospective</h3>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestone</span>
                              <input
                                name="milestoneTitle"
                                value={retroDraft.milestoneTitle}
                                onChange={handleRetroChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</span>
                              <textarea
                                name="summary"
                                value={retroDraft.summary}
                                onChange={handleRetroChange}
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sentiment</span>
                              <input
                                name="sentiment"
                                value={retroDraft.sentiment}
                                onChange={handleRetroChange}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights (JSON)</span>
                              <textarea
                                name="highlights"
                                value={retroDraft.highlights}
                                onChange={handleRetroChange}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-accent focus:outline-none"
                              />
                            </label>
                            {renderFeedback(retroFeedback)}
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                                disabled={retroSaving}
                              >
                                {retroSaving ? 'Saving…' : 'Save retrospective'}
                              </button>
                            </div>
                          </form>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ProjectWorkspaceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  owners: PropTypes.arrayOf(PropTypes.object),
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
};

ProjectWorkspaceDrawer.defaultProps = {
  projectId: null,
  owners: [],
  onUpdated: () => {},
};
