import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import MentorAvailabilityPlanner from '../../../../components/mentor/MentorAvailabilityPlanner.jsx';
import MentorPackageBuilder from '../../../../components/mentor/MentorPackageBuilder.jsx';

const DEFAULT_BOOKING = {
  mentee: '',
  role: '',
  package: '',
  focus: '',
  scheduledAt: '',
  status: 'Scheduled',
  price: '',
  currency: '£',
  paymentStatus: 'Pending',
  channel: 'Explorer',
  segment: 'active',
  conferenceLink: '',
  notes: '',
};

const BOOKING_STATUSES = ['Scheduled', 'Awaiting pre-work', 'Completed', 'Cancelled', 'Rescheduled'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Refunded', 'Overdue'];

export default function MentorshipManagementSection({
  bookings,
  availability,
  packages,
  segments,
  onCreateBooking,
  onUpdateBooking,
  onDeleteBooking,
  onSaveAvailability,
  availabilitySaving,
  onSavePackages,
  packagesSaving,
  bookingSaving,
}) {
  const [bookingForm, setBookingForm] = useState(DEFAULT_BOOKING);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!editingBookingId) {
      setBookingForm(DEFAULT_BOOKING);
    }
  }, [editingBookingId]);

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      mentee: bookingForm.mentee,
      role: bookingForm.role,
      package: bookingForm.package,
      focus: bookingForm.focus,
      scheduledAt: bookingForm.scheduledAt,
      status: bookingForm.status,
      price: bookingForm.price,
      currency: bookingForm.currency,
      paymentStatus: bookingForm.paymentStatus,
      channel: bookingForm.channel,
      segment: bookingForm.segment,
      conferenceLink: bookingForm.conferenceLink,
      notes: bookingForm.notes,
    };
    try {
      if (editingBookingId) {
        await onUpdateBooking?.(editingBookingId, payload);
      } else {
        await onCreateBooking?.(payload);
      }
      setBookingForm(DEFAULT_BOOKING);
      setEditingBookingId(null);
      setFeedback({ type: 'success', message: 'Booking saved.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save booking.' });
    }
  };

  const upcomingCounts = useMemo(() => {
    const bySegment = new Map();
    (bookings ?? []).forEach((booking) => {
      const count = bySegment.get(booking.segment) ?? 0;
      bySegment.set(booking.segment, count + 1);
    });
    return bySegment;
  }, [bookings]);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Mentorship management</p>
          <h2 className="text-2xl font-semibold text-slate-900">Confirm sessions, iterate availability, and evolve packages</h2>
          <p className="text-sm text-slate-600">
            Log upcoming sessions, sync Explorer availability, and keep your flagship packages fresh. This workspace powers
            automated reminders, payment flows, and mentee onboarding journeys.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(segments ?? []).map((segment) => (
            <div key={segment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{segment.title}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{upcomingCounts.get(segment.id) ?? 0}</p>
              <p className="text-xs text-slate-500">{segment.description}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <form onSubmit={handleBookingSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingBookingId ? 'Update mentorship booking' : 'Log mentorship booking'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingBookingId(null);
                  setBookingForm(DEFAULT_BOOKING);
                  setFeedback(null);
                }}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Mentee name
                <input
                  type="text"
                  required
                  value={bookingForm.mentee}
                  onChange={(event) => setBookingForm((current) => ({ ...current, mentee: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Mentee role
                <input
                  type="text"
                  value={bookingForm.role}
                  onChange={(event) => setBookingForm((current) => ({ ...current, role: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Package
                <input
                  type="text"
                  value={bookingForm.package}
                  onChange={(event) => setBookingForm((current) => ({ ...current, package: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Focus
                <input
                  type="text"
                  value={bookingForm.focus}
                  onChange={(event) => setBookingForm((current) => ({ ...current, focus: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Scheduled at
                <input
                  type="datetime-local"
                  required
                  value={bookingForm.scheduledAt}
                  onChange={(event) => setBookingForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Video link
                <input
                  type="url"
                  value={bookingForm.conferenceLink}
                  onChange={(event) => setBookingForm((current) => ({ ...current, conferenceLink: event.target.value }))}
                  placeholder="https://meet.gigvora.com/session"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Price
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bookingForm.currency}
                    onChange={(event) => setBookingForm((current) => ({ ...current, currency: event.target.value }))}
                    className="w-16 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingForm.price}
                    onChange={(event) => setBookingForm((current) => ({ ...current, price: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Booking status
                <select
                  value={bookingForm.status}
                  onChange={(event) => setBookingForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Payment
                <select
                  value={bookingForm.paymentStatus}
                  onChange={(event) => setBookingForm((current) => ({ ...current, paymentStatus: event.target.value }))}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Channel
                <input
                  type="text"
                  value={bookingForm.channel}
                  onChange={(event) => setBookingForm((current) => ({ ...current, channel: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Segment
                <input
                  type="text"
                  value={bookingForm.segment}
                  onChange={(event) => setBookingForm((current) => ({ ...current, segment: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Notes
              <textarea
                rows="3"
                value={bookingForm.notes}
                onChange={(event) => setBookingForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={bookingSaving}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {bookingSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ClockIcon className="h-4 w-4" />}
                {bookingSaving ? 'Saving…' : editingBookingId ? 'Update booking' : 'Create booking'}
              </button>
              {feedback ? (
                <p className={`text-sm font-medium ${feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {feedback.message}
                </p>
              ) : null}
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Mentee</th>
                  <th className="px-4 py-3 text-left font-semibold">Package</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {(bookings ?? []).map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{booking.mentee}</div>
                      <div className="text-xs text-slate-500">{booking.role}</div>
                      <div className="text-xs text-slate-500">{booking.focus}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{booking.package}</div>
                      <div className="text-xs text-slate-500">£{booking.price?.toLocaleString?.() ?? booking.price}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          booking.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : booking.status === 'Awaiting pre-work'
                              ? 'bg-amber-100 text-amber-700'
                              : booking.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{booking.paymentStatus}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
                          onClick={() => {
                            setEditingBookingId(booking.id);
                            setBookingForm({
                              mentee: booking.mentee,
                              role: booking.role,
                              package: booking.package,
                              focus: booking.focus,
                              scheduledAt: booking.scheduledAt ? new Date(booking.scheduledAt).toISOString().slice(0, 16) : '',
                              status: booking.status,
                              price: booking.price,
                              currency: booking.currency ?? '£',
                              paymentStatus: booking.paymentStatus,
                              channel: booking.channel ?? 'Explorer',
                              segment: booking.segment ?? 'active',
                              conferenceLink: booking.conferenceLink ?? '',
                              notes: booking.notes ?? '',
                            });
                            setFeedback(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          onClick={async () => {
                            try {
                              await onDeleteBooking?.(booking.id);
                              if (editingBookingId === booking.id) {
                                setEditingBookingId(null);
                                setBookingForm(DEFAULT_BOOKING);
                              }
                              setFeedback({ type: 'success', message: 'Booking removed.' });
                            } catch (deleteError) {
                              setFeedback({
                                type: 'error',
                                message: deleteError.message || 'Unable to remove booking.',
                              });
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <MentorAvailabilityPlanner
            availability={availability}
            onSave={onSaveAvailability}
            saving={availabilitySaving}
          />
          <MentorPackageBuilder packages={packages} onSave={onSavePackages} saving={packagesSaving} />
        </div>
      </div>
    </section>
  );
}

MentorshipManagementSection.propTypes = {
  bookings: PropTypes.arrayOf(PropTypes.object),
  availability: PropTypes.arrayOf(PropTypes.object),
  packages: PropTypes.arrayOf(PropTypes.object),
  segments: PropTypes.arrayOf(PropTypes.object),
  onCreateBooking: PropTypes.func,
  onUpdateBooking: PropTypes.func,
  onDeleteBooking: PropTypes.func,
  onSaveAvailability: PropTypes.func,
  availabilitySaving: PropTypes.bool,
  onSavePackages: PropTypes.func,
  packagesSaving: PropTypes.bool,
  bookingSaving: PropTypes.bool,
};

MentorshipManagementSection.defaultProps = {
  bookings: [],
  availability: [],
  packages: [],
  segments: [],
  onCreateBooking: undefined,
  onUpdateBooking: undefined,
  onDeleteBooking: undefined,
  onSaveAvailability: undefined,
  availabilitySaving: false,
  onSavePackages: undefined,
  packagesSaving: false,
  bookingSaving: false,
};
