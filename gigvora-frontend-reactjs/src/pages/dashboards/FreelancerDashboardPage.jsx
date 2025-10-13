import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import projectsService from '../../services/projects.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const HEALTH_STYLES = {
  on_track: {
    label: 'On track',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  at_risk: {
    label: 'At risk',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  critical: {
    label: 'Critical',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};

const SPRINT_STATUS_MAP = {
  planned: { label: 'Planned', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  in_progress: { label: 'In progress', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  blocked: { label: 'Blocked', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  completed: { label: 'Completed', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const DEPENDENCY_STATUS_MAP = {
  pending: { label: 'Pending', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  in_progress: { label: 'In progress', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  blocked: { label: 'Blocked', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  done: { label: 'Resolved', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const RISK_STATUS_MAP = {
  open: { label: 'Open', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  monitoring: { label: 'Monitoring', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  mitigated: { label: 'Mitigated', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

const BILLING_STATUS_MAP = {
  upcoming: { label: 'Upcoming', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  invoiced: { label: 'Invoiced', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  paid: { label: 'Paid', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  overdue: { label: 'Overdue', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

const HEALTH_OPTIONS = Object.entries(HEALTH_STYLES).map(([value, config]) => ({ value, label: config.label }));
const SPRINT_STATUS_OPTIONS = Object.entries(SPRINT_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const DEPENDENCY_STATUS_OPTIONS = Object.entries(DEPENDENCY_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const RISK_STATUS_OPTIONS = Object.entries(RISK_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const BILLING_STATUS_OPTIONS = Object.entries(BILLING_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));

function StatusBadge({ status, map }) {
  const normalized = typeof status === 'string' ? status.toLowerCase() : '';
  const config = map[normalized] ?? {
    label: normalized || 'Unknown',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function MetricTile({ title, value, subtitle, tone = 'slate' }) {
  const toneStyles = {
    slate: 'border-slate-200 bg-white/80 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  };
  const toneClass = toneStyles[tone] ?? toneStyles.slate;
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function formatCurrency(amount, currency) {
  if (amount == null) {
    return 'TBC';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency ?? ''}`.trim();
  }
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const clamped = Math.max(0, Math.min(100, Math.round(numeric)));
  return `${clamped}%`;
}

function toFormState(blueprint) {
  if (!blueprint) {
    return null;
  }
  return {
    summary: blueprint.summary ?? '',
    methodology: blueprint.methodology ?? '',
    governanceModel: blueprint.governanceModel ?? '',
    sprintCadence: blueprint.sprintCadence ?? '',
    programManager: blueprint.programManager ?? '',
    healthStatus: blueprint.healthStatus ?? 'on_track',
    startDate: blueprint.startDate ?? null,
    endDate: blueprint.endDate ?? null,
    lastReviewedAt: blueprint.lastReviewedAt ?? null,
    metadata: blueprint.metadata ?? {},
    sprints: Array.isArray(blueprint.sprints) ? blueprint.sprints.map((item) => ({ ...item })) : [],
    dependencies: Array.isArray(blueprint.dependencies) ? blueprint.dependencies.map((item) => ({ ...item })) : [],
    risks: Array.isArray(blueprint.risks) ? blueprint.risks.map((item) => ({ ...item })) : [],
    billingCheckpoints: Array.isArray(blueprint.billingCheckpoints)
      ? blueprint.billingCheckpoints.map((item) => ({ ...item }))
      : [],
  };
}

export default function FreelancerDashboardPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [listError, setListError] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [blueprintData, setBlueprintData] = useState(null);
  const [formState, setFormState] = useState(null);
  const [blueprintError, setBlueprintError] = useState(null);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBlueprintList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const response = await projectsService.listProjectBlueprints();
      const items = Array.isArray(response?.blueprints) ? response.blueprints : [];
      setBlueprints(items);
      if (items.length) {
        const defaultProjectId = items[0]?.project?.id ?? items[0]?.blueprint?.projectId ?? null;
        setSelectedProjectId((current) => current ?? defaultProjectId);
      }
    } catch (error) {
      setListError(error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadBlueprintDetail = useCallback(async (projectId) => {
    if (!projectId) {
      setBlueprintData(null);
      setFormState(null);
      return;
    }
    setLoadingBlueprint(true);
    setBlueprintError(null);
    try {
      const response = await projectsService.fetchProjectBlueprint(projectId);
      setBlueprintData(response);
      setFormState(toFormState(response?.blueprint ?? null));
    } catch (error) {
      setBlueprintError(error);
      setFormState(null);
    } finally {
      setLoadingBlueprint(false);
    }
  }, []);

  useEffect(() => {
    loadBlueprintList();
  }, [loadBlueprintList]);

  useEffect(() => {
    if (selectedProjectId != null) {
      loadBlueprintDetail(selectedProjectId);
    }
  }, [selectedProjectId, loadBlueprintDetail]);

  const activeProject = blueprintData?.project ??
    blueprints.find((entry) => entry?.project?.id === selectedProjectId)?.project ?? null;
  const metrics = blueprintData?.metrics ?? {
    totalSprints: 0,
    completedSprints: 0,
    openRisks: 0,
    highSeverityRisks: 0,
    blockedDependencies: 0,
    upcomingBilling: null,
  };

  const hasBlueprint = Boolean(formState);
  const healthStatus = formState?.healthStatus ?? blueprintData?.blueprint?.healthStatus ?? 'on_track';
  const upcomingBilling = metrics.upcomingBilling ?? null;
  const lastUpdatedAt = blueprintData?.blueprint?.updatedAt ?? null;
  const lastReviewedAt = blueprintData?.blueprint?.lastReviewedAt ?? null;

  const handleProjectChange = (event) => {
    const value = event.target.value;
    setSelectedProjectId(value ? Number(value) : null);
  };

  const handleFormFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHealthChange = (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      healthStatus: value,
    }));
  };

  const handleSprintChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const sprints = prev.sprints.map((sprint, idx) =>
        idx === index
          ? {
              ...sprint,
              [field]: field === 'progress' || field === 'velocityCommitment' ? Number(value) : value,
            }
          : sprint,
      );
      return { ...prev, sprints };
    });
  };

  const handleDependencyChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const dependencies = prev.dependencies.map((dependency, idx) =>
        idx === index
          ? {
              ...dependency,
              [field]: value,
            }
          : dependency,
      );
      return { ...prev, dependencies };
    });
  };

  const handleRiskChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const risks = prev.risks.map((risk, idx) =>
        idx === index
          ? {
              ...risk,
              [field]: field === 'probability' || field === 'impact' ? Number(value) : value,
            }
          : risk,
      );
      return { ...prev, risks };
    });
  };

  const handleRiskReviewChange = (index, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const risks = prev.risks.map((risk, idx) =>
        idx === index
          ? {
              ...risk,
              nextReviewAt: value ? new Date(value).toISOString() : null,
            }
          : risk,
      );
      return { ...prev, risks };
    });
  };

  const handleBillingChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const billingCheckpoints = prev.billingCheckpoints.map((checkpoint, idx) =>
        idx === index
          ? {
              ...checkpoint,
              [field]: value,
            }
          : checkpoint,
      );
      return { ...prev, billingCheckpoints };
    });
  };

  const handleReset = () => {
    if (!blueprintData?.blueprint) {
      return;
    }
    setFormState(toFormState(blueprintData.blueprint));
  };

  const handleSave = async () => {
    if (!formState || !selectedProjectId) {
      return;
    }
    setSaving(true);
    setBlueprintError(null);
    try {
      const payload = {
        summary: formState.summary,
        methodology: formState.methodology,
        governanceModel: formState.governanceModel,
        sprintCadence: formState.sprintCadence,
        programManager: formState.programManager,
        healthStatus: formState.healthStatus,
        startDate: formState.startDate,
        endDate: formState.endDate,
        lastReviewedAt: new Date().toISOString(),
        metadata: formState.metadata,
        sprints: formState.sprints.map((sprint) => ({
          id: sprint.id,
          sequence: sprint.sequence,
          name: sprint.name,
          objective: sprint.objective,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          status: sprint.status,
          owner: sprint.owner,
          velocityCommitment: sprint.velocityCommitment,
          progress: sprint.progress,
          deliverables: sprint.deliverables,
          acceptanceCriteria: sprint.acceptanceCriteria,
        })),
        dependencies: formState.dependencies.map((dependency) => ({
          id: dependency.id,
          name: dependency.name,
          description: dependency.description,
          dependencyType: dependency.dependencyType,
          status: dependency.status,
          riskLevel: dependency.riskLevel,
          owner: dependency.owner,
          dueDate: dependency.dueDate,
          impact: dependency.impact,
          notes: dependency.notes,
          impactedSprintId: dependency.impactedSprintId,
        })),
        risks: formState.risks.map((risk) => ({
          id: risk.id,
          title: risk.title,
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          status: risk.status,
          owner: risk.owner,
          mitigationPlan: risk.mitigationPlan,
          contingencyPlan: risk.contingencyPlan,
          nextReviewAt: risk.nextReviewAt,
          tags: risk.tags,
        })),
        billingCheckpoints: formState.billingCheckpoints.map((checkpoint) => ({
          id: checkpoint.id,
          name: checkpoint.name,
          description: checkpoint.description,
          billingType: checkpoint.billingType,
          amount: checkpoint.amount,
          currency: checkpoint.currency,
          dueDate: checkpoint.dueDate,
          status: checkpoint.status,
          approvalRequired: checkpoint.approvalRequired,
          invoiceUrl: checkpoint.invoiceUrl,
          notes: checkpoint.notes,
          relatedSprintId: checkpoint.relatedSprintId,
        })),
        actorId: 1,
      };

      await projectsService.upsertProjectBlueprint(selectedProjectId, payload);
      await loadBlueprintDetail(selectedProjectId);
    } catch (error) {
      setBlueprintError(error);
    } finally {
      setSaving(false);
    }
  };

  const metricsTiles = useMemo(() => {
    const blockedTone = metrics.blockedDependencies > 0 ? 'rose' : 'slate';
    const riskTone = metrics.highSeverityRisks > 0 ? 'amber' : 'slate';
    const billingTone = upcomingBilling && upcomingBilling.status === 'overdue' ? 'rose' : 'indigo';

    return [
      {
        title: 'Delivery progress',
        value: `${metrics.completedSprints}/${metrics.totalSprints}`,
        subtitle: 'Sprints completed',
        tone: 'emerald',
      },
      {
        title: 'Open risks',
        value: `${metrics.openRisks}`,
        subtitle: `${metrics.highSeverityRisks} high severity`,
        tone: riskTone,
      },
      {
        title: 'Blocked dependencies',
        value: `${metrics.blockedDependencies}`,
        subtitle: 'Needs unblocking',
        tone: blockedTone,
      },
      {
        title: 'Next billing',
        value: upcomingBilling ? formatCurrency(upcomingBilling.amount, upcomingBilling.currency) : 'No invoices',
        subtitle: upcomingBilling?.dueDate
          ? `Due ${formatRelativeTime(upcomingBilling.dueDate)}`
          : 'Awaiting scheduling',
        tone: billingTone,
      },
    ];
  }, [metrics, upcomingBilling]);

  const renderSprints = () => {
    if (!formState?.sprints?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          Add sprints to map velocity and delivery focus areas.
        </div>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {formState.sprints.map((sprint, index) => (
          <div
            key={sprint.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sprint {sprint.sequence}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{sprint.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {sprint.startDate ? formatAbsolute(sprint.startDate, { dateStyle: 'medium' }) : 'TBC'} →{' '}
                  {sprint.endDate ? formatAbsolute(sprint.endDate, { dateStyle: 'medium' }) : 'TBC'}
                </p>
              </div>
              <StatusBadge status={sprint.status} map={SPRINT_STATUS_MAP} />
            </div>
            {sprint.objective ? <p className="mt-3 text-sm text-slate-600">{sprint.objective}</p> : null}
            {Array.isArray(sprint.deliverables) && sprint.deliverables.length ? (
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {sprint.deliverables.map((item, deliverableIndex) => (
                  <li key={deliverableIndex} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={sprint.status}
                  onChange={(event) => handleSprintChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {SPRINT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Progress
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Number(sprint.progress ?? 0)}
                  onChange={(event) => handleSprintChange(index, 'progress', event.target.value)}
                  className="w-full accent-accent"
                />
                <span className="text-xs text-slate-500">{formatPercent(sprint.progress)}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDependencies = () => {
    if (!formState?.dependencies?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          No dependencies logged. Map integration points to stay ahead of blockers.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.dependencies.map((dependency, index) => (
          <div
            key={dependency.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{dependency.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {dependency.owner || 'TBC'} • Due {dependency.dueDate ? formatRelativeTime(dependency.dueDate) : 'soon'}
                </p>
                {dependency.description ? (
                  <p className="mt-2 text-sm text-slate-600">{dependency.description}</p>
                ) : null}
                {dependency.impact ? (
                  <p className="mt-2 text-xs text-slate-500">Impact: {dependency.impact}</p>
                ) : null}
              </div>
              <StatusBadge status={dependency.status} map={DEPENDENCY_STATUS_MAP} />
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={dependency.status}
                  onChange={(event) => handleDependencyChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {DEPENDENCY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Linked sprint: {dependency.impactedSprintId ? `#${dependency.impactedSprintId}` : 'Unassigned'} • Risk level: {dependency.riskLevel}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRisks = () => {
    if (!formState?.risks?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          Risk log is clear. Keep recording mitigations to maintain governance trail.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.risks.map((risk, index) => (
          <div
            key={risk.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{risk.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {risk.owner || 'Unassigned'} • Next review {risk.nextReviewAt ? formatRelativeTime(risk.nextReviewAt) : 'TBC'}
                </p>
                {risk.description ? <p className="mt-2 text-sm text-slate-600">{risk.description}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Probability: {risk.probability}%</span>
                  <span>Impact: {risk.impact}%</span>
                  <span>Severity: {formatPercent(risk.severityScore)}</span>
                </div>
                {Array.isArray(risk.tags) && risk.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {risk.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {risk.mitigationPlan ? (
                  <p className="mt-3 text-xs text-slate-500">Mitigation: {risk.mitigationPlan}</p>
                ) : null}
                {risk.contingencyPlan ? (
                  <p className="mt-2 text-xs text-slate-500">Contingency: {risk.contingencyPlan}</p>
                ) : null}
              </div>
              <StatusBadge status={risk.status} map={RISK_STATUS_MAP} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={risk.status}
                  onChange={(event) => handleRiskChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {RISK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Next review (local time)
                <input
                  type="datetime-local"
                  value={risk.nextReviewAt ? risk.nextReviewAt.slice(0, 16) : ''}
                  onChange={(event) => handleRiskReviewChange(index, event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBilling = () => {
    if (!formState?.billingCheckpoints?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          No billing checkpoints recorded yet. Tie milestones to invoicing to protect cash flow.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.billingCheckpoints.map((checkpoint, index) => (
          <div
            key={checkpoint.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{checkpoint.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {checkpoint.billingType.toUpperCase()} • Related sprint {checkpoint.relatedSprintId || 'TBC'}
                </p>
                <p className="mt-2 text-sm text-slate-600">{checkpoint.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{formatCurrency(checkpoint.amount, checkpoint.currency)}</span>
                  <span>Due {checkpoint.dueDate ? formatAbsolute(checkpoint.dueDate, { dateStyle: 'medium' }) : 'TBC'}</span>
                  <span>{checkpoint.approvalRequired ? 'Approval required' : 'Auto billable'}</span>
                </div>
                {checkpoint.notes ? <p className="mt-2 text-xs text-slate-500">Notes: {checkpoint.notes}</p> : null}
                {checkpoint.invoiceUrl ? (
                  <a
                    href={checkpoint.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accentDark"
                  >
                    View invoice ↗
                  </a>
                ) : null}
              </div>
              <StatusBadge status={checkpoint.status} map={BILLING_STATUS_MAP} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={checkpoint.status}
                  onChange={(event) => handleBillingChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {BILLING_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          eyebrow="Freelancer dashboard"
          title={activeProject?.title ? `${activeProject.title} delivery hub` : 'Project management control centre'}
          description="Translate commitments into accountable sprints, unblock dependencies, and keep billing aligned with delivery cadence."
          meta={
            <DataStatus
              loading={loadingBlueprint || saving}
              fromCache={false}
              lastUpdated={lastUpdatedAt}
              onRefresh={() => selectedProjectId && loadBlueprintDetail(selectedProjectId)}
            />
          }
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="project-selector">
              Active program
            </label>
            <select
              id="project-selector"
              value={selectedProjectId ?? ''}
              onChange={handleProjectChange}
              className="w-full min-w-[220px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 md:w-auto"
            >
              {blueprints.map((entry) => {
                const id = entry.project?.id ?? entry.blueprint?.projectId ?? '';
                return (
                  <option key={id} value={id}>
                    {entry.project?.title ?? `Project ${entry.blueprint?.projectId}`}
                  </option>
                );
              })}
              {!blueprints.length ? <option value="">No blueprints yet</option> : null}
            </select>
            {loadingList ? <span className="text-xs text-slate-400">Loading blueprint index…</span> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasBlueprint || saving || loadingBlueprint}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasBlueprint || saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save blueprint'}
            </button>
          </div>
        </div>

        {listError ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Unable to load blueprint directory. {listError.message || 'Please retry or refresh the page.'}
          </div>
        ) : null}
        {blueprintError ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Unable to load the blueprint detail. {blueprintError.message || 'Please try again or refresh the page.'}
          </div>
        ) : null}

        {loadingBlueprint ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
            ))}
          </div>
        ) : hasBlueprint ? (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricsTiles.map((tile) => (
                <MetricTile key={tile.title} {...tile} />
              ))}
            </div>

            <section className="mb-8 rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Program summary</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Keep stakeholders aligned with a living blueprint that tracks methodology, cadence, and ownership in one place.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Last reviewed {lastReviewedAt ? formatRelativeTime(lastReviewedAt) : 'not yet recorded'}
                  </p>
                </div>
                <StatusBadge status={healthStatus} map={HEALTH_STYLES} />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <label className="lg:col-span-2 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                  Overview
                  <textarea
                    value={formState.summary}
                    onChange={handleFormFieldChange('summary')}
                    rows={4}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Describe the blueprint focus, goals, and success measures."
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Methodology
                    <input
                      type="text"
                      value={formState.methodology}
                      onChange={handleFormFieldChange('methodology')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="dual-track agile"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Governance model
                    <input
                      type="text"
                      value={formState.governanceModel}
                      onChange={handleFormFieldChange('governanceModel')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="weekly_governance_forum"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Sprint cadence
                    <input
                      type="text"
                      value={formState.sprintCadence}
                      onChange={handleFormFieldChange('sprintCadence')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="bi-weekly"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Program manager
                    <input
                      type="text"
                      value={formState.programManager}
                      onChange={handleFormFieldChange('programManager')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Mia Operations"
                    />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Health status
                    <select
                      value={formState.healthStatus}
                      onChange={handleHealthChange}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {HEALTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section className="mb-10 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Sprint timeline</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Track how each sprint is pacing against objectives, deliverables, and stakeholder expectations.
                </p>
                <div className="mt-4">{renderSprints()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Dependency watchlist</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Resolve blockers before they impact downstream milestones. Owners receive automated nudges when status changes.
                </p>
                <div className="mt-4">{renderDependencies()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Risk & issue log</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Maintain a real-time governance record with probability, impact, and mitigation plans for every risk.
                </p>
                <div className="mt-4">{renderRisks()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Billing checkpoints</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Sync delivery milestones with invoicing so finance, compliance, and stakeholders stay perfectly aligned.
                </p>
                <div className="mt-4">{renderBilling()}</div>
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-sm text-slate-500">
            No blueprint is configured for this project yet. Create sprints, dependencies, risks, and billing checkpoints to unlock delivery automation.
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
