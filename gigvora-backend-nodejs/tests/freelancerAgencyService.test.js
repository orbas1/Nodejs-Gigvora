import { describe, it, expect, beforeEach } from '@jest/globals';
import './setupTestEnv.js';
import {
  ProviderWorkspace,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencyRetainerNegotiation,
  AgencyRetainerEvent,
} from '../src/models/index.js';
import { getCollaborationsOverview } from '../src/services/freelancerAgencyService.js';
import { createUser } from './helpers/factories.js';

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe('freelancerAgencyService', () => {
  let freelancer;
  let agencyOwner;
  let workspace;

  beforeEach(async () => {
    freelancer = await createUser({
      userType: 'freelancer',
      firstName: 'Riley',
      lastName: 'Morgan',
      email: 'riley@gigvora.test',
    });

    agencyOwner = await createUser({
      userType: 'agency',
      firstName: 'Nova',
      lastName: 'Lead',
      email: 'nova@agency.test',
    });

    workspace = await ProviderWorkspace.create({
      ownerId: agencyOwner.id,
      name: 'Nova Collective',
      slug: 'nova-collective',
      type: 'agency',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });
  });

  it('aggregates invitations, collaborations, rate cards and negotiations', async () => {
    const collaboration = await AgencyCollaboration.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      status: 'active',
      collaborationType: 'retainer',
      retainerAmountMonthly: 5200,
      currency: 'USD',
      renewalDate: daysFromNow(45),
      healthScore: 88.5,
      satisfactionScore: 92.3,
      sharedDeliverablesDue: [
        {
          title: 'Brand sprint kickoff',
          dueAt: daysFromNow(7).toISOString(),
          status: 'scheduled',
          owner: 'Riley Morgan',
          riskLevel: 'medium',
        },
      ],
      sharedResourcePlan: {
        roles: [
          {
            role: 'Brand Strategist',
            committedHours: 42,
            availableHours: 28,
            collaborators: ['Riley Morgan', 'Mira Lane'],
          },
        ],
      },
      sharedDeliverySnapshot: {
        milestones: [
          {
            name: 'Discovery workshop',
            phase: 'kickoff',
            startAt: daysFromNow(5).toISOString(),
            endAt: daysFromNow(6).toISOString(),
            owners: ['Nova Lead'],
          },
        ],
      },
      activeBriefsCount: 3,
      atRiskDeliverablesCount: 1,
      forecastedUpsellValue: 1800,
      forecastedUpsellCurrency: 'USD',
      lastActivityAt: new Date(),
    });

    await AgencyCollaborationInvitation.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      collaborationId: collaboration.id,
      sentById: agencyOwner.id,
      status: 'pending',
      roleTitle: 'Design Lead',
      engagementType: 'retainer',
      proposedRetainer: 5400,
      currency: 'USD',
      responseDueAt: daysFromNow(3),
      message: 'Join our retained brand systems pod.',
    });

    const rateCard = await AgencyRateCard.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      title: 'Brand systems retainers',
      status: 'shared',
      effectiveFrom: daysFromNow(-10),
      currency: 'USD',
      defaultTerms: { payment: 'Net 15', renewals: 'Quarterly review' },
      shareHistory: [{ workspaceId: workspace.id, status: 'pending' }],
    });

    await AgencyRateCardItem.bulkCreate([
      {
        rateCardId: rateCard.id,
        name: 'Brand strategy sprint',
        unitType: 'sprint',
        unitAmount: 1,
        unitPrice: 6500,
        currency: 'USD',
        leadTimeDays: 7,
        minCommitment: 1,
        sortOrder: 1,
      },
      {
        rateCardId: rateCard.id,
        name: 'Design system maintenance',
        unitType: 'retainer',
        unitAmount: 1,
        unitPrice: 4200,
        currency: 'USD',
        leadTimeDays: 14,
        minCommitment: 3,
        sortOrder: 2,
      },
    ]);

    const negotiation = await AgencyRetainerNegotiation.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      collaborationId: collaboration.id,
      name: 'Q4 Growth Retainer',
      status: 'in_discussion',
      stage: 'commercials',
      confidence: 0.65,
      proposedAmount: 6200,
      currency: 'USD',
      targetStartDate: daysFromNow(30),
      nextStep: 'Share revised scope and pricing sheet',
      nextStepDueAt: daysFromNow(5),
      lastAgencyMessageAt: daysFromNow(-2),
      lastFreelancerMessageAt: daysFromNow(-1),
      notes: 'Agency wants broader coverage across three squads.',
    });

    await AgencyRetainerEvent.create({
      negotiationId: negotiation.id,
      actorType: 'freelancer',
      actorId: freelancer.id,
      eventType: 'document_shared',
      summary: 'Shared updated case studies deck',
      payload: { url: 'https://example.com/case-studies.pdf' },
      occurredAt: daysFromNow(-1),
    });

    await AgencyRetainerEvent.create({
      negotiationId: negotiation.id,
      actorType: 'agency',
      actorId: agencyOwner.id,
      eventType: 'term_update',
      summary: 'Requested three-month termination clause',
      payload: { clause: '3 month exit' },
      occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    });

    const result = await getCollaborationsOverview({
      freelancerId: freelancer.id,
      lookbackDays: 120,
    });

    expect(result.summary.activeCollaborations).toBe(1);
    expect(result.summary.pendingInvitations).toBe(1);
    expect(result.summary.monthlyRetainerValue).toBeCloseTo(5200);
    expect(result.summary.pendingRateCardShares).toBe(1);
    expect(result.summary.openNegotiations).toBe(1);
    expect(result.summary.sharedDeliverablesDue).toBeGreaterThan(0);
    expect(result.invitations.pending).toHaveLength(1);
    expect(result.collaborations.active[0].workspace.name).toBe('Nova Collective');
    expect(result.collaborations.active[0].deliverables[0].title).toContain('Brand sprint kickoff');
    expect(result.negotiations.open[0].events).toHaveLength(2);
    expect(result.delivery.resources[0].committedHours).toBeGreaterThan(0);
    expect(result.renewals.upcoming).toHaveLength(1);
    expect(result.renewals.retentionScore).toBeGreaterThanOrEqual(0);
    expect(result.freelancer.metrics[0].label).toBe('Active collaborations');
  });
});

