import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
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
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
          <p className="text-sm font-semibold text-slate-900">{formatPercent(progress)}</p>
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
        </div>
      </div>
    </section>
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
