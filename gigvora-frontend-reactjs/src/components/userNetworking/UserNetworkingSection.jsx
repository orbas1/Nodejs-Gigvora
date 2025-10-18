import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import formatDateTime from '../../utils/formatDateTime.js';
import { listNetworkingSessions } from '../../services/networking.js';
import {
  createUserNetworkingBooking,
  updateUserNetworkingBooking,
  createUserNetworkingPurchase,
  updateUserNetworkingPurchase,
  createUserNetworkingConnection,
  updateUserNetworkingConnection,
} from '../../services/userNetworking.js';
import NetworkingTabBar from './NetworkingTabBar.jsx';
import NetworkingSummaryBoard from './NetworkingSummaryBoard.jsx';
import NetworkingSessionsPanel from './NetworkingSessionsPanel.jsx';
import NetworkingPurchasesPanel from './NetworkingPurchasesPanel.jsx';
import NetworkingPeoplePanel from './NetworkingPeoplePanel.jsx';
import NetworkingSlideOver from './NetworkingSlideOver.jsx';
import NetworkingBookingForm from './forms/NetworkingBookingForm.jsx';
import NetworkingPurchaseForm from './forms/NetworkingPurchaseForm.jsx';
import NetworkingConnectionForm from './forms/NetworkingConnectionForm.jsx';
import {
  buildSessionOptions,
  formatMoneyFromCents,
  formatStatusLabel,
  resolveConnectionName,
  resolveSessionLabel,
} from './utils.js';

const TABS = ['Home', 'Sessions', 'Spend', 'People'];
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

export default function UserNetworkingSection({ userId, networking, onRefresh }) {
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

  const [activeTab, setActiveTab] = useState('Home');
  const [sessionFilter, setSessionFilter] = useState('All');
  const [purchaseFilter, setPurchaseFilter] = useState('All');
  const [peopleFilter, setPeopleFilter] = useState('All');
  const [drawerState, setDrawerState] = useState({ open: false, kind: null, mode: 'create', record: null });
  const [detailState, setDetailState] = useState({ open: false, kind: null, record: null });
  const [sessionsCatalog, setSessionsCatalog] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const sessionOptions = useMemo(() => buildSessionOptions(sessionsCatalog), [sessionsCatalog]);

  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      if (!userId) {
        return;
      }
      setLoadingSessions(true);
      try {
        const response = await listNetworkingSessions({ includeMetrics: false, lookbackDays: 365 });
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
  }, [userId]);

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

  const handleAction = useCallback(
    async (action, successMessage) => {
      setBusy(true);
      setError('');
      try {
        await action();
        setFeedback(successMessage);
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        closeDrawer();
      } catch (err) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Unable to update networking data.';
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [closeDrawer, onRefresh],
  );

  const handleSaveBooking = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action = drawerState.mode === 'edit' && drawerState.record?.id
        ? () => updateUserNetworkingBooking(userId, drawerState.record.id, payload)
        : () => createUserNetworkingBooking(userId, payload);
      await handleAction(action, 'Booking saved.');
    },
    [drawerState, handleAction, userId],
  );

  const handleSavePurchase = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action = drawerState.mode === 'edit' && drawerState.record?.id
        ? () => updateUserNetworkingPurchase(userId, drawerState.record.id, payload)
        : () => createUserNetworkingPurchase(userId, payload);
      await handleAction(action, 'Purchase saved.');
    },
    [drawerState, handleAction, userId],
  );

  const handleSaveConnection = useCallback(
    async (payload) => {
      if (!drawerState.kind) return;
      const action = drawerState.mode === 'edit' && drawerState.record?.id
        ? () => updateUserNetworkingConnection(userId, drawerState.record.id, payload)
        : () => createUserNetworkingConnection(userId, payload);
      await handleAction(action, 'Connection saved.');
    },
    [drawerState, handleAction, userId],
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
          <DetailRow label="Session" value={sessionLabel} />
          <DetailRow label="Status" value={formatStatusLabel(booking.status)} />
          <DetailRow label="Seat" value={booking.seatNumber ?? '—'} />
          <DetailRow label="Join" value={booking.joinUrl ?? '—'} />
          <DetailRow label="Start" value={booking.session?.startTime ? formatDateTime(booking.session.startTime) : '—'} />
          <DetailRow label="Check-in" value={booking.checkedInAt ? formatRelativeTime(booking.checkedInAt) : 'Pending'} />
          <DetailRow label="Completed" value={booking.completedAt ? formatRelativeTime(booking.completedAt) : 'Open'} />
          <DetailRow label="Notes" value={booking.metadata?.userNotes ?? booking.userNotes ?? '—'} />
        </div>
      );
    }
    if (detailState.kind === 'purchase') {
      const order = detailState.record;
      const sessionLabel = resolveSessionLabel(order.session, order.sessionId);
      return (
        <div className="space-y-3">
          <DetailRow label="Session" value={sessionLabel} />
          <DetailRow label="Status" value={formatStatusLabel(order.status)} />
          <DetailRow label="Amount" value={formatMoneyFromCents(order.amountCents, order.currency)} />
          <DetailRow label="Purchased" value={order.purchasedAt ? formatDateTime(order.purchasedAt) : '—'} />
          <DetailRow label="Reference" value={order.reference ?? '—'} />
          <DetailRow label="Notes" value={order.notes ?? order.metadata?.userNotes ?? '—'} />
        </div>
      );
    }
    if (detailState.kind === 'connection') {
      const connection = detailState.record;
      return (
        <div className="space-y-3">
          <DetailRow label="Name" value={resolveConnectionName(connection)} />
          <DetailRow label="Status" value={formatStatusLabel(connection.followStatus)} />
          <DetailRow label="Email" value={connection.connectionEmail ?? '—'} />
          <DetailRow label="Headline" value={connection.connectionHeadline ?? '—'} />
          <DetailRow label="Company" value={connection.connectionCompany ?? '—'} />
          <DetailRow label="Session" value={connection.sessionId ? resolveSessionLabel(connection.session, connection.sessionId) : '—'} />
          <DetailRow label="Met" value={connection.connectedAt ? formatDateTime(connection.connectedAt) : '—'} />
          <DetailRow label="Last" value={connection.lastContactedAt ? formatDateTime(connection.lastContactedAt) : '—'} />
          <DetailRow label="Tags" value={Array.isArray(connection.tags) ? connection.tags.join(', ') || '—' : '—'} />
          <DetailRow label="Notes" value={connection.notes ?? '—'} />
        </div>
      );
    }
    return null;
  }, [detailState]);

  const drawerLabel = drawerState.kind ? DRAWER_TITLES[drawerState.kind] : '';
  const drawerTitle = drawerLabel
    ? drawerState.record
      ? `Edit ${drawerLabel}`
      : `Add ${drawerLabel}`
    : '';
  const drawerSubtitle = drawerLabel
    ? drawerState.record
      ? 'Update details and keep everything in sync.'
      : 'Capture new activity in seconds.'
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Networking</h2>
          <NetworkingTabBar value={activeTab} onChange={setActiveTab} tabs={TABS} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={() => {
              setActiveTab('Sessions');
              openDrawer('booking');
            }}
          >
            Book
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={() => {
              setActiveTab('Spend');
              openDrawer('purchase');
            }}
          >
            Spend
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={() => {
              setActiveTab('People');
              openDrawer('connection');
            }}
          >
            People
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
            onClick={() => window.open('/dashboard/company/networking', '_blank')}
          >
            Hub
          </button>
        </div>
      </div>

      {(feedback || error) && (
        <div
          className={classNames(
            'rounded-3xl px-4 py-3 text-sm',
            feedback && !error
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700',
          )}
        >
          {error || feedback}
        </div>
      )}

      {activeTab === 'Home' ? (
        <NetworkingSummaryBoard
          summary={{ ...summary, currency: summary.currency ?? networking?.purchases?.currency ?? 'USD' }}
          bookings={bookings}
          purchases={purchases}
          connections={connections}
          onOpenTab={(tab) => setActiveTab(tab)}
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

      <NetworkingSlideOver
        open={drawerState.open}
        onClose={closeDrawer}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        preventClose={busy}
      >
        {drawerState.kind === 'booking' ? (
          <NetworkingBookingForm
            mode={drawerState.mode}
            initialValue={drawerState.record}
            onSubmit={handleSaveBooking}
            busy={busy}
            sessionOptions={sessionOptions}
            loadingSessions={loadingSessions}
          />
        ) : null}
        {drawerState.kind === 'purchase' ? (
          <NetworkingPurchaseForm
            mode={drawerState.mode}
            initialValue={drawerState.record}
            onSubmit={handleSavePurchase}
            busy={busy}
            sessionOptions={sessionOptions}
            loadingSessions={loadingSessions}
          />
        ) : null}
        {drawerState.kind === 'connection' ? (
          <NetworkingConnectionForm
            mode={drawerState.mode}
            initialValue={drawerState.record}
            onSubmit={handleSaveConnection}
            busy={busy}
            sessionOptions={sessionOptions}
            loadingSessions={loadingSessions}
          />
        ) : null}
      </NetworkingSlideOver>

      <NetworkingSlideOver open={detailState.open} onClose={closeDetail} title="Details" size="wide">
        {detailContent}
      </NetworkingSlideOver>
    </div>
  );
}

UserNetworkingSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  networking: PropTypes.shape({
    summary: PropTypes.object,
    bookings: PropTypes.shape({ list: PropTypes.array }),
    purchases: PropTypes.shape({ list: PropTypes.array, currency: PropTypes.string }),
    connections: PropTypes.shape({ list: PropTypes.array }),
  }),
  onRefresh: PropTypes.func,
};

UserNetworkingSection.defaultProps = {
  networking: null,
  onRefresh: null,
};
