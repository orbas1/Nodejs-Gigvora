import { Op } from 'sequelize';
import {
  sequelize,
  Profile,
  User,
  CommunitySpotlight,
  CommunitySpotlightHighlight,
  CommunitySpotlightAsset,
  CommunitySpotlightNewsletterFeature,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'communitySpotlight:freelancer';
const CACHE_TTL_SECONDS = 45;

function normalizeIdentifier(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function buildPerformanceSummary(metricsSnapshot) {
  if (!metricsSnapshot || typeof metricsSnapshot !== 'object') {
    return [];
  }

  const preferredKeys = [
    ['reach', { fallbackLabel: 'Spotlight reach', unit: 'impressions' }],
    ['newsletterCtr', { fallbackLabel: 'Newsletter CTR', format: 'percentage' }],
    ['assetDownloads', { fallbackLabel: 'Asset downloads', unit: 'kits' }],
    ['socialShareRate', { fallbackLabel: 'Social share rate', format: 'percentage' }],
  ];

  return preferredKeys
    .map(([key, meta]) => {
      const metric = metricsSnapshot[key];
      if (!metric) {
        return null;
      }
      const value = metric.value ?? metric.count ?? null;
      const change = metric.change ?? metric.changePercentage ?? null;
      const trendLabel = metric.trendLabel ?? metric.period ?? null;
      return {
        key,
        label: metric.label ?? meta.fallbackLabel,
        value,
        unit: metric.unit ?? meta.unit ?? null,
        format: metric.format ?? meta.format ?? null,
        change,
        trendLabel,
        updatedAt: metric.updatedAt ?? metric.asOf ?? null,
      };
    })
    .filter(Boolean);
}

function selectLatest(features = [], status) {
  const targetStatus = Array.isArray(status) ? status : [status];
  return features
    .filter((feature) => targetStatus.includes(feature.status))
    .sort((a, b) => {
      const dateA = a.editionDate ? new Date(a.editionDate).getTime() : 0;
      const dateB = b.editionDate ? new Date(b.editionDate).getTime() : 0;
      return dateB - dateA;
    })[0] ?? null;
}

function computeAutomationSummary(spotlight) {
  const config = spotlight.newsletterAutomationConfig ?? {};
  return {
    enabled: Boolean(spotlight.newsletterFeatureEnabled),
    cadence: config.cadence ?? null,
    sendDay: config.sendDay ?? null,
    segments: Array.isArray(config.segments) ? config.segments : [],
    distributionChannels: Array.isArray(config.distributionChannels)
      ? config.distributionChannels
      : [],
    lastSyncedAt: config.lastSyncedAt ?? null,
  };
}

export async function getFreelancerSpotlight({ userId, profileId, includeDraft = false } = {}) {
  if (!userId && !profileId) {
    throw new ValidationError('userId or profileId is required to load the community spotlight.');
  }

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: userId ?? null, profileId: profileId ?? null, includeDraft });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    let profileInstance = null;

    if (profileId) {
      const normalizedProfileId = normalizeIdentifier(profileId, 'profileId');
      profileInstance = await Profile.findByPk(normalizedProfileId, {
        include: [{ model: User }],
      });
    } else if (userId) {
      const normalizedUserId = normalizeIdentifier(userId, 'userId');
      profileInstance = await Profile.findOne({
        where: { userId: normalizedUserId },
        include: [{ model: User }],
      });
    }

    if (!profileInstance) {
      throw new NotFoundError('The requested freelancer profile could not be found.');
    }

    const profilePlain = profileInstance.get({ plain: true });
    const userPlain = toPlain(profileInstance.get?.('User') ?? profileInstance.User);
    const displayName = userPlain
      ? `${userPlain.firstName ?? ''} ${userPlain.lastName ?? ''}`.trim() || userPlain.email
      : 'Freelancer';

    const statusFilter = includeDraft
      ? { [Op.not]: 'archived' }
      : { [Op.notIn]: ['archived', 'draft'] };

    const spotlightInstance = await CommunitySpotlight.findOne({
      where: {
        profileId: profilePlain.id,
        status: statusFilter,
      },
      order: [
        [
          sequelize.literal(
            `CASE "CommunitySpotlight"."status" WHEN 'published' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END`,
          ),
          'ASC',
        ],
        ['publishedAt', 'DESC NULLS LAST'],
        ['updatedAt', 'DESC'],
      ],
      include: [
        {
          model: CommunitySpotlightHighlight,
          as: 'highlights',
          separate: true,
          order: [
            ['ordinal', 'ASC'],
            ['occurredOn', 'DESC NULLS LAST'],
          ],
        },
        {
          model: CommunitySpotlightAsset,
          as: 'assets',
          separate: true,
          order: [
            ['assetType', 'ASC'],
            ['name', 'ASC'],
          ],
        },
        {
          model: CommunitySpotlightNewsletterFeature,
          as: 'newsletterFeatures',
          separate: true,
          order: [
            ['editionDate', 'DESC NULLS LAST'],
            ['createdAt', 'DESC'],
          ],
        },
      ],
    });

    const spotlightPlain = spotlightInstance ? spotlightInstance.toPublicObject() : null;
    const highlights = spotlightInstance?.highlights?.map((highlight) => highlight.toPublicObject()) ?? [];
    const assets = spotlightInstance?.assets?.map((asset) => asset.toPublicObject()) ?? [];
    const newsletterFeatures =
      spotlightInstance?.newsletterFeatures?.map((feature) => feature.toPublicObject()) ?? [];

    const performanceSummary = spotlightPlain ? buildPerformanceSummary(spotlightPlain.metricsSnapshot) : [];
    const latestFeature = selectLatest(newsletterFeatures, 'sent');
    const upcomingFeature = selectLatest(newsletterFeatures, 'scheduled');

    return {
      profile: {
        id: profilePlain.id,
        userId: profilePlain.userId,
        name: displayName,
        headline: profilePlain.headline,
        location: profilePlain.location,
        timezone: profilePlain.timezone,
        availabilityStatus: profilePlain.availabilityStatus,
        badges: Array.isArray(profilePlain.statusFlags) ? profilePlain.statusFlags : [],
        volunteerBadges: Array.isArray(profilePlain.volunteerBadges) ? profilePlain.volunteerBadges : [],
        followersCount: profilePlain.followersCount ?? 0,
        likesCount: profilePlain.likesCount ?? 0,
      },
      spotlight: spotlightPlain
        ? {
            ...spotlightPlain,
            performanceSummary,
            highlights,
            assets,
            newsletter: {
              automation: computeAutomationSummary(spotlightPlain),
              latest: latestFeature,
              upcoming: upcomingFeature,
              features: newsletterFeatures,
            },
          }
        : null,
    };
  });
}

export default {
  getFreelancerSpotlight,
};
