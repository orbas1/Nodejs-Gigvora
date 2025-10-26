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

function GuaranteeBadge({ guarantee }) {
  if (!guarantee) return null;

  if (typeof guarantee === 'string') {
    const trimmed = guarantee.trim();
    if (!trimmed) return null;
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
        <span>{trimmed}</span>
      </span>
    );
  }

  const label = typeof guarantee.label === 'string' ? guarantee.label.trim() : guarantee.title?.trim();
  if (!label) return null;

  const Icon = guarantee.icon;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      <span>{label}</span>
    </span>
  );
}

GuaranteeBadge.propTypes = {
  guarantee: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      label: PropTypes.string,
      title: PropTypes.string,
      icon: PropTypes.elementType,
    }),
  ]),
};

GuaranteeBadge.defaultProps = {
  guarantee: undefined,
};

function normaliseTestimonial(testimonial) {
  if (!testimonial || typeof testimonial !== 'object') return null;

  const quote = typeof testimonial.quote === 'string' ? testimonial.quote.trim() : '';
  if (!quote) return null;

  const nameCandidate =
    typeof testimonial.name === 'string'
      ? testimonial.name
      : typeof testimonial.author === 'string'
      ? testimonial.author
      : '';
  const name = nameCandidate.trim() || 'Gigvora member';

  const roleParts = [];
  if (typeof testimonial.role === 'string' && testimonial.role.trim()) {
    roleParts.push(testimonial.role.trim());
  }
  if (typeof testimonial.company === 'string' && testimonial.company.trim()) {
    roleParts.push(testimonial.company.trim());
  }

  const avatarSource =
    (typeof testimonial.avatar === 'string' && testimonial.avatar.trim()) ||
    (testimonial.avatar && typeof testimonial.avatar === 'object' && typeof testimonial.avatar.src === 'string'
      ? testimonial.avatar.src.trim()
      : '') ||
    (typeof testimonial.avatarUrl === 'string' ? testimonial.avatarUrl.trim() : '');

  const avatarAltCandidate =
    (testimonial.avatar && typeof testimonial.avatar === 'object' && typeof testimonial.avatar.alt === 'string'
      ? testimonial.avatar.alt.trim()
      : '') ||
    (typeof testimonial.avatarAlt === 'string' ? testimonial.avatarAlt.trim() : '') ||
    `${name} portrait`;

  const avatar = avatarSource
    ? {
        src: avatarSource,
        alt: avatarAltCandidate,
      }
    : null;

  return {
    quote,
    name,
    roleLine: roleParts.join(' · '),
    avatar,
  };
}

function TestimonialSpotlight({ testimonial }) {
  if (!testimonial) return null;

  return (
    <figure className="rounded-3xl border border-white/20 bg-white/10 p-6 text-left text-white shadow-[0_24px_60px_rgba(15,23,42,0.45)]">
      <blockquote className="text-sm text-white/80 sm:text-base">“{testimonial.quote}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 text-sm text-white/70">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar.src}
            alt={testimonial.avatar.alt}
            className="h-10 w-10 rounded-full border border-white/30 object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{testimonial.name}</p>
          {testimonial.roleLine ? <p>{testimonial.roleLine}</p> : null}
        </div>
      </figcaption>
    </figure>
  );
}

TestimonialSpotlight.propTypes = {
  testimonial: PropTypes.shape({
    quote: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    roleLine: PropTypes.string,
    avatar: PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
    }),
  }),
};

TestimonialSpotlight.defaultProps = {
  testimonial: undefined,
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
  guarantees,
  testimonial,
  footnote,
  className,
}) {
  const hasStats = Array.isArray(stats) && stats.length > 0;
  const hasLogos = Array.isArray(logos) && logos.length > 0;
  const hasSupportingPoints = Array.isArray(supportingPoints) && supportingPoints.length > 0;
  const hasGuarantees = Array.isArray(guarantees) && guarantees.length > 0;
  const testimonialSpotlight = normaliseTestimonial(testimonial);
  const hasSupplementaryContent = hasStats || hasLogos || Boolean(testimonialSpotlight);

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

          {hasGuarantees ? (
            <div className="flex flex-wrap items-center gap-2">
              {guarantees.map((guarantee, index) => (
                <GuaranteeBadge
                  key={
                    typeof guarantee === 'string'
                      ? guarantee
                      : guarantee?.label ?? guarantee?.title ?? index
                  }
                  guarantee={guarantee}
                />
              ))}
            </div>
          ) : null}

          {footnote ? <p className="text-xs text-white/60">{footnote}</p> : null}
        </div>

        {hasSupplementaryContent ? (
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

            {testimonialSpotlight ? <TestimonialSpotlight testimonial={testimonialSpotlight} /> : null}
          </div>
        ) : null}
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
  guarantees: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string,
        title: PropTypes.string,
        icon: PropTypes.elementType,
      }),
    ]),
  ),
  testimonial: PropTypes.shape({
    quote: PropTypes.string.isRequired,
    name: PropTypes.string,
    author: PropTypes.string,
    role: PropTypes.string,
    company: PropTypes.string,
    avatar: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
      }),
    ]),
    avatarUrl: PropTypes.string,
    avatarAlt: PropTypes.string,
  }),
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
  guarantees: undefined,
  testimonial: undefined,
  footnote: undefined,
  className: undefined,
};

export default CallToActionBand;
