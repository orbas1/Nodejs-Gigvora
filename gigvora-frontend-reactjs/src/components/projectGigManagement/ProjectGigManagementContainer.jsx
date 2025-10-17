import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import ProjectWorkspaceDrawer from './ProjectWorkspaceDrawer.jsx';
import GigOrderDrawer from './GigOrderDrawer.jsx';
import WorkspaceDetailDrawer from './WorkspaceDetailDrawer.jsx';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';

const PROJECT_ACCESS_ROLES = ['Agency lead', 'Operations lead', 'Company operator', 'Workspace admin', 'Platform admin'];

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
  }
  if (!values.description?.trim()) {
    errors.description = 'Add a summary.';
  }
  if (values.budgetAllocated !== '') {
    const amount = parseNumber(values.budgetAllocated);
    if (amount == null) {
      errors.budgetAllocated = 'Use a number.';
    } else if (amount < 0) {
      errors.budgetAllocated = 'Must be positive.';
    }
  }
  if (values.dueDate) {
    const due = new Date(values.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = 'Pick a date.';
    } else if (due < startOfToday()) {
      errors.dueDate = 'Date has passed.';
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
  }
  if (values.amount !== '') {
    const amount = parseNumber(values.amount);
    if (amount == null) {
      errors.amount = 'Use a number.';
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
    }
  }
  return errors;
}

function resolveProjectId(project) {
  if (!project) {
    return null;
  }
  return project.project?.id ?? project.projectId ?? project.id ?? null;
}

export default function ProjectGigManagementContainer({ userId }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();

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
      </section>
    );
  }

  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [gigDrawerOpen, setGigDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [gigForm, setGigForm] = useState(INITIAL_GIG_FORM);
  const [projectErrors, setProjectErrors] = useState({});
  const [gigErrors, setGigErrors] = useState({});
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [gigSubmitting, setGigSubmitting] = useState(false);
  const [projectFeedback, setProjectFeedback] = useState(null);
  const [gigFeedback, setGigFeedback] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const access = data?.access ?? { canManage: false };
  const canManage = access.canManage !== false;
  const viewOnlyNote = !canManage
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

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const handleGigChange = (event) => {
    const { name, value } = event.target;
    setGigForm((current) => ({ ...current, [name]: value }));
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProjectForm(projectForm);
    setProjectErrors(validation);
    if (Object.keys(validation).length > 0) {
      setProjectFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setProjectSubmitting(true);
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
    }
  };

  const handleGigSubmit = async (event) => {
    event.preventDefault();
    const validation = validateGigForm(gigForm);
    setGigErrors(validation);
    if (Object.keys(validation).length > 0) {
      setGigFeedback({ status: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setGigSubmitting(true);
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
    } finally {
      setGigSubmitting(false);
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
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.number,
};
