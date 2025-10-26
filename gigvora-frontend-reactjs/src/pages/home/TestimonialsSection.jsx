import PropTypes from 'prop-types';
import { testimonials as defaultTestimonials } from '../../content/home/testimonials.js';
import { TestimonialsCarousel } from '../../components/marketing/TestimonialsCarousel.jsx';

function normalizeTestimonials(section) {
  const baseHero = defaultTestimonials.hero;
  const baseItems = defaultTestimonials.items;

  if (!section || typeof section !== 'object') {
    return { hero: baseHero, items: baseItems };
  }

  const rawItems = Array.isArray(section.items)
    ? section.items
    : Array.isArray(section.testimonials)
    ? section.testimonials
    : Array.isArray(section.quotes)
    ? section.quotes
    : [];

  const heroSource = section.hero && typeof section.hero === 'object' ? section.hero : section;

  const hero = {
    eyebrow: heroSource.eyebrow ?? heroSource.label ?? baseHero.eyebrow,
    heading: heroSource.heading ?? heroSource.title ?? baseHero.heading,
    description: heroSource.description ?? heroSource.summary ?? baseHero.description,
    stats: Array.isArray(heroSource.stats) && heroSource.stats.length ? heroSource.stats : baseHero.stats,
    logos: Array.isArray(heroSource.logos) && heroSource.logos.length ? heroSource.logos : baseHero.logos ?? [],
  };

  const items = rawItems.length ? rawItems : baseItems;

  const normalizedItems = items.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const name = item.authorName ?? item.name ?? '';
    const avatarCandidate =
      typeof item.avatar === 'string'
        ? { src: item.avatar }
        : item.avatar && typeof item.avatar === 'object'
        ? { ...item.avatar }
        : typeof item.avatarUrl === 'string'
        ? { src: item.avatarUrl }
        : null;

    if (avatarCandidate) {
      avatarCandidate.alt = avatarCandidate.alt ?? item.avatarAlt ?? item.avatarAltText ?? (name ? `${name} portrait` : 'Member portrait');
    }

    return {
      ...item,
      ...(avatarCandidate ? { avatar: avatarCandidate } : {}),
    };
  });

  return { hero, items: normalizedItems };
}

export function TestimonialsSection({ loading, error, testimonials }) {
  const normalized = normalizeTestimonials(!loading && !error ? testimonials : null);
  const hero = normalized.hero;
  const items = normalized.items;

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-28">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-purple-500/20 blur-[140px]" aria-hidden="true" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 text-white sm:px-10">
        <TestimonialsCarousel
          testimonials={items}
          loading={loading}
          error={error}
          heroEyebrow={hero.eyebrow}
          heroHeading={hero.heading}
          heroDescription={hero.description}
          heroStats={hero.stats}
        />

        {hero.logos && hero.logos.length ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60 sm:justify-start">
            {hero.logos.map((logo) => (
              <span
                key={logo}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-1"
              >
                {logo}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

TestimonialsSection.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  testimonials: PropTypes.shape({
    hero: PropTypes.shape({
      eyebrow: PropTypes.string,
      heading: PropTypes.string,
      description: PropTypes.string,
      stats: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string,
          helper: PropTypes.string,
        }),
      ),
      logos: PropTypes.arrayOf(PropTypes.string),
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        quote: PropTypes.string,
        name: PropTypes.string,
        authorName: PropTypes.string,
        role: PropTypes.string,
        authorRole: PropTypes.string,
        company: PropTypes.string,
        authorCompany: PropTypes.string,
        highlight: PropTypes.string,
        avatar: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        avatarUrl: PropTypes.string,
        avatarAlt: PropTypes.string,
        badge: PropTypes.string,
      }),
    ),
  }),
};

TestimonialsSection.defaultProps = {
  loading: false,
  error: null,
  testimonials: undefined,
};
