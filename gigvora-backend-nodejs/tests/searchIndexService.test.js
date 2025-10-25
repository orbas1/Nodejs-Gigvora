import { describe, beforeEach, it, expect } from '@jest/globals';
import '../tests/setupTestEnv.js';
import {
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  syncOpportunityIndexes,
  ensureOpportunityIndexes,
  isSearchConfigured,
} from '../src/services/searchIndexService.js';
import {
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
} from '../src/models/index.js';

async function seedOpportunities() {
  await Job.create({
    title: 'Senior Product Designer',
    description: 'Remote friendly design role',
    location: 'Remote - UK',
    employmentType: 'Full-time',
  });
  await Job.create({
    title: 'Operations Lead',
    description: 'Hybrid role in London',
    location: 'London, UK',
    employmentType: 'Contract',
  });

  await Gig.create({
    title: 'Marketing sprint',
    description: '90 day growth engagement',
    duration: '3 months',
    location: 'Remote',
    budget: '£4500',
  });
  await Gig.create({
    title: 'Illustration refresh',
    description: 'On-site collaboration',
    duration: '6 weeks',
    location: 'Berlin, Germany',
    budget: '€2100',
  });

  await Project.create({
    title: 'Platform revamp',
    description: 'Modernise the internal tooling',
    status: 'active',
  });

  await ExperienceLaunchpad.create({
    title: 'Growth accelerator cohort',
    description: 'Twelve week remote programme',
    track: 'growth',
    location: 'Remote',
  });

  await Volunteering.create({
    title: 'Community mentor',
    description: 'Support local founders',
    organization: 'Founders Collective',
    location: 'Remote',
  });
}

describe('searchIndexService (internal search)', () => {
  beforeEach(async () => {
    await seedOpportunities();
  });

  it('marks search as configured and ensures indexes without external services', async () => {
    expect(isSearchConfigured()).toBe(true);
    await expect(ensureOpportunityIndexes()).resolves.toEqual({ configured: true, indexes: [] });
    await expect(syncOpportunityIndexes()).resolves.toEqual({ configured: true, indexes: [] });
  });

  it('returns paginated opportunity results for a category', async () => {
    const result = await searchOpportunityIndex('job', { query: 'design', page: 1, pageSize: 5 });
    expect(result.total).toBe(1);
    expect(result.hits[0].title).toContain('Product Designer');
    expect(result.hits[0].employmentType).toBe('Full-time');
    expect(result.metrics).toBeUndefined();
  });

  it('applies structured filters for gigs', async () => {
    const result = await searchOpportunityIndex('gig', {
      filters: { location: 'Berlin, Germany' },
      page: 1,
      pageSize: 10,
    });
    expect(result.total).toBe(1);
    expect(result.hits[0].title).toBe('Illustration refresh');
    const remoteResult = await searchOpportunityIndex('gig', {
      filters: { isRemote: true },
      page: 1,
      pageSize: 10,
    });
    expect(remoteResult.total).toBe(1);
    expect(remoteResult.hits[0].title).toBe('Marketing sprint');
  });

  it('aggregates searches across categories', async () => {
    const aggregated = await searchAcrossOpportunityIndexes('remote');
    expect(aggregated.job.length).toBeGreaterThan(0);
    expect(aggregated.gig.length).toBeGreaterThan(0);
    expect(Array.isArray(aggregated.project)).toBe(true);
  });

  it('gracefully handles unknown categories', async () => {
    await expect(searchOpportunityIndex('unknown', {})).resolves.toBeNull();
  });
});
