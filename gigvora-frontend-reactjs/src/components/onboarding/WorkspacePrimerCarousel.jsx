import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function SlideIndicators({ total, activeIndex, onSelect }) {
  if (total <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <button
            type="button"
            key={index}
            onClick={() => onSelect?.(index)}
            className={`h-2 w-6 rounded-full transition ${
              active ? 'bg-accent shadow-soft' : 'bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Show slide ${index + 1}`}
            aria-pressed={active}
          />
        );
      })}
    </div>
  );
}

SlideIndicators.propTypes = {
  total: PropTypes.number.isRequired,
  activeIndex: PropTypes.number.isRequired,
  onSelect: PropTypes.func,
};

function buildSlides(personaHighlights, onboardingHighlights) {
  const personaSlides = personaHighlights.map((item, index) => ({
    id: `persona-${item.key ?? index}`,
    eyebrow: `Persona · ${item.title}`,
    title: item.title,
    description: item.description,
    accent: item.accent ?? 'from-emerald-500 to-blue-500',
    metrics: item.metrics ?? ['Guided dashboards', 'AI nudges at launch', 'Cross-team alerts'],
    footer: 'Dashboards and task lists are tailored instantly after sign-up.',
  }));

  const highlightSlides = onboardingHighlights.map((item, index) => ({
    id: `highlight-${item.id ?? index}`,
    eyebrow: item.eyebrow ?? 'Gigvora Onboarding',
    title: item.title,
    description: item.description,
    accent: item.accent ?? 'from-indigo-500 to-purple-500',
    metrics: item.metrics ?? [],
    footer: item.footer ?? 'Stay in control with enterprise-grade governance and analytics.',
    icon: item.icon,
  }));

  return [...personaSlides, ...highlightSlides];
}

export default function WorkspacePrimerCarousel({
  personaHighlights,
  onboardingHighlights,
  membershipSummary,
}) {
  const slides = useMemo(
    () => buildSlides(personaHighlights, onboardingHighlights),
    [personaHighlights, onboardingHighlights],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const showPrevious = () => {
    setActiveIndex((current) => {
      if (!slides.length) {
        return current;
      }
      return current === 0 ? slides.length - 1 : current - 1;
    });
  };

  const showNext = () => {
    setActiveIndex((current) => {
      if (!slides.length) {
        return current;
      }
      return current === slides.length - 1 ? 0 : current + 1;
    });
  };

  const activeSlide = slides[activeIndex];

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span>Workspace primer</span>
          <span className="inline-flex h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
          <span>{membershipSummary}</span>
        </div>
        <p className="text-sm text-slate-500">
          Preview the guided journeys, analytics, and support layers we unlock for your selected personas.
        </p>
      </header>
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-surfaceMuted to-white p-1">
        {activeSlide ? (
          <article className="relative flex h-full flex-col justify-between rounded-[26px] bg-white/80 p-8 shadow-soft">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                {activeSlide.icon ? <span aria-hidden="true">{activeSlide.icon}</span> : null}
                {activeSlide.eyebrow}
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{activeSlide.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{activeSlide.description}</p>
              </div>
              {activeSlide.metrics?.length ? (
                <dl className="grid gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-slate-100 shadow-inner sm:grid-cols-3">
                  {activeSlide.metrics.map((metric) => (
                    <div key={metric} className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Launch asset</dt>
                      <dd className="text-sm font-semibold">{metric}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
            <footer className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>{activeSlide.footer}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={showPrevious}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-accent/40 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Show previous primer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-accent/40 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Show next primer"
                >
                  ›
                </button>
              </div>
            </footer>
          </article>
        ) : (
          <div className="rounded-[26px] bg-white/70 p-8 text-sm text-slate-500">
            Select at least one persona to preview the curated onboarding experience we prepare.
          </div>
        )}
      </div>
      <SlideIndicators total={slides.length} activeIndex={activeIndex} onSelect={setActiveIndex} />
    </section>
  );
}

WorkspacePrimerCarousel.propTypes = {
  personaHighlights: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      accent: PropTypes.string,
      metrics: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  onboardingHighlights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      accent: PropTypes.string,
      metrics: PropTypes.arrayOf(PropTypes.string),
      eyebrow: PropTypes.string,
      footer: PropTypes.string,
      icon: PropTypes.node,
    }),
  ),
  membershipSummary: PropTypes.string.isRequired,
};

WorkspacePrimerCarousel.defaultProps = {
  personaHighlights: [],
  onboardingHighlights: [],
};
