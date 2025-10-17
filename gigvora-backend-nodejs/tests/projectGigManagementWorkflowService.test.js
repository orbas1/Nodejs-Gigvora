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
      milestones: [
        { title: 'Discovery interviews', dueDate: new Date(), ordinal: 1 },
        { title: 'Prototype sprint', dueDate: new Date(Date.now() + 7 * 86400000), ordinal: 2 },
      ],
      collaborators: [
        { fullName: 'Casey Mentor', role: 'Mentor', status: 'active' },
        { fullName: 'Jordan Designer', role: 'Designer' },
      ],
      integrations: [{ provider: 'github' }, { provider: 'figma' }],
      workspace: { status: 'in_progress', progressPercent: 35, nextMilestone: 'Prototype sprint' },
    });

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

    const order = await createGigOrder(ownerId, {
      vendorName: 'Resume Studio',
      serviceName: 'Executive resume refresh',
      progressPercent: 20,
      requirements: [{ title: 'Upload baseline resume', dueAt: new Date(Date.now() + 2 * 86400000) }],
      classes: [
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
      ],
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
      status: 'in_delivery',
      progressPercent: 55,
      newRevisions: [{ summary: 'Tone adjustments requested' }],
      scorecard: { overallScore: 4.5, communicationScore: 4.0 },
    });

    await updateProjectWorkspace(ownerId, project.id, { progressPercent: 48, riskLevel: 'medium' });

    const snapshot = await getProjectGigManagementOverview(ownerId);

    expect(snapshot.projects).toHaveLength(1);
    expect(snapshot.projects[0].workspace.progressPercent).toBeCloseTo(48);
    expect(snapshot.projects[0].assets).toHaveLength(1);
    expect(snapshot.assets.summary.total).toBe(1);
    expect(snapshot.board.metrics.averageProgress).toBeGreaterThan(0);

    expect(snapshot.purchasedGigs.orders).toHaveLength(1);
    expect(snapshot.purchasedGigs.orders[0].classes.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.purchasedGigs.stats.totalOrders).toBe(1);
    expect(snapshot.purchasedGigs.stats.averages.overall).toBeCloseTo(4.5);

    const detail = await getGigOrderDetail(ownerId, order.id);
    expect(detail.revisions).toHaveLength(1);
    expect(detail.classes.length).toBeGreaterThanOrEqual(3);
    expect(detail.addons.length).toBeGreaterThan(0);

    expect(snapshot.storytelling.achievements.length).toBeGreaterThan(0);
    expect(snapshot.templates.length).toBeGreaterThan(0);
  });
});
