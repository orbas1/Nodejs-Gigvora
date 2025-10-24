import {
  BookmarkSquareIcon,
  BriefcaseIcon,
  DocumentArrowUpIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { deepFreeze } from './menuSchema.js';

export const CREATION_STUDIO_STATUSES = deepFreeze([
  { id: 'draft', label: 'Draft', badge: 'bg-slate-100 text-slate-700' },
  { id: 'in_review', label: 'In review', badge: 'bg-amber-100 text-amber-700' },
  { id: 'scheduled', label: 'Scheduled', badge: 'bg-sky-100 text-sky-700' },
  { id: 'published', label: 'Published', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'archived', label: 'Archived', badge: 'bg-slate-200 text-slate-600' },
]);

export const CREATION_STUDIO_TYPES = deepFreeze([
  {
    id: 'job',
    label: 'Job post',
    shortLabel: 'Job',
    groupId: 'opportunities',
    description: 'Publish employment opportunities with salary, benefits, and review workflows.',
    href: '/jobs',
  },
  {
    id: 'gig',
    label: 'Gig brief',
    shortLabel: 'Gig',
    groupId: 'opportunities',
    description: 'Package fixed-scope engagements with tiered service levels and fulfilment playbooks.',
    href: '/gigs',
  },
  {
    id: 'project',
    label: 'Project workspace',
    shortLabel: 'Project',
    groupId: 'opportunities',
    description: 'Coordinate milestones, contributors, and reporting inside a structured delivery workspace.',
    href: '/projects/new',
  },
  {
    id: 'launchpad_job',
    label: 'Launchpad job',
    shortLabel: 'Launchpad job',
    groupId: 'opportunities',
    description: 'Invite Launchpad fellows into experiential roles with readiness scoring and automation.',
    href: '/experience-launchpad/jobs',
  },
  {
    id: 'launchpad_project',
    label: 'Launchpad project',
    shortLabel: 'Launchpad project',
    groupId: 'opportunities',
    description: 'Spin up Launchpad cohorts with milestone templates, analytics, and collaboration tooling.',
    href: '/experience-launchpad/projects',
  },
  {
    id: 'volunteer_opportunity',
    label: 'Volunteering mission',
    shortLabel: 'Volunteering',
    groupId: 'opportunities',
    description: 'Coordinate purpose-led initiatives with safeguarding, rota planning, and compliance.',
    href: '/volunteering',
  },
  {
    id: 'mentorship_offering',
    label: 'Mentorship offering',
    shortLabel: 'Mentorship',
    groupId: 'programmes',
    description: 'Package mentoring tracks with billing preferences, curriculum assets, and analytics.',
    href: '/dashboard/mentor',
  },
  {
    id: 'networking_session',
    label: 'Networking session',
    shortLabel: 'Networking',
    groupId: 'programmes',
    description: 'Plan community events with capacity management, reminders, and attendee workflows.',
    href: '/dashboard/company/networking',
  },
  {
    id: 'event',
    label: 'Event experience',
    shortLabel: 'Event',
    groupId: 'community',
    description: 'Host flagship events with ticketing, waitlists, and automation-ready agendas.',
    href: '/events',
  },
  {
    id: 'group',
    label: 'Community group',
    shortLabel: 'Group',
    groupId: 'community',
    description: 'Launch member spaces with moderation settings, access controls, and engagement rituals.',
    href: '/groups',
  },
  {
    id: 'page',
    label: 'Landing page',
    shortLabel: 'Page',
    groupId: 'community',
    description: 'Publish branded landing pages with hero messaging, CTAs, and SEO metadata.',
    href: '/pages',
  },
  {
    id: 'blog_post',
    label: 'Blog update',
    shortLabel: 'Blog',
    groupId: 'content',
    description: 'Share editorial updates with scheduling, localisation, and distribution controls.',
    href: '/blog',
  },
  {
    id: 'ad',
    label: 'Ad campaign',
    shortLabel: 'Ad',
    groupId: 'content',
    description: 'Launch multi-channel ad buys with budget governance and creative asset management.',
    href: '/dashboard/agency/ads',
  },
  {
    id: 'cv',
    label: 'CV document',
    shortLabel: 'CV',
    groupId: 'documents',
    description: 'Craft persona-aware CVs with reusable story blocks and approval workflows.',
    href: '/dashboard/freelancer/documents',
  },
  {
    id: 'cover_letter',
    label: 'Cover letter',
    shortLabel: 'Cover letter',
    groupId: 'documents',
    description: 'Generate tailored cover letters with guided prompts and collaboration controls.',
    href: '/dashboard/freelancer/documents',
  },
]);

export const CREATION_STUDIO_GROUPS = deepFreeze([
  {
    id: 'opportunities',
    label: 'Opportunities & briefs',
    description: 'Jobs, gigs, projects, volunteering missions, and Launchpad builds.',
    defaultType: 'job',
    types: ['job', 'gig', 'project', 'launchpad_job', 'launchpad_project', 'volunteer_opportunity'],
  },
  {
    id: 'programmes',
    label: 'Programmes & sessions',
    description: 'Mentorship packages and networking events with scheduling support.',
    defaultType: 'mentorship_offering',
    types: ['mentorship_offering', 'networking_session'],
  },
  {
    id: 'community',
    label: 'Community hubs',
    description: 'Spaces, events, and pages that nurture ongoing member engagement.',
    defaultType: 'group',
    types: ['group', 'page', 'event'],
  },
  {
    id: 'content',
    label: 'Content & campaigns',
    description: 'Editorial updates and paid campaigns amplified across Gigvora.',
    defaultType: 'blog_post',
    types: ['blog_post', 'ad'],
  },
  {
    id: 'documents',
    label: 'Documents & assets',
    description: 'Personalised documents that feed portfolios and applications.',
    defaultType: 'cv',
    types: ['cv', 'cover_letter'],
  },
]);

const CREATION_STUDIO_TYPE_LOOKUP = Object.freeze(
  Object.fromEntries(CREATION_STUDIO_TYPES.map((type) => [type.id, type])),
);

const CREATION_STUDIO_STATUS_LOOKUP = Object.freeze(
  Object.fromEntries(CREATION_STUDIO_STATUSES.map((status) => [status.id, status])),
);

export function getCreationType(typeId) {
  if (!typeId) {
    return null;
  }
  return CREATION_STUDIO_TYPE_LOOKUP[typeId] ?? null;
}

export function getCreationStatus(statusId) {
  if (!statusId) {
    return null;
  }
  return CREATION_STUDIO_STATUS_LOOKUP[statusId] ?? null;
}

export const CREATION_STUDIO_TRACKS = [
  {
    id: 'cv',
    type: 'cv',
    title: 'CV generator',
    description:
      'Craft tailored resumes with persona-aware story blocks, approvals, and reusable templates.',
    icon: DocumentArrowUpIcon,
    to: '/dashboard/freelancer/documents',
    recommendedFor: ['freelancer', 'student'],
    prompts: [
      {
        id: 'cv-impact',
        title: 'Highlight measurable impact',
        prompt:
          'Draft a results-focused CV section that quantifies impact on revenue, retention, and delivery speed. Prioritise action verbs and include proof points from recent engagements.',
      },
      {
        id: 'cv-story',
        title: 'Tell a transformation story',
        prompt:
          'Summarise a before-and-after project transformation that shows strategic thinking, stakeholder influence, and continuous optimisation habits.',
      },
    ],
    templates: [
      {
        id: 'cv-portfolio',
        title: 'Portfolio-first resume',
        summary:
          'Lead with signature projects, then reinforce expertise with skill clusters, testimonials, and certification badges.',
      },
      {
        id: 'cv-consulting',
        title: 'Consulting sprint CV',
        summary:
          'Structure achievements around discovery, strategy, execution, and optimisation with metrics for each stage.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Mentor reviewer',
        benefit: 'Sense-check positioning, storytelling, and tone before publishing to the marketplace.',
      },
      {
        role: 'Peer proofreader',
        benefit: 'Spot jargon, improve clarity, and ensure inclusive language across the document.',
      },
    ],
    analytics: [
      {
        id: 'cv-feed',
        label: 'Feed conversions',
        metric: '+24%',
        description: 'Increase in profile views when CV updates are shared to the activity feed.',
      },
      {
        id: 'cv-marketplace',
        label: 'Marketplace saves',
        metric: '38',
        description: 'Average number of hiring managers saving refreshed CVs each week.',
      },
      {
        id: 'cv-time',
        label: 'Time-to-publish',
        metric: '2m 41s',
        description: 'Median time from draft to publish using quick launch templates.',
      },
    ],
  },
  {
    id: 'cover_letter',
    type: 'cover_letter',
    title: 'Cover letter composer',
    description:
      'Combine dynamic prompts with saved successes to generate targeted cover letters on demand.',
    icon: BookmarkSquareIcon,
    to: '/dashboard/freelancer/documents',
    recommendedFor: ['freelancer', 'job_seeker'],
    prompts: [
      {
        id: 'cover-narrative',
        title: 'Narrate the challenge',
        prompt:
          'Explain the employer challenge you are excited to solve, referencing relevant metrics, stakeholders, and your proven playbook.',
      },
      {
        id: 'cover-synergy',
        title: 'Connect community wins',
        prompt:
          'Reference a community contribution or mentoring activity that proves your long-term commitment to the craft.',
      },
    ],
    templates: [
      {
        id: 'cover-product',
        title: 'Product storyteller',
        summary:
          'Frame the opportunity as a product improvement narrative with user insights, experiments, and measurable outcomes.',
      },
      {
        id: 'cover-service',
        title: 'Service design pitch',
        summary:
          'Describe how you orchestrate end-to-end service experiences, highlighting collaboration rituals and tooling.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Hiring partner',
        benefit: 'Align on success criteria and required outcomes before final submission.',
      },
      {
        role: 'Community mentor',
        benefit: 'Review tone, confidence, and differentiation against similar applicants.',
      },
    ],
    analytics: [
      {
        id: 'cover-feed',
        label: 'Feed responses',
        metric: '72%',
        description: 'Applicants sending tailored cover letters receive responses within 48 hours.',
      },
      {
        id: 'cover-invite',
        label: 'Interview invites',
        metric: '3.1×',
        description: 'Lift in interview requests when paired with recent gig delivery evidence.',
      },
      {
        id: 'cover-shares',
        label: 'Team shares',
        metric: '18',
        description: 'Average internal shares per cover letter across hiring squads.',
      },
    ],
  },
  {
    id: 'gig',
    type: 'gig',
    title: 'Gig launchpad',
    description:
      'Publish outcome-oriented gig briefs with compliance scoring and instant sharing controls.',
    icon: BriefcaseIcon,
    to: '/gigs',
    recommendedFor: ['company', 'agency'],
    prompts: [
      {
        id: 'gig-outcome',
        title: 'Define the measurable win',
        prompt:
          'Summarise the target outcome, the audience impacted, the key metrics for success, and any compliance guardrails.',
      },
      {
        id: 'gig-milestones',
        title: 'Outline milestone cadence',
        prompt:
          'List milestone checkpoints, owners, rituals, and artefacts that will signal healthy delivery.',
      },
    ],
    templates: [
      {
        id: 'gig-product',
        title: 'Product growth mission',
        summary:
          'Drive activation across onboarding, experimentation, and lifecycle messaging with built-in KPI checkpoints.',
      },
      {
        id: 'gig-ops',
        title: 'Operations uplift',
        summary:
          'Stabilise service operations with swimlanes for triage, automation, and voice-of-customer loops.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Project sponsor',
        benefit: 'Secures stakeholder sign-off and unlocks tooling access for contributors.',
      },
      {
        role: 'Delivery lead',
        benefit: 'Co-owns milestone planning and ensures contributor onboarding readiness.',
      },
    ],
    analytics: [
      {
        id: 'gig-feed',
        label: 'Feed reach',
        metric: '4.6k',
        description: 'Average members reached when a gig is highlighted in the community feed.',
      },
      {
        id: 'gig-matches',
        label: 'Qualified matches',
        metric: '42',
        description: 'Pre-vetted matches sourced from auto-match when briefs use quick launch templates.',
      },
      {
        id: 'gig-fill',
        label: 'Fill time',
        metric: '5 days',
        description: 'Median time to fill after publishing with recommended collaborator invites.',
      },
    ],
  },
  {
    id: 'project',
    type: 'project',
    title: 'Project workspace',
    description:
      'Spin up delivery workspaces with milestone templates, contributor onboarding, and reporting.',
    icon: RocketLaunchIcon,
    to: '/projects/new',
    recommendedFor: ['agency', 'company', 'freelancer'],
    prompts: [
      {
        id: 'project-scope',
        title: 'Define delivery scope',
        prompt:
          'Break down objectives, contributors, and timeline phases with clarity on hand-offs and review rituals.',
      },
      {
        id: 'project-risk',
        title: 'Capture risk mitigations',
        prompt:
          'List critical risks, mitigation owners, and check-ins required to keep the project on track.',
      },
    ],
    templates: [
      {
        id: 'project-sprint',
        title: 'Sprint-based delivery',
        summary:
          'Plan two-week sprints with backlog, rituals, demo cadence, and measurement snapshots.',
      },
      {
        id: 'project-lab',
        title: 'Innovation lab',
        summary:
          'Frame the workspace for experimentation with hypothesis tracking and experiment scoring.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Operations partner',
        benefit: 'Keeps rituals aligned with internal governance and compliance workflows.',
      },
      {
        role: 'Analytics ally',
        benefit: 'Connects dashboards to live telemetry for milestone review meetings.',
      },
    ],
    analytics: [
      {
        id: 'project-velocity',
        label: 'Velocity health',
        metric: '92%',
        description: 'On-time milestone completion when templates and rituals are pre-loaded.',
      },
      {
        id: 'project-engagement',
        label: 'Contributor engagement',
        metric: '87%',
        description: 'Contributors posting weekly updates through the studio workspace.',
      },
      {
        id: 'project-retention',
        label: 'Client retention',
        metric: '96%',
        description: 'Clients renewing after projects with collaborative workspace invites.',
      },
    ],
  },
  {
    id: 'volunteer_opportunity',
    type: 'volunteer_opportunity',
    title: 'Volunteering missions',
    description:
      'Coordinate purpose-led initiatives with guardrails for safeguarding, access, and impact metrics.',
    icon: HandRaisedIcon,
    to: '/volunteering',
    recommendedFor: ['volunteer', 'nonprofit', 'community_lead'],
    prompts: [
      {
        id: 'volunteer-impact',
        title: 'Describe community impact',
        prompt:
          'Explain who benefits, what support is required, and how success will be measured after the mission.',
      },
      {
        id: 'volunteer-safeguarding',
        title: 'List safeguarding steps',
        prompt:
          'Outline background checks, training, and escalation contacts available to volunteers.',
      },
    ],
    templates: [
      {
        id: 'volunteer-hackathon',
        title: 'Impact hackathon',
        summary:
          'Bring cross-functional teams together for a weekend sprint with pre-defined deliverables and impact KPIs.',
      },
      {
        id: 'volunteer-mentoring',
        title: 'Mentoring drive',
        summary:
          'Pair mentors with participants, including onboarding scripts and session feedback loops.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Safeguarding lead',
        benefit: 'Ensures all compliance, access, and wellbeing protocols are visible to volunteers.',
      },
      {
        role: 'Impact analyst',
        benefit: 'Captures outcome metrics and publishes celebration stories to the feed.',
      },
    ],
    analytics: [
      {
        id: 'volunteer-signups',
        label: 'Volunteer sign-ups',
        metric: '312',
        description: 'Average monthly sign-ups when missions include template resource packs.',
      },
      {
        id: 'volunteer-retention',
        label: 'Retention',
        metric: '81%',
        description: 'Volunteers who return for a second mission after receiving collaborative invites.',
      },
      {
        id: 'volunteer-feed',
        label: 'Feed amplification',
        metric: '2.4×',
        description: 'Boost in feed engagement when stories are shared from mission dashboards.',
      },
    ],
  },
  {
    id: 'event',
    type: 'event',
    title: 'Event experience builder',
    description:
      'Design ticketed experiences with automation-ready agendas, sponsor playbooks, and attendee analytics.',
    icon: SparklesIcon,
    to: '/events',
    recommendedFor: ['company', 'agency'],
    prompts: [
      {
        id: 'event-agenda',
        title: 'Design the agenda',
        prompt:
          'Outline keynote slots, breakout tracks, and networking rituals that reinforce the event narrative.',
      },
      {
        id: 'event-sponsors',
        title: 'Highlight partners',
        prompt:
          'List sponsor activations, deliverables, and success metrics to align internal and external teams.',
      },
    ],
    templates: [
      {
        id: 'event-summit',
        title: 'Product summit',
        summary:
          'Full-day summit template with main-stage programming, workshop rotations, and VIP briefings.',
      },
      {
        id: 'event-community',
        title: 'Community lab day',
        summary:
          'Hands-on community showcase featuring maker pods, lightning talks, and collaboration corners.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Production lead',
        benefit: 'Oversees venue logistics, supplier coordination, and real-time run of show updates.',
      },
      {
        role: 'Community host',
        benefit: 'Amplifies attendee energy, manages waitlists, and surfaces wins across social channels.',
      },
    ],
    analytics: [
      {
        id: 'event-capacity',
        label: 'Capacity filled',
        metric: '94%',
        description: 'Average seat utilisation when automation handles waitlists and reminders.',
      },
      {
        id: 'event-sponsors',
        label: 'Sponsor renewals',
        metric: '3.4×',
        description: 'Increase in sponsor retention with structured deliverable tracking inside the studio.',
      },
      {
        id: 'event-feedback',
        label: 'Attendee rating',
        metric: '4.8/5',
        description: 'Post-event satisfaction when agendas and resources are shared through the workspace.',
      },
    ],
  },
  {
    id: 'launchpad_job',
    type: 'launchpad_job',
    title: 'Experience Launchpad',
    description:
      'Design cohort programmes with readiness scores, mentor pairing, and automated check-ins.',
    icon: SparklesIcon,
    to: '/experience-launchpad',
    recommendedFor: ['company', 'educator', 'community_lead'],
    prompts: [
      {
        id: 'launchpad-journey',
        title: 'Map the cohort journey',
        prompt:
          'Outline stages, mastery checkpoints, and celebratory rituals for participants completing the programme.',
      },
      {
        id: 'launchpad-support',
        title: 'Define support signals',
        prompt:
          'Explain how mentors, coaches, and peers will deliver feedback and unlock support resources.',
      },
    ],
    templates: [
      {
        id: 'launchpad-studio',
        title: 'Studio accelerator',
        summary:
          'Weekly sprints covering discovery, prototyping, and go-to-market, backed by analytics milestones.',
      },
      {
        id: 'launchpad-peer',
        title: 'Peer learning pod',
        summary:
          'Collaborative pods with shared rituals, reflection prompts, and showcase events.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Mentor lead',
        benefit: 'Pairs participants with mentors and monitors readiness analytics.',
      },
      {
        role: 'Community coordinator',
        benefit: 'Keeps cohorts aligned, schedules events, and celebrates wins on the feed.',
      },
    ],
    analytics: [
      {
        id: 'launchpad-readiness',
        label: 'Readiness uplift',
        metric: '+31%',
        description: 'Improvement in job readiness scores after structured cohort launches.',
      },
      {
        id: 'launchpad-placement',
        label: 'Placement rate',
        metric: '64%',
        description: 'Participants securing roles after completing guided launchpad programmes.',
      },
      {
        id: 'launchpad-mentor',
        label: 'Mentor engagement',
        metric: '89%',
        description: 'Mentors submitting weekly feedback through the collaboration workspace.',
      },
    ],
  },
  {
    id: 'mentorship_offering',
    type: 'mentorship_offering',
    title: 'Mentorship offering',
    description:
      'Package mentoring tracks with availability slots, curriculum assets, and billing preferences.',
    icon: UserGroupIcon,
    to: '/dashboard/mentor',
    recommendedFor: ['mentor', 'community_lead'],
    prompts: [
      {
        id: 'mentor-outcomes',
        title: 'Define growth outcomes',
        prompt:
          'Clarify the transformation mentees can expect, including skills, portfolio artefacts, and confidence boosts.',
      },
      {
        id: 'mentor-proof',
        title: 'Share proof of impact',
        prompt:
          'Reference testimonials, success stories, or metrics that show how previous mentees advanced.',
      },
    ],
    templates: [
      {
        id: 'mentor-sprint',
        title: 'Sprint mentorship',
        summary:
          'Four-week intensive sprint with weekly challenges, office hours, and accountability partners.',
      },
      {
        id: 'mentor-retainer',
        title: 'Retainer-style mentorship',
        summary:
          'Ongoing mentorship with monthly themes, resource drops, and success checkpoints.',
      },
    ],
    collaborationRoles: [
      {
        role: 'Programme coordinator',
        benefit: 'Handles scheduling, billing preferences, and communication templates.',
      },
      {
        role: 'Success champion',
        benefit: 'Collects testimonials and amplifies mentee wins across Gigvora surfaces.',
      },
    ],
    analytics: [
      {
        id: 'mentor-retention',
        label: 'Renewal rate',
        metric: '78%',
        description: 'Mentees booking extended packages when offerings include structured templates.',
      },
      {
        id: 'mentor-nps',
        label: 'Experience score',
        metric: '9.2',
        description: 'Average mentee satisfaction across guided mentorship programmes.',
      },
      {
        id: 'mentor-referrals',
        label: 'Referral lift',
        metric: '2.7×',
        description: 'Increase in referral sign-ups when collaboration invites go out during onboarding.',
      },
    ],
  },
];

export const CREATION_STUDIO_STATS = [
  {
    id: 'launched',
    label: 'Opportunities launched this week',
    tone: 'border-emerald-200 bg-emerald-50',
  },
  {
    id: 'active',
    label: 'Active creation pipelines',
    tone: 'border-indigo-200 bg-indigo-50',
  },
  {
    id: 'collaborators',
    label: 'Collaborators invited',
    tone: 'border-sky-200 bg-sky-50',
  },
];

export function resolveCreationTrack(value) {
  if (!value) {
    return null;
  }
  return CREATION_STUDIO_TRACKS.find((track) => track.id === value || track.type === value) ?? null;
}

export function normaliseMembership(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  return null;
}

export function extractRecommendedTrack(memberships = []) {
  const normalised = memberships.map(normaliseMembership).filter(Boolean);
  if (!normalised.length) {
    return CREATION_STUDIO_TRACKS[0];
  }
  return (
    CREATION_STUDIO_TRACKS.find((track) =>
      track.recommendedFor?.some((membership) => normalised.includes(membership.toLowerCase())),
    ) ?? CREATION_STUDIO_TRACKS[0]
  );
}

export function formatRecommendedAudience(recommendedFor = []) {
  if (!recommendedFor.length) {
    return 'Designed for every member';
  }
  const labels = recommendedFor.map((entry) => {
    const cleaned = entry.replace(/[_-]+/g, ' ').trim();
    if (!cleaned) {
      return null;
    }
    return cleaned
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  });
  const filtered = labels.filter(Boolean);
  if (!filtered.length) {
    return 'Designed for every member';
  }
  if (filtered.length === 1) {
    return `Best for ${filtered[0]}`;
  }
  if (filtered.length === 2) {
    return `Best for ${filtered.join(' & ')}`;
  }
  const last = filtered.pop();
  return `Best for ${filtered.join(', ')}, & ${last}`;
}

export default CREATION_STUDIO_TRACKS;
