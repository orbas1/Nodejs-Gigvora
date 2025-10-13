import { Fragment } from 'react';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatDate(date) {
  try {
    return dateTimeFormatter.format(new Date(date));
  } catch (error) {
    return date;
  }
}

function BookingRow({ booking }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm md:grid-cols-12 md:items-center">
      <div className="md:col-span-3">
        <p className="font-semibold text-slate-800">{booking.mentee}</p>
        <p className="text-xs text-slate-500">{booking.role}</p>
      </div>
      <div className="md:col-span-3">
        <p className="font-semibold text-slate-800">{booking.package}</p>
        <p className="text-xs text-slate-500">{booking.focus}</p>
      </div>
      <div className="md:col-span-3">
        <p className="font-semibold text-slate-800">{formatDate(booking.scheduledAt)}</p>
        <p className="text-xs text-slate-500">{booking.status}</p>
      </div>
      <div className="md:col-span-2">
        <p className="font-semibold text-slate-800">
          {booking.currency}
          {booking.price}
        </p>
        <p className="text-xs text-slate-500">{booking.paymentStatus}</p>
      </div>
      <div className="md:col-span-1 text-right">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {booking.channel}
        </span>
      </div>
    </div>
  );
}

export default function MentorBookingPipeline({ bookings = [], segments = [] }) {
  const grouped = segments.length
    ? segments.map((segment) => ({
        title: segment.title,
        description: segment.description,
        items: bookings.filter((booking) => booking.segment === segment.id),
      }))
    : [
        {
          title: 'Active bookings',
          description: 'Upcoming mentorship sessions with payment tracked in Finance hub.',
          items: bookings,
        },
      ];

  return (
    <section className="space-y-6">
      {grouped.map((group) => (
        <Fragment key={group.title}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
              <p className="text-sm text-slate-500">{group.description}</p>
            </div>
            <a
              href="/finance"
              className="text-xs font-semibold text-accent transition hover:text-accentDark"
            >
              Reconcile in Finance hub →
            </a>
          </div>
          <div className="space-y-3">
            {group.items.length ? (
              group.items.map((booking) => <BookingRow key={booking.id} booking={booking} />)
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No bookings yet. Publish availability or packages to attract mentees.
              </p>
            )}
          </div>
        </Fragment>
      ))}
    </section>
  );
}
