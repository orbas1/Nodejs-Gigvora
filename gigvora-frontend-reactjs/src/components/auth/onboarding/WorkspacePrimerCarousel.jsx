import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_SLIDES = [
  {
    id: 'primer-insights',
    pill: 'Workspace intelligence',
    title: 'Spotlight wins with AI-powered insights',
    description:
      'Glassmorphic cards highlight your pipeline, brand reach, and collaborator momentum so leaders stay aligned in seconds.',
    metrics: [
      { label: 'Engagement lift', value: '+42%' },
      { label: 'Launch readiness', value: '98%' },
    ],
    checklist: ['Smart metrics auto-refresh every Monday', 'Executive briefs ship to email and Slack'],
  },
  {
    id: 'primer-automation',
    pill: 'Automation',
    title: 'Orchestrate campaigns without manual lift',
    description:
      'Trigger nurture journeys, invite follow-ups, and social drops directly from your workspace with premium-ready defaults.',
    checklist: ['One-click campaign launchers', 'Persona-tested copy blocks ready to publish'],
  },
  {
    id: 'primer-collaboration',
    pill: 'Collaboration',
    title: 'Activate collaborators with tailored access',
    description:
      'Invite leaders, approvers, and partners with role-based dashboards so everyone sees the right insights immediately.',
    checklist: ['Role-aware permissions with audit trails', 'Calendar-ready rituals and reminders'],
  },
];

function clampIndex(index, total) {
  if (total === 0) {
    return 0;
  }
  if (index < 0) {
    return total - 1;
  }
  if (index >= total) {
    return 0;
  }
  return index;
}

export default function WorkspacePrimerCarousel({
  slides = DEFAULT_SLIDES,
  initialIndex = 0,
  autoAdvanceMs = 8000,
  onSlideChange,
}) {
  const slideDeck = useMemo(() => {
    return slides.filter((slide) => slide && slide.title);
  }, [slides]);
  const [activeIndex, setActiveIndex] = useState(() => clampIndex(initialIndex, slideDeck.length));
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, slideDeck.length));
  }, [slideDeck.length]);

  useEffect(() => {
    const activeSlide = slideDeck[activeIndex];
    if (!activeSlide) {
      return;
    }
    onSlideChange?.({ index: activeIndex, slide: activeSlide });
  }, [activeIndex, onSlideChange, slideDeck]);

  useEffect(() => {
    if (!autoAdvanceMs || slideDeck.length <= 1) {
      return undefined;
    }

    if (isHovering || isFocusWithin) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((current) => clampIndex(current + 1, slideDeck.length));
    }, autoAdvanceMs);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [autoAdvanceMs, isFocusWithin, isHovering, slideDeck.length]);

  const goToIndex = (index) => {
    setActiveIndex(clampIndex(index, slideDeck.length));
  };

  const handlePrevious = () => {
    setActiveIndex((current) => clampIndex(current - 1, slideDeck.length));
  };

  const handleNext = () => {
    setActiveIndex((current) => clampIndex(current + 1, slideDeck.length));
  };

  const handleKeyDown = (event) => {
    if (!slideDeck.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        handleNext();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        handlePrevious();
        break;
      case 'Home':
        event.preventDefault();
        goToIndex(0);
        break;
      case 'End':
        event.preventDefault();
        goToIndex(slideDeck.length - 1);
        break;
      default:
    }
  };

  const activeSlide = slideDeck[activeIndex] ?? null;

  if (!activeSlide) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Workspace primers load once you select a persona.
      </div>
    );
  }

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={() => setIsFocusWithin(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {activeSlide.pill || 'Workspace primer'}
          </span>
          <h3 className="text-xl font-semibold text-slate-900">{activeSlide.title}</h3>
          <p className="text-sm text-slate-600">{activeSlide.description}</p>
          {activeSlide.metrics?.length ? (
            <dl className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-2">
              {activeSlide.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {activeSlide.checklist?.length ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {activeSlide.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              onClick={handlePrevious}
              aria-label="Previous primer slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              onClick={handleNext}
              aria-label="Next primer slide"
            >
              ›
            </button>
          </div>
          <div className="flex items-center gap-1">
            {slideDeck.map((slide, index) => (
              <button
                key={slide.id || slide.title}
                type="button"
                onClick={() => goToIndex(index)}
                className={`h-2 rounded-full transition ${
                  index === activeIndex ? 'w-8 bg-accent' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Show primer slide ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {activeIndex + 1} / {slideDeck.length}
          </span>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {activeSlide.title}
      </div>
    </section>
  );
}

const metricShape = PropTypes.shape({
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
});

const slideShape = PropTypes.shape({
  id: PropTypes.string,
  pill: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  metrics: PropTypes.arrayOf(metricShape),
  checklist: PropTypes.arrayOf(PropTypes.string),
});

WorkspacePrimerCarousel.propTypes = {
  slides: PropTypes.arrayOf(slideShape),
  initialIndex: PropTypes.number,
  autoAdvanceMs: PropTypes.number,
  onSlideChange: PropTypes.func,
};

WorkspacePrimerCarousel.defaultProps = {
  slides: DEFAULT_SLIDES,
  initialIndex: 0,
  autoAdvanceMs: 8000,
  onSlideChange: undefined,
};

export { slideShape };
