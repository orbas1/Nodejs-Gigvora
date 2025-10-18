import { EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function ConnectionRow({ connection, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(connection)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex flex-col">
        <span className="text-base font-semibold text-slate-900">{connection.counterpart?.name || connection.counterpartName || 'Contact'}</span>
        <span className="text-xs uppercase tracking-wide text-slate-400">{connection.status}</span>
      </div>
      <div className="hidden flex-col text-right text-xs text-slate-500 sm:flex">
        <span>Follow {formatDate(connection.followUpAt)}</span>
        {connection.counterpart?.email || connection.counterpartEmail ? (
          <span className="mt-1 inline-flex items-center gap-1 text-slate-500">
            <EnvelopeIcon className="h-3.5 w-3.5" />
            {connection.counterpart?.email || connection.counterpartEmail}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function ConnectionsBoard({ connections, loading, onAdd, onOpen }) {
  const items = connections?.items ?? [];

  if (loading && !items.length) {
    return <p className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Loading contacts…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">Last {connections?.total ?? items.length} contacts</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <UserPlusIcon className="h-4 w-4" /> New
        </button>
      </div>
      {!items.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-slate-600">No contacts logged</p>
          <p className="mt-2 text-sm text-slate-500">Add the people you met so follow-ups stay on track.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
