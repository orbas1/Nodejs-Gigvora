import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import AgencyIdVerificationSection from '../../../components/agency/id-verification/AgencyIdVerificationSection.jsx';

function normalizeDraftValue(value) {
  if (value == null) {
    return '';
  }
  return `${value}`;
}

export default function AgencyIdVerificationPage() {
  const { session } = useSession();
  const defaultWorkspaceId = session?.workspaceId ?? session?.workspace?.id ?? '';
  const defaultWorkspaceSlug = session?.workspaceSlug ?? session?.workspace?.slug ?? '';

  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId ? `${defaultWorkspaceId}` : '');
  const [workspaceSlug, setWorkspaceSlug] = useState(defaultWorkspaceSlug ?? '');
  const [draft, setDraft] = useState({ id: normalizeDraftValue(defaultWorkspaceId), slug: defaultWorkspaceSlug ?? '' });
  const [applyCount, setApplyCount] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }
    const interval = setInterval(() => {
      setRefreshVersion((value) => value + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const handleChange = useCallback((field, value) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setDraft({ id: normalizeDraftValue(defaultWorkspaceId), slug: defaultWorkspaceSlug ?? '' });
    setWorkspaceId(defaultWorkspaceId ? `${defaultWorkspaceId}` : '');
    setWorkspaceSlug(defaultWorkspaceSlug ?? '');
  }, [defaultWorkspaceId, defaultWorkspaceSlug]);

  const handleApply = useCallback(
    (event) => {
      event.preventDefault();
      setWorkspaceId(draft.id.trim());
      setWorkspaceSlug(draft.slug.trim());
      setApplyCount((count) => count + 1);
    },
    [draft.id, draft.slug],
  );

  const contextSummary = useMemo(() => {
    const summary = [];
    if (workspaceId) {
      summary.push({ label: 'Workspace ID', value: workspaceId });
    }
    if (workspaceSlug) {
      summary.push({ label: 'Workspace slug', value: workspaceSlug });
    }
    if (!summary.length) {
      summary.push({ label: 'Scope', value: 'All workspaces' });
    }
    summary.push({ label: 'Changes applied', value: applyCount });
    return summary;
  }, [applyCount, workspaceId, workspaceSlug]);

  const riskSignals = useMemo(
    () => [
      {
        id: 'pending',
        label: 'Pending reviews',
        value: '18',
        caption: 'Awaiting document verification',
        tone: 'text-amber-600',
      },
      {
        id: 'escalated',
        label: 'Escalated cases',
        value: '5',
        caption: 'Flagged for manual fraud review',
        tone: 'text-rose-600',
      },
      {
        id: 'automation',
        label: 'Automation coverage',
        value: '72%',
        caption: 'Auto-approved within configured risk tolerances',
        tone: 'text-emerald-600',
      },
      {
        id: 'turnaround',
        label: 'Median turnaround',
        value: '12m',
        caption: 'From submission to reviewer decision',
        tone: 'text-slate-700',
      },
    ],
    [],
  );

  return (
    <AgencyDashboardLayout
      title="Identity verification"
      subtitle="Control KYC, reviewer workflows, and automation thresholds confidently."
      description="Monitor high-risk cases, tune escalation policies, and ship compliant onboarding experiences."
      activeMenuItem="id-verification"
    >
      <div className="space-y-10">
        <section className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspace context</p>
              <h1 className="text-2xl font-semibold text-slate-900">Direct your verification desk</h1>
              <p className="text-sm text-slate-500">
                Choose which workspace to load, override the slug if you run multi-region desks, and track how often the team
                pivots contexts.
              </p>
            </div>
            <form className="flex w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 lg:max-w-sm" onSubmit={handleApply}>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Workspace ID</span>
                <input
                  type="text"
                  value={draft.id}
                  onChange={(event) => handleChange('id', event.target.value)}
                  placeholder="e.g. 1287"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Workspace slug</span>
                <input
                  type="text"
                  value={draft.slug}
                  onChange={(event) => handleChange('slug', event.target.value)}
                  placeholder="optional-slug"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Apply context
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Reset defaults
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshVersion((value) => value + 1)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Refresh data
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRefreshEnabled((value) => !value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    autoRefreshEnabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
                </button>
              </div>
            </form>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contextSummary.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">{item.value || '—'}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {riskSignals.map((signal) => (
              <div key={signal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{signal.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${signal.tone}`}>{signal.value}</p>
                <p className="mt-2 text-sm text-slate-600">{signal.caption}</p>
              </div>
            ))}
          </div>
        </section>

        <AgencyIdVerificationSection
          key={`${workspaceId ?? 'all'}:${workspaceSlug ?? 'root'}:${refreshVersion}`}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </AgencyDashboardLayout>
  );
}

