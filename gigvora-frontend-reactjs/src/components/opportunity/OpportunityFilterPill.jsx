import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';

export default function OpportunityFilterPill({
  label,
  active,
  onClick,
  badge,
  icon: Icon,
  tone,
  disabled,
}) {
  const activePalette = tone === 'accent'
    ? 'border-accent bg-accent text-white shadow-soft'
    : 'border-accent bg-accentSoft text-accent shadow-soft';
  const inactivePalette = tone === 'accent'
    ? 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
    : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        active ? activePalette : inactivePalette,
        disabled ? 'cursor-not-allowed opacity-60' : null,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      <span>{label}</span>
      {badge ? (
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-white/20 px-2 text-[10px] font-semibold uppercase tracking-wide">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

OpportunityFilterPill.propTypes = {
  label: PropTypes.node.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  badge: PropTypes.node,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(['muted', 'accent']),
  disabled: PropTypes.bool,
};

OpportunityFilterPill.defaultProps = {
  active: false,
  onClick: undefined,
  badge: null,
  icon: null,
  tone: 'muted',
  disabled: false,
};
