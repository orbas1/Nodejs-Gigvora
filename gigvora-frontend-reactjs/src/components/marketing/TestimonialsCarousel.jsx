import { useEffect, useMemo, useRef, useState, useId } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const AUTOPLAY_INTERVAL_MS = 9000;

const DEFAULT_HERO_STATS = [
  { value: '68', label: 'NPS', helper: 'Rolling 90-day sentiment' },
  { value: '4,200+', label: 'Crews', helper: 'Active programmes delivered' },
  { value: '92%', label: 'Renew', helper: 'Teams expanding scope after 60 days' },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      'Gigvora gave us a professional community that feels bespoke—every contributor arrived ready and our stakeholders finally have clarity.',
    name: 'Morgan Wells',
    authorName: 'Morgan Wells',
    role: 'VP People',
    authorRole: 'VP People',
    company: 'Northwind Digital',
    authorCompany: 'Northwind Digital',
    highlight: 'Scaled seven markets without adding ops headcount.',
    badge: 'Enterprise rollout',
    avatarUrl: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
    avatarAlt: 'Portrait of Morgan Wells smiling',
  },
  {
    quote:
      'We replaced scattered contractors with a dedicated Gigvora crew. Quality is exceptional and the admin load disappeared overnight.',
    name: 'Ivy Chen',
    authorName: 'Ivy Chen',
    role: 'Founder',
    authorRole: 'Founder',
    company: 'Forma Studio',
    authorCompany: 'Forma Studio',
    highlight: 'Closed enterprise deals with on-demand specialists.',
    badge: 'Venture studio',
    avatarUrl: 'https://cdn.gigvora.com/assets/avatars/ivy-chen.png',
    avatarAlt: 'Portrait of Ivy Chen wearing a blazer',
  },
];

function normaliseTestimonials(testimonials) {
  if (!Array.isArray(testimonials)) {
    return DEFAULT_TESTIMONIALS;
  }

  const cleaned = testimonials
    .map((item) => {
      if (!item) return null;

      const quote = typeof item.quote === 'string' ? item.quote.trim() : '';
      const nameCandidate =
        typeof item.name === 'string'
          ? item.name
          : typeof item.authorName === 'string'
          ? item.authorName
          : typeof item.attribution === 'string'
          ? item.attribution
          : '';
      const name = nameCandidate.trim();

      const roleParts = [];
      if (typeof item.role === 'string' && item.role.trim().length) {
        roleParts.push(item.role.trim());
      } else if (typeof item.authorRole === 'string' && item.authorRole.trim().length) {
        roleParts.push(item.authorRole.trim());
      }

      const companyCandidate =
        typeof item.company === 'string' && item.company.trim().length
          ? item.company.trim()
          : typeof item.authorCompany === 'string' && item.authorCompany.trim().length
          ? item.authorCompany.trim()
          : '';
      if (companyCandidate) {
        roleParts.push(companyCandidate);
      }
      const role = roleParts.join(' · ');

      const highlightCandidate =
        typeof item.highlight === 'string' && item.highlight.trim().length
          ? item.highlight.trim()
          : typeof item.highlightSummary === 'string' && item.highlightSummary.trim().length
          ? item.highlightSummary.trim()
          : typeof item.result === 'string' && item.result.trim().length
          ? item.result.trim()
          : '';

      const badgeCandidate =
        typeof item.badge === 'string' && item.badge.trim().length
          ? item.badge.trim()
          : typeof item.tag === 'string' && item.tag.trim().length
          ? item.tag.trim()
          : typeof item.segment === 'string' && item.segment.trim().length
          ? item.segment.trim()
          : '';

      let avatar = null;
      const avatarObject = item.avatar && typeof item.avatar === 'object' ? item.avatar : null;
      const avatarUrl =
        (typeof item.avatar === 'string' && item.avatar.trim().length && item.avatar.trim()) ||
        (typeof item.avatarUrl === 'string' && item.avatarUrl.trim().length && item.avatarUrl.trim()) ||
        (avatarObject && typeof avatarObject.src === 'string' && avatarObject.src.trim().length && avatarObject.src.trim());

      if (avatarUrl) {
        const altCandidate =
          (typeof item.avatarAlt === 'string' && item.avatarAlt.trim().length && item.avatarAlt.trim()) ||
          (avatarObject && typeof avatarObject.alt === 'string' && avatarObject.alt.trim().length && avatarObject.alt.trim()) ||
          (typeof item.avatarAltText === 'string' && item.avatarAltText.trim().length && item.avatarAltText.trim()) ||
          (name ? `${name} portrait` : 'Customer portrait');
        avatar = { src: avatarUrl, alt: altCandidate };
      }

      if (!quote) {
        return null;
      }

      return {
        id: item.id ?? `${name}-${role}-${quote.slice(0, 32)}`,
        quote,
        name,
        role,
        highlight: highlightCandidate,
        avatar,
        company: companyCandidate,
        badge: badgeCandidate,
      };
    })
    .filter(Boolean);

  return cleaned.length ? cleaned : DEFAULT_TESTIMONIALS;
}

export function TestimonialsCarousel({
  testimonials,
  loading = false,
  error = null,
  autoPlay = true,
  autoPlayInterval = AUTOPLAY_INTERVAL_MS,
  onSlideChange,
  heroEyebrow = 'Testimonials',
  heroHeading = 'Trusted by the operators shipping the future',
  heroDescription =
    'Founder collectives, in-house squads, and venture studios rely on Gigvora to orchestrate launches with the polish of world-class networks.',
  heroStats,
  className,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const items = useMemo(() => normaliseTestimonials(testimonials), [testimonials]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManualPause, setIsManualPause] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const carouselId = useId();
  const heroStatBlocks = useMemo(() => {
    if (Array.isArray(heroStats) && heroStats.length) {
      return heroStats
        .map((stat) => {
          if (!stat) return null;
          const value = typeof stat.value === 'string' ? stat.value : String(stat.value ?? '');
          const label = typeof stat.label === 'string' ? stat.label : '';
          if (!value.trim() || !label.trim()) {
            return null;
          }

          return {
            value: value.trim(),
            label: label.trim(),
            helper:
              typeof stat.helper === 'string'
                ? stat.helper.trim()
                : typeof stat.subtitle === 'string'
                ? stat.subtitle.trim()
                : undefined,
          };
        })
        .filter(Boolean);
    }

    return DEFAULT_HERO_STATS;
  }, [heroStats]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items, activeIndex]);

  useEffect(() => {
    if (typeof onSlideChange === 'function') {
      onSlideChange(activeIndex, items[activeIndex]);
    }
  }, [activeIndex, items, onSlideChange]);

  useEffect(() => {
    if (!autoPlay || prefersReducedMotion || isManualPause || isHovering || items.length <= 1) {
      return undefined;
    }

    if (typeof window === 'undefined') {
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % items.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoPlay, autoPlayInterval, prefersReducedMotion, isManualPause, isHovering, items.length]);

  const goTo = (index) => {
    setActiveIndex((index + items.length) % items.length);
  };

  const handlePrevious = () => {
    goTo(activeIndex - 1);
    setIsManualPause(true);
  };

  const handleNext = () => {
    goTo(activeIndex + 1);
    setIsManualPause(true);
  };

  const togglePause = () => {
    setIsManualPause((previous) => !previous);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      togglePause();
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!autoPlay || prefersReducedMotion || isManualPause || isHovering || items.length <= 1) {
      setProgress(0);
      return undefined;
    }

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / autoPlayInterval);
      setProgress(Math.round(ratio * 100));
    };

    tick();
    const intervalDuration = Math.max(32, Math.min(180, autoPlayInterval / 24));
    const intervalId = setInterval(tick, intervalDuration);
    progressIntervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      progressIntervalRef.current = null;
    };
  }, [autoPlay, autoPlayInterval, prefersReducedMotion, isManualPause, isHovering, items.length, activeIndex]);

  const isSkeleton = loading && !error;

  return (
    <section
      className={classNames(
        'relative overflow-hidden rounded-[42px] border border-white/15 bg-slate-950/40 p-8 shadow-[0_42px_120px_-60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-12',
        'before:pointer-events-none before:absolute before:-left-24 before:top-16 before:h-64 before:w-64 before:rounded-full before:bg-accent/20 before:blur-3xl',
        'after:pointer-events-none after:absolute after:-bottom-20 after:-right-28 after:h-72 after:w-72 after:rounded-full after:bg-emerald-400/10 after:blur-[140px]',
        className,
      )}
    >
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/90">{heroEyebrow}</p>
          <h3 className="text-3xl font-semibold text-white sm:text-4xl">{heroHeading}</h3>
          {heroDescription ? (
            <p className="text-sm text-white/70 sm:text-base">{heroDescription}</p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-left text-xs text-white/70 sm:text-sm">
            {heroStatBlocks.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className="flex flex-col rounded-3xl border border-white/15 bg-white/5 p-4"
              >
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="uppercase tracking-[0.3em] text-white/60">{stat.label}</span>
                {stat.helper ? <span className="text-xs text-white/60">{stat.helper}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div
          role="group"
          aria-roledescription="carousel"
          aria-live={isSkeleton ? 'off' : 'polite'}
          aria-label="Gigvora customer testimonials"
          id={carouselId}
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleMouseEnter}
          onBlur={handleMouseLeave}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative h-full min-h-[320px]">
            {isSkeleton ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-white/15 bg-white/5">
                <span className="h-10 w-3/4 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-rose-500/60 bg-rose-500/10 p-6 text-sm text-rose-200">
                We could not load testimonials right now. Please check back shortly.
              </div>
            ) : (
              items.map((item, index) => (
                <article
                  key={item.id ?? index}
                  className={classNames(
                    'absolute inset-0 flex h-full flex-col justify-between rounded-3xl border border-white/20 bg-gradient-to-br from-white/8 via-white/4 to-white/5 p-8 text-left text-white shadow-[0_24px_90px_rgba(15,23,42,0.45)] transition-all duration-500 ease-out sm:p-10',
                    index === activeIndex
                      ? 'pointer-events-auto opacity-100 translate-y-0'
                      : 'pointer-events-none opacity-0 translate-y-6',
                  )}
                  aria-hidden={index === activeIndex ? 'false' : 'true'}
                >
                  <div className="space-y-4">
                    {item.badge ? (
                      <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">
                        {item.badge}
                      </span>
                    ) : null}
                    <p className="text-lg leading-relaxed text-white/90 sm:text-xl">“{item.quote}”</p>
                  </div>
                  <div className="mt-6 flex items-center gap-4 text-sm text-white/80">
                    {item.avatar ? (
                      <img
                        src={item.avatar.src}
                        alt={item.avatar.alt}
                        className="h-12 w-12 rounded-full border border-white/30 object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">{item.name}</p>
                      <p>{item.role}</p>
                      {item.highlight ? <p className="text-xs text-white/70">{item.highlight}</p> : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {!isSkeleton && !error && items.length > 1 ? (
            <div className="mt-6 space-y-4">
              {autoPlay && !prefersReducedMotion ? (
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-label="Show previous testimonial"
                    aria-controls={carouselId}
                  >
                    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-label="Show next testimonial"
                    aria-controls={carouselId}
                  >
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePause}
                    className={classNames(
                      'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                      isManualPause
                        ? 'bg-white/10 text-white hover:border-white/40 hover:bg-white/20'
                        : 'bg-accent text-white hover:bg-accentDark border-transparent',
                    )}
                    aria-pressed={isManualPause}
                    aria-label={isManualPause ? 'Resume testimonial autoplay' : 'Pause testimonial autoplay'}
                  >
                    {isManualPause ? <PlayIcon className="h-5 w-5" aria-hidden="true" /> : <PauseIcon className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {items.map((item, index) => (
                    <button
                      key={item.id ?? index}
                      type="button"
                      onClick={() => {
                        goTo(index);
                        setIsManualPause(true);
                      }}
                      className={classNames(
                        'h-2.5 rounded-full transition',
                        index === activeIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/60',
                      )}
                      aria-label={`Show testimonial ${index + 1} of ${items.length}`}
                      aria-controls={carouselId}
                      aria-current={index === activeIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

TestimonialsCarousel.propTypes = {
  testimonials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      quote: PropTypes.string.isRequired,
      name: PropTypes.string,
      role: PropTypes.string,
      highlight: PropTypes.string,
      avatar: PropTypes.shape({
        src: PropTypes.string.isRequired,
        alt: PropTypes.string,
      }),
      company: PropTypes.string,
      badge: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  autoPlay: PropTypes.bool,
  autoPlayInterval: PropTypes.number,
  onSlideChange: PropTypes.func,
  heroEyebrow: PropTypes.string,
  heroHeading: PropTypes.string,
  heroDescription: PropTypes.string,
  heroStats: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      helper: PropTypes.string,
      subtitle: PropTypes.string,
    }),
  ),
  className: PropTypes.string,
};

TestimonialsCarousel.defaultProps = {
  testimonials: undefined,
  loading: false,
  error: null,
  autoPlay: true,
  autoPlayInterval: AUTOPLAY_INTERVAL_MS,
  onSlideChange: undefined,
  heroEyebrow: 'Testimonials',
  heroHeading: 'Trusted by the operators shipping the future',
  heroDescription:
    'Founder collectives, in-house squads, and venture studios rely on Gigvora to orchestrate launches with the polish of world-class networks.',
  heroStats: undefined,
  className: undefined,
};

export default TestimonialsCarousel;
