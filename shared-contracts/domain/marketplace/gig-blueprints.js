import { freezeDeep } from '../utils/freezeDeep.js';

export const GIG_BLUEPRINT_VERSION = '2025.05';

export const DEFAULT_GIG_BLUEPRINT_ID = 'gig-lifecycle-operational-blueprint';

const blueprints = [
  {
    id: DEFAULT_GIG_BLUEPRINT_ID,
    slug: 'gig-lifecycle-operational',
    name: 'Gig lifecycle operational blueprint',
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
    timelinePhases: [
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
    ],
    submission: {
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
    levels: {
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
    tasks: {
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
    faq: {
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
    reviews: {
      title: 'Reviews & showcase',
      items: [
        'Structured scorecards capturing quality, speed, and collaboration experience.',
        'Sentiment analysis to surface coachable moments and win stories.',
        'Auto-sharing controls to populate your showcase and public profile.',
      ],
    },
  },
];

export const GIG_BLUEPRINTS = freezeDeep(blueprints);

export function listGigBlueprintsContract() {
  return GIG_BLUEPRINTS;
}

export function findGigBlueprintContract(identifier) {
  if (!identifier) {
    return GIG_BLUEPRINTS[0] ?? null;
  }
  const key = String(identifier).trim().toLowerCase();
  return (
    GIG_BLUEPRINTS.find(
      (blueprint) =>
        String(blueprint.id).toLowerCase() === key || String(blueprint.slug ?? '').toLowerCase() === key,
    ) ?? null
  );
}

export default {
  GIG_BLUEPRINT_VERSION,
  DEFAULT_GIG_BLUEPRINT_ID,
  GIG_BLUEPRINTS,
  listGigBlueprintsContract,
  findGigBlueprintContract,
};
