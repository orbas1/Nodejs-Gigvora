import { describe, beforeEach, it, expect } from '@jest/globals';
import './setupTestEnv.js';
import {
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
} from '../src/models/index.js';
import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
} from '../src/services/discoveryService.js';

function createDateOffset(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

describe('discoveryService', () => {
  beforeEach(async () => {
    const now = new Date();
    await Promise.all([
      Job.create({
        title: 'Product Designer',
        description: 'Craft intuitive experiences with analytics instrumentation.',
        location: 'Remote',
        employmentType: 'Full-time',
        createdAt: createDateOffset(90),
        updatedAt: createDateOffset(90),
      }),
      Job.create({
        title: 'Data Reliability Engineer',
        description: 'Owns analytics pipelines and proactive anomaly detection.',
        location: 'London',
        employmentType: 'Contract',
        createdAt: createDateOffset(30),
        updatedAt: createDateOffset(30),
      }),
      Gig.create({
        title: 'Landing Page Revamp',
        description: 'Refresh marketing site with conversion experiments.',
        budget: '$4,500',
        duration: '5 weeks',
        createdAt: now,
        updatedAt: now,
      }),
      Project.create({
        title: 'Community Growth Initiative',
        description: 'Launch groups to connect freelancers across industries.',
        status: 'Planning',
        createdAt: now,
        updatedAt: now,
      }),
      ExperienceLaunchpad.create({
        title: 'Emerging Leaders Fellowship',
        description: 'Mentorship-driven leadership journey.',
        track: 'Leadership',
        createdAt: now,
        updatedAt: now,
      }),
      Volunteering.create({
        title: 'Open Source Mentor',
        organization: 'Gigvora Foundation',
        description: 'Support early career developers.',
        createdAt: now,
        updatedAt: now,
      }),
    ]);
  });

  it('returns snapshot slices with consistent ordering and totals', async () => {
    const snapshot = await getDiscoverySnapshot({ limit: 1 });

    expect(snapshot.jobs.total).toBe(2);
    expect(snapshot.jobs.items).toHaveLength(1);
    expect(snapshot.jobs.items[0]).toMatchObject({
      title: 'Data Reliability Engineer',
      category: 'job',
      employmentType: 'Contract',
    });

    expect(snapshot.gigs.total).toBe(1);
    expect(snapshot.launchpads.items[0]).toMatchObject({ track: 'Leadership', category: 'launchpad' });
  });

  it('supports filtered listings with pagination metadata', async () => {
    const jobs = await listJobs({ query: 'Engineer', pageSize: 5 });

    expect(jobs.items).toHaveLength(1);
    expect(jobs.total).toBe(1);
    expect(jobs.page).toBe(1);
    expect(jobs.totalPages).toBe(1);
    expect(jobs.items[0]).toMatchObject({
      title: 'Data Reliability Engineer',
      location: 'London',
      category: 'job',
    });
  });

  it('exposes sanitised gig and project records', async () => {
    const gigs = await listGigs();
    const projects = await listProjects();

    expect(gigs.items[0]).toMatchObject({
      title: 'Landing Page Revamp',
      budget: '$4,500',
      category: 'gig',
    });
    expect(projects.items[0]).toMatchObject({
      status: 'Planning',
      category: 'project',
      autoAssignEnabled: false,
      autoAssignStatus: 'inactive',
      autoAssignLastQueueSize: null,
    });
    expect(projects.items[0].autoAssignSettings).toBeNull();
  });
});
