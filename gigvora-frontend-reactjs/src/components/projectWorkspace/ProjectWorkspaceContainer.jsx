import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import useProjectWorkspace from '../../hooks/useProjectWorkspace.js';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';
import DataStatus from '../DataStatus.jsx';
import ProjectWorkspaceSection from './ProjectWorkspaceSection.jsx';
import CreateWorkspaceDialog from './CreateWorkspaceDialog.jsx';

const INITIAL_PROJECT_FORM = {
  title: '',
  description: '',
  status: 'planning',
  budgetCurrency: 'USD',
  budgetAllocated: '',
  dueDate: '',
};

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '$0';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function ProjectListItem({ project, isActive, onSelect }) {
  const status = project.status?.replace(/_/g, ' ') ?? 'planning';
  const due = project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-GB') : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(String(project.id))}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        isActive
          ? 'border-accent bg-accent/10 text-slate-900 shadow-soft'
          : 'border-transparent bg-white/70 text-slate-700 hover:border-slate-200 hover:bg-white'
      }`}
    >
      <p className="text-sm font-semibold">{project.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">{status}</span>
        {project.workspace?.progressPercent != null ? (
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {Number(project.workspace.progressPercent).toFixed(0)}% done
          </span>
        ) : null}
        {due ? <span className="rounded-full bg-slate-100 px-2 py-1">Due {due}</span> : null}
      </div>
    </button>
  );
}

ProjectListItem.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    workspace: PropTypes.shape({
      progressPercent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

ProjectListItem.defaultProps = {
  isActive: false,
};

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function ProjectWorkspaceContainer({ userId }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();

  if (!canManageProjects) {
    return (
      <section
        id="project-workspace"
        className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white/60 p-8 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Project workspace</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">Workspace access required</h2>
        <p className="mt-3 text-sm text-slate-600">
          {denialReason ||
            'This collaborative workspace is available to operations, agency, and administrator roles. Request an upgrade from your workspace owner to activate project tools.'}
        </p>
        <a
          href="mailto:operations@gigvora.com?subject=Project%20workspace%20access%20request"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-600"
        >
          Contact operations@gigvora.com
        </a>
      </section>
    );
  }

  const { data, loading, error, actions, reload } = useProjectWorkspace(userId);
  const projects = data?.projects ?? [];
  const summary = data?.summary ?? data?.projectWorkspace?.summary ?? {
    projectCount: projects.length,
  };
  const canManage = data?.access?.canManage !== false;
  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    projects[0]?.id != null ? String(projects[0].id) : null,
  );
  const [activeTab, setActiveTab] = useState('workspace');
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [projectErrors, setProjectErrors] = useState({});
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [projectFeedback, setProjectFeedback] = useState(null);

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null);
      return;
    }

    if (!projects.some((project) => String(project.id) === String(selectedProjectId))) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    setActiveTab('workspace');
  }, [selectedProjectId]);

  const handleProjectFormChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const validateProjectForm = () => {
    const errors = {};
    if (!projectForm.title?.trim()) {
      errors.title = 'Enter a project name.';
    }
    if (!projectForm.description?.trim()) {
      errors.description = 'Add a summary.';
    }
    if (projectForm.budgetAllocated) {
      const amount = Number(projectForm.budgetAllocated);
      if (Number.isNaN(amount) || amount < 0) {
        errors.budgetAllocated = 'Use a positive number.';
      }
    }
    if (projectForm.dueDate) {
      const due = new Date(projectForm.dueDate);
      if (Number.isNaN(due.getTime())) {
        errors.dueDate = 'Select a valid date.';
      }
    }
    return errors;
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    const errors = validateProjectForm();
    setProjectErrors(errors);
    if (Object.keys(errors).length > 0) {
      setProjectFeedback({ status: 'error', message: 'Review the highlighted inputs.' });
      return;
    }

    setProjectSubmitting(true);
    setProjectFeedback(null);
    try {
      await actions.createProject({
        title: projectForm.title,
        description: projectForm.description,
        status: projectForm.status,
        budgetCurrency: projectForm.budgetCurrency,
        budgetAllocated: projectForm.budgetAllocated ? Number(projectForm.budgetAllocated) : 0,
        dueDate: projectForm.dueDate || undefined,
        workspace: { status: projectForm.status, progressPercent: 5, riskLevel: 'low' },
      });
      setProjectForm(INITIAL_PROJECT_FORM);
      setCreateOpen(false);
      setProjectFeedback({ status: 'success', message: 'Workspace ready.' });
    } catch (err) {
      setProjectFeedback({ status: 'error', message: err?.message || 'Unable to create workspace.' });
    } finally {
      setProjectSubmitting(false);
    }
  };

  const summaryTiles = [
    { label: 'Workspaces', value: summary.projectCount ?? projects.length ?? 0 },
    { label: 'Planned', value: formatCurrency(summary.totalBudgetPlanned ?? 0, 'USD') },
    { label: 'Spent', value: formatCurrency(summary.totalBudgetActual ?? 0, 'USD') },
    { label: 'Done tasks', value: `${summary.completedTasks ?? 0}/${summary.taskCount ?? 0}` },
    { label: 'Meetings', value: summary.upcomingMeetings ?? 0 },
    { label: 'Invites', value: summary.invitationCount ?? 0 },
  ];

  return (
    <section id="project-workspace" className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Workspace</p>
            <h2 className="text-2xl font-semibold text-slate-900">Project hub</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => reload()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-soft transition hover:border-slate-300"
            >
              <ArrowPathIcon className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setProjectErrors({});
                setProjectForm(INITIAL_PROJECT_FORM);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
            >
              <PlusIcon className="h-4 w-4" /> New
            </button>
          </div>
        </div>
      </header>

      <DataStatus loading={loading} error={error} onRefresh={reload} onRetry={reload}>
        {projects.length ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {summaryTiles.map((tile) => (
                <SummaryTile key={tile.label} {...tile} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
              <aside className="space-y-4">
                <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Projects</h3>
                  <div className="mt-4 space-y-3">
                    {projects.map((project) => (
                      <ProjectListItem
                        key={project.id}
                        project={project}
                        isActive={String(project.id) === String(selectedProjectId)}
                        onSelect={setSelectedProjectId}
                      />
                    ))}
                  </div>
                  {projectFeedback ? (
                    <p
                      className={`mt-4 text-sm ${
                        projectFeedback.status === 'error' ? 'text-rose-500' : 'text-emerald-600'
                      }`}
                    >
                      {projectFeedback.message}
                    </p>
                  ) : null}
                </section>
              </aside>

              <ProjectWorkspaceSection
                className="xl:col-start-2"
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                actions={actions}
                canManage={canManage}
                summary={summary}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
            <p className="text-sm text-slate-600">Start by creating a workspace.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
            >
              <PlusIcon className="h-4 w-4" /> New workspace
            </button>
            {projectFeedback ? (
              <p
                className={`mt-4 text-sm ${
                  projectFeedback.status === 'error' ? 'text-rose-500' : 'text-emerald-600'
                }`}
              >
                {projectFeedback.message}
              </p>
            ) : null}
          </div>
        )}
      </DataStatus>

      <CreateWorkspaceDialog
        open={isCreateOpen}
        onClose={() => {
          if (!projectSubmitting) {
            setCreateOpen(false);
          }
        }}
        form={projectForm}
        errors={projectErrors}
        feedback={projectFeedback}
        onChange={handleProjectFormChange}
        onSubmit={handleProjectSubmit}
        submitting={projectSubmitting}
      />
    </section>
  );
}

ProjectWorkspaceContainer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
