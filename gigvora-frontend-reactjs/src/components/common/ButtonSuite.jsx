import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const variantStyles = {
  primary:
    'bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-500 text-white shadow-soft hover:shadow-[0_28px_65px_-35px_rgba(37,99,235,0.7)] hover:brightness-[1.02]',
  secondary:
    'bg-white/95 text-slate-900 shadow-subtle border border-slate-200 hover:border-slate-300 hover:shadow-soft',
  outline:
    'bg-white/70 text-slate-900 border border-slate-300 hover:border-blue-300 hover:text-blue-700 hover:bg-white/90 shadow-subtle',
  ghost:
    'bg-transparent text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent',
  elevated:
    'bg-gradient-to-br from-white via-blue-50/80 to-blue-100/70 text-blue-900 shadow-soft hover:-translate-y-[1px] hover:shadow-[0_32px_70px_-40px_rgba(15,23,42,0.6)]',
  danger:
    'bg-gradient-to-tr from-rose-600 via-rose-500 to-fuchsia-500 text-white shadow-soft hover:shadow-[0_28px_65px_-35px_rgba(244,63,94,0.6)]',
};

const sizeStyles = {
  xs: 'text-xs px-3 py-1.5',
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
};

const iconOnlyStyles = {
  xs: 'p-1.5',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
};

const iconSizes = {
  xs: 'h-4 w-4',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const spinnerSizes = {
  xs: 'h-4 w-4',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5',
};

const baseStyles =
  'relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-70';

function renderVisual(visual, size) {
  if (!visual) {
    return null;
  }

  return (
    <span className={classNames('flex items-center justify-center', iconSizes[size])} aria-hidden>
      {visual}
    </span>
  );
}

const ButtonSuite = forwardRef(function ButtonSuite(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    loading = false,
    loadingLabel = 'Processing',
    children,
    className,
    iconOnly = false,
    pressed = false,
    subtle,
    ...rest
  },
  ref,
) {
  const resolvedVariant = useMemo(() => {
    if (variantStyles[variant]) {
      return variant;
    }
    return 'primary';
  }, [variant]);

  const componentClassName = classNames(
    baseStyles,
    variantStyles[resolvedVariant],
    iconOnly ? iconOnlyStyles[size] : sizeStyles[size],
    fullWidth ? 'w-full' : 'w-auto',
    subtle ? 'opacity-90 hover:opacity-100' : '',
    pressed ? 'ring-2 ring-offset-2 ring-blue-200' : '',
    className,
  );

  const isDisabled = rest.disabled || loading;
  const ariaLabel = rest['aria-label'];

  if (iconOnly && !children && !ariaLabel) {
    // eslint-disable-next-line no-console
    console.warn('ButtonSuite iconOnly buttons should include an aria-label for accessibility.');
  }

  return (
    <Component
      ref={ref}
      className={componentClassName}
      data-variant={resolvedVariant}
      data-size={size}
      data-pressed={pressed || undefined}
      aria-pressed={Component === 'button' && typeof pressed === 'boolean' ? pressed : undefined}
      aria-busy={loading || undefined}
      disabled={Component === 'button' ? isDisabled : undefined}
      {...rest}
    >
      {loading ? (
        <span
          role="status"
          className={classNames(
            'absolute inset-0 flex items-center justify-center text-current',
            iconOnly ? '' : 'px-3',
          )}
        >
          <ArrowPathIcon className={classNames('animate-spin drop-shadow-sm', spinnerSizes[size])} />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : null}
      <span className={classNames('flex items-center gap-2', loading ? 'opacity-0' : 'opacity-100')}>
        {renderVisual(leadingIcon, size)}
        {children ? <span>{children}</span> : null}
        {renderVisual(trailingIcon, size)}
      </span>
    </Component>
  );
});

ButtonSuite.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(Object.keys(variantStyles)),
  size: PropTypes.oneOf(Object.keys(sizeStyles)),
  fullWidth: PropTypes.bool,
  leadingIcon: PropTypes.node,
  trailingIcon: PropTypes.node,
  loading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  iconOnly: PropTypes.bool,
  pressed: PropTypes.bool,
  subtle: PropTypes.bool,
};

ButtonSuite.defaultProps = {
  as: 'button',
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  leadingIcon: null,
  trailingIcon: null,
  loading: false,
  loadingLabel: 'Processing',
  children: null,
  className: '',
  iconOnly: false,
  pressed: false,
  subtle: false,
};

function ButtonSuiteGroup({ children, orientation = 'horizontal', align = 'start', wrap = true, className }) {
  const layout = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const alignment =
    align === 'center' ? 'items-center' : align === 'end' ? 'items-end justify-end' : 'items-start';
  return (
    <div
      className={classNames(
        'flex gap-3',
        layout,
        alignment,
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className,
      )}
    >
      {children}
    </div>
  );
}

ButtonSuiteGroup.propTypes = {
  children: PropTypes.node,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  align: PropTypes.oneOf(['start', 'center', 'end']),
  wrap: PropTypes.bool,
  className: PropTypes.string,
};

ButtonSuiteGroup.defaultProps = {
  children: null,
  orientation: 'horizontal',
  align: 'start',
  wrap: true,
  className: '',
};

ButtonSuite.Group = ButtonSuiteGroup;

export default ButtonSuite;
