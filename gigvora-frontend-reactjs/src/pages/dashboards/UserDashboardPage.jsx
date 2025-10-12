import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const menuSections = [
  {
    label: 'Career operations',
    items: [
      {
        name: 'Executive summary',
        description: 'Notifications, deadlines, and quick actions across your job search.',
        tags: ['alerts', 'tasks'],
      },
      {
        name: 'Job applications',
        description: 'Kanban pipeline with stages, collaboration notes, and recruiter contact logs.',
        tags: ['kanban', 'reminders'],
      },
      {
        name: 'Interview hub',
        description: 'Coordinate interviews, agendas, prep kits, and interviewer feedback loops.',
        tags: ['calendar', 'video'],
      },
      {
        name: 'Auto-apply rules',
        description: 'Define salary, role, seniority, and location filters for automated submissions.',
        tags: ['automation', 'AI'],
      },
    ],
  },
  {
    label: 'Documents & branding',
    items: [
      {
        name: 'CV studio',
        description: 'Generate unlimited CV variants with version control and targeted metrics.',
        tags: ['multiple CVs'],
      },
      {
        name: 'Cover letters',
        description: 'Draft, personalize, and track cover letter templates per opportunity.',
      },
      {
        name: 'Portfolio projects',
        description: 'Create case studies, upload assets, and share project snapshots.',
      },
      {
        name: 'Purchased gigs',
        description: 'Monitor deliverables, communicate with vendors, and validate quality.',
      },
    ],
  },
  {
    label: 'Insights & profile',
    items: [
      {
        name: 'Talent intelligence',
        description: 'Job market analytics, salary benchmarks, and competitor tracking.',
      },
      {
        name: 'Connections CRM',
        description: 'Follow up with referrers, mentors, and interviewers in one pipeline.',
      },
      {
        name: 'Profile & settings',
        description: 'Availability toggles, privacy controls, banner management, and preferences.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Career pipeline automation',
    description:
      'Build a predictable job-search operating system with structured pipelines, automations, and collaboration-ready workflows.',
    features: [
      {
        name: 'Job applications kanban',
        description:
          'Track each opportunity through stages, attach research, and trigger nudges when a stage exceeds its SLA.',
        bulletPoints: [
          'Bulk status updates and smart reminders for follow-ups.',
          'Shareable candidate brief for referrals or agency partners.',
          'Compliance guardrails for equal opportunity reporting.',
        ],
      },
      {
        name: 'Interview command center',
        description:
          'Consolidate every interview panel, task list, prep document, and recording in a unified workspace.',
        bulletPoints: [
          'Auto-sync with personal and recruiter calendars.',
          'Live interviewer scorecards and debrief capture.',
          'Interview readiness checklist with AI rehearsal prompts.',
        ],
      },
      {
        name: 'Offer negotiation vault',
        description:
          'Store compensation data, negotiation scripts, decision matrices, and track competing offers side-by-side.',
        bulletPoints: [
          'Scenario modeling for salary, equity, and benefits.',
          'Legal-ready archive of signed documents and addendums.',
        ],
      },
      {
        name: 'Auto job application criteria',
        description:
          'Define role, salary, visa, and culture-fit filters. The system drafts submissions that you approve or auto-send.',
        bulletPoints: [
          'Rule library with testing sandbox before going live.',
          'Per-rule analytics showing conversion and rejection reasons.',
          'Guardrails that require manual review for premium roles.',
        ],
      },
    ],
  },
  {
    title: 'Document studio & branding',
    description:
      'Craft and manage every professional asset with precision while keeping versions, analytics, and approvals in sync.',
    features: [
      {
        name: 'Multi-CV generator',
        description:
          'Clone baseline resumes into role-specific variants with AI copy suggestions, tracked edits, and recruiter annotations.',
        bulletPoints: [
          'Unlimited CV storage with tagging by role or geography.',
          'One-click PDF, DOCX, and web profile exports.',
          'Version compare to highlight new achievements for interviews.',
        ],
      },
      {
        name: 'Cover letter composer',
        description:
          'Generate cover letters using reusable story blocks, metrics, and tone guidance. Collaborate with mentors in real time.',
        bulletPoints: [
          'Central library with approvals and reuse tracking.',
          'AI tone coach and grammar quality scores.',
        ],
      },
      {
        name: 'Personal brand hub',
        description:
          'Curate testimonials, social proof, case studies, and profile banners that feed into public Gigvora pages.',
        bulletPoints: [
          'Banner designer with agency-ready templates.',
          'Embed video introductions, portfolios, and press.',
        ],
      },
      {
        name: 'Document analytics',
        description:
          'See which CVs, cover letters, or portfolios lead to interviews and optimize based on recruiter interactions.',
        bulletPoints: [
          'Open and download tracking when shared externally.',
          'Outcome analysis by variant, geography, and seniority.',
        ],
      },
    ],
  },
  {
    title: 'Project & gig management',
    description:
      'Launch personal initiatives, manage paid gig deliverables, and capture outcomes for your professional story.',
    features: [
      {
        name: 'Project creation workspace',
        description:
          'Kick off initiatives with briefs, milestones, budget tracking, and collaborator invites for mentors or freelancers.',
        bulletPoints: [
          'Template gallery for hackathons, bootcamps, and consulting gigs.',
          'Asset repository with granular permissions and watermarking.',
        ],
      },
      {
        name: 'Project management board',
        description:
          'Visualize progress, time spent, outcomes, and deliverables across career-building projects or volunteering.',
        bulletPoints: [
          'Integrations with GitHub, Notion, Figma, and cloud drives.',
          'Retrospective reports automatically generated per milestone.',
        ],
      },
      {
        name: 'Purchased gig operations',
        description:
          'Track purchased gig milestones, approve revisions, and release payments with escrow and satisfaction surveys.',
        bulletPoints: [
          'Vendor scorecards tied to your personal vendor marketplace.',
          'Automatic reminders for due diligence and compliance files.',
        ],
      },
      {
        name: 'CV-ready storytelling',
        description:
          'Convert project outcomes directly into resume bullets, cover letter stories, or LinkedIn updates.',
        bulletPoints: [
          'Achievement assistant to quantify results and impact.',
          'One-click publishing to personal Gigvora profile sections.',
        ],
      },
    ],
  },
  {
    title: 'Insights, accountability, & support',
    description:
      'Stay in the loop with market data, coach collaboration, calendars, and progress retrospectives.',
    features: [
      {
        name: 'Career analytics',
        description:
          'Monitor outreach conversions, interview momentum, salary trends, and diversity metrics in one analytics layer.',
        bulletPoints: [
          'Weekly digest emails and on-demand dashboards.',
          'Benchmarks against peers with similar skill stacks.',
        ],
      },
      {
        name: 'Calendar & rituals',
        description:
          'Central calendar combining interviews, networking follow-ups, project deadlines, and wellbeing rituals.',
        bulletPoints: [
          'Sync with Google, Outlook, and in-app reminders.',
          'Focus mode for interview prep or networking sprints.',
        ],
      },
      {
        name: 'Advisor collaboration',
        description:
          'Invite mentors, agencies, or coaches with scoped permissions to co-manage parts of your search.',
        bulletPoints: [
          'Activity audit logs and granular access levels.',
          'Secure document rooms with expiration policies.',
        ],
      },
      {
        name: 'Support desk',
        description:
          'Access Gigvora support, automation logs, and troubleshooting guides right from the dashboard.',
        bulletPoints: [
          'Escalate to live chat or knowledge base instantly.',
          'Track SLAs for open support conversations.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Avery Stone',
  role: 'Product Designer & Job Seeker',
  initials: 'AS',
  status: 'Actively interviewing',
  badges: ['Premium candidate', 'Talent Cloud featured'],
  metrics: [
    { label: 'Active applications', value: '12' },
    { label: 'Interviews scheduled', value: '3' },
    { label: 'Offers negotiating', value: '1' },
    { label: 'Projects live', value: '4' },
  ],
};

const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

export default function UserDashboardPage() {
  return (
    <DashboardLayout
      currentDashboard="user"
      title="User & Job Seeker Command Center"
      subtitle="Candidate success workspace"
      description="A mission control for ambitious professionals to manage job applications, interviews, documents, and personal branding with clarity and automation."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
