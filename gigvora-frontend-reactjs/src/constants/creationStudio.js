import {
  BookmarkSquareIcon,
  BriefcaseIcon,
  DocumentArrowUpIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const creationTracks = [
  {
    id: 'cv',
    type: 'cv',
    title: 'CV generator',
    description:
      'Craft tailored resumes with persona-aware story blocks, approvals, and reusable templates.',
    icon: DocumentArrowUpIcon,
    to: '/dashboard/freelancer/documents',
  },
  {
    id: 'cover_letter',
    type: 'cover_letter',
    title: 'Cover letter composer',
    description:
      'Combine dynamic prompts with saved successes to generate targeted cover letters on demand.',
    icon: BookmarkSquareIcon,
    to: '/dashboard/freelancer/documents',
  },
  {
    id: 'gig',
    type: 'gig',
    title: 'Gig launchpad',
    description:
      'Publish outcome-oriented gig briefs with compliance scoring and instant sharing controls.',
    icon: BriefcaseIcon,
    to: '/gigs',
  },
  {
    id: 'project',
    type: 'project',
    title: 'Project workspace',
    description:
      'Spin up delivery workspaces with milestone templates, contributor onboarding, and reporting.',
    icon: RocketLaunchIcon,
    to: '/projects/new',
  },
  {
    id: 'volunteer_opportunity',
    type: 'volunteer_opportunity',
    title: 'Volunteering missions',
    description:
      'Coordinate purpose-led initiatives with guardrails for safeguarding, access, and impact metrics.',
    icon: HandRaisedIcon,
    to: '/volunteering',
  },
  {
    id: 'launchpad_job',
    type: 'launchpad_job',
    title: 'Experience Launchpad',
    description:
      'Design cohort programmes with readiness scores, mentor pairing, and automated check-ins.',
    icon: SparklesIcon,
    to: '/experience-launchpad',
  },
  {
    id: 'mentorship_offering',
    type: 'mentorship_offering',
    title: 'Mentorship offering',
    description:
      'Package mentoring tracks with availability slots, curriculum assets, and billing preferences.',
    icon: UserGroupIcon,
    to: '/dashboard/mentor',
  },
];

export const creationStudioStats = [
  {
    label: 'Templates ready to deploy',
    value: '120+',
    tone: 'border-emerald-200 bg-emerald-50',
  },
  {
    label: 'Automation coverage',
    value: '92%',
    tone: 'border-indigo-200 bg-indigo-50',
  },
  {
    label: 'Average publish time',
    value: '3m 14s',
    tone: 'border-sky-200 bg-sky-50',
  },
];

export const creationStudioPromptLibrary = {
  gig: [
    {
      id: 'gig-outcome-brief',
      title: 'Outcome-first gig brief',
      description: 'Highlight success metrics, collaboration rituals, and compliance expectations.',
      example:
        'Lead a cross-functional growth squad to secure 3 launch partnerships, managing sprint rituals and reporting metrics weekly.',
      suggestedTitle: 'Growth partnerships launch squad',
    },
    {
      id: 'gig-sprint-pod',
      title: 'Sprint pod retainer',
      description: 'Position recurring retainers with clear deliverable rhythms and guardrails.',
      example:
        'Operate a retained sprint pod delivering fortnightly campaign assets, async client reviews, and compliance-ready documentation.',
      suggestedTitle: 'Creative sprint pod retainer',
    },
  ],
  project: [
    {
      id: 'project-transformation',
      title: 'Transformation roadmap',
      description: 'Outline north star objectives, stakeholder map, and milestone cadence.',
      example:
        'Launch a 90-day transformation plan connecting discovery, stakeholder workshops, and live reporting dashboards for executives.',
      suggestedTitle: 'Transformation launch roadmap',
    },
    {
      id: 'project-campaign',
      title: 'Campaign delivery squad',
      description: 'Frame integrated deliverables, measurement loops, and collaboration expectations.',
      example:
        'Deliver a multi-channel product campaign with weekly stand-ups, agile briefs, and transparent performance scorecards.',
      suggestedTitle: 'Integrated product campaign project',
    },
  ],
  mentorship_offering: [
    {
      id: 'mentorship-accelerator',
      title: 'Mentorship accelerator',
      description: 'Blend curriculum arcs, accountability rituals, and success tracking.',
      example:
        'Host a 6-week accelerator combining office hours, async reviews, and milestone celebrations to fast-track product careers.',
      suggestedTitle: 'Product mentorship accelerator',
    },
    {
      id: 'mentorship-cohort',
      title: 'Cohort-based learning',
      description: 'Describe group dynamics, community support, and showcase outcomes.',
      example:
        'Run a cohort pairing mentees with alumni coaches, delivering showcase demos and collaborative peer critiques each sprint.',
      suggestedTitle: 'Collaborative mentorship cohort',
    },
  ],
  launchpad_job: [
    {
      id: 'launchpad-fellowship',
      title: 'Launchpad fellowship',
      description: 'Surface readiness scoring, mentor assignments, and programme milestones.',
      example:
        'Recruit 30 fellows across Europe, matching them with mentors, readiness diagnostics, and automated check-ins every Monday.',
      suggestedTitle: 'Experience launchpad fellowship',
    },
  ],
};

export const creationStudioTemplates = [
  {
    id: 'gig-go-to-market',
    type: 'gig',
    title: 'Go-to-market sprint pod',
    summary:
      'Coordinate a cross-functional squad delivering launch assets, activation campaigns, and executive reporting for a new product.',
    audience: 'community',
    highlights: ['Weekly sprint rituals', 'Executive-ready reporting', 'Compliance-reviewed assets'],
  },
  {
    id: 'project-service-design',
    type: 'project',
    title: 'Service design discovery',
    summary:
      'Map customer journeys, facilitate stakeholder co-creation workshops, and deliver a prioritised roadmap with implementation phases.',
    audience: 'connections',
    highlights: ['Hybrid workshops', 'Journey analytics', 'Implementation roadmap'],
  },
  {
    id: 'mentorship-fast-track',
    type: 'mentorship_offering',
    title: 'Mentorship fast-track',
    summary:
      'Guide mid-career professionals through curated sprints, feedback sessions, and career positioning resources.',
    audience: 'private',
    highlights: ['Career storytelling', 'Accountability rituals', 'Resource vault'],
  },
  {
    id: 'launchpad-studio',
    type: 'launchpad_job',
    title: 'Launchpad studio',
    summary:
      'Accelerate student talent with mentor-matched squads, readiness diagnostics, and partner challenges.',
    audience: 'community',
    highlights: ['Mentor pairing', 'Readiness diagnostics', 'Partner showcases'],
  },
];

const promptLookup = Object.values(creationStudioPromptLibrary).flat().reduce((accumulator, prompt) => {
  accumulator[prompt.id] = prompt;
  return accumulator;
}, {});

const templateLookup = creationStudioTemplates.reduce((accumulator, template) => {
  accumulator[template.id] = template;
  return accumulator;
}, {});

export function findCreationTrackByType(type) {
  return creationTracks.find((track) => track.type === type) ?? null;
}

export function listCreationPromptsForType(type) {
  return creationStudioPromptLibrary[type] ?? [];
}

export function findCreationPromptById(id) {
  if (!id) {
    return null;
  }
  return promptLookup[id] ?? null;
}

export function findCreationTemplateById(id) {
  if (!id) {
    return null;
  }
  return templateLookup[id] ?? null;
}
