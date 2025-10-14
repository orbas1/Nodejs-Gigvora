import { Fragment } from 'react';

const TIMELINE_PHASES = [
  {
    title: 'Discovery & alignment',
    description:
      'Intake briefs, confirm budget envelopes, and sync buyer expectations before the first pitch is accepted.',
    metrics: ['SLA: 24h response', 'Compliance sign-off ready', 'Kickoff assets mapped'],
  },
  {
    title: 'Pitching & selection',
    description:
      'Freelancers submit structured responses, automate credential checks, and confirm delivery capacity.',
    metrics: ['Shortlist scoring', 'Live Q&A threads', 'Instant status updates'],
  },
  {
    title: 'Delivery & QA',
    description:
      'Timeline orchestration, milestone tracking, and revision governance keep engagements moving smoothly.',
    metrics: ['Milestones locked', 'Revision windows defined', 'Escalation map activated'],
  },
  {
    title: 'Review & showcase',
    description:
      'Capture outcomes, publish portfolio updates, and syndicate learnings across the Gigvora network.',
    metrics: ['Review automation', 'Portfolio-ready assets', 'Client satisfaction pulse'],
  },
];

const SUBMISSION_STEPS = [
  'Structured pitch templates aligned to buyer scoring models.',
  'Automated compliance guardrails and identity verification.',
  'Smart reminders across web and mobile to hit every deadline.',
  'Escrow-ready billing with currency localisation and audit logs.',
];

const FAQ = [
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
];

const LEVELS = [
  { name: 'Launch', detail: 'Rapid-response gigs with fixed deliverables and 1–2 collaborators.' },
  { name: 'Growth', detail: 'Multi-sprint missions combining strategy, build, and enablement tracks.' },
  { name: 'Scale', detail: 'Enterprise programs with pods, governance reviews, and integrated reporting.' },
];

const ADDONS = [
  'Timeline accelerators and rush delivery windows.',
  'Strategic workshops with Gigvora specialists.',
  'Analytics and reporting bundles.',
  'Async enablement assets for stakeholders.',
];

const TASKS = [
  'Milestone orchestration with auto-reminders.',
  'Dependency mapping and risk surfacing.',
  'Real-time status syncing to dashboards.',
  'Revision tracking and asset locking.',
];

const MEDIA_CALLOUTS = [
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
];

const REVIEWS = [
  'Structured scorecards capturing quality, speed, and collaboration experience.',
  'Sentiment analysis to surface coachable moments and win stories.',
  'Auto-sharing controls to populate your showcase and public profile.',
];

export default function GigLifecycleShowcase() {
  return (
    <div className="mt-16 rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-10 shadow-soft">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="lg:w-1/3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Gig operations</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Operational blueprint</h2>
          <p className="mt-3 text-sm text-slate-600">
            Every gig you run syncs timeline, assets, compliance, and storytelling across web and mobile. Use this blueprint to
            align crews before launch and keep every stakeholder informed.
          </p>
        </div>
        <div className="lg:w-2/3">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Timeline</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {TIMELINE_PHASES.map((phase) => (
                  <li key={phase.title} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-base font-semibold text-slate-900">{phase.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{phase.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-indigo-600">
                      {phase.metrics.map((metric) => (
                        <span key={metric} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Submission & setup</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {SUBMISSION_STEPS.map((step) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl border border-accent/40 bg-accentSoft p-4 text-sm text-accentDark">
                <p className="font-semibold">Mobile parity</p>
                <p className="mt-1">
                  Gigvora for iOS and Android mirrors every workflow so operators can approve, review, and broadcast updates anywhere.
                </p>
              </div>
            </section>
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Levels & addons</h3>
              <div className="mt-3 space-y-3">
                {LEVELS.map((level) => (
                  <div key={level.name} className="rounded-2xl border border-emerald-200/60 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-emerald-700">{level.name}</p>
                    <p className="mt-1 text-sm text-emerald-600">{level.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">Popular addons</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-700">
                {ADDONS.map((addon) => (
                  <li key={addon}>• {addon}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks & deliverables</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {TASKS.map((task) => (
                  <li key={task} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Media & presentation</p>
                <dl className="mt-3 space-y-3">
                  {MEDIA_CALLOUTS.map((media) => (
                    <Fragment key={media.label}>
                      <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">{media.label}</dt>
                      <dd className="text-sm text-slate-600">{media.helper}</dd>
                    </Fragment>
                  ))}
                </dl>
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">FAQ & governance</h3>
                  <dl className="mt-4 space-y-4 text-sm text-slate-600">
                    {FAQ.map((item) => (
                      <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt className="font-semibold text-slate-900">{item.question}</dt>
                        <dd className="mt-2 text-sm text-slate-600">{item.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-sm text-purple-700">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-600">Reviews & showcase</h3>
                  <ul className="mt-3 space-y-3">
                    {REVIEWS.map((review) => (
                      <li key={review} className="flex gap-3">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-purple-400" aria-hidden="true" />
                        <span>{review}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-purple-600">
                    Secure moderation and visibility controls ensure only approved stories appear on your Gigvora profile and gig showcase.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
