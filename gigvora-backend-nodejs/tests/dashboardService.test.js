import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AutoAssignQueueEntry,
  FreelancerAssignmentMetric,
  Project,
  ProjectAssignmentEvent,
  SearchSubscription,
} from '../src/models/index.js';
import { getDashboardOverview } from '../src/services/dashboardService.js';
import { createUser } from './helpers/factories.js';

const DAY = 24 * 60 * 60 * 1000;

describe('dashboardService', () => {
  let owner;
  let freelancer;

  beforeEach(async () => {
    await AutoAssignQueueEntry.destroy({ where: {} });
    await FreelancerAssignmentMetric.destroy({ where: {} });
    await ProjectAssignmentEvent.destroy({ where: {} });
    await SearchSubscription.destroy({ where: {} });
    await Project.destroy({ where: {} });

    owner = await createUser({ userType: 'user', firstName: 'Clara', lastName: 'Owner' });
    freelancer = await createUser({ userType: 'freelancer', firstName: 'Milo', lastName: 'Maker' });
  });

  it('summarises project ownership and queue telemetry for clients', async () => {
    const project = await Project.create({
      ownerId: owner.id,
      title: 'Rebrand campaign',
      description: 'Launch Gigvora marketing refresh.',
      status: 'open',
      budgetAmount: 12000,
      budgetCurrency: 'USD',
      autoAssignEnabled: true,
      autoAssignStatus: 'queue_active',
    });

    await SearchSubscription.create({
      userId: owner.id,
      name: 'Brand strategists',
      category: 'gig',
      query: 'branding',
      frequency: 'weekly',
      notifyByEmail: true,
      notifyInApp: true,
    });

    const queueEntry = await AutoAssignQueueEntry.create({
      targetType: 'project',
      targetId: project.id,
      freelancerId: freelancer.id,
      status: 'notified',
      score: 0.82,
      priorityBucket: 1,
      projectValue: 12000,
      notifiedAt: new Date(Date.now() - 2 * DAY),
    });

    await ProjectAssignmentEvent.create({
      projectId: project.id,
      actorId: owner.id,
      eventType: 'auto_assign_queue_generated',
      payload: { queueSize: 1 },
    });

    const overview = await getDashboardOverview(owner.id);

    expect(overview.user.id).toBe(owner.id);
    expect(overview.summary.activeProjects).toBeGreaterThanOrEqual(1);
    expect(overview.queue.projects.totalEntries).toBe(1);
    expect(overview.queue.projects.stats.notified).toBe(1);
    expect(overview.projects.items[0]).toMatchObject({ id: project.id, ownerId: owner.id });
    expect(overview.savedSearches.total).toBe(1);
    expect(overview.activity.events[0]).toMatchObject({ projectId: project.id });
    expect(overview.queue.projects.queues[0].entries[0].id).toBe(queueEntry.id);
  });

  it('includes assignment metrics and queue entries for freelancers', async () => {
    await FreelancerAssignmentMetric.create({
      freelancerId: freelancer.id,
      rating: 4.6,
      completionRate: 0.9,
      avgAssignedValue: 2000,
      totalAssigned: 8,
      totalCompleted: 7,
      lastAssignedAt: new Date(Date.now() - 10 * DAY),
      lastCompletedAt: new Date(Date.now() - 4 * DAY),
    });

    const project = await Project.create({
      ownerId: owner.id,
      title: 'Analytics pipeline build',
      description: 'Implement Snowflake + dbt warehouse.',
      status: 'in_progress',
      budgetAmount: 18000,
      autoAssignEnabled: true,
      autoAssignStatus: 'queue_active',
    });

    await AutoAssignQueueEntry.bulkCreate([
      {
        targetType: 'project',
        targetId: project.id,
        freelancerId: freelancer.id,
        status: 'pending',
        score: 0.76,
        priorityBucket: 1,
        projectValue: 18000,
        notifiedAt: new Date(Date.now() - 3 * DAY),
      },
      {
        targetType: 'project',
        targetId: project.id,
        freelancerId: freelancer.id,
        status: 'notified',
        score: 0.88,
        priorityBucket: 1,
        projectValue: 18000,
        notifiedAt: new Date(Date.now() - 1 * DAY),
      },
    ]);

    const overview = await getDashboardOverview(freelancer.id);

    expect(overview.user.id).toBe(freelancer.id);
    expect(overview.focus).toBe('freelancer');
    expect(overview.queue.freelancer.totalEntries).toBe(2);
    expect(overview.queue.freelancer.stats.notified).toBe(1);
    expect(overview.user.assignmentMetric).toMatchObject({ totalAssigned: 8, rating: expect.any(Number) });
  });
});
