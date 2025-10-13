import crypto from 'crypto';
import { describe, it, expect, beforeEach } from '@jest/globals';
import './setupTestEnv.js';
import {
  AutoAssignQueueEntry,
  EscrowAccount,
  EscrowTransaction,
  FreelancerAssignmentMetric,
  Gig,
  MessageThread,
  Notification,
  Profile,
  ProfileEngagementJob,
  Project,
  ProjectAssignmentEvent,
  SupportCase,
} from '../src/models/index.js';
import { getFreelancerDashboard } from '../src/services/freelancerDashboardService.js';
import { createUser } from './helpers/factories.js';

function buildDateOffset(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe('freelancerDashboardService', () => {
  let freelancer;
  let client;
  let teammate;
  let project;
  let gig;

  beforeEach(async () => {
    freelancer = await createUser({
      userType: 'freelancer',
      email: 'freelancer@gigvora.test',
      firstName: 'Riley',
      lastName: 'Morgan',
    });

    client = await createUser({
      userType: 'company',
      email: 'client@gigvora.test',
      firstName: 'Sky',
      lastName: 'Partners',
    });

    teammate = await createUser({
      userType: 'freelancer',
      email: 'collab@gigvora.test',
      firstName: 'Nova',
    });

    await Profile.create({
      userId: freelancer.id,
      headline: 'Lead Brand Designer',
      bio: 'Helps ambitious brands ship premium experiences.',
      availabilityStatus: 'limited',
      availableHoursPerWeek: 24,
      areasOfFocus: [{ name: 'Brand systems' }, { name: 'Product UX' }],
    });

    await FreelancerAssignmentMetric.create({
      freelancerId: freelancer.id,
      rating: 4.8,
      completionRate: 0.92,
      avgAssignedValue: 8400,
      lifetimeAssignedValue: 215000,
      lifetimeCompletedValue: 198500,
      lastAssignedAt: buildDateOffset(12),
      lastCompletedAt: buildDateOffset(8),
      totalAssigned: 42,
      totalCompleted: 38,
    });

    project = await Project.create({
      title: 'E-commerce redesign',
      description: 'Multi-sprint engagement for DTC lifestyle brand.',
      status: 'active',
      budgetAmount: 45000,
      budgetCurrency: 'USD',
      autoAssignEnabled: true,
      autoAssignStatus: 'queue_active',
      autoAssignLastQueueSize: 3,
    });

    gig = await Gig.create({
      title: 'Conversion landing page sprint',
      description: 'Two-week sprint to redesign a high-impact landing page.',
      budget: '$3,200',
      duration: '2 weeks',
    });

    await AutoAssignQueueEntry.bulkCreate([
      {
        targetType: 'project',
        targetId: project.id,
        freelancerId: freelancer.id,
        score: 0.94,
        priorityBucket: 1,
        status: 'pending',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        metadata: {
          projectName: 'E-commerce redesign',
          breakdown: { expertiseMatch: 0.91, newFreelancerScore: 0.33 },
        },
      },
      {
        targetType: 'project',
        targetId: project.id,
        freelancerId: teammate.id,
        score: 0.81,
        priorityBucket: 2,
        status: 'accepted',
      },
      {
        targetType: 'gig',
        targetId: gig.id,
        freelancerId: freelancer.id,
        score: 0.88,
        priorityBucket: 1,
        status: 'accepted',
      },
    ]);

    await ProjectAssignmentEvent.create({
      projectId: project.id,
      actorId: freelancer.id,
      eventType: 'milestone_completed',
      payload: { milestone: 'Discovery workshop complete' },
    });

    const thread = await MessageThread.create({
      subject: 'Contract compliance review',
      channelType: 'support',
      createdBy: client.id,
    });

    await SupportCase.create({
      threadId: thread.id,
      status: 'in_progress',
      priority: 'high',
      reason: 'Client requested additional NDA review',
      escalatedBy: freelancer.id,
      escalatedAt: buildDateOffset(2),
      assignedTo: teammate.id,
    });

    const referenceSeed = crypto.randomUUID();
    const escrowAccount = await EscrowAccount.create({
      userId: freelancer.id,
      provider: 'stripe',
      externalId: `acct-${referenceSeed}`,
      status: 'active',
      currencyCode: 'USD',
    });

    await EscrowTransaction.bulkCreate([
      {
        accountId: escrowAccount.id,
        reference: `${referenceSeed}-1`,
        type: 'project',
        status: 'released',
        amount: 12500,
        netAmount: 12000,
        currencyCode: 'USD',
        initiatedById: client.id,
        counterpartyId: freelancer.id,
        projectId: project.id,
        milestoneLabel: 'Sprint 1 completion',
        releasedAt: buildDateOffset(5),
      },
      {
        accountId: escrowAccount.id,
        reference: `${referenceSeed}-2`,
        type: 'gig',
        status: 'in_escrow',
        amount: 3200,
        netAmount: 3100,
        currencyCode: 'USD',
        initiatedById: client.id,
        counterpartyId: freelancer.id,
        gigId: gig.id,
        milestoneLabel: 'Kickoff deposit',
        scheduledReleaseAt: buildDateOffset(-2),
      },
    ]);

    await Notification.bulkCreate([
      {
        userId: freelancer.id,
        category: 'project',
        type: 'project.milestone',
        title: 'Client approved sprint deliverables',
        body: 'Feedback logged and payout released to your escrow.',
        status: 'delivered',
        deliveredAt: buildDateOffset(1),
      },
      {
        userId: freelancer.id,
        category: 'system',
        type: 'system.digest',
        title: 'Weekly insights ready',
        body: 'Review the performance dashboard for proactive follow-ups.',
        status: 'pending',
      },
    ]);

    if (await ProfileEngagementJob.count()) {
      await ProfileEngagementJob.destroy({ where: {} });
    }

    const freelancerProfile = await Profile.findOne({
      where: { userId: freelancer.id },
    });

    await ProfileEngagementJob.create({
      profileId: freelancerProfile.id,
      status: 'pending',
      priority: 1,
      scheduledAt: buildDateOffset(-1),
      reason: 'Check-in with client on sprint scope',
      metadata: { action: 'Send progress recap to client', channel: 'email' },
    });
  });

  it('builds a comprehensive freelancer dashboard view', async () => {
    const dashboard = await getFreelancerDashboard(freelancer.id, { bypassCache: true });

    expect(dashboard.profile).toBeTruthy();
    expect(dashboard.summary.activeProjects).toBeGreaterThan(0);
    expect(dashboard.summary.gigEngagements).toBe(1);
    expect(dashboard.summary.queuePending).toBe(1);
    expect(dashboard.summary.monthlyRevenue).toBeGreaterThan(0);
    expect(dashboard.summary.currency).toBe('USD');

    expect(dashboard.queue.entries).toHaveLength(2);
    const opportunity = dashboard.queue.entries.find(
      (entry) => entry.targetType === 'project',
    );
    expect(opportunity).toBeDefined();
    expect(opportunity.projectName).toContain('E-commerce redesign');

    const finances = dashboard.finances.ledger;
    expect(finances.released).toBeGreaterThan(0);
    expect(finances.outstanding).toBeGreaterThan(0);

    expect(dashboard.projects.active[0].assignments.pending).toBe(1);
    expect(dashboard.projects.timeline).toHaveLength(1);

    expect(dashboard.support.cases[0].status).toBe('in_progress');
    expect(dashboard.notifications.recent.length).toBeGreaterThanOrEqual(1);

    expect(dashboard.tasks.engagements[0].action).toContain('progress');
    expect(dashboard.tasks.nextAction).toBeTruthy();
  });
});

