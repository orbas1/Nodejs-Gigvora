import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatInteger(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(Number(value)) < 1000 ? 2 : 0,
  }).format(Number(value));
}

function joinList(values) {
  return (Array.isArray(values) ? values : []).filter(Boolean).join(', ');
}

export default function WorkspaceOverviewSection({
  project,
  brief,
  metrics,
  onSaveBrief,
  saving = false,
  onRefresh,
}) {
  const [form, setForm] = useState({
    title: '',
    summary: '',
    objectivesText: '',
    deliverablesText: '',
    successMetricsText: '',
    clientStakeholders: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!brief) {
      setForm({
        title: project?.title ?? '',
        summary: project?.description ?? '',
        objectivesText: '',
        deliverablesText: '',
        successMetricsText: '',
        clientStakeholders: '',
      });
      return;
    }
    setForm({
      title: brief.title ?? project?.title ?? '',
      summary: brief.summary ?? project?.description ?? '',
      objectivesText: (brief.objectives ?? []).join('\n'),
      deliverablesText: (brief.deliverables ?? []).join('\n'),
      successMetricsText: (brief.successMetrics ?? []).join('\n'),
      clientStakeholders: (brief.clientStakeholders ?? []).join('\n'),
    });
  }, [brief?.title, brief?.summary, brief?.objectives, brief?.deliverables, brief?.successMetrics, brief?.clientStakeholders, project?.title, project?.description]);

  const cards = useMemo(() => {
    return [
      {
        label: 'Progress',
        value: formatPercent(metrics?.progressPercent ?? 0),
        icon: CheckCircleIcon,
      },
      {
        label: 'Pending approvals',
        value: formatInteger(metrics?.pendingApprovals),
        icon: ClipboardDocumentCheckIcon,
      },
      {
        label: 'Overdue approvals',
        value: formatInteger(metrics?.overdueApprovals),
        tone: metrics?.overdueApprovals > 0 ? 'warn' : 'default',
        icon: ExclamationCircleIcon,
      },
      {
        label: 'Unread messages',
        value: formatInteger(metrics?.unreadMessages),
        icon: ClockIcon,
      },
      {
        label: 'Budget allocated',
        value: formatCurrency(metrics?.budgetAllocated, brief?.currency ?? 'USD'),
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Budget variance',
        value: formatPercent((metrics?.budgetVariance ?? 0) * 100),
        tone: metrics?.budgetVariance > 0.05 ? 'warn' : 'default',
        icon: ArrowPathIcon,
      },
      {
        label: 'Active contributors',
        value: formatInteger(metrics?.activeContributors),
        icon: UserGroupIcon,
      },
      {
        label: 'Automation coverage',
        value: formatPercent((metrics?.automationCoverage ?? 0) * 100),
        icon: ArrowPathIcon,
      },
    ];
  }, [metrics, brief?.currency]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSaveBrief) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      await onSaveBrief({
        title: form.title,
        summary: form.summary,
        objectivesText: form.objectivesText,
        deliverablesText: form.deliverablesText,
        successMetricsText: form.successMetricsText,
        clientStakeholders: form.clientStakeholders,
      });
      setFeedback('Workspace brief updated successfully.');
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Workspace overview</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track project health, keep the brief up to date, and align stakeholders on objectives.
          </p>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Project:</span> {project?.title ?? 'Select a project'}
            </p>
            {project?.status ? (
              <p>
                <span className="font-semibold text-slate-900">Status:</span> {project.status}
              </p>
            ) : null}
            {project?.location ? (
              <p>
                <span className="font-semibold text-slate-900">Location:</span> {project.location}
              </p>
            ) : null}
            {brief?.clientStakeholders?.length ? (
              <p>
                <span className="font-semibold text-slate-900">Stakeholders:</span> {joinList(brief.clientStakeholders)}
              </p>
            ) : null}
          </div>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent hover:text-accent"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh data
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const tone = card.tone === 'warn' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-blue-600 bg-blue-50 border-blue-100';
          return (
            <div
              key={card.label}
              className={`flex items-center justify-between rounded-2xl border px-4 py-5 shadow-sm ${tone}`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{card.value}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-accent shadow-sm">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Objectives</h3>
          <p className="mt-1 text-sm text-slate-600">{joinList(brief?.objectives) || 'Document objectives to keep teams aligned.'}</p>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Deliverables</h3>
          <p className="mt-1 text-sm text-slate-600">{joinList(brief?.deliverables) || 'List deliverables to manage scope.'}</p>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Success metrics</h3>
          <p className="mt-1 text-sm text-slate-600">{joinList(brief?.successMetrics) || 'Define success metrics to measure impact.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-title">
              Brief title
            </label>
            <input
              id="brief-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Workspace brief title"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-summary">
              Summary
            </label>
            <textarea
              id="brief-summary"
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Short project summary"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-objectives">
                Objectives
              </label>
              <textarea
                id="brief-objectives"
                value={form.objectivesText}
                onChange={(event) => setForm((prev) => ({ ...prev, objectivesText: event.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder={'One objective per line'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-deliverables">
                Deliverables
              </label>
              <textarea
                id="brief-deliverables"
                value={form.deliverablesText}
                onChange={(event) => setForm((prev) => ({ ...prev, deliverablesText: event.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder={'One deliverable per line'}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-success">
                Success metrics
              </label>
              <textarea
                id="brief-success"
                value={form.successMetricsText}
                onChange={(event) => setForm((prev) => ({ ...prev, successMetricsText: event.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder={'One metric per line'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-stakeholders">
                Stakeholders
              </label>
              <textarea
                id="brief-stakeholders"
                value={form.clientStakeholders}
                onChange={(event) => setForm((prev) => ({ ...prev, clientStakeholders: event.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder={'Name or role per line'}
              />
            </div>
          </div>
          {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
          {error ? (
            <p className="text-sm text-rose-600">{error.message ?? 'Unable to save the workspace brief.'}</p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || saving}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting || saving ? 'Saving…' : 'Save brief'}
            </button>
            <button
              type="button"
              onClick={() => setForm({
                title: brief?.title ?? project?.title ?? '',
                summary: brief?.summary ?? project?.description ?? '',
                objectivesText: (brief?.objectives ?? []).join('\n'),
                deliverablesText: (brief?.deliverables ?? []).join('\n'),
                successMetricsText: (brief?.successMetrics ?? []).join('\n'),
                clientStakeholders: (brief?.clientStakeholders ?? []).join('\n'),
              })}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
