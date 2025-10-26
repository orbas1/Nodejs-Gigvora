import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import { formatMoney } from './utils.js';

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
};

function StatCard({ label, value, hint, tone }) {
  const toneClasses =
    tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'critical'
          ? 'border-rose-200 bg-rose-50'
          : 'border-slate-200 bg-white';

  return (
    <div className={classNames('flex flex-col gap-1 rounded-3xl border p-4 shadow-sm', toneClasses)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.node,
  tone: PropTypes.oneOf(['neutral', 'positive', 'warning', 'critical']),
};

StatCard.defaultProps = {
  hint: null,
  tone: 'neutral',
};

function resolveDirection(invitation) {
  if (invitation.direction === 'incoming' || invitation.direction === 'outgoing') {
    return invitation.direction;
  }
  if (invitation.sentBy && invitation.sentBy.id) {
    return 'outgoing';
  }
  if (invitation.metadata?.direction) {
    return invitation.metadata.direction === 'outgoing' ? 'outgoing' : 'incoming';
  }
  return invitation.sentById ? 'outgoing' : 'incoming';
}

function normalizeInvitation(invitation) {
  const direction = resolveDirection(invitation);
  const workspaceId = invitation.workspace?.id
    ?? invitation.agencyWorkspace?.id
    ?? invitation.agencyWorkspaceId
    ?? invitation.workspaceId
    ?? invitation.workspace?.slug
    ?? invitation.workspaceSlug
    ?? invitation.workspaceName;
  const workspaceName = invitation.workspace?.name
    ?? invitation.agencyWorkspace?.name
    ?? invitation.workspaceName
    ?? 'Workspace';
  const contactName = invitation.freelancerName
    ?? invitation.contactName
    ?? invitation.recipientName
    ?? invitation.recipient?.name
    ?? invitation.contact?.name
    ?? invitation.email
    ?? 'Contact';
  const contactEmail = invitation.freelancerEmail
    ?? invitation.contactEmail
    ?? invitation.recipient?.email
    ?? invitation.email
    ?? null;
  const sentAt = invitation.sentAt ?? invitation.createdAt ?? null;
  const responseDueAt = invitation.responseDueAt ?? invitation.response_due_at ?? null;
  const respondedAt = invitation.respondedAt ?? invitation.responded_at ?? null;
  const status = invitation.status ?? 'pending';
  const isPending = status === 'pending';
  const dueDate = responseDueAt ? new Date(responseDueAt) : null;
  const isOverdue = Boolean(isPending && dueDate && dueDate.getTime() < Date.now());

  return {
    raw: invitation,
    id: invitation.id,
    status,
    direction,
    workspaceName,
    workspaceKey: workspaceId ? String(workspaceId) : null,
    roleTitle: invitation.roleTitle ?? invitation.role ?? null,
    engagementType: invitation.engagementType ?? invitation.type ?? null,
    proposedRetainer: invitation.proposedRetainer ?? invitation.retainerAmount ?? null,
    currency: invitation.currency ?? 'USD',
    message: invitation.message ?? '',
    notes: invitation.notes ?? '',
    sentAt,
    responseDueAt,
    respondedAt,
    contactName,
    contactEmail,
    isOverdue,
    tab: direction === 'incoming' ? 'received' : 'sent',
  };
}

function InvitationCard({
  invitation,
  noteDraft,
  onNoteChange,
  onAccept,
  onDecline,
  onResend,
  onCancel,
  onSaveNote,
  busyAction,
}) {
  const statusLabel = STATUS_LABELS[invitation.status] ?? invitation.status;
  const statusTone =
    invitation.status === 'accepted'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : invitation.status === 'pending'
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-rose-600 bg-rose-50 border-rose-200';
  const canRespond = invitation.status === 'pending' && invitation.direction === 'incoming';
  const canManageOutgoing = invitation.direction === 'sent' || invitation.direction === 'outgoing';
  const canCancel = invitation.status === 'pending' && canManageOutgoing;
  const canResend = canManageOutgoing && invitation.status !== 'accepted';
  const busy = busyAction?.id === invitation.id;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{invitation.contactName}</h3>
            <span className={classNames('rounded-full border px-3 py-0.5 text-[11px] font-semibold', statusTone)}>
              {statusLabel}
            </span>
            {invitation.isOverdue ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-[11px] font-semibold text-rose-600">
                Response overdue
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">{invitation.contactEmail || 'Email not shared'}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          {invitation.sentAt ? <p>Sent {formatRelativeTime(invitation.sentAt)}</p> : null}
          {invitation.responseDueAt ? <p>Due {formatRelativeTime(invitation.responseDueAt)}</p> : null}
          {invitation.respondedAt ? <p>Responded {formatRelativeTime(invitation.respondedAt)}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
        <div>
          <span className="block font-semibold text-slate-500">Workspace</span>
          <span className="text-slate-700">{invitation.workspaceName}</span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Engagement</span>
          <span className="text-slate-700">
            {invitation.roleTitle ? `${invitation.roleTitle} • ` : ''}
            {invitation.engagementType ? invitation.engagementType.replace(/_/g, ' ') : '—'}
          </span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Retainer</span>
          <span className="text-slate-700">
            {invitation.proposedRetainer != null
              ? formatMoney(invitation.proposedRetainer, invitation.currency)
              : '—'}
          </span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Direction</span>
          <span className="text-slate-700">{invitation.direction === 'incoming' ? 'Received' : 'Sent'}</span>
        </div>
      </div>

      {invitation.message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          {invitation.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`invitation-notes-${invitation.id}`}>
          Private notes
        </label>
        <textarea
          id={`invitation-notes-${invitation.id}`}
          value={noteDraft}
          onChange={(event) => onNoteChange(invitation.id, event.target.value)}
          placeholder="Add context or follow-up reminders"
          className="min-h-[96px] rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onNoteChange(invitation.id, invitation.notes ?? '')}
            disabled={busy}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
            onClick={() => onSaveNote(invitation.id, noteDraft)}
            disabled={busy || noteDraft === (invitation.notes ?? '')}
          >
            Save note
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {canRespond ? (
          <>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onAccept(invitation.id)}
              disabled={busy}
            >
              Accept
            </button>
            <button
              type="button"
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onDecline(invitation.id)}
              disabled={busy}
            >
              Decline
            </button>
          </>
        ) : null}
        {canResend ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onResend(invitation.id)}
            disabled={busy}
          >
            Resend
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onCancel(invitation.id)}
            disabled={busy}
          >
            Cancel invite
          </button>
        ) : null}
      </div>
    </article>
  );
}

InvitationCard.propTypes = {
  invitation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired,
    workspaceName: PropTypes.string.isRequired,
    workspaceKey: PropTypes.string,
    roleTitle: PropTypes.string,
    engagementType: PropTypes.string,
    proposedRetainer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    message: PropTypes.string,
    notes: PropTypes.string,
    sentAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    responseDueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    respondedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    contactName: PropTypes.string.isRequired,
    contactEmail: PropTypes.string,
    isOverdue: PropTypes.bool,
  }).isRequired,
  noteDraft: PropTypes.string.isRequired,
  onNoteChange: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  busyAction: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), type: PropTypes.string }),
};

InvitationCard.defaultProps = {
  busyAction: null,
};

export default function InvitationManager({
  invitations,
  loading,
  onAccept,
  onDecline,
  onResend,
  onCancel,
  onUpdateNotes,
}) {
  const preparedInvitations = useMemo(() => (invitations ?? []).map((invitation) => normalizeInvitation(invitation)), [invitations]);
  const [activeTab, setActiveTab] = useState('received');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteDrafts, setNoteDrafts] = useState(() => {
    const initial = {};
    preparedInvitations.forEach((invitation) => {
      initial[invitation.id] = invitation.notes ?? '';
    });
    return initial;
  });
  const [busyAction, setBusyAction] = useState(null);

  useEffect(() => {
    setNoteDrafts((current) => {
      const next = {};
      preparedInvitations.forEach((invitation) => {
        const existing = current[invitation.id];
        next[invitation.id] = existing != null ? existing : invitation.notes ?? '';
      });
      return next;
    });
  }, [preparedInvitations]);

  const statusCounts = useMemo(() => {
    return preparedInvitations.reduce(
      (acc, invitation) => {
        const status = invitation.status ?? 'pending';
        acc[status] = (acc[status] ?? 0) + 1;
        if (invitation.isOverdue) {
          acc.overdue = (acc.overdue ?? 0) + 1;
        }
        if (invitation.tab === 'received' && invitation.status === 'pending') {
          acc.inbox = (acc.inbox ?? 0) + 1;
        }
        return acc;
      },
      { overdue: 0, inbox: 0 },
    );
  }, [preparedInvitations]);

  const workspaceOptions = useMemo(() => {
    const map = new Map();
    preparedInvitations.forEach((invitation) => {
      if (!invitation.workspaceKey) return;
      map.set(invitation.workspaceKey, invitation.workspaceName);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [preparedInvitations]);

  const filteredInvitations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return preparedInvitations
      .filter((invitation) => {
        if (activeTab !== 'all' && invitation.tab !== activeTab) {
          return false;
        }
        if (statusFilter !== 'all' && invitation.status !== statusFilter) {
          return false;
        }
        if (workspaceFilter !== 'all' && invitation.workspaceKey !== workspaceFilter) {
          return false;
        }
        if (!query) {
          return true;
        }
        const haystack = [
          invitation.contactName,
          invitation.contactEmail,
          invitation.workspaceName,
          invitation.roleTitle,
          invitation.engagementType,
          invitation.message,
          invitation.notes,
        ]
          .map((entry) => String(entry ?? '').toLowerCase())
          .join(' ');
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const sentA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const sentB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return sentB - sentA;
      });
  }, [preparedInvitations, activeTab, statusFilter, workspaceFilter, searchTerm]);

  const handleNoteChange = useCallback((id, value) => {
    setNoteDrafts((current) => ({ ...current, [id]: value }));
  }, []);

  const runAction = useCallback(
    async (type, handler, invitationId, payload) => {
      if (!handler) return;
      setBusyAction({ type, id: invitationId });
      try {
        await handler(invitationId, payload);
      } finally {
        setBusyAction(null);
      }
    },
    [],
  );

  const handleSaveNote = useCallback(
    async (invitationId, noteValue) => {
      if (!onUpdateNotes) {
        return;
      }
      await runAction('note', onUpdateNotes, invitationId, { notes: noteValue });
    },
    [onUpdateNotes, runAction],
  );

  const tabs = [
    { id: 'received', label: 'Received' },
    { id: 'sent', label: 'Sent' },
    { id: 'all', label: 'All' },
  ];

  const statusOptions = useMemo(() => {
    const unique = new Set(preparedInvitations.map((invitation) => invitation.status));
    return ['all', ...Array.from(unique)];
  }, [preparedInvitations]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={preparedInvitations.length} hint={`${filteredInvitations.length} shown`} />
        <StatCard
          label="Awaiting response"
          value={statusCounts.inbox ?? 0}
          hint="Pending invites you need to review"
          tone={statusCounts.inbox ? 'warning' : 'neutral'}
        />
        <StatCard
          label="Overdue"
          value={statusCounts.overdue ?? 0}
          hint="Past due date"
          tone={statusCounts.overdue ? 'critical' : 'neutral'}
        />
        <StatCard
          label="Accepted"
          value={statusCounts.accepted ?? 0}
          hint="Recent wins"
          tone="positive"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={classNames(
                'rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-300'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All statuses' : STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Workspace</span>
            <select
              value={workspaceFilter}
              onChange={(event) => setWorkspaceFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All workspaces</option>
              {workspaceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus-within:border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20 lg:w-auto">
          <span className="font-semibold text-slate-500">Search</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search names, workspaces, notes"
            className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
            ))
          : filteredInvitations.length
            ? filteredInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  noteDraft={noteDrafts[invitation.id] ?? invitation.notes ?? ''}
                  onNoteChange={handleNoteChange}
                  onAccept={(id) => runAction('accept', onAccept, id)}
                  onDecline={(id) => runAction('decline', onDecline, id)}
                  onResend={(id) => runAction('resend', onResend, id)}
                  onCancel={(id) => runAction('cancel', onCancel, id)}
                  onSaveNote={handleSaveNote}
                  busyAction={busyAction}
                />
              ))
            : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center text-sm text-slate-500">
                No invitations match the filters yet.
              </div>
            )}
      </div>
    </div>
  );
}

InvitationManager.propTypes = {
  invitations: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  onResend: PropTypes.func,
  onCancel: PropTypes.func,
  onUpdateNotes: PropTypes.func,
};

InvitationManager.defaultProps = {
  invitations: [],
  loading: false,
  onAccept: undefined,
  onDecline: undefined,
  onResend: undefined,
  onCancel: undefined,
  onUpdateNotes: undefined,
};
