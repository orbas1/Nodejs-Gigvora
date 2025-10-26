import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';
import { DEFAULT_COMPONENT_TOKENS } from '@shared-contracts/domain/platform/component-tokens.js';

const CARD_VARIANTS = Object.keys(DEFAULT_COMPONENT_TOKENS.cardScaffold.variants);
const CARD_PADDING = Object.keys(DEFAULT_COMPONENT_TOKENS.cardScaffold.padding);
const CARD_ORIENTATIONS = Object.keys(DEFAULT_COMPONENT_TOKENS.cardScaffold.orientation);
const CARD_HIGHLIGHTS = Object.keys(DEFAULT_COMPONENT_TOKENS.cardScaffold.highlight);

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
  const { tokens: cardTokens } = useComponentTokens('cardScaffold');
  const variantStyles = cardTokens?.variants ?? {};
  const paddingStyles = cardTokens?.padding ?? {};
  const orientationStyles = cardTokens?.orientation ?? {};
  const highlightStyles = cardTokens?.highlight ?? {};
  const metaTone = cardTokens?.metaTone ?? {};
  const baseClass = cardTokens?.base ?? '';
  const mediaTokens = cardTokens?.media ?? {};
  const headerTokens = cardTokens?.header ?? {};
  const bodyClass = cardTokens?.body ?? '';
  const footerClass = cardTokens?.footer ?? '';
  const interactiveClass = cardTokens?.interactive ?? '';
  const analytics = cardTokens?.analytics ?? {};

  const resolvedVariant = variantStyles[variant] ? variant : 'default';
  const resolvedPadding = paddingStyles[padding] ? padding : 'md';
  const resolvedOrientation = orientationStyles[orientation] ? orientation : 'vertical';
  const resolvedHighlight = highlightStyles[highlight] ? highlight : undefined;

  const isLinkLike = Component === 'a' || Component === 'button';
  const interactiveStyles = interactive ? interactiveClass : '';

  const mediaWrapperClass = classNames(
    mediaTokens.base,
    orientation === 'horizontal' ? mediaTokens.horizontal : mediaTokens.vertical,
  );
  const currentMetaTone = resolvedVariant === 'dark' ? metaTone.dark : metaTone.default;

  const componentClassName = classNames(
    baseClass,
    variantStyles[resolvedVariant],
    paddingStyles[resolvedPadding],
    orientationStyles[resolvedOrientation],
    interactiveStyles,
    fullHeight ? 'h-full' : 'h-auto',
    className,
  );

  const dataAttributes = {};
  if (analytics?.datasetVariant) {
    dataAttributes[analytics.datasetVariant] = resolvedVariant;
  } else {
    dataAttributes['data-variant'] = resolvedVariant;
  }
  if (analytics?.datasetOrientation) {
    dataAttributes[analytics.datasetOrientation] = resolvedOrientation;
  } else {
    dataAttributes['data-orientation'] = resolvedOrientation;
  }
  if (interactive) {
    const interactiveKey = analytics?.datasetInteractive ?? 'data-interactive';
    dataAttributes[interactiveKey] = 'true';
  }

  return (
    <Component
      ref={ref}
      className={componentClassName}
      tabIndex={!isLinkLike && interactive ? 0 : undefined}
      {...dataAttributes}
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
      {media ? <div className={mediaWrapperClass}>{media}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className={headerTokens.wrapper}>
          {eyebrow ? <p className={headerTokens.eyebrow}>{eyebrow}</p> : null}
          {(title || subtitle || meta) ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                {title ? <h3 className={headerTokens.title}>{title}</h3> : null}
                {subtitle ? <p className={headerTokens.subtitle}>{subtitle}</p> : null}
                {description ? <p className={headerTokens.description}>{description}</p> : null}
              </div>
              {meta ? <div className={classNames(headerTokens.meta, currentMetaTone)}>{meta}</div> : null}
            </div>
          ) : null}
        </header>
        {children ? <div className={bodyClass}>{children}</div> : null}
        {(footer || actions) ? (
          <footer className={footerClass}>
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
  variant: PropTypes.oneOf(CARD_VARIANTS),
  orientation: PropTypes.oneOf(CARD_ORIENTATIONS),
  padding: PropTypes.oneOf(CARD_PADDING),
  highlight: PropTypes.oneOf(CARD_HIGHLIGHTS),
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
