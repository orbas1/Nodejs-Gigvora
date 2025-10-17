import { CalendarIcon, CreditCardIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function centsToAmount(cents, currency = 'USD') {
  if (cents == null) return '—';
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch (error) {
    return amount.toFixed(2);
  }
}

function BookingCard({ booking, onManage }) {
  const currency = booking.purchaseCurrency || booking.session?.currency || 'USD';
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{booking.session?.title ?? 'Session'}</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{booking.status}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{booking.paymentStatus}</span>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarIcon className="h-4 w-4" /> {formatDateTime(booking.session?.startTime)}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CreditCardIcon className="h-4 w-4" />
          {centsToAmount(booking.purchaseCents, currency)}
        </p>
        {booking.metadata?.bookingNote ? (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{booking.metadata.bookingNote}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onManage(booking)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        <PencilSquareIcon className="h-4 w-4" /> Manage
      </button>
    </article>
  );
}

export default function BookingsBoard({ bookings, loading, onManage }) {
  if (loading && !bookings.length) {
    return <p className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Loading bookings…</p>;
  }

  if (!bookings.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-base font-semibold text-slate-600">No bookings yet</p>
        <p className="mt-2 text-sm text-slate-500">Reserve your first table from the Plan tab.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} onManage={onManage} />
      ))}
    </div>
  );
}
