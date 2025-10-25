import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { pathToFileURL } from 'url';
import path from 'path';

let scoreFreelancerForProject;

beforeAll(async () => {
  jest.resetModules();
  const servicePath = pathToFileURL(path.resolve(process.cwd(), 'src/services/autoAssignService.js')).href;
  const modelsStub = {
    sequelize: {
      transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
    },
    User: {},
    Project: {},
    FreelancerAssignmentMetric: {},
    AutoAssignQueueEntry: {},
    AutoAssignResponse: {},
    FreelancerAutoMatchPreference: {},
    APPLICATION_TARGET_TYPES: ['project', 'gig', 'workspace'],
    AUTO_ASSIGN_STATUSES: ['pending', 'notified', 'accepted', 'declined', 'reassigned', 'expired'],
  };
  jest.unstable_mockModule(pathToFileURL(path.resolve(process.cwd(), 'src/models/index.js')).href, () => modelsStub);
  const serviceModule = await import(servicePath);
  scoreFreelancerForProject = serviceModule.scoreFreelancerForProject;
});

describe('autoAssignService', () => {
  it('elevates emerging freelancers while keeping confidence grounded by available signals', () => {
    const now = new Date();
    const projectValue = 1600;

    const experienced = scoreFreelancerForProject({
      metrics: {
        lastAssignedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastCompletedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        totalAssigned: 14,
        totalCompleted: 13,
        rating: 4.9,
        completionRate: 0.96,
        avgAssignedValue: 4200,
      },
      projectValue,
      freelancerCreatedAt: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
      now,
    });

    const newcomer = scoreFreelancerForProject({
      metrics: {
        lastAssignedAt: null,
        lastCompletedAt: null,
        totalAssigned: 0,
        totalCompleted: 0,
        rating: 4.3,
        completionRate: 0.82,
        avgAssignedValue: 1100,
      },
      projectValue,
      freelancerCreatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      now,
    });

    expect(newcomer.score).toBeGreaterThan(experienced.score);
    expect(newcomer.priorityBucket).toBeLessThanOrEqual(experienced.priorityBucket);
    expect(experienced.confidence).toBeGreaterThan(newcomer.confidence);
    expect(experienced.confidence).toBeGreaterThan(0.6);
    expect(newcomer.confidence).toBeGreaterThan(0.3);
    expect(newcomer.breakdown.signalCoverage).toBeLessThan(experienced.breakdown.signalCoverage);
  });
});
