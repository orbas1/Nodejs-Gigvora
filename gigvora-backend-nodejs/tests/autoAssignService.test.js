import { describe, it, expect } from '@jest/globals';
import {
  scoreFreelancerForProject,
  buildAssignmentQueue,
  listFreelancerQueue,
  resolveQueueEntry,
} from '../src/services/autoAssignService.js';
import { Project, FreelancerAssignmentMetric } from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

const DAY = 24 * 60 * 60 * 1000;

describe('autoAssignService', () => {
  it('calculates higher scores for freelancers waiting longer with balanced earnings', () => {
    const now = new Date();
    const projectValue = 1500;

    const busyFreelancerScore = scoreFreelancerForProject({
      metrics: {
        lastAssignedAt: new Date(now.getTime() - 5 * DAY),
        lastCompletedAt: new Date(now.getTime() - 4 * DAY),
        totalAssigned: 18,
        totalCompleted: 17,
        rating: 4.9,
        completionRate: 0.95,
        avgAssignedValue: 4000,
      },
      projectValue,
      freelancerCreatedAt: new Date(now.getTime() - 365 * DAY),
      now,
    });

    const emergingFreelancerScore = scoreFreelancerForProject({
      metrics: {
        lastAssignedAt: null,
        lastCompletedAt: null,
        totalAssigned: 0,
        totalCompleted: 0,
        rating: 4.2,
        completionRate: 0.8,
        avgAssignedValue: 1200,
      },
      projectValue,
      freelancerCreatedAt: new Date(now.getTime() - 15 * DAY),
      now,
    });

    expect(emergingFreelancerScore.score).toBeGreaterThan(busyFreelancerScore.score);
    expect(emergingFreelancerScore.priorityBucket).toBeLessThanOrEqual(busyFreelancerScore.priorityBucket);
    expect(emergingFreelancerScore.breakdown.newFreelancerScore).toBeGreaterThan(0.5);
  });

  it('builds queued assignments, updates metrics, and advances the next freelancer on acceptance', async () => {
    const project = await Project.create({
      title: 'Marketplace instrumentation',
      description: 'Implement analytics foundations for the Gigvora marketplace.',
      status: 'open',
    });

    const seasoned = await createUser({ userType: 'freelancer', firstName: 'Seasoned', lastName: 'Pro' });
    const newcomer = await createUser({ userType: 'freelancer', firstName: 'Nova', lastName: 'Maker' });

    await seasoned.update({ createdAt: new Date(Date.now() - 400 * DAY) });
    await newcomer.update({ createdAt: new Date(Date.now() - 10 * DAY) });

    await FreelancerAssignmentMetric.bulkCreate([
      {
        freelancerId: seasoned.id,
        rating: 4.85,
        completionRate: 0.92,
        avgAssignedValue: 5000,
        totalAssigned: 22,
        totalCompleted: 20,
        lastAssignedAt: new Date(Date.now() - 7 * DAY),
        lastCompletedAt: new Date(Date.now() - 6 * DAY),
      },
      {
        freelancerId: newcomer.id,
        rating: 4.4,
        completionRate: 0.88,
        avgAssignedValue: 1100,
        totalAssigned: 1,
        totalCompleted: 1,
        lastAssignedAt: new Date(Date.now() - 120 * DAY),
        lastCompletedAt: new Date(Date.now() - 120 * DAY),
      },
    ]);

    const queue = await buildAssignmentQueue({
      targetType: 'project',
      targetId: project.id,
      projectValue: 1500,
      limit: 2,
      actorId: 99,
    });

    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({ status: 'notified', freelancer: expect.objectContaining({ id: newcomer.id }) });
    expect(queue[1]).toMatchObject({ status: 'pending', freelancer: expect.objectContaining({ id: seasoned.id }) });
    expect(queue[0].breakdown).toHaveProperty('recencyScore');

    const newcomerMetrics = await FreelancerAssignmentMetric.findOne({ where: { freelancerId: newcomer.id } });
    expect(newcomerMetrics.totalAssigned).toBeGreaterThanOrEqual(2);
    expect(newcomerMetrics.lastAssignedAt).toBeInstanceOf(Date);

    await resolveQueueEntry(queue[0].id, 'accepted', { freelancerId: newcomer.id, rating: 4.8, completionValue: 1800 });

    const updatedMetrics = await FreelancerAssignmentMetric.findOne({ where: { freelancerId: newcomer.id } });
    expect(updatedMetrics.totalCompleted).toBeGreaterThanOrEqual(2);
    expect(Number(updatedMetrics.completionRate)).toBeGreaterThan(0.8);

    const refreshedQueue = await listFreelancerQueue({ freelancerId: seasoned.id });
    expect(refreshedQueue.entries[0]).toMatchObject({ status: 'notified', freelancerId: seasoned.id });
  });
});
