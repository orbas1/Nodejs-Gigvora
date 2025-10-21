import { useMemo, useState } from 'react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import useCachedResource from '../../../hooks/useCachedResource.js';
import { formatAbsolute } from '../../../utils/date.js';
import { fetchUserDisputes, createUserDispute, postUserDisputeEvent } from '../../../services/disputes.js';
import DisputeMetrics from './DisputeMetrics.jsx';
import DisputeFilters from './DisputeFilters.jsx';
import DisputeCaseList from './DisputeCaseList.jsx';
import DisputeComposerWizard from './DisputeComposerWizard.jsx';
import DisputeDetailDrawer from '../DisputeDetailDrawer.jsx';

const DEFAULT_SUMMARY = {
  total: 0,
  openCount: 0,
  awaitingCustomerAction: 0,
  escalatedCount: 0,
  lastUpdatedAt: null,
  upcomingDeadlines: [],
};

export default function DisputeWorkspace({ userId, overview }) {
  const [filters, setFilters] = useState({ status: '', stage: '' });
  const [showComposer, setShowComposer] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState(null);

  const cacheKey = useMemo(
    () => `disputes:${userId}:${filters.status || 'all'}:${filters.stage || 'all'}`,
    [userId, filters.status, filters.stage],
  );

  const { data, loading, error, refresh } = useCachedResource(
    cacheKey,
    async ({ signal, force }) => {
      if (!userId) {
        return null;
      }
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.stage) params.stage = filters.stage;
      const result = await fetchUserDisputes(userId, params, { signal });
      return result;
    },
    { enabled: Boolean(userId) },
  );

  const summary = data?.summary ?? overview?.summary ?? DEFAULT_SUMMARY;
  const metadata = data?.metadata ?? overview?.metadata ?? {
    reasonCodes: [],
    priorities: [],
    stages: [],
    statuses: [],
    actionTypes: [],
  };
  const permissions = data?.permissions ?? overview?.permissions ?? { canCreate: false };
  const disputes = data?.disputes ?? [];
  const eligibleTransactions = data?.eligibleTransactions ?? [];

  const handleResetFilters = () => setFilters({ status: '', stage: '' });

  const handleCreate = async (payload) => {
    setBusy(true);
    setAlert(null);
    try {
      const response = await createUserDispute(userId, payload);
      const dispute = response?.dispute ?? null;
      await refresh({ force: true });
      if (dispute) {
        setSelectedDispute(dispute);
        setAlert({ type: 'success', message: 'Dispute submitted for review.' });
      } else {
        setAlert({ type: 'success', message: 'Dispute submitted.' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: error?.message ?? 'Unable to submit dispute.' });
    } finally {
      setBusy(false);
    }
  };

  const handleAppendEvent = async (payload) => {
    if (!selectedDispute) return;
    setBusy(true);
    setAlert(null);
    try {
      const response = await postUserDisputeEvent(userId, selectedDispute.id, payload);
      const dispute = response?.dispute ?? null;
      await refresh({ force: true });
      if (dispute) {
        setSelectedDispute(dispute);
      }
      setAlert({ type: 'success', message: 'Update recorded successfully.' });
    } catch (error) {
      setAlert({ type: 'error', message: error?.message ?? 'Unable to post update.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900">Case board</h2>
          <p className="text-sm text-slate-500">Updated {summary.lastUpdatedAt ? formatAbsolute(summary.lastUpdatedAt) : '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition ${
              permissions.canCreate
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-slate-300 text-slate-600 cursor-not-allowed'
            }`}
            disabled={!permissions.canCreate}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" /> New case
          </button>
        </div>
      </div>

      <DisputeMetrics summary={summary} />

      {alert ? (
        <p
          className={`rounded-3xl px-4 py-3 text-sm ${
            alert.type === 'error'
              ? 'border border-rose-200 bg-rose-50 text-rose-700'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {alert.message}
        </p>
      ) : null}

      <DisputeFilters filters={filters} metadata={metadata} onChange={setFilters} onReset={handleResetFilters} />

      {error ? (
        <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message || 'Failed to load disputes.'}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-3">
          {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading…</div> : null}
          <DisputeCaseList
            disputes={disputes}
            onSelect={(dispute) => setSelectedDispute(dispute)}
            selectedId={selectedDispute?.id ?? null}
          />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          {selectedDispute ? (
            <DisputeDetailDrawer
              open
              variant="inline"
              dispute={selectedDispute}
              metadata={metadata}
              busy={busy}
              loading={busy && !selectedDispute?.events}
              onClose={() => setSelectedDispute(null)}
              onAddEvent={(id, eventPayload) => handleAppendEvent(eventPayload)}
            />
          ) : (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-500">
              Select a case to review activity.
            </div>
          )}
        </div>
      </div>

      <DisputeComposerWizard
        open={showComposer}
        onClose={() => setShowComposer(false)}
        onSubmit={handleCreate}
        transactions={eligibleTransactions}
        metadata={metadata}
        busy={busy}
      />
    </div>
  );
}
