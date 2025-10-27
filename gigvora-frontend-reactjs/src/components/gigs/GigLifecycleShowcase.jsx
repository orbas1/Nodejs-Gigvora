import PropTypes from 'prop-types';
import { Fragment, useMemo } from 'react';
import {
  DEFAULT_GIG_BLUEPRINT_ID,
  findGigBlueprintContract,
} from '@shared-contracts/domain/marketplace/gig-blueprints.js';

const structuredCloneFn =
  typeof globalThis.structuredClone === 'function' ? globalThis.structuredClone : (value) => JSON.parse(JSON.stringify(value));

const CONTRACT_DEFAULT = findGigBlueprintContract(DEFAULT_GIG_BLUEPRINT_ID);

const FALLBACK_BLUEPRINT = {
  hero: {
    eyebrow: 'Gig operations',
    title: 'Operational blueprint',
    description:
      'Every gig you run syncs timeline, assets, compliance, and storytelling across web and mobile. Use this blueprint to align crews before launch and keep every stakeholder informed.',
    highlights: [
      'Milestones, submissions, addons, and reviews are orchestrated end to end.',
      'Mobile parity keeps approvals and updates in sync wherever operators work.',
    ],
  },
  timelinePhases: CONTRACT_DEFAULT?.timelinePhases ?? [
    {
      title: 'Discovery & alignment',
      description:
        'Intake briefs, confirm budget envelopes, and sync buyer expectations before the first pitch is accepted.',
      metrics: ['SLA: 24h response', 'Compliance sign-off ready', 'Kickoff assets mapped'],
    },
    {
      title: 'Pitching & selection',
      description: 'Freelancers submit structured responses, automate credential checks, and confirm delivery capacity.',
      metrics: ['Shortlist scoring', 'Live Q&A threads', 'Instant status updates'],
    },
    {
      title: 'Delivery & QA',
      description: 'Timeline orchestration, milestone tracking, and revision governance keep engagements moving smoothly.',
      metrics: ['Milestones locked', 'Revision windows defined', 'Escalation map activated'],
    },
    {
      title: 'Review & showcase',
      description: 'Capture outcomes, publish portfolio updates, and syndicate learnings across the Gigvora network.',
      metrics: ['Review automation', 'Portfolio-ready assets', 'Client satisfaction pulse'],
    },
  ],
  submission: CONTRACT_DEFAULT?.submission ?? {
    title: 'Submission & setup',
    steps: [
      'Structured pitch templates aligned to buyer scoring models.',
      'Automated compliance guardrails and identity verification.',
      'Smart reminders across web and mobile to hit every deadline.',
      'Escrow-ready billing with currency localisation and audit logs.',
    ],
    highlight: {
      title: 'Mobile parity',
      description:
        'Gigvora for iOS and Android mirrors every workflow so operators can approve, review, and broadcast updates anywhere.',
    },
  },
  levels: CONTRACT_DEFAULT?.levels ?? {
    title: 'Levels & addons',
    levels: [
      { name: 'Launch', detail: 'Rapid-response gigs with fixed deliverables and 1–2 collaborators.' },
      { name: 'Growth', detail: 'Multi-sprint missions combining strategy, build, and enablement tracks.' },
      { name: 'Scale', detail: 'Enterprise programs with pods, governance reviews, and integrated reporting.' },
    ],
    addons: [
      'Timeline accelerators and rush delivery windows.',
      'Strategic workshops with Gigvora specialists.',
      'Analytics and reporting bundles.',
      'Async enablement assets for stakeholders.',
    ],
  },
  tasks: CONTRACT_DEFAULT?.tasks ?? {
    title: 'Tasks & deliverables',
    tasks: [
      'Milestone orchestration with auto-reminders.',
      'Dependency mapping and risk surfacing.',
      'Real-time status syncing to dashboards.',
      'Revision tracking and asset locking.',
    ],
    mediaCallouts: [
      {
        label: 'Gig banner',
        helper: 'Gradient-ready cover art sized for both desktop and mobile hero placements.',
      },
      {
        label: 'Gig media',
        helper: 'Upload decks, screen captures, and testimonials with auto-formatting safeguards.',
      },
      {
        label: 'Description & FAQ',
        helper: 'Rich text, collapsible FAQs, and localisation fields maintain clarity.',
      },
    ],
  },
  faq: CONTRACT_DEFAULT?.faq ?? {
    title: 'FAQ & governance',
    items: [
      {
        question: 'Who can manage gigs?',
        answer:
          'Verified freelancer, agency, operations, or admin roles with marketplace clearance. Workspace admins can extend invitations.',
      },
      {
        question: 'How do reviews work?',
        answer:
          'Clients submit structured scorecards covering quality, communication, and outcomes. Reviews feed your showcase and future matchmaking.',
      },
      {
        question: 'What about security?',
        answer:
          'Role-gated access, encrypted storage, and audit trails protect sensitive scopes. Mobile parity keeps controls synced everywhere.',
      },
    ],
    note:
      'Secure moderation and visibility controls ensure only approved stories appear on your Gigvora profile and gig showcase.',
  },
  reviews: CONTRACT_DEFAULT?.reviews ?? {
    title: 'Reviews & showcase',
    items: [
      'Structured scorecards capturing quality, speed, and collaboration experience.',
      'Sentiment analysis to surface coachable moments and win stories.',
      'Auto-sharing controls to populate your showcase and public profile.',
    ],
  },
};

const DEFAULT_BLUEPRINT = CONTRACT_DEFAULT ? structuredCloneFn(CONTRACT_DEFAULT) : FALLBACK_BLUEPRINT;

function mergeBlueprint(blueprint) {
  if (!blueprint) {
    return structuredCloneFn(FALLBACK_BLUEPRINT);
  }

  const hero = {
    eyebrow: blueprint.hero?.eyebrow ?? DEFAULT_BLUEPRINT.hero?.eyebrow ?? FALLBACK_BLUEPRINT.hero.eyebrow,
    title: blueprint.hero?.title ?? DEFAULT_BLUEPRINT.hero?.title ?? FALLBACK_BLUEPRINT.hero.title,
    description:
      blueprint.hero?.description ?? DEFAULT_BLUEPRINT.hero?.description ?? FALLBACK_BLUEPRINT.hero.description,
    highlights:
      Array.isArray(blueprint.hero?.highlights) && blueprint.hero.highlights.length
        ? blueprint.hero.highlights
        : DEFAULT_BLUEPRINT.hero?.highlights ?? FALLBACK_BLUEPRINT.hero.highlights,
  };

  const timelinePhases =
    Array.isArray(blueprint.timelinePhases) && blueprint.timelinePhases.length
      ? blueprint.timelinePhases
      : DEFAULT_BLUEPRINT.timelinePhases ?? FALLBACK_BLUEPRINT.timelinePhases;

  const submissionSource = blueprint.submission ?? DEFAULT_BLUEPRINT.submission ?? FALLBACK_BLUEPRINT.submission;
  const submission = {
    title: submissionSource.title ?? FALLBACK_BLUEPRINT.submission.title,
    steps:
      Array.isArray(submissionSource.steps) && submissionSource.steps.length
        ? submissionSource.steps
        : FALLBACK_BLUEPRINT.submission.steps,
    highlight: submissionSource.highlight ?? FALLBACK_BLUEPRINT.submission.highlight,
  };

  const levelsSource = blueprint.levels ?? DEFAULT_BLUEPRINT.levels ?? FALLBACK_BLUEPRINT.levels;
  const levels = {
    title: levelsSource.title ?? FALLBACK_BLUEPRINT.levels.title,
    levels:
      Array.isArray(levelsSource.levels) && levelsSource.levels.length
        ? levelsSource.levels
        : FALLBACK_BLUEPRINT.levels.levels,
    addons:
      Array.isArray(levelsSource.addons) && levelsSource.addons.length
        ? levelsSource.addons
        : FALLBACK_BLUEPRINT.levels.addons,
  };

  const tasksSource = blueprint.tasks ?? DEFAULT_BLUEPRINT.tasks ?? FALLBACK_BLUEPRINT.tasks;
  const tasks = {
    title: tasksSource.title ?? FALLBACK_BLUEPRINT.tasks.title,
    tasks:
      Array.isArray(tasksSource.tasks) && tasksSource.tasks.length
        ? tasksSource.tasks
        : FALLBACK_BLUEPRINT.tasks.tasks,
    mediaCallouts:
      Array.isArray(tasksSource.mediaCallouts) && tasksSource.mediaCallouts.length
        ? tasksSource.mediaCallouts
        : FALLBACK_BLUEPRINT.tasks.mediaCallouts,
  };

  const faqSource = blueprint.faq ?? DEFAULT_BLUEPRINT.faq ?? FALLBACK_BLUEPRINT.faq;
  const faq = {
    title: faqSource.title ?? FALLBACK_BLUEPRINT.faq.title,
    items:
      Array.isArray(faqSource.items) && faqSource.items.length
        ? faqSource.items
        : FALLBACK_BLUEPRINT.faq.items,
    note: faqSource.note ?? FALLBACK_BLUEPRINT.faq.note,
  };

  const reviewsSource = blueprint.reviews ?? DEFAULT_BLUEPRINT.reviews ?? FALLBACK_BLUEPRINT.reviews;
  const reviews = {
    title: reviewsSource.title ?? FALLBACK_BLUEPRINT.reviews.title,
    items:
      Array.isArray(reviewsSource.items) && reviewsSource.items.length
        ? reviewsSource.items
        : FALLBACK_BLUEPRINT.reviews.items,
  };

  return { hero, timelinePhases, submission, levels, tasks, faq, reviews };
}

const timelinePhasePropType = PropTypes.shape({
  title: PropTypes.string,
  description: PropTypes.string,
  metrics: PropTypes.arrayOf(PropTypes.string),
});

const blueprintPropType = PropTypes.shape({
  hero: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    highlights: PropTypes.arrayOf(PropTypes.string),
  }),
  timelinePhases: PropTypes.arrayOf(timelinePhasePropType),
  submission: PropTypes.shape({
    title: PropTypes.string,
    steps: PropTypes.arrayOf(PropTypes.string),
    highlight: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  }),
  levels: PropTypes.shape({
    title: PropTypes.string,
    levels: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        detail: PropTypes.string,
      }),
    ),
    addons: PropTypes.arrayOf(PropTypes.string),
  }),
  tasks: PropTypes.shape({
    title: PropTypes.string,
    tasks: PropTypes.arrayOf(PropTypes.string),
    mediaCallouts: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        helper: PropTypes.string,
      }),
    ),
  }),
  faq: PropTypes.shape({
    title: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        question: PropTypes.string,
        answer: PropTypes.string,
      }),
    ),
    note: PropTypes.string,
  }),
  reviews: PropTypes.shape({
    title: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.string),
  }),
});

export default function GigLifecycleShowcase({ blueprint }) {
  const resolved = useMemo(() => mergeBlueprint(blueprint), [blueprint]);

  return (
    <div className="mt-16 rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-10 shadow-soft">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="lg:w-1/3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{resolved.hero.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{resolved.hero.title}</h2>
          <p className="mt-3 text-sm text-slate-600">{resolved.hero.description}</p>
          {resolved.hero.highlights?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              {resolved.hero.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="lg:w-2/3">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Timeline</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {resolved.timelinePhases.map((phase) => (
                  <li key={phase.title} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-base font-semibold text-slate-900">{phase.title}</p>
                    {phase.description ? (
                      <p className="mt-1 text-sm text-slate-600">{phase.description}</p>
                    ) : null}
                    {Array.isArray(phase.metrics) && phase.metrics.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-indigo-600">
                        {phase.metrics.map((metric) => (
                          <span key={metric} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold">
                            {metric}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{resolved.submission.title}</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {resolved.submission.steps.map((step) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              {resolved.submission.highlight ? (
                <div className="mt-5 rounded-2xl border border-accent/40 bg-accentSoft p-4 text-sm text-accentDark">
                  <p className="font-semibold">{resolved.submission.highlight.title}</p>
                  <p className="mt-1">{resolved.submission.highlight.description}</p>
                </div>
              ) : null}
            </section>
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{resolved.levels.title}</h3>
              <div className="mt-3 space-y-3">
                {resolved.levels.levels.map((level) => (
                  <div key={level.name ?? level.detail} className="rounded-2xl border border-emerald-200/60 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-emerald-700">{level.name}</p>
                    {level.detail ? (
                      <p className="mt-1 text-sm text-emerald-600">{level.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              {resolved.levels.addons?.length ? (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">Popular addons</p>
                  <ul className="mt-2 space-y-2 text-sm text-emerald-700">
                    {resolved.levels.addons.map((addon) => (
                      <li key={addon}>• {addon}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{resolved.tasks.title}</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {resolved.tasks.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              {resolved.tasks.mediaCallouts?.length ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Media & presentation</p>
                  <dl className="mt-3 space-y-3">
                    {resolved.tasks.mediaCallouts.map((media) => (
                      <Fragment key={media.label}>
                        <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">{media.label}</dt>
                        <dd className="text-sm text-slate-600">{media.helper}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>
              ) : null}
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{resolved.faq.title}</h3>
                  <dl className="mt-4 space-y-4 text-sm text-slate-600">
                    {resolved.faq.items.map((item) => (
                      <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt className="font-semibold text-slate-900">{item.question}</dt>
                        {item.answer ? (
                          <dd className="mt-2 text-sm text-slate-600">{item.answer}</dd>
                        ) : null}
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-sm text-purple-700">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-600">{resolved.reviews.title}</h3>
                  <ul className="mt-3 space-y-3">
                    {resolved.reviews.items.map((review) => (
                      <li key={review} className="flex gap-3">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-purple-400" aria-hidden="true" />
                        <span>{review}</span>
                      </li>
                    ))}
                  </ul>
                  {resolved.faq.note ? (
                    <p className="mt-4 text-xs text-purple-600">{resolved.faq.note}</p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

GigLifecycleShowcase.propTypes = {
  blueprint: blueprintPropType,
};

GigLifecycleShowcase.defaultProps = {
  blueprint: null,
};
