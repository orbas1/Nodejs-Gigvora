import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import ProjectWorkspaceDrawer from './ProjectWorkspaceDrawer.jsx';
import GigOrderDrawer from './GigOrderDrawer.jsx';
import WorkspaceDetailDrawer from './WorkspaceDetailDrawer.jsx';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';
import useSession from '../../hooks/useSession.js';
import GigOperationsWorkspace from './GigOperationsWorkspace.jsx';
import ProjectWizard from './ProjectWizard.jsx';
import GigOrderComposer from './GigOrderComposer.jsx';
import TimelineComposer from './TimelineComposer.jsx';
import SubmissionComposer from './SubmissionComposer.jsx';
import ChatComposer from './ChatComposer.jsx';
import GigOrderDetailDrawer from './GigOrderDetailDrawer.jsx';

const PROJECT_ACCESS_ROLES = ['Agency lead', 'Operations lead', 'Company operator', 'Workspace admin', 'Platform admin'];

const NAV_TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'bids', label: 'Bids' },
  { id: 'invites', label: 'Invites' },
  { id: 'match', label: 'Match' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'escrow', label: 'Escrow' },
];

const INITIAL_PROJECT_FORM = {
  title: '',
  description: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  dueDate: '',
};

const INITIAL_GIG_FORM = {
  vendorName: '',
  serviceName: '',
  amount: '',
  currency: 'USD',
  dueAt: '',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function validateProjectForm(values) {
  const errors = {};
  if (!values.title?.trim()) {
    errors.title = 'Add a name.';
    errors.title = 'Add a project name.';
  } else if (values.title.trim().length < 3) {
    errors.title = 'Use at least three characters.';
  }
  if (!values.description?.trim()) {
    errors.description = 'Add a summary.';
    errors.description = 'Add a short project outline.';
  }
  if (values.budgetAllocated !== '') {
    const amount = parseNumber(values.budgetAllocated);
    if (amount == null) {
      errors.budgetAllocated = 'Use a number.';
    } else if (amount < 0) {
      errors.budgetAllocated = 'Must be positive.';
      errors.budgetAllocated = 'Enter a number.';
    } else if (amount < 0) {
      errors.budgetAllocated = 'Budget cannot be negative.';
    }
  }
  if (values.dueDate) {
    const due = new Date(values.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = 'Pick a date.';
    } else if (due < startOfToday()) {
      errors.dueDate = 'Date has passed.';
      errors.dueDate = 'Choose a valid date.';
    } else if (due < startOfToday()) {
      errors.dueDate = 'Use a future date.';
    }
  }
  return errors;
}

function validateGigForm(values) {
  const errors = {};
  if (!values.vendorName?.trim()) {
    errors.vendorName = 'Add a vendor.';
  }
  if (!values.serviceName?.trim()) {
    errors.serviceName = 'Add a service.';
    errors.vendorName = 'Add the vendor name.';
  }
  if (!values.serviceName?.trim()) {
    errors.serviceName = 'Add the service.';
  }
  if (values.amount !== '') {
    const amount = parseNumber(values.amount);
    if (amount == null) {
      errors.amount = 'Use a number.';
      errors.amount = 'Enter a number.';
    } else if (amount < 0) {
      errors.amount = 'Must be positive.';
    }
  }
  if (values.dueAt) {
    const due = new Date(values.dueAt);
    if (Number.isNaN(due.getTime())) {
      errors.dueAt = 'Pick a date.';
    } else if (due < startOfToday()) {
      errors.dueAt = 'Date has passed.';
      errors.dueAt = 'Choose a valid date.';
    } else if (due < startOfToday()) {
      errors.dueAt = 'Use a future date.';
    }
  }
  return errors;
}
const EMPTY_COMPOSER = { form: null, context: null };

function Modal({ title, onClose, children, footer, width = 'max-w-2xl' }) {
  if (!children) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
  width: PropTypes.string,
};

Modal.defaultProps = {
  children: null,
  footer: null,
  width: 'max-w-2xl',
};

function ProjectPreview({ project, onClose }) {
  if (!project) {
    return null;
  }

  const budget = project.budget ?? {};
  const workspace = project.workspace ?? {};
  const collaborators = project.collaborators ?? [];
  const milestones = project.milestones ?? [];

  return (
    <Modal title={project.project?.title ?? project.title ?? 'Project'} onClose={onClose} width="max-w-3xl">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {(workspace.status ?? project.status ?? 'planning').replace(/_/g, ' ')}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {Number(workspace.progressPercent ?? 0).toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Allocated</p>
              <p className="text-sm font-semibold text-slate-900">
                {budget.allocated != null ? `${budget.currency ?? 'USD'} ${Number(budget.allocated).toLocaleString()}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Spent</p>
              <p className="text-sm font-semibold text-slate-900">
                {budget.spent != null ? `${budget.currency ?? 'USD'} ${Number(budget.spent).toLocaleString()}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Burn</p>
              <p className="text-sm font-semibold text-slate-900">
                {budget.burnRatePercent != null ? `${Number(budget.burnRatePercent).toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
        {milestones.length ? (
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {milestones.slice(0, 6).map((milestone) => (
                <li key={milestone.id} className="flex items-center justify-between">
                  <span>{milestone.title}</span>
                  <span className="text-xs text-slate-500">{milestone.status?.replace(/_/g, ' ') ?? 'planned'}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {collaborators.length ? (
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team</p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {collaborators.slice(0, 8).map((person) => (
                <li key={person.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-900">{person.fullName}</p>
                  <p className="text-xs text-slate-500">{person.role}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

ProjectPreview.propTypes = {
  project: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

ProjectPreview.defaultProps = {
  project: null,
};

function resolveProjectId(project) {
  if (!project) {
    return null;
  }
  return project.project?.id ?? project.projectId ?? project.id ?? null;
}

export default function ProjectGigManagementContainer({ userId, resource }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();
  const { session } = useSession();

  if (!canManageProjects) {
    return (
      <section
        id="projects-access"
        className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-8 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Access blocked
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Project permission needed</h2>
          <p className="text-sm text-slate-600">
            {denialReason ?? 'Switch to an approved company or operations role to manage projects.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_ACCESS_ROLES.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700"
              >
                {role}
              </span>
            ))}
          </div>
          <a
            href="mailto:operations@gigvora.com?subject=Project%20workspace%20access"
            className="inline-flex w-max items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Email operations@gigvora.com
          </a>
        </div>
        id="project-workspace"
        className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-amber-900">Workspace access required</h2>
        <p className="mt-2 text-sm text-amber-800">
          Project controls are available to approved workspace roles only.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-amber-700">
          Allowed roles: {PROJECT_MANAGEMENT_ROLE_LABELS.join(', ')}
        </p>
        <p className="mt-3 text-sm text-amber-800">{denialReason}</p>
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Access needed</h2>
        <p className="mt-3 text-sm text-slate-600">{denialReason ?? 'Switch to a workspace role with project rights.'}</p>
      </section>
    );
  }

  const fallbackResource = useProjectGigManagement(userId, { enabled: !resource });
  const { data, loading, error, actions, reload } = resource ?? fallbackResource;
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [gigDrawerOpen, setGigDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [gigForm, setGigForm] = useState(INITIAL_GIG_FORM);
  const [projectErrors, setProjectErrors] = useState({});
  const [gigErrors, setGigErrors] = useState({});
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [gigSubmitting, setGigSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [projectErrors, setProjectErrors] = useState({});
  const [projectFeedback, setProjectFeedback] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(false);

  const [gigForm, setGigForm] = useState(INITIAL_GIG_FORM);
  const [gigErrors, setGigErrors] = useState({});
  const [gigFeedback, setGigFeedback] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const access = data?.access ?? { canManage: false };
  const canManage = access.canManage !== false;
  const viewOnlyNote = !canManage
  const [submittingGig, setSubmittingGig] = useState(false);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [gigDialogOpen, setGigDialogOpen] = useState(false);
  const [previewProjectId, setPreviewProjectId] = useState(null);

  useEffect(() => {
    if (!projectDialogOpen) {
      setProjectForm(INITIAL_PROJECT_FORM);
      setProjectErrors({});
    }
  }, [projectDialogOpen]);

  useEffect(() => {
    if (!gigDialogOpen) {
      setGigForm(INITIAL_GIG_FORM);
      setGigErrors({});
    }
  }, [gigDialogOpen]);

  const access = data?.access ?? { canManage: false };
  const canManage = access.canManage !== false;
  const accessReason = !canManage ? access.reason : null;
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const fromCache = data?.meta?.fromCache ?? false;

  const projects = data?.projectCreation?.projects ?? [];

  const projectLookup = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      map.set(project.id, project);
    });
    return map;
  }, [projects]);

  const selectedProject = previewProjectId ? projectLookup.get(previewProjectId) ?? null : null;
  const [activeView, setActiveView] = useState('manage');
  const [composer, setComposer] = useState(EMPTY_COMPOSER);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const orders = useMemo(() => (Array.isArray(data?.purchasedGigs?.orders) ? data.purchasedGigs.orders : []), [data]);
  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.orderNumber ?? `Order ${order.id}`} · ${order.serviceName}`,
      })),
    [orders],
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const accessReason = hasSnapshot && !canManage
    ? access.reason ??
      (access.actorRole
        ? `View only for ${access.actorRole.replace(/_/g, ' ')}`
        : 'Current role is read only.')
    : null;
  const allowedRoles = useMemo(
    () => access.allowedRoles?.filter(Boolean).map((role) => role.replace(/_/g, ' ')) ?? [],
    [access.allowedRoles],
  );

  const meta = data?.meta ?? {};
  const defaultAuthorName = useMemo(() => {
    if (!session) {
      return null;
    }
    if (session.name) {
      return session.name;
    }
    const user = session.user ?? {};
    if (user.name) {
      return user.name;
    }
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length) {
      return parts.join(' ');
    }
    return session.email ?? session.user?.email ?? null;
  }, [session]);

  const inputClassName = (hasError) =>
    `rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
      hasError ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-slate-200'
    }`;

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const openComposer = (form, context = null) => {
    setComposer({ form, context });
  };

  const submitProject = async (event) => {
    event.preventDefault();
    const validation = validateProjectForm(projectForm);
    setProjectErrors(validation);
    if (Object.keys(validation).length > 0) {
      setProjectFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setProjectSubmitting(true);
      setProjectFeedback({ tone: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setSubmittingProject(true);
    setProjectFeedback(null);
    try {
      await actions.createProject({
        title: projectForm.title,
        description: projectForm.description,
        budgetCurrency: projectForm.budgetCurrency,
        budgetAllocated: parseNumber(projectForm.budgetAllocated) ?? 0,
        dueDate: projectForm.dueDate || undefined,
        workspace: { status: 'planning', progressPercent: 10 },
      });
      setProjectForm(INITIAL_PROJECT_FORM);
      setProjectErrors({});
      setProjectFeedback({ status: 'success', message: 'Project created.' });
      setProjectDrawerOpen(false);
    } catch (submitError) {
      setProjectFeedback({ status: 'error', message: submitError?.message ?? 'Unable to create project.' });
    } finally {
      setProjectSubmitting(false);
        workspace: { status: 'planning', progressPercent: 5 },
      });
      setProjectForm(INITIAL_PROJECT_FORM);
      setProjectErrors({});
      setProjectFeedback({ tone: 'success', message: 'Project created.' });
      setProjectDialogOpen(false);
      setActiveTab('projects');
    } catch (submitError) {
      setProjectFeedback({ tone: 'error', message: submitError?.message ?? 'Unable to create the project.' });
    } finally {
      setSubmittingProject(false);
    }
  };

  const submitGig = async (event) => {
    event.preventDefault();
    const validation = validateGigForm(gigForm);
    setGigErrors(validation);
    if (Object.keys(validation).length > 0) {
      setGigFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      setGigFeedback({ tone: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setSubmittingGig(true);
    setGigFeedback(null);
    try {
      await actions.createGigOrder({
        vendorName: gigForm.vendorName,
        serviceName: gigForm.serviceName,
        amount: parseNumber(gigForm.amount) ?? 0,
        currency: gigForm.currency,
        dueAt: gigForm.dueAt || undefined,
      });
      setGigForm(INITIAL_GIG_FORM);
      setGigErrors({});
      setGigFeedback({ status: 'success', message: 'Gig logged.' });
      setGigDrawerOpen(false);
    } catch (submitError) {
      setGigFeedback({ status: 'error', message: submitError?.message ?? 'Unable to save gig.' });
        requirements: [{ title: 'Kickoff', status: 'pending' }],
      });
      setGigForm(INITIAL_GIG_FORM);
      setGigErrors({});
      setGigFeedback({ tone: 'success', message: 'Gig recorded.' });
      setGigDialogOpen(false);
    } catch (submitError) {
      setGigFeedback({ tone: 'error', message: submitError?.message ?? 'Unable to save the gig.' });
    } finally {
      setSubmittingGig(false);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setDetailError(null);
  };

  const handleCloseDetail = () => {
    if (detailSaving) {
      return;
    }
    setSelectedProject(null);
    setDetailError(null);
  };

  const handleSaveWorkspace = async (values) => {
    if (!selectedProject) {
      throw new Error('Project reference missing.');
    }
    const projectId = resolveProjectId(selectedProject);
    if (!projectId) {
      throw new Error('Project reference missing.');
    }
    setDetailSaving(true);
    setDetailError(null);
    try {
      await actions.updateWorkspace(projectId, values);
    } catch (err) {
      const message = err?.message ?? 'Unable to update workspace.';
      setDetailError(message);
      throw err;
    } finally {
      setDetailSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={meta.lastUpdated}
          fromCache={meta.fromCache}
          onRefresh={reload}
          statusLabel="Projects"
        />
        <ProjectGigManagementSection
          data={data}
          loading={loading}
          canManage={canManage}
          viewOnlyNote={viewOnlyNote}
          allowedRoles={allowedRoles}
          onOpenCreate={() => setProjectDrawerOpen(true)}
          onOpenGig={() => setGigDrawerOpen(true)}
          onSelectProject={handleSelectProject}
        />
      </div>
      <ProjectWorkspaceDrawer
        open={projectDrawerOpen}
        onClose={() => {
          if (!projectSubmitting) {
            setProjectDrawerOpen(false);
            setProjectFeedback(null);
            setProjectErrors({});
          }
        }}
        values={projectForm}
        errors={projectErrors}
        onChange={handleProjectChange}
        onSubmit={handleProjectSubmit}
        loading={projectSubmitting}
        feedback={projectFeedback}
        canManage={canManage}
      />
      <GigOrderDrawer
        open={gigDrawerOpen}
        onClose={() => {
          if (!gigSubmitting) {
            setGigDrawerOpen(false);
            setGigFeedback(null);
            setGigErrors({});
          }
        }}
        values={gigForm}
        errors={gigErrors}
        onChange={handleGigChange}
        onSubmit={handleGigSubmit}
        loading={gigSubmitting}
        feedback={gigFeedback}
        canManage={canManage}
      />
      <WorkspaceDetailDrawer
        open={Boolean(selectedProject)}
        onClose={handleCloseDetail}
        project={selectedProject}
        onSave={handleSaveWorkspace}
        saving={detailSaving}
        error={detailError}
        canManage={canManage}
      />
    </>
  const projectFormContent = projectDialogOpen ? (
    <form className="grid gap-4" onSubmit={submitProject} noValidate>
      {projectFeedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            projectFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {projectFeedback.message}
        </div>
      ) : null}
      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {accessReason ?? 'Project creation is limited.'}
        </div>
      ) : null}
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Name
        <input
          name="title"
          value={projectForm.title}
          onChange={handleProjectChange}
          className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            projectErrors.title ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          placeholder="Launch"
          required
          disabled={!canManage || submittingProject}
        />
        {projectErrors.title ? <span className="text-xs text-rose-600">{projectErrors.title}</span> : null}
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea
          name="description"
          value={projectForm.description}
          onChange={handleProjectChange}
          className={`min-h-[120px] rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            projectErrors.description ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          placeholder="Outline goals"
          required
          disabled={!canManage || submittingProject}
        />
        {projectErrors.description ? <span className="text-xs text-rose-600">{projectErrors.description}</span> : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Budget
          <input
            name="budgetAllocated"
            value={projectForm.budgetAllocated}
            onChange={handleProjectChange}
            className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
              projectErrors.budgetAllocated ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
            }`}
            placeholder="25000"
            type="number"
            min="0"
            disabled={!canManage || submittingProject}
          />
          {projectErrors.budgetAllocated ? (
            <span className="text-xs text-rose-600">{projectErrors.budgetAllocated}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Currency
          <select
            name="budgetCurrency"
            value={projectForm.budgetCurrency}
            onChange={handleProjectChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            disabled={!canManage || submittingProject}
          >
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Due date
        <input
          type="date"
          name="dueDate"
          value={projectForm.dueDate}
          onChange={handleProjectChange}
          className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            projectErrors.dueDate ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          min={new Date().toISOString().split('T')[0]}
          disabled={!canManage || submittingProject}
        />
        {projectErrors.dueDate ? <span className="text-xs text-rose-600">{projectErrors.dueDate}</span> : null}
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/60"
        disabled={submittingProject || !canManage}
      >
        {submittingProject ? 'Saving…' : 'Create project'}
      </button>
    </form>
  ) : null;

  const gigFormContent = gigDialogOpen ? (
    <form className="grid gap-4" onSubmit={submitGig} noValidate>
      {gigFeedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            gigFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {gigFeedback.message}
        </div>
      ) : null}
      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {accessReason ?? 'Gig tracking is limited.'}
        </div>
      ) : null}
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Vendor
        <input
          name="vendorName"
          value={gigForm.vendorName}
          onChange={handleGigChange}
          className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            gigErrors.vendorName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          placeholder="Studio"
          required
          disabled={!canManage || submittingGig}
        />
        {gigErrors.vendorName ? <span className="text-xs text-rose-600">{gigErrors.vendorName}</span> : null}
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Service
        <input
          name="serviceName"
          value={gigForm.serviceName}
          onChange={handleGigChange}
          className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            gigErrors.serviceName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          placeholder="Design"
          required
          disabled={!canManage || submittingGig}
        />
        {gigErrors.serviceName ? <span className="text-xs text-rose-600">{gigErrors.serviceName}</span> : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Amount
          <input
            name="amount"
            value={gigForm.amount}
            onChange={handleGigChange}
            className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
              gigErrors.amount ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
            }`}
            placeholder="4800"
            type="number"
            min="0"
            disabled={!canManage || submittingGig}
          />
          {gigErrors.amount ? <span className="text-xs text-rose-600">{gigErrors.amount}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Currency
          <select
            name="currency"
            value={gigForm.currency}
            onChange={handleGigChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            disabled={!canManage || submittingGig}
          >
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Delivery date
        <input
          type="date"
          name="dueAt"
          value={gigForm.dueAt}
          onChange={handleGigChange}
          className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            gigErrors.dueAt ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
          }`}
          min={new Date().toISOString().split('T')[0]}
          disabled={!canManage || submittingGig}
        />
        {gigErrors.dueAt ? <span className="text-xs text-rose-600">{gigErrors.dueAt}</span> : null}
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
        disabled={submittingGig || !canManage}
      >
        {submittingGig ? 'Saving…' : 'Add gig'}
      </button>
    </form>
  ) : null;

  return (
    <section id="project-workspace" className="flex min-h-[70vh] flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Workspace</p>
            <h1 className="text-2xl font-semibold text-slate-900">Project control</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setProjectDialogOpen(true); setProjectFeedback(null); }}
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={!canManage}
            >
              New project
            </button>
            <button
              type="button"
              onClick={() => { setGigDialogOpen(true); setGigFeedback(null); }}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={!canManage}
            >
              New gig
            </button>
          </div>
        </div>
        <DataStatus loading={loading} error={error} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={reload} />
      </header>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <nav className="lg:w-48">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition lg:text-left ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1">
          {loading && !data ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-48 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <div className="h-full animate-pulse space-y-4">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-24 rounded-xl bg-slate-100" />
                </div>
              </div>
              <div className="h-48 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <div className="h-full animate-pulse space-y-4">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-24 rounded-xl bg-slate-100" />
                </div>
              </div>
  const closeComposer = () => {
    setComposer(EMPTY_COMPOSER);
  };

  const handleOrderDetail = (orderId) => {
    setSelectedOrderId(orderId ?? null);
  };

  return (
    <section className="flex h-full flex-col gap-6">
      <DataStatus
        loading={loading}
        error={error}
        retry={reload}
        className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm"
      >
        {data ? (
          <ProjectGigManagementSection
            data={data}
            activeView={activeView}
            onViewChange={setActiveView}
            onOpenProject={() => openComposer('project')}
            onOpenOrder={() => openComposer('order')}
            onOpenOrderDetail={(orderId) => handleOrderDetail(orderId)}
            onCreateTimeline={(orderId) => openComposer('timeline', { orderId })}
            onEditTimeline={(orderId, event) => openComposer('timeline', { orderId, event })}
            onLogSubmission={(orderId) => openComposer('submission', { orderId })}
            onEditSubmission={(orderId, submission) => openComposer('submission', { orderId, submission })}
            onStartChat={(orderId) => openComposer('chat', { orderId })}
            onEditOrder={(order) => openComposer('order', { order })}
          />
        ) : null}
      </DataStatus>

      <ProjectWizard
        open={composer.form === 'project'}
        templates={data?.projectCreation?.templates ?? []}
        onClose={closeComposer}
        onSubmit={(payload) => actions.createProject(payload)}
      />

      {loading && !data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          ) : null}

          {data ? (
            <ProjectGigManagementSection
              data={data}
              actions={actions}
              activeTab={activeTab}
              canManage={canManage}
              onProjectPreview={(projectId) => setPreviewProjectId(projectId)}
            />
          ) : null}

          {error && !data ? (
            <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
              Unable to load workspace. Try again shortly.
            </div>
          ) : null}
        </div>
      </div>

      {projectDialogOpen ? (
        <Modal title="Create project" onClose={() => setProjectDialogOpen(false)}>{projectFormContent}</Modal>
      ) : null}
      {gigDialogOpen ? (
        <Modal title="Add gig" onClose={() => setGigDialogOpen(false)}>{gigFormContent}</Modal>
      ) : null}
      {selectedProject ? (
        <ProjectPreview project={selectedProject} onClose={() => setPreviewProjectId(null)} />
      ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {renderProjectForm()}
            {renderGigForm()}
          </div>
          {data ? (
            <>
              <ProjectGigManagementSection data={data} />
              <GigOperationsWorkspace
                data={data}
                canManage={canManage}
                onCreateOrder={actions.createGigOrder}
                onUpdateOrder={actions.updateGigOrder}
                onAddTimelineEvent={actions.addTimelineEvent}
                onPostMessage={actions.postGigMessage}
                onCreateEscrow={actions.createEscrowCheckpoint}
                onUpdateEscrow={actions.updateEscrowCheckpoint}
                onSubmitReview={(orderId, payload) => actions.updateGigOrder(orderId, payload)}
                defaultAuthorName={defaultAuthorName}
              />
            </>
          ) : null}
        </>
      )}
      <GigOrderComposer
        open={composer.form === 'order'}
        order={composer.context?.order ?? null}
        onClose={closeComposer}
        onSubmit={(payload) =>
          composer.context?.order
            ? actions.updateGigOrder(composer.context.order.id, payload)
            : actions.createGigOrder(payload)
        }
      />

      <TimelineComposer
        open={composer.form === 'timeline'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload, event }) =>
          event
            ? actions.updateGigTimelineEvent(orderId, event.id, payload)
            : actions.createGigTimelineEvent(orderId, payload)
        }
      />

      <SubmissionComposer
        open={composer.form === 'submission'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload, submission }) =>
          submission
            ? actions.updateGigSubmission(orderId, submission.id, payload)
            : actions.createGigSubmission(orderId, payload)
        }
      />

      <ChatComposer
        open={composer.form === 'chat'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload }) => actions.postGigChatMessage(orderId, payload)}
      />

      <GigOrderDetailDrawer
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => handleOrderDetail(null)}
        onEditOrder={(order) => openComposer('order', { order })}
        onAddTimeline={(orderId) => openComposer('timeline', { orderId })}
        onEditTimeline={(orderId, event) => openComposer('timeline', { orderId, event })}
        onLogSubmission={(orderId) => openComposer('submission', { orderId })}
        onEditSubmission={(orderId, submission) => openComposer('submission', { orderId, submission })}
        onStartChat={(orderId) => openComposer('chat', { orderId })}
      />
    </section>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  resource: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    actions: PropTypes.object,
    reload: PropTypes.func,
  }),
};

ProjectGigManagementContainer.defaultProps = {
  resource: null,
};
