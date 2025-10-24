import {
  BookmarkSquareIcon,
  BriefcaseIcon,
  DocumentArrowUpIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

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
