import crypto from 'crypto';
import { describe, it, expect, beforeEach } from '@jest/globals';
import './setupTestEnv.js';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  Project,
  AutoAssignQueueEntry,
  EscrowTransaction,
  EscrowAccount,
  AgencyProfile,
  Profile,
  Gig,
  Job,
  User,
  ProjectAssignmentEvent,
  TalentCandidate,
  PeopleOpsPolicy,
} from '../src/models/index.js';
import { getAgencyDashboard } from '../src/services/agencyDashboardService.js';
import { createUser } from './helpers/factories.js';

function buildDateOffset(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe('agencyDashboardService', () => {
  let owner;
  let workspace;
  let strategist;
  let benchDesigner;
  let client;

  beforeEach(async () => {
    owner = await createUser({ userType: 'agency', email: 'owner@nova.test', firstName: 'Nova', lastName: 'Lead' });
    strategist = await createUser({ userType: 'agency', email: 'strategist@nova.test', firstName: 'Mira' });
    benchDesigner = await createUser({ userType: 'agency', email: 'designer@nova.test', firstName: 'Kai' });
    client = await createUser({ userType: 'company', email: 'client@brand.test', firstName: 'Sky', lastName: 'Partner' });

    workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Nova Collective',
      slug: 'nova-collective',
      type: 'agency',
      timezone: 'UTC',
      defaultCurrency: 'USD',
      intakeEmail: 'hello@nova.test',
    });

    await ProviderWorkspaceMember.bulkCreate([
      {
        workspaceId: workspace.id,
        userId: owner.id,
        role: 'owner',
        status: 'active',
        joinedAt: buildDateOffset(140),
        lastActiveAt: buildDateOffset(2),
      },
      {
        workspaceId: workspace.id,
        userId: strategist.id,
        role: 'manager',
        status: 'active',
        joinedAt: buildDateOffset(60),
        lastActiveAt: new Date(),
      },
      {
        workspaceId: workspace.id,
        userId: benchDesigner.id,
        role: 'staff',
        status: 'active',
        joinedAt: buildDateOffset(20),
        lastActiveAt: buildDateOffset(5),
      },
    ]);

    await ProviderWorkspaceInvite.create({
      workspaceId: workspace.id,
      email: 'contract@nova.test',
      role: 'staff',
      status: 'pending',
      inviteToken: 'invite-token-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedById: owner.id,
    });

    await Profile.bulkCreate([
      {
        userId: owner.id,
        availabilityStatus: 'limited',
        availableHoursPerWeek: 20,
      },
      {
        userId: strategist.id,
        availabilityStatus: 'unavailable',
        availableHoursPerWeek: 10,
      },
      {
        userId: benchDesigner.id,
        availabilityStatus: 'available',
        availableHoursPerWeek: 32,
      },
    ]);

    await PeopleOpsPolicy.create({
      workspaceId: workspace.id,
      title: 'Data Handling Policy',
      status: 'active',
      effectiveDate: new Date(),
      reviewCycleDays: 180,
      acknowledgedCount: 1,
      audienceCount: 3,
    });

    await ProviderContactNote.create({
      workspaceId: workspace.id,
      subjectUserId: client.id,
      authorId: owner.id,
      note: 'Client renewal at risk. Schedule quarterly business review.',
      visibility: 'shared',
    });

    await AgencyProfile.create({
      userId: owner.id,
      agencyName: 'Nova Collective',
      focusArea: 'Digital experience',
      website: 'https://nova.example.com',
    });

    const activeProject = await Project.create({
      title: 'Commerce Revamp',
      description: 'Replatform e-commerce experience in three sprints.',
      status: 'active',
      budgetAmount: 120000,
      budgetCurrency: 'USD',
      autoAssignEnabled: true,
      autoAssignStatus: 'queue_active',
      autoAssignSettings: { workspaceId: workspace.id },
      autoAssignLastQueueSize: 4,
    });

    const planningProject = await Project.create({
      title: 'Brand Identity Sprint',
      description: 'Two-week design intensive for new client pitch.',
      status: 'planning',
      budgetAmount: 35000,
      budgetCurrency: 'USD',
      autoAssignEnabled: false,
      autoAssignStatus: 'inactive',
      autoAssignSettings: { workspaceSlug: workspace.slug },
    });

    await AutoAssignQueueEntry.bulkCreate([
      {
        targetType: 'project',
        targetId: activeProject.id,
        freelancerId: strategist.id,
        score: 0.92,
        priorityBucket: 1,
        status: 'pending',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
      {
        targetType: 'project',
        targetId: activeProject.id,
        freelancerId: benchDesigner.id,
        score: 0.81,
        priorityBucket: 2,
        status: 'accepted',
      },
    ]);

    await ProjectAssignmentEvent.create({
      projectId: activeProject.id,
      actorId: owner.id,
      eventType: 'milestone_completed',
      payload: { milestone: 'Sprint 1 delivery' },
    });

    const referenceSeed = crypto.randomUUID();

    const escrowAccount = await EscrowAccount.create({
      userId: owner.id,
      provider: 'stripe',
      externalId: `acct-${referenceSeed}`,
      status: 'active',
      currencyCode: 'USD',
    });

    await EscrowTransaction.create({
      accountId: escrowAccount.id,
      reference: `${referenceSeed}-1`,
      type: 'project',
      status: 'in_escrow',
      amount: 50000,
      currencyCode: 'USD',
      feeAmount: 1500,
      netAmount: 48500,
      initiatedById: client.id,
      counterpartyId: owner.id,
      projectId: activeProject.id,
    });

    await EscrowTransaction.create({
      accountId: escrowAccount.id,
      reference: `${referenceSeed}-2`,
      type: 'project',
      status: 'released',
      amount: 20000,
      currencyCode: 'USD',
      feeAmount: 600,
      netAmount: 19400,
      initiatedById: client.id,
      counterpartyId: owner.id,
      projectId: planningProject.id,
      releasedAt: new Date(),
    });

    await Gig.create({
      title: 'Retainer: Design System Ops',
      description: 'Monthly governance for enterprise design system.',
      budget: '$7k/mo',
      duration: '6 months',
    });

    await Job.create({
      title: 'Fractional Product Strategist',
      description: 'Lead experimentation roadmaps for fintech client.',
      employmentType: 'Contract',
    });

    await TalentCandidate.bulkCreate([
      {
        workspaceId: workspace.id,
        fullName: 'Avery Grey',
        status: 'hired',
        pipelineStage: 'offer',
        onboardingStatus: 'in_progress',
        exitWorkflowStatus: 'not_applicable',
        metadata: {
          targetRole: 'Manager',
          startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        workspaceId: workspace.id,
        fullName: 'Jordan Rivers',
        status: 'hired',
        pipelineStage: 'exit',
        onboardingStatus: 'completed',
        exitWorkflowStatus: 'in_progress',
        metadata: {
          targetRole: 'Staff',
        },
      },
    ]);
  });

  it('returns a workspace-scoped dashboard with member, project, and financial insights', async () => {
    const dashboard = await getAgencyDashboard({ workspaceSlug: workspace.slug, lookbackDays: 120 });

    expect(dashboard.workspace.slug).toBe('nova-collective');
    expect(dashboard.scope).toBe('workspace');
    expect(dashboard.summary.members.total).toBe(3);
    expect(dashboard.summary.members.pendingInvites).toBe(1);
    expect(dashboard.summary.projects.total).toBe(2);
    expect(dashboard.summary.projects.autoAssignEnabled).toBe(1);
    expect(dashboard.summary.pipeline.statuses.pending).toBe(1);
    expect(dashboard.summary.financials.inEscrow).toBeGreaterThan(0);
    expect(dashboard.summary.clients.active).toBe(1);
    expect(dashboard.members.list).toHaveLength(3);
    expect(dashboard.projects.list.map((project) => project.title)).toContain('Commerce Revamp');
    expect(dashboard.projects.events).toHaveLength(1);
    expect(dashboard.contactNotes[0].note).toMatch(/renewal/);

    const hr = dashboard.talentLifecycle.hrManagement;
    expect(hr.activeHeadcount).toBe(3);
    expect(hr.exitsInProgress).toBe(1);
    expect(hr.staffingCapacity.totalCapacityHours).toBeGreaterThan(0);
    expect(hr.staffingCapacity.health.level).toBeDefined();
    expect(hr.staffingCapacity.benchMembers).toBeGreaterThan(0);
    expect(hr.roleAssignments.coverage.length).toBeGreaterThan(0);
    const managerCoverage = hr.roleAssignments.coverage.find((role) => role.roleKey === 'manager');
    expect(managerCoverage?.pipeline.onboarding ?? 0).toBeGreaterThanOrEqual(1);
    expect(hr.policyAcknowledgements[0].outstanding).toBe(2);
    expect(hr.onboardingQueue.length).toBeGreaterThan(0);
    expect(hr.alerts.some((alert) => alert.type === 'compliance')).toBe(true);
  });

  it('falls back to global data when no workspace filter is provided', async () => {
    const dashboard = await getAgencyDashboard();

    expect(dashboard.workspace?.slug).toBe('nova-collective');
    expect(dashboard.summary.projects.total).toBeGreaterThanOrEqual(2);
    expect(dashboard.summary.members.total).toBeGreaterThanOrEqual(3);
  });

  it('throws when an unknown workspace identifier is supplied', async () => {
    await expect(
      getAgencyDashboard({ workspaceSlug: 'unknown-agency' }),
    ).rejects.toThrow('Agency workspace not found.');
  });
});

