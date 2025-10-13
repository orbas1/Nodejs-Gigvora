import { useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarSquareIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeModernIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  PhotoIcon,
  RectangleStackIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const DEFAULT_PROFILE = {
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

const SAMPLE_JOBS = [
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

const SAMPLE_GIG_ORDERS = [
  { id: 'G-3205', gig: 'Rapid concept validation', status: 'Production', submitted: 'Apr 12', value: '$3,200' },
  { id: 'G-3194', gig: 'UX due diligence', status: 'QA review', submitted: 'Apr 10', value: '$5,000' },
  { id: 'G-3177', gig: 'Go-to-market positioning pack', status: 'Delivered', submitted: 'Apr 6', value: '$2,750' },
];

const SAMPLE_CALENDAR = [
  { id: 'c1', label: '09:30 • Atlas Robotics sync', type: 'Meeting' },
  { id: 'c2', label: '11:00 • Research playback', type: 'Workshop' },
  { id: 'c3', label: '14:30 • New lead intro (Finley Capital)', type: 'Intro call' },
];

const SAMPLE_AUTOMATIONS = [
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

const FEATURE_TOGGLES = [
  { id: 'advanced-automation', label: 'Automation playbooks', description: 'Enable AI-assisted success playbooks and referral journeys.' },
  { id: 'pipeline-crm', label: 'Pipeline CRM', description: 'Show relationship CRM, retainer stages, and warm outreach cues.' },
  { id: 'proposal-lab', label: 'Proposal lab', description: 'Surface interactive proposal templates and contract automation.' },
  { id: 'community-beta', label: 'Community beta', description: 'Access community feeds, mastermind pods, and peer feedback.' },
];

const OPERATIONS_MEMBERSHIPS = ['Freelancer', 'User & Job Seeker', 'Agency'];

const PROJECT_WORKSPACE_FEATURES = [
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

const GIG_MARKETPLACE_FEATURES = [
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

const FINANCE_COMPLIANCE_FEATURES = [
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

const GROWTH_PARTNERSHIP_FEATURES = [
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

const QUICK_ACCESS_SECTIONS = [
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

const QUICK_ACCESS_COMMERCE = [
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

const QUICK_ACCESS_GROWTH = [
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

const MENU_GROUPS = [
  {
    id: 'mission-control',
    label: 'Mission control',
    items: [
      {
        id: 'profile-overview',
        name: 'Profile overview',
        description: 'Trust signals, live workstreams, and daily context.',
        icon: UserCircleIcon,
      },
      {
        id: 'operations-hq',
        name: 'Freelancer Operations HQ',
        description: 'Memberships, positioning, and enterprise-ready context.',
        icon: HomeModernIcon,
      },
      {
        id: 'delivery-ops',
        name: 'Delivery operations',
        description: 'Jobs, gig orders, and delivery cadences.',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'planning',
        name: 'Calendar & planning',
        description: 'Capacity forecast, rituals, and important dates.',
        icon: CalendarDaysIcon,
      },
    ],
  },
  {
    id: 'workspace-excellence',
    label: 'Workspace excellence',
    items: [
      {
        id: 'project-excellence',
        name: 'Project workspace excellence',
        description: 'Templates, collaboration cockpit, and deliverable vault.',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'project-lab',
        name: 'Project lab',
        description: 'Compose enterprise-grade project workflows.',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: 'gig-commerce',
    label: 'Gig commerce',
    items: [
      {
        id: 'gig-studio',
        name: 'Gig building studio',
        description: 'Design modular offers and pricing experiments.',
        icon: SparklesIcon,
      },
      {
        id: 'gig-marketplace',
        name: 'Gig marketplace operations',
        description: 'Listings, order pipeline, and client success automation.',
        icon: MegaphoneIcon,
      },
      {
        id: 'automation',
        name: 'Automation & signals',
        description: 'Playbooks, referrals, and health telemetry.',
        icon: BoltIcon,
      },
    ],
  },
  {
    id: 'finance-governance',
    label: 'Finance & governance',
    items: [
      {
        id: 'finance-compliance',
        name: 'Finance, compliance, & reputation',
        description: 'Cash flow, contracts, and reputation programs.',
        icon: BanknotesIcon,
      },
      {
        id: 'workspace-settings',
        name: 'Workspace settings',
        description: 'Personalization, feature toggles, and safety.',
        icon: Cog6ToothIcon,
      },
    ],
  },
  {
    id: 'brand-growth',
    label: 'Brand & growth',
    items: [
      {
        id: 'profile-showcase',
        name: 'Profile showcase',
        description: 'Banner, biography, portfolio, and media.',
        icon: PhotoIcon,
      },
      {
        id: 'references',
        name: 'References & reviews',
        description: 'Manage testimonials, references, and feed posts.',
        icon: ChatBubbleBottomCenterTextIcon,
      },
      {
        id: 'network',
        name: 'Suggested follows',
        description: 'Signal-boosted peers and collaboration pods.',
        icon: UserGroupIcon,
      },
      {
        id: 'growth-partnerships',
        name: 'Growth, partnerships, & skills',
        description: 'Pipeline CRM, alliances, learning, and spotlight.',
        icon: ArrowTrendingUpIcon,
      },
    ],
  },
  {
    id: 'operations-quick',
    label: 'Operational quick access',
    items: [
      {
        id: 'quick-access',
        name: 'Operational quick access',
        description: 'Workspace dashboards, gig commerce, and growth shortcuts.',
        icon: RectangleStackIcon,
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        id: 'support',
        name: 'Support desk',
        description: 'Fast help from Gigvora success engineers.',
        icon: LifebuoyIcon,
      },
    ],
  },
];

function SectionShell({ id, title, description, children, actions }) {
  return (
    <section id={id} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function OperationsHQSection() {
  return (
    <SectionShell
      id="operations-hq"
      title="Freelancer Operations HQ"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      actions={[
        <span
          key="memberships"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600"
        >
          Your memberships
        </span>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Freelancer Operations HQ</h3>
          <p className="mt-3 text-sm text-slate-600">
            An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in
            one streamlined workspace.
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Your memberships:</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {OPERATIONS_MEMBERSHIPS.map((membership) => (
              <div key={membership} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
                <p className="text-sm font-semibold text-blue-700">{membership}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <HomeModernIcon className="h-6 w-6 text-blue-500" />
            <p className="text-sm font-semibold text-slate-900">Reelancer Operations HQ</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Keep memberships, strategic workstreams, and monetization programs aligned from a single cockpit built for
            freelancers who lead engagements end-to-end.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

function ProjectWorkspaceExcellenceSection() {
  return (
    <SectionShell
      id="project-excellence"
      title="Project workspace excellence"
      description="Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {PROJECT_WORKSPACE_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            {feature.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function GigMarketplaceOperationsSection() {
  return (
    <SectionShell
      id="gig-marketplace"
      title="Gig marketplace operations"
      description="Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {GIG_MARKETPLACE_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <MegaphoneIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            {feature.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function FinanceComplianceSection() {
  return (
    <SectionShell
      id="finance-compliance"
      title="Finance, compliance, & reputation"
      description="Get paid fast while staying compliant. Monitor cash flow, taxes, contracts, and reputation programs across clients."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {FINANCE_COMPLIANCE_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <BanknotesIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            {feature.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function GrowthPartnershipSection() {
  return (
    <SectionShell
      id="growth-partnerships"
      title="Growth, partnerships, & skills"
      description="Scale your business with targeted marketing, agency partnerships, continuous learning, and community mentoring."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {GROWTH_PARTNERSHIP_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            {feature.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function OperationalQuickAccessSection() {
  return (
    <SectionShell
      id="quick-access"
      title="Operational quick access"
      description="Project workspace dashboards, gig commerce, and growth shortcuts ready for action."
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {QUICK_ACCESS_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ChartBarSquareIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{section.description}</p>
                </div>
              </div>
              {section.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <RectangleStackIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">Gig commerce</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {QUICK_ACCESS_COMMERCE.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                {card.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">Growth & profile</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {QUICK_ACCESS_GROWTH.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function GreetingCard({ profile }) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{formattedDate}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Good morning, {profile.name.split(' ')[0]} 👋</p>
            <p className="mt-1 text-sm text-slate-600">Here&rsquo;s what&rsquo;s lined up across your Gigvora workspace today.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white/70 px-6 py-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Today&rsquo;s weather</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">18&deg;C · Partly sunny</p>
          <p className="mt-1 text-xs text-slate-500">Perfect conditions for deep work sessions and afternoon workshops.</p>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ profile }) {
  return (
    <SectionShell
      title="Mission control overview"
      description="Trust scores, active engagements, and live telemetry at a glance."
    >
      <GreetingCard profile={profile} />
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: 'Trustscore', value: '96 / 100', trend: '+2.1 vs last month' },
          { label: 'Reviews', value: '182', trend: '4 new this week' },
          { label: 'Active jobs', value: '7', trend: '2 in kickoff' },
          { label: 'Gig orders', value: '11', trend: '3 awaiting QA' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600">{metric.trend}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Live workstreams</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-2xl border border-blue-50 bg-blue-50/60 px-3 py-2">
              <span>Experience audit · Lumina Health</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Due Fri</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-emerald-50 bg-emerald-50/70 px-3 py-2">
              <span>Retention diagnostics · Northwind</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">QA</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>New gig onboarding · Atlas Robotics</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kickoff</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Relationship health</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Retention score</p>
              <p className="text-xs text-slate-500">Tracking stability of retainers and renewals.</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[78%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-xs text-emerald-600">78% healthy · 3 accounts require attention</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Advocacy velocity</p>
              <p className="text-xs text-slate-500">Testimonials, case studies, and references flowing through.</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">6 assets in progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Upcoming schedule</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_CALENDAR.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span>{slot.label}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">{slot.type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}

function DeliveryOpsSection() {
  return (
    <SectionShell
      title="Delivery operations"
      description="Monitor live jobs, gig production, and client commitments."
      actions={[
        <button
          key="new-gig"
          type="button"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          Raise delivery alert
        </button>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Active jobs</p>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
              {SAMPLE_JOBS.length} jobs
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_JOBS.map((job) => (
              <li key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.client}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{job.stage}</p>
                    <p className="mt-1 font-semibold text-blue-600">Due {job.dueDate}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Projected value</span>
                  <span className="font-semibold text-slate-900">{job.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Gig production</p>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
              SLA 94%
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_GIG_ORDERS.map((order) => (
              <li key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.gig}</p>
                    <p className="text-xs text-slate-500">Order {order.id}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{order.status}</p>
                    <p className="mt-1 font-semibold text-blue-600">Submitted {order.submitted}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Contract value</span>
                  <span className="font-semibold text-slate-900">{order.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Delivery rituals</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Quality reviews', cadence: 'Every Tuesday', owner: 'Amelia' },
            { label: 'Client pulse checks', cadence: 'Wed & Fri', owner: 'Account AI' },
            { label: 'Success story capture', cadence: 'Bi-weekly', owner: 'Advocacy desk' },
            { label: 'Renewal forecasting', cadence: 'Monthly', owner: 'Finance partner' },
          ].map((ritual) => (
            <div key={ritual.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{ritual.label}</p>
              <p className="mt-1 text-xs text-slate-500">{ritual.cadence}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Lead: {ritual.owner}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function PlanningSection() {
  return (
    <SectionShell
      title="Calendar & capacity planning"
      description="Balance delivery, growth, and personal rituals with a single view."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">This week&rsquo;s capacity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Committed hours</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">32h / 40h</p>
              <p className="mt-1 text-xs text-slate-600">Room for two 2-hour discovery sessions.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Focus blocks</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">5 deep-work sessions</p>
              <p className="mt-1 text-xs text-slate-600">AI calendar optimized around client meetings.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-600">
            {[
              'Mon · Research synthesis & workshop prep',
              'Tue · Atlas Robotics vision sprint (onsite)',
              'Wed · Community mastermind & marketing updates',
              'Thu · Two discovery calls + delivery QA',
              'Fri · Finance review & next week planning',
            ].map((entry) => (
              <div key={entry} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                <span>{entry}</span>
                <HeartIcon className="h-5 w-5 text-rose-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Availability broadcast</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Waitlist</p>
              <p className="text-xs text-slate-500">3 strategic slots open for May starts.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Update availability
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Signal boosters</p>
              <p className="text-xs text-slate-500">Share open calendar windows with top referrers.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Notify alliances
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function GigStudioSection() {
  return (
    <SectionShell
      title="Gig building studio"
      description="Launch, iterate, and monitor signature offers with pricing intelligence."
      actions={[
        <button
          key="preview"
          type="button"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          Preview storefront
        </button>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Offer composer</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-title">
                Gig title
              </label>
              <input
                id="gig-title"
                type="text"
                placeholder="Product strategy accelerator"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-category">
                Category
              </label>
              <select
                id="gig-category"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option>Discovery & research</option>
                <option>Product strategy</option>
                <option>Design leadership</option>
                <option>Growth marketing</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-outcomes">
                Outcomes & proof points
              </label>
              <textarea
                id="gig-outcomes"
                rows={4}
                placeholder="Define the transformation, success metrics, and proof for this offer."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[`Essentials`, `Pro`, `Enterprise`].map((tier) => (
              <div key={tier} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{tier} plan</p>
                <input
                  type="text"
                  placeholder="$4,200"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <textarea
                  rows={3}
                  placeholder="Deliverables, SLAs, and add-ons."
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Market intelligence</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="font-semibold text-slate-900">Benchmark position</p>
              <p className="text-xs text-slate-500">Top 5% pricing in enterprise product strategy.</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Win rate 64%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Landing page assets</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-500">
                <li>• Narrative deck synced</li>
                <li>• Testimonial widget embedded</li>
                <li>• Checkout flow with upsells</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ProjectLabSection() {
  return (
    <SectionShell
      title="Project lab"
      description="Blueprint custom enterprise engagements with structured milestones and controls."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Project composer</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-name">
                Engagement name
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="Transformation roadmap for Northwind Bank"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-duration">
                Duration
              </label>
              <select
                id="project-duration"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option>6 weeks</option>
                <option>8 weeks</option>
                <option>12 weeks</option>
                <option>Quarterly retainer</option>
              </select>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((milestone) => (
              <div key={milestone} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Milestone {milestone}</p>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Configure tasks
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Define deliverables, acceptance criteria, and key roles."
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {['Owner', 'Budget', 'Dependencies'].map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Risk & compliance guardrails</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                <span>Contract compliance locker</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Syncing</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <span>Security questionnaire</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Cleared</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
                <span>Payment milestones</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automated</span>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Stakeholder map</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {[
                { label: 'Executive sponsor', name: 'Riya Patel', status: 'Engaged' },
                { label: 'Ops lead', name: 'Caleb Myers', status: 'Needs update' },
                { label: 'Finance partner', name: 'Dana Lee', status: 'Reviewing SOW' },
              ].map((stakeholder) => (
                <div key={stakeholder.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stakeholder.label}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span>{stakeholder.name}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{stakeholder.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function AutomationSection() {
  return (
    <SectionShell
      title="Automation & signals"
      description="Client success intelligence with automated playbooks and referrals."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Active playbooks</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_AUTOMATIONS.map((automation) => (
              <li key={automation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{automation.name}</p>
                    <p className="text-xs text-slate-500">Trigger: {automation.trigger}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    {automation.health}
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                  {automation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            Create new playbook
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Referral intelligence</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-semibold text-slate-900">Warm advocates</p>
              <p className="text-xs text-slate-500">6 clients ready to refer within the next 14 days.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-slate-900">Affiliate partners</p>
              <p className="text-xs text-slate-500">Generate co-marketing kits and partnership tracking links.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Manage referrals
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ProfileShowcaseSection() {
  return (
    <SectionShell
      title="Profile showcase"
      description="Craft a rich public profile with multimedia storytelling and credentialing."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Brand identity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-banner">
                Banner media
              </label>
              <input
                id="profile-banner"
                type="file"
                accept="image/*,video/*"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-tagline">
                Tagline
              </label>
              <input
                id="profile-tagline"
                type="text"
                placeholder="Designing category-leading product experiences."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-video">
                Showcase video
              </label>
              <input
                id="profile-video"
                type="file"
                accept="video/*"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-bio">
                Biography
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                placeholder="Share your story, approach, and differentiators."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Portfolio', placeholder: 'Add case study URLs or upload files' },
              { label: 'Skill tags', placeholder: 'Product strategy, JTBD, GTM, Research' },
              { label: 'Certificates', placeholder: 'Product Ops Institute, IDEO U' },
              { label: 'Qualifications', placeholder: 'Former Director at Lunar Labs' },
              { label: 'Work experience', placeholder: 'Leadership roles, highlights, tenure' },
              { label: 'Profile link', placeholder: 'gigvora.com/amelia-rivers', readOnly: true },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</label>
                <input
                  type="text"
                  defaultValue={item.readOnly ? item.placeholder : ''}
                  placeholder={item.placeholder}
                  readOnly={item.readOnly}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none ${
                    item.readOnly ? 'cursor-pointer text-blue-600' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Suggested follows</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                { name: 'Noah Kim', role: 'AI Product Strategist' },
                { name: 'Priya Desai', role: 'Service Design Lead' },
                { name: 'Gina Rodriguez', role: 'Growth Marketing Architect' },
              ].map((profile) => (
                <li key={profile.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Recent feed posts</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                'Research blueprint: How to modernize enterprise discovery ops.',
                'Case study: Driving retention for Lumina Health in 90 days.',
                'Template drop: My go-to product vision workshop board.',
              ].map((post) => (
                <li key={post} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {post}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ReferencesSection() {
  return (
    <SectionShell
      title="References & reviews"
      description="Curate testimonials, references, and optional private endorsements."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Published testimonials</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                client: 'Lumina Health',
                quote: 'Amelia helped us unlock a new member experience in six weeks. Our NPS jumped by 22 points.',
                score: '5.0',
              },
              {
                client: 'Atlas Robotics',
                quote: 'She orchestrated our product vision sprint and aligned engineering, design, and sales in record time.',
                score: '4.9',
              },
            ].map((reference) => (
              <div key={reference.client} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-sm font-semibold text-slate-900">{reference.client}</p>
                <p className="mt-2 text-slate-600">{reference.quote}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Score {reference.score}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Reference controls</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Allow private references</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Showcase review badges</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Allow feed cross-posting</span>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function NetworkSection() {
  return (
    <SectionShell
      title="Suggested follows"
      description="Grow your trusted circle with curated introductions and pods."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Collaboration pods</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                name: 'Enterprise product guild',
                focus: 'Seasoned strategists trading templates and opportunities.',
                members: 28,
              },
              {
                name: 'Healthtech circle',
                focus: 'Specialists in regulated markets aligning delivery standards.',
                members: 17,
              },
            ].map((pod) => (
              <div key={pod.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{pod.name}</p>
                <p className="mt-2 text-xs text-slate-500">{pod.focus}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">{pod.members} members</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Request invite
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Signal boost queue</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              'Share Amelia&rsquo;s latest case study to LinkedIn',
              'Invite Priya Desai to next mastermind',
              'Highlight research template in Gigvora spotlight',
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}

function WorkspaceSettingsSection() {
  return (
    <SectionShell
      title="Workspace settings"
      description="Control advanced systems, governance, and personalization preferences."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Feature toggles</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {FEATURE_TOGGLES.map((toggle) => (
              <li key={toggle.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{toggle.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{toggle.description}</p>
                </div>
                <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Safety controls</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {[
                'Require 2FA for all sign-ins',
                'Mask sensitive client data in shared views',
                'Enable advanced audit logs',
              ].map((policy) => (
                <li key={policy} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>{policy}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Personalization</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option>Gigvora Light</option>
                  <option>Midnight Ops</option>
                  <option>Solar Burst</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notification digest</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option>Daily summary</option>
                  <option>Weekly highlights</option>
                  <option>Real-time alerts</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function SupportSection() {
  return (
    <SectionShell
      title="Support desk"
      description="Work with Gigvora success engineers when you need a co-pilot."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Open tickets</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              {
                subject: 'Automation rule tuning',
                status: 'In progress',
                owner: 'Jordan · Success engineer',
                updated: 'Updated 2h ago',
              },
              {
                subject: 'Project blueprint review',
                status: 'Scheduled',
                owner: 'AI concierge',
                updated: 'Session Apr 17',
              },
            ].map((ticket) => (
              <div key={ticket.subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{ticket.owner}</p>
                <p className="mt-1 text-xs text-slate-500">{ticket.updated}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Need something fast?</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200"
            >
              Launch live chat
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              Book strategy session
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

const SECTION_COMPONENTS = {
  'profile-overview': <OverviewSection profile={DEFAULT_PROFILE} />,
  'operations-hq': <OperationsHQSection />,
  'delivery-ops': <DeliveryOpsSection />,
  planning: <PlanningSection />,
  'project-excellence': <ProjectWorkspaceExcellenceSection />,
  'gig-studio': <GigStudioSection />,
  'gig-marketplace': <GigMarketplaceOperationsSection />,
  'project-lab': <ProjectLabSection />,
  automation: <AutomationSection />,
  'finance-compliance': <FinanceComplianceSection />,
  'growth-partnerships': <GrowthPartnershipSection />,
  'quick-access': <OperationalQuickAccessSection />,
  'profile-showcase': <ProfileShowcaseSection />,
  references: <ReferencesSection />,
  network: <NetworkSection />,
  'workspace-settings': <WorkspaceSettingsSection />,
  support: <SupportSection />,
};

export default function FreelancerDashboardPage() {
  const [activeSection, setActiveSection] = useState('profile-overview');

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const activeContent = SECTION_COMPONENTS[activeSection] ?? SECTION_COMPONENTS['profile-overview'];

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Operate your Gigvora business with enterprise-grade tooling"
      description="Switch between delivery, growth, brand, and governance with a single, purposeful cockpit."
      menuSections={menuSections}
      profile={DEFAULT_PROFILE}
      availableDashboards={['freelancer', 'user', 'agency']}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        {activeContent}
      </div>
    </DashboardLayout>
  );
}
