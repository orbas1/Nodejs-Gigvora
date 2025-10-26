import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const AUTO_ADVANCE_MS = 8000;

function MetricsList({ metrics }) {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div
          key={`${metric.label}-${metric.value}`}
          className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white/90 backdrop-blur"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">{metric.label}</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

MetricsList.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
};

MetricsList.defaultProps = {
  metrics: [],
};

export default function WorkspacePrimerCarousel({ slides, analytics, autoAdvanceMs }) {
  const items = useMemo(
    () => (Array.isArray(slides) ? slides.filter((slide) => slide && slide.id) : []),
    [slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const lastTrackedSlideId = useRef(null);

  useEffect(() => {
    if (!items.length) {
      return undefined;
    }

    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }

    return () => {
      if (activeIndex >= items.length) {
        setActiveIndex(0);
      }
    };
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!items.length) {
      return undefined;
    }

    const slide = items[activeIndex];
    if (!slide) {
      return undefined;
    }

    if (slide.id !== lastTrackedSlideId.current) {
      analytics?.track?.('web_onboarding_workspace_primer_viewed', {
        slideId: slide.id,
        title: slide.title,
        eyebrow: slide.eyebrow,
      });
      lastTrackedSlideId.current = slide.id;
    }

    return undefined;
  }, [activeIndex, analytics, items]);

  useEffect(() => {
    if (!items.length) {
      return undefined;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, autoAdvanceMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [items.length, autoAdvanceMs]);

  const goToIndex = (index) => {
    if (!items.length) {
      return;
    }
    const nextIndex = (index + items.length) % items.length;
    setActiveIndex(nextIndex);
    const slide = items[nextIndex];
    if (slide) {
      analytics?.track?.('web_onboarding_workspace_primer_interacted', {
        slideId: slide.id,
        title: slide.title,
      });
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Workspace primers will appear once you select a persona and start configuring your workspace.
      </div>
    );
  }

  const activeSlide = items[activeIndex] ?? items[0];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-900/40 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-6 text-white shadow-xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {activeSlide.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{activeSlide.eyebrow}</p>
          ) : null}
          <h3 className="mt-1 text-xl font-semibold text-white">{activeSlide.title}</h3>
          {activeSlide.description ? (
            <p className="mt-2 max-w-2xl text-sm text-white/80">{activeSlide.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <button
            type="button"
            onClick={() => goToIndex(activeIndex - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Show previous workspace primer"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToIndex(activeIndex + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Show next workspace primer"
          >
            ›
          </button>
        </div>
      </header>

      {Array.isArray(activeSlide.highlights) && activeSlide.highlights.length ? (
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {activeSlide.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-400" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6">
        <MetricsList metrics={activeSlide.metrics} />
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToIndex(index)}
                className={`h-2.5 w-8 rounded-full transition ${
                  isActive ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Show ${item.title}`}
                aria-current={isActive}
              />
            );
          })}
        </div>
        {activeSlide.ctaLabel && activeSlide.ctaHref ? (
          <a
            href={activeSlide.ctaHref}
            className="inline-flex items-center gap-1 rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            {activeSlide.ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </footer>
    </section>
  );
}

WorkspacePrimerCarousel.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      eyebrow: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        }),
      ),
      ctaLabel: PropTypes.string,
      ctaHref: PropTypes.string,
    }),
  ),
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
  autoAdvanceMs: PropTypes.number,
};

WorkspacePrimerCarousel.defaultProps = {
  slides: [],
  analytics: undefined,
  autoAdvanceMs: AUTO_ADVANCE_MS,
};
