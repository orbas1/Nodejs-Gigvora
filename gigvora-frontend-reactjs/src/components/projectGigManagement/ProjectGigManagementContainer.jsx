import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import ProjectWizard from './ProjectWizard.jsx';
import GigOrderComposer from './GigOrderComposer.jsx';
import TimelineComposer from './TimelineComposer.jsx';
import SubmissionComposer from './SubmissionComposer.jsx';
import ChatComposer from './ChatComposer.jsx';
import GigOrderDetailDrawer from './GigOrderDetailDrawer.jsx';
import GigOperationsWorkspace from './GigOperationsWorkspace.jsx';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';
import useSession from '../../hooks/useSession.js';

const PROJECT_ACCESS_ROLES = [
  'Agency lead',
  'Operations lead',
  'Company operator',
  'Workspace admin',
  'Platform admin',
];

const EMPTY_COMPOSER = { form: null, context: null };

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function resolveDefaultAuthorName(session) {
  if (!session) {
    return null;
  }
  if (session.name) {
    return session.name;
  }
  if (session.user?.name) {
    return session.user.name;
  }
  const parts = [session.user?.firstName, session.user?.lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return session.email ?? session.user?.email ?? null;
}

function ProjectPreview({ project, onClose }) {
  if (!project) {
    return null;
  }

  const workspace = project.workspace ?? {};
  const budget = project.budget ?? {};
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{project.title ?? 'Project'}</h2>
            {project.clientName ? <p className="text-xs text-slate-500">{project.clientName}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close project preview"
          >
            ×
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{(workspace.status ?? project.status ?? 'planning').replace(/_/g, ' ')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{Math.round(Number(workspace.progressPercent ?? 0))}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatCurrency(budget.allocated ?? workspace.budgetAllocated, budget.currency ?? workspace.currency ?? 'USD')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{(workspace.riskLevel ?? 'low').replace(/_/g, ' ')}</p>
            </div>
          </section>

          {milestones.length ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Milestones</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {milestones.slice(0, 6).map((milestone) => (
                  <div key={milestone.id ?? milestone.title} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{milestone.title ?? 'Milestone'}</p>
                    {milestone.dueDate ? (
                      <p className="mt-1 text-xs text-slate-500">Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
                    ) : null}
                    {milestone.status ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{String(milestone.status).replace(/_/g, ' ')}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {collaborators.length ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Collaborators</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {collaborators.slice(0, 6).map((collaborator) => (
                  <div key={collaborator.id ?? collaborator.email ?? collaborator.name} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{collaborator.fullName ?? collaborator.name ?? collaborator.email ?? 'Collaborator'}</p>
                    {collaborator.role ? (
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{collaborator.role}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

ProjectPreview.propTypes = {
  project: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

ProjectPreview.defaultProps = {
  project: null,
};

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
      </section>
    );
  }

  const fallbackResource = useProjectGigManagement(userId, { enabled: !resource });
  const { data, loading, error, actions, reload } = resource ?? fallbackResource;

  const access = data?.access ?? {};
  const canManage = access.canManage !== false;
  const allowedRoles = useMemo(
    () => (Array.isArray(access.allowedRoles) ? access.allowedRoles.map((role) => role.replace(/_/g, ' ')) : []),
    [access.allowedRoles],
  );
  const viewOnlyNote = !canManage ? access.reason ?? 'Current role is read only.' : null;
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const fromCache = data?.meta?.fromCache ?? false;

  const [activeTab, setActiveTab] = useState('projects');
  const [composer, setComposer] = useState(EMPTY_COMPOSER);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [previewProjectId, setPreviewProjectId] = useState(null);

  const projects = useMemo(() => {
    if (Array.isArray(data?.projectLifecycle?.open) || Array.isArray(data?.projectLifecycle?.closed)) {
      return [...(data.projectLifecycle.open ?? []), ...(data.projectLifecycle.closed ?? [])];
    }
    if (Array.isArray(data?.projectCreation?.projects)) {
      return data.projectCreation.projects;
    }
    return [];
  }, [data?.projectLifecycle?.open, data?.projectLifecycle?.closed, data?.projectCreation?.projects]);

  const projectLookup = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      const key = project.id ?? project.projectId ?? project.project?.id;
      if (key != null) {
        map.set(key, project);
      }
    });
    return map;
  }, [projects]);

  const previewProject = previewProjectId ? projectLookup.get(previewProjectId) ?? null : null;

  const orders = useMemo(
    () => (Array.isArray(data?.purchasedGigs?.orders) ? data.purchasedGigs.orders : []),
    [data?.purchasedGigs?.orders],
  );

  useEffect(() => {
    if (!orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(null);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.orderNumber ?? `Order ${order.id}`} · ${order.serviceName}`,
      })),
    [orders],
  );

  const defaultAuthorName = useMemo(() => resolveDefaultAuthorName(session), [session]);

  const openComposer = (form, context = null) => setComposer({ form, context });
  const closeComposer = () => setComposer(EMPTY_COMPOSER);
  const handleOrderDetail = (orderId) => setSelectedOrderId(orderId ?? null);
  const handleProjectPreview = (projectId) => setPreviewProjectId(projectId ?? null);

  return (
    <section className="flex h-full flex-col gap-6">
      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
        fromCache={fromCache}
        onRefresh={reload}
        statusLabel="Workspace snapshot"
      />

      {data ? (
        <div className="space-y-8">
          <ProjectGigManagementSection
            data={data}
            actions={actions}
            loading={loading}
            canManage={canManage}
            viewOnlyNote={viewOnlyNote}
            allowedRoles={allowedRoles}
            onOpenProject={() => openComposer('project')}
            onOpenOrder={() => openComposer('order')}
            onProjectPreview={handleProjectPreview}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <GigOperationsWorkspace
            data={data}
            canManage={canManage}
            onCreateOrder={actions.createGigOrder}
            onUpdateOrder={actions.updateGigOrder}
            onAddTimelineEvent={actions.createGigTimelineEvent}
            onPostMessage={actions.postGigMessage}
            onCreateEscrow={actions.createEscrowCheckpoint}
            onUpdateEscrow={actions.updateEscrowCheckpoint}
            onSubmitReview={(orderId, payload) => actions.updateGigOrder(orderId, payload)}
            defaultAuthorName={defaultAuthorName}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-60 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="h-60 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
              <div className="h-24 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      <ProjectWizard
        open={composer.form === 'project'}
        templates={data?.projectCreation?.templates ?? []}
        onClose={closeComposer}
        onSubmit={async (payload) => {
          await actions.createProject(payload);
          closeComposer();
        }}
      />

      <GigOrderComposer
        open={composer.form === 'order'}
        order={composer.context?.order ?? null}
        onClose={closeComposer}
        onSubmit={async (payload) => {
          if (composer.context?.order) {
            await actions.updateGigOrder(composer.context.order.id, payload);
          } else {
            await actions.createGigOrder(payload);
          }
          closeComposer();
        }}
      />

      <TimelineComposer
        open={composer.form === 'timeline'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={async ({ orderId, payload, event }) => {
          if (event) {
            await actions.updateGigTimelineEvent(orderId, event.id, payload);
          } else {
            await actions.createGigTimelineEvent(orderId, payload);
          }
          closeComposer();
        }}
      />

      <SubmissionComposer
        open={composer.form === 'submission'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={async ({ orderId, payload, submission }) => {
          if (submission) {
            await actions.updateGigSubmission(orderId, submission.id, payload);
          } else {
            await actions.createGigSubmission(orderId, payload);
          }
          closeComposer();
        }}
      />

      <ChatComposer
        open={composer.form === 'chat'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={async ({ orderId, payload }) => {
          await actions.postGigChatMessage(orderId, payload);
          closeComposer();
        }}
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

      <ProjectPreview project={previewProject} onClose={() => handleProjectPreview(null)} />
    </section>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  resource: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    actions: PropTypes.object,
    reload: PropTypes.func,
  }),
};

ProjectGigManagementContainer.defaultProps = {
  userId: null,
  resource: null,
};
