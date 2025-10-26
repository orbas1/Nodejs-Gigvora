import { beforeEach, describe, expect, it } from '@jest/globals';
import { projectGigManagementSequelize, StoryBlock, BrandAsset } from '../src/models/projectGigManagementModels.js';
import {
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
  getProjectGigManagementOverview,
  getGigOrderDetail,
  addGigTimelineEvent,
  updateGigTimelineEvent,
  createGigSubmission,
  recordAutoMatchCandidate,
} from '../src/services/projectGigManagementWorkflowService.js';

const ownerId = 42;

describe('projectGigManagementWorkflowService', () => {
  beforeEach(async () => {
    await projectGigManagementSequelize.sync({ force: true });
  });

  it('creates a project with workspace, assets, and gig order workflow data', async () => {
    const project = await createProject(ownerId, {
      title: 'Launch onboarding redesign',
      description: 'Refactor onboarding across growth pods.',
      budgetCurrency: 'USD',
      budgetAllocated: 25000,
      category: 'Growth enablement',
      skills: ['onboarding', 'ux operations'],
      durationWeeks: 10,
      lifecycleState: 'open',
      milestones: [
        { title: 'Discovery interviews', dueDate: new Date(), ordinal: 1 },
        { title: 'Prototype sprint', dueDate: new Date(Date.now() + 7 * 86400000), ordinal: 2 },
      ],
      collaborators: [
        { fullName: 'Casey Mentor', role: 'Mentor', status: 'active' },
        { fullName: 'Jordan Designer', role: 'Designer' },
      ],
      integrations: [{ provider: 'github' }, { provider: 'figma' }],
      workspace: {
        status: 'in_progress',
        progressPercent: 35,
        nextMilestone: 'Prototype sprint',
        riskLevel: 'medium',
        healthScore: 64,
        velocityScore: 58,
        clientSatisfaction: 4.2,
        automationCoverage: 45,
        billingStatus: 'on_track',
        metricsSnapshot: { approvalsPending: 1 },
      },
      autoMatch: {
        enabled: true,
        acceptEnabled: true,
        budgetMin: 3000,
        budgetMax: 12000,
        weeklyHoursMin: 10,
        weeklyHoursMax: 30,
        durationWeeksMin: 4,
        durationWeeksMax: 12,
        skills: ['ux', 'enablement'],
        notes: 'Prioritise facilitators with onboarding depth.',
      },
    });

    expect(project.category).toBe('Growth enablement');
    expect(project.skills).toEqual(expect.arrayContaining(['onboarding', 'ux operations']));
    expect(project.durationWeeks).toBe(10);
    expect(project.lifecycleState).toBe('open');
    expect(project.autoMatchEnabled).toBe(true);
    expect(project.autoMatchAcceptEnabled).toBe(true);
    expect(project.autoMatchBudgetMin).toBeCloseTo(3000);
    expect(project.autoMatchBudgetMax).toBeCloseTo(12000);
    expect(project.autoMatchSkills).toEqual(expect.arrayContaining(['ux', 'enablement']));
    expect(project.autoMatchUpdatedBy).toBe(ownerId);
    expect(project.workspace.status).toBe('active');
    expect(project.workspace.billingStatus).toBe('on_track');
    expect(project.workspace.metricsSnapshot).toMatchObject({ approvalsPending: 1 });

    await addProjectAsset(ownerId, project.id, {
      label: 'Discovery notes',
      category: 'research',
      storageUrl: 'https://cdn.example.com/notes.pdf',
      sizeBytes: 1_024_000,
    });

    await StoryBlock.create({
      ownerId,
      title: 'Reduced onboarding friction',
      outcome: 'Cut onboarding drop-off by 27% through async bootcamp.',
    });

    await BrandAsset.create({
      ownerId,
      title: 'Case study banner',
      assetType: 'banner',
      mediaUrl: 'https://cdn.example.com/banner.png',
    });

    const gigClasses = [
      {
        name: 'Starter',
        summary: 'Core resume polish',
        priceAmount: 1800,
        priceCurrency: 'USD',
        deliveryDays: 7,
        inclusions: ['Initial consult', 'Resume draft'],
      },
      {
        name: 'Growth',
        summary: 'Adds LinkedIn refresh',
        priceAmount: 2400,
        priceCurrency: 'USD',
        deliveryDays: 10,
        inclusions: ['Consult', 'Resume draft', 'LinkedIn profile'],
      },
      {
        name: 'Elite',
        summary: 'Full executive kit',
        priceAmount: 3200,
        priceCurrency: 'USD',
        deliveryDays: 14,
        inclusions: ['Consult', 'Resume draft', 'LinkedIn profile', 'Cover letter'],
      },
    ];

    const order = await createGigOrder(ownerId, {
      vendorName: 'Resume Studio',
      serviceName: 'Executive resume refresh',
      progressPercent: 20,
      requirements: [{ title: 'Upload baseline resume', dueAt: new Date(Date.now() + 2 * 86400000) }],
      classes: gigClasses,
      addons: [
        {
          name: 'Rush delivery',
          description: '48-hour turnaround',
          priceAmount: 600,
          priceCurrency: 'USD',
          deliveryDays: 2,
          isPopular: true,
        },
      ],
      tags: ['resume', 'executive', 'refresh'],
      media: [
        {
          type: 'image',
          url: 'https://cdn.example.com/resume-sample.png',
          caption: 'Before and after sample',
        },
      ],
      faqs: [
        {
          question: 'How many revisions are included?',
          answer: 'Two revision rounds in every class.',
        },
      ],
    });

    await updateGigOrder(ownerId, order.id, {
      status: 'in_revision',
      progressPercent: 55,
      newRevisions: [{ summary: 'Tone adjustments requested' }],
      scorecard: { overallScore: 4.5, communicationScore: 4.0 },
    });

    await updateProjectWorkspace(ownerId, project.id, { progressPercent: 48, riskLevel: 'medium' });

    const completedOrder = await createGigOrder(ownerId, {
      vendorName: 'Atlas Media Lab',
      serviceName: 'Product sizzle reel',
      status: 'in_delivery',
      progressPercent: 90,
      kickoffAt: new Date(Date.now() - 5 * 86400000),
      dueAt: new Date(Date.now() - 1 * 86400000),
      amount: 5400,
      requirements: [{ title: 'Provide product storyboard', status: 'approved', dueAt: new Date(Date.now() - 4 * 86400000) }],
      classes: gigClasses,
      addons: [],
      tags: ['video', 'product'],
      media: [],
      faqs: [],
    });

    await updateGigOrder(ownerId, completedOrder.id, { status: 'completed', progressPercent: 100 });

    const handoffEvent = await addGigTimelineEvent(ownerId, completedOrder.id, {
      eventType: 'handoff',
      title: 'Client handoff',
      occurredAt: new Date(Date.now() - 2 * 86400000),
    });

    await updateGigTimelineEvent(ownerId, completedOrder.id, handoffEvent.id, {
      status: 'completed',
      completedAt: new Date(Date.now() - 2 * 86400000),
    });

    await createGigSubmission(ownerId, completedOrder.id, {
      title: 'Final motion deliverable',
      status: 'approved',
      approvedAt: new Date(Date.now() - 2 * 86400000),
    });

    await recordAutoMatchCandidate(ownerId, { freelancerName: 'Jordan UI', status: 'contacted', matchScore: 78.2 });
    await recordAutoMatchCandidate(ownerId, { freelancerName: 'Skyler Ops', status: 'engaged', matchScore: 91.4 });
    await recordAutoMatchCandidate(ownerId, { freelancerName: 'Emerson QA', status: 'suggested', matchScore: 66.1 });

    const snapshot = await getProjectGigManagementOverview(ownerId);

    expect(snapshot.projects).toHaveLength(1);
    expect(snapshot.projects[0].workspace.progressPercent).toBeCloseTo(48);
    expect(snapshot.projects[0].assets).toHaveLength(1);
    expect(snapshot.assets.summary.total).toBe(1);
    expect(snapshot.board.metrics.averageProgress).toBeGreaterThan(0);

    expect(snapshot.purchasedGigs.orders.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.purchasedGigs.orders[0].classes.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.purchasedGigs.stats.totalOrders).toBeGreaterThanOrEqual(2);
    expect(snapshot.purchasedGigs.stats.averages.overall).toBeCloseTo(4.5);
    expect(snapshot.purchasedGigs.stats.awaitingReview).toBeGreaterThanOrEqual(1);
    expect(snapshot.purchasedGigs.stats.pendingClient).toBeGreaterThanOrEqual(1);
    expect(snapshot.purchasedGigs.stats.averageTurnaroundHours).not.toBeNull();
    expect(snapshot.purchasedGigs.stats.turnaroundSamples).toBeGreaterThan(0);
    expect(snapshot.purchasedGigs.stats.onTimeDeliveryRate).not.toBeNull();

    expect(snapshot.autoMatch.readyCount).toBe(2);
    expect(snapshot.autoMatch.summary.readyRatio).toBeGreaterThan(0);
    expect(snapshot.autoMatch.summary.suggested).toBeGreaterThanOrEqual(1);

    const detail = await getGigOrderDetail(ownerId, order.id);
    expect(detail.revisions).toHaveLength(1);
    expect(detail.classes.length).toBeGreaterThanOrEqual(3);
    expect(detail.addons.length).toBeGreaterThan(0);

    expect(snapshot.storytelling.achievements.length).toBeGreaterThan(0);
    expect(snapshot.templates.length).toBeGreaterThan(0);
  });
});
