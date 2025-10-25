import PropTypes from 'prop-types';
import clsx from 'clsx';

const toneVariants = {
  default: 'bg-white',
  muted: 'bg-slate-50',
  accent: 'bg-accent/10',
};

export default function LaunchpadSummaryCard({ label, value, helper, tone, className }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md',
        toneVariants[tone] ?? toneVariants.default,
        className,
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-2 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}

LaunchpadSummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  tone: PropTypes.oneOf(Object.keys(toneVariants)),
  className: PropTypes.string,
};

LaunchpadSummaryCard.defaultProps = {
  helper: undefined,
  tone: 'default',
  className: undefined,
};
