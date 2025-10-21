import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';

const freelancerAllianceModelMock = {
  User: { findByPk: jest.fn() },
  AgencyAlliance: {},
  AgencyAllianceMember: { findAll: jest.fn() },
  AgencyAlliancePod: { findAll: jest.fn() },
  AgencyAlliancePodMember: {},
  AgencyAllianceResourceSlot: { findAll: jest.fn() },
  AgencyAllianceRateCard: { findAll: jest.fn() },
  AgencyAllianceRateCardApproval: {},
  AgencyAllianceRevenueSplit: { findAll: jest.fn() },
  ProviderWorkspace: {},
  ProviderWorkspaceMember: {},
};

Object.keys(global.__mockSequelizeModels).forEach((key) => delete global.__mockSequelizeModels[key]);
Object.assign(global.__mockSequelizeModels, freelancerAllianceModelMock);

const { getFreelancerAllianceDashboard } = await import('../../src/services/freelancerAllianceService.js');

function resetFreelancerAllianceMocks() {
  Object.values(freelancerAllianceModelMock).forEach((entry) => {
    if (!entry) return;
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
}

function createModel(data, { withPublic = true } = {}) {
  const instance = {
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

  if (withPublic) {
    instance.toPublicObject = () => ({ ...data });
  }

  return instance;
}

describe('freelancerAllianceService.getFreelancerAllianceDashboard', () => {
  beforeEach(() => {
    resetFreelancerAllianceMocks();
    appCache.store.clear();
  });

  it('validates the freelancer id input', async () => {
    await expect(getFreelancerAllianceDashboard('abc')).rejects.toThrow('positive integer');
    await expect(getFreelancerAllianceDashboard(-10)).rejects.toThrow('positive integer');
  });

  it('throws a not found error when the freelancer user cannot be resolved', async () => {
    freelancerAllianceModelMock.User.findByPk.mockResolvedValue(null);

    await expect(getFreelancerAllianceDashboard(77)).rejects.toThrow('Freelancer not found');

    freelancerAllianceModelMock.User.findByPk.mockResolvedValue({ id: 88, userType: 'agency_owner' });
    await expect(getFreelancerAllianceDashboard(88)).rejects.toThrow('Freelancer not found');
  });

  it('returns an empty dashboard payload when the freelancer has no alliance memberships', async () => {
    const freelancer = { id: 90, userType: 'freelancer', firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };
    freelancerAllianceModelMock.User.findByPk.mockResolvedValue(freelancer);
    freelancerAllianceModelMock.AgencyAllianceMember.findAll.mockResolvedValue([]);

    const dashboard = await getFreelancerAllianceDashboard(freelancer.id);

    expect(dashboard.freelancer).toMatchObject({ id: freelancer.id, firstName: 'Jamie' });
    expect(dashboard.alliances).toHaveLength(0);
    expect(dashboard.resourceHeatmap.weeks).toHaveLength(0);
    expect(dashboard.meta).toMatchObject({ allianceCount: 0 });
    expect(freelancerAllianceModelMock.AgencyAlliancePod.findAll).not.toHaveBeenCalled();

    const cached = await getFreelancerAllianceDashboard(freelancer.id);
    expect(cached).toBe(dashboard);
  });

  it('builds the alliance overview, rate cards, revenue splits and resource heatmap with caching', async () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const freelancer = { id: 42, userType: 'freelancer', firstName: 'Mila', lastName: 'Chen', email: 'mila@example.com' };
    freelancerAllianceModelMock.User.findByPk.mockResolvedValue(freelancer);

    const allianceWorkspace = createModel({ id: 300, name: 'Atlas HQ', slug: 'atlas-hq', type: 'agency', defaultCurrency: 'USD' });
    const alliance = createModel({
      id: 501,
      name: 'Atlas Collective',
      status: 'active',
      nextReviewAt: new Date(now + 45 * dayMs).toISOString(),
      workspace: allianceWorkspace,
    });

    const membershipUser = createModel({ id: freelancer.id, firstName: 'Mila', lastName: 'Chen', email: 'mila@example.com' });
    const membershipWorkspace = createModel({ id: 410, name: 'Indie Lab', slug: 'indie-lab', type: 'studio', defaultCurrency: 'USD' });
    const membershipWorkspaceMember = createModel({
      id: 701,
      workspaceId: membershipWorkspace.id,
      userId: freelancer.id,
      role: 'strategist',
      status: 'active',
    });

    const membership = createModel({
      id: 610,
      allianceId: alliance.id,
      status: 'active',
      joinDate: new Date(now - 120 * dayMs).toISOString(),
      role: 'lead_strategist',
      userId: freelancer.id,
    });
    membership.user = membershipUser;
    membership.workspace = membershipWorkspace;
    membership.workspaceMember = membershipWorkspaceMember;
    membership.alliance = alliance;

    const podLeadMember = createModel({
      id: 800,
      allianceId: alliance.id,
      role: 'pod_lead',
      status: 'active',
    });
    podLeadMember.user = createModel({ id: 910, firstName: 'Avery', lastName: 'Stone', email: 'avery@atlas.example' });
    podLeadMember.workspace = allianceWorkspace;
    podLeadMember.workspaceMember = createModel({
      id: 720,
      workspaceId: allianceWorkspace.id,
      userId: 910,
      role: 'lead',
      status: 'active',
    });

    const podMemberRecord = createModel({ id: 810, allianceId: alliance.id, role: 'designer', status: 'active' });
    podMemberRecord.user = createModel({ id: 911, firstName: 'Kai', lastName: 'Jones', email: 'kai@atlas.example' });
    podMemberRecord.workspace = createModel({ id: 420, name: 'Design Guild', slug: 'design-guild', type: 'studio', defaultCurrency: 'USD' });
    podMemberRecord.workspaceMember = createModel({
      id: 730,
      workspaceId: 420,
      userId: 911,
      role: 'member',
      status: 'active',
    });

    const podMember = createModel({ id: 820, memberId: podMemberRecord.id });
    podMember.member = podMemberRecord;

    const pod = createModel({ id: 805, allianceId: alliance.id, name: 'Growth Pod', status: 'active' });
    pod.leadMember = podLeadMember;
    pod.members = [podMember];

    const rateCard = createModel({
      id: 900,
      allianceId: alliance.id,
      serviceLine: 'Brand Strategy',
      deliveryModel: 'retainer',
      version: 3,
      status: 'active',
      rate: 150,
    });
    rateCard.createdBy = createModel({ id: 930, firstName: 'Liam', lastName: 'Ops', email: 'liam@atlas.example' });
    rateCard.approvals = [
      createModel({
        id: 931,
        status: 'approved',
        approver: createModel({ id: 932, firstName: 'Zoe', lastName: 'QA', email: 'zoe@atlas.example' }),
      }),
      createModel({
        id: 933,
        status: 'pending',
        approver: createModel({ id: 934, firstName: 'Reed', lastName: 'PM', email: 'reed@atlas.example' }),
      }),
    ];

    const revenueSplit = createModel({
      id: 950,
      allianceId: alliance.id,
      effectiveFrom: new Date(now - 20 * dayMs).toISOString(),
      partnerShare: 60,
      gigvoraShare: 40,
    });
    revenueSplit.createdBy = createModel({ id: 951, firstName: 'Alex', lastName: 'Lead', email: 'alex@atlas.example' });
    revenueSplit.approvedBy = createModel({ id: 952, firstName: 'Taylor', lastName: 'Finance', email: 'taylor@atlas.example' });

    const resourceSlotRecent = createModel({
      id: 970,
      allianceId: alliance.id,
      weekStartDate: new Date(now - 7 * dayMs).toISOString().slice(0, 10),
      plannedHours: 30,
      bookedHours: 24,
    });
    resourceSlotRecent.member = createModel({ id: 980, role: 'strategist', status: 'confirmed' });
    resourceSlotRecent.member.user = podMemberRecord.user;
    resourceSlotRecent.member.workspace = podMemberRecord.workspace;

    const resourceSlotCurrent = createModel({
      id: 971,
      allianceId: alliance.id,
      weekStartDate: new Date(now).toISOString().slice(0, 10),
      plannedHours: 20,
      bookedHours: 10,
    });
    resourceSlotCurrent.member = createModel({ id: 981, role: 'designer', status: 'tentative' });
    resourceSlotCurrent.member.user = createModel({ id: 913, firstName: 'Lena', lastName: 'Sun', email: 'lena@atlas.example' });
    resourceSlotCurrent.member.workspace = createModel({
      id: 430,
      name: 'Creative Syndicate',
      slug: 'creative-syndicate',
      type: 'studio',
      defaultCurrency: 'USD',
    });

    freelancerAllianceModelMock.AgencyAllianceMember.findAll.mockResolvedValue([membership]);
    freelancerAllianceModelMock.AgencyAlliancePod.findAll.mockResolvedValue([pod]);
    freelancerAllianceModelMock.AgencyAllianceRateCard.findAll.mockResolvedValue([rateCard]);
    freelancerAllianceModelMock.AgencyAllianceRevenueSplit.findAll.mockResolvedValue([revenueSplit]);
    freelancerAllianceModelMock.AgencyAllianceResourceSlot.findAll.mockResolvedValue([
      resourceSlotRecent,
      resourceSlotCurrent,
    ]);

    const dashboard = await getFreelancerAllianceDashboard(freelancer.id);

    expect(dashboard.freelancer).toMatchObject({ id: freelancer.id, firstName: 'Mila' });
    expect(dashboard.alliances).toHaveLength(1);
    const summary = dashboard.alliances[0];
    expect(summary.alliance).toMatchObject({ id: alliance.id, name: 'Atlas Collective' });
    expect(summary.membership.user).toMatchObject({ id: freelancer.id, firstName: 'Mila' });
    expect(summary.pods[0].leadMember.user.email).toBe('avery@atlas.example');
    expect(summary.pods[0].members[0].member.user.firstName).toBe('Kai');

    expect(summary.rateCardGroups[0].serviceLine).toBe('Brand Strategy');
    expect(summary.rateCardGroups[0].pendingApprovals).toHaveLength(1);
    expect(summary.metrics).toMatchObject({
      totalPods: 1,
      activeRateCards: 1,
      pendingApprovals: 1,
    });
    expect(summary.metrics.nextReviewAt).toBe(summary.resourceCalendar[1].weekStartDate);

    expect(summary.resourceCalendar).toHaveLength(2);
    expect(summary.resourceCalendar[0]).toMatchObject({
      weekStartDate: resourceSlotRecent.weekStartDate,
      plannedHours: 30,
      bookedHours: 24,
      utilizationRate: 80,
    });
    expect(summary.resourceCalendar[1]).toMatchObject({ utilizationRate: 50 });

    expect(summary.revenueSplits[0].createdBy.email).toBe('alex@atlas.example');

    expect(dashboard.resourceHeatmap.weeks).toHaveLength(2);
    expect(dashboard.resourceHeatmap.weeks[0].allocations[0]).toMatchObject({
      allianceId: alliance.id,
      plannedHours: expect.any(Number),
      bookedHours: expect.any(Number),
    });

    expect(dashboard.meta).toMatchObject({ allianceCount: 1 });

    const cached = await getFreelancerAllianceDashboard(freelancer.id);
    expect(cached).toBe(dashboard);
    expect(freelancerAllianceModelMock.AgencyAllianceMember.findAll).toHaveBeenCalledTimes(1);

    await getFreelancerAllianceDashboard(freelancer.id, { bypassCache: true });
    expect(freelancerAllianceModelMock.AgencyAllianceMember.findAll).toHaveBeenCalledTimes(2);
  });
});
