import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';

const toneStyles = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-slate-200 bg-slate-50 text-slate-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function FormStatusMessage({ type = 'info', message, children, ...props }) {
  if (!message && !children) {
    return null;
  }

  const content = message ?? children;
  const tone = toneStyles[type] ?? toneStyles.info;

  return (
    <div
      className={classNames(
        'rounded-2xl border px-4 py-3 text-sm shadow-soft transition',
        tone,
      )}
      {...props}
    >
      {content}
    </div>
  );
}

FormStatusMessage.propTypes = {
  type: PropTypes.oneOf(['error', 'info', 'success']),
  message: PropTypes.node,
  children: PropTypes.node,
};

FormStatusMessage.defaultProps = {
  type: 'info',
  message: null,
  children: null,
};
