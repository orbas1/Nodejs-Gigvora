import { useMemo } from 'react';
import {
  ArrowPathIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

function formatRelative(timestamp) {
  if (!timestamp) {
    return 'never';
  }
  try {
    const value = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
    if (!Number.isFinite(value)) {
      return 'never';
    }
    const delta = Date.now() - value;
    if (delta < 60_000) {
      return 'just now';
    }
    if (delta < 3_600_000) {
      const minutes = Math.floor(delta / 60_000);
      return `${minutes}m ago`;
    }
    if (delta < 86_400_000) {
      const hours = Math.floor(delta / 3_600_000);
      return `${hours}h ago`;
    }
    const days = Math.floor(delta / 86_400_000);
    if (days < 7) {
      return `${days}d ago`;
    }
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  } catch (error) {
    console.warn('Unable to format timestamp', error);
    return 'recently';
  }
}

function SummaryMetric({ label, value, hint, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200 bg-white text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
  };
  const toneClass = toneClasses[tone] ?? toneClasses.slate;
  return (
    <div className={`rounded-3xl border p-5 shadow-soft ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-current/80">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-current">{value}</p>
      {hint ? <p className="mt-1 text-sm text-current/70">{hint}</p> : null}
    </div>
  );
}

export default function IntegrationSummaryHeader({
  workspace,
  summary,
  availableWorkspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  onRefresh,
  refreshing,
  lastLoadedAt,
  onCreate,
  canCreate = true,
}) {
  const workspaceOptions = useMemo(() => availableWorkspaces ?? [], [availableWorkspaces]);
  const total = summary?.total ?? 0;
  const connected = summary?.connected ?? 0;
  const pending = summary?.pending ?? 0;
  const error = summary?.error ?? 0;
  const lastSyncedAt = summary?.lastSyncedAt ?? lastLoadedAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Integrations</p>
          <h1 className="text-3xl font-semibold text-slate-900">Control</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <BuildingOfficeIcon className="h-4 w-4" aria-hidden="true" />
              {workspace?.name ?? 'Select workspace'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              Sync {formatRelative(lastSyncedAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <SignalIcon className="h-4 w-4" aria-hidden="true" />
              {summary?.webhooks ?? 0} hooks · {summary?.secrets ?? 0} creds
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="flex w-full flex-col text-sm font-medium text-slate-700 sm:max-w-xs">
            <span className="mb-1">Workspace</span>
            <select
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-accent focus:outline-none"
              value={selectedWorkspaceId ?? ''}
              onChange={(event) => onWorkspaceChange?.(event.target.value)}
            >
              {workspaceOptions.length === 0 ? (
                <option value="">No agency workspaces</option>
              ) : (
                workspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              disabled={refreshing}
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={!canCreate}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
              New
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="Total" value={total} />
        <SummaryMetric label="Live" value={connected} tone="emerald" />
        <SummaryMetric label="Action" value={pending + error} tone={error ? 'amber' : 'violet'} />
        <SummaryMetric label="Test" value={formatRelative(summary?.lastConnectionTestAt)} tone="violet" />
      </div>

      {summary?.error ? (
        <div className="flex items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
          {summary.error}
        </div>
      ) : null}

      {summary?.connected === total && total > 0 ? (
        <div className="flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
          All integrations healthy.
        </div>
      ) : null}
    </div>
  );
}
