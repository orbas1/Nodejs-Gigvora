import { beforeEach, describe, expect, test } from '@jest/globals';
import { ValidationError, NotFoundError } from '../../src/utils/errors.js';
import {
  User,
  Profile,
  CommunitySpotlight,
  CommunitySpotlightHighlight,
  CommunitySpotlightAsset,
  CommunitySpotlightNewsletterFeature,
} from '../../src/models/index.js';
import { appCache } from '../../src/utils/cache.js';
import { getFreelancerSpotlight } from '../../src/services/communitySpotlightService.js';

beforeEach(() => {
  appCache.flushByPrefix('communitySpotlight:freelancer');
});

async function createFreelancerProfile({
  firstName = 'Casey',
  lastName = 'Rowe',
  email = 'casey@example.com',
} = {}) {
  const user = await User.create({
    firstName,
    lastName,
    email,
    password: 'hashed-password',
    userType: 'freelancer',
  });

  const profile = await Profile.create({
    userId: user.id,
    headline: 'Fractional CTO & Community Builder',
    location: 'Remote • Global',
    timezone: 'UTC',
    availabilityStatus: 'available',
    availabilityNotes: 'Accepting product leadership pods.',
    availabilityUpdatedAt: new Date('2024-04-05T12:00:00Z'),
    statusFlags: ['Gigvora Elite'],
    volunteerBadges: ['Mentor'],
    followersCount: 1280,
    likesCount: 312,
  });

  return { user, profile };
}

async function createSpotlight({ profileId, status = 'published' }) {
  const spotlight = await CommunitySpotlight.create({
    profileId,
    status,
    heroTitle: 'Community architect spotlight',
    tagline: 'Empowering founders through inclusive marketplaces',
    summary: 'Curated achievements, marketing assets, and automation for the leadership spotlight.',
    campaignName: '2024 Creator Impact',
    bannerImageUrl: 'https://cdn.example.com/spotlight/banner.png',
    brandColor: '#2563EB',
    primaryCtaLabel: 'View case study',
    primaryCtaUrl: 'https://gigvora.com/case-study',
    secondaryCtaLabel: 'Share spotlight',
    secondaryCtaUrl: 'https://gigvora.com/share',
    shareKitUrl: 'https://cdn.example.com/spotlight/share-kit.zip',
    metricsSnapshot: {
      reach: { value: 18250, change: 0.12, period: 'vs. last launch' },
      newsletterCtr: { value: 0.38, change: -0.04, period: 'vs. prior send' },
      assetDownloads: { value: 54, change: 0.2, period: 'last 7 days' },
    },
    newsletterFeatureEnabled: true,
    newsletterAutomationConfig: {
      cadence: 'weekly',
      sendDay: 'tuesday',
      segments: ['investors', 'partners'],
      distributionChannels: ['email', 'in-app'],
      lastSyncedAt: '2024-04-05T12:00:00Z',
    },
    publishedAt: status === 'published' ? new Date('2024-04-04T00:00:00Z') : null,
    featuredUntil: status === 'published' ? new Date('2024-04-18T00:00:00Z') : null,
  });

  await CommunitySpotlightHighlight.create({
    spotlightId: spotlight.id,
    category: 'speaking',
    title: 'Keynote: Building resilient communities',
    description: 'Headlined the Global Freelance Summit with a keynote on inclusive marketplaces.',
    impactStatement: '2.3k live attendees and 18k async views',
    occurredOn: new Date('2024-03-10'),
    ctaLabel: 'Watch replay',
    ctaUrl: 'https://gigvora.com/replay',
    ordinal: 1,
    metadata: { stage: 'main' },
  });

  await CommunitySpotlightAsset.create({
    spotlightId: spotlight.id,
    assetType: 'social',
    channel: 'LinkedIn',
    name: 'LinkedIn carousel',
    description: 'Five-frame carousel optimised for founder audiences.',
    format: 'PNG',
    downloadUrl: 'https://cdn.example.com/assets/linkedin-carousel.zip',
    previewUrl: 'https://cdn.example.com/assets/linkedin-carousel-preview.png',
    readyForUse: true,
  });

  await CommunitySpotlightNewsletterFeature.bulkCreate([
    {
      spotlightId: spotlight.id,
      status: 'sent',
      editionDate: new Date('2024-04-02T00:00:00Z'),
      editionName: 'Weekly Builder Pulse',
      subjectLine: 'Inside the community spotlight',
      performanceMetrics: { clickRate: 0.42 },
      callToActionLabel: 'Discover the story',
      callToActionUrl: 'https://gigvora.com/newsletter/april',
    },
    {
      spotlightId: spotlight.id,
      status: 'scheduled',
      editionDate: new Date('2024-04-09T00:00:00Z'),
      editionName: 'Founder Dispatch',
      callToActionLabel: 'Read preview',
      callToActionUrl: 'https://gigvora.com/newsletter/april-week2',
    },
  ]);

  return spotlight;
}

describe('getFreelancerSpotlight', () => {
  test('requires either a userId or profileId', async () => {
    await expect(getFreelancerSpotlight()).rejects.toBeInstanceOf(ValidationError);
  });

  test('throws a not found error when the profile is missing', async () => {
    await expect(getFreelancerSpotlight({ profileId: 9999 })).rejects.toBeInstanceOf(NotFoundError);
  });

  test('returns spotlight data with metrics, highlights, assets, and newsletter automation', async () => {
    const { profile, user } = await createFreelancerProfile();
    await createSpotlight({ profileId: profile.id, status: 'published' });

    const result = await getFreelancerSpotlight({ profileId: profile.id });

    expect(result.profile).toEqual(
      expect.objectContaining({
        id: profile.id,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        headline: profile.headline,
        badges: expect.arrayContaining(['Gigvora Elite']),
      }),
    );
    expect(result.spotlight).not.toBeNull();
    expect(result.spotlight.performanceSummary).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'reach', value: 18250 })]),
    );
    expect(result.spotlight.highlights).toEqual(
      expect.arrayContaining([expect.objectContaining({ category: 'speaking' })]),
    );
    expect(result.spotlight.assets).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'LinkedIn carousel' })]),
    );
    expect(result.spotlight.newsletter.latest).toEqual(expect.objectContaining({ status: 'sent' }));
    expect(result.spotlight.newsletter.upcoming).toEqual(expect.objectContaining({ status: 'scheduled' }));
    expect(result.spotlight.newsletter.automation).toEqual(
      expect.objectContaining({ enabled: true, cadence: 'weekly', segments: expect.arrayContaining(['investors']) }),
    );
  });

  test('excludes drafts unless includeDraft is set', async () => {
    const { profile, user } = await createFreelancerProfile({
      email: 'draft@example.com',
      firstName: 'Devon',
      lastName: 'Builder',
    });
    await createSpotlight({ profileId: profile.id, status: 'draft' });

    const withoutDraft = await getFreelancerSpotlight({ profileId: profile.id });
    expect(withoutDraft.spotlight).toBeNull();

    const withDraft = await getFreelancerSpotlight({ userId: user.id, includeDraft: true });
    expect(withDraft.spotlight).not.toBeNull();
    expect(withDraft.spotlight.status).toBe('draft');
  });
});
