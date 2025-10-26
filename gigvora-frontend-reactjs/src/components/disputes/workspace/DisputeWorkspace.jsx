import { useEffect, useMemo, useState } from 'react';
import useCachedResource from '../../../hooks/useCachedResource.js';
import { fetchUserDisputes, createUserDispute, postUserDisputeEvent } from '../../../services/disputes.js';
import DisputeDashboard from '../DisputeDashboard.jsx';
import CaseDetailView from '../CaseDetailView.jsx';
import DisputeComposerWizard from './DisputeComposerWizard.jsx';

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

  useEffect(() => {
    if (!selectedDispute) return;
    setSelectedDispute((previous) => {
      if (!previous) {
        return previous;
      }
      const updated = disputes.find((item) => item.id === previous.id);
      if (!updated) {
        return previous;
      }
      if (updated === previous) {
        return previous;
      }
      return {
        ...updated,
        events: previous.events ?? updated.events,
        attachments: updated.attachments ?? previous.attachments,
        participants: updated.participants ?? previous.participants,
        decisionLog: previous.decisionLog ?? updated.decisionLog,
      };
    });
  }, [disputes]);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-6">
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

      {error ? (
        <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message || 'Failed to load disputes.'}</p>
      ) : null}

      <DisputeDashboard
        summary={summary}
        cases={disputes}
        metadata={metadata}
        filters={filters}
        loading={loading}
        lastUpdated={summary.lastUpdatedAt}
        permissions={permissions}
        onFiltersChange={(nextFilters) => setFilters(nextFilters)}
        onResetFilters={handleResetFilters}
        onRefresh={refresh}
        onCreateCase={() => setShowComposer(true)}
        onSelectCase={(dispute) => setSelectedDispute(dispute)}
        selectedCaseId={selectedDispute?.id ?? null}
      />

      <div className="rounded-4xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur">
        {selectedDispute ? (
          <CaseDetailView
            dispute={selectedDispute}
            metadata={metadata}
            busy={busy}
            onAppendEvent={(payload) => handleAppendEvent(payload)}
            onRefresh={refresh}
          />
        ) : (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
            Select a case from the dashboard to review its lifecycle and take action.
          </div>
        )}
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
