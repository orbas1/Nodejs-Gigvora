import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const menuSections = [
  {
    label: 'Talent acquisition',
    items: [
      {
        name: 'Hiring overview',
        description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
      },
      {
        name: 'Jobs management',
        description: 'Create, duplicate, archive, and collaborate on job requisitions.',
        tags: ['ATS'],
      },
      {
        name: 'Interview operations',
        description: 'Schedule panels, share prep kits, manage interviewer enablement, and feedback.',
      },
    ],
  },
  {
    label: 'Partnerships & sourcing',
    items: [
      {
        name: 'Headhunter program',
        description: 'Invite headhunters, share briefs, score performance, and manage commissions.',
      },
      {
        name: 'Talent pools',
        description: 'Maintain silver medalists, alumni, referrals, and campus relationships.',
      },
      {
        name: 'Agency collaboration',
        description: 'Coordinate with partner agencies on SLAs, billing, and compliance.',
      },
    ],
  },
  {
    label: 'Brand & people',
    items: [
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Job lifecycle & ATS intelligence',
    description:
      'Run a modern applicant tracking system with collaborative job creation, smart sourcing, and insights across the entire hiring funnel.',
    features: [
      {
        name: 'Job design studio',
        description:
          'Craft requisitions with intake surveys, leveling frameworks, compensation guidelines, and approval workflows.',
        bulletPoints: [
          'Hiring manager and finance co-authoring in real time.',
          'Automatic compliance checks for equal opportunity language.',
        ],
      },
      {
        name: 'Multi-channel sourcing',
        description:
          'Publish to Gigvora, job boards, employee referrals, and private talent pools with targeted messaging.',
        bulletPoints: [
          'Personalized landing pages per campaign or location.',
          'Performance tracking per source, recruiter, and job family.',
        ],
      },
      {
        name: 'Applicant relationship manager',
        description:
          'Segment candidates, send nurture campaigns, and manage compliance across GDPR, CCPA, and internal policies.',
        bulletPoints: [
          'Bulk actions, talent pipelines, and AI summarization of profiles.',
          'Automated reminders for feedback, next steps, and decline notes.',
        ],
      },
      {
        name: 'Analytics & forecasting',
        description:
          'Predict time-to-fill, offer acceptance, and pipeline conversion to help hiring teams forecast headcount.',
        bulletPoints: [
          'Interactive dashboards by department, level, or location.',
          'Scenario planning for hiring freezes or acceleration plans.',
        ],
      },
    ],
  },
  {
    title: 'Interview excellence & candidate experience',
    description:
      'Deliver consistent, inclusive interviews with structured guides, automation, and post-interview collaboration.',
    features: [
      {
        name: 'Interview scheduler',
        description:
          'Coordinate calendars, reserve rooms, send reminders, and manage interviewer availability automatically.',
        bulletPoints: [
          'Panel templates with role-based competencies and rubrics.',
          'Candidate prep portals with resources, forms, and NDAs.',
        ],
      },
      {
        name: 'Evaluation workspace',
        description:
          'Collect structured feedback, calibrate scores, and surface patterns that influence hiring decisions.',
        bulletPoints: [
          'Bias guardrails and anonymized review modes when needed.',
          'Decision trackers with rationales, packages, and approvals.',
        ],
      },
      {
        name: 'Offer & onboarding bridge',
        description:
          'Generate offers, track approvals, manage background checks, and orchestrate onboarding tasks.',
        bulletPoints: [
          'Digital signature workflows and document lockers.',
          'Day-one checklists for IT, HR, and hiring managers.',
        ],
      },
      {
        name: 'Candidate care center',
        description:
          'Monitor response times, candidate NPS, and inclusion metrics to deliver a world-class experience.',
        bulletPoints: [
          'Automated satisfaction surveys and follow-up sequences.',
          'Issues escalate to HRBPs and support for rapid resolution.',
        ],
      },
    ],
  },
  {
    title: 'Headhunter & partner collaboration',
    description:
      'Empower in-house teams, agencies, and headhunters to work in harmony with shared data, accountability, and compensation.',
    features: [
      {
        name: 'Headhunter dashboard',
        description:
          'Provide external recruiters with job briefs, candidate submissions, interviews, and commission tracking.',
        bulletPoints: [
          'Shared calendar, notes, and candidate scorecard access.',
          'Real-time visibility into pipelines and fill-rate performance.',
        ],
      },
      {
        name: 'Partner performance manager',
        description:
          'Compare agencies, headhunters, and internal recruiters with leaderboards, SLAs, and ROI analytics.',
        bulletPoints: [
          'Automated commission calculations and invoicing.',
          'Renewal and termination workflows with compliance checks.',
        ],
      },
      {
        name: 'Collaboration suite',
        description:
          'Secure messaging, file sharing, and decision threads between hiring managers, HR, agencies, and headhunters.',
        bulletPoints: [
          'Audit trails with context, attachments, and approvals.',
          'Escalation paths for urgent roles or policy exceptions.',
        ],
      },
      {
        name: 'Calendar & communications',
        description:
          'Company-wide recruiting calendar with interview load balancing, events, and executive hiring reviews.',
        bulletPoints: [
          'Sync with HRIS, Slack, email, and Gigvora messaging.',
          'Weekly digest for leadership and cross-functional partners.',
        ],
      },
    ],
  },
  {
    title: 'Employer brand & workforce intelligence',
    description:
      'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
    features: [
      {
        name: 'Company profile studio',
        description:
          'Design immersive employer profiles with culture videos, benefits, DEI commitments, and team spotlights.',
        bulletPoints: [
          'Dynamic sections for teams, offices, and leadership stories.',
          'Campaign tracking for talent marketing initiatives.',
        ],
      },
      {
        name: 'Workforce analytics',
        description:
          'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
        bulletPoints: [
          'Cohort comparisons for retention, performance, and promotions.',
          'Link analytics to hiring plans and headcount budgets.',
        ],
      },
      {
        name: 'Internal mobility & referrals',
        description:
          'Promote jobs internally, reward referrals, and manage career pathing across departments.',
        bulletPoints: [
          'Employee referral portal with gamified progress and payouts.',
          'Career pathing tools tied to learning recommendations.',
        ],
      },
      {
        name: 'Governance & compliance',
        description:
          'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies across every region.',
        bulletPoints: [
          'Policy templates, audit logs, and escalation processes.',
          'Accessibility audits with remediation guidance.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Atlas Robotics',
  role: 'Global Talent Acquisition Team',
  initials: 'AR',
  status: 'Hiring across 5 regions',
  badges: ['Employer of choice', 'Diversity champion'],
  metrics: [
    { label: 'Open roles', value: '42' },
    { label: 'Avg. time-to-fill', value: '31 days' },
    { label: 'Active headhunters', value: '8' },
    { label: 'Candidate NPS', value: '+54' },
  ],
};

const availableDashboards = ['company', 'headhunter', 'user'];

export default function CompanyDashboardPage() {
  return (
    <DashboardLayout
      currentDashboard="company"
      title="Company Talent Acquisition Hub"
      subtitle="Integrated ATS & partnerships"
      description="Everything hiring teams need to design jobs, run interviews, collaborate with headhunters, and promote a magnetic employer brand on Gigvora."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
