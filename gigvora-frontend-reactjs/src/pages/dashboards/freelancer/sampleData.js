export const DEFAULT_PROFILE = {
  name: 'Amelia Rivers',
  role: 'Freelance Product Strategist',
  initials: 'AR',
  status: 'Enterprise certified',
  avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
  badges: ['Top 1% trustscore', 'Verified expert', 'Global availability'],
  metrics: [
    { label: 'Trustscore', value: '96 / 100' },
    { label: 'Avg. CSAT', value: '4.9 / 5' },
    { label: 'Active clients', value: '7' },
    { label: 'Retainer revenue', value: '$42k' },
  ],
};

export const SAMPLE_JOBS = [
  {
    id: 1,
    client: 'Lumina Health',
    title: 'Experience audit & roadmap',
    stage: 'In delivery',
    dueDate: 'Apr 18',
    value: '$12,500',
  },
  {
    id: 2,
    client: 'Atlas Robotics',
    title: 'Product vision sprint',
    stage: 'Kickoff scheduled',
    dueDate: 'Apr 22',
    value: '$8,900',
  },
  {
    id: 3,
    client: 'Northwind Bank',
    title: 'Research & JTBD interviews',
    stage: 'Awaiting feedback',
    dueDate: 'Apr 30',
    value: '$6,750',
  },
];

export const SAMPLE_GIG_ORDERS = [
  { id: 'G-3205', gig: 'Rapid concept validation', status: 'Production', submitted: 'Apr 12', value: '$3,200' },
  { id: 'G-3194', gig: 'UX due diligence', status: 'QA review', submitted: 'Apr 10', value: '$5,000' },
  { id: 'G-3177', gig: 'Go-to-market positioning pack', status: 'Delivered', submitted: 'Apr 6', value: '$2,750' },
];

export const SAMPLE_CALENDAR = [
  { id: 'c1', label: '09:30 • Atlas Robotics sync', type: 'Meeting' },
  { id: 'c2', label: '11:00 • Research playback', type: 'Workshop' },
  { id: 'c3', label: '14:30 • New lead intro (Finley Capital)', type: 'Intro call' },
];

export const SAMPLE_AUTOMATIONS = [
  {
    id: 'a1',
    name: 'Kickoff concierge',
    trigger: 'Gig purchase',
    steps: ['Send welcome email', 'Assign onboarding checklist', 'Schedule kickoff call'],
    health: 'Healthy',
  },
  {
    id: 'a2',
    name: 'Success signal nudge',
    trigger: 'Milestone reached',
    steps: ['Capture testimonial', 'Share ROI snapshot'],
    health: 'Attention needed',
  },
];

export const FEATURE_TOGGLES = [
  { id: 'advanced-automation', label: 'Automation playbooks', description: 'Enable AI-assisted success playbooks and referral journeys.' },
  { id: 'pipeline-crm', label: 'Pipeline CRM', description: 'Show relationship CRM, retainer stages, and warm outreach cues.' },
  { id: 'proposal-lab', label: 'Proposal lab', description: 'Surface interactive proposal templates and contract automation.' },
  { id: 'community-beta', label: 'Community beta', description: 'Access community feeds, mastermind pods, and peer feedback.' },
];

export const OPERATIONS_MEMBERSHIPS = ['Freelancer', 'User & Job Seeker', 'Agency'];

export const PROJECT_WORKSPACE_FEATURES = [
  {
    title: 'Workspace templates',
    description:
      'Kickstart delivery with industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
    bullets: [
      'Standard operating procedures and checklists for repeat work.',
      'Client welcome sequences and kickoff survey automation.',
    ],
  },
  {
    title: 'Task & sprint manager',
    description: 'Run sprints, Kanban boards, and timeline views with burn charts, dependencies, and backlog grooming.',
    bullets: [
      'Time tracking per task with billable vs. non-billable flags.',
      'Risk registers and change request approvals with e-signatures.',
    ],
  },
  {
    title: 'Collaboration cockpit',
    description: 'Host video rooms, creative proofing, code repositories, and AI assistants for documentation and QA.',
    bullets: [
      'Inline annotations on files, prototypes, and project demos.',
      'Client-specific permissions with comment-only or edit access.',
    ],
  },
  {
    title: 'Deliverable vault',
    description:
      'Secure storage with version history, watermarking, NDA controls, and automated delivery packages.',
    bullets: [
      'Auto-generate delivery summaries with success metrics.',
      'Long-term archiving and compliance exports.',
    ],
  },
];

export const GIG_MARKETPLACE_FEATURES = [
  {
    title: 'Gig builder',
    description: 'Design irresistible gig pages with tiered pricing, add-ons, gallery media, and conversion-tested copy.',
    bullets: [
      'Freelancer banner creator with dynamic call-to-actions.',
      'Preview modes for desktop, tablet, and mobile experiences.',
    ],
  },
  {
    title: 'Order pipeline',
    description:
      'Monitor incoming orders, qualification forms, kickoff calls, and delivery status from inquiry to completion.',
    bullets: [
      'Automated requirement forms and revision workflows.',
      'Escrow release checkpoints tied to client satisfaction.',
    ],
  },
  {
    title: 'Client success automation',
    description:
      'Trigger onboarding sequences, educational drip emails, testimonials, and referral programs automatically.',
    bullets: [
      'Smart nudges for review requests post-delivery.',
      'Affiliate and referral tracking per gig.',
    ],
  },
  {
    title: 'Catalog insights',
    description:
      'See conversion rates, top-performing gig bundles, repeat clients, and cross-sell opportunities at a glance.',
    bullets: [
      'Margin calculator factoring software costs and subcontractors.',
      'Heatmaps of search keywords driving gig impressions.',
    ],
  },
];

export const FINANCE_COMPLIANCE_FEATURES = [
  {
    title: 'Finance control tower',
    description:
      'Revenue breakdowns, tax-ready exports, expense tracking, and smart savings goals for benefits or downtime.',
    bullets: [
      'Split payouts between teammates or subcontractors instantly.',
      'Predictive forecasts for retainers vs. one-off gigs.',
    ],
  },
  {
    title: 'Contract & compliance locker',
    description:
      'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
    bullets: [
      'Automated reminders for renewals and insurance certificates.',
      'Localization for GDPR, SOC2, and freelancer classifications.',
    ],
  },
  {
    title: 'Reputation engine',
    description:
      'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
    bullets: [
      'Custom badges and banners for featured freelancer programs.',
      'Shareable review widgets for external websites.',
    ],
  },
  {
    title: 'Support & dispute desk',
    description:
      'Resolve client concerns, manage escalations, and collaborate with Gigvora support for smooth resolutions.',
    bullets: [
      'Conversation transcripts linked back to gig orders.',
      'Resolution playbooks to keep satisfaction high.',
    ],
  },
];

export const GROWTH_PARTNERSHIP_FEATURES = [
  {
    title: 'Pipeline CRM',
    description:
      'Track leads, proposals, follow-ups, and cross-selling campaigns separate from gig orders.',
    bullets: [
      'Kanban views by industry, retainer size, or probability.',
      'Proposal templates with case studies and ROI calculators.',
    ],
  },
  {
    title: 'Agency alliance manager',
    description:
      'Collaborate with agencies, share resource calendars, negotiate revenue splits, and join pods for large engagements.',
    bullets: [
      'Rate card sharing with version history and approvals.',
      'Resource heatmaps showing bandwidth across weeks.',
    ],
  },
  {
    title: 'Learning and certification hub',
    description:
      'Access curated courses, peer mentoring sessions, and skill gap diagnostics tied to your service lines.',
    bullets: [
      'Certification tracker with renewal reminders.',
      'AI recommendations for new service offerings.',
    ],
  },
  {
    title: 'Community spotlight',
    description:
      'Showcase contributions, speaking engagements, and open-source work with branded banners and social share kits.',
    bullets: [
      'Automated newsletter features for top-performing freelancers.',
      'Personalized marketing assets ready for social channels.',
    ],
  },
];

export const QUICK_ACCESS_SECTIONS = [
  {
    title: 'Project workspace dashboard',
    description: 'Unified workspace for briefs, assets, conversations, and approvals.',
    bullets: ['Whiteboards', 'Files'],
  },
  {
    title: 'Project management',
    description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
    bullets: ['Sprints', 'Dependencies', 'Risk logs', 'Billing checkpoints'],
  },
  {
    title: 'Client portals',
    description: 'Shared timelines, scope controls, and decision logs with your clients.',
  },
];

export const QUICK_ACCESS_COMMERCE = [
  {
    title: 'Gig manager',
    description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
  },
  {
    title: 'Gig catalog',
    description: 'Post a gig',
    bullets: ['Launch new services with pricing matrices, availability calendars, and banners.'],
  },
  {
    title: 'Purchased gigs',
    description: 'Track incoming orders, requirements, revisions, and payouts.',
  },
];

export const QUICK_ACCESS_GROWTH = [
  {
    title: 'Freelancer profile',
    description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
  },
  {
    title: 'Agency collaborations',
    description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
  },
  {
    title: 'Finance & insights',
    description: 'Revenue analytics, payout history, taxes, and profitability dashboards.',
  },
];
