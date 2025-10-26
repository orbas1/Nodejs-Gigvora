import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';
import { DEFAULT_COMPONENT_TOKENS } from '@shared-contracts/domain/platform/component-tokens.js';

const BUTTON_VARIANTS = Object.keys(DEFAULT_COMPONENT_TOKENS.buttonSuite.variants);
const BUTTON_SIZES = Object.keys(DEFAULT_COMPONENT_TOKENS.buttonSuite.sizes);

function renderVisual(visual, sizeClass) {
  if (!visual) {
    return null;
  }

  return (
    <span className={classNames('flex items-center justify-center', sizeClass)} aria-hidden>
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
  const { tokens: buttonTokens } = useComponentTokens('buttonSuite');
  const variantStyles = buttonTokens?.variants ?? {};
  const sizeStyles = buttonTokens?.sizes ?? {};
  const iconOnlyStyles = buttonTokens?.iconOnlyPadding ?? {};
  const iconSizes = buttonTokens?.iconSizes ?? {};
  const spinnerSizes = buttonTokens?.spinnerSizes ?? {};
  const baseStyles = buttonTokens?.base ?? '';
  const states = buttonTokens?.states ?? {};
  const analytics = buttonTokens?.analytics ?? {};

  const resolvedVariant = useMemo(() => {
    if (variantStyles[variant]) {
      return variant;
    }
    return 'primary';
  }, [variant, variantStyles]);

  const sizeToken = sizeStyles[size] ?? {};
  const componentClassName = classNames(
    baseStyles,
    variantStyles[resolvedVariant]?.class ?? variantStyles[resolvedVariant],
    iconOnly ? iconOnlyStyles[size] : sizeToken?.padding,
    sizeToken?.text,
    sizeToken?.gap,
    fullWidth ? states.fullWidth : '',
    subtle ? states.subtle : '',
    pressed ? states.pressed : '',
    className,
  );

  const isDisabled = rest.disabled || loading;
  const ariaLabel = rest['aria-label'];

  if (iconOnly && !children && !ariaLabel) {
    // eslint-disable-next-line no-console
    console.warn('ButtonSuite iconOnly buttons should include an aria-label for accessibility.');
  }

  const dataAttributes = { 'data-size': size };
  if (analytics?.datasetKey) {
    dataAttributes[analytics.datasetKey] = resolvedVariant;
  } else {
    dataAttributes['data-variant'] = resolvedVariant;
  }
  if (analytics?.pressedKey) {
    dataAttributes[analytics.pressedKey] = pressed || undefined;
  } else {
    dataAttributes['data-pressed'] = pressed || undefined;
  }

  return (
    <Component
      ref={ref}
      className={componentClassName}
      aria-pressed={Component === 'button' && typeof pressed === 'boolean' ? pressed : undefined}
      aria-busy={loading || undefined}
      disabled={Component === 'button' ? isDisabled : undefined}
      {...dataAttributes}
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
        {renderVisual(leadingIcon, iconSizes[size])}
        {children ? <span>{children}</span> : null}
        {renderVisual(trailingIcon, iconSizes[size])}
      </span>
    </Component>
  );
});

ButtonSuite.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
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

function ButtonSuiteGroup({
  children = null,
  orientation = 'horizontal',
  align = 'start',
  wrap = true,
  className = '',
}) {
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

ButtonSuite.Group = ButtonSuiteGroup;

export default ButtonSuite;
