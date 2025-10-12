import { describe, expect, it, beforeEach } from '@jest/globals';
import profileService from '../src/services/profileService.js';
import {
  Profile,
  ProfileReference,
  Group,
  GroupMembership,
  Connection,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

async function bootstrapProfileFixtures() {
  const user = await createUser({
    firstName: 'Lina',
    lastName: 'Builder',
    userType: 'freelancer',
  });

  const profile = await Profile.create({
    userId: user.id,
    headline: 'Product Engineer',
    bio: 'Ships resilient marketplaces with analytics instrumentation.',
    skills: 'Node.js,React,TypeScript,Analytics',
    experience: '6 years delivering talent platforms and launchpad cohorts.',
    education: 'BSc Computer Science',
    location: 'Remote • Amsterdam, NL',
    timezone: 'Europe/Amsterdam',
    missionStatement: 'Build trusted marketplaces that put fairness and transparency first.',
    areasOfFocus: ['Marketplace reliability', 'Auto-assign fairness'],
    availabilityStatus: 'available',
    availableHoursPerWeek: 24,
    openToRemote: true,
    availabilityNotes: 'Prefers async pods with EU/US overlap.',
    trustScore: 4.7,
    likesCount: 32,
    followersCount: 410,
    qualifications: [
      { title: 'AWS Architect Associate', authority: 'Amazon', year: 2021 },
    ],
    experienceEntries: [
      {
        organization: 'Blue Orbit Labs',
        role: 'Lead Engineer',
        startDate: '2022-01-01',
        description: 'Scaled discovery experience across three markets.',
        highlights: ['Introduced Meilisearch relevance tuning', 'Cut regression hotfixes by 45%'],
      },
    ],
    statusFlags: [
      'launchpad_alumni',
      'mentor',
      'volunteer_active',
      'verified',
      'kyc_verified',
      'preferred_talent',
      'jobs_board_featured',
      'safeguarded_volunteer',
    ],
    launchpadEligibility: {
      status: 'active',
      score: 91.2,
      cohorts: ['Launchpad Cohort A', 'Launchpad Cohort B'],
      track: 'Marketplace Engineering',
    },
    volunteerBadges: ['community_mentor', 'impact_champion'],
    portfolioLinks: [{ label: 'Portfolio', url: 'https://portfolio.lina.example.com' }],
    preferredEngagements: ['Launch readiness', 'Mentorship'],
    collaborationRoster: [{ name: 'Nova Strategist', role: 'Product Strategy' }],
    impactHighlights: [
      { title: 'Auto-assign wins', value: '4 in a row', description: 'Maintained 95% CSAT across sprints.' },
      { title: 'Volunteer hours', value: '120', description: 'Weekly mentorship clinic for launchpad cohorts.' },
      { title: 'Placement rate', value: '92%', description: 'Filled 11 mission-critical roles in 2024.' },
    ],
    pipelineInsights: [
      {
        project: 'Trust Center analytics',
        payout: '$2,400',
        countdown: '06:00:00',
        status: 'Interview Scheduled',
      },
      {
        project: 'Escrow observability',
        payout: '$3,600',
        countdown: '04:00:00',
        status: 'Hired',
      },
      {
        project: 'Volunteer intake playbook',
        payout: '$1,200',
        countdown: '02:00:00',
        status: 'Shortlist Review',
      },
    ],
    profileCompletion: 88.2,
    avatarSeed: 'Lina Builder',
  });

  await ProfileReference.create({
    profileId: profile.id,
    referenceName: 'Mia Operations',
    relationship: 'Operations Lead',
    company: 'Gigvora Studios',
    email: 'mia.ops@example.com',
    endorsement: 'Lina restored trust centre uptime and partnered on dispute automation.',
    isVerified: true,
    weight: 0.85,
    lastInteractedAt: '2024-08-01T12:00:00Z',
  });

  await ProfileReference.create({
    profileId: profile.id,
    referenceName: 'Jon Hiring',
    relationship: 'Hiring Manager',
    company: 'Blue Orbit Labs',
    email: 'jon.hiring@example.com',
    endorsement: 'Guided jobs board automation rollout and closed four priority hires.',
    isVerified: false,
    weight: 0.6,
    lastInteractedAt: '2024-05-15T08:00:00Z',
  });

  const group = await Group.create({
    name: 'Gigvora Product Council',
    description: 'Cross-squad council focusing on reliability and launch readiness.',
  });
  await GroupMembership.create({ userId: user.id, groupId: group.id, role: 'member' });
  const peer = await createUser({ userType: 'company' });
  await Connection.create({
    requesterId: user.id,
    addresseeId: peer.id,
    status: 'accepted',
  });

  return { user, profile };
}

describe('profileService', () => {
  let user;

  beforeEach(async () => {
    // Ensure fixtures are created fresh for each test
    ({ user } = await bootstrapProfileFixtures());
  });

  it('returns an aggregated overview with derived metrics and associations', async () => {
    const profileOverview = await profileService.getProfileOverview(user.id);

    expect(profileOverview.name).toBe('Lina Builder');
    expect(profileOverview.skills).toEqual(expect.arrayContaining(['Node.js', 'React', 'TypeScript', 'Analytics']));
    expect(profileOverview.references).toHaveLength(2);
    expect(profileOverview.metrics.trustScore).toBeCloseTo(80.15, 2);
    expect(profileOverview.metrics.connectionsCount).toBe(1);
    expect(profileOverview.groups[0]).toMatchObject({ name: 'Gigvora Product Council', role: 'member' });
    expect(profileOverview.availability.status).toBe('available');
    expect(profileOverview.launchpadEligibility.status).toBe('active');
    expect(profileOverview.autoAssignInsights).toHaveLength(3);

    const breakdownKeys = profileOverview.metrics.trustScoreBreakdown.map((item) => item.key);
    expect(breakdownKeys).toEqual(
      expect.arrayContaining([
        'profile_foundation',
        'social_proof',
        'launchpad_readiness',
        'volunteer_commitment',
        'jobs_delivery',
        'availability_signal',
        'compliance',
      ]),
    );
    expect(profileOverview.metrics.trustScoreBreakdown).toHaveLength(7);

    const breakdownTotal = profileOverview.metrics.trustScoreBreakdown.reduce(
      (total, item) => total + item.contribution,
      0,
    );
    expect(breakdownTotal).toBeCloseTo(profileOverview.metrics.trustScore, 1);
    expect(profileOverview.metrics.trustScoreLevel).toMatch(/platinum|gold/);
    expect(profileOverview.metrics.trustScoreRecommendedReviewAt).toBeTruthy();
  });

  it('updates availability settings and recalculates completion metrics', async () => {
    const updated = await profileService.updateProfileAvailability(user.id, {
      availabilityStatus: 'on_leave',
      availableHoursPerWeek: 0,
      openToRemote: false,
      focusAreas: ['Sabbatical'],
    });

    expect(updated.availability.status).toBe('on_leave');
    expect(updated.availability.hoursPerWeek).toBe(0);
    expect(updated.availability.openToRemote).toBe(false);
    expect(updated.availability.focusAreas).toEqual(['Sabbatical']);

    const reloaded = await Profile.findOne({ where: { userId: user.id } });
    expect(reloaded.availabilityStatus).toBe('on_leave');
    expect(reloaded.availableHoursPerWeek).toBe(0);
    expect(reloaded.openToRemote).toBe(false);
    expect(Array.isArray(reloaded.areasOfFocus)).toBe(true);
    expect(reloaded.areasOfFocus).toContain('Sabbatical');
    expect(Number(reloaded.profileCompletion)).toBeGreaterThanOrEqual(70);
  });

  it('rejects unsupported availability statuses', async () => {
    await expect(
      profileService.updateProfileAvailability(user.id, { availabilityStatus: 'vacation_mode' }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
