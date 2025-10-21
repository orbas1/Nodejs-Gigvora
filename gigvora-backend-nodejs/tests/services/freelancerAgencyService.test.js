import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';

const freelancerAgencyModelMock = {
  User: { findByPk: jest.fn() },
  FreelancerProfile: {},
  ProviderWorkspace: {},
  AgencyCollaboration: { findAll: jest.fn() },
  AgencyCollaborationInvitation: { findAll: jest.fn() },
  AgencyRateCard: { findAll: jest.fn() },
  AgencyRateCardItem: {},
  AgencyRetainerNegotiation: { findAll: jest.fn() },
  AgencyRetainerEvent: {},
};

Object.keys(global.__mockSequelizeModels).forEach((key) => delete global.__mockSequelizeModels[key]);
Object.assign(global.__mockSequelizeModels, freelancerAgencyModelMock);

const { getCollaborationsOverview } = await import('../../src/services/freelancerAgencyService.js');

function resetFreelancerAgencyMocks() {
  Object.values(freelancerAgencyModelMock).forEach((entry) => {
    if (!entry) return;
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
}

function createModel(data) {
  return {
    ...data,
    get(arg) {
      if (typeof arg === 'string') {
        return this[arg];
      }
      if (arg?.plain) {
        return { ...data };
      }
      return { ...data };
    },
  };
}

describe('freelancerAgencyService.getCollaborationsOverview', () => {
  beforeEach(() => {
    resetFreelancerAgencyMocks();
    appCache.store.clear();
  });

  it('validates the freelancer identifier input', async () => {
    await expect(getCollaborationsOverview({ freelancerId: 'abc' })).rejects.toThrow('positive integer');
    await expect(getCollaborationsOverview({ freelancerId: -4 })).rejects.toThrow('positive integer');
  });

  it('throws a not found error when the freelancer profile cannot be located', async () => {
    freelancerAgencyModelMock.User.findByPk.mockResolvedValue(null);

    await expect(getCollaborationsOverview({ freelancerId: 999 })).rejects.toThrow('Freelancer not found');

    expect(freelancerAgencyModelMock.User.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
  });

  it('aggregates collaborations, invitations, negotiations and rate cards into the overview payload', async () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const freelancerProfile = createModel({ title: 'Lead Brand Strategist', hourlyRate: '120', availability: '25h/week' });
    const freelancer = {
      id: 42,
      firstName: 'Mila',
      lastName: 'Chen',
      email: 'mila.chen@example.com',
      get({ plain }) {
        if (plain) {
          return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
          };
        }
        return this;
      },
      FreelancerProfile: freelancerProfile,
    };

    const workspaceA = createModel({ id: 7, name: 'Stellar Collective', slug: 'stellar', type: 'agency', defaultCurrency: 'USD' });
    const workspaceB = createModel({ id: 8, name: 'Lumen Studio', slug: 'lumen', type: 'agency', defaultCurrency: 'USD' });

    const negotiationEventRecent = {
      toPublicObject() {
        return {
          id: 2001,
          occurredAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
          type: 'message',
          description: 'Client approved revised scope.',
        };
      },
    };
    const negotiationEventEarlier = {
      toPublicObject() {
        return {
          id: 2000,
          occurredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'note',
          description: 'Initial kickoff conversation recorded.',
        };
      },
    };

    const pipelineNegotiation = createModel({
      id: 900,
      freelancerId: freelancer.id,
      status: 'in_discussion',
      name: 'Scope Expansion Q3',
      proposedAmount: 1800,
      currency: 'USD',
      lastAgencyMessageAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      lastFreelancerMessageAt: new Date(now - 60 * 60 * 1000).toISOString(),
    });
    pipelineNegotiation.events = [negotiationEventRecent, negotiationEventEarlier];
    pipelineNegotiation.agencyWorkspace = workspaceA;

    const awaitingNegotiation = createModel({
      id: 901,
      freelancerId: freelancer.id,
      status: 'awaiting_signature',
      name: 'Retainer Renewal',
      forecastedAmount: 2500,
      currency: 'USD',
      lastAgencyMessageAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      lastFreelancerMessageAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    });
    awaitingNegotiation.events = [
      {
        toPublicObject() {
          return {
            id: 2002,
            occurredAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
            type: 'message',
            description: 'Freelancer sent updated MSA.',
          };
        },
      },
    ];
    awaitingNegotiation.agencyWorkspace = workspaceB;

    const closedNegotiation = createModel({
      id: 902,
      freelancerId: freelancer.id,
      status: 'won',
      name: 'Discovery Add-on',
      closedAt: new Date(now - 5 * dayMs).toISOString(),
      currency: 'USD',
      lastAgencyMessageAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      lastFreelancerMessageAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
    });
    closedNegotiation.events = [];
    closedNegotiation.agencyWorkspace = workspaceA;

    const collaborationActive = {
      id: 301,
      freelancerId: freelancer.id,
      status: 'active',
      retainerAmountMonthly: 5000,
      currency: 'USD',
      healthScore: 85,
      activeBriefsCount: 3,
      sharedDeliverablesDue: [
        {
          title: 'Brand audit playback',
          dueAt: new Date(now + 5 * dayMs).toISOString(),
          status: 'scheduled',
          owner: 'Mila Chen',
          riskLevel: 'low',
        },
        {
          title: 'Client workshop',
          dueAt: new Date(now + 45 * dayMs).toISOString(),
          status: 'scheduled',
          owner: 'Kai Jones',
          riskLevel: 'normal',
        },
      ],
      sharedDeliverySnapshot: {
        milestones: [
          {
            name: 'Discovery Sprint',
            phase: 'discovery',
            startAt: new Date(now - 7 * dayMs).toISOString(),
            endAt: new Date(now - 2 * dayMs).toISOString(),
            owners: ['Mila Chen'],
          },
          {
            name: 'Strategy Blueprint',
            phase: 'strategy',
            startAt: new Date(now + 2 * dayMs).toISOString(),
            endAt: new Date(now + 14 * dayMs).toISOString(),
            owners: ['Kai Jones'],
          },
        ],
      },
      sharedResourcePlan: {
        roles: [
          { role: 'Strategist', committedHours: 30, availableHours: 12, collaborators: ['Mila Chen'] },
          { role: 'Designer', committedHours: 18, availableHours: 6, collaborators: ['Kai Jones'] },
        ],
      },
      atRiskDeliverablesCount: 1,
      forecastedUpsellValue: 1200,
      forecastedUpsellCurrency: 'USD',
      renewalDate: new Date(now + 60 * dayMs).toISOString(),
      agencyWorkspace: workspaceA,
      negotiations: [pipelineNegotiation, awaitingNegotiation],
      get({ plain }) {
        if (plain) {
          return {
            id: this.id,
            freelancerId: this.freelancerId,
            status: this.status,
            retainerAmountMonthly: this.retainerAmountMonthly,
            currency: this.currency,
            healthScore: this.healthScore,
            activeBriefsCount: this.activeBriefsCount,
            sharedDeliverablesDue: this.sharedDeliverablesDue,
            sharedDeliverySnapshot: this.sharedDeliverySnapshot,
            sharedResourcePlan: this.sharedResourcePlan,
            atRiskDeliverablesCount: this.atRiskDeliverablesCount,
            forecastedUpsellValue: this.forecastedUpsellValue,
            forecastedUpsellCurrency: this.forecastedUpsellCurrency,
            renewalDate: this.renewalDate,
            healthNotes: 'Stable with upsell potential',
          };
        }
        return this;
      },
    };

    const collaborationPaused = {
      id: 302,
      freelancerId: freelancer.id,
      status: 'paused',
      retainerAmountMonthly: 3200,
      currency: 'USD',
      healthScore: 65,
      activeBriefsCount: 2,
      sharedDeliverablesDue: [
        {
          title: 'Post-mortem playback',
          dueAt: new Date(now + 10 * dayMs).toISOString(),
          status: 'scheduled',
          owner: 'Mila Chen',
          riskLevel: 'medium',
        },
      ],
      sharedDeliverySnapshot: {
        milestones: [
          {
            name: 'Retrospective',
            phase: 'wrap-up',
            startAt: new Date(now - 14 * dayMs).toISOString(),
            endAt: new Date(now - 6 * dayMs).toISOString(),
            owners: ['Mila Chen'],
          },
        ],
      },
      sharedResourcePlan: {
        roles: [
          { role: 'Strategist', committedHours: 12, availableHours: 4, collaborators: ['Mila Chen'] },
          { role: 'Designer', committedHours: 10, availableHours: 3, collaborators: ['Noah Smith'] },
        ],
      },
      atRiskDeliverablesCount: 0,
      forecastedUpsellValue: 0,
      forecastedUpsellCurrency: 'USD',
      renewalDate: new Date(now + 20 * dayMs).toISOString(),
      agencyWorkspace: workspaceB,
      negotiations: [closedNegotiation],
      get({ plain }) {
        if (plain) {
          return {
            id: this.id,
            freelancerId: this.freelancerId,
            status: this.status,
            retainerAmountMonthly: this.retainerAmountMonthly,
            currency: this.currency,
            healthScore: this.healthScore,
            activeBriefsCount: this.activeBriefsCount,
            sharedDeliverablesDue: this.sharedDeliverablesDue,
            sharedDeliverySnapshot: this.sharedDeliverySnapshot,
            sharedResourcePlan: this.sharedResourcePlan,
            atRiskDeliverablesCount: this.atRiskDeliverablesCount,
            forecastedUpsellValue: this.forecastedUpsellValue,
            forecastedUpsellCurrency: this.forecastedUpsellCurrency,
            renewalDate: this.renewalDate,
          };
        }
        return this;
      },
    };

    const invitationPending = createModel({
      id: 600,
      freelancerId: freelancer.id,
      status: 'pending',
      message: 'We would love to bring you onboard for a quarterly roadmap.',
      responseDueAt: new Date(now + 3 * dayMs).toISOString(),
    });
    invitationPending.agencyWorkspace = workspaceA;
    invitationPending.sentBy = createModel({
      id: 55,
      firstName: 'Avery',
      lastName: 'Stone',
      email: 'avery@stellar.example',
    });

    const invitationAccepted = createModel({
      id: 601,
      freelancerId: freelancer.id,
      status: 'accepted',
      message: 'Excited to collaborate on the fall launch.',
      responseDueAt: new Date(now - 5 * dayMs).toISOString(),
    });
    invitationAccepted.agencyWorkspace = workspaceB;
    invitationAccepted.sentBy = createModel({
      id: 58,
      firstName: 'Jordan',
      lastName: 'Miles',
      email: 'jordan@lumen.example',
    });

    const rateCard = createModel({
      id: 700,
      freelancerId: freelancer.id,
      allianceId: null,
      status: 'active',
      serviceLine: 'Brand Strategy',
      deliveryModel: 'retainer',
      version: 3,
      rate: 150,
      currency: 'USD',
      shareHistory: [
        { status: 'pending', sharedWith: 'Stellar Collective', sharedAt: new Date(now - dayMs).toISOString() },
      ],
    });
    rateCard.agencyWorkspace = workspaceA;
    rateCard.items = [
      {
        toPublicObject() {
          return { id: 1, name: 'Discovery Sprint', sortOrder: 1, price: 3200 };
        },
      },
      {
        toPublicObject() {
          return { id: 2, name: 'Brand Blueprint', sortOrder: 2, price: 5200 };
        },
      },
    ];

    freelancerAgencyModelMock.User.findByPk.mockResolvedValue(freelancer);
    freelancerAgencyModelMock.AgencyCollaboration.findAll.mockResolvedValue([collaborationActive, collaborationPaused]);
    freelancerAgencyModelMock.AgencyCollaborationInvitation.findAll.mockResolvedValue([invitationPending, invitationAccepted]);
    freelancerAgencyModelMock.AgencyRateCard.findAll.mockResolvedValue([rateCard]);
    freelancerAgencyModelMock.AgencyRetainerNegotiation.findAll.mockResolvedValue([
      pipelineNegotiation,
      awaitingNegotiation,
      closedNegotiation,
    ]);

    const overview = await getCollaborationsOverview({ freelancerId: freelancer.id, lookbackDays: 90 });
    expect(overview.freelancer).toMatchObject({
      id: freelancer.id,
      firstName: 'Mila',
      lastName: 'Chen',
      email: 'mila.chen@example.com',
      metrics: expect.any(Array),
    });

    expect(overview.summary).toMatchObject({
      activeCollaborations: 1,
      monthlyRetainerValue: 5000,
      negotiationPipelineValue: 4300,
      pendingInvitations: 1,
      openNegotiations: 2,
      sharedProjects: 5,
      sharedDeliverablesDue: 2,
      pendingRateCardShares: 1,
      negotiationPipelineCurrency: 'USD',
      monthlyRetainerCurrency: 'USD',
    });

    expect(overview.summary.responseTimeHours).toBeGreaterThan(0);
    expect(overview.summary.averageHealthScore).toBeGreaterThan(0);
    expect(overview.renewals.retentionScore).toBe(0);
    expect(overview.renewals.upcoming).toHaveLength(2);
    expect(overview.renewals.atRisk.length).toBeGreaterThanOrEqual(1);

    expect(overview.invitations.list).toHaveLength(2);
    const pendingInvite = overview.invitations.pending[0];
    expect(pendingInvite.workspace.name).toBe('Stellar Collective');
    expect(pendingInvite.sentBy.email).toBe('avery@stellar.example');
    expect(pendingInvite.isOverdue).toBe(false);

    expect(overview.collaborations.list).toHaveLength(2);
    expect(overview.collaborations.active).toHaveLength(1);
    expect(overview.collaborations.paused).toHaveLength(1);

    expect(overview.delivery.deliverables[0].title).toBe('Brand audit playback');
    expect(overview.delivery.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'Strategist', committedHours: 42, collaborators: expect.arrayContaining(['Mila Chen']) }),
        expect.objectContaining({ role: 'Designer', committedHours: 28, collaborators: expect.arrayContaining(['Kai Jones']) }),
      ]),
    );

    expect(overview.negotiations.list).toHaveLength(3);
    expect(overview.negotiations.open).toHaveLength(2);
    expect(overview.negotiations.recentEvents[0].negotiationName).toBe('Scope Expansion Q3');

    expect(overview.rateCards[0]).toMatchObject({ serviceLine: 'Brand Strategy', items: expect.any(Array) });

    const cached = await getCollaborationsOverview({ freelancerId: freelancer.id, lookbackDays: 90 });
    expect(cached).toBe(overview);
    expect(freelancerAgencyModelMock.AgencyCollaboration.findAll).toHaveBeenCalledTimes(1);
  });

  it('filters out inactive collaborations when includeInactive is false', async () => {
    const freelancer = {
      id: 77,
      firstName: 'Riley',
      lastName: 'Morgan',
      email: 'riley@example.com',
      get({ plain }) {
        if (plain) {
          return { id: this.id, firstName: this.firstName, lastName: this.lastName, email: this.email };
        }
        return this;
      },
      FreelancerProfile: createModel({ title: 'Operations Lead', hourlyRate: '95', availability: '20h/week' }),
    };

    freelancerAgencyModelMock.User.findByPk.mockResolvedValue(freelancer);
    freelancerAgencyModelMock.AgencyCollaboration.findAll.mockResolvedValue([]);
    freelancerAgencyModelMock.AgencyCollaborationInvitation.findAll.mockResolvedValue([]);
    freelancerAgencyModelMock.AgencyRateCard.findAll.mockResolvedValue([]);
    freelancerAgencyModelMock.AgencyRetainerNegotiation.findAll.mockResolvedValue([]);

    await getCollaborationsOverview({ freelancerId: freelancer.id, includeInactive: false, lookbackDays: 30 });

    expect(freelancerAgencyModelMock.AgencyCollaboration.findAll).toHaveBeenCalledTimes(1);
    const query = freelancerAgencyModelMock.AgencyCollaboration.findAll.mock.calls[0][0];
    expect(query.where).toMatchObject({ freelancerId: freelancer.id });
    expect(query.where.status).toBeDefined();
  });
});
