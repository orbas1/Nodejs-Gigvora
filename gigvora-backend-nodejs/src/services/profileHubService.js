import { Op } from 'sequelize';
import {
  sequelize,
  Profile,
  ProfileFollower,
  Connection,
  User,
  PROFILE_FOLLOWER_STATUSES,
  PROFILE_NETWORK_VISIBILITY_OPTIONS,
} from '../models/index.js';
import profileService, { updateProfile, updateProfileAvatar } from './profileService.js';
import { upsertProfileFollower, recalculateProfileEngagementNow } from './profileEngagementService.js';
import freelancerTimelineService from './freelancerTimelineService.js';
import freelancerPortfolioService from './freelancerPortfolioService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function normalizeUserId(value, label = 'userId') {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalizeString(value, { maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : [];
  const result = [];
  const seen = new Set();
  source.forEach((item) => {
    if (!item) return;
    const trimmed = `${item}`.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed.slice(0, 60));
  });
  return result.slice(0, 12);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeVisibility(value) {
  if (!value) {
    return PROFILE_NETWORK_VISIBILITY_OPTIONS[0];
  }
  const normalized = `${value}`.trim().toLowerCase();
  return PROFILE_NETWORK_VISIBILITY_OPTIONS.includes(normalized)
    ? normalized
    : PROFILE_NETWORK_VISIBILITY_OPTIONS[0];
}

function formatMetricValue(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (Math.abs(numeric) >= 1000) {
      return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(numeric);
  }
  if (typeof value === 'string') {
    return value;
  }
  return `${value}`;
}

function uniqueTags(...sources) {
  const set = new Set();
  sources
    .flat()
    .filter(Boolean)
    .forEach((tag) => {
      const label = `${tag}`.trim();
      if (label) {
        set.add(label);
      }
    });
  return Array.from(set);
}

function deriveEntryAchievements(metadata = {}) {
  if (!metadata) {
    return [];
  }
  if (Array.isArray(metadata.achievements)) {
    return metadata.achievements.filter(Boolean);
  }
  if (Array.isArray(metadata.highlights)) {
    return metadata.highlights.filter(Boolean);
  }
  if (Array.isArray(metadata.outcomes)) {
    return metadata.outcomes.filter(Boolean);
  }
  if (typeof metadata.achievement === 'string') {
    return [metadata.achievement];
  }
  return [];
}

function deriveEntryMetrics(entry, linkedPost) {
  const metrics = [];
  const metadataMetrics = Array.isArray(entry.metadata?.metrics) ? entry.metadata.metrics : null;
  if (metadataMetrics) {
    metadataMetrics.forEach((metric) => {
      if (!metric) return;
      const label = metric.label ?? metric.name ?? null;
      const value = metric.value ?? metric.metric ?? null;
      if (label && value != null) {
        metrics.push({ label, value: formatMetricValue(value) ?? value });
      }
    });
  }

  const totals = linkedPost?.metrics?.totals ?? null;
  if (totals) {
    const impressions = totals.impressions ?? totals.views ?? null;
    if (impressions) {
      metrics.push({ label: 'Impressions', value: formatMetricValue(impressions) ?? impressions });
    }
    const engagement =
      (totals.clicks ?? 0) +
      (totals.comments ?? 0) +
      (totals.reactions ?? 0) +
      (totals.shares ?? 0) +
      (totals.saves ?? 0);
    if (engagement > 0) {
      metrics.push({ label: 'Engagements', value: formatMetricValue(engagement) ?? engagement });
    }
    if (totals.leads) {
      metrics.push({ label: 'Leads', value: formatMetricValue(totals.leads) ?? totals.leads });
    }
  }

  const deduped = new Map();
  metrics.forEach((metric) => {
    if (!metric || !metric.label) {
      return;
    }
    const key = metric.label.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, metric);
    }
  });
  return Array.from(deduped.values());
}

function buildTimelineMedia(entry, linkedPost) {
  const media = entry.metadata?.media ?? {};
  const attachments = Array.isArray(linkedPost?.attachments) ? linkedPost.attachments : [];
  const firstAttachment = attachments.find((attachment) => attachment?.url);
  return {
    imageUrl: media.imageUrl ?? media.coverImage ?? linkedPost?.heroImageUrl ?? null,
    videoUrl: media.videoUrl ?? media.video ?? linkedPost?.callToAction?.url ?? null,
    link:
      media.link ??
      media.url ??
      linkedPost?.callToAction?.url ??
      linkedPost?.campaignLink ??
      firstAttachment?.url ??
      null,
  };
}

function buildTimelineItem(entry, postsById) {
  if (!entry) {
    return null;
  }
  const linkedPost = entry.linkedPostId ? postsById.get(entry.linkedPostId) ?? null : null;
  const tags = uniqueTags(entry.tags ?? [], linkedPost?.tags ?? []);
  const achievements = deriveEntryAchievements(entry.metadata);
  const metrics = deriveEntryMetrics(entry, linkedPost);
  const media = buildTimelineMedia(entry, linkedPost);
  const summary = entry.description ?? linkedPost?.summary ?? linkedPost?.content ?? null;
  const organization =
    entry.metadata?.organization ??
    entry.metadata?.client ??
    entry.channel ??
    entry.owner ??
    linkedPost?.campaign ??
    '';

  return {
    id: `entry-${entry.id}`,
    entryId: entry.id,
    role: entry.title,
    organization,
    location: entry.location ?? null,
    startDate: entry.startAt ?? null,
    endDate: entry.endAt ?? null,
    summary,
    achievements,
    metrics,
    media,
    tags,
    spotlight: Boolean(entry.status === 'completed' || entry.metadata?.spotlight || linkedPost?.status === 'published'),
    attachments: Array.isArray(linkedPost?.attachments) ? linkedPost.attachments : [],
    linkedPost: linkedPost
      ? {
          id: linkedPost.id,
          title: linkedPost.title,
          publishedAt: linkedPost.publishedAt ?? null,
          visibility: linkedPost.visibility,
          callToAction: linkedPost.callToAction ?? null,
        }
      : null,
  };
}

function buildPostOnlyItem(post) {
  if (!post) {
    return null;
  }
  const metrics = deriveEntryMetrics({ metadata: {}, linkedPostId: post.id }, post);
  return {
    id: `post-${post.id}`,
    role: post.title,
    organization: post.campaign ?? 'Campaign',
    startDate: post.publishedAt ?? post.updatedAt ?? null,
    endDate: post.publishedAt ?? null,
    summary: post.summary ?? post.content ?? null,
    achievements: [],
    metrics,
    media: {
      imageUrl: post.heroImageUrl ?? null,
      videoUrl: post.callToAction?.url ?? null,
      link: post.callToAction?.url ?? null,
    },
    tags: Array.isArray(post.tags) ? post.tags : [],
    spotlight: post.status === 'published',
    attachments: Array.isArray(post.attachments) ? post.attachments : [],
    linkedPost: {
      id: post.id,
      title: post.title,
      publishedAt: post.publishedAt ?? null,
      visibility: post.visibility,
      callToAction: post.callToAction ?? null,
    },
  };
}

function buildExperienceTimelineSnapshot(snapshot) {
  if (!snapshot) {
    return {
      items: [],
      filters: ['all'],
      defaultFilter: 'all',
      defaultView: 'timeline',
      analytics: null,
      workspace: null,
      spotlight: null,
    };
  }

  const { timelineEntries = [], posts = [], analytics = {}, workspace = null } = snapshot;
  const postsById = new Map(posts.map((post) => [post.id, post]));
  const items = [];

  timelineEntries.forEach((entry) => {
    const item = buildTimelineItem(entry, postsById);
    if (item) {
      items.push(item);
    }
  });

  posts
    .filter((post) => !timelineEntries.some((entry) => entry.linkedPostId === post.id))
    .forEach((post) => {
      const item = buildPostOnlyItem(post);
      if (item) {
        items.push(item);
      }
    });

  items.sort((a, b) => {
    const aDate = new Date(a.endDate ?? a.startDate ?? 0).getTime();
    const bDate = new Date(b.endDate ?? b.startDate ?? 0).getTime();
    return bDate - aDate;
  });

  const tagSet = new Set();
  items.forEach((item) => {
    (item.tags ?? []).forEach((tag) => {
      const label = `${tag}`.trim();
      if (label) {
        tagSet.add(label);
      }
    });
  });

  const filters = ['all', ...tagSet];
  const spotlightItem = items.find((item) => item.spotlight) ?? items[0] ?? null;
  const defaultFilter = spotlightItem?.tags?.find((tag) => filters.includes(tag)) ?? 'all';

  return {
    items,
    filters,
    defaultFilter,
    defaultView: 'timeline',
    analytics,
    workspace,
    spotlight: spotlightItem
      ? {
          id: spotlightItem.id,
          label: spotlightItem.role,
          highlights: spotlightItem.achievements ?? [],
          metrics: spotlightItem.metrics ?? [],
        }
      : null,
  };
}

function normalisePortfolioItem(item, index) {
  if (!item) {
    return null;
  }
  const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];
  const metrics = Array.isArray(item.impactMetrics)
    ? item.impactMetrics
        .filter((metric) => metric && metric.label && metric.value != null)
        .map((metric) => ({ label: metric.label, value: formatMetricValue(metric.value) ?? metric.value }))
    : [];
  return {
    id: item.id ?? item.slug ?? `portfolio-${index}`,
    slug: item.slug ?? null,
    title: item.title ?? item.name ?? 'Portfolio item',
    summary: item.summary ?? item.tagline ?? item.outcomeSummary ?? '',
    tags,
    metrics,
    imageUrl: item.heroImageUrl ?? null,
    videoUrl: item.heroVideoUrl ?? null,
    link: item.liveUrl ?? item.callToActionUrl ?? item.previewUrl ?? null,
    featured: Boolean(item.isFeatured),
    spotlight: item.callToActionLabel
      ? {
          label: item.callToActionLabel,
          url: item.callToActionUrl ?? null,
        }
      : null,
    attachments: Array.isArray(item.assets) ? item.assets : [],
    lastUpdated: item.updatedAt ?? item.publishedAt ?? null,
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
  };
}

function buildPortfolioGallerySnapshot(snapshot) {
  if (!snapshot) {
    return {
      items: [],
      categories: ['all'],
      defaultCategory: 'all',
      loading: false,
      summary: null,
      settings: null,
      hero: null,
    };
  }

  const items = (snapshot.items ?? [])
    .map((item, index) => normalisePortfolioItem(item, index))
    .filter(Boolean);
  const categories = new Set();
  items.forEach((item) => {
    (item.tags ?? []).forEach((tag) => {
      if (tag) {
        categories.add(tag);
      }
    });
  });

  const featured = items.find((item) => item.featured) ?? items[0] ?? null;
  const defaultCategory = featured?.tags?.[0] ?? null;

  return {
    items,
    categories: ['all', ...categories],
    defaultCategory: defaultCategory && categories.has(defaultCategory) ? defaultCategory : 'all',
    loading: false,
    summary: snapshot.summary ?? null,
    settings: snapshot.settings ?? null,
    hero: featured,
  };
}

function extractMutualConnections(connections = []) {
  return connections
    .map((connection) => connection.counterpart)
    .filter((counterpart) => counterpart && counterpart.name)
    .slice(0, 6);
}

function deriveTrustBadges({ followerStats, timeline, portfolio }) {
  const badges = [];
  if ((followerStats?.total ?? 0) > 0) {
    badges.push({
      id: 'network-signal',
      label: 'Trusted network',
      description: `${formatMetricValue(followerStats.total)} engaged followers`,
    });
  }
  const publishedPosts = timeline?.analytics?.totals?.published ?? 0;
  if (publishedPosts > 0) {
    badges.push({
      id: 'spotlight-consistency',
      label: 'Consistent spotlight',
      description: `${formatMetricValue(publishedPosts)} published timeline stories`,
    });
  }
  const featuredCases = portfolio?.summary?.featured ?? 0;
  if (featuredCases > 0) {
    badges.push({
      id: 'featured-case',
      label: 'Featured case studies',
      description: `${formatMetricValue(featuredCases)} hero narratives front-and-centre`,
    });
  }
  return badges.slice(0, 4);
}

function buildHighlightReel(timelineItems = [], portfolioItems = []) {
  const highlights = [];
  timelineItems.slice(0, 3).forEach((item) => {
    highlights.push({
      id: `timeline-${item.id}`,
      label: item.role,
      metric: item.metrics?.[0]?.value ?? null,
      description: item.summary ?? null,
    });
  });

  const portfolioHighlight = portfolioItems.find((item) => item.featured) ?? portfolioItems[0] ?? null;
  if (portfolioHighlight) {
    highlights.push({
      id: `portfolio-${portfolioHighlight.id}`,
      label: portfolioHighlight.title,
      metric: portfolioHighlight.metrics?.[0]?.value ?? null,
      description: portfolioHighlight.summary ?? null,
    });
  }

  const deduped = [];
  const seen = new Set();
  highlights.forEach((highlight) => {
    if (!highlight.label) {
      return;
    }
    const key = highlight.label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(highlight);
    }
  });
  return deduped.slice(0, 6);
}

function buildWorkspaceSummary({ profileOverview, followerStats, connections, timeline, portfolio }) {
  const totals = timeline?.analytics?.totals ?? {};
  const portfolioSummary = portfolio?.summary ?? {};
  const metrics = {
    followers: followerStats?.total ?? 0,
    activeFollowers: followerStats?.active ?? 0,
    connections: connections?.total ?? 0,
    favouriteConnections: connections?.favourites ?? 0,
    timelinePublished: totals.published ?? 0,
    timelineDrafts: totals.drafts ?? 0,
    portfolioPublished: portfolioSummary.published ?? 0,
    portfolioFeatured: portfolioSummary.featured ?? 0,
    engagementRate: totals.engagementRate ? `${Math.round(totals.engagementRate * 100)}%` : null,
  };

  const highlights = [
    `${formatMetricValue(metrics.followers)} followers tuning into updates`,
    `${formatMetricValue(metrics.timelinePublished)} published timeline spotlights`,
    `${formatMetricValue(metrics.portfolioPublished)} portfolio artefacts ready to share`,
  ];

  const actions = [];
  if ((metrics.timelineDrafts ?? 0) > 0) {
    actions.push('Review and schedule pending timeline drafts.');
  }
  if ((portfolioSummary.drafts ?? 0) > 0) {
    actions.push('Polish draft case studies to unlock new leads.');
  }

  return {
    metrics,
    highlights,
    actions,
    cadenceGoal: timeline?.workspace?.cadenceGoal ?? null,
    timezone: timeline?.workspace?.timezone ?? profileOverview?.timezone ?? null,
    pinnedCampaigns: timeline?.workspace?.pinnedCampaigns ?? [],
    timeline,
    portfolio,
  };
}

function formatUserSummary(user) {
  if (!user) {
    return null;
  }
  const profile = user.Profile ?? user.profile ?? {};
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || `User #${user.id}`;
  return {
    id: user.id,
    name,
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    avatarSeed: profile.avatarSeed ?? name,
    userType: user.userType ?? null,
  };
}

function sanitizeFollowerRecord(record) {
  const plain = record.get({ plain: true });
  const follower = record.get?.('follower') ?? plain.follower ?? null;
  return {
    id: plain.id,
    profileId: plain.profileId,
    followerId: plain.followerId,
    status: plain.status,
    notificationsEnabled: Boolean(plain.notificationsEnabled),
    displayName: plain.displayName ?? null,
    notes: plain.notes ?? null,
    tags: normalizeTags(plain.tags),
    followedAt: plain.followedAt ?? null,
    lastInteractedAt: plain.lastInteractedAt ?? null,
    summary: formatUserSummary(follower),
  };
}

function sanitizeConnectionRecord(record, ownerId) {
  const plain = record.get({ plain: true });
  const requester = record.get?.('requester') ?? plain.requester ?? null;
  const addressee = record.get?.('addressee') ?? plain.addressee ?? null;
  const counterpart = plain.requesterId === ownerId ? addressee : requester;
  return {
    id: plain.id,
    status: plain.status,
    favourite: Boolean(plain.favourite),
    visibility: sanitizeVisibility(plain.visibility),
    relationshipTag: plain.relationshipTag ?? null,
    notes: plain.notes ?? null,
    connectedAt: plain.connectedAt ?? plain.createdAt ?? null,
    lastInteractedAt: plain.lastInteractedAt ?? plain.updatedAt ?? null,
    counterpart: formatUserSummary(counterpart),
  };
}

async function resolveFollowerUserId(payload = {}) {
  if (!payload) {
    throw new ValidationError('Follower payload is required.');
  }
  if (payload.followerId) {
    return normalizeUserId(payload.followerId, 'followerId');
  }
  const email = normalizeString(payload.email ?? payload.followerEmail ?? null, {
    maxLength: 255,
  });
  if (!email) {
    throw new ValidationError('Provide a followerId or followerEmail.');
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new NotFoundError('Follower could not be found for the supplied identifier.');
  }
  return user.id;
}

function sanitizeFollowerStatus(status) {
  if (!status) {
    return 'active';
  }
  const normalized = `${status}`.trim().toLowerCase();
  if (!PROFILE_FOLLOWER_STATUSES.includes(normalized)) {
    throw new ValidationError(
      `status must be one of: ${PROFILE_FOLLOWER_STATUSES.join(', ')}.`,
    );
  }
  return normalized;
}

export async function getProfileHub(userId, { viewerId, bypassCache = false, profileOverview: existingOverview = null } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const profileOverview = existingOverview
    ? existingOverview
    : await profileService.getProfileOverview(normalizedUserId, { bypassCache });
  const profileId = profileOverview.profileId;

  const [followerRecords, connectionRecords] = await Promise.all([
    ProfileFollower.findAll({
      where: { profileId },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      order: [['followedAt', 'DESC']],
      limit: 150,
    }),
    Connection.findAll({
      where: {
        status: { [Op.in]: ['accepted', 'pending'] },
        [Op.or]: [{ requesterId: normalizedUserId }, { addresseeId: normalizedUserId }],
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 200,
    }),
  ]);

  const followers = followerRecords.map(sanitizeFollowerRecord);
  const followerStats = followers.reduce(
    (acc, follower) => {
      acc.total += 1;
      if (follower.status === 'active') acc.active += 1;
      if (follower.status === 'muted') acc.muted += 1;
      if (follower.status === 'blocked') acc.blocked += 1;
      return acc;
    },
    { total: 0, active: 0, muted: 0, blocked: 0 },
  );

  const acceptedConnections = [];
  const pendingConnections = [];
  connectionRecords.forEach((record) => {
    const sanitized = sanitizeConnectionRecord(record, normalizedUserId);
    if (record.status === 'accepted') {
      acceptedConnections.push(sanitized);
    } else if (record.status === 'pending') {
      pendingConnections.push(sanitized);
    }
  });

  const favouriteConnections = acceptedConnections.filter((connection) => connection.favourite).length;

  const [timelineSnapshot, portfolioSnapshot] = await Promise.all([
    freelancerTimelineService
      .getFreelancerTimelineWorkspace({ freelancerId: normalizedUserId })
      .catch((error) => {
        logger.warn(
          { err: error, userId: normalizedUserId, viewerId },
          'Failed to load freelancer timeline workspace for profile hub.',
        );
        return null;
      }),
    freelancerPortfolioService
      .getPortfolio(normalizedUserId, { bypassCache })
      .catch((error) => {
        logger.warn({ err: error, userId: normalizedUserId, viewerId }, 'Failed to load portfolio gallery for profile hub.');
        return null;
      }),
  ]);

  const experienceTimeline = buildExperienceTimelineSnapshot(timelineSnapshot);
  const portfolioGallery = buildPortfolioGallerySnapshot(portfolioSnapshot);
  const mutualConnections = extractMutualConnections(acceptedConnections);
  const trustBadges = deriveTrustBadges({ followerStats, timeline: experienceTimeline, portfolio: portfolioGallery });
  const highlightReel = buildHighlightReel(experienceTimeline.items, portfolioGallery.items);
  const workspace = buildWorkspaceSummary({
    profileOverview,
    followerStats,
    connections: { total: acceptedConnections.length, favourites: favouriteConnections },
    timeline: experienceTimeline,
    portfolio: {
      summary: portfolioGallery.summary,
      settings: portfolioGallery.settings,
      hero: portfolioGallery.hero,
    },
  });

  const viewerPersona = (experienceTimeline.analytics?.totals?.leads ?? 0) > 0 ? 'investor' : 'recruiter';
  const documents = {
    published: portfolioGallery.summary?.published ?? portfolioGallery.items.length,
    drafts: portfolioGallery.summary?.drafts ?? 0,
  };
  const collaborations = {
    active: acceptedConnections.length,
    favourites: favouriteConnections,
  };

  return {
    profile: profileOverview,
    followers: {
      ...followerStats,
      items: followers,
    },
    connections: {
      total: acceptedConnections.length,
      favourites: favouriteConnections,
      items: acceptedConnections,
      pending: pendingConnections,
    },
    settings: {
      profileVisibility: profileOverview.profileVisibility,
      networkVisibility: profileOverview.networkVisibility,
      followersVisibility: profileOverview.followersVisibility,
      socialLinks: profileOverview.socialLinks ?? [],
    },
    experienceTimeline,
    timeline: {
      analytics: experienceTimeline.analytics,
      workspace: experienceTimeline.workspace,
      spotlight: experienceTimeline.spotlight,
    },
    portfolioGallery,
    portfolio: portfolioGallery,
    highlightReel,
    trustBadges,
    mutualConnections,
    workspace,
    viewerPersona,
    documents,
    collaborations,
  };
}

export async function saveFollower(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const followerId = await resolveFollowerUserId(payload);
  const status = sanitizeFollowerStatus(payload.status ?? 'active');
  const notificationsEnabled = payload.notificationsEnabled !== false;
  const tags = normalizeTags(payload.tags);
  const displayName = normalizeString(payload.displayName, { maxLength: 255 });
  const notes = normalizeString(payload.notes, { maxLength: 2000 });
  const lastInteractedAt = normalizeDate(payload.lastInteractedAt);

  return sequelize.transaction(async (transaction) => {
    const profile = await Profile.findOne({
      where: { userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    await upsertProfileFollower({
      profileId: profile.id,
      followerId,
      status,
      notificationsEnabled,
      metadata: payload.metadata ?? null,
    });

    const followerRecord = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    followerRecord.displayName = displayName ?? null;
    followerRecord.notes = notes ?? null;
    followerRecord.tags = tags;
    followerRecord.lastInteractedAt = lastInteractedAt ?? followerRecord.lastInteractedAt;
    await followerRecord.save({ transaction });

    const refreshed = await ProfileFollower.findOne({
      where: { id: followerRecord.id },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
        },
      ],
      transaction,
    });

    await recalculateProfileEngagementNow(profile.id);

    return sanitizeFollowerRecord(refreshed);
  });
}

export async function deleteFollower(userId, followerId) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedFollowerId = normalizeUserId(followerId, 'followerId');

  return sequelize.transaction(async (transaction) => {
    const profile = await Profile.findOne({
      where: { userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const record = await ProfileFollower.findOne({
      where: { profileId: profile.id, followerId: normalizedFollowerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('Follower relationship not found.');
    }

    await record.destroy({ transaction });
    await recalculateProfileEngagementNow(profile.id);
    return { success: true };
  });
}

export async function listConnections(userId) {
  const snapshot = await getProfileHub(userId);
  return snapshot.connections;
}

export async function updateConnection(userId, connectionId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedConnectionId = normalizeUserId(connectionId, 'connectionId');

  const connection = await Connection.findOne({
    where: {
      id: normalizedConnectionId,
      [Op.or]: [{ requesterId: normalizedUserId }, { addresseeId: normalizedUserId }],
    },
  });

  if (!connection) {
    throw new NotFoundError('Connection not found.');
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'relationshipTag')) {
    updates.relationshipTag = normalizeString(payload.relationshipTag, { maxLength: 120 });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    updates.notes = normalizeString(payload.notes, { maxLength: 5000 });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'favourite')) {
    updates.favourite = Boolean(payload.favourite);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) {
    updates.visibility = sanitizeVisibility(payload.visibility);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'lastInteractedAt')) {
    updates.lastInteractedAt = normalizeDate(payload.lastInteractedAt);
  }

  if (Object.keys(updates).length === 0) {
    return sanitizeConnectionRecord(connection, normalizedUserId);
  }

  await connection.update(updates);

  const refreshed = await Connection.findByPk(connection.id, {
    include: [
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
      },
      {
        model: User,
        as: 'addressee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
        include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed', 'avatarUrl'] }],
      },
    ],
  });

  return sanitizeConnectionRecord(refreshed, normalizedUserId);
}

export async function updateProfileBasics(userId, payload = {}) {
  return updateProfile(userId, payload);
}

export async function changeProfileAvatar(userId, payload = {}) {
  return updateProfileAvatar(userId, payload);
}

export default {
  getProfileHub,
  saveFollower,
  deleteFollower,
  listConnections,
  updateConnection,
  updateProfileBasics,
  changeProfileAvatar,
};
