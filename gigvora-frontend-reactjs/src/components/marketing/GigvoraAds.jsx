import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

export function GigvoraAdBanner({ eyebrow, title, description, stats, cta, className }) {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-[42px] border border-slate-200/70 bg-gradient-to-br from-accent/95 via-accent to-accentDark p-8 text-white shadow-[0_45px_120px_-60px_rgba(37,99,235,0.65)]',
        'before:absolute before:-left-24 before:top-10 before:h-56 before:w-56 before:rounded-full before:bg-white/10 before:blur-3xl',
        'after:absolute after:-bottom-12 after:-right-20 after:h-72 after:w-72 after:rounded-full after:bg-emerald-400/20 after:blur-[120px]',
        'sm:p-10 lg:p-12',
        className,
      )}
    >
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)] lg:items-center">
        <div className="space-y-4">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">{eyebrow}</p>
          ) : null}
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="text-sm text-white/90 sm:text-base">{description}</p>
          {cta ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={cta.href}
                target={cta.target ?? '_self'}
                rel={cta.target === '_blank' ? 'noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <span>{cta.label}</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </a>
              {cta.secondaryLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/80">
                  {cta.secondaryLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {Array.isArray(stats) && stats.length > 0 ? (
          <div className="grid gap-3 rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:grid-cols-2">
            {stats.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                <p className="text-xl font-semibold text-white sm:text-2xl">{item.value}</p>
                {item.helper ? <p className="text-xs text-white/75">{item.helper}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

GigvoraAdBanner.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      helper: PropTypes.string,
    }),
  ),
  cta: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    target: PropTypes.string,
    secondaryLabel: PropTypes.string,
  }),
  className: PropTypes.string,
};

export function GigvoraAdGrid({ ads, className }) {
  if (!Array.isArray(ads) || ads.length === 0) {
    return null;
  }

  return (
    <div className={classNames('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {ads.map((ad) => (
        <article
          key={ad.id ?? ad.title}
          className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-accent/50"
        >
          <div className="absolute -right-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="relative space-y-3">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
              {ad.badge ?? 'Gigvora Ads'}
            </span>
            <h3 className="text-lg font-semibold text-slate-900">{ad.title}</h3>
            <p className="text-sm text-slate-600">{ad.description}</p>
            {Array.isArray(ad.metrics) && ad.metrics.length > 0 ? (
              <dl className="grid gap-3 rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 p-4 text-xs text-slate-500">
                {ad.metrics.map((metric) => (
                  <div key={`${ad.id ?? ad.title}-${metric.label}`} className="flex items-baseline justify-between gap-3">
                    <dt className="font-semibold uppercase tracking-wide">{metric.label}</dt>
                    <dd className="text-sm text-slate-800">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <a
              href={ad.href}
              target={ad.target ?? '_self'}
              rel={ad.target === '_blank' ? 'noreferrer' : undefined}
              className="relative inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <span>{ad.ctaLabel ?? 'Discover more'}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

GigvoraAdGrid.propTypes = {
  ads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      badge: PropTypes.string,
      href: PropTypes.string.isRequired,
      target: PropTypes.string,
      ctaLabel: PropTypes.string,
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ),
    }),
  ),
  className: PropTypes.string,
};

export default GigvoraAdGrid;
