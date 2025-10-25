import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import { app } from '../src/app.js';
import './setupTestEnv.js';
import {
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencyRetainerNegotiation,
  AgencyRetainerEvent,
} from '../src/models/index.js';
import {
  createUser,
  createProviderWorkspace,
  createFreelancerProfile,
} from './helpers/factories.js';

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe('freelancerAgencyController HTTP endpoints', () => {
  it('returns aggregated collaboration intelligence for a freelancer', async () => {
    const freelancer = await createUser({
      userType: 'freelancer',
      firstName: 'Jordan',
      lastName: 'Blake',
      email: 'jordan.freelancer@gigvora.test',
    });
    await createFreelancerProfile({
      userId: freelancer.id,
      title: 'Lead Product Strategist',
      hourlyRate: 185,
      availability: 'limited',
    });

    const agencyOwner = await createUser({
      userType: 'agency',
      firstName: 'Atlas',
      lastName: 'Founder',
      email: 'atlas@gigvora.test',
    });

    const workspace = await createProviderWorkspace({
      ownerId: agencyOwner.id,
      name: 'Atlas Partnerships',
      slug: 'atlas-partnerships',
      defaultCurrency: 'GBP',
      timezone: 'Europe/London',
    });

    const collaboration = await AgencyCollaboration.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      status: 'active',
      collaborationType: 'retainer',
      retainerAmountMonthly: 5800,
      currency: 'GBP',
      renewalDate: daysFromNow(60),
      healthScore: 74.2,
      satisfactionScore: 88.1,
      sharedDeliverablesDue: [
        {
          title: 'Quarterly brand audit',
          dueAt: daysFromNow(10).toISOString(),
          status: 'scheduled',
          owner: 'Jordan Blake',
          riskLevel: 'medium',
        },
        {
          title: 'CX dashboard refresh',
          dueAt: daysFromNow(24).toISOString(),
          status: 'in_progress',
          owner: 'Atlas Design Squad',
          riskLevel: 'high',
        },
      ],
      sharedResourcePlan: {
        roles: [
          {
            role: 'Strategist',
            committedHours: 32,
            availableHours: 12,
            collaborators: ['Jordan Blake'],
          },
          {
            role: 'Design Lead',
            committedHours: 20,
            availableHours: 8,
            collaborators: ['Lina Ortiz'],
          },
        ],
      },
      sharedDeliverySnapshot: {
        milestones: [
          {
            name: 'Discovery workshops',
            phase: 'kickoff',
            startAt: daysFromNow(3).toISOString(),
            endAt: daysFromNow(5).toISOString(),
            owners: ['Jordan Blake', 'Atlas Partnerships'],
          },
        ],
      },
      activeBriefsCount: 5,
      atRiskDeliverablesCount: 1,
      forecastedUpsellValue: 2100,
      forecastedUpsellCurrency: 'GBP',
      lastActivityAt: new Date(),
    });

    await AgencyCollaborationInvitation.bulkCreate([
      {
        freelancerId: freelancer.id,
        agencyWorkspaceId: workspace.id,
        collaborationId: collaboration.id,
        sentById: agencyOwner.id,
        status: 'pending',
        roleTitle: 'Product Ops Advisor',
        engagementType: 'retainer',
        proposedRetainer: 6000,
        currency: 'GBP',
        responseDueAt: daysFromNow(5),
        message: 'Help us stabilise the ops pod.',
      },
      {
        freelancerId: freelancer.id,
        agencyWorkspaceId: workspace.id,
        sentById: agencyOwner.id,
        status: 'accepted',
        roleTitle: 'Embedded Strategist',
        engagementType: 'embedded',
        proposedRetainer: 5200,
        currency: 'GBP',
        responseDueAt: daysFromNow(-7),
        message: 'Excited to have you embedded with the CX team.',
      },
    ]);

    const rateCard = await AgencyRateCard.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      title: 'Strategic retainers 2024',
      status: 'shared',
      effectiveFrom: daysFromNow(-15),
      effectiveTo: daysFromNow(180),
      currency: 'GBP',
      defaultTerms: { payment: 'Net 21', onboarding: '2-week runway' },
      shareHistory: [
        { workspaceId: workspace.id, status: 'pending', sharedAt: new Date().toISOString() },
        { workspaceId: workspace.id, status: 'accepted', sharedAt: daysFromNow(-10).toISOString() },
      ],
    });

    await AgencyRateCardItem.bulkCreate([
      {
        rateCardId: rateCard.id,
        name: 'Strategy retainers',
        description: 'Monthly scope covering research, roadmaps, and leadership rituals.',
        unitType: 'retainer',
        unitAmount: 1,
        unitPrice: 5800,
        currency: 'GBP',
        leadTimeDays: 14,
        minCommitment: 6,
        sortOrder: 1,
      },
      {
        rateCardId: rateCard.id,
        name: 'Executive offsite design',
        unitType: 'project',
        unitAmount: 1,
        unitPrice: 9800,
        currency: 'GBP',
        leadTimeDays: 30,
        minCommitment: 1,
        sortOrder: 2,
      },
    ]);

    const negotiation = await AgencyRetainerNegotiation.create({
      freelancerId: freelancer.id,
      agencyWorkspaceId: workspace.id,
      collaborationId: collaboration.id,
      name: 'Global CX rollout',
      status: 'awaiting_signature',
      stage: 'legal',
      confidence: 0.8,
      proposedAmount: 7200,
      currency: 'GBP',
      targetStartDate: daysFromNow(40),
      nextStep: 'Collect signatures from legal',
      nextStepDueAt: daysFromNow(4),
      lastAgencyMessageAt: daysFromNow(-1),
      lastFreelancerMessageAt: new Date(),
      notes: 'Legal review pending with procurement.',
    });

    await AgencyRetainerEvent.bulkCreate([
      {
        negotiationId: negotiation.id,
        actorType: 'freelancer',
        actorId: freelancer.id,
        eventType: 'note',
        summary: 'Shared procurement compliance documents.',
        payload: { attachments: 3 },
        occurredAt: daysFromNow(-2),
      },
      {
        negotiationId: negotiation.id,
        actorType: 'agency',
        actorId: agencyOwner.id,
        eventType: 'status_change',
        summary: 'Marked as awaiting signature after leadership approval.',
        occurredAt: daysFromNow(-1),
      },
    ]);

    const response = await request(app)
      .get(`/api/freelancers/${freelancer.id}/agency-collaborations`)
      .query({ lookbackDays: 120 })
      .expect(200);

    expect(response.body.summary).toMatchObject({
      activeCollaborations: 1,
      pendingInvitations: 1,
      monthlyRetainerCurrency: 'GBP',
    });
    expect(response.body.summary.monthlyRetainerValue).toBeCloseTo(5800);
    expect(response.body.summary.openNegotiations).toBe(1);
    expect(response.body.summary.pendingRateCardShares).toBe(1);
    expect(response.body.freelancer).toMatchObject({
      name: 'Jordan Blake',
      title: 'Lead Product Strategist',
    });
    expect(response.body.collaborations.active).toHaveLength(1);
    expect(response.body.collaborations.active[0].deliverables).toHaveLength(2);
    expect(response.body.delivery.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'Strategist' }),
        expect.objectContaining({ role: 'Design Lead' }),
      ]),
    );
    expect(response.body.negotiations.open[0]).toMatchObject({
      name: 'Global CX rollout',
      status: 'awaiting_signature',
    });
    expect(response.body.renewals.upcoming[0]).toMatchObject({
      collaborationId: collaboration.id,
      currency: 'GBP',
    });
    expect(response.body.rateCards[0].items).toHaveLength(2);
    expect(response.body.invitations.pending[0].workspace.name).toBe('Atlas Partnerships');
  });
});
