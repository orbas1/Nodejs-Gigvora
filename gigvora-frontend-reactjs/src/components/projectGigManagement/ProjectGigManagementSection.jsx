import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function formatNumber(value, { fractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
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

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}/5`;
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) {
    return '0 KB';
  }
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function Badge({ children, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-accentSoft text-accent border-accent/40',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        toneClasses[tone] || toneClasses.default
      }`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'accent', 'success', 'warning', 'danger']),
};

function MetricCard({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:border-accent/40 hover:shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  description: PropTypes.string,
};

function ProjectCard({ entry }) {
  const status = formatStatus(entry.workspace?.status ?? entry.project?.status);
  const progress = entry.workspace?.progressPercent;
  const riskLevel = entry.workspace?.riskLevel ?? 'low';
  const riskTone = riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'accent';
  const dueAt = entry.timeline?.nextMilestoneDueAt;
  const collaborators = entry.collaboratorSummary ?? { active: 0, invited: 0 };
  const approvalsPending = entry.communications?.pendingApprovals ?? 0;
  const unreadMessages = entry.communications?.unreadMessages ?? 0;
  const budget = entry.budget ?? {};

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{entry.project?.title ?? 'Project'}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone="accent">{status}</Badge>
            <Badge tone={riskTone}>{`Risk: ${formatStatus(riskLevel)}`}</Badge>
            {entry.workspace?.nextMilestone ? <Badge>{entry.workspace.nextMilestone}</Badge> : null}
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          {dueAt ? `Next milestone ${formatRelativeTime(dueAt)}` : 'No upcoming milestone'}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
          <p className="text-sm font-semibold text-slate-900">{formatPercent(progress)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Collaborators</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatNumber(collaborators.active)} active
            <span className="text-xs font-normal text-slate-500"> · {formatNumber(collaborators.invited)} invited</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Approvals</p>
          <p className="text-sm font-semibold text-slate-900">{formatNumber(approvalsPending)} pending</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Inbox</p>
          <p className="text-sm font-semibold text-slate-900">{formatNumber(unreadMessages)} unread</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget allocated</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budget.allocated, budget.currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget spent</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budget.spent, budget.currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Burn rate</p>
          <p className="text-sm font-semibold text-slate-900">
            {budget.burnRatePercent != null ? formatPercent(budget.burnRatePercent) : '—'}
          </p>
        </div>
      </div>

      {entry.milestones?.length ? (
        <div className="mt-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Milestone highlights</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.milestones.slice(0, 3).map((milestone) => (
              <Badge key={milestone.id} tone={milestone.status === 'completed' ? 'success' : 'default'}>
                {milestone.title}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

ProjectCard.propTypes = {
  entry: PropTypes.shape({
    project: PropTypes.object,
    workspace: PropTypes.object,
    collaboratorSummary: PropTypes.object,
    communications: PropTypes.object,
    timeline: PropTypes.object,
    budget: PropTypes.object,
    milestones: PropTypes.array,
  }).isRequired,
};

function TemplateCard({ template }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
          <p className="text-xs text-slate-500">{formatStatus(template.category)}</p>
        </div>
        {template.isFeatured ? <Badge tone="accent">Featured</Badge> : null}
      </div>
      {template.summary ? <p className="mt-2 text-xs text-slate-500">{template.summary}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        {template.durationWeeks ? <Badge>{`${template.durationWeeks} wks`}</Badge> : null}
        {Array.isArray(template.integrations)
          ? template.integrations.slice(0, 3).map((integration) => <Badge key={integration}>{integration}</Badge>)
          : null}
      </div>
    </div>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    summary: PropTypes.string,
    durationWeeks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    integrations: PropTypes.array,
    isFeatured: PropTypes.bool,
  }).isRequired,
};

function AssetRow({ asset }) {
  const watermarkEnabled = Boolean(asset.watermarkSettings?.enabled);
  const allowDownload = asset.permissions?.allowDownload !== false;
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{asset.name ?? asset.filename ?? 'Asset'}</p>
        <p className="text-xs text-slate-500">{asset.projectTitle ?? 'Workspace asset'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Storage</p>
        <p className="text-sm font-semibold text-slate-900">{asset.storageProvider ?? 'internal'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Permissions</p>
        <p className="text-sm font-semibold text-slate-900">{allowDownload ? 'Downloadable' : 'View only'}</p>
        <p className="text-[11px] text-slate-500">
          {Array.isArray(asset.permissions?.allowedRoles) && asset.permissions.allowedRoles.length
            ? asset.permissions.allowedRoles.join(', ')
            : 'Restricted roles'}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Watermark</p>
        <p className="text-sm font-semibold text-slate-900">{watermarkEnabled ? 'Enabled' : 'Disabled'}</p>
        <p className="text-[11px] text-slate-500">{formatFileSize(asset.sizeBytes)}</p>
      </div>
    </div>
  );
}

AssetRow.propTypes = {
  asset: PropTypes.shape({
    name: PropTypes.string,
    filename: PropTypes.string,
    projectTitle: PropTypes.string,
    storageProvider: PropTypes.string,
    permissions: PropTypes.object,
    watermarkSettings: PropTypes.object,
    sizeBytes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

function ReminderRow({ reminder }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
        <Badge tone="warning">{reminder.type ?? 'delivery'}</Badge>
        <span className="font-semibold">Order {reminder.orderNumber}</span>
        {reminder.daysUntilDue != null ? <span>{`${reminder.daysUntilDue} days`}</span> : null}
      </div>
      <p className="text-sm font-semibold text-slate-900">{reminder.title}</p>
      <p className="text-xs text-slate-500">
        {reminder.dueAt ? `Due ${formatRelativeTime(reminder.dueAt)}` : 'No due date provided'} ·{' '}
        {reminder.gigTitle ?? 'Vendor engagement'}
      </p>
      {reminder.notes ? <p className="text-xs text-slate-500">{reminder.notes}</p> : null}
    </div>
  );
}

ReminderRow.propTypes = {
  reminder: PropTypes.shape({
    orderNumber: PropTypes.string,
    title: PropTypes.string,
    dueAt: PropTypes.string,
    daysUntilDue: PropTypes.number,
    type: PropTypes.string,
    notes: PropTypes.string,
    gigTitle: PropTypes.string,
  }).isRequired,
};

function ScorecardRow({ scorecard }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{scorecard.vendorName ?? 'Vendor'}</span>
        {scorecard.reviewedAt ? <span>{formatAbsolute(scorecard.reviewedAt)}</span> : null}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">Order {scorecard.orderNumber}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Overall</p>
          <p className="text-sm font-semibold text-slate-900">{formatScore(scorecard.overallScore)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Risk level</p>
          <p className="text-sm font-semibold text-slate-900">{formatStatus(scorecard.riskLevel)}</p>
        </div>
      </div>
      {scorecard.notes ? <p className="mt-3 text-xs text-slate-500">{scorecard.notes}</p> : null}
    </div>
  );
}

ScorecardRow.propTypes = {
  scorecard: PropTypes.shape({
    vendorName: PropTypes.string,
    orderNumber: PropTypes.string,
    reviewedAt: PropTypes.string,
    overallScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    riskLevel: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
};

function AchievementCard({ achievement }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={achievement.source === 'project' ? 'accent' : 'success'}>{achievement.source}</Badge>
        {achievement.deliveredAt ? (
          <span className="text-xs text-slate-500">{formatRelativeTime(achievement.deliveredAt)}</span>
        ) : null}
      </div>
      <h4 className="mt-3 text-sm font-semibold text-slate-900">{achievement.title}</h4>
      <p className="mt-2 text-xs text-slate-500">{achievement.bullet}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        {achievement.metrics?.progressPercent != null ? (
          <Badge>{formatPercent(achievement.metrics.progressPercent)}</Badge>
        ) : null}
        {achievement.metrics?.csat != null ? <Badge>{`CSAT ${formatScore(achievement.metrics.csat)}`}</Badge> : null}
        {achievement.recommendedChannel ? <Badge tone="accent">{achievement.recommendedChannel}</Badge> : null}
      </div>
    </div>
  );
}

AchievementCard.propTypes = {
  achievement: PropTypes.shape({
    source: PropTypes.string,
    deliveredAt: PropTypes.string,
    title: PropTypes.string,
    bullet: PropTypes.string,
    metrics: PropTypes.object,
    recommendedChannel: PropTypes.string,
  }).isRequired,
};

function QuickExportGroup({ title, items }) {
  if (!items.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

QuickExportGroup.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default function ProjectGigManagementSection({ data }) {
  const summary = data?.summary ?? {
    totalProjects: 0,
    activeProjects: 0,
    budgetInPlay: 0,
    currency: 'USD',
    gigsInDelivery: 0,
    templatesAvailable: 0,
    assetsSecured: 0,
    vendorSatisfaction: null,
    storiesReady: 0,
  };

  const projectCreation = data?.projectCreation ?? { projects: [], templates: [] };
  const assets = data?.assets ?? { items: [], summary: {} };
  const managementBoard = data?.managementBoard ?? { lanes: [], metrics: {}, integrations: [], retrospectives: [] };
  const purchasedGigs = data?.purchasedGigs ?? { orders: [], reminders: [], scorecards: [], stats: {} };
  const storytelling = data?.storytelling ?? { achievements: [], quickExports: {}, prompts: [] };

  const assetSummary = assets.summary ?? {};
  const orders = Array.isArray(purchasedGigs.orders) ? purchasedGigs.orders : [];
  const reminders = Array.isArray(purchasedGigs.reminders) ? purchasedGigs.reminders : [];
  const scorecards = Array.isArray(purchasedGigs.scorecards) ? purchasedGigs.scorecards : [];
  const achievements = Array.isArray(storytelling.achievements) ? storytelling.achievements : [];
  const quickExports = storytelling.quickExports ?? {};
  const prompts = Array.isArray(storytelling.prompts) ? storytelling.prompts : [];

  const riskDistribution = useMemo(() => {
    const distribution = managementBoard.metrics?.riskDistribution ?? {};
    return Object.entries(distribution).map(([label, count]) => ({ label: formatStatus(label), count }));
  }, [managementBoard.metrics]);

  const integrations = Array.isArray(managementBoard.integrations) ? managementBoard.integrations : [];
  const retrospectives = Array.isArray(managementBoard.retrospectives) ? managementBoard.retrospectives : [];

  const topAssets = useMemo(() => (Array.isArray(assets.items) ? assets.items.slice(0, 6) : []), [assets.items]);
  const boardLanes = Array.isArray(managementBoard.lanes) ? managementBoard.lanes : [];
  const templateList = Array.isArray(projectCreation.templates) ? projectCreation.templates.slice(0, 6) : [];
  const projectList = Array.isArray(projectCreation.projects) ? projectCreation.projects.slice(0, 3) : [];

  const summaryMetrics = [
    {
      label: 'Active projects',
      value: formatNumber(summary.activeProjects ?? 0),
      description: 'In delivery or at-risk initiatives',
    },
    {
      label: 'Budget in play',
      value: formatCurrency(summary.budgetInPlay, summary.currency),
      description: 'Across tracked initiatives',
    },
    {
      label: 'Gigs in delivery',
      value: formatNumber(summary.gigsInDelivery ?? 0),
      description: 'Vendor deliverables underway',
    },
    {
      label: 'Templates available',
      value: formatNumber(summary.templatesAvailable ?? templateList.length ?? 0),
      description: 'Launch-ready playbooks',
    },
    {
      label: 'Assets secured',
      value: formatNumber(summary.assetsSecured ?? assetSummary.total ?? 0),
      description: `${formatNumber(assetSummary.watermarked ?? 0)} watermarked`,
    },
    {
      label: 'Stories ready',
      value: formatNumber(summary.storiesReady ?? achievements.length ?? 0),
      description: 'CV and LinkedIn achievements',
    },
  ];

  return (
    <section id="project-gig-management" className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Project & gig management</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Launch initiatives & orchestrate gig delivery</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Kick off personal projects, collaborate with mentors or freelancers, secure assets with watermarking, and
              convert every milestone into resume-ready storytelling.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-accent/30 bg-white/80 p-4 text-sm text-slate-700 shadow-inner sm:grid-cols-3 lg:max-w-xl">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total projects</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(summary.totalProjects ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Vendor CSAT</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {summary.vendorSatisfaction != null ? formatScore(summary.vendorSatisfaction) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget in play</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(summary.budgetInPlay, summary.currency)}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryMetrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} description={metric.description} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-7">
        <div id="project-gig-creation" className="space-y-4 xl:col-span-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Project creation workspace</h3>
              <p className="text-sm text-slate-600">
                Structure briefs, milestones, and collaborator cadences for your flagship initiatives.
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {projectCreation.projects?.length ? `${projectCreation.projects.length} workspaces` : 'No active workspaces yet'}
            </span>
          </div>
          <div className="space-y-4">
            {projectList.length ? (
              projectList.map((project) => <ProjectCard key={project.project?.id ?? project.projectId} entry={project} />)
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                No recent project workspaces yet. Start by launching a brief or inviting a collaborator.
              </div>
            )}
          </div>
        </div>

        <div id="project-gig-templates" className="space-y-4 xl:col-span-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Template gallery</h3>
            <p className="text-sm text-slate-600">
              Spin up hackathons, bootcamps, and consulting gigs with proven blueprints.
            </p>
          </div>
          <div className="space-y-3">
            {templateList.length ? (
              templateList.map((template) => <TemplateCard key={template.id ?? template.name} template={template} />)
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                Templates seed as you connect GitHub, Notion, Figma, or cloud drives.
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="project-gig-assets" className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Asset repository</h3>
              <p className="text-sm text-slate-600">Granular permissions, watermarking, and compliance ready exports.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Assets</p>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(assetSummary.total ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Watermarked</p>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(assetSummary.watermarked ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Restricted</p>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(assetSummary.restricted ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Storage</p>
                <p className="text-sm font-semibold text-slate-900">{formatFileSize(assetSummary.totalSizeBytes)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {topAssets.length ? (
              topAssets.map((asset) => <AssetRow key={asset.id ?? asset.name} asset={asset} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Upload project assets to manage watermarking and collaborator permissions.
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="project-gig-board" className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Project management board</h3>
              <p className="text-sm text-slate-600">Visualise progress, risks, integrations, and retrospectives in one board.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Average progress</p>
                <p className="text-sm font-semibold text-slate-900">{formatPercent(managementBoard.metrics?.averageProgress)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Velocity score</p>
                <p className="text-sm font-semibold text-slate-900">
                  {managementBoard.metrics?.velocityAverage != null
                    ? formatNumber(managementBoard.metrics.velocityAverage, { fractionDigits: 1 })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Active projects</p>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(managementBoard.metrics?.activeProjects ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            {riskDistribution.length ? (
              riskDistribution.map((entry) => (
                <Badge key={entry.label} tone={entry.label.includes('High') ? 'danger' : 'default'}>
                  {entry.label}: {formatNumber(entry.count)}
                </Badge>
              ))
            ) : (
              <Badge>No risk signals captured yet</Badge>
            )}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {boardLanes.length ? (
              boardLanes.map((lane) => (
                <div key={lane.id} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lane.label}</p>
                      <p className="text-xs text-slate-500">{formatNumber(lane.items?.length ?? 0)} initiatives</p>
                    </div>
                    <Badge tone="accent">{formatPercent(lane.averageProgress)}</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {lane.items?.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatStatus(item.status)} · {formatPercent(item.progressPercent)}
                        </p>
                        {item.nextMilestone ? (
                          <p className="text-[11px] text-slate-500">
                            Next: {item.nextMilestone}
                            {item.nextMilestoneDueAt ? ` • ${formatRelativeTime(item.nextMilestoneDueAt)}` : ''}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                Connect your project workspaces to populate kanban lanes and velocity metrics.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Delivery integrations</h4>
            <p className="mt-2 text-sm text-slate-600">Track GitHub, Notion, Figma, and cloud drive sync health.</p>
            <div className="mt-4 space-y-3">
              {integrations.length ? (
                integrations.map((integration) => (
                  <div key={integration.provider} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{formatStatus(integration.provider)}</span>
                      {integration.lastSyncedAt ? (
                        <span className="text-xs text-slate-500">Synced {formatRelativeTime(integration.lastSyncedAt)}</span>
                      ) : null}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                      <span>Connected {formatNumber(integration.connected ?? 0)}</span>
                      <span>Syncing {formatNumber(integration.syncing ?? 0)}</span>
                      <span>Failing {formatNumber(integration.failing ?? 0)}</span>
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                      {formatNumber(integration.projectCount ?? 0)} projects linked
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  Integrations will appear once repositories or documents sync with project workspaces.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Retrospective reports</h4>
            <p className="mt-2 text-sm text-slate-600">Automatic milestone retros for storytelling and governance.</p>
            <div className="mt-4 space-y-3">
              {retrospectives.length ? (
                retrospectives.slice(0, 4).map((retro) => (
                  <div key={retro.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{retro.projectTitle ?? retro.milestone?.title ?? 'Retrospective'}</p>
                    <p className="text-xs text-slate-500">
                      {retro.generatedAt ? formatRelativeTime(retro.generatedAt) : 'Recently generated'} ·{' '}
                      {retro.authoredBy?.name ?? retro.authoredBy?.email ?? 'Auto generated'}
                    </p>
                    {retro.highlights?.length ? (
                      <p className="mt-2 text-xs text-slate-500">{retro.highlights[0]}</p>
                    ) : retro.summary ? (
                      <p className="mt-2 text-xs text-slate-500">{retro.summary}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  Retrospectives auto-generate when milestones complete and metrics are logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="project-gig-purchased" className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Purchased gig operations</h3>
              <p className="text-sm text-slate-600">
                Track milestones, release escrows, and review vendors powering your deliverables.
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {orders.length ? `${orders.length} recent orders` : 'No active gig orders'}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total orders" value={formatNumber(purchasedGigs.stats?.totalOrders ?? orders.length ?? 0)} />
            <MetricCard
              label="Active"
              value={formatNumber(orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length)}
            />
            <MetricCard
              label="Avg. progress"
              value={formatPercent(
                orders.length
                  ? orders.reduce((sum, order) => sum + Number(order.progressPercent ?? 0), 0) / orders.length
                  : 0,
              )}
            />
            <MetricCard
              label="Vendor CSAT"
              value={
                purchasedGigs.stats?.averages?.overall != null
                  ? formatScore(purchasedGigs.stats.averages.overall)
                  : '—'
              }
            />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Order watchlist</h4>
              {orders.length ? (
                orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{order.gig?.title ?? 'Vendor engagement'}</span>
                      <Badge tone="accent">{formatStatus(order.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Order {order.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      Next due {order.nextRequirementDueAt ? formatRelativeTime(order.nextRequirementDueAt) : 'TBC'} ·{' '}
                      {formatPercent(order.progressPercent)} complete
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                      <Badge tone="warning">{formatNumber(order.outstandingRequirements ?? 0)} requirements</Badge>
                      <Badge tone="default">{formatNumber(order.activeRevisions ?? 0)} revisions</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  Purchase gig services to unlock escrow controls and vendor scorecards.
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Compliance & reminders</h4>
              {reminders.length ? (
                reminders.map((reminder) => <ReminderRow key={reminder.id} reminder={reminder} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-700">
                  No outstanding compliance or delivery reminders.
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Vendor scorecards</h4>
            {scorecards.length ? (
              scorecards.slice(0, 4).map((scorecard) => <ScorecardRow key={scorecard.id ?? scorecard.orderId} scorecard={scorecard} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                Vendor performance insights will surface after your first review.
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="project-gig-storytelling" className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">CV-ready storytelling</h3>
              <p className="text-sm text-slate-600">
                Translate delivered impact into resume bullets, cover letters, and social proof.
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {achievements.length ? `${achievements.length} achievements` : 'No achievements yet'}
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {achievements.length ? (
              achievements.slice(0, 6).map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                Complete project milestones or approve gig deliverables to unlock storytelling prompts.
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <QuickExportGroup title="Resume bullets" items={Array.isArray(quickExports.resumeBullets) ? quickExports.resumeBullets : []} />
            <QuickExportGroup title="Cover letter ideas" items={Array.isArray(quickExports.coverLetters) ? quickExports.coverLetters : []} />
            <QuickExportGroup title="LinkedIn updates" items={Array.isArray(quickExports.linkedinPosts) ? quickExports.linkedinPosts : []} />
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-900">Achievement assistant prompts</h4>
            <div className="mt-3 space-y-3">
              {prompts.length ? (
                prompts.map((prompt) => (
                  <div key={prompt.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{prompt.title}</p>
                    <p className="text-xs text-slate-600">{prompt.prompt}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  Generate story prompts by logging milestone retrospectives or vendor reviews.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ProjectGigManagementSection.propTypes = {
  data: PropTypes.object,
};

ProjectGigManagementSection.defaultProps = {
  data: null,
};
