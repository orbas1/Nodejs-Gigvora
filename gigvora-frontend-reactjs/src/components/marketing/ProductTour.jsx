import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const DEFAULT_STEPS = [
  {
    id: 'orchestrate',
    eyebrow: 'Step 1',
    title: 'Orchestrate unified funnel journeys',
    description:
      'Launch persona-specific landing flows with modular hero bands, conversion paths, and social proof blocks managed inside the marketing workspace.',
    metrics: [
      { label: 'Launch cadence', value: 'Weekly sprints' },
      { label: 'Conversion lift', value: '+31%' },
    ],
    checklist: [
      'Reusable layout presets with brand tokens',
      'Integrated copy review and approval routing',
      'Audience insights panel with live benchmarks',
    ],
  },
  {
    id: 'activate',
    eyebrow: 'Step 2',
    title: 'Activate guided product storytelling',
    description:
      'Pair interactive explainers with contextual prompts, embedded walkthroughs, and AI-assisted narration to make complex workflows effortless to grasp.',
    metrics: [
      { label: 'Engagement time', value: '2m 45s' },
      { label: 'Completion rate', value: '86%' },
    ],
    checklist: [
      'Adaptive storyboards for each buyer persona',
      'Interactive hotspot callouts and automation demos',
      'Session recording summaries fed back into analytics',
    ],
  },
  {
    id: 'convert',
    eyebrow: 'Step 3',
    title: 'Convert with predictive pricing intelligence',
    description:
      'Surface best-fit plans, ROI projections, and compliance attestations automatically so stakeholders can sign off with confidence.',
    metrics: [
      { label: 'Close velocity', value: '5.6 days' },
      { label: 'Forecast accuracy', value: '±3%' },
    ],
    checklist: [
      'Real-time usage simulation by seat and module',
      'Procurement-ready security and compliance packs',
      'CRM enrichment with auto-synced decision signals',
    ],
  },
];

function StepMediaCard({ title, metrics }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Live telemetry</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">
          Instrumented dashboards reveal how each moment in the tour boosts engagement and pipeline readiness.
        </p>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {metrics?.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dt className="text-[11px] uppercase tracking-[0.35em] text-white/60">{metric.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

StepMediaCard.propTypes = {
  title: PropTypes.string.isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
};

StepMediaCard.defaultProps = {
  metrics: undefined,
};

export default function ProductTour({ id, headline, subheading, steps, defaultStepId, onStepChange, className }) {
  const resolvedSteps = useMemo(() => {
    if (Array.isArray(steps) && steps.length) {
      return steps;
    }
    return DEFAULT_STEPS;
  }, [steps]);

  const safeDefault = useMemo(() => {
    if (!defaultStepId) {
      return resolvedSteps[0]?.id;
    }
    const exists = resolvedSteps.some((step) => step.id === defaultStepId);
    return exists ? defaultStepId : resolvedSteps[0]?.id;
  }, [defaultStepId, resolvedSteps]);

  const [activeStepId, setActiveStepId] = useState(safeDefault);

  const activeStep = useMemo(() => resolvedSteps.find((step) => step.id === activeStepId) ?? resolvedSteps[0], [
    activeStepId,
    resolvedSteps,
  ]);

  const handleStepSelect = (stepId) => {
    setActiveStepId(stepId);
    if (onStepChange) {
      onStepChange(stepId);
    }
  };

  return (
    <section
      id={id ?? 'product-tour'}
      className={clsx(
        'rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/70 p-10 text-white shadow-[0_40px_90px_-50px_rgba(15,23,42,0.95)] backdrop-blur-2xl',
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-4">
          {headline ? (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">{headline}</p>
          ) : null}
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            {subheading ?? 'Experience the guided growth engine'}
          </h2>
          <p className="text-base text-white/70">
            Every chapter of the tour mirrors how revenue, marketing, and community teams co-create outcomes inside Gigvora.
            Switch between them instantly to preview the assets, analytics, and automation that accelerate conversion.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-white/60">
          <div className="rounded-full border border-white/20 px-4 py-2 uppercase tracking-[0.3em]">Playable walkthroughs</div>
          <div className="rounded-full border border-white/20 px-4 py-2 uppercase tracking-[0.3em]">Persona overlays</div>
        </div>
      </div>

      <div role="tablist" aria-label="Product tour steps" className="mt-10 grid gap-4 md:grid-cols-3">
        {resolvedSteps.map((step) => {
          const isActive = step.id === activeStep?.id;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${step.id}-panel`}
              onClick={() => handleStepSelect(step.id)}
              className={clsx(
                'group flex flex-col gap-3 rounded-3xl border px-5 py-6 text-left transition focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900/60',
                isActive
                  ? 'border-white/40 bg-white/10 text-white shadow-[0_28px_60px_-40px_rgba(56,189,248,0.75)]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10',
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{step.eyebrow}</span>
              <span className="text-lg font-semibold leading-tight">{step.title}</span>
              <p className="text-sm text-white/70">{step.description}</p>
              <span
                className={clsx(
                  'inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]',
                  isActive ? 'text-white' : 'text-white/50',
                )}
              >
                {isActive ? 'Currently viewing' : 'Preview'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_0.8fr)]">
        <article
          id={`${activeStep.id}-panel`}
          role="tabpanel"
          aria-labelledby={activeStep.id}
          className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80 shadow-[0_40px_90px_-55px_rgba(59,130,246,0.7)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">{activeStep.title}</h3>
              <p className="mt-2 max-w-2xl text-sm text-white/70">{activeStep.description}</p>
            </div>
            <div className="flex gap-3">
              {activeStep.metrics?.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs">
                  <p className="uppercase tracking-[0.35em] text-white/50">{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activeStep.checklist?.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white"
              >
                <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-xs font-semibold text-white shadow-[0_12px_24px_-10px_rgba(56,189,248,0.7)]">
                  ✓
                </span>
                <p className="text-sm text-white/80">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Persona overlays</p>
              <p className="text-sm text-white/80">
                Toggle to see how marketing, revenue, or community leads experience this chapter with contextual messaging.
              </p>
            </div>
            <div className="flex gap-2">
              {['Marketing', 'Revenue', 'Community'].map((persona) => (
                <span
                  key={persona}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70"
                >
                  {persona}
                </span>
              ))}
            </div>
          </div>
        </article>

        <StepMediaCard title={activeStep.title} metrics={activeStep.metrics} />
      </div>
    </section>
  );
}

ProductTour.propTypes = {
  id: PropTypes.string,
  headline: PropTypes.string,
  subheading: PropTypes.string,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      eyebrow: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ),
      checklist: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  defaultStepId: PropTypes.string,
  onStepChange: PropTypes.func,
  className: PropTypes.string,
};

ProductTour.defaultProps = {
  id: undefined,
  headline: 'Product Tour',
  subheading: undefined,
  steps: undefined,
  defaultStepId: undefined,
  onStepChange: undefined,
  className: undefined,
};
