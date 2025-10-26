import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';

const AUTOPLAY_INTERVAL_MS = 12000;

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

function resolveHighlights(step, personaId) {
  if (!step) return [];
  const personaHighlights = step.personaHighlights ?? {};
  const highlights = personaHighlights[personaId] ?? personaHighlights.default ?? step.highlights ?? [];

  if (!Array.isArray(highlights)) {
    return [];
  }

  return highlights.filter((item) => Boolean(item && item.trim && item.trim().length));
}

function renderMedia(media) {
  if (!media) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/40">Live demo preview</p>
      </div>
    );
  }

  if (media.type === 'video' && (media.sources?.length || media.src)) {
    return (
      <video
        className="h-full w-full rounded-3xl border border-white/10 object-cover shadow-[0_24px_80px_rgba(15,23,42,0.6)]"
        poster={media.poster}
        autoPlay={media.autoPlay ?? true}
        muted={media.muted ?? true}
        loop={media.loop ?? true}
        playsInline
        controls={media.controls ?? false}
      >
        {media.sources?.length
          ? media.sources.map((source) =>
              source?.src ? <source key={source.src} src={source.src} type={source.type ?? 'video/mp4'} /> : null,
            )
          : <source src={media.src} type={media.typeHint ?? 'video/mp4'} />}
        {media.fallback ? <track kind="descriptions" src={media.fallback} /> : null}
      </video>
    );
  }

  if (media.type === 'image' && media.src) {
    return (
      <img
        src={media.src}
        alt={media.alt ?? 'Product tour preview'}
        className="h-full w-full rounded-3xl border border-white/10 object-cover shadow-[0_24px_80px_rgba(15,23,42,0.6)]"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/40">Immersive walkthrough</p>
    </div>
  );
}

export default function ProductTour({
  steps,
  personas,
  initialPersonaId,
  autoPlay = true,
  analyticsMetadata = {},
  className,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const safeSteps = useMemo(() => (Array.isArray(steps) ? steps.filter(Boolean) : []), [steps]);
  const safePersonas = useMemo(() => (Array.isArray(personas) ? personas.filter(Boolean) : []), [personas]);
  const defaultPersonaId = useMemo(
    () => initialPersonaId ?? safePersonas[0]?.id ?? safePersonas[0]?.key ?? 'founder',
    [initialPersonaId, safePersonas],
  );
  const [activePersonaId, setActivePersonaId] = useState(defaultPersonaId);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const autoplayRef = useRef(null);
  const firstPersonaChange = useRef(true);
  const firstStepChange = useRef(true);

  useEffect(() => {
    setActivePersonaId(defaultPersonaId);
  }, [defaultPersonaId]);

  useEffect(() => {
    analytics.track(
      'marketing_product_tour_viewed',
      {
        personaCount: safePersonas.length,
        stepCount: safeSteps.length,
        initialPersona: defaultPersonaId,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [analyticsMetadata.source, defaultPersonaId, safePersonas.length, safeSteps.length]);

  useEffect(() => {
    if (!autoPlay || prefersReducedMotion || safeSteps.length <= 1) {
      return undefined;
    }

    autoplayRef.current = window.setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % safeSteps.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoPlay, prefersReducedMotion, safeSteps.length]);

  useEffect(() => {
    if (firstPersonaChange.current) {
      firstPersonaChange.current = false;
      return;
    }

    const persona = safePersonas.find((item) => item.id === activePersonaId) ?? null;
    analytics.track(
      'marketing_product_tour_persona_changed',
      {
        persona: persona?.id ?? activePersonaId,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [activePersonaId, analyticsMetadata.source, safePersonas]);

  useEffect(() => {
    if (firstStepChange.current) {
      firstStepChange.current = false;
      return;
    }

    const step = safeSteps[activeStepIndex];
    analytics.track(
      'marketing_product_tour_step_changed',
      {
        stepId: step?.id ?? step?.title ?? activeStepIndex,
        persona: activePersonaId,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [activePersonaId, activeStepIndex, analyticsMetadata.source, safeSteps]);

  const activeStep = safeSteps[activeStepIndex] ?? null;
  const highlights = resolveHighlights(activeStep, activePersonaId);
  const persona = safePersonas.find((item) => item.id === activePersonaId);

  return (
    <section className={clsx('relative overflow-hidden border-b border-white/10 bg-slate-950/40', className)}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_65%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-start">
        <div className="w-full space-y-8 lg:max-w-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Product tour</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{activeStep?.title ?? 'Experience Gigvora in motion'}</h2>
            <p className="mt-3 text-sm text-white/70">
              {activeStep?.summary ??
                'Follow a live workflow showing how operators launch programmes, mentors coach talent, and executives see progress in one shared command centre.'}
            </p>
          </div>

          {safePersonas.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Persona lenses</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {safePersonas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePersonaId(item.id);
                      setActiveStepIndex(0);
                    }}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                      item.id === activePersonaId
                        ? 'border-accent bg-accent text-slate-950 shadow-soft'
                        : 'border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10',
                    )}
                    aria-pressed={item.id === activePersonaId}
                  >
                    {item.label ?? item.name ?? item.title ?? 'Persona'}
                  </button>
                ))}
              </div>
              {persona?.description ? <p className="mt-3 text-xs text-white/60">{persona.description}</p> : null}
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Highlights</p>
            <ul className="mt-3 space-y-3 text-sm text-white/80">
              {highlights.length ? (
                highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-white/50">Explore each step to see how cross-functional teams stay in sync.</li>
              )}
            </ul>
          </div>

          {activeStep?.cta ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  analytics.track(
                    'marketing_product_tour_cta_clicked',
                    {
                      stepId: activeStep.id ?? activeStepIndex,
                      persona: activePersonaId,
                      action: activeStep.cta.action ?? 'request_demo',
                    },
                    { source: analyticsMetadata.source ?? 'web_marketing_site' },
                  );
                  activeStep.cta.onClick?.({ persona: activePersonaId, step: activeStep });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
              >
                {activeStep.cta.label ?? 'Request a live demo'}
              </button>
              {activeStep.secondaryCta ? (
                <button
                  type="button"
                  onClick={() => {
                    analytics.track(
                      'marketing_product_tour_secondary_cta_clicked',
                      {
                        stepId: activeStep.id ?? activeStepIndex,
                        persona: activePersonaId,
                        action: activeStep.secondaryCta.action ?? 'view_docs',
                      },
                      { source: analyticsMetadata.source ?? 'web_marketing_site' },
                    );
                    activeStep.secondaryCta.onClick?.({ persona: activePersonaId, step: activeStep });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                >
                  {activeStep.secondaryCta.label ?? 'Preview documentation'}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Real usage telemetry anonymised for privacy.
          </div>
        </div>

        <div className="w-full flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <nav aria-label="Tour steps" className="flex flex-wrap gap-3">
              {safeSteps.map((step, index) => (
                <button
                  key={step.id ?? step.title ?? index}
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  className={clsx(
                    'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    index === activeStepIndex
                      ? 'bg-accent text-slate-950 shadow-soft'
                      : 'bg-white/5 text-white/60 hover:bg-white/10',
                  )}
                  aria-current={index === activeStepIndex ? 'step' : undefined}
                >
                  {step.label ?? `Step ${index + 1}`}
                </button>
              ))}
            </nav>
            {autoPlay && !prefersReducedMotion ? (
              <button
                type="button"
                onClick={() => {
                  if (!autoplayRef.current) {
                    autoplayRef.current = window.setInterval(() => {
                      setActiveStepIndex((prev) => (prev + 1) % safeSteps.length);
                    }, AUTOPLAY_INTERVAL_MS);
                  } else {
                    window.clearInterval(autoplayRef.current);
                    autoplayRef.current = null;
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
                aria-pressed={Boolean(autoplayRef.current)}
                aria-label={autoplayRef.current ? 'Pause auto-play' : 'Start auto-play'}
              >
                {autoplayRef.current ? <PauseIcon className="h-5 w-5" aria-hidden="true" /> : <PlayIcon className="h-5 w-5" aria-hidden="true" />}
              </button>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-accent/20 via-indigo-500/20 to-slate-900/70 blur-3xl" aria-hidden="true" />
            {renderMedia(activeStep?.media)}
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <p className="font-semibold uppercase tracking-[0.35em] text-white/50">Journey markers</p>
              <div className="flex flex-1 items-center gap-3" aria-hidden="true">
                {safeSteps.map((step, index) => (
                  <span
                    key={step.id ?? step.title ?? index}
                    className={clsx(
                      'h-1 flex-1 rounded-full transition',
                      index <= activeStepIndex ? 'bg-accent' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 text-sm text-white/80 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Time to insight</p>
                <p className="mt-2 text-lg font-semibold text-white">{activeStep?.metrics?.timeToValue ?? 'Under 10 minutes'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Automation coverage</p>
                <p className="mt-2 text-lg font-semibold text-white">{activeStep?.metrics?.automation ?? '87% of tasks'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Collaboration surface</p>
                <p className="mt-2 text-lg font-semibold text-white">{activeStep?.metrics?.collaboration ?? 'Mentors, founders, ops'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ProductTour.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      title: PropTypes.string,
      summary: PropTypes.string,
      personaHighlights: PropTypes.object,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.shape({
        timeToValue: PropTypes.string,
        automation: PropTypes.string,
        collaboration: PropTypes.string,
      }),
      media: PropTypes.shape({
        type: PropTypes.oneOf(['video', 'image']),
        src: PropTypes.string,
        sources: PropTypes.arrayOf(
          PropTypes.shape({
            src: PropTypes.string,
            type: PropTypes.string,
          }),
        ),
        poster: PropTypes.string,
        autoPlay: PropTypes.bool,
        muted: PropTypes.bool,
        loop: PropTypes.bool,
        controls: PropTypes.bool,
        alt: PropTypes.string,
        fallback: PropTypes.string,
        typeHint: PropTypes.string,
      }),
      cta: PropTypes.shape({
        label: PropTypes.string,
        action: PropTypes.string,
        onClick: PropTypes.func,
      }),
      secondaryCta: PropTypes.shape({
        label: PropTypes.string,
        action: PropTypes.string,
        onClick: PropTypes.func,
      }),
    }),
  ).isRequired,
  personas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string,
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  initialPersonaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  autoPlay: PropTypes.bool,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  className: PropTypes.string,
};

ProductTour.defaultProps = {
  personas: [],
  initialPersonaId: undefined,
  autoPlay: true,
  analyticsMetadata: {},
  className: undefined,
};
