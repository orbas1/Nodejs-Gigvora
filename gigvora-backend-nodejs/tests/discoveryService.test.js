import { describe, beforeEach, it, expect } from '@jest/globals';
import {
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  MentorProfile,
} from '../src/models/index.js';
import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
  listMentors,
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
      MentorProfile.create({
        slug: 'jordan-mentor',
        name: 'Jordan Mentor',
        headline: 'Product leadership mentor',
        bio: 'Helps product leads align on strategy and storytelling.',
        region: 'London, United Kingdom',
        discipline: 'Product Leadership',
        expertise: ['Roadmapping', 'Storytelling'],
        sessionFeeAmount: 250,
        sessionFeeCurrency: 'GBP',
        priceTier: 'tier_growth',
        availabilityStatus: 'open',
        availabilityNotes: 'Tuesday deep dives, async Friday reviews.',
        responseTimeHours: 6,
        reviewCount: 28,
        rating: 4.9,
        verificationBadge: 'Verified mentor',
        packages: [
          {
            name: 'Leadership Sprint',
            description: 'Six-week programme with playbooks and async feedback.',
            currency: 'GBP',
            price: 1600,
          },
        ],
        promoted: true,
        rankingScore: 97.2,
      }),
      MentorProfile.create({
        slug: 'amira-mentor',
        name: 'Amira Mentor',
        headline: 'Revenue operations coach',
        bio: 'Coaches GTM leaders on forecasting and enablement.',
        region: 'Singapore',
        discipline: 'Revenue Operations',
        expertise: ['Forecasting', 'Enablement'],
        sessionFeeAmount: 140,
        sessionFeeCurrency: 'USD',
        priceTier: 'tier_entry',
        availabilityStatus: 'waitlist',
        responseTimeHours: 18,
        reviewCount: 19,
        rating: 4.8,
        packages: [
          {
            name: 'GTM Diagnostic',
            description: 'Four-week pipeline review and playbook design.',
            currency: 'USD',
            price: 3200,
          },
        ],
        promoted: false,
        rankingScore: 88.4,
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

  it('lists mentors with filters, pagination metadata, and facets', async () => {
    const mentors = await listMentors({
      query: 'mentor',
      filters: { priceTier: ['tier_growth'], availability: ['open'] },
      includeFacets: true,
      pageSize: 5,
    });

    expect(mentors.items).toHaveLength(1);
    expect(mentors.total).toBe(1);
    expect(mentors.meta.hasMore).toBe(false);
    expect(mentors.items[0]).toMatchObject({
      name: 'Jordan Mentor',
      priceTier: 'tier_growth',
      availabilityStatus: 'open',
      sessionFee: { amount: 250, currency: '£' },
      isVerified: true,
    });
    expect(mentors.facets.discipline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Product Leadership' }),
      ]),
    );
    expect(mentors.facets.priceTier).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'tier_entry' }),
        expect.objectContaining({ value: 'tier_growth' }),
      ]),
    );
    expect(mentors.appliedFilters.priceTier).toEqual(['tier_growth']);
  });
});
