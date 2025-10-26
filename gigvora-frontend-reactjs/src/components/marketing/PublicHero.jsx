import { isValidElement } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ArrowUpRightIcon, UsersIcon } from '@heroicons/react/24/outline';

const DEFAULT_SURFACE = {
  background:
    'relative isolate overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white',
  overlays: [
    'absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_65%)]',
    'absolute -left-32 top-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl',
    'absolute -right-32 top-16 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl',
  ],
  tickerFades: {
    start:
      'pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 via-slate-950/95 to-transparent',
    end:
      'pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 via-slate-950/95 to-transparent',
  },
};

function normaliseTickerItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      if (!item) return null;
      if (isValidElement(item)) {
        return { id: `ticker-node-${index}`, node: item };
      }
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: `ticker-${index}`, label: String(item) };
      }
      if (typeof item === 'object') {
        const label = item.label ?? item.title ?? item.copy ?? item.text ?? null;
        const icon = item.icon ?? null;
        if (!label && !item.node && !item.content) {
          return null;
        }
        return {
          id: item.id ?? item.key ?? `ticker-${index}`,
          label,
          icon,
          node: item.node ?? item.content ?? null,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function ActionButton({
  action = null,
  variant,
  defaultIcon: DefaultIcon = ArrowUpRightIcon,
}) {
  if (!action || !action.label) {
    return null;
  }

  const {
    label,
    onClick,
    href,
    icon: Icon,
    id,
    disabled = false,
    target,
    rel,
    className,
    ariaLabel,
  } = action;

  const isExternalLink = Boolean(href && /^https?:/i.test(href));
  const Element = href ? 'a' : 'button';
  const finalRel = href ? rel ?? (isExternalLink ? 'noreferrer noopener' : undefined) : undefined;
  const buttonClasses = clsx(
    'inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto',
    variant === 'primary'
      ? 'bg-accent text-white shadow-soft hover:-translate-y-0.5 hover:bg-accentDark disabled:translate-y-0 disabled:bg-accent/50 disabled:text-white/70'
      : 'border border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40',
    className,
  );

  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (typeof onClick === 'function') {
      onClick(event);
    }
  };

  const content = (
    <>
      <span>{label}</span>
      {action.icon === null ? null : (
        <span className="shrink-0">
          {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : DefaultIcon ? <DefaultIcon className="h-5 w-5" aria-hidden="true" /> : null}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Element
        id={id}
        href={href}
        target={target ?? (isExternalLink ? '_blank' : undefined)}
        rel={finalRel}
        onClick={handleClick}
        className={buttonClasses}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={ariaLabel}
      >
        {content}
      </Element>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      className={buttonClasses}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}

ActionButton.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    href: PropTypes.string,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
    className: PropTypes.string,
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
  }),
  variant: PropTypes.oneOf(['primary', 'secondary']).isRequired,
  defaultIcon: PropTypes.elementType,
};

export default function PublicHero({
  eyebrow = null,
  headline = null,
  subheading = null,
  surface = null,
  primaryAction = null,
  secondaryAction = null,
  ticker = null,
  rightColumn = null,
  bottomSlot = null,
  className,
}) {
  const {
    background,
    overlays,
    tickerFades,
  } = { ...DEFAULT_SURFACE, ...(surface ?? {}) };

  const tickerConfig = ticker ?? {};
  const {
    items = [],
    showSkeleton = false,
    skeletonCount = 4,
    icon: TickerIcon = UsersIcon,
    reduceMotion = false,
    loop = true,
    ariaLabel = 'Live community activity ticker',
  } = tickerConfig;

  const normalisedTickerItems = normaliseTickerItems(items);
  const marqueeItems = !reduceMotion && loop ? [...normalisedTickerItems, ...normalisedTickerItems] : normalisedTickerItems;
  const skeletonItems = Array.from({ length: skeletonCount > 0 ? skeletonCount : 4 });

  return (
    <section className={clsx(background, className)}>
      <div className="absolute inset-0" aria-hidden="true">
        {(overlays ?? []).map((overlayClass) => (
          <div key={overlayClass} className={overlayClass} />
        ))}
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:flex-row lg:items-center lg:gap-20">
        <div className="mx-auto w-full max-w-2xl space-y-10 text-center lg:mx-0 lg:text-left">
          {eyebrow ? (
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent lg:mx-0">
              {eyebrow}
            </p>
          ) : null}

          <div className="space-y-6">
            {headline ? (
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {headline}
              </h1>
            ) : null}
            {subheading ? (
              <p className="text-pretty text-base text-slate-200 sm:text-xl">{subheading}</p>
            ) : null}
          </div>

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <ActionButton action={primaryAction} variant="primary" />
              <ActionButton action={secondaryAction} variant="secondary" defaultIcon={ArrowUpRightIcon} />
            </div>
          )}

          {(normalisedTickerItems.length || showSkeleton) && (
            <div className="relative mt-8 h-auto min-h-[3.25rem] overflow-hidden rounded-full border border-white/10 bg-white/5 sm:mt-10 sm:h-14">
              {tickerFades?.start ? <div className={tickerFades.start} aria-hidden="true" /> : null}
              {tickerFades?.end ? <div className={tickerFades.end} aria-hidden="true" /> : null}

              <div
                className={
                  reduceMotion
                    ? 'flex h-full flex-wrap items-center justify-center gap-3 px-6 py-3'
                    : 'flex h-full min-w-max items-center gap-6 animate-marquee'
                }
                aria-label={ariaLabel}
              >
                {showSkeleton
                  ? skeletonItems.map((_, index) => (
                      <span
                        key={`ticker-skeleton-${index}`}
                        className="inline-flex min-w-[7rem] items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-1.5 text-sm text-white/80"
                      >
                        <span className="h-4 w-4 animate-pulse rounded-full bg-white/20" aria-hidden="true" />
                        <span className="h-3 w-24 animate-pulse rounded-full bg-white/20" aria-hidden="true" />
                      </span>
                    ))
                  : marqueeItems.map((item, index) => {
                      if (item.node) {
                        return (
                          <span
                            key={`${item.id ?? index}-node`}
                            className="inline-flex min-w-max items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-1.5 text-sm font-medium text-white/90"
                          >
                            {item.node}
                          </span>
                        );
                      }

                      const IconComponent = item.icon ?? TickerIcon;
                      return (
                        <span
                          key={`${item.id ?? index}-label`}
                          className="inline-flex min-w-max items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-1.5 text-sm font-medium text-white/90"
                        >
                          {IconComponent ? <IconComponent className="h-4 w-4" aria-hidden="true" /> : null}
                          <span>{item.label}</span>
                        </span>
                      );
                    })}
              </div>
            </div>
          )}
        </div>

        {rightColumn ? (
          <aside className="relative w-full max-w-xl px-2 sm:px-0 lg:max-w-none">{rightColumn}</aside>
        ) : null}
      </div>

      {bottomSlot ? (
        <div className="relative">{bottomSlot}</div>
      ) : null}
    </section>
  );
}

PublicHero.propTypes = {
  eyebrow: PropTypes.node,
  headline: PropTypes.node,
  subheading: PropTypes.node,
  surface: PropTypes.shape({
    background: PropTypes.string,
    overlays: PropTypes.arrayOf(PropTypes.string),
    tickerFades: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string,
    }),
  }),
  primaryAction: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    href: PropTypes.string,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
    className: PropTypes.string,
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
  }),
  secondaryAction: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    href: PropTypes.string,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
    className: PropTypes.string,
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
  }),
  ticker: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.number, PropTypes.object])),
    showSkeleton: PropTypes.bool,
    skeletonCount: PropTypes.number,
    icon: PropTypes.elementType,
    reduceMotion: PropTypes.bool,
    loop: PropTypes.bool,
    ariaLabel: PropTypes.string,
  }),
  rightColumn: PropTypes.node,
  bottomSlot: PropTypes.node,
  className: PropTypes.string,
};

