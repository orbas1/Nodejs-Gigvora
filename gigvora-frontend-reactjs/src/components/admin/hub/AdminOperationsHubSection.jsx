import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  SignalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { fetchAdminHubOverview, triggerAdminHubSync } from '../../../services/adminHub.js';

function ProgressBar({ label, value, target, accent = 'bg-blue-500' }) {
  const ratio = Math.min(100, Math.round(((value ?? 0) / (target || 1)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{value ?? 0}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div className={`${accent} h-2.5 rounded-full transition`} style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

export default function AdminOperationsHubSection() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!feedback && !error) return undefined;
    const timeout = setTimeout(() => {
      setFeedback('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, error]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminHubOverview({ lookbackDays: 30 });
      setOverview(response);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load hub overview.');
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const headlineMetrics = useMemo(() => {
    const metrics = overview?.metrics ?? {};
    return [
      {
        label: 'Active members',
        value: metrics.activeMembers ?? metrics.totalMembers ?? 0,
        caption: 'Users, freelancers, and admins active within the last 30 days.',
        icon: UserGroupIcon,
      },
      {
        label: 'Net revenue',
        value: metrics.netRevenue ? `$${Number(metrics.netRevenue).toLocaleString()}` : '$0',
        caption: 'Captured across escrow, invoices, and ads within the last cycle.',
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Service health',
        value: `${metrics.uptimePercentage ?? 99.9}%`,
        caption: 'Composite uptime across API, storage, and realtime surfaces.',
        icon: SignalIcon,
      },
      {
        label: 'Automation throughput',
        value: metrics.automationRuns ?? 0,
        caption: 'Automations executed across CRM, billing, and messaging flows.',
        icon: ChartBarIcon,
      },
    ];
  }, [overview?.metrics]);

  const pipeline = overview?.pipelines ?? {};
  const maintenance = overview?.maintenance ?? {};
  const incidents = overview?.incidents ?? [];

  const handleSync = async () => {
    try {
      setSyncing(true);
      await triggerAdminHubSync();
      setFeedback('Hub data refresh queued. New metrics arriving shortly.');
      await loadOverview();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Unable to trigger sync.');
    } finally {
      setSyncing(false);
    }
  };

  const upcomingIncident = incidents.find((incident) => incident.status === 'open' || incident.status === 'investigating');

  return (
    <section id="admin-hub" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Hub</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Operations control tower</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            See every market signal in one place—activation, monetisation, availability, and platform health. Drive go-to-market
            conversations with production-ready telemetry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', syncing ? 'animate-spin' : '')} aria-hidden="true" />
            {syncing ? 'Syncing…' : 'Refresh data'}
          </button>
        </div>
      </div>

      {loading && !overview ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Loading hub overview…
        </div>
      ) : null}
      {feedback ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {headlineMetrics.map((metric) => (
          <div key={metric.label} className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <metric.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">{metric.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/20">
          <h3 className="text-base font-semibold text-slate-900">Growth funnel</h3>
          <p className="mt-2 text-sm text-slate-500">
            Track onboarding throughput across key segments. Targets are dynamic quotas pulled from OKRs.
          </p>
          <div className="mt-6 space-y-4">
            <ProgressBar label="New user signups" value={pipeline.signups?.value} target={pipeline.signups?.target ?? 500} />
            <ProgressBar label="Freelancers vetted" value={pipeline.freelancers?.value} target={pipeline.freelancers?.target ?? 120} accent="bg-emerald-500" />
            <ProgressBar label="Companies onboarded" value={pipeline.companies?.value} target={pipeline.companies?.target ?? 80} accent="bg-sky-500" />
            <ProgressBar label="Mentors activated" value={pipeline.mentors?.value} target={pipeline.mentors?.target ?? 30} accent="bg-purple-500" />
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/20">
          <h3 className="text-base font-semibold text-slate-900">Maintenance & incidents</h3>
          <p className="mt-2 text-sm text-slate-500">
            Coordinate downtime and communicate proactively across the network.
          </p>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next maintenance window</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {maintenance.nextWindow?.start
                  ? new Date(maintenance.nextWindow.start).toLocaleString()
                  : 'No window scheduled'}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                {maintenance.nextWindow?.scope ?? 'Schedule from System Settings > Maintenance to keep stakeholders informed.'}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active incident</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {upcomingIncident
                  ? `${upcomingIncident.title} • ${upcomingIncident.status}`
                  : 'No open incidents'}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                {upcomingIncident?.lastUpdate ?? 'All systems stable.'}
              </p>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/20">
        <h3 className="text-base font-semibold text-slate-900">Recent automation events</h3>
        <p className="mt-2 text-sm text-slate-500">
          Observe the latest orchestration across CRM, finance, and messaging flows.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-600">
          {(overview?.automations ?? []).slice(0, 5).map((automation) => (
            <li
              key={automation.id ?? automation.reference}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{automation.name}</p>
                <p className="text-xs text-slate-500">{automation.description}</p>
              </div>
              <div className="text-xs text-slate-500">
                {automation.completedAt
                  ? new Date(automation.completedAt).toLocaleString()
                  : automation.startedAt
                  ? new Date(automation.startedAt).toLocaleString()
                  : 'Pending'}
              </div>
            </li>
          ))}
          {(overview?.automations ?? []).length === 0 ? (
            <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No automation runs recorded in the last 30 days.
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
