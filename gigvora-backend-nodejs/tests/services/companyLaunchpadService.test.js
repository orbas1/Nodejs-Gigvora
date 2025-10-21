import { describe, beforeEach, it, expect } from '@jest/globals';
import {
  ExperienceLaunchpad,
  Job,
  JobAdvert,
  ProviderWorkspace,
  User,
} from '../../src/models/index.js';
import {
  getLaunchpadJobDashboard,
  linkJobToLaunchpad,
  createLaunchpadPlacement,
} from '../../src/services/companyLaunchpadService.js';

describe('companyLaunchpadService', () => {
  let launchpad;
  let job;
  let workspace;
  let owner;
  let candidate;

  beforeEach(async () => {
    owner = await User.create({
      firstName: 'Owner',
      lastName: 'Example',
      email: `owner-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'company',
    });

    candidate = await User.create({
      firstName: 'Candidate',
      lastName: 'Example',
      email: `candidate-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'user',
    });

    workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Acme Studios',
      slug: `acme-${Date.now()}`,
      type: 'company',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });

    job = await Job.create({
      title: 'Platform Reliability Engineer',
      description: 'Owns uptime and automation for the platform.',
      location: 'Remote',
      employmentType: 'Full-time',
    });

    await JobAdvert.create({
      jobId: job.id,
      workspaceId: workspace.id,
      status: 'open',
      openings: 2,
      remoteType: 'remote',
      currencyCode: 'USD',
      compensationMin: 120000,
      compensationMax: 150000,
      publishedAt: new Date(),
    });

    launchpad = await ExperienceLaunchpad.create({
      title: 'Future Leaders Fellowship',
      description: 'Cohort based upskilling experience.',
      track: 'Leadership',
      status: 'recruiting',
    });
  });

  it('links jobs to launchpads and exposes placement metrics in the dashboard', async () => {
    const link = await linkJobToLaunchpad({
      launchpadId: launchpad.id,
      jobId: job.id,
      source: 'test',
      createdById: owner.id,
      notes: 'Prioritise reliability candidates.',
    });

    expect(link.launchpad.id).toBe(launchpad.id);
    expect(link.job.id).toBe(job.id);

    const placement = await createLaunchpadPlacement(link.id, {
      candidateId: candidate.id,
      status: 'completed',
      placementDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-03-01T00:00:00Z'),
      feedbackScore: 4.5,
      compensation: {
        amount: 96000,
        currency: 'USD',
        cadence: 'year',
        structure: 'salary',
      },
    });

    expect(placement.status).toBe('completed');

    const dashboard = await getLaunchpadJobDashboard({ workspaceId: workspace.id });

    expect(dashboard.summary.totalLinks).toBe(1);
    expect(dashboard.summary.totalPlacements).toBe(1);
    expect(dashboard.totals.completedPlacements).toBe(1);
    expect(dashboard.links).toHaveLength(1);
    expect(dashboard.links[0].metrics.completedPlacements).toBe(1);
    expect(dashboard.links[0].metrics.averageFeedbackScore).toBe(4.5);
    expect(dashboard.lookups.jobs[0]).toMatchObject({ id: job.id, title: job.title });
  });
});
