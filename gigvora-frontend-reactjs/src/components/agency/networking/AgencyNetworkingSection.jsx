import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import { listNetworkingSessions } from '../../../services/networking.js';
import {
  fetchAgencyNetworkingOverview,
  createAgencyNetworkingBooking,
  updateAgencyNetworkingBooking,
  createAgencyNetworkingPurchase,
  updateAgencyNetworkingPurchase,
  createAgencyNetworkingConnection,
  updateAgencyNetworkingConnection,
} from '../../../services/agencyNetworking.js';
import NetworkingTabBar from '../../userNetworking/NetworkingTabBar.jsx';
import NetworkingSummaryBoard from '../../userNetworking/NetworkingSummaryBoard.jsx';
import NetworkingSessionsPanel from '../../userNetworking/NetworkingSessionsPanel.jsx';
import NetworkingPurchasesPanel from '../../userNetworking/NetworkingPurchasesPanel.jsx';
import NetworkingPeoplePanel from '../../userNetworking/NetworkingPeoplePanel.jsx';
import NetworkingSlideOver from '../../userNetworking/NetworkingSlideOver.jsx';
import NetworkingBookingForm from '../../userNetworking/forms/NetworkingBookingForm.jsx';
import NetworkingPurchaseForm from '../../userNetworking/forms/NetworkingPurchaseForm.jsx';
import NetworkingConnectionForm from '../../userNetworking/forms/NetworkingConnectionForm.jsx';
import {
  buildSessionOptions,
  resolveSessionLabel,
  resolveConnectionName,
  formatMoneyFromCents,
} from '../../userNetworking/utils.js';

const TABS = ['Overview', 'Sessions', 'Spend', 'People'];
const DRAWER_TITLES = {
  booking: 'Session booking',
  purchase: 'Session spend',
  connection: 'Connection',
};

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{value ?? '—'}</span>
    </div>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

DetailRow.defaultProps = {
  value: '—',
};

export default function AgencyNetworkingSection({ workspaceId, workspaceSlug }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [networking, setNetworking] = useState(null);
  const [sessionsCatalog, setSessionsCatalog] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [sessionFilter, setSessionFilter] = useState('All');
  const [purchaseFilter, setPurchaseFilter] = useState('All');
  const [peopleFilter, setPeopleFilter] = useState('All');
  const [drawerState, setDrawerState] = useState({ open: false, kind: null, mode: 'create', record: null });
  const [detailState, setDetailState] = useState({ open: false, kind: null, record: null });
  const [busy, setBusy] = useState(false);

  const summary = networking?.summary ?? {};
  const bookings = useMemo(
    () => (Array.isArray(networking?.bookings?.list) ? networking.bookings.list : []),
    [networking?.bookings?.list],
  );
  const purchases = useMemo(
    () => (Array.isArray(networking?.purchases?.list) ? networking.purchases.list : []),
    [networking?.purchases?.list],
  );
  const connections = useMemo(
    () => (Array.isArray(networking?.connections?.list) ? networking.connections.list : []),
    [networking?.connections?.list],
  );

  const sessionOptions = useMemo(() => buildSessionOptions(sessionsCatalog), [sessionsCatalog]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchAgencyNetworkingOverview({ workspaceId, workspaceSlug });
      setNetworking(data);
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Unable to load networking overview.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, workspaceSlug]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      if (!workspaceId) {
        return;
      }
      setLoadingSessions(true);
      try {
        const response = await listNetworkingSessions({ companyId: workspaceId, includeMetrics: false, lookbackDays: 365 });
        if (!mounted) return;
        const sessions = Array.isArray(response?.sessions)
          ? response.sessions
          : Array.isArray(response?.data?.sessions)
            ? response.data.sessions
            : [];
        setSessionsCatalog(sessions);
      } catch (err) {
        console.warn('Unable to load networking sessions', err);
      } finally {
        if (mounted) {
          setLoadingSessions(false);
        }
      }
    };
    fetchSessions();
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(''), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const closeDrawer = useCallback(() => {
    setDrawerState({ open: false, kind: null, mode: 'create', record: null });
  }, []);

  const openDrawer = useCallback((kind, record = null) => {
    setError('');
    setFeedback('');
    setDrawerState({ open: true, kind, mode: record ? 'edit' : 'create', record });
  }, []);

  const closeDetail = useCallback(() => setDetailState({ open: false, kind: null, record: null }), []);

  const openDetail = useCallback((kind, record) => {
    setDetailState({ open: true, kind, record });
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadOverview();
  }, [loadOverview]);

  const handleAction = useCallback(
    async (action, successMessage) => {
      setBusy(true);
      setError('');
      try {
        await action();
        setFeedback(successMessage);
        await handleRefresh();
        closeDrawer();
      } catch (err) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Unable to update networking data.';
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [closeDrawer, handleRefresh],
  );

  const workspaceContext = useMemo(
    () => ({ workspaceId, workspaceSlug }),
    [workspaceId, workspaceSlug],
  );

  const handleSaveBooking = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action =
        drawerState.mode === 'edit' && drawerState.record?.id
          ? () => updateAgencyNetworkingBooking(drawerState.record.id, payload, workspaceContext)
          : () => createAgencyNetworkingBooking(payload, workspaceContext);
      await handleAction(action, 'Booking saved.');
    },
    [drawerState, handleAction, workspaceContext],
  );

  const handleSavePurchase = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action =
        drawerState.mode === 'edit' && drawerState.record?.id
          ? () => updateAgencyNetworkingPurchase(drawerState.record.id, payload, workspaceContext)
          : () => createAgencyNetworkingPurchase(payload, workspaceContext);
      await handleAction(action, 'Purchase saved.');
    },
    [drawerState, handleAction, workspaceContext],
  );

  const handleSaveConnection = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action =
        drawerState.mode === 'edit' && drawerState.record?.id
          ? () => updateAgencyNetworkingConnection(drawerState.record.id, payload, workspaceContext)
          : () => createAgencyNetworkingConnection(payload, workspaceContext);
      await handleAction(action, 'Connection saved.');
    },
    [drawerState, handleAction, workspaceContext],
  );

  const detailContent = useMemo(() => {
    if (!detailState.record) {
      return null;
    }
    if (detailState.kind === 'booking') {
      const booking = detailState.record;
      const sessionLabel = resolveSessionLabel(booking.session, booking.sessionId);
      return (
        <div className="space-y-3">
          <DetailRow label="Session" value={sessionLabel || '—'} />
          <DetailRow label="Status" value={booking.status} />
          <DetailRow label="Seat" value={booking.seatNumber ?? '—'} />
          <DetailRow
            label="Spend"
            value={
              booking.metadata?.purchaseCents
                ? formatMoneyFromCents(booking.metadata.purchaseCents, booking.metadata.purchaseCurrency)
                : '—'
            }
          />
          <DetailRow label="Check-in" value={booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString() : '—'} />
          <DetailRow label="Completion" value={booking.completedAt ? new Date(booking.completedAt).toLocaleString() : '—'} />
          <DetailRow label="Notes" value={booking.metadata?.userNotes ?? '—'} />
        </div>
      );
    }
    if (detailState.kind === 'purchase') {
      const purchase = detailState.record;
      const sessionLabel = resolveSessionLabel(purchase.session, purchase.sessionId);
      return (
        <div className="space-y-3">
          <DetailRow label="Session" value={sessionLabel || '—'} />
          <DetailRow label="Status" value={purchase.status} />
          <DetailRow
            label="Amount"
            value={formatMoneyFromCents(purchase.amountCents, purchase.currency)}
          />
          <DetailRow label="Purchased" value={purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleString() : '—'} />
          <DetailRow label="Reference" value={purchase.reference ?? '—'} />
          <DetailRow label="Notes" value={purchase.metadata?.userNotes ?? '—'} />
        </div>
      );
    }
    const connection = detailState.record;
    const name = resolveConnectionName(connection);
    return (
      <div className="space-y-3">
        <DetailRow label="Name" value={name} />
        <DetailRow label="Email" value={connection.connectionEmail ?? '—'} />
        <DetailRow label="Company" value={connection.connectionCompany ?? '—'} />
        <DetailRow label="Status" value={connection.followStatus ?? '—'} />
        <DetailRow label="Notes" value={connection.notes ?? '—'} />
      </div>
    );
  }, [detailState]);

  const drawerContent = useMemo(() => {
    if (!drawerState.kind) {
      return null;
    }
    if (drawerState.kind === 'booking') {
      return (
        <NetworkingBookingForm
          mode={drawerState.mode}
          initialValue={drawerState.record}
          onSubmit={handleSaveBooking}
          busy={busy}
          sessionOptions={sessionOptions}
          loadingSessions={loadingSessions}
        />
      );
    }
    if (drawerState.kind === 'purchase') {
      return (
        <NetworkingPurchaseForm
          mode={drawerState.mode}
          initialValue={drawerState.record}
          onSubmit={handleSavePurchase}
          busy={busy}
          sessionOptions={sessionOptions}
          loadingSessions={loadingSessions}
        />
      );
    }
    return (
      <NetworkingConnectionForm
        mode={drawerState.mode}
        initialValue={drawerState.record}
        onSubmit={handleSaveConnection}
        busy={busy}
      />
    );
  }, [drawerState, handleSaveBooking, handleSaveConnection, handleSavePurchase, busy, sessionOptions, loadingSessions]);

  const drawerTitle = drawerState.kind ? DRAWER_TITLES[drawerState.kind] : '';

  return (
    <section id="agency-networking" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Networking command center</h2>
          <p className="text-sm text-slate-600">
            Track booked sessions, purchases, and relationship follow-ups across your agency workspace.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>

      <DataStatus loading={loading} error={error} lastUpdated={summary?.lastUpdated} onRetry={handleRefresh} />
      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      {networking ? (
        <div className="space-y-10">
          <NetworkingTabBar value={activeTab} onChange={setActiveTab} tabs={TABS} />

          {activeTab === 'Overview' ? (
            <NetworkingSummaryBoard
              summary={summary}
              bookings={bookings}
              purchases={purchases}
              connections={connections}
              onOpenTab={setActiveTab}
            />
          ) : null}

          {activeTab === 'Sessions' ? (
            <NetworkingSessionsPanel
              bookings={bookings}
              activeFilter={sessionFilter}
              onChangeFilter={setSessionFilter}
              onCreate={() => openDrawer('booking')}
              onEdit={(record) => openDrawer('booking', record)}
              onOpen={(record) => openDetail('booking', record)}
            />
          ) : null}

          {activeTab === 'Spend' ? (
            <NetworkingPurchasesPanel
              purchases={purchases}
              activeFilter={purchaseFilter}
              onChangeFilter={setPurchaseFilter}
              onCreate={() => openDrawer('purchase')}
              onEdit={(record) => openDrawer('purchase', record)}
              onOpen={(record) => openDetail('purchase', record)}
            />
          ) : null}

          {activeTab === 'People' ? (
            <NetworkingPeoplePanel
              connections={connections}
              activeFilter={peopleFilter}
              onChangeFilter={setPeopleFilter}
              onCreate={() => openDrawer('connection')}
              onEdit={(record) => openDrawer('connection', record)}
              onOpen={(record) => openDetail('connection', record)}
            />
          ) : null}
        </div>
      ) : null}

      <NetworkingSlideOver
        open={drawerState.open}
        onClose={closeDrawer}
        title={drawerState.mode === 'edit' ? `Edit ${drawerTitle.toLowerCase()}` : `Add ${drawerTitle.toLowerCase()}`}
        subtitle="Workspace-level controls"
      >
        {drawerContent}
      </NetworkingSlideOver>

      <NetworkingSlideOver
        open={detailState.open}
        onClose={closeDetail}
        title="Details"
        subtitle="Activity detail"
      >
        {detailContent}
      </NetworkingSlideOver>
    </section>
  );
}

AgencyNetworkingSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
};

AgencyNetworkingSection.defaultProps = {
  workspaceId: null,
  workspaceSlug: undefined,
};
