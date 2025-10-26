import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

function ActionElement({ action, variant }) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const { label, href, to, onClick, icon: Icon = ArrowRightIcon, target, rel } = action;

  if (!label) {
    return null;
  }

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  const variantClasses =
    variant === 'primary'
      ? 'bg-white text-accent shadow-[0_18px_45px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 hover:bg-white/90'
      : 'border border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10';

  const content = (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span>{label}</span>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target ?? '_self'}
        rel={target === '_blank' ? rel ?? 'noreferrer noopener' : rel}
        onClick={onClick}
        className={classNames(baseClasses, variantClasses)}
      >
        {content}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classNames(baseClasses, variantClasses)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classNames(baseClasses, variantClasses)}>
      {content}
    </button>
  );
}

ActionElement.propTypes = {
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
  }),
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

ActionElement.defaultProps = {
  action: undefined,
  variant: 'primary',
};

function SupportingPoint({ point }) {
  if (!point) return null;

  if (typeof point === 'string') {
    return (
      <li className="flex items-start gap-3 text-left text-sm text-white/80">
        <CheckIcon className="mt-1 h-4 w-4 text-emerald-300" aria-hidden="true" />
        <span>{point}</span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 text-left text-sm text-white/80">
      <CheckIcon className="mt-1 h-4 w-4 text-emerald-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold text-white">{point.title}</p>
        {point.description ? <p className="text-white/70">{point.description}</p> : null}
      </div>
    </li>
  );
}

SupportingPoint.propTypes = {
  point: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  ]),
};

SupportingPoint.defaultProps = {
  point: undefined,
};

export function CallToActionBand({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  supportingPoints,
  stats,
  logos,
  footnote,
  className,
}) {
  const hasStats = Array.isArray(stats) && stats.length > 0;
  const hasLogos = Array.isArray(logos) && logos.length > 0;
  const hasSupportingPoints = Array.isArray(supportingPoints) && supportingPoints.length > 0;

  return (
    <section
      className={classNames(
        'relative overflow-hidden rounded-[48px] border border-white/15 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_60px_160px_-70px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:p-14',
        'before:pointer-events-none before:absolute before:-left-24 before:top-12 before:h-64 before:w-64 before:rounded-full before:bg-accent/25 before:blur-[120px]',
        'after:pointer-events-none after:absolute after:-bottom-28 after:-right-32 after:h-72 after:w-72 after:rounded-full after:bg-indigo-500/30 after:blur-[140px]',
        className,
      )}
    >
      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-8">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-accent/90">{eyebrow}</p>
          ) : null}
          <div className="space-y-4">
            <h2 className="text-pretty text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
            {description ? <p className="max-w-2xl text-sm text-white/75 sm:text-base">{description}</p> : null}
          </div>

          {hasSupportingPoints ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {supportingPoints.map((point, index) => (
                <SupportingPoint key={typeof point === 'string' ? point : point?.title ?? index} point={point} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ActionElement action={primaryAction} variant="primary" />
            <ActionElement action={secondaryAction} variant="secondary" />
          </div>

          {footnote ? <p className="text-xs text-white/60">{footnote}</p> : null}
        </div>

        {(hasStats || hasLogos) && (
          <div className="space-y-6 rounded-4xl border border-white/15 bg-white/5 p-8 backdrop-blur-lg">
            {hasStats ? (
              <dl className="grid gap-5">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">{stat.label}</dt>
                    <dd className="text-2xl font-semibold text-white sm:text-3xl">{stat.value}</dd>
                    {stat.helper ? <p className="text-xs text-white/60">{stat.helper}</p> : null}
                  </div>
                ))}
              </dl>
            ) : null}

            {hasLogos ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Featured teams</p>
                <div className="flex flex-wrap gap-2 text-sm text-white/70">
                  {logos.map((logo) => {
                    if (!logo) return null;
                    const key = typeof logo === 'string' ? logo : logo?.name ?? logo?.label;
                    const label = typeof logo === 'string' ? logo : logo?.label ?? logo?.name;
                    if (!key || !label) return null;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

CallToActionBand.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
  }).isRequired,
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.elementType,
    target: PropTypes.string,
    rel: PropTypes.string,
  }),
  supportingPoints: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
      }),
    ]),
  ),
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      helper: PropTypes.string,
    }),
  ),
  logos: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string,
        label: PropTypes.string,
      }),
    ]),
  ),
  footnote: PropTypes.string,
  className: PropTypes.string,
};

CallToActionBand.defaultProps = {
  eyebrow: undefined,
  description: undefined,
  secondaryAction: undefined,
  supportingPoints: undefined,
  stats: undefined,
  logos: undefined,
  footnote: undefined,
  className: undefined,
};

export default CallToActionBand;
