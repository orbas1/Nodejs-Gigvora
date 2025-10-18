import PropTypes from 'prop-types';
import { CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { STATUS_TONES } from './constants.js';
import { titleCaseStatus } from './utils.js';

export default function StatusBadge({ status }) {
  const key = (status ?? 'pending').toLowerCase();
  const tone = STATUS_TONES[key] ?? STATUS_TONES.pending;
  const Icon = key === 'verified' ? ShieldCheckIcon : CheckCircleIcon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {titleCaseStatus(key)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: 'pending',
};
