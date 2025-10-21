import PropTypes from 'prop-types';
import {
  XMarkIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

function DetailRow({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        {typeof value === 'string' || typeof value === 'number' ? (
          <p className="text-sm font-medium text-slate-900">{value}</p>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

const fallbackDateFormatter = (value) => {
  if (!value) return 'TBC';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
};

const fallbackCurrencyFormatter = (value, currency) =>
  `${currency ?? '£'}${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value ?? 0)}`;

export default function MentoringSessionDrawer({
  session = null,
  onClose,
  onEdit,
  onComplete,
  onCancel,
  onReview,
  canEdit = false,
  isBusy = false,
  dateFormatter,
  currencyFormatter,
}) {
  if (!session) return null;
  const formatDate = dateFormatter ?? fallbackDateFormatter;
  const formatCurrency = currencyFormatter ?? fallbackCurrencyFormatter;
  const mentorName = [session?.mentor?.firstName, session?.mentor?.lastName].filter(Boolean).join(' ') || `Mentor #${session.mentorId}`;
  const spend = session.pricePaid != null ? formatCurrency(session.pricePaid, session.currency) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Session</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{session.topic}</h3>
            <p className="mt-1 text-sm text-slate-500">{session.status.charAt(0).toUpperCase() + session.status.slice(1)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/40 hover:text-accent"
            aria-label="Close session"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <DetailRow icon={CalendarDaysIcon} label="Scheduled" value={formatDate(session.scheduledAt)} />
          <DetailRow icon={UserCircleIcon} label="Mentor" value={mentorName} />
          <DetailRow icon={ClockIcon} label="Duration" value={session.durationMinutes ? `${session.durationMinutes} minutes` : null} />
          <DetailRow icon={GlobeAltIcon} label="Format" value={session.meetingType} />
          <DetailRow icon={MapPinIcon} label="Location" value={session.meetingLocation} />
          <DetailRow
            icon={GlobeAltIcon}
            label="Link"
            value={
              session.meetingUrl ? (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-medium text-accent underline"
                >
                  {session.meetingUrl}
                </a>
              ) : null
            }
          />
          <DetailRow icon={StarIcon} label="Package" value={session.order?.packageName} />
          <DetailRow icon={StarIcon} label="Spend" value={spend} />
        </div>

        {session.agenda ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Agenda</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{session.agenda}</p>
          </div>
        ) : null}

        {session.notes ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{session.notes}</p>
          </div>
        ) : null}

        {canEdit ? (
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => onEdit?.(session)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-accent/40 hover:text-accent"
              disabled={isBusy}
            >
              <PencilSquareIcon className="h-5 w-5" />
              <span>Edit</span>
            </button>
            {session.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => onComplete?.(session)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
                disabled={isBusy}
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>Done</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onReview?.(session)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-4 py-2 text-amber-600 transition hover:border-amber-300 hover:bg-amber-50"
                disabled={isBusy}
              >
                <StarIcon className="h-5 w-5" />
                <span>Review</span>
              </button>
            )}
            {session.status !== 'cancelled' ? (
              <button
                type="button"
                onClick={() => onCancel?.(session)}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                disabled={isBusy}
              >
                <XCircleIcon className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

MentoringSessionDrawer.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    topic: PropTypes.string,
    status: PropTypes.string,
    scheduledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    durationMinutes: PropTypes.number,
    meetingType: PropTypes.string,
    meetingLocation: PropTypes.string,
    meetingUrl: PropTypes.string,
    pricePaid: PropTypes.number,
    currency: PropTypes.string,
    agenda: PropTypes.string,
    notes: PropTypes.string,
    mentorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mentor: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
    order: PropTypes.shape({
      packageName: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  onReview: PropTypes.func,
  canEdit: PropTypes.bool,
  isBusy: PropTypes.bool,
  dateFormatter: PropTypes.func,
  currencyFormatter: PropTypes.func,
};

