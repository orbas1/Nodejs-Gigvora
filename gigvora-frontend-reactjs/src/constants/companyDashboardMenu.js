export const COMPANY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Talent acquisition',
    items: [
      {
        name: 'Hiring overview',
        description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
        sectionId: 'hiring-overview',
      },
      {
        name: 'Job lifecycle & ATS intelligence',
        description:
          'Run a modern applicant tracking system with collaborative job creation, smart sourcing, and full-funnel insights.',
        tags: ['ATS'],
        sectionId: 'job-lifecycle-ats-intelligence',
        href: '/dashboard/company/ats',
      },
      {
        name: 'Interview excellence & candidate experience',
        description: 'Structured guides, scheduling automation, and feedback collaboration for every interview panel.',
        sectionId: 'interview-excellence',
      },
      {
        name: 'Offer & onboarding bridge',
        description: 'Generate offers, track approvals, manage background checks, and orchestrate onboarding tasks.',
        sectionId: 'offer-onboarding',
      },
      {
        name: 'Candidate care center',
        description: 'Monitor response times, candidate NPS, and inclusion metrics to deliver a world-class experience.',
        sectionId: 'candidate-care-center',
      },
    ],
  },
  {
    label: 'Design & sourcing',
    items: [
      {
        name: 'Job design studio',
        description: 'Craft requisitions with intake surveys, leveling frameworks, compensation guidelines, and approvals.',
        sectionId: 'job-design-studio',
      },
      {
        name: 'Multi-channel sourcing',
        description:
          'Publish to Gigvora, job boards, employee referrals, and talent pools with personalised landing pages and reporting.',
        sectionId: 'multi-channel-sourcing',
      },
      {
        name: 'Applicant relationship manager',
        description: 'Segment candidates, send nurture campaigns, and manage compliance across GDPR, CCPA, and internal policies.',
        sectionId: 'applicant-relationship-manager',
      },
    ],
  },
  {
    label: 'Networking & community',
    items: [
      {
        name: 'Networking sessions',
        description: 'Launch and monitor speed networking programs with configurable rotations and join limits.',
        sectionId: 'networking-sessions',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendee experience',
        description: 'Digital business cards, profile sharing, and chat tools keep every connection actionable.',
        sectionId: 'networking-attendee-experience',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendance controls',
        description: 'Automate penalties for repeated no-shows and manage eligibility for future sessions.',
        sectionId: 'networking-attendance-controls',
        href: '/dashboard/company/networking',
      },
    ],
  },
  {
    label: 'Finance & treasury',
    items: [
      {
        name: 'Wallet management',
        description: 'Manage balances, funding sources, payouts, and access controls for every company wallet.',
        sectionId: 'wallet-management',
        href: '/dashboard/company/wallets',
        tags: ['finance'],
      },
    ],
  },
  {
    label: 'Analytics & planning',
    items: [
      {
        name: 'Analytics & forecasting',
        description: 'Predict time-to-fill, offer acceptance, and pipeline conversion to forecast headcount.',
        sectionId: 'analytics-forecasting',
        href: '/dashboard/company/analytics',
      },
      {
        name: 'Workforce analytics',
        description: 'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
        sectionId: 'workforce-analytics',
        href: '/dashboard/company/analytics#workforce',
      },
      {
        name: 'Scenario planning',
        description: 'Model hiring freezes or acceleration plans with interactive dashboards by department, level, or location.',
        sectionId: 'scenario-planning',
        href: '/dashboard/company/analytics#scenarios',
      },
    ],
  },
  {
    label: 'Partnerships & sourcing',
    items: [
      {
        name: 'Headhunter program',
        description: 'Invite headhunters, share briefs, score performance, and manage commissions.',
        sectionId: 'partnerships-headhunter-program',
      },
      {
        name: 'Talent pools',
        description: 'Maintain silver medalists, alumni, referrals, and campus relationships.',
        sectionId: 'partnerships-talent-pools',
      },
      {
        name: 'Agency collaboration',
        description: 'Coordinate with partner agencies on SLAs, billing, and compliance.',
        sectionId: 'partnerships-agency-collaboration',
      },
      {
        name: 'Partner performance manager',
        description: 'Compare agencies, headhunters, and recruiters with leaderboards, SLAs, and ROI analytics.',
        sectionId: 'partner-performance-manager',
      },
    ],
  },
  {
    label: 'Brand & people',
    items: [
      {
        name: 'Employer brand & workforce intelligence',
        description: 'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
        sectionId: 'employer-brand-workforce',
      },
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
        sectionId: 'employer-brand-studio',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
        sectionId: 'employee-journeys',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
        sectionId: 'settings-governance',
      },
    ],
  },
  {
    label: 'Operations & governance',
    items: [
      {
        name: 'Calendar & communications',
        description: 'Sync recruiting calendars, digests, integrations, and cross-functional updates.',
        sectionId: 'calendar-communications',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
        sectionId: 'settings-governance',
      },
      {
        name: 'Integration command center',
        description: 'Dedicated console for Salesforce, monday.com, Slack, HubSpot, Google Drive, and BYOK AI connectors.',
        sectionId: 'settings-governance',
        href: '/dashboard/company/integrations',
        tags: ['integrations'],
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
        sectionId: 'governance-compliance',
      },
    ],
  },
];

export default COMPANY_DASHBOARD_MENU_SECTIONS;
