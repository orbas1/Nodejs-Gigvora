import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import analytics from '../../services/analytics.js';
import { classNames } from '../../utils/classNames.js';

function handleNavigation(event, item, onNavigate) {
  if (item?.disabled) {
    event.preventDefault();
    return;
  }

  if (event.defaultPrevented) {
    return;
  }

  const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  analytics.track('web_navigation_primary_link_clicked', {
    id: item.id,
    label: item.label,
    destination: item.to,
    context: item.context || 'primary-nav',
    interaction: isModifiedClick ? 'modified' : 'direct',
  });

  if (!isModifiedClick) {
    onNavigate?.(item);
  }
}

export default function PrimaryNavItem({ item, variant = 'desktop', onNavigate }) {
  if (!item) {
    return null;
  }

  const Icon = item.icon;
  const ariaLabel = item.ariaLabel || item.label;
  const badge = item.badge;

  const desktopClasses = ({ isActive }) =>
    classNames(
      'group flex h-[4.75rem] w-20 flex-col items-center justify-center gap-1 rounded-none border-b-2 px-2 text-xs font-semibold uppercase tracking-wide transition',
      isActive
        ? 'border-slate-900 text-slate-900'
        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900',
      item.disabled ? 'pointer-events-none opacity-40' : null,
    );

  const mobileClasses = ({ isActive }) =>
    classNames(
      'group flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
      item.disabled ? 'pointer-events-none opacity-40' : null,
    );

  const resolvedClasses = variant === 'mobile' ? mobileClasses : desktopClasses;

  return (
    <NavLink
      to={item.to}
      aria-label={ariaLabel}
      onClick={(event) => handleNavigation(event, item, onNavigate)}
      className={resolvedClasses}
    >
      <span
        className={classNames(
          'flex items-center',
          variant === 'desktop' ? 'h-full w-full flex-col justify-center gap-1 text-center' : 'w-full justify-between gap-2',
        )}
      >
        <span
          className={classNames(
            'inline-flex items-center',
            variant === 'desktop' ? 'flex-col gap-1 text-xs font-semibold' : 'gap-2 text-sm font-medium',
          )}
        >
          {Icon ? (
            <Icon
              className={classNames(
                'h-5 w-5',
                variant === 'desktop'
                  ? 'text-slate-600 group-hover:text-slate-900'
                  : 'text-slate-500 group-hover:text-slate-900',
              )}
              aria-hidden="true"
            />
          ) : null}
          <span className={variant === 'desktop' ? 'leading-none' : 'leading-tight'}>{item.label}</span>
        </span>
        {badge ? (
          <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white">
            {badge}
          </span>
        ) : null}
      </span>
    </NavLink>
  );
}

PrimaryNavItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    ariaLabel: PropTypes.string,
    badge: PropTypes.string,
    icon: PropTypes.elementType,
    disabled: PropTypes.bool,
    context: PropTypes.string,
  }).isRequired,
  variant: PropTypes.oneOf(['desktop', 'mobile']),
  onNavigate: PropTypes.func,
};

PrimaryNavItem.defaultProps = {
  variant: 'desktop',
  onNavigate: undefined,
};
