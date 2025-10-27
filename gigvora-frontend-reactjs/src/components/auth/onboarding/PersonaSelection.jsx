import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DEFAULT_PERSONAS_FOR_SELECTION } from './personaContent.js';

const personaShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  headline: PropTypes.string,
  benefits: PropTypes.arrayOf(PropTypes.string).isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
    }),
  ).isRequired,
  signatureMoments: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }),
  ),
  recommendedModules: PropTypes.arrayOf(PropTypes.string),
  heroMedia: PropTypes.shape({
    poster: PropTypes.string,
    alt: PropTypes.string,
  }),
  metadata: PropTypes.shape({
    primaryCta: PropTypes.string,
    personaPillar: PropTypes.string,
    primerHighlights: PropTypes.arrayOf(PropTypes.string),
    recommendedRoles: PropTypes.arrayOf(PropTypes.string),
  }),
});

export default function PersonaSelection({
  personas = DEFAULT_PERSONAS_FOR_SELECTION,
  value,
  onChange,
  onPreview,
  disabled = false,
}) {
  const personaList = useMemo(() => {
    return personas.map((persona) => ({
      ...persona,
      metrics: persona.metrics.map((metric) => ({
        ...metric,
        value: metric.value,
        label: metric.label,
        delta: metric.delta,
      })),
    }));
  }, [personas]);

  const selectedPersona = useMemo(() => personaList.find((item) => item.id === value), [personaList, value]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Choose the journey that matches your focus</h2>
        <p className="text-sm text-slate-500">
          Each persona activates a pre-built sequence of modules, analytics, and storytelling moments tuned to proven growth
          playbooks. Switch anytime—your workspace keeps progress synced.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {personaList.map((persona) => {
          const isSelected = persona.id === value;
          const personaPillarLabel = persona.metadata?.personaPillar
            ? persona.metadata.personaPillar
                .split('-')
                .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                .join(' ')
            : 'Premium onboarding';
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => !disabled && onChange?.(persona.id, persona)}
              onMouseEnter={() => onPreview?.(persona)}
              className={[
                'group flex h-full flex-col rounded-3xl border p-6 text-left transition',
                'border-slate-200 bg-white shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/40',
                isSelected ? 'border-accent shadow-lg ring-2 ring-accent/50' : '',
                disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
              ].join(' ')}
              disabled={disabled}
            >
              {persona.heroMedia?.poster ? (
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={persona.heroMedia.poster}
                    alt={persona.heroMedia.alt || `${persona.title} hero`}
                    className="h-32 w-full rounded-2xl object-cover transition duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-start rounded-2xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 p-4 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  Workspace preview
                </div>
              )}

              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                {personaPillarLabel}
              </div>

              <div className="flex items-start justify-between gap-3 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Persona</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{persona.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{persona.subtitle}</p>
                </div>
                <span
                  aria-hidden="true"
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    isSelected
                      ? 'bg-accent text-white shadow-accent/40 shadow-sm'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white',
                  ].join(' ')}
                >
                  {isSelected ? 'Selected' : 'Preview'}
                </span>
              </div>

              {persona.headline && <p className="mt-4 text-sm font-medium text-slate-600">{persona.headline}</p>}

              <ul className="mt-4 space-y-3">
                {persona.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                {persona.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-start justify-between gap-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
                      <dd className="mt-1 text-base font-semibold text-slate-900">{metric.value}</dd>
                    </div>
                    {metric.delta && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {metric.delta}
                      </span>
                    )}
                  </div>
                ))}
              </dl>

              {persona.signatureMoments?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signature moments</p>
                  <div className="space-y-3">
                    {persona.signatureMoments.map((moment) => (
                      <div key={moment.label} className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-inner">
                        <p className="text-sm font-semibold text-slate-900">{moment.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{moment.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {persona.recommendedModules?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Core modules</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {persona.recommendedModules.map((module) => (
                      <span
                        key={module}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {persona.metadata?.primaryCta ? (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">{persona.metadata.primaryCta}</span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Ready
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedPersona && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">{selectedPersona.title} journey overview</h4>
          <p className="mt-2 text-sm text-slate-500">
            Preview the onboarding path before you launch. Each milestone includes curated templates, automation, and analytics
            tuned to your goals.
          </p>
          {selectedPersona.signatureMoments?.length ? (
            <ol className="mt-4 grid gap-4 md:grid-cols-2">
              {selectedPersona.signatureMoments.map((moment, index) => (
                <li key={moment.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Phase {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{moment.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{moment.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Signature moments will appear here once you select a persona.</p>
          )}
        </section>
      )}
    </div>
  );
}

PersonaSelection.propTypes = {
  personas: PropTypes.arrayOf(personaShape),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPreview: PropTypes.func,
  disabled: PropTypes.bool,
};

export { personaShape, DEFAULT_PERSONAS_FOR_SELECTION };
