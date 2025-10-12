import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const menuSections = [
  {
    label: 'Prospecting',
    items: [
      {
        name: 'Prospect discovery',
        description: 'Advanced search across Gigvora talent, projects, referrals, and external signals.',
        tags: ['AI sourcing'],
      },
      {
        name: 'Market maps',
        description: 'Track target companies, competitor org charts, and hiring movements.',
      },
      {
        name: 'Outreach playbooks',
        description: 'Sequenced campaigns, messaging templates, and analytics for conversions.',
      },
    ],
  },
  {
    label: 'Pipeline execution',
    items: [
      {
        name: 'Prospect pipeline',
        description: 'Stage-based pipeline from discovery to offer with scoring, notes, and attachments.',
      },
      {
        name: 'Interview coordination',
        description: 'Plan intro calls, client interviews, prep sessions, and debriefs in one hub.',
      },
      {
        name: 'Pass-on center',
        description: 'Share candidates with partner companies or agencies with insights and fit notes.',
      },
    ],
  },
  {
    label: 'Partnerships & insights',
    items: [
      {
        name: 'Client management',
        description: 'Manage retainers, success fees, contracts, and hiring mandates.',
      },
      {
        name: 'Performance analytics',
        description: 'Placement rates, time-to-submit, interview-to-offer ratios, and revenue.',
      },
      {
        name: 'Calendar & availability',
        description: 'Personal calendar, shared calendars with clients, and availability broadcasting.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Prospect intelligence & sourcing',
    description:
      'Combine data, AI, and relationships to discover the right talent faster and deliver curated shortlists to clients.',
    features: [
      {
        name: '360° talent profiles',
        description:
          'Aggregate Gigvora profiles, social data, patents, publications, and compensation signals for high-fidelity dossiers.',
        bulletPoints: [
          'Highlight career inflection points and motivators with AI insights.',
          'Flag exclusivity conflicts, relocation readiness, and compensation targets.',
        ],
      },
      {
        name: 'Prospecting cockpit',
        description:
          'Query by skills, seniority, diversity goals, and culture drivers with saved searches and alerts.',
        bulletPoints: [
          'Industry map visualizations for whitespace discovery.',
          'Signal-based alerts from funding, news, and leadership changes.',
        ],
      },
      {
        name: 'Campaign studio',
        description:
          'Build outreach campaigns with personalized sequences, AI-drafted copy, and automated reminders.',
        bulletPoints: [
          'Multichannel support across email, InMail, SMS, and phone.',
          'A/B testing and conversion analytics per persona.',
        ],
      },
      {
        name: 'Research collaboration',
        description:
          'Work alongside researchers and sourcers with shared notes, tasks, and compliance guardrails.',
        bulletPoints: [
          'Role-based access with redacted candidate info when necessary.',
          'Compliance logging for privacy and data retention rules.',
        ],
      },
    ],
  },
  {
    title: 'Pipeline mastery & candidate care',
    description:
      'Move candidates through a boutique experience with structured stages, prep, interview orchestration, and transparent updates.',
    features: [
      {
        name: 'Pipeline board',
        description:
          'Drag-and-drop prospects between stages with automation for next steps, reminders, and documentation.',
        bulletPoints: [
          'Customizable stages per search or mandate.',
          'Heatmaps for bottlenecks, risk, and candidate sentiment.',
        ],
      },
      {
        name: 'Interview concierge',
        description:
          'Coordinate candidate and client interviews, share prep materials, and capture feedback instantly.',
        bulletPoints: [
          'Central calendar with timezone intelligence and availability sync.',
          'Interview scorecards linked to candidate profiles and reports.',
        ],
      },
      {
        name: 'Candidate experience vault',
        description:
          'Log preferences, relocation needs, compensation expectations, and coaching notes to personalize engagement.',
        bulletPoints: [
          'Send curated prep packs and recap notes after each stage.',
          'Track wellbeing and readiness to avoid candidate fatigue.',
        ],
      },
      {
        name: 'Pass-on exchange',
        description:
          'When a candidate is not the right fit, pass them to other searches or partner companies with structured context.',
        bulletPoints: [
          'Configurable privacy settings and consent tracking.',
          'Revenue sharing and referral tracking for secondary placements.',
        ],
      },
    ],
  },
  {
    title: 'Client partnership excellence',
    description:
      'Deliver transparency to clients with shared dashboards, milestone updates, and ROI storytelling.',
    features: [
      {
        name: 'Client portals',
        description:
          'Invite clients to review shortlists, feedback, interview readiness, and offer strategy in secure portals.',
        bulletPoints: [
          'Customizable branding to match each client engagement.',
          'Audit logs and timeline of every interaction and decision.',
        ],
      },
      {
        name: 'Mandate performance dashboards',
        description:
          'Measure submissions, interviews, offers, and placements along with diversity and quality metrics.',
        bulletPoints: [
          'Exportable reports for executive briefings and retention.',
          'Forecast revenue and payout schedules per mandate.',
        ],
      },
      {
        name: 'Commercial operations',
        description:
          'Manage retainers, milestones, invoices, and commissions with finance-ready documentation.',
        bulletPoints: [
          'Auto-generate invoices and integrate with accounting tools.',
          'Commission splits when collaborating with other headhunters.',
        ],
      },
      {
        name: 'Issue resolution desk',
        description:
          'Address candidate withdrawals, offer renegotiations, or conflicts with structured playbooks.',
        bulletPoints: [
          'Escalation routing to client success and legal teams.',
          'Outcome tracking for continuous improvement.',
        ],
      },
    ],
  },
  {
    title: 'Insights, calendar, & wellbeing',
    description:
      'Balance deal-making with sustainable workflows, personal productivity, and business insights.',
    features: [
      {
        name: 'Intelligence hub',
        description:
          'Daily dashboards for pipeline value, forecasted placements, fee projections, and activity goals.',
        bulletPoints: [
          'Identify gaps vs. targets and recommended actions.',
          'Link analytics to weekly business reviews and stand-ups.',
        ],
      },
      {
        name: 'Calendar orchestration',
        description:
          'Unified calendar for outreach, interviews, internal syncs, and downtime to prevent burnout.',
        bulletPoints: [
          'Availability broadcasting to clients and candidates.',
          'Focus blocks protected automatically around key milestones.',
        ],
      },
      {
        name: 'Knowledge base & playbooks',
        description:
          'Store scripts, negotiation strategies, industry insights, and objection handling resources.',
        bulletPoints: [
          'Versioning and collaboration with fellow headhunters.',
          'AI summaries of long research docs into highlights.',
        ],
      },
      {
        name: 'Wellbeing tracker',
        description:
          'Track workload, travel, wellbeing metrics, and reminders for recovery so teams sustain high performance.',
        bulletPoints: [
          'Integrations with wellness stipends and productivity tools.',
          'Weekly reflection prompts to prevent burnout.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Skyline Search',
  role: 'Executive Headhunter Collective',
  initials: 'SS',
  status: 'Active mandates in 3 sectors',
  badges: ['Platinum headhunter', 'Preferred partner'],
  metrics: [
    { label: 'Active mandates', value: '12' },
    { label: 'Candidates interviewing', value: '37' },
    { label: 'Placements YTD', value: '18' },
    { label: 'Win rate', value: '72%' },
  ],
};

const availableDashboards = ['headhunter', 'company', 'agency'];

export default function HeadhunterDashboardPage() {
  return (
    <DashboardLayout
      currentDashboard="headhunter"
      title="Headhunter Deal Desk"
      subtitle="Prospecting, pipeline, and partnerships"
      description="Purpose-built for executive search teams to discover prospects, manage pipelines, orchestrate interviews, and collaborate with clients using pass-on workflows."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
