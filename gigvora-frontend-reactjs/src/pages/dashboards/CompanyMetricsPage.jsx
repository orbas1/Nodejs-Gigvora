import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanyMetricsDashboard } from '../../hooks/useCompanyMetricsDashboard.js';
import {
  createCompanyMetricGoal,
  updateCompanyMetricGoal,
  deleteCompanyMetricGoal,
  recordCompanyMetricSnapshot,
  resolveCompanyMetricAlert,
} from '../../services/companyMetrics.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 180];
const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'headhunter', 'agency', 'user'];

function StatCard({ label, value, helper, tone }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${
        tone === 'positive'
          ? 'border-emerald-200 bg-emerald-50'
          : tone === 'negative'
          ? 'border-rose-200 bg-rose-50'
          : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? '—'}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function TrendList({ title, icon: Icon, items }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {safeItems.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GoalProgressBar({ progress }) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-accent" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default function CompanyMetricsPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = Number.parseInt(searchParams.get('lookback'), 10);
  const selectedWorkspaceId = workspaceIdParam && `${workspaceIdParam}`.length ? workspaceIdParam : undefined;
  const lookbackDays = LOOKBACK_OPTIONS.includes(lookbackParam) ? lookbackParam : 30;

  const {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    summaryCards,
    trendSeries,
    forecast,
    goals,
    snapshots,
    alerts,
    workspace,
    workspaceOptions,
    metrics,
  } = useCompanyMetricsDashboard(
    { workspaceId: selectedWorkspaceId, lookbackDays },
    { enabled: isAuthenticated && isCompanyMember },
  );

  const [feedback, setFeedback] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: '',
    metric: '',
    targetValue: '',
    unit: '',
    ownerEmail: '',
    dueDate: '',
    description: '',
    saving: false,
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [snapshotForm, setSnapshotForm] = useState({ goalId: '', value: '', occurredAt: '', notes: '', saving: false });

  const workspaceIdForMutations = selectedWorkspaceId ?? workspace?.id ?? undefined;

  const handleWorkspaceChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('workspaceId', value);
      } else {
        next.delete('workspaceId');
      }
      return next;
    }, { replace: true });
  };

  const handleLookbackChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('lookback', `${value}`);
      return next;
    }, { replace: true });
  };

  const handleGoalSubmit = async (event) => {
    event.preventDefault();
    if (!goalForm.name || !goalForm.metric || !goalForm.targetValue) {
      setFeedback({ type: 'error', message: 'Add a goal name, metric, and target value.' });
      return;
    }
    setGoalForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await createCompanyMetricGoal({
        workspaceId: workspaceIdForMutations,
        name: goalForm.name,
        metric: goalForm.metric,
        targetValue: Number(goalForm.targetValue),
        unit: goalForm.unit || undefined,
        ownerEmail: goalForm.ownerEmail || undefined,
        dueDate: goalForm.dueDate || undefined,
        description: goalForm.description || undefined,
      });
      setGoalForm({
        name: '',
        metric: '',
        targetValue: '',
        unit: '',
        ownerEmail: '',
        dueDate: '',
        description: '',
        saving: false,
      });
      setFeedback({ type: 'success', message: 'Goal created.' });
      await refresh({ force: true });
    } catch (createError) {
      setGoalForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to create goal.' });
    }
  };

  const handleGoalEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingGoal?.id) {
      return;
    }
    setEditingGoal((current) => (current ? { ...current, saving: true } : current));
    setFeedback(null);
    try {
      await updateCompanyMetricGoal(editingGoal.id, {
        workspaceId: workspaceIdForMutations,
        name: editingGoal.name,
        metric: editingGoal.metric,
        targetValue:
          editingGoal.targetValue != null && editingGoal.targetValue !== ''
            ? Number(editingGoal.targetValue)
            : undefined,
        unit: editingGoal.unit || undefined,
        ownerEmail: editingGoal.ownerEmail || undefined,
        dueDate: editingGoal.dueDate || undefined,
        description: editingGoal.description || undefined,
        status: editingGoal.status || undefined,
      });
      setEditingGoal(null);
      setFeedback({ type: 'success', message: 'Goal updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setEditingGoal((current) => (current ? { ...current, saving: false } : current));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update goal.' });
    }
  };

  const handleGoalDelete = async (goalId) => {
    if (!goalId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this goal? This action cannot be undone.')) {
      return;
    }
    setFeedback(null);
    try {
      await deleteCompanyMetricGoal(goalId);
      setFeedback({ type: 'success', message: 'Goal removed.' });
      await refresh({ force: true });
    } catch (deleteError) {
      setFeedback({ type: 'error', message: deleteError?.message ?? 'Unable to remove goal.' });
    }
  };

  const handleGoalStatusChange = async (goal) => {
    if (!goal?.id) {
      return;
    }
    try {
      await updateCompanyMetricGoal(goal.id, {
        workspaceId: workspaceIdForMutations,
        status: goal.status === 'completed' ? 'active' : 'completed',
      });
      setFeedback({ type: 'success', message: 'Goal status updated.' });
      await refresh({ force: true });
    } catch (statusError) {
      setFeedback({ type: 'error', message: statusError?.message ?? 'Unable to update goal status.' });
    }
  };

  const handleSnapshotSubmit = async (event) => {
    event.preventDefault();
    if (!snapshotForm.goalId || !snapshotForm.value) {
      setFeedback({ type: 'error', message: 'Select a goal and enter a value to record progress.' });
      return;
    }
    setSnapshotForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await recordCompanyMetricSnapshot({
        workspaceId: workspaceIdForMutations,
        goalId: snapshotForm.goalId,
        value: Number(snapshotForm.value),
        notes: snapshotForm.notes || undefined,
        occurredAt: snapshotForm.occurredAt || undefined,
      });
      setSnapshotForm({ goalId: '', value: '', occurredAt: '', notes: '', saving: false });
      setFeedback({ type: 'success', message: 'Progress snapshot recorded.' });
      await refresh({ force: true });
    } catch (snapshotError) {
      setSnapshotForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: snapshotError?.message ?? 'Unable to record snapshot.' });
    }
  };

  const handleAlertResolve = async (alertId) => {
    if (!alertId) {
      return;
    }
    try {
      await resolveCompanyMetricAlert(alertId, { workspaceId: workspaceIdForMutations });
      setFeedback({ type: 'success', message: 'Alert resolved.' });
      await refresh({ force: true });
    } catch (alertError) {
      setFeedback({ type: 'error', message: alertError?.message ?? 'Unable to resolve alert.' });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/metrics' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Metrics"
        subtitle="Hiring performance telemetry"
        description="Review key results, velocity, and experience scores to steer talent operations."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  const trendInsights = useMemo(() => {
    const items = [];
    if (trendSeries?.pipeline) {
      const pipeline = trendSeries.pipeline;
      items.push({
        title: 'Pipeline momentum',
        icon: ArrowTrendingUpIcon,
        entries: [
          pipeline.inflow != null ? `Applications inflow: ${pipeline.inflow}` : null,
          pipeline.weekOverWeek != null ? `WoW change: ${pipeline.weekOverWeek}` : null,
          pipeline.timeToHire != null ? `Avg time to hire: ${pipeline.timeToHire}` : null,
        ],
      });
    }
    if (trendSeries?.experience) {
      const experience = trendSeries.experience;
      items.push({
        title: 'Experience signals',
        icon: UserCircleIcon,
        entries: [
          experience.nps != null ? `Candidate NPS: ${experience.nps}` : null,
          experience.touchpoints != null ? `Touchpoints analysed: ${experience.touchpoints}` : null,
          experience.followUps != null ? `Follow-ups pending: ${experience.followUps}` : null,
        ],
      });
    }
    if (trendSeries?.operations) {
      const operations = trendSeries.operations;
      items.push({
        title: 'Operational throughput',
        icon: ClipboardDocumentCheckIcon,
        entries: [
          operations.interviewsScheduled != null ? `Interviews scheduled: ${operations.interviewsScheduled}` : null,
          operations.offersExtended != null ? `Offers extended: ${operations.offersExtended}` : null,
          operations.hires != null ? `Hires confirmed: ${operations.hires}` : null,
        ],
      });
    }
    return items;
  }, [trendSeries]);

  const forecastHighlights = useMemo(() => {
    if (!forecast) {
      return [];
    }
    const items = [];
    if (forecast.projectedHires != null) {
      items.push(`Projected hires: ${forecast.projectedHires}`);
    }
    if (forecast.backlog != null) {
      items.push(`Backlog: ${forecast.backlog}`);
    }
    if (forecast.atRiskRequisitions != null) {
      items.push(`At-risk requisitions: ${forecast.atRiskRequisitions}`);
    }
    if (forecast.nextReviewAt) {
      items.push(`Next scenario review ${formatAbsolute(forecast.nextReviewAt)}`);
    }
    return items;
  }, [forecast]);

  const healthBadges = metrics?.health?.badges ?? [];

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Metrics"
      subtitle="Hiring performance telemetry"
      description="Review key results, velocity, and experience scores to steer talent operations."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem="company-metrics"
      profile={workspace}
    >
      <div className="space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Metrics control centre</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Monitor hiring KPIs, align cross-functional goals, and capture progress snapshots with automation-ready
              workflows.
            </p>
            {healthBadges.length ? (
              <div className="flex flex-wrap gap-2">
                {healthBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            {workspaceOptions.length ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</span>
                <select
                  value={selectedWorkspaceId ?? ''}
                  onChange={(event) => handleWorkspaceChange(event.target.value || undefined)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Default</option>
                  {workspaceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lookback</span>
              <select
                value={lookbackDays}
                onChange={(event) => handleLookbackChange(Number(event.target.value))}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
              >
                {LOOKBACK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} days
                  </option>
                ))}
              </select>
            </label>
            <DataStatus loading={loading} error={error} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.length
            ? summaryCards.map((card) => <StatCard key={card.label} {...card} />)
            : Array.from({ length: 4 }).map((_, index) => (
                <StatCard key={index} label="Metric" value="—" helper="Awaiting data" />
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {trendInsights.map((insight) => (
            <TrendList key={insight.title} title={insight.title} icon={insight.icon} items={insight.entries} />
          ))}
          {forecastHighlights.length ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-2 text-sky-600">
                  <ChartBarIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Forecast outlook</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {forecastHighlights.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-sky-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Goal management</h2>
              <p className="text-sm text-slate-600">
                Align hiring KPIs with stakeholders, capture owners, and monitor progress across programmes.
              </p>
            </div>
            <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3" onSubmit={handleGoalSubmit}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Goal name
                  <input
                    type="text"
                    value={goalForm.name}
                    onChange={(event) => setGoalForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Metric tracked
                  <input
                    type="text"
                    value={goalForm.metric}
                    onChange={(event) => setGoalForm((current) => ({ ...current, metric: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Target
                  <input
                    type="number"
                    value={goalForm.targetValue}
                    onChange={(event) => setGoalForm((current) => ({ ...current, targetValue: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
                  <input
                    type="text"
                    value={goalForm.unit}
                    onChange={(event) => setGoalForm((current) => ({ ...current, unit: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    placeholder="% / days / count"
                  />
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Owner email
                  <input
                    type="email"
                    value={goalForm.ownerEmail}
                    onChange={(event) => setGoalForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    placeholder="owner@gigvora.com"
                  />
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due date
                  <input
                    type="date"
                    value={goalForm.dueDate}
                    onChange={(event) => setGoalForm((current) => ({ ...current, dueDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                  <textarea
                    value={goalForm.description}
                    onChange={(event) => setGoalForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-1 h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    placeholder="Add context, leading indicators, or supporting dashboards."
                  />
                </label>
              </div>
              <div className="md:col-span-3 flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={goalForm.saving}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  {goalForm.saving ? 'Saving…' : 'Add goal'}
                </button>
              </div>
            </form>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {goals.length === 0 ? (
              <p className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                No goals tracked yet. Create your first key result to start monitoring progress.
              </p>
            ) : (
              goals.map((goal) => {
                const progress = goal.progressPercent ?? goal.progress ?? 0;
                const status = goal.status ?? (progress >= 100 ? 'completed' : 'active');
                const updatedAt = goal.updatedAt ?? goal.lastSnapshotAt ?? goal.createdAt;
                const editing = editingGoal?.id === goal.id;
                return (
                  <div key={goal.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{goal.metric}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{goal.name}</h3>
                        <p className="text-xs text-slate-500">
                          Target {goal.targetValue}
                          {goal.unit ? ` ${goal.unit}` : ''}
                          {goal.dueDate ? ` · Due ${formatAbsolute(goal.dueDate)}` : ''}
                        </p>
                        {goal.ownerEmail ? (
                          <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500">
                            <UserCircleIcon className="h-4 w-4" />
                            {goal.ownerEmail}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs font-semibold">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : status === 'at_risk'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                        {updatedAt ? (
                          <span className="text-slate-400">Updated {formatRelativeTime(updatedAt)}</span>
                        ) : null}
                      </div>
                    </div>
                    <GoalProgressBar progress={progress} />
                    {goal.description ? <p className="text-sm text-slate-600">{goal.description}</p> : null}
                    {editing ? (
                      <form className="space-y-3" onSubmit={handleGoalEditSubmit}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Name
                            <input
                              type="text"
                              value={editingGoal.name}
                              onChange={(event) => setEditingGoal((current) => ({ ...current, name: event.target.value }))}
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                              required
                            />
                          </label>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Metric
                            <input
                              type="text"
                              value={editingGoal.metric}
                              onChange={(event) => setEditingGoal((current) => ({ ...current, metric: event.target.value }))}
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                              required
                            />
                          </label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Target
                            <input
                              type="number"
                              value={editingGoal.targetValue ?? ''}
                              onChange={(event) => setEditingGoal((current) => ({ ...current, targetValue: event.target.value }))}
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            />
                          </label>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Unit
                            <input
                              type="text"
                              value={editingGoal.unit ?? ''}
                              onChange={(event) => setEditingGoal((current) => ({ ...current, unit: event.target.value }))}
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            />
                          </label>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                            <select
                              value={editingGoal.status ?? 'active'}
                              onChange={(event) => setEditingGoal((current) => ({ ...current, status: event.target.value }))}
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            >
                              <option value="active">Active</option>
                              <option value="on_track">On track</option>
                              <option value="at_risk">At risk</option>
                              <option value="completed">Completed</option>
                            </select>
                          </label>
                        </div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Notes
                          <textarea
                            value={editingGoal.description ?? ''}
                            onChange={(event) => setEditingGoal((current) => ({ ...current, description: event.target.value }))}
                            className="mt-1 h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={editingGoal.saving}
                          >
                            {editingGoal.saving ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoal(null)}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingGoal({ ...goal, saving: false })}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoalStatusChange(goal)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          {status === 'completed' ? 'Reopen' : 'Mark complete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoalDelete(goal.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Record progress</h2>
              <p className="text-sm text-slate-600">
                Capture weekly or milestone snapshots to keep stakeholders informed and surface automation triggers.
              </p>
            </div>
            <form className="flex flex-wrap items-end gap-3" onSubmit={handleSnapshotSubmit}>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Goal
                <select
                  value={snapshotForm.goalId}
                  onChange={(event) => setSnapshotForm((current) => ({ ...current, goalId: event.target.value }))}
                  className="mt-1 min-w-[200px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  required
                >
                  <option value="">Select goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Value
                <input
                  type="number"
                  value={snapshotForm.value}
                  onChange={(event) => setSnapshotForm((current) => ({ ...current, value: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  required
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recorded at
                <input
                  type="datetime-local"
                  value={snapshotForm.occurredAt}
                  onChange={(event) => setSnapshotForm((current) => ({ ...current, occurredAt: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
                <input
                  type="text"
                  value={snapshotForm.notes}
                  onChange={(event) => setSnapshotForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  placeholder="Retro, challenges, or celebrations"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={snapshotForm.saving}
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                {snapshotForm.saving ? 'Recording…' : 'Record snapshot'}
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Goal</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshots.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-slate-400" colSpan={4}>
                      No snapshots captured yet.
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snapshot) => (
                    <tr key={snapshot.id}>
                      <td className="px-4 py-3 font-medium text-slate-700">{snapshot.goal?.name ?? snapshot.goalName}</td>
                      <td className="px-4 py-3">{snapshot.value}</td>
                      <td className="px-4 py-3 text-slate-500">{snapshot.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {snapshot.occurredAt ? formatAbsolute(snapshot.occurredAt) : '—'}
                        {snapshot.recordedBy ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                            <UserCircleIcon className="h-4 w-4" />
                            {snapshot.recordedBy}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Alerts & interventions</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {alerts.length} open alert{alerts.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.length === 0 ? (
              <p className="md:col-span-2 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-center text-sm font-semibold text-emerald-700">
                All clear. Metrics are within healthy thresholds.
              </p>
            ) : (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`space-y-3 rounded-3xl border p-5 shadow-sm ${
                    alert.severity === 'high'
                      ? 'border-rose-200 bg-rose-50'
                      : alert.severity === 'medium'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <BellAlertIcon className="h-4 w-4" />
                        {alert.category ?? 'Alert'}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">{alert.title ?? alert.message}</h3>
                      {alert.description ? <p className="text-sm text-slate-600">{alert.description}</p> : null}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {alert.createdAt ? <p>Raised {formatRelativeTime(alert.createdAt)}</p> : null}
                      {alert.goal?.name ? <p>Goal: {alert.goal.name}</p> : null}
                    </div>
                  </div>
                  {alert.actions?.length ? (
                    <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-600">
                      {alert.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAlertResolve(alert.id)}
                      className="rounded-full border border-slate-900 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                    >
                      Resolve alert
                    </button>
                    {alert.link ? (
                      <a
                        href={alert.link}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        View details
                      </a>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
