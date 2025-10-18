import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

import PropTypes from 'prop-types';
import ProjectLifecyclePanel from './ProjectLifecyclePanel.jsx';
import ProjectBidsPanel from './ProjectBidsPanel.jsx';
import ProjectInvitationsPanel from './ProjectInvitationsPanel.jsx';
import AutoMatchPanel from './AutoMatchPanel.jsx';
import ProjectReviewsPanel from './ProjectReviewsPanel.jsx';
import EscrowManagementPanel from './EscrowManagementPanel.jsx';

function PanelWrapper({ children }) {
  return <div className="min-h-[24rem] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>;
}

PanelWrapper.propTypes = {
  children: PropTypes.node,
};

PanelWrapper.defaultProps = {
  children: null,
};

function EmptyPanel({ title, actionLabel, onAction }) {
  return (
    <PanelWrapper>
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </PanelWrapper>
  );
}

EmptyPanel.propTypes = {
  title: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

EmptyPanel.defaultProps = {
  actionLabel: null,
  onAction: undefined,
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const NAV_ITEMS = [
  { id: 'manage', label: 'Manage' },
  { id: 'create', label: 'Create' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'submit', label: 'Submit' },
  { id: 'chat', label: 'Chat' },
];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Number(value));
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }
  return value
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function SummaryMetric({ label, value, accent }) {
  return (
    <div
      className={`rounded-3xl border px-4 py-5 shadow-sm transition ${
        accent ? 'border-accent/40 bg-accentSoft/40 text-accent' : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

SummaryMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  accent: PropTypes.bool,
};

function WorkspaceRow({ project, onSelect }) {
  const workspace = project.workspace ?? {};
  const meta = project.project ?? {};
  const status = workspace.status ?? meta.status ?? 'planning';
  const progress = workspace.progressPercent;
  const milestone = workspace.nextMilestone;
  const due = workspace.nextMilestoneDueAt ?? meta.dueDate ?? null;
  const risk = workspace.riskLevel ?? 'low';
  const budget = project.budget ?? {};

  return (
    <button
      type="button"
      onClick={() => onSelect?.(project)}
      className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-accent/60 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{meta.title ?? 'Project'}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{formatStatus(status)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Risk {formatStatus(risk)}</span>
            {milestone ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{milestone}</span>
            ) : null}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {due ? `Due ${formatRelativeTime(due)}` : 'No due date'}
StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

function OrderCard({ order, onOpen, onTimeline, onLog, onEdit }) {
  const status = order.status?.replace(/_/g, ' ');
  const due = order.dueAt ? formatRelativeTime(order.dueAt) : 'No due date';
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{order.serviceName}</p>
          <p className="text-xs text-slate-500">{order.vendorName}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{status}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Progress</p>
          <p className="text-sm font-semibold text-slate-900">{order.progressPercent ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budget.allocated, budget.currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Spend</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budget.spent, budget.currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Burn</p>
          <p className="text-sm font-semibold text-slate-900">
            {budget.burnRatePercent != null ? formatPercent(budget.burnRatePercent) : '—'}
          </p>
        </div>
      </div>
    </button>
  );
}

WorkspaceRow.propTypes = {
  project: PropTypes.object.isRequired,
  onSelect: PropTypes.func,
};

function WorkspaceList({ id, title, projects, onSelect, emptyLabel }) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-end justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {formatNumber(projects.length)}
        </span>
      </div>
      <div className="space-y-3">
        {projects.length ? (
          projects.map((project) => (
            <WorkspaceRow key={project.project?.id ?? project.projectId ?? project.id} project={project} onSelect={onSelect} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            {emptyLabel}
          </div>
        )}
          <p className="text-xs text-slate-500">Due</p>
          <p className="text-sm font-semibold text-slate-900">{due}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.amount, order.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Open items</p>
          <p className="text-sm font-semibold text-slate-900">{order.outstandingRequirements ?? 0}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(order)}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onTimeline(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Milestone
        </button>
        <button
          type="button"
          onClick={() => onLog(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Delivery
        </button>
      </div>
    </div>
  );
}

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  onTimeline: PropTypes.func.isRequired,
  onLog: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ManageView({ summary, board, onOpenProject, onOpenOrder }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={formatNumber(summary.totalProjects)} />
        <StatCard label="Active" value={formatNumber(summary.activeProjects)} />
        <StatCard label="Open gigs" value={formatNumber(summary.openGigs)} />
        <StatCard label="Closed gigs" value={formatNumber(summary.closedGigs)} />
        <StatCard label="In play" value={formatCurrency(summary.openGigValue, summary.currency)} />
        <StatCard label="Budget" value={formatCurrency(summary.budgetInPlay, summary.currency)} />
        <StatCard label="Templates" value={formatNumber(summary.templatesAvailable)} />
        <StatCard label="Stories" value={formatNumber(summary.storiesReady)} />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Board lanes</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenProject}
              className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Project
            </button>
            <button
              type="button"
              onClick={onOpenOrder}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
            >
              Order
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {board.lanes.map((lane) => (
            <div key={lane.status} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{lane.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{lane.projects.length}</p>
              <div className="mt-3 grid gap-2">
                {lane.projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p>{project.progress}% · {project.riskLevel}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

WorkspaceList.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  projects: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  emptyLabel: PropTypes.string.isRequired,
};

function BoardSnapshot({ id, board, onOpenCreate, canManage, loading }) {
  const lanes = Array.isArray(board.lanes) ? board.lanes : [];
  const riskDistribution = board.metrics?.riskDistribution ?? {};
  const integrations = board.integrations ?? [];
  const retros = board.retrospectives ?? [];

  return (
    <section id={id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Board</h3>
        <button
          type="button"
          onClick={onOpenCreate}
          disabled={!canManage || loading}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/40"
        >
          New project
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lanes.slice(0, 4).map((lane) => (
          <div key={lane.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{lane.name}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(lane.cards ?? 0)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {Object.entries(riskDistribution).map(([key, count]) => (
              <span key={key} className="rounded-full bg-slate-100 px-3 py-1">
                {formatStatus(key)} · {formatNumber(count)}
              </span>
            ))}
            {Object.keys(riskDistribution).length === 0 ? <span className="text-slate-400">No risk data</span> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Integrations</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {integrations.slice(0, 6).map((integration) => (
              <span key={integration.provider ?? integration} className="rounded-full bg-slate-100 px-3 py-1">
                {integration.name ?? integration.provider ?? integration}
              </span>
            ))}
            {integrations.length === 0 ? <span className="text-slate-400">No integrations</span> : null}
          </div>
          {retros.length ? (
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              {retros.slice(0, 3).map((retro) => (
                <div key={retro.id ?? retro.name} className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-900">{retro.name ?? 'Retro'}</p>
                  {retro.summary ? <p className="text-slate-500">{retro.summary}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

BoardSnapshot.propTypes = {
  id: PropTypes.string.isRequired,
  board: PropTypes.object.isRequired,
  onOpenCreate: PropTypes.func.isRequired,
  canManage: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

function AssetVault({ id, assets }) {
  const items = Array.isArray(assets.items) ? assets.items.slice(0, 5) : [];
  const summary = assets.summary ?? {};
  return (
    <section id={id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Assets</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatNumber(summary.total ?? items.length)} items
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{formatNumber(summary.watermarked ?? 0)}</p>
            <p className="uppercase tracking-wide text-slate-500">Watermarked</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{formatNumber(summary.restricted ?? 0)}</p>
            <p className="uppercase tracking-wide text-slate-500">Restricted</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((asset) => (
            <div
              key={asset.id ?? asset.name ?? asset.filename}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{asset.name ?? asset.filename ?? 'Asset'}</p>
                <p className="text-xs text-slate-500">{asset.projectTitle ?? 'Workspace'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Storage</p>
                <p className="text-sm font-semibold text-slate-900">{asset.storageProvider ?? 'internal'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Access</p>
                <p className="text-sm font-semibold text-slate-900">
                  {asset.permissions?.allowDownload === false ? 'View only' : 'Download'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Size</p>
                <p className="text-sm font-semibold text-slate-900">
                  {asset.sizeLabel ?? `${formatNumber(asset.sizeBytes ?? 0)} bytes`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            No assets yet.
          </div>
        )}
      </div>
    </section>
  );
}

AssetVault.propTypes = {
  id: PropTypes.string.isRequired,
  assets: PropTypes.object.isRequired,
};

function VendorPanel({ id, gigs, onOpenGig, canManage, loading }) {
  const orders = Array.isArray(gigs.orders) ? gigs.orders.slice(0, 5) : [];
  const reminders = Array.isArray(gigs.reminders) ? gigs.reminders.slice(0, 3) : [];
  const scorecards = Array.isArray(gigs.scorecards) ? gigs.scorecards.slice(0, 3) : [];

  return (
    <section id={id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Vendors</h3>
        <button
          type="button"
          onClick={onOpenGig}
          disabled={!canManage || loading}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Log gig
        </button>
      </div>
      <div className="space-y-3">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id ?? order.orderNumber} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{order.vendorName ?? 'Vendor'}</span>
                {order.dueAt ? <span>{formatRelativeTime(order.dueAt)}</span> : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{order.serviceName ?? 'Service'}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>{order.orderNumber ? `Order ${order.orderNumber}` : 'No order number'}</span>
                <span>{formatCurrency(order.amount, order.currency)}</span>
                <span>{formatStatus(order.status ?? 'scheduled')}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            No vendor gigs yet.
          </div>
        )}
ManageView.propTypes = {
  summary: PropTypes.object.isRequired,
  board: PropTypes.object.isRequired,
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
};

function CreateView({ onOpenProject, onOpenOrder, onCreateTimeline, onLogSubmission, onStartChat }) {
  const actions = [
    { label: 'Project', onClick: onOpenProject },
    { label: 'Order', onClick: onOpenOrder },
    { label: 'Milestone', onClick: onCreateTimeline },
    { label: 'Delivery', onClick: onLogSubmission },
    { label: 'Message', onClick: onStartChat },
  ];

  return (
    <div className="grid h-full place-items-center rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-sm">
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => action.onClick()}
            className="rounded-3xl border border-slate-200 bg-slate-50/70 px-6 py-10 text-lg font-semibold text-slate-900 shadow-sm transition hover:border-accent hover:bg-white"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

CreateView.propTypes = {
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onCreateTimeline: PropTypes.func.isRequired,
  onLogSubmission: PropTypes.func.isRequired,
  onStartChat: PropTypes.func.isRequired,
};

function OrdersView({ title, orders, onOpenOrder, onTimeline, onLog, onEdit }) {
  return (
    <div className="grid h-full gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {orders.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={() => onOpenOrder(order)}
              onTimeline={() => onTimeline(order.id)}
              onLog={() => onLog(order.id)}
              onEdit={() => onEdit(order)}
            />
          ))}
        </div>
      ) : (
        <p className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 p-10 text-sm text-slate-500">
          Nothing here yet.
        </p>
      )}
    </div>
  );
}

OrdersView.propTypes = {
  title: PropTypes.string.isRequired,
  orders: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onTimeline: PropTypes.func.isRequired,
  onLog: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function TimelineView({ timeline, onEdit }) {
  return (
    <div className="grid h-full gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Upcoming</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {timeline.upcoming.length ? (
            timeline.upcoming.slice(0, 8).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEdit(event.orderId, event)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.serviceName}</p>
                <p className="mt-2 text-xs text-slate-500">{event.scheduledAt ? formatRelativeTime(event.scheduledAt) : 'No date'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No upcoming items.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Recent</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {timeline.recent.length ? (
            timeline.recent.slice(0, 8).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEdit(event.orderId, event)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.serviceName}</p>
                <p className="mt-2 text-xs text-slate-500">{event.completedAt ? formatAbsolute(event.completedAt) : 'In progress'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

TimelineView.propTypes = {
  timeline: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function SubmissionView({ submissions, onEdit }) {
  return (
    <div className="grid h-full gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Pending</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {submissions.pending.length ? (
            submissions.pending.slice(0, 8).map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => onEdit(submission.orderId, submission)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{submission.title}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.status.replace(/_/g, ' ')}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.submittedAt ? formatRelativeTime(submission.submittedAt) : 'Draft'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">All caught up.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Recent</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {submissions.recent.length ? (
            submissions.recent.slice(0, 8).map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => onEdit(submission.orderId, submission)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{submission.title}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.status.replace(/_/g, ' ')}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.reviewedAt ? formatAbsolute(submission.reviewedAt) : 'Awaiting review'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No deliveries logged.</p>
          )}
        </div>
      </div>
      {reminders.length ? (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Reminders</p>
          {reminders.map((reminder) => (
            <div key={reminder.id ?? reminder.orderNumber} className="text-sm text-amber-800">
              <span className="font-semibold">{reminder.title}</span>{' '}
              <span>{reminder.dueAt ? formatRelativeTime(reminder.dueAt) : ''}</span>
            </div>
          ))}
        </div>
      ) : null}
      {scorecards.length ? (
        <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Scorecards</p>
          {scorecards.map((scorecard) => (
            <div key={scorecard.id ?? scorecard.orderNumber} className="text-sm text-emerald-800">
              <span className="font-semibold">{scorecard.vendorName ?? 'Vendor'}</span>{' '}
              <span>{scorecard.overallScore != null ? `${scorecard.overallScore}/5` : '—'}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

VendorPanel.propTypes = {
  id: PropTypes.string.isRequired,
  gigs: PropTypes.object.isRequired,
  onOpenGig: PropTypes.func.isRequired,
  canManage: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

function StoryPanel({ id, storytelling }) {
  const achievements = Array.isArray(storytelling.achievements) ? storytelling.achievements.slice(0, 4) : [];
  const prompts = Array.isArray(storytelling.prompts) ? storytelling.prompts.slice(0, 4) : [];

  return (
    <section id={id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Stories</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
          {achievements.length ? (
            achievements.map((achievement) => (
              <div key={achievement.id ?? achievement.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{achievement.title}</span>
                  {achievement.deliveredAt ? <span>{formatRelativeTime(achievement.deliveredAt)}</span> : null}
                </div>
                {achievement.bullet ? <p className="mt-2 text-sm text-slate-600">{achievement.bullet}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
              No stories yet.
            </div>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompts</p>
          {prompts.length ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {prompts.map((prompt, index) => (
                <li key={prompt.id ?? prompt.title ?? index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {prompt.title ?? prompt}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
              No prompts yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

StoryPanel.propTypes = {
  id: PropTypes.string.isRequired,
  storytelling: PropTypes.object.isRequired,
SubmissionView.propTypes = {
  submissions: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ChatView({ chat, onReply }) {
  return (
    <div className="grid h-full gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Threads</h3>
        <button
          type="button"
          onClick={() => onReply()}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
        >
          New
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {chat.recent.length ? (
          chat.recent.slice(0, 12).map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => onReply(message.orderId)}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
            >
              <p className="font-semibold text-slate-900">{message.serviceName}</p>
              <p className="mt-1 text-xs text-slate-500">{message.authorName ?? 'Anon'}</p>
              <p className="mt-2 text-xs text-slate-500">{message.sentAt ? formatRelativeTime(message.sentAt) : 'Just now'}</p>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600">{message.body}</p>
            </button>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No chatter yet.</p>
        )}
      </div>
    </div>
  );
}

ChatView.propTypes = {
  chat: PropTypes.object.isRequired,
  onReply: PropTypes.func.isRequired,
};

export default function ProjectGigManagementSection({
  data,
  loading,
  canManage,
  viewOnlyNote,
  allowedRoles,
  onOpenCreate,
  onOpenGig,
  onSelectProject,
}) {
  const summary = data?.summary ?? {};
  const projects = Array.isArray(data?.projectCreation?.projects) ? data.projectCreation.projects : [];
  const openProjects = useMemo(
    () => projects.filter((project) => (project.workspace?.status ?? project.project?.status) !== 'completed'),
    [projects],
  );
  const closedProjects = useMemo(
    () => projects.filter((project) => (project.workspace?.status ?? project.project?.status) === 'completed'),
    [projects],
  );
  const templates = Array.isArray(data?.projectCreation?.templates)
    ? data.projectCreation.templates.slice(0, 4)
    : [];
  const assets = data?.assets ?? {};
  const board = data?.managementBoard ?? {};
  const gigs = data?.purchasedGigs ?? {};
  const storytelling = data?.storytelling ?? {};

  const summaryMetrics = [
    { label: 'Active', value: formatNumber(summary.activeProjects ?? openProjects.length), accent: true },
    { label: 'Budget', value: formatCurrency(summary.budgetInPlay, summary.currency) },
    { label: 'Gigs', value: formatNumber(summary.gigsInDelivery ?? gigs.orders?.length ?? 0) },
    { label: 'Templates', value: formatNumber(summary.templatesAvailable ?? templates.length) },
    { label: 'Assets', value: formatNumber(summary.assetsSecured ?? assets.summary?.total ?? 0) },
    { label: 'Stories', value: formatNumber(summary.storiesReady ?? storytelling.achievements?.length ?? 0) },
  ];

  return (
    <section id="projects-page" className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Projects</p>
            <h2 className="text-3xl font-semibold text-slate-900">Project hub</h2>
            {viewOnlyNote ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                View only · {viewOnlyNote}
              </div>
            ) : null}
            {!canManage && allowedRoles.length ? (
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {allowedRoles.map((role) => (
                  <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {role}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenCreate}
              disabled={!canManage || loading}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/40"
            >
              New project
            </button>
            <button
              type="button"
              onClick={onOpenGig}
              disabled={!canManage || loading}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Log gig
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {summaryMetrics.map((metric) => (
            <SummaryMetric key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      <div id="projects-create" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Templates</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {templates.length ? (
            templates.map((template) => (
              <div key={template.id ?? template.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                <p className="mt-2 text-xs text-slate-500">{template.summary}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
              No templates yet.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <WorkspaceList
            id="projects-open"
            title="Open"
            projects={openProjects}
            emptyLabel="No open projects."
            onSelect={onSelectProject}
          />
          <WorkspaceList
            id="projects-closed"
            title="Closed"
            projects={closedProjects}
            emptyLabel="No closed projects."
            onSelect={onSelectProject}
          />
        </div>
        <div className="space-y-6 xl:col-span-5">
          <BoardSnapshot
            id="projects-board"
            board={board}
            onOpenCreate={onOpenCreate}
            canManage={canManage}
            loading={loading}
          />
          <AssetVault id="projects-assets" assets={assets} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <VendorPanel
            id="projects-vendors"
            gigs={gigs}
            onOpenGig={onOpenGig}
            canManage={canManage}
            loading={loading}
          />
        </div>
        <div className="xl:col-span-5">
          <StoryPanel id="projects-stories" storytelling={storytelling} />
  actions,
  activeTab,
  canManage,
  onProjectPreview,
}) {
  const lifecycle = data?.projectLifecycle ?? { open: [], closed: [], stats: {} };
  const projects = data?.projectCreation?.projects ?? [];
  const bids = data?.projectBids ?? { bids: [], stats: {} };
  const invitations = data?.invitations ?? { entries: [], stats: {} };
  const autoMatch = data?.autoMatch ?? { settings: {}, matches: [], summary: {} };
  const reviews = data?.reviews ?? { entries: [], summary: {} };
  const escrow = data?.escrow ?? { account: {}, transactions: [] };
  const purchasedGigs = data?.purchasedGigs ?? { orders: [] };

  const handleProjectSelect = (projectId) => {
    if (onProjectPreview) {
      onProjectPreview(projectId);
    }
  };

  if (activeTab === 'projects') {
    if (!lifecycle.open.length && !lifecycle.closed.length) {
      return <EmptyPanel title="No projects yet" />;
    }

    return (
      <ProjectLifecyclePanel
        lifecycle={lifecycle}
        onUpdateWorkspace={actions.updateWorkspace}
        canManage={canManage}
        onPreviewProject={handleProjectSelect}
      />
    );
  }

  if (activeTab === 'bids') {
    return (
      <ProjectBidsPanel
        bids={bids.bids ?? []}
        stats={bids.stats ?? {}}
        projects={projects}
        onCreateBid={actions.createProjectBid}
        onUpdateBid={actions.updateProjectBid}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'invites') {
    return (
      <ProjectInvitationsPanel
        entries={invitations.entries ?? []}
        stats={invitations.stats ?? {}}
        projects={projects}
        onSendInvitation={actions.sendProjectInvitation}
        onUpdateInvitation={actions.updateProjectInvitation}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'match') {
    return (
      <AutoMatchPanel
        settings={autoMatch.settings ?? {}}
        matches={autoMatch.matches ?? []}
        summary={autoMatch.summary ?? {}}
        projects={projects}
        onUpdateSettings={actions.updateAutoMatchSettings}
        onCreateMatch={actions.createAutoMatch}
        onUpdateMatch={actions.updateAutoMatch}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'reviews') {
    return (
      <ProjectReviewsPanel
        entries={reviews.entries ?? []}
        summary={reviews.summary ?? {}}
        projects={projects}
        orders={purchasedGigs.orders ?? []}
        onCreateReview={actions.createProjectReview}
        canManage={canManage}
      />
    );
  }

  if (activeTab === 'escrow') {
    return (
      <EscrowManagementPanel
        account={escrow.account ?? {}}
        transactions={escrow.transactions ?? []}
        onCreateTransaction={actions.createEscrowTransaction}
        onUpdateSettings={actions.updateEscrowSettings}
        canManage={canManage}
      />
    );
  }

  return <EmptyPanel title="Choose a tab" />;
}

ProjectGigManagementSection.propTypes = {
  data: PropTypes.object,
  actions: PropTypes.shape({
    updateWorkspace: PropTypes.func,
    createProjectBid: PropTypes.func,
    updateProjectBid: PropTypes.func,
    sendProjectInvitation: PropTypes.func,
    updateProjectInvitation: PropTypes.func,
    updateAutoMatchSettings: PropTypes.func,
    createAutoMatch: PropTypes.func,
    updateAutoMatch: PropTypes.func,
    createProjectReview: PropTypes.func,
    createEscrowTransaction: PropTypes.func,
    updateEscrowSettings: PropTypes.func,
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  canManage: PropTypes.bool,
  onProjectPreview: PropTypes.func,
};

ProjectGigManagementSection.defaultProps = {
  data: null,
  canManage: false,
  onProjectPreview: undefined,
};
  activeView,
  onViewChange,
  onOpenProject,
  onOpenOrder,
  onOpenOrderDetail,
  onCreateTimeline,
  onEditTimeline,
  onLogSubmission,
  onEditSubmission,
  onStartChat,
  onEditOrder,
}) {
  const openOrders = data.purchasedGigs?.orders?.filter((order) => ['requirements', 'in_delivery', 'in_revision'].includes(order.status)) ?? [];
  const closedOrders = data.purchasedGigs?.orders?.filter((order) => !['requirements', 'in_delivery', 'in_revision'].includes(order.status)) ?? [];

  let viewContent = null;
  if (activeView === 'manage') {
    viewContent = (
      <ManageView summary={data.summary} board={data.managementBoard} onOpenProject={onOpenProject} onOpenOrder={onOpenOrder} />
    );
  } else if (activeView === 'create') {
    viewContent = (
      <CreateView
        onOpenProject={onOpenProject}
        onOpenOrder={onOpenOrder}
        onCreateTimeline={() => onCreateTimeline(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
        onLogSubmission={() => onLogSubmission(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
        onStartChat={() => onStartChat(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
      />
    );
  } else if (activeView === 'open') {
    viewContent = (
      <OrdersView
        title="Active gigs"
        orders={openOrders}
        onOpenOrder={(order) => {
          onOpenOrderDetail(order.id);
        }}
        onTimeline={(orderId) => onCreateTimeline(orderId)}
        onLog={(orderId) => onLogSubmission(orderId)}
        onEdit={(order) => onEditOrder(order)}
      />
    );
  } else if (activeView === 'closed') {
    viewContent = (
      <OrdersView
        title="Closed gigs"
        orders={closedOrders}
        onOpenOrder={(order) => {
          onOpenOrderDetail(order.id);
        }}
        onTimeline={(orderId) => onCreateTimeline(orderId)}
        onLog={(orderId) => onLogSubmission(orderId)}
        onEdit={(order) => onEditOrder(order)}
      />
    );
  } else if (activeView === 'timeline') {
    viewContent = <TimelineView timeline={data.purchasedGigs?.timeline ?? { upcoming: [], recent: [] }} onEdit={onEditTimeline} />;
  } else if (activeView === 'submit') {
    viewContent = <SubmissionView submissions={data.purchasedGigs?.submissions ?? { pending: [], recent: [] }} onEdit={onEditSubmission} />;
  } else if (activeView === 'chat') {
    viewContent = <ChatView chat={data.purchasedGigs?.chat ?? { recent: [] }} onReply={(orderId) => onStartChat(orderId)} />;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="flex w-full flex-row gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm lg:w-48 lg:flex-col">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeView === item.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex-1">
        <div className="min-h-[640px] rounded-3xl bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm">
          {viewContent}
        </div>
      </div>
    </div>
  );
}

ProjectGigManagementSection.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  canManage: PropTypes.bool.isRequired,
  viewOnlyNote: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  onOpenCreate: PropTypes.func.isRequired,
  onOpenGig: PropTypes.func.isRequired,
  onSelectProject: PropTypes.func.isRequired,
};
  data: PropTypes.object.isRequired,
  activeView: PropTypes.string.isRequired,
  onViewChange: PropTypes.func.isRequired,
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onOpenOrderDetail: PropTypes.func.isRequired,
  onCreateTimeline: PropTypes.func.isRequired,
  onEditTimeline: PropTypes.func.isRequired,
  onLogSubmission: PropTypes.func.isRequired,
  onEditSubmission: PropTypes.func.isRequired,
  onStartChat: PropTypes.func.isRequired,
  onEditOrder: PropTypes.func.isRequired,
};

