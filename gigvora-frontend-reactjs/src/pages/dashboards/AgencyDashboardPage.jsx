import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const menuSections = [
  {
    label: 'Agency operations',
    items: [
      {
        name: 'Agency overview',
        description: 'Performance scorecards, utilization rates, client health, and alerts.',
      },
      {
        name: 'Projects workspace',
        description: 'Portfolio of client engagements with milestones, staffing, and profitability.',
        tags: ['workspace'],
      },
      {
        name: 'Gig programs',
        description: 'Publish agency gigs, bundles, and managed services with branded banners.',
      },
    ],
  },
  {
    label: 'Talent & HR',
    items: [
      {
        name: 'HR management',
        description: 'Employee & contractor records, compliance docs, onboarding & exit workflows.',
      },
      {
        name: 'Capacity planning',
        description: 'Availability boards, staffing forecasts, and hiring needs for projects.',
      },
      {
        name: 'Internal marketplace',
        description: 'Advertise opportunities for agency members and allocate bench talent.',
      },
    ],
  },
  {
    label: 'Growth & brand',
    items: [
      {
        name: 'Analytics & insights',
        description: 'Client acquisition funnels, revenue analytics, retention trends, NPS.',
      },
      {
        name: 'Marketing studio',
        description: 'Agency profile, case studies, social proof, and campaign landing pages.',
      },
      {
        name: 'Settings & governance',
        description: 'Billing preferences, partner access, legal docs, and white-label branding.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Project portfolio mastery',
    description:
      'Run complex client engagements with granular visibility into scope, staffing, profitability, and quality across every project workspace.',
    features: [
      {
        name: 'Workspace orchestrator',
        description:
          'Spin up structured workspaces per client with briefs, SOWs, delivery cadences, and automation guardrails.',
        bulletPoints: [
          'Cross-project calendar and dependency mapping.',
          'Client-specific dashboards with branded experiences.',
        ],
      },
      {
        name: 'Resource intelligence',
        description:
          'Match assignments to skill, availability, and cost while tracking utilization and burnout risk.',
        bulletPoints: [
          'Heatmaps for capacity, margin, and bench readiness.',
          'Scenario planning for upcoming pitches or renewals.',
        ],
      },
      {
        name: 'Quality assurance workflow',
        description:
          'Pre-delivery reviews, QA scorecards, client satisfaction checks, and retrospectives embedded into every project.',
        bulletPoints: [
          'Auto-generate lessons learned that sync with knowledge bases.',
          'Link QA outcomes to performance reviews and incentives.',
        ],
      },
      {
        name: 'Financial oversight',
        description:
          'Track budgets, change orders, profitability, and invoices with client-specific policies.',
        bulletPoints: [
          'Multi-currency billing and localized compliance exports.',
          'Alerting for margin erosion or overdue invoices.',
        ],
      },
    ],
  },
  {
    title: 'Talent lifecycle & HR excellence',
    description:
      'Give every agency member a consumer-grade experience across hiring, onboarding, development, and performance.',
    features: [
      {
        name: 'Talent CRM',
        description:
          'Recruit, evaluate, and onboard permanent staff, contractors, and collectives with interview scheduling and feedback loops.',
        bulletPoints: [
          'Automated offer workflows with contract templates and e-signatures.',
          'Pipeline analytics for diversity, conversion, and time-to-fill.',
        ],
      },
      {
        name: 'People ops hub',
        description:
          'Centralize HR policies, benefits, compliance attestations, and performance reviews with contextual insights.',
        bulletPoints: [
          'Skills matrix to visualize strengths, gaps, and growth paths.',
          'Wellbeing dashboards and retention risk alerts.',
        ],
      },
      {
        name: 'Internal opportunity board',
        description:
          'Advertise cross-agency projects, mentorships, communities, and bench initiatives to keep talent engaged.',
        bulletPoints: [
          'Smart matching engine to surface roles to available talent.',
          'Companion mobile alerts for urgent staffing needs.',
        ],
      },
      {
        name: 'Agency member branding',
        description:
          'Provide banners, media kits, and social cards for each team member to promote agency credentials.',
        bulletPoints: [
          'Approval workflows to maintain brand consistency.',
          'Analytics on reach, engagement, and attributed leads.',
        ],
      },
    ],
  },
  {
    title: 'Marketplace & gig leadership',
    description:
      'Grow agency revenue with packaged services, marketplace listings, and partner programs that deliver recurring value.',
    features: [
      {
        name: 'Agency gig studio',
        description:
          'Design and launch managed service gigs with team rosters, deliverables, SLAs, and banner storytelling.',
        bulletPoints: [
          'Bundle freelancers and full-time staff into hybrid offerings.',
          'Automated pitch decks aligned to buyer segments.',
        ],
      },
      {
        name: 'Partner & reseller programs',
        description:
          'Collaborate with companies, headhunters, and freelancers on co-delivery, referrals, and revenue share.',
        bulletPoints: [
          'Onboarding flows with legal packages and financial terms.',
          'Performance tracking by partner channel and cohort.',
        ],
      },
      {
        name: 'Marketing automation',
        description:
          'Campaigns, nurture flows, content calendars, and analytics to grow pipeline and thought leadership.',
        bulletPoints: [
          'Integrated webinar and event management toolset.',
          'Dynamic landing pages connected to CRM and ATS systems.',
        ],
      },
      {
        name: 'Client advocacy',
        description:
          'Launch CSAT programs, reference libraries, and advisory councils to deepen client loyalty.',
        bulletPoints: [
          'Storytelling kits that convert case studies into pitches.',
          'Incentive programs for referrals and upsells.',
        ],
      },
    ],
  },
  {
    title: 'Executive intelligence & governance',
    description:
      'Stay in control with executive dashboards, compliance policies, and collaboration rooms for leadership decisions.',
    features: [
      {
        name: 'Agency analytics war room',
        description:
          'Visualize revenue, margin, utilization, pipeline velocity, and satisfaction in an interactive command center.',
        bulletPoints: [
          'Scenario explorer for best, base, and worst-case forecasts.',
          'Drill-down to clients, service lines, squads, or individuals.',
        ],
      },
      {
        name: 'Governance & compliance desk',
        description:
          'Maintain contracts, NDAs, insurance, certifications, and regulatory commitments with automated reviews.',
        bulletPoints: [
          'Risk registers tied to mitigation plans and owners.',
          'Audit-ready exports for clients and regulators.',
        ],
      },
      {
        name: 'Leadership collaboration',
        description:
          'Shared rituals, OKR tracking, decision logs, and asynchronous briefing packs for distributed leaders.',
        bulletPoints: [
          'Executive summary digest for Monday stand-ups.',
          'Link strategic bets to project performance outcomes.',
        ],
      },
      {
        name: 'Innovation lab',
        description:
          'Experiment with new service lines, R&D investments, and incubator programs leveraging agency talent.',
        bulletPoints: [
          'Innovation pipeline with prioritization scoring.',
          'Funding tracker linked to ROI snapshots.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Nova Collective',
  role: 'Digital Experience Agency',
  initials: 'NC',
  status: 'Operating at scale',
  badges: ['Premier agency', 'Verified partner'],
  metrics: [
    { label: 'Active clients', value: '28' },
    { label: 'Utilization', value: '82%' },
    { label: 'Projects in delivery', value: '19' },
    { label: 'Annual revenue', value: '$4.2M' },
  ],
};

const availableDashboards = ['agency', 'freelancer', 'company'];

export default function AgencyDashboardPage() {
  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Command Studio"
      subtitle="Operations, talent, and growth"
      description="Purpose-built to help agencies orchestrate projects, talent, gigs, and marketing campaigns while staying ahead of analytics and governance."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
