import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';

const variantStyles = {
  default:
    'border border-slate-200/70 bg-white/90 text-slate-900 shadow-subtle backdrop-blur-lg hover:shadow-soft',
  minimal: 'border border-slate-200/40 bg-white/60 text-slate-900 shadow-none hover:shadow-subtle',
  elevated:
    'border border-transparent bg-gradient-to-br from-white/95 via-blue-50/70 to-sky-100/60 text-slate-900 shadow-soft hover:-translate-y-[2px] hover:shadow-[0_32px_75px_-42px_rgba(15,23,42,0.55)]',
  dark:
    'border border-slate-800/70 bg-slate-950/80 text-slate-100 shadow-[0_32px_60px_-35px_rgba(15,23,42,0.8)] hover:shadow-[0_40px_80px_-45px_rgba(15,23,42,0.9)]',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const orientationStyles = {
  vertical: 'flex-col',
  horizontal: 'flex-col gap-6 md:flex-row md:items-stretch',
};

const highlightStyles = {
  primary: 'from-blue-500 via-indigo-500 to-sky-400',
  success: 'from-emerald-400 via-teal-400 to-cyan-400',
  warning: 'from-amber-400 via-orange-400 to-yellow-300',
  danger: 'from-rose-500 via-fuchsia-500 to-pink-400',
};

const metaTone = {
  default: 'text-slate-500',
  dark: 'text-slate-300',
};

const CardScaffold = forwardRef(function CardScaffold(
  {
    as: Component = 'section',
    variant = 'default',
    orientation = 'vertical',
    padding = 'md',
    highlight,
    eyebrow,
    title,
    subtitle,
    description,
    meta,
    actions,
    media,
    footer,
    children,
    className,
    interactive = false,
    fullHeight = false,
    ...rest
  },
  ref,
) {
  const resolvedVariant = variantStyles[variant] ? variant : 'default';
  const resolvedPadding = paddingStyles[padding] ? padding : 'md';
  const resolvedOrientation = orientationStyles[orientation] ? orientation : 'vertical';
  const resolvedHighlight = highlightStyles[highlight] ? highlight : undefined;

  const isLinkLike = Component === 'a' || Component === 'button';
  const interactiveStyles = interactive
    ? 'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300 hover:-translate-y-[2px]'
    : '';

  const mediaWrapperClass = orientation === 'horizontal' ? 'md:w-56' : 'w-full';
  const currentMetaTone = resolvedVariant === 'dark' ? metaTone.dark : metaTone.default;

  return (
    <Component
      ref={ref}
      className={classNames(
        'group relative flex overflow-hidden rounded-[2.75rem] backdrop-blur transition-transform duration-200',
        variantStyles[resolvedVariant],
        paddingStyles[resolvedPadding],
        orientationStyles[resolvedOrientation],
        interactiveStyles,
        fullHeight ? 'h-full' : 'h-auto',
        className,
      )}
      data-variant={resolvedVariant}
      data-orientation={resolvedOrientation}
      data-interactive={interactive || undefined}
      tabIndex={!isLinkLike && interactive ? 0 : undefined}
      {...rest}
    >
      {resolvedHighlight ? (
        <span
          aria-hidden
          className={classNames(
            'pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r',
            highlightStyles[resolvedHighlight],
          )}
        />
      ) : null}
      {media ? (
        <div className={classNames('overflow-hidden rounded-3xl border border-slate-200/40 bg-slate-50', mediaWrapperClass)}>
          {media}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          ) : null}
          {(title || subtitle || meta) ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                {title ? <h3 className="text-xl font-semibold tracking-tight">{title}</h3> : null}
                {subtitle ? <p className="text-sm font-medium text-slate-500">{subtitle}</p> : null}
                {description ? <p className="text-sm text-slate-600">{description}</p> : null}
              </div>
              {meta ? <div className={classNames('text-sm text-right', currentMetaTone)}>{meta}</div> : null}
            </div>
          ) : null}
        </header>
        {children ? <div className="space-y-3 text-sm text-slate-600">{children}</div> : null}
        {(footer || actions) ? (
          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            {footer}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </footer>
        ) : null}
      </div>
    </Component>
  );
});

CardScaffold.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(Object.keys(variantStyles)),
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  padding: PropTypes.oneOf(Object.keys(paddingStyles)),
  highlight: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  eyebrow: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  description: PropTypes.node,
  meta: PropTypes.node,
  actions: PropTypes.node,
  media: PropTypes.node,
  footer: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  interactive: PropTypes.bool,
  fullHeight: PropTypes.bool,
};

CardScaffold.defaultProps = {
  as: 'section',
  variant: 'default',
  orientation: 'vertical',
  padding: 'md',
  highlight: undefined,
  eyebrow: null,
  title: null,
  subtitle: null,
  description: null,
  meta: null,
  actions: null,
  media: null,
  footer: null,
  children: null,
  className: '',
  interactive: false,
  fullHeight: false,
};

export default CardScaffold;
