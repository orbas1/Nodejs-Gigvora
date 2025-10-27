import { useMemo } from 'react';
import PropTypes from 'prop-types';

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

const DEFAULT_PERSONAS = [
  {
    id: 'founder',
    title: 'Founder building a hiring brand',
    subtitle: 'Grow your employer presence, spotlight wins, and keep pipelines warm.',
    headline: 'Designed for founding teams scaling storytelling and inbound talent.',
    benefits: [
      'Launch a dynamic company profile with testimonials, playlists, and KPI spotlights.',
      'Coordinate hiring sprints with ATS sync, referral hubs, and brand campaigns.',
      'Surface people stories, product drops, and community updates to convert candidates.',
    ],
    metrics: [
      { label: 'Brand impressions', value: '120K / mo', delta: '+38%' },
      { label: 'Referral response time', value: '2.4 hrs', delta: '-41%' },
    ],
    signatureMoments: [
      {
        label: 'Activation sprint',
        description: 'Connect ATS, seed media stories, and launch invite-only showcase events.',
      },
      {
        label: 'Weekly ritual',
        description: 'Publish hiring stories, review warm leads, and action employer brand insights.',
      },
    ],
    recommendedModules: ['Company spotlight', 'Talent marketing studio', 'Referral hub', 'Executive briefings'],
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/founder/hero.jpg',
      alt: 'Founding team reviewing brand analytics dashboards',
    },
    metadata: {
      primaryCta: 'Launch hiring brand workspace',
      personaPillar: 'hiring-brand',
      primerHighlights: [
        'Instantly publish a flagship profile with testimonials and impact stats.',
        'Automate referral sourcing, warm outreach, and campaign recaps.',
        'Keep leadership informed with Monday-ready hiring analytics.',
      ],
      recommendedRoles: ['Head of People', 'Talent partner', 'Employer brand lead'],
    },
  },
  {
    id: 'freelancer',
    title: 'Independent specialist',
    subtitle: 'Showcase your craft, activate deal-flow, and nurture premium collaborations.',
    headline: 'Built for consultants, fractional leaders, and boutique studios.',
    benefits: [
      'Curate a services portfolio with case studies, pricing, and testimonials in minutes.',
      'Sync availability, proposal templates, and pipeline kanban to stay in command.',
      'Unlock network boosts, warm introductions, and collaboration pods tailored to your craft.',
    ],
    metrics: [
      { label: 'Pipeline win rate', value: '62%', delta: '+19 pts' },
      { label: 'Average project value', value: '£18.4K', delta: '+24%' },
    ],
    signatureMoments: [
      {
        label: 'Credibility burst',
        description: 'Publish hero reel, highlight credentials, and promote packaged offers.',
      },
      {
        label: 'Deal momentum',
        description: 'Automate proposal follow-ups, highlight social proof, and track negotiations.',
      },
    ],
    recommendedModules: ['Service portfolio', 'Gig pipeline', 'Proposal studio', 'Client collaboration hub'],
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/freelancer/hero.jpg',
      alt: 'Independent consultant presenting a digital workspace to clients',
    },
    metadata: {
      primaryCta: 'Spin up deal-flow cockpit',
      personaPillar: 'independent-talent',
      primerHighlights: [
        'Curate your best work with reels, testimonials, and packaged offers.',
        'Sync proposals, follow-ups, and warm intros to stay top-of-mind.',
        'Activate AI insights so you never miss deal momentum.',
      ],
      recommendedRoles: ['Founder', 'Revenue partner', 'Operations lead'],
    },
  },
  {
    id: 'talent-leader',
    title: 'Talent & people leader',
    subtitle: 'Operationalise hiring, onboarding, and community updates with precision.',
    headline: 'Supports heads of talent orchestrating global hiring and employee journeys.',
    benefits: [
      'Blend ATS intelligence, hiring health dashboards, and onboarding checklists.',
      'Automate candidate storytelling, nurture talent pools, and activate employee advocates.',
      'Partner with leadership via analytics-ready scorecards and executive briefing packs.',
    ],
    metrics: [
      { label: 'Time-to-hire', value: '22 days', delta: '-9 days' },
      { label: 'Onboarding satisfaction', value: '4.7 / 5', delta: '+0.8' },
    ],
    signatureMoments: [
      {
        label: 'Launch readiness',
        description: 'Publish onboarding journey, calibrate hiring scorecards, and sync orientation assets.',
      },
      {
        label: 'Executive reporting',
        description: 'Review hiring velocity, onboarding health, and pipeline diversity every Monday.',
      },
    ],
    recommendedModules: ['Talent analytics', 'Onboarding programs', 'Employee advocacy', 'Leadership dashboards'],
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/talent-leader/hero.jpg',
      alt: 'People leader hosting a global onboarding workshop over video',
    },
    metadata: {
      primaryCta: 'Orchestrate onboarding journeys',
      personaPillar: 'people-ops',
      primerHighlights: [
        'Blend ATS signals, people analytics, and onboarding checklists.',
        'Publish journeys with tailored templates and automation triggers.',
        'Deliver executive briefings with hiring velocity and satisfaction deltas.',
      ],
      recommendedRoles: ['Chief of Staff', 'People partner', 'Operations lead'],
    },
  },
];

export default function PersonaSelection({
  personas = DEFAULT_PERSONAS,
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

PersonaSelection.defaultProps = {
  personas: DEFAULT_PERSONAS,
  value: undefined,
  onChange: undefined,
  onPreview: undefined,
  disabled: false,
};

export { personaShape, DEFAULT_PERSONAS as DEFAULT_PERSONAS_FOR_SELECTION };
