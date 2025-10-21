import PropTypes from 'prop-types';

const STATUS_LABELS = {
  available: { label: 'Open', tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  limited: { label: 'Limited', tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  unavailable: { label: 'Away', tone: 'text-slate-600 bg-slate-50 border-slate-100' },
  on_leave: { label: 'Leave', tone: 'text-sky-600 bg-sky-50 border-sky-100' },
};

export default function AvailabilityCard({ availability, hourlyRate, onManage }) {
  const status = STATUS_LABELS[availability?.status] ?? STATUS_LABELS.limited;
  const formattedRate =
    hourlyRate == null
      ? null
      : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
          Number(hourlyRate),
        );
  const hoursPerWeek = availability?.hoursPerWeek;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}
          >
            {status.label}
          </span>
          <div className="text-sm text-slate-600">
            {hoursPerWeek ? <p>{hoursPerWeek} hrs/week</p> : <p>Hours not set</p>}
            <p>{availability?.openToRemote ? 'Remote friendly' : 'On-site only'}</p>
            {formattedRate ? <p>{formattedRate} / hr</p> : <p>Rate hidden</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Availability
        </button>
      </div>
    </div>
  );
}

AvailabilityCard.propTypes = {
  availability: PropTypes.shape({
    status: PropTypes.string,
    hoursPerWeek: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openToRemote: PropTypes.bool,
  }),
  hourlyRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onManage: PropTypes.func,
};

AvailabilityCard.defaultProps = {
  availability: {},
  hourlyRate: null,
  onManage: () => {},
};
