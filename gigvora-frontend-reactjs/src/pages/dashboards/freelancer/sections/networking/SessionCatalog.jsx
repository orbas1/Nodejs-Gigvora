import { CalendarIcon, ClockIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function centsToAmount(cents) {
  if (cents == null) return null;
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) return null;
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function SessionCard({ session, onReserve }) {
  const price = centsToAmount(session.priceCents);
  const canReserve = typeof onReserve === 'function';
  const handleReserve = () => {
    if (!canReserve) return;
    onReserve(session);
  };
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {formatDateTime(session.startTime)}</p>
          {session.endTime ? (
            <p className="flex items-center gap-2"><ClockIcon className="h-4 w-4" /> Ends {formatDateTime(session.endTime)}</p>
          ) : null}
          {session.hostName ? (
            <p className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> {session.hostName}</p>
          ) : null}
          {price ? (
            <p className="flex items-center gap-2"><CurrencyDollarIcon className="h-4 w-4" /> {price}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleReserve}
        disabled={!canReserve}
        aria-disabled={!canReserve}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Reserve
      </button>
    </article>
  );
}

export default function SessionCatalog({ sessions, loading, onReserve }) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  if (loading && !safeSessions.length) {
    return (
      <p
        className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500"
        role="status"
        aria-live="polite"
      >
        Loading sessions…
      </p>
    );
  }

  if (!safeSessions.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-base font-semibold text-slate-600">No sessions ready</p>
        <p className="mt-2 text-sm text-slate-500">Check back soon or ask your concierge for upcoming tables.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {safeSessions.map((session) => (
        <SessionCard key={session.id} session={session} onReserve={onReserve} />
      ))}
    </div>
  );
}
