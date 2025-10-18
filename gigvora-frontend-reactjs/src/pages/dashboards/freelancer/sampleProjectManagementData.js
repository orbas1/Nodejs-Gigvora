export const SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT = Object.freeze({
  meta: { lastUpdated: '2024-10-20T10:00:00.000Z', fromCache: false },
  access: { canManage: true, allowedRoles: ['freelancer'] },
  summary: { budgetInPlay: 77000, currency: 'USD' },
  projectLifecycle: {
    open: [
      {
        id: 101,
        title: 'Northwind analytics transformation',
        description: 'Replatform analytics workspace and launch executive dashboards for leadership stakeholders.',
        status: 'in_progress',
        createdAt: '2024-08-01T09:00:00.000Z',
        updatedAt: '2024-10-12T15:30:00.000Z',
        dueDate: '2024-11-15T18:00:00.000Z',
        budget: { allocated: 45000, spent: 12000, currency: 'USD' },
        budgetAllocated: 45000,
        budgetSpent: 12000,
        budgetCurrency: 'USD',
        workspace: {
          status: 'in_progress',
          riskLevel: 'medium',
          progressPercent: 48,
          nextMilestone: 'Executive preview',
          nextMilestoneDueAt: '2024-10-25T17:00:00.000Z',
          notes: 'Aligning on analytics roll-out with finance stakeholders.',
        },
        metadata: {
          clientName: 'Northwind Bank',
          workspaceUrl: 'https://workspace.example.com/northwind/analytics',
          coverImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=300&q=80',
          tags: ['analytics', 'transformation', 'retainer'],
        },
        milestones: [
          { id: 1001, title: 'Discovery & alignment', status: 'completed', dueDate: '2024-08-20', owner: 'Amelia Rivers' },
          { id: 1002, title: 'Data inventory', status: 'in_progress', dueDate: '2024-10-05', owner: 'Jordan Lee' },
          { id: 1003, title: 'Executive preview', status: 'planned', dueDate: '2024-10-25', owner: 'Amelia Rivers' },
        ],
        collaborators: [
          {
            id: 501,
            fullName: 'Jordan Lee',
            email: 'jordan@example.com',
            role: 'Product Designer',
            status: 'active',
            hourlyRate: 120,
          },
          {
            id: 502,
            fullName: 'Priya Nair',
            email: 'priya@example.com',
            role: 'Data Analyst',
            status: 'active',
            hourlyRate: 135,
          },
        ],
        assets: [
          {
            id: 'asset-1',
            label: 'Analytics discovery brief',
            category: 'Document',
            sizeBytes: 5242880,
            permissionLevel: 'client',
            storageUrl: 'https://files.example.com/analytics-discovery.pdf',
          },
          {
            id: 'asset-2',
            label: 'Executive dashboard preview',
            category: 'Prototype',
            sizeBytes: 7340032,
            permissionLevel: 'client',
            storageUrl: 'https://files.example.com/executive-dashboard.fig',
          },
        ],
        lifecycle: {
          workspaceStatus: 'in_progress',
          nextDueAt: '2024-10-25T17:00:00.000Z',
          overdue: false,
          riskLevel: 'medium',
          progressPercent: 48,
          milestoneCount: 3,
          completedMilestones: 1,
          clientName: 'Northwind Bank',
          workspaceUrl: 'https://workspace.example.com/northwind/analytics',
          coverImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=300&q=80',
          tags: ['analytics', 'transformation', 'retainer'],
          archivedAt: null,
          cycleTimeDays: 68,
          lastUpdatedAt: '2024-10-12T15:30:00.000Z',
          healthScore: 68,
        },
      },
    ],
    closed: [
      {
        id: 205,
        title: 'Finley Capital onboarding revamp',
        description: 'Delivered onboarding journey redesign with automation playbooks and success metrics.',
        status: 'completed',
        createdAt: '2024-04-02T11:00:00.000Z',
        updatedAt: '2024-09-18T10:15:00.000Z',
        dueDate: '2024-09-10T18:00:00.000Z',
        archivedAt: '2024-09-18T10:15:00.000Z',
        budget: { allocated: 32000, spent: 32000, currency: 'USD' },
        budgetAllocated: 32000,
        budgetSpent: 32000,
        budgetCurrency: 'USD',
        workspace: {
          status: 'completed',
          riskLevel: 'low',
          progressPercent: 100,
          nextMilestone: 'Retention audit',
          nextMilestoneDueAt: null,
          notes: 'Ready for case study packaging.',
        },
        metadata: {
          clientName: 'Finley Capital',
          workspaceUrl: 'https://workspace.example.com/finley/onboarding',
          coverImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=300&q=80',
          tags: ['onboarding', 'automation'],
        },
        milestones: [
          { id: 2001, title: 'Journey mapping', status: 'completed', dueDate: '2024-06-01', owner: 'Amelia Rivers' },
          { id: 2002, title: 'Automation build', status: 'completed', dueDate: '2024-08-01', owner: 'Alex Chen' },
        ],
        collaborators: [
          {
            id: 601,
            fullName: 'Alex Chen',
            email: 'alex@example.com',
            role: 'Automation Engineer',
            status: 'inactive',
            hourlyRate: 145,
          },
        ],
        assets: [
          {
            id: 'asset-8',
            label: 'Automation blueprint',
            category: 'Document',
            sizeBytes: 3145728,
            permissionLevel: 'client',
            storageUrl: 'https://files.example.com/automation-blueprint.pdf',
          },
        ],
        lifecycle: {
          workspaceStatus: 'completed',
          nextDueAt: null,
          overdue: false,
          riskLevel: 'low',
          progressPercent: 100,
          milestoneCount: 2,
          completedMilestones: 2,
          clientName: 'Finley Capital',
          workspaceUrl: 'https://workspace.example.com/finley/onboarding',
          coverImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=300&q=80',
          tags: ['onboarding', 'automation'],
          archivedAt: '2024-09-18T10:15:00.000Z',
          cycleTimeDays: 142,
          lastUpdatedAt: '2024-09-18T10:15:00.000Z',
          healthScore: 90,
        },
      },
    ],
    stats: {
      openCount: 1,
      closedCount: 1,
      overdueCount: 0,
      atRiskCount: 0,
      averageProgress: 74,
      budgetInPlay: 45000,
      averageCycleTimeDays: 86,
      archivedLast30Days: 1,
      reopenedLast90Days: 0,
      healthDistribution: { healthy: 1, watch: 0, intervention: 0 },
      topClients: [
        { name: 'Northwind Bank', count: 1 },
        { name: 'Finley Capital', count: 1 },
      ],
      topTags: [
        { name: 'analytics', count: 1 },
        { name: 'automation', count: 1 },
      ],
    },
    filters: {
      statuses: ['planning', 'in_progress', 'completed', 'at_risk'],
      riskLevels: ['low', 'medium', 'high'],
    },
    meta: { generatedAt: '2024-10-20T10:00:00.000Z' },
  },
  projectCreation: {
    projects: [],
    templates: [
      {
        name: 'Discovery accelerator',
        category: 'Onboarding',
        summary: 'Launch research, alignment, and kickoff rituals in days.',
        description: 'A structured playbook for new engagements with surveys and kickoff guidance.',
        recommendedBudgetMin: 5000,
        recommendedBudgetMax: 12000,
      },
      {
        name: 'AI analytics pod',
        category: 'Delivery',
        summary: 'Stand up analytics pods with rituals and QA gates.',
        description: 'Cross-functional template covering research, build, and launch phases.',
        recommendedBudgetMin: 12000,
        recommendedBudgetMax: 28000,
      },
    ],
  },
  managementBoard: {
    lanes: [
      {
        status: 'planning',
        projects: [
          {
            id: 301,
            title: 'Atlas robotics research',
            progress: 20,
            riskLevel: 'low',
            dueAt: '2024-11-05T18:00:00.000Z',
          },
        ],
      },
      {
        status: 'in_progress',
        projects: [
          {
            id: 101,
            title: 'Northwind analytics transformation',
            progress: 48,
            riskLevel: 'medium',
            dueAt: '2024-10-25T17:00:00.000Z',
          },
          {
            id: 302,
            title: 'Guild community pilot',
            progress: 62,
            riskLevel: 'low',
            dueAt: '2024-11-30T17:00:00.000Z',
          },
        ],
      },
      {
        status: 'at_risk',
        projects: [
          {
            id: 401,
            title: 'Launchpad automation',
            progress: 32,
            riskLevel: 'high',
            dueAt: '2024-10-18T17:00:00.000Z',
          },
        ],
      },
      {
        status: 'completed',
        projects: [
          {
            id: 205,
            title: 'Finley Capital onboarding revamp',
            progress: 100,
            riskLevel: 'low',
            dueAt: '2024-09-10T18:00:00.000Z',
          },
        ],
      },
    ],
    metrics: { activeProjects: 4, averageProgress: 58, atRisk: 1, completed: 9 },
    integrations: [
      { status: 'in_progress', integrations: ['Notion', 'Linear'] },
      { status: 'completed', integrations: ['Drive', 'Slack'] },
    ],
  },
  assets: {
    summary: { total: 18, restricted: 4, storageBytes: 734003200, watermarkCoverage: 82 },
    items: [
      { id: 'asset-1', label: 'Analytics discovery brief', category: 'Document', sizeBytes: 5242880, permissionLevel: 'client' },
      { id: 'asset-2', label: 'Executive dashboard preview', category: 'Prototype', sizeBytes: 7340032, permissionLevel: 'client' },
      { id: 'asset-3', label: 'Client kickoff checklist', category: 'Checklist', sizeBytes: 1048576, permissionLevel: 'internal' },
      { id: 'asset-4', label: 'Risk register', category: 'Spreadsheet', sizeBytes: 2097152, permissionLevel: 'internal' },
    ],
    brandAssets: [
      { id: 'brand-1', label: 'Northwind brand kit' },
      { id: 'brand-2', label: 'Finley product screenshots' },
    ],
  },
  purchasedGigs: {
    stats: { totalOrders: 9, active: 3, completed: 21 },
    orders: [
      {
        id: 'order-1',
        serviceName: 'UX audit accelerator',
        vendorName: 'Signal Labs',
        status: 'in_production',
        dueAt: '2024-10-21T16:00:00.000Z',
      },
      {
        id: 'order-2',
        serviceName: 'Video testimonial edit',
        vendorName: 'Studio 84',
        status: 'awaiting_feedback',
        dueAt: '2024-10-19T18:00:00.000Z',
      },
      {
        id: 'order-3',
        serviceName: 'Brand messaging refresh',
        vendorName: 'Northstar Collective',
        status: 'completed',
        dueAt: '2024-10-10T18:00:00.000Z',
      },
    ],
    reminders: [
      {
        orderId: 'order-1',
        type: 'requirement',
        title: 'Client brand assets',
        dueAt: '2024-10-18T18:00:00.000Z',
      },
      {
        orderId: 'order-2',
        type: 'delivery',
        overdue: true,
        dueAt: '2024-10-17T18:00:00.000Z',
      },
    ],
  },
  storytelling: {
    achievements: [
      {
        title: 'Accelerated analytics adoption',
        bullet: 'Delivered executive-ready dashboards in 6 weeks with 95% CSAT.',
      },
      {
        title: 'Automation uplift',
        bullet: 'Increased onboarding completion rate by 32% for Finley Capital.',
      },
      {
        title: 'Cross-functional pod',
        bullet: 'Deployed guild community pilot with 87% engagement in the first month.',
      },
    ],
    quickExports: {
      resume: [
        'Led analytics transformation for Northwind Bank with 48% progress toward rollout.',
        'Scaled onboarding automation for Finley Capital resulting in 32% faster adoption.',
      ],
      linkedin: [
        'Week 8 of the Northwind analytics build—executive preview is almost ready to ship.',
        'Just wrapped a Finley onboarding overhaul. Automation + storytelling = 🚀',
      ],
      caseStudy: [
        'Challenge: outdated onboarding experience and slow analytics adoption.',
        'Outcome: 32% faster onboarding and executive dashboards shipping in under 6 weeks.',
      ],
    },
    prompts: [],
  },
});

export function cloneSampleProjectManagementSnapshot() {
  return JSON.parse(JSON.stringify(SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT));
}

export default SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT;
