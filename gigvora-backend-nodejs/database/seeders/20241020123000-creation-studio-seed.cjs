'use strict';

const CREATION_ITEMS = [
  {
    type: 'job',
    title: 'Demo: Senior Product Designer',
    headline: 'Lead cross-functional squads to reimagine Gigvora dashboards.',
    summary:
      'Own discovery to delivery for dashboard experiences with close partnership across product, research, and analytics.',
    content:
      'You will pair with design systems, partner with PMs on strategic bets, and coach designers rolling onto major initiatives. ',
    status: 'published',
    visibility: 'public',
    category: 'Design',
    location: 'Hybrid · Berlin, Germany',
    targetAudience: 'Seasoned product designers with marketplace experience',
    launchDate: new Date('2024-10-01T09:00:00Z'),
    publishedAt: new Date('2024-10-02T08:30:00Z'),
    imageUrl: 'https://cdn.gigvora.example.com/assets/design-lead.jpg',
    tags: ['design', 'product', 'leadership'],
    settings: {
      employmentType: 'full_time',
      seniority: 'Senior',
      hiringManager: 'Avery Chen',
    },
    budgetAmount: 165000,
    budgetCurrency: 'EUR',
    compensationMin: 150000,
    compensationMax: 180000,
    compensationCurrency: 'EUR',
    durationWeeks: 0,
    commitmentHours: 40,
    remoteEligible: true,
  },
  {
    type: 'project',
    title: 'Demo: Workspace Automation Blueprint',
    headline: 'Launch a scoped automation project for HR teams adopting Gigvora.',
    summary:
      'Design a six-week automation accelerator that maps onboarding signals to workflow orchestration across HRIS connectors.',
    content:
      'Deliverables include a configuration workbook, workshop series, and measurement pack for adoption metrics.',
    status: 'scheduled',
    visibility: 'workspace',
    category: 'Automation',
    location: 'Remote · Global',
    targetAudience: 'Change enablement and RevOps champions',
    launchDate: new Date('2024-10-18T15:00:00Z'),
    publishAt: new Date('2024-10-17T13:00:00Z'),
    imageUrl: 'https://cdn.gigvora.example.com/assets/automation-blueprint.png',
    tags: ['automation', 'workspace', 'launchpad'],
    settings: {
      deliverables: 'Automation workbook, enablement workshops, reporting pack',
      mentorLead: 'Zuri Patel',
      skills: 'Change management, Zapier, Workato',
    },
    budgetAmount: 24000,
    budgetCurrency: 'USD',
    durationWeeks: 6,
    commitmentHours: 10,
    remoteEligible: true,
  },
  {
    type: 'networking_session',
    title: 'Demo: Founders & Talent Speed Networking',
    headline: 'Match Series A founders with recruiting leaders for rapid ideation.',
    summary:
      'A curated 45-minute networking session with rotating breakouts and an opt-in digital business card swap.',
    status: 'draft',
    visibility: 'workspace',
    category: 'Community',
    location: 'Virtual',
    targetAudience: 'Founders and recruiting leaders',
    launchDate: new Date('2024-11-05T17:00:00Z'),
    imageUrl: 'https://cdn.gigvora.example.com/assets/networking-session.jpg',
    tags: ['networking', 'community', 'talent'],
    settings: {
      sessionFormat: 'virtual',
      meetingUrl: 'https://meet.gigvora.example.com/networking/demo',
      capacity: 60,
      rotationMinutes: 8,
    },
    commitmentHours: 2,
    remoteEligible: true,
  },
  {
    type: 'volunteer_opportunity',
    title: 'Demo: Career Accelerator Mentors',
    headline: 'Offer 4 weeks of mentorship for emerging talent cohorts.',
    summary:
      'Support Launchpad fellows with weekly office hours focused on interview prep and storytelling practice.',
    content:
      'Mentors provide career narratives, review project artifacts, and reinforce community guidelines.',
    status: 'published',
    visibility: 'public',
    category: 'Mentorship',
    location: 'Remote · North America',
    targetAudience: 'People leaders with coaching experience',
    launchDate: new Date('2024-09-20T16:00:00Z'),
    publishedAt: new Date('2024-09-10T11:30:00Z'),
    endDate: new Date('2024-11-20T23:00:00Z'),
    imageUrl: 'https://cdn.gigvora.example.com/assets/mentor-circle.jpg',
    tags: ['mentorship', 'volunteer', 'launchpad'],
    settings: {
      skills: 'Coaching, behavioural interviewing',
      impactStatement: 'Mentors will directly influence fellow placement readiness scores.',
    },
    commitmentHours: 4,
    remoteEligible: true,
  },
  {
    type: 'blog_post',
    title: 'Demo: How Gigvora Companies Launch Faster',
    headline: 'Inside the creation studio playbook for opportunity velocity.',
    summary:
      'A look at how companies unify jobs, projects, and campaigns with governance guardrails in Gigvora.',
    content:
      'We breakdown intake rituals, workspace templates, and data-led approvals that reduce launch friction by 37%.',
    status: 'draft',
    visibility: 'workspace',
    category: 'Content Marketing',
    location: 'Remote',
    targetAudience: 'People ops and employer brand teams',
    imageUrl: 'https://cdn.gigvora.example.com/assets/blog-creation-studio.png',
    tags: ['blog', 'creation studio'],
    settings: {
      seoTitle: 'Creation Studio Playbook for Employers',
      seoDescription: 'Unify every launch with workflows, analytics, and guardrails.',
    },
    remoteEligible: true,
  },
  {
    type: 'ad',
    title: 'Demo: Gigvora Winter Talent Campaign',
    headline: 'Promote your winter hiring sprint across curated talent pools.',
    summary:
      'Dynamic ad units that spotlight your culture, growth paths, and open roles to vetted talent audiences.',
    status: 'scheduled',
    visibility: 'workspace',
    category: 'Advertising',
    location: 'Digital',
    targetAudience: 'Growth-stage companies planning seasonal hiring',
    launchDate: new Date('2024-11-15T12:00:00Z'),
    publishAt: new Date('2024-11-12T14:00:00Z'),
    imageUrl: 'https://cdn.gigvora.example.com/assets/winter-campaign.jpg',
    tags: ['ads', 'seasonal', 'talent'],
    settings: {
      campaignBudget: '7500',
      campaignAudience: 'Product & design talent across EU + NA',
      campaignDuration: '6 weeks',
      objective: 'awareness',
    },
    budgetAmount: 7500,
    budgetCurrency: 'USD',
    remoteEligible: true,
  },
];

module.exports = {
  async up(queryInterface) {
    const [workspaceRows] = await queryInterface.sequelize.query(
      "SELECT id FROM provider_workspaces WHERE type = 'company' ORDER BY id ASC LIMIT 1;",
    );
    const workspaceId = workspaceRows?.[0]?.id;

    if (!workspaceId) {
      return;
    }

    const [userRows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE userType = 'company' ORDER BY id ASC LIMIT 1;",
    );
    const createdById = userRows?.[0]?.id ?? null;

    const now = new Date();
    await queryInterface.bulkInsert(
      'creation_studio_items',
      CREATION_ITEMS.map((item, index) => ({
        workspaceId,
        createdById,
        ...item,
        metadata: { seed: 'creation-studio-demo', order: index + 1 },
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('creation_studio_items', {
      title: CREATION_ITEMS.map((item) => item.title),
    });
  },
};
