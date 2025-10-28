import PropTypes from 'prop-types';

export default function PublicHero({
  id,
  eyebrow,
  headline,
  subheading,
  primaryAction,
  secondaryAction,
  media,
}) {
  const heroId = id ?? 'public-hero';

  const renderAction = (action, variant) => {
    if (!action?.label) {
      return null;
    }

    const baseClassName =
      'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
    const className =
      variant === 'primary'
        ? `${baseClassName} bg-slate-900 text-white shadow-sm hover:bg-slate-700 focus-visible:ring-slate-900`
        : `${baseClassName} border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 focus-visible:ring-slate-300`;

    if (action.href || action.to) {
      return (
        <a
          key={variant}
          href={action.href ?? action.to}
          onClick={action.onClick}
          className={className}
        >
          {action.label}
        </a>
      );
    }

    return (
      <button key={variant} type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    );
  };

  return (
    <section aria-labelledby={`${heroId}-headline`} className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-8 sm:py-28">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr),minmax(0,20rem)] lg:items-center">
          <div className="space-y-8">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{eyebrow}</p>
            ) : null}
            {headline ? (
              <h1
                id={`${heroId}-headline`}
                className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl"
              >
                {headline}
              </h1>
            ) : null}
            {subheading ? (
              <p className="text-lg leading-8 text-slate-600 sm:text-xl">
                {subheading}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              {renderAction(primaryAction, 'primary')}
              {renderAction(secondaryAction, 'secondary')}
            </div>
          </div>

          {media?.imageUrl ? (
            <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl sm:max-w-md lg:mx-0 lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50" aria-hidden="true" />
              <img
                src={media.imageUrl}
                alt={media.alt ?? ''}
                className="relative z-[1] h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

PublicHero.propTypes = {
  id: PropTypes.string,
  eyebrow: PropTypes.string,
  headline: PropTypes.string,
  subheading: PropTypes.string,
  primaryAction: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }),
  media: PropTypes.shape({
    imageUrl: PropTypes.string,
    alt: PropTypes.string,
  }),
};

PublicHero.defaultProps = {
  id: 'public-hero',
  eyebrow: null,
  headline: null,
  subheading: null,
  primaryAction: null,
  secondaryAction: null,
  media: null,
};
