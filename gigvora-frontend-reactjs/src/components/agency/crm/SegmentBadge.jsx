import PropTypes from 'prop-types';

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
};

export default function SegmentBadge({ tone, children }) {
  const resolvedTone = TONES[tone] ?? TONES.slate;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${resolvedTone}`}>
      {children}
    </span>
  );
}

SegmentBadge.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)),
  children: PropTypes.node.isRequired,
};

SegmentBadge.defaultProps = {
  tone: 'slate',
};
