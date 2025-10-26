import PropTypes from 'prop-types';
import { testimonials as defaultTestimonials } from '../../content/home/testimonials.js';
import { TestimonialsCarousel } from '../../components/marketing/TestimonialsCarousel.jsx';

const TRUSTED_LOGOS = [
  'Northwind Digital',
  'Forma Studio',
  'Atlas Labs',
  'Redbird Ventures',
  'Aurora Collective',
];

export function TestimonialsSection({ loading, error, testimonials }) {
  const resolvedTestimonials =
    !loading && !error && Array.isArray(testimonials) && testimonials.length > 0 ? testimonials : defaultTestimonials;

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
        <div className="space-y-6 text-center sm:space-y-7 sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-accent/90">Proof in production</p>
          <h2 className="text-pretty text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Operators across continents trust Gigvora crews to launch faster
          </h2>
          <p className="mx-auto max-w-3xl text-sm text-white/75 sm:mx-0 sm:text-base">
            From venture studios to public-sector programmes, founders, executives, and mentors rely on Gigvora’s orchestrated
            workflows to keep every contributor aligned. These voices come straight from shipped launches.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60 sm:justify-start">
            {TRUSTED_LOGOS.map((logo) => (
              <span
                key={logo}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-1"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>

        <TestimonialsCarousel testimonials={resolvedTestimonials} loading={loading} error={error} />
      </div>
    </section>
  );
}

TestimonialsSection.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  testimonials: PropTypes.arrayOf(
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
      avatar: PropTypes.string,
      avatarUrl: PropTypes.string,
      avatarAlt: PropTypes.string,
      badge: PropTypes.string,
    }),
  ),
};

TestimonialsSection.defaultProps = {
  loading: false,
  error: null,
  testimonials: undefined,
};
