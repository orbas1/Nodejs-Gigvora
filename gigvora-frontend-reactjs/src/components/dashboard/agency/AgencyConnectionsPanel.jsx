import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import UserAvatar from '../../UserAvatar.jsx';

function formatName(user) {
  if (!user) {
    return 'Unknown member';
  }
  return user.name || user.email || `User ${user.id ?? '—'}`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function ConnectionRow({
  connection,
  busy,
  type,
  onAccept,
  onReject,
  onRemove,
}) {
  const profileId =
    type === 'incoming'
      ? connection.requester?.id
      : type === 'outgoing'
        ? connection.target?.id
        : connection.counterpart?.id;
  const name =
    type === 'incoming'
      ? formatName(connection.requester)
      : type === 'outgoing'
        ? formatName(connection.target)
        : formatName(connection.counterpart);
  const location =
    type === 'incoming'
      ? connection.requester?.location
      : type === 'outgoing'
        ? connection.target?.location
        : connection.counterpart?.location;
  const avatarUrl =
    type === 'incoming'
      ? connection.requester?.avatarUrl
      : type === 'outgoing'
        ? connection.target?.avatarUrl
        : connection.counterpart?.avatarUrl;
  const avatarSeed =
    type === 'incoming'
      ? connection.requester?.avatarSeed
      : type === 'outgoing'
        ? connection.target?.avatarSeed
        : connection.counterpart?.avatarSeed;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <UserAvatar name={name} imageUrl={avatarUrl} seed={avatarSeed ?? name} size="md" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            {type === 'accepted'
              ? `Connected ${formatDate(connection.updatedAt ?? connection.createdAt)}`
              : `Requested ${formatDate(connection.createdAt)}`}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {location ? <span>{location}</span> : null}
            {profileId ? (
              <Link
                to={`/profile/${profileId}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-transparent px-2 py-0.5 font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
              >
                View profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {type === 'incoming' ? (
          <>
            <button
              type="button"
              onClick={() => onAccept?.(connection.id)}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onReject?.(connection.id)}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Decline
            </button>
          </>
        ) : null}
        {type === 'outgoing' ? (
          <button
            type="button"
            onClick={() => onRemove?.(connection.id)}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel request
          </button>
        ) : null}
        {type === 'accepted' ? (
          <button
            type="button"
            onClick={() => onRemove?.(connection.id)}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove connection
          </button>
        ) : null}
      </div>
    </article>
  );
}

ConnectionRow.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    requester: PropTypes.object,
    target: PropTypes.object,
    counterpart: PropTypes.object,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }).isRequired,
  busy: PropTypes.bool,
  type: PropTypes.oneOf(['incoming', 'outgoing', 'accepted']).isRequired,
  onAccept: PropTypes.func,
  onReject: PropTypes.func,
  onRemove: PropTypes.func,
};

ConnectionRow.defaultProps = {
  busy: false,
  onAccept: undefined,
  onReject: undefined,
  onRemove: undefined,
};

export default function AgencyConnectionsPanel({
  connections,
  loading = false,
  error,
  onRefresh,
  onRequestConnection,
  onRespond,
  onRemove,
  pendingUpdates = {},
}) {
  const [targetId, setTargetId] = useState('');
  const [requestError, setRequestError] = useState(null);
  const [requesting, setRequesting] = useState(false);

  const accepted = connections?.accepted ?? [];
  const pendingIncoming = connections?.pendingIncoming ?? [];
  const pendingOutgoing = connections?.pendingOutgoing ?? [];
  const summary = connections?.summary ?? { accepted: accepted.length, pendingIncoming: pendingIncoming.length, pendingOutgoing: pendingOutgoing.length };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    if (!targetId.trim() || typeof onRequestConnection !== 'function') {
      return;
    }
    const numericId = Number(targetId.trim());
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setRequestError('Enter a valid user ID.');
      return;
    }
    setRequestError(null);
    setRequesting(true);
    try {
      await onRequestConnection(numericId);
      setTargetId('');
    } catch (requestError_) {
      setRequestError(requestError_?.message || 'Could not send connection request.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section id="agency-connections" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="agency-connections-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="agency-connections-heading" className="text-xl font-semibold text-slate-900">
            Connections
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleRequestSubmit} className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-sm font-semibold text-slate-700">New request</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="number"
            min="1"
            step="1"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="User ID"
            className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            disabled={requesting || !targetId.trim()}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {requesting ? 'Sending…' : 'Send request'}
          </button>
        </div>
        {requestError ? <p className="mt-2 text-sm text-rose-600">{requestError}</p> : null}
      </form>

      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-6 space-y-6">
        <section aria-label="Pending incoming connections" className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Incoming approvals</h3>
              <p className="text-xs text-slate-500">{summary.pendingIncoming} awaiting your decision.</p>
            </div>
          </header>
          {pendingIncoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">No incoming requests.</p>
          ) : (
            pendingIncoming.map((connection) => (
              <ConnectionRow
                key={`incoming-${connection.id}`}
                connection={connection}
                busy={Boolean(pendingUpdates[connection.id]) || loading}
                type="incoming"
                onAccept={(connectionId) => onRespond?.(connectionId, 'accept')}
                onReject={(connectionId) => onRespond?.(connectionId, 'reject')}
              />
            ))
          )}
        </section>

        <section aria-label="Pending outgoing connections" className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Outgoing requests</h3>
              <p className="text-xs text-slate-500">{summary.pendingOutgoing} waiting on partners.</p>
            </div>
          </header>
          {pendingOutgoing.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">No pending requests.</p>
          ) : (
            pendingOutgoing.map((connection) => (
              <ConnectionRow
                key={`outgoing-${connection.id}`}
                connection={connection}
                busy={Boolean(pendingUpdates[connection.id]) || loading}
                type="outgoing"
                onRemove={onRemove}
              />
            ))
          )}
        </section>

        <section aria-label="Accepted connections" className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active connections</h3>
              <p className="text-xs text-slate-500">{summary.accepted} members connected to your agency.</p>
            </div>
          </header>
          {accepted.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">No active connections.</p>
          ) : (
            accepted.map((connection) => (
              <ConnectionRow
                key={`accepted-${connection.id}`}
                connection={connection}
                busy={Boolean(pendingUpdates[connection.id]) || loading}
                type="accepted"
                onRemove={onRemove}
              />
            ))
          )}
        </section>
      </div>
    </section>
  );
}

AgencyConnectionsPanel.propTypes = {
  connections: PropTypes.shape({
    accepted: PropTypes.array,
    pendingIncoming: PropTypes.array,
    pendingOutgoing: PropTypes.array,
    summary: PropTypes.object,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onRequestConnection: PropTypes.func,
  onRespond: PropTypes.func,
  onRemove: PropTypes.func,
  pendingUpdates: PropTypes.object,
};

AgencyConnectionsPanel.defaultProps = {
  connections: undefined,
  loading: false,
  error: undefined,
  onRefresh: undefined,
  onRequestConnection: undefined,
  onRespond: undefined,
  onRemove: undefined,
  pendingUpdates: undefined,
};
