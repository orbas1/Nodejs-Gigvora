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
  FinancialEngagementSummary,
  FinancePayoutBatch,
  FinancePayoutSplit,
  FinanceTaxExport,
  AgencyProfile,
  Profile,
  Gig,
  Job,
  ProjectAssignmentEvent,
  TalentCandidate,
  PeopleOpsPolicy,
  FinanceRevenueEntry,
  FinanceExpenseEntry,
  FinanceSavingsGoal,
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

    await FinancialEngagementSummary.create({
      workspaceId: workspace.id,
      projectId: activeProject.id,
      clientName: 'Commerce Revamp',
      billingCurrency: 'USD',
      budgetAmount: 120000,
      actualSpend: 54000,
      invoicedAmount: 42000,
      outstandingAmount: 8000,
      changeOrdersCount: 1,
      marginPercent: 24.5,
      profitabilityScore: 72.4,
      complianceStatus: 'on_track',
      lastInvoiceDate: buildDateOffset(12),
      nextInvoiceDate: buildDateOffset(-3),
    });

    const completedBatch = await FinancePayoutBatch.create({
      userId: owner.id,
      name: 'April payroll',
      status: 'completed',
      totalAmount: 25000,
      currencyCode: 'USD',
      scheduledAt: buildDateOffset(10),
      executedAt: buildDateOffset(8),
    });

    await FinancePayoutSplit.bulkCreate([
      {
        batchId: completedBatch.id,
        teammateName: 'Nova Lead',
        teammateRole: 'Owner',
        status: 'completed',
        sharePercentage: 60,
        amount: 15000,
        currencyCode: 'USD',
        recipientEmail: 'owner@nova.test',
      },
      {
        batchId: completedBatch.id,
        teammateName: 'Mira Strategist',
        teammateRole: 'Manager',
        status: 'completed',
        sharePercentage: 40,
        amount: 10000,
        currencyCode: 'USD',
        recipientEmail: 'strategist@nova.test',
      },
    ]);

    const upcomingBatch = await FinancePayoutBatch.create({
      userId: owner.id,
      name: 'May distribution',
      status: 'scheduled',
      totalAmount: 18000,
      currencyCode: 'USD',
      scheduledAt: buildDateOffset(-3),
    });

    await FinancePayoutSplit.bulkCreate([
      {
        batchId: upcomingBatch.id,
        teammateName: 'Kai Designer',
        teammateRole: 'Staff',
        status: 'processing',
        sharePercentage: 50,
        amount: 9000,
        currencyCode: 'USD',
        recipientEmail: 'designer@nova.test',
      },
      {
        batchId: upcomingBatch.id,
        teammateName: 'Jordan Rivers',
        teammateRole: 'Contractor',
        status: 'failed',
        sharePercentage: 50,
        amount: 9000,
        currencyCode: 'USD',
        recipientEmail: 'contract@nova.test',
      },
    ]);

    await FinanceTaxExport.create({
      userId: owner.id,
      exportType: 'quarterly_revenue',
      status: 'available',
      periodStart: buildDateOffset(90),
      periodEnd: new Date(),
      amount: 42000,
      currencyCode: 'USD',
      generatedAt: buildDateOffset(2),
      downloadUrl: 'https://downloads.gigvora.test/exports/quarterly.csv',
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

    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const previousQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    await FinanceRevenueEntry.bulkCreate([
      {
        userId: owner.id,
        revenueType: 'retainer',
        status: 'recognized',
        amount: 75000,
        currencyCode: 'USD',
        taxWithholdingAmount: 7500,
        recognizedAt: now,
        clientName: 'Atlas Retail',
      },
      {
        userId: owner.id,
        revenueType: 'retainer',
        status: 'recognized',
        amount: 62000,
        currencyCode: 'USD',
        taxWithholdingAmount: 6200,
        recognizedAt: previousMonthDate,
        clientName: 'Lumen Bank',
      },
    ]);

    await FinanceExpenseEntry.create({
      userId: owner.id,
      category: 'Software',
      vendorName: 'SaaS Suite',
      cadence: 'monthly',
      amount: 2500,
      currencyCode: 'USD',
      occurredAt: now,
      status: 'posted',
      notes: 'Design tooling and analytics bundle',
    });

    await FinanceSavingsGoal.create({
      userId: owner.id,
      name: 'Runway reserve',
      status: 'active',
      targetAmount: 90000,
      currentAmount: 45000,
      currencyCode: 'USD',
      isRunwayReserve: true,
      lastContributionAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    });

    const recentBatch = await FinancePayoutBatch.create({
      userId: owner.id,
      name: 'April Delivery Payroll',
      status: 'completed',
      totalAmount: 42000,
      currencyCode: 'USD',
      scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      executedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    });

    await FinancePayoutSplit.bulkCreate([
      {
        batchId: recentBatch.id,
        teammateName: 'Mira Strategist',
        teammateRole: 'Manager',
        recipientEmail: 'strategist@nova.test',
        sharePercentage: 60,
        amount: 25200,
        currencyCode: 'USD',
        status: 'completed',
      },
      {
        batchId: recentBatch.id,
        teammateName: 'Kai Designer',
        teammateRole: 'Designer',
        recipientEmail: 'designer@nova.test',
        sharePercentage: 40,
        amount: 16800,
        currencyCode: 'USD',
        status: 'completed',
      },
    ]);

    const scheduledBatch = await FinancePayoutBatch.create({
      userId: owner.id,
      name: 'Launchpad Bonus Cycle',
      status: 'scheduled',
      totalAmount: 15000,
      currencyCode: 'USD',
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    });

    await FinancePayoutSplit.bulkCreate([
      {
        batchId: scheduledBatch.id,
        teammateName: 'Nova Lead',
        teammateRole: 'Director',
        recipientEmail: 'owner@nova.test',
        sharePercentage: 50,
        amount: 7500,
        currencyCode: 'USD',
        status: 'scheduled',
      },
      {
        batchId: scheduledBatch.id,
        teammateName: 'Jordan Rivers',
        teammateRole: 'Analyst',
        recipientEmail: 'analyst@nova.test',
        sharePercentage: 30,
        amount: 4500,
        currencyCode: 'USD',
        status: 'scheduled',
      },
      {
        batchId: scheduledBatch.id,
        teammateName: 'Avery Grey',
        teammateRole: 'Manager',
        recipientEmail: 'avery@nova.test',
        sharePercentage: 20,
        amount: 3000,
        currencyCode: 'USD',
        status: 'scheduled',
      },
    ]);

    await FinanceTaxExport.create({
      userId: owner.id,
      exportType: 'quarterly_vat',
      status: 'available',
      periodStart: previousQuarterStart,
      periodEnd: previousMonthEnd,
      amount: 18000,
      currencyCode: 'USD',
      downloadUrl: 'https://example.com/exports/vat-q1.csv',
      generatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });
  });

  it('returns a workspace-scoped dashboard with member, project, and financial insights', async () => {
    const dashboard = await getAgencyDashboard(
      { workspaceSlug: workspace.slug, lookbackDays: 120 },
      { actorId: owner.id, actorRole: 'agency' },
    );

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

    const financeTower = dashboard.financeControlTower;
    expect(financeTower.summary.totalReleased).toBeCloseTo(20000, 2);
    expect(financeTower.summary.monthToDateRevenue?.amount).toBe(75000);
    expect(financeTower.summary.trackedExpenses?.amount).toBe(2500);
    expect(financeTower.summary.scheduledTotal).toBe(15000);
    expect(financeTower.payouts.topRecipients[0].name).toBe('Mira Strategist');
    expect(financeTower.payouts.topRecipients[0].amount).toBe(25200);
    expect(financeTower.payouts.totals.shareOfReleased).toBeGreaterThan(0.9);
    expect(financeTower.payouts.upcomingBatches.length).toBeGreaterThan(0);
    expect(financeTower.exports.history[0].exportType).toBe('quarterly_vat');
    const payments = dashboard.paymentsDistribution;
    expect(payments.summary.totalBatches).toBeGreaterThanOrEqual(2);
    expect(payments.summary.outstandingSplits.count).toBe(1);
    expect(payments.summary.failedSplits.count).toBe(1);
    expect(payments.summary.processedThisQuarter.some((entry) => entry.amount > 0)).toBe(true);
    expect(payments.upcomingBatches.some((batch) => batch.name === 'May distribution')).toBe(true);
    expect(payments.teammates.find((member) => member.teammateName === 'Nova Lead')?.totalAmount ?? 0).toBeGreaterThan(0);
    expect(payments.exports.summary.available).toBe(1);
    expect(payments.insights.recommendedActions.length).toBeGreaterThan(0);
    expect(dashboard.summary.paymentsDistribution.outstandingSplits.count).toBe(1);
    expect(dashboard.operations.paymentsDistribution.summary.totalBatches).toBe(payments.summary.totalBatches);
  });

  it('falls back to global data when no workspace filter is provided', async () => {
    const dashboard = await getAgencyDashboard({}, { actorId: owner.id, actorRole: 'agency' });

    expect(dashboard.workspace?.slug).toBe('nova-collective');
    expect(dashboard.summary.projects.total).toBeGreaterThanOrEqual(2);
    expect(dashboard.summary.members.total).toBeGreaterThanOrEqual(3);
  });

  it('throws when an unknown workspace identifier is supplied', async () => {
    await expect(
      getAgencyDashboard({ workspaceSlug: 'unknown-agency' }, { actorId: owner.id, actorRole: 'agency' }),
    ).rejects.toThrow('Agency workspace not found.');
  });

  it('requires authentication context', async () => {
    await expect(getAgencyDashboard()).rejects.toThrow('Authentication required');
  });

  it('prevents access for non-agency memberships', async () => {
    await expect(
      getAgencyDashboard({ workspaceSlug: workspace.slug }, { actorId: client.id, actorRole: 'company' }),
    ).rejects.toThrow('You do not have permission to access the agency dashboard.');
  });
});

