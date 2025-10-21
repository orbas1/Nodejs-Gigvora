import { useEffect, useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import {
  bookFreelancerNetworkingSession,
  updateFreelancerNetworkingSignup,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
  deleteFreelancerNetworkingSignup,
  deleteFreelancerNetworkingConnection,
} from '../../../../../services/freelancerNetworking.js';
import SummaryStrip from './SummaryStrip.jsx';
import ViewSwitcher from './ViewSwitcher.jsx';
import SessionCatalog from './SessionCatalog.jsx';
import BookingsBoard from './BookingsBoard.jsx';
import ConnectionsBoard from './ConnectionsBoard.jsx';
import { BookingPanel, ConnectionPanel } from './Panels.jsx';

const VIEW_OPTIONS = [
  { id: 'plan', label: 'Plan' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'contacts', label: 'Contacts' },
];

function Notice({ tone = 'info', message, onDismiss }) {
  if (!message) {
    return null;
  }
  const toneStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className={`flex items-start justify-between gap-4 rounded-3xl border px-4 py-3 text-sm ${toneStyles[tone]}`}>
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold uppercase tracking-wide">
          Close
        </button>
      ) : null}
    </div>
  );
}

export default function NetworkingSection({
  freelancerId,
  summaryCards = [],
  bookings = [],
  availableSessions = [],
  connections = { total: 0, items: [] },
  config = {},
  loading = false,
  error = null,
  onRefresh,
}) {
  const [view, setView] = useState('plan');
  const [panel, setPanel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (error?.message || typeof error === 'string') {
      const message = typeof error === 'string' ? error : error.message;
      setNotice({ tone: 'error', message });
    }
  }, [error?.message, error]);

  const paymentStatuses = useMemo(() => (config?.paymentStatuses?.length ? config.paymentStatuses : ['unpaid', 'pending', 'paid', 'refunded']), [config?.paymentStatuses]);
  const connectionStatuses = useMemo(
    () => (config?.connectionStatuses?.length ? config.connectionStatuses : ['new', 'follow_up', 'connected', 'archived']),
    [config?.connectionStatuses],
  );
  const connectionTypes = useMemo(
    () => (config?.connectionTypes?.length ? config.connectionTypes : ['follow', 'connect', 'collaboration']),
    [config?.connectionTypes],
  );

  const closePanel = () => {
    if (saving) {
      return;
    }
    setPanel(null);
  };

  const handleSuccess = async (message) => {
    setNotice({ tone: 'success', message });
    await onRefresh?.({ force: true });
  };

  const requireFreelancer = () => {
    if (!freelancerId) {
      throw new Error('Sign in to continue.');
    }
  };

  const handleCreateBooking = async (form) => {
    requireFreelancer();
    setSaving(true);
    try {
      await bookFreelancerNetworkingSession(freelancerId, form.sessionId, {
        purchaseAmount: form.purchaseAmount,
        purchaseCurrency: form.purchaseCurrency,
        paymentStatus: form.paymentStatus,
        note: form.note,
      });
      await handleSuccess('Booking saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBooking = async (bookingId, form) => {
    requireFreelancer();
    setSaving(true);
    try {
      await updateFreelancerNetworkingSignup(freelancerId, bookingId, {
        paymentStatus: form.paymentStatus,
        purchaseAmount: form.purchaseAmount,
        purchaseCurrency: form.purchaseCurrency,
        note: form.note,
      });
      await handleSuccess('Booking updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateConnection = async (form) => {
    requireFreelancer();
    setSaving(true);
    try {
      await createFreelancerNetworkingConnection(freelancerId, form);
      await handleSuccess('Contact saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConnection = async (connectionId, form) => {
    requireFreelancer();
    setSaving(true);
    try {
      await updateFreelancerNetworkingConnection(freelancerId, connectionId, form);
      await handleSuccess('Contact updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    requireFreelancer();
    setSaving(true);
    try {
      const reason = window.prompt('Reason for cancelling this booking? (optional)')?.trim();
      const payload = reason ? { reason } : undefined;
      await deleteFreelancerNetworkingSignup(freelancerId, bookingId, payload);
      await handleSuccess('Booking removed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    requireFreelancer();
    setSaving(true);
    try {
      await deleteFreelancerNetworkingConnection(freelancerId, connectionId);
      await handleSuccess('Contact removed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell id="network-hub" title="Network hub" description="Sessions, spend, and follow-ups.">
      <div className="space-y-6">
        <Notice
          tone={notice?.tone}
          message={notice?.message}
          onDismiss={() => setNotice(null)}
        />
        <SummaryStrip cards={summaryCards} />
        <ViewSwitcher options={VIEW_OPTIONS} activeId={view} onChange={setView} />
        {view === 'plan' ? (
          <SessionCatalog sessions={availableSessions} loading={loading} onReserve={(sessionOption) => setPanel({ type: 'booking-create', session: sessionOption })} />
        ) : null}
        {view === 'bookings' ? (
          <BookingsBoard bookings={bookings} loading={loading} onManage={(booking) => setPanel({ type: 'booking-edit', booking })} />
        ) : null}
        {view === 'contacts' ? (
          <ConnectionsBoard
            connections={connections}
            loading={loading}
            onAdd={() => setPanel({ type: 'connection-create' })}
            onOpen={(connection) => setPanel({ type: 'connection-edit', connection })}
          />
        ) : null}
      </div>

      <BookingPanel
        open={panel?.type === 'booking-create' || panel?.type === 'booking-edit'}
        onClose={closePanel}
        sessions={availableSessions}
        paymentStatuses={paymentStatuses}
        booking={panel?.type === 'booking-edit' ? panel.booking : null}
        session={panel?.type === 'booking-create' ? panel.session : panel?.booking?.session ?? null}
        onCreate={handleCreateBooking}
        onUpdate={handleUpdateBooking}
        onDelete={panel?.type === 'booking-edit' ? () => handleDeleteBooking(panel.booking.id) : undefined}
        busy={saving}
      />

      <ConnectionPanel
        open={panel?.type === 'connection-create' || panel?.type === 'connection-edit'}
        onClose={closePanel}
        connection={panel?.type === 'connection-edit' ? panel.connection : null}
        sessions={availableSessions}
        connectionTypes={connectionTypes}
        connectionStatuses={connectionStatuses}
        onCreate={handleCreateConnection}
        onUpdate={handleUpdateConnection}
        onDelete={panel?.type === 'connection-edit' ? () => handleDeleteConnection(panel.connection.id) : undefined}
        busy={saving}
      />
    </SectionShell>
  );
}
