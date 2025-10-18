import PropTypes from 'prop-types';

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
};

export default function StatusPill({ tone, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONES[tone] ?? TONES.slate}`}>
      {children}
    </span>
  );
}

StatusPill.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)),
  children: PropTypes.node,
};

StatusPill.defaultProps = {
  tone: 'slate',
  children: null,
};
