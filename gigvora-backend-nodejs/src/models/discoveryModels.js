import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const DISCOVERY_SUGGESTION_TYPES = Object.freeze([
  'opportunity',
  'program',
  'group',
  'person',
  'resource',
]);

export const DISCOVERY_TOPIC_TIMEFRAMES = Object.freeze(['24h', '7d', '30d', '90d']);

export const DiscoverySuggestion = sequelize.define(
  'DiscoverySuggestion',
  {
    type: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'opportunity',
      validate: {
        notEmpty: true,
      },
    },
    title: { type: DataTypes.STRING(160), allowNull: false },
    subtitle: { type: DataTypes.STRING(240), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    coverImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    personalizationScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    mutualConnections: { type: DataTypes.INTEGER, allowNull: true },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    shareUrl: { type: DataTypes.STRING(500), allowNull: true },
    href: { type: DataTypes.STRING(500), allowNull: true },
    contextTags: { type: jsonType, allowNull: true },
    statSnapshot: { type: jsonType, allowNull: true },
    primaryActionLabel: { type: DataTypes.STRING(120), allowNull: true },
    secondaryActionLabel: { type: DataTypes.STRING(120), allowNull: true },
    targetPersona: { type: DataTypes.STRING(80), allowNull: true },
    targetSegments: { type: jsonType, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    followCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    saveCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    viewCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shareCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dismissCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'discovery_suggestions',
    indexes: [
      { fields: ['type'] },
      { fields: ['active', 'targetPersona'] },
      { fields: ['sortOrder'] },
    ],
  },
);

DiscoverySuggestion.prototype.toCardObject = function toCardObject({
  followed = false,
  personalizationOverride = null,
} = {}) {
  const plain = this.get({ plain: true });
  const contextTags = Array.isArray(plain.contextTags)
    ? plain.contextTags
    : plain.contextTags && typeof plain.contextTags === 'object'
      ? Object.values(plain.contextTags)
      : [];
  const stats = Array.isArray(plain.statSnapshot)
    ? plain.statSnapshot
    : plain.statSnapshot && typeof plain.statSnapshot === 'object'
      ? Object.values(plain.statSnapshot)
      : [];

  return {
    id: plain.id,
    type: plain.type,
    title: plain.title,
    subtitle: plain.subtitle,
    description: plain.description,
    avatarUrl: plain.avatarUrl,
    coverImageUrl: plain.coverImageUrl,
    reason: plain.reason,
    personalizationScore:
      personalizationOverride != null ? personalizationOverride : plain.personalizationScore,
    mutualConnections: plain.mutualConnections,
    pinned: Boolean(plain.pinned),
    shareUrl: plain.shareUrl,
    href: plain.href,
    context: contextTags.filter(Boolean).map((entry) => `${entry}`.trim()).filter(Boolean),
    stats: stats
      .map((entry) =>
        entry && typeof entry === 'object'
          ? {
              id: entry.id ?? entry.label ?? undefined,
              label: entry.label ?? entry.title ?? '',
              value: entry.value ?? entry.metric ?? '',
              delta: entry.delta ?? entry.change ?? null,
            }
          : null,
      )
      .filter((entry) => entry && entry.label && entry.value),
    primaryActionLabel: plain.primaryActionLabel,
    secondaryActionLabel: plain.secondaryActionLabel,
    personalizationSummary: plain.metadata?.personalizationSummary ?? null,
    targetPersona: plain.targetPersona ?? null,
    followed,
    followCount: plain.followCount,
    saveCount: plain.saveCount,
    viewCount: plain.viewCount,
    shareCount: plain.shareCount,
  };
};

export const DiscoveryTrendingTopic = sequelize.define(
  'DiscoveryTrendingTopic',
  {
    topic: { type: DataTypes.STRING(180), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true },
    timeframe: { type: DataTypes.STRING(12), allowNull: false, defaultValue: '7d' },
    persona: { type: DataTypes.STRING(80), allowNull: true },
    icon: { type: DataTypes.STRING(16), allowNull: true },
    accentColor: { type: DataTypes.STRING(16), allowNull: true },
    rank: { type: DataTypes.INTEGER, allowNull: true },
    engagementScore: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    growthRate: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    mentionCount: { type: DataTypes.INTEGER, allowNull: true },
    shareCount: { type: DataTypes.INTEGER, allowNull: true },
    followCount: { type: DataTypes.INTEGER, allowNull: true },
    sentimentScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metrics: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'discovery_trending_topics',
    indexes: [
      { fields: ['timeframe', 'persona'] },
      { fields: ['rank'] },
    ],
  },
);

DiscoveryTrendingTopic.prototype.toPanelRow = function toPanelRow() {
  const plain = this.get({ plain: true });
  const metrics = plain.metrics && typeof plain.metrics === 'object' ? plain.metrics : {};
  const industries = Array.isArray(metrics.industries)
    ? metrics.industries
    : metrics.industryTags && typeof metrics.industryTags === 'object'
      ? Object.values(metrics.industryTags)
      : [];
  const audience =
    metrics.audience ?? metrics.memberPersona ?? plain.metadata?.audience ?? plain.metadata?.audienceSummary ?? null;
  const momentum =
    metrics.momentum ?? metrics.momentumScore ?? plain.metadata?.momentum ?? plain.metadata?.momentumScore ?? null;
  const confidence =
    metrics.confidenceLabel ?? metrics.confidence ?? plain.metadata?.confidence ?? plain.metadata?.confidenceLabel ?? null;
  return {
    id: plain.id,
    topic: plain.topic,
    summary: plain.summary,
    category: plain.category,
    timeframe: plain.timeframe,
    persona: plain.persona,
    icon: plain.icon ?? null,
    accentColor: plain.accentColor ?? null,
    rank: plain.rank ?? null,
    engagementScore: plain.engagementScore != null ? Number(plain.engagementScore) : null,
    growthRate: plain.growthRate != null ? Number(plain.growthRate) : null,
    mentionCount: plain.mentionCount ?? metrics.mentions ?? null,
    shareCount: plain.shareCount ?? metrics.shares ?? null,
    followCount: plain.followCount ?? metrics.follows ?? null,
    sentimentScore: plain.sentimentScore != null ? Number(plain.sentimentScore) : null,
    metrics,
    industries: industries.filter(Boolean).map((entry) => `${entry}`.trim()).filter((entry) => entry.length),
    audience,
    momentum,
    confidence,
    isNew: Boolean(plain.metadata?.isNew ?? metrics.isNew ?? false),
    href: plain.metadata?.href ?? null,
    shareUrl: plain.metadata?.shareUrl ?? null,
  };
};

export const DiscoveryConnectionProfile = sequelize.define(
  'DiscoveryConnectionProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    fullName: { type: DataTypes.STRING(160), allowNull: false },
    headline: { type: DataTypes.STRING(200), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    trustSignal: { type: DataTypes.STRING(160), allowNull: true },
    sharedContexts: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    successStory: { type: DataTypes.TEXT, allowNull: true },
    primaryAction: { type: jsonType, allowNull: true },
    secondaryAction: { type: jsonType, allowNull: true },
    persona: { type: DataTypes.STRING(80), allowNull: true },
    industryFocus: { type: DataTypes.STRING(120), allowNull: true },
    relationshipStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'new' },
    priorityScore: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    pronouns: { type: DataTypes.STRING(60), allowNull: true },
    matchScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    responseTimeLabel: { type: DataTypes.STRING(120), allowNull: true },
    availabilityWindow: { type: DataTypes.STRING(160), allowNull: true },
    focusAreas: { type: jsonType, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'discovery_connection_profiles',
    indexes: [
      { fields: ['persona'] },
      { fields: ['relationshipStatus'] },
      { fields: ['active'] },
    ],
  },
);

DiscoveryConnectionProfile.prototype.toCardObject = function toCardObject({
  mutualConnections = null,
  sharedCommunities = [],
  tags: supplementalTags = [],
  statusOverride = null,
} = {}) {
  const plain = this.get({ plain: true });
  const tags = Array.isArray(plain.tags)
    ? plain.tags
    : plain.tags && typeof plain.tags === 'object'
      ? Object.values(plain.tags)
      : [];
  const contexts = Array.isArray(plain.sharedContexts)
    ? plain.sharedContexts
    : plain.sharedContexts && typeof plain.sharedContexts === 'object'
      ? Object.values(plain.sharedContexts)
      : [];
  const primary = plain.primaryAction && typeof plain.primaryAction === 'object' ? plain.primaryAction : {};

  return {
    id: plain.id,
    userId: plain.userId ?? null,
    name: plain.fullName,
    headline: plain.headline,
    location: plain.location,
    bio: plain.bio,
    avatarUrl: plain.avatarUrl,
    verified: Boolean(plain.verified),
    trustSignal: plain.trustSignal,
    pronouns: plain.pronouns ?? plain.metadata?.pronouns ?? null,
    mutualConnections:
      mutualConnections != null
        ? mutualConnections
        : plain.metadata?.mutualConnections != null
          ? Number(plain.metadata.mutualConnections)
          : null,
    sharedCommunities: sharedCommunities.length
      ? sharedCommunities
      : contexts.filter(Boolean).map((entry) => `${entry}`.trim()).filter(Boolean),
    lastCollaborated: plain.metadata?.lastCollaborated ?? null,
    tags: Array.from(new Set([...tags, ...supplementalTags].filter(Boolean))),
    successStory: plain.successStory ?? plain.metadata?.successStory ?? null,
    status: statusOverride ?? plain.relationshipStatus ?? 'new',
    matchScore:
      plain.matchScore != null
        ? Number(plain.matchScore)
        : plain.metadata?.matchScore != null
          ? Number(plain.metadata.matchScore)
          : null,
    responseTime:
      plain.responseTimeLabel ?? plain.metadata?.responseTime ?? plain.metadata?.responseTimeLabel ?? null,
    availability:
      plain.availabilityWindow ?? plain.metadata?.availability ?? plain.metadata?.availabilityWindow ?? null,
    focusAreas: (
      Array.isArray(plain.focusAreas)
        ? plain.focusAreas
        : plain.focusAreas && typeof plain.focusAreas === 'object'
          ? Object.values(plain.focusAreas)
          : Array.isArray(plain.metadata?.focusAreas)
            ? plain.metadata.focusAreas
            : []
    )
      .filter(Boolean)
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length),
    primaryAction: primary,
    secondaryAction:
      plain.secondaryAction && typeof plain.secondaryAction === 'object'
        ? plain.secondaryAction
        : null,
  };
};

export const DiscoverySuggestionEngagement = sequelize.define(
  'DiscoverySuggestionEngagement',
  {
    suggestionId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(40), allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'discovery_suggestion_engagements',
    indexes: [
      { fields: ['suggestionId', 'action'] },
      { fields: ['userId', 'action'] },
    ],
  },
);

export const DiscoverySuggestionSubscription = sequelize.define(
  'DiscoverySuggestionSubscription',
  {
    suggestionId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    followed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'discovery_suggestion_subscriptions',
    indexes: [
      { fields: ['suggestionId'] },
      { fields: ['userId'] },
    ],
  },
);

DiscoverySuggestion.hasMany(DiscoverySuggestionEngagement, {
  foreignKey: 'suggestionId',
  as: 'engagements',
});
DiscoverySuggestionEngagement.belongsTo(DiscoverySuggestion, {
  foreignKey: 'suggestionId',
  as: 'suggestion',
});

DiscoverySuggestion.hasMany(DiscoverySuggestionSubscription, {
  foreignKey: 'suggestionId',
  as: 'subscriptions',
});
DiscoverySuggestionSubscription.belongsTo(DiscoverySuggestion, {
  foreignKey: 'suggestionId',
  as: 'suggestion',
});

export default DiscoverySuggestion;
