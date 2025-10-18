import PropTypes from 'prop-types';
import { statusTone, formatStatus } from './walletFormatting.js';

const toneClasses = {
  positive: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  info: 'bg-sky-50 text-sky-600 border-sky-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  negative: 'bg-rose-50 text-rose-600 border-rose-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

function WalletStatusPill({ value }) {
  const tone = toneClasses[statusTone(value)] ?? toneClasses.neutral;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      <span className="truncate">{formatStatus(value)}</span>
    </span>
  );
}

WalletStatusPill.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

WalletStatusPill.defaultProps = {
  value: null,
};

export default WalletStatusPill;
