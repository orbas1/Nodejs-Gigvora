import { Op } from 'sequelize';
import {
  User,
  Profile,
  FreelancerProfile,
  ReputationTestimonial,
  ReputationSuccessStory,
  ReputationMetric,
  ReputationBadge,
  ReputationReviewWidget,
  REPUTATION_TESTIMONIAL_SOURCES,
  REPUTATION_TESTIMONIAL_STATUSES,
  REPUTATION_SUCCESS_STORY_STATUSES,
  REPUTATION_METRIC_TREND_DIRECTIONS,
  REPUTATION_REVIEW_WIDGET_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import {
  analyseTestimonial,
  analyseSuccessStory,
  verifyClientIdentity,
} from './reputationModerationService.js';
import { renderWidgetHtml } from './reputationWidgetRenderer.js';

function normalizeFreelancerId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('freelancerId must be a positive integer');
  }
  return id;
}

async function ensureFreelancerExists(freelancerId) {
  const record = await User.findByPk(freelancerId, {
    attributes: ['id', 'userType', 'firstName', 'lastName'],
  });
  if (!record || record.userType !== 'freelancer') {
    throw new NotFoundError('Freelancer not found');
  }
  return record;
}

function sanitizeString(value, { maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeEmail(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    throw new ValidationError('clientEmail must be a valid email address');
  }
  return trimmed.slice(0, 320);
}

function sanitizeUrl(value) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.toString().slice(0, 500);
  } catch (error) {
    throw new ValidationError('Invalid URL provided');
  }
}

function parseDecimal(value, { allowNull = false, min = undefined, max = undefined } = {}) {
  if (value == null) {
    if (allowNull) return null;
    throw new ValidationError('A numeric value is required');
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Value must be numeric');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be less than or equal to ${max}`);
  }
  return numeric;
}

function parseDate(value, { allowNull = true } = {}) {
  if (value == null || value === '') {
    return allowNull ? null : new Date();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided');
  }
  return date;
}

function sanitizeThemeTokens(value) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('themeTokens must be an object if provided');
  }
  const tokens = ['background', 'border', 'text', 'accent', 'muted'].reduce((accumulator, key) => {
    if (value[key] != null && `${value[key]}`.trim()) {
      accumulator[key] = `${value[key]}`.trim();
    }
    return accumulator;
  }, {});
  return Object.keys(tokens).length ? tokens : null;
}

function generateSlug(value) {
  const base = sanitizeString(value, { allowNull: false }).toLowerCase();
  const normalized = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90);
  return normalized || `entry-${Date.now()}`;
}

async function ensureUniqueSlug(model, freelancerId, desiredSlug) {
  const baseSlug = desiredSlug || `entry-${Date.now()}`;
  let attempt = 0;
  let slug = baseSlug;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await model.findOne({
      attributes: ['id'],
      where: { freelancerId, slug },
    });
    if (!existing) {
      return slug;
    }
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

function formatMetricValue(value, unit) {
  if (value == null) {
    return null;
  }
  switch (unit) {
    case 'percentage':
      return `${Number(value).toFixed(1)}%`;
    case 'csat':
      return Number(value).toFixed(2);
    case 'count':
      return `${Math.round(Number(value))}`;
    case 'currency_usd':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: Math.abs(Number(value)) >= 1000 ? 0 : 2,
      }).format(Number(value));
    default:
      return `${Number(value)}`;
  }
}

function formatTrendLabel(metric) {
  if (metric.trendValue == null) {
    return null;
  }
  const absolute = Math.abs(Number(metric.trendValue));
  const prefix = metric.trendDirection === 'down' ? '-' : '+';
  switch (metric.unit) {
    case 'percentage':
      return `${prefix}${absolute.toFixed(1)} pts`;
    case 'csat':
      return `${prefix}${absolute.toFixed(2)} vs prev.`;
    default:
      return `${prefix}${absolute}`;
  }
}

function formatPeriodLabel(period) {
  if (!period) {
    return null;
  }
  switch (period) {
    case 'rolling_12_months':
      return 'Last 12 months';
    case 'rolling_6_months':
      return 'Last 6 months';
    case 'rolling_3_months':
      return 'Last 3 months';
    case 'ytd':
      return 'Year to date';
    default:
      return period.replace(/_/g, ' ');
  }
}

function mapFreelancerProfile(record) {
  const plain = record.get({ plain: true });
  const profile = plain.Profile ?? {};
  const freelancerProfile = plain.FreelancerProfile ?? {};
  const name = `${plain.firstName ?? ''} ${plain.lastName ?? ''}`.trim() || 'Freelancer';
  const title = freelancerProfile.title || profile.headline || 'Independent professional';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return {
    id: plain.id,
    name,
    title,
    initials,
    avatarSeed: profile.avatarSeed || name,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    status: profile.availabilityStatus ?? null,
    stats: {
      trustScore: profile.trustScore == null ? null : Number(profile.trustScore),
      likes: profile.likesCount ?? 0,
      followers: profile.followersCount ?? 0,
    },
  };
}

function indexByMetricType(metrics) {
  return metrics.reduce((accumulator, metric) => {
    accumulator[metric.metricType] = metric;
    return accumulator;
  }, {});
}

function deriveAutomationPlaybooks({ metricsByType, promotedBadges, widgets }) {
  const onTime = metricsByType.on_time_delivery_rate;
  const csat = metricsByType.average_csat;
  const referrals = metricsByType.referral_ready_clients;
  const activeWidgets = widgets.filter((widget) => widget.status === 'active');

  return [
    onTime
      ? `Auto-schedule testimonial requests 24h after delivery to protect a ${formatMetricValue(onTime.value, onTime.unit)} on-time streak.`
      : 'Auto-schedule testimonial requests after each milestone sign-off.',
    csat
      ? `Launch a save plan whenever CSAT dips below ${formatMetricValue(csat.value, csat.unit)}.`
      : 'Alert account leads when satisfaction surveys fall below target.',
    promotedBadges.length
      ? `Issue ${promotedBadges.length} featured badges automatically when revenue or certification milestones hit.`
      : 'Issue featured badges when freelancers complete certification or revenue targets.',
    activeWidgets.length
      ? `Embed ${activeWidgets.length} live review widgets across proposals, gig listings, and portals.`
      : 'Publish review widgets to proposals, gig listings, and profile banners.',
    referrals
      ? `Nurture ${Math.round(Number(referrals.value))} referral-ready clients with quarterly spotlights.`
      : 'Identify referral-ready clients and enrol them into nurture journeys.',
  ];
}

function deriveIntegrationTouchpoints({ successStories, widgets }) {
  const integrations = new Set([
    'Gigvora public profile',
    'Proposal PDFs & pitch decks',
    'Notion, Webflow, and CMS embeds',
    'LinkedIn, Behance, and Dribbble showcases',
    'Zapier, Make, and webhook automations',
    'CRM deal rooms (HubSpot & Salesforce)',
  ]);

  if (successStories.some((story) => story.ctaUrl)) {
    integrations.add('Email newsletters and nurture campaigns');
  }
  if (widgets.some((widget) => widget.status === 'active')) {
    integrations.add('Portfolio landing pages & microsites');
  }

  return Array.from(integrations);
}

export async function getFreelancerReputationOverview({
  freelancerId,
  includeDrafts = false,
  limitTestimonials = 8,
  limitStories = 6,
} = {}) {
  const id = normalizeFreelancerId(freelancerId);

  const freelancer = await User.findByPk(id, {
    include: [
      { model: Profile },
      { model: FreelancerProfile },
    ],
  });

  if (!freelancer) {
    throw new NotFoundError('Freelancer profile not found');
  }

  const testimonialWhere = { freelancerId: id };
  if (!includeDrafts) {
    testimonialWhere.status = 'approved';
    testimonialWhere.moderationStatus = 'approved';
  } else {
    testimonialWhere.status = { [Op.ne]: 'archived' };
  }

  const successStoryWhere = { freelancerId: id };
  if (!includeDrafts) {
    successStoryWhere.status = 'published';
    successStoryWhere.moderationStatus = 'approved';
  } else {
    successStoryWhere.status = { [Op.ne]: 'archived' };
  }

  const widgetWhere = { freelancerId: id };
  if (!includeDrafts) {
    widgetWhere.status = { [Op.ne]: 'draft' };
  }

  const [testimonialRecords, successStoryRecords, metricRecords, badgeRecords, widgetRecords] = await Promise.all([
    ReputationTestimonial.findAll({
      where: testimonialWhere,
      order: [
        ['isFeatured', 'DESC'],
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: limitTestimonials,
    }),
    ReputationSuccessStory.findAll({
      where: successStoryWhere,
      order: [
        ['featured', 'DESC'],
        ['publishedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: limitStories,
    }),
    ReputationMetric.findAll({
      where: { freelancerId: id },
      order: [['label', 'ASC']],
    }),
    ReputationBadge.findAll({
      where: { freelancerId: id },
      order: [
        ['isPromoted', 'DESC'],
        ['issuedAt', 'DESC NULLS LAST'],
      ],
    }),
    ReputationReviewWidget.findAll({
      where: widgetWhere,
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    }),
  ]);

  const testimonials = testimonialRecords.map((record) => record.toPublicObject());
  const successStories = successStoryRecords.map((record) => record.toPublicObject());
  const metrics = metricRecords.map((record) => {
    const payload = record.toPublicObject();
    return {
      ...payload,
      formattedValue: formatMetricValue(payload.value, payload.unit),
      trendLabel: formatTrendLabel(payload),
      periodLabel: formatPeriodLabel(payload.period),
    };
  });
  const badges = badgeRecords.map((record) => record.toPublicObject());
  const widgets = widgetRecords.map((record) => record.toPublicObject());

  const metricsByType = indexByMetricType(metrics);
  const promotedBadges = badges.filter((badge) => badge.isPromoted);
  const activeWidgets = widgets.filter((widget) => widget.status === 'active');

  const featuredTestimonial = testimonials.find((testimonial) => testimonial.isFeatured) ?? testimonials[0] ?? null;
  const remainingTestimonials = featuredTestimonial
    ? testimonials.filter((testimonial) => testimonial.id !== featuredTestimonial.id)
    : testimonials;

  const featuredStory = successStories.find((story) => story.featured) ?? successStories[0] ?? null;
  const publishedStories = successStories.filter((story) => story.status === 'published');

  const lastVerification = metrics
    .map((metric) => (metric.verifiedAt ? new Date(metric.verifiedAt).getTime() : 0))
    .reduce((latest, current) => (current > latest ? current : latest), 0);

  const summary = {
    totals: {
      testimonials: testimonials.length,
      publishedStories: publishedStories.length,
      badges: badges.length,
      activeWidgets: activeWidgets.length,
    },
    performance: {
      onTimeDeliveryRate: metricsByType.on_time_delivery_rate?.value ?? null,
      averageCsat: metricsByType.average_csat?.value ?? null,
      referralReadyClients: metricsByType.referral_ready_clients?.value ?? null,
      caseStudiesPublished: publishedStories.length,
    },
    lastVerifiedAt: lastVerification ? new Date(lastVerification).toISOString() : null,
  };

  const automationPlaybooks = deriveAutomationPlaybooks({ metricsByType, promotedBadges, widgets });
  const integrationTouchpoints = deriveIntegrationTouchpoints({ successStories: publishedStories, widgets });

  const shareableLinks = [
    ...(featuredTestimonial?.shareUrl
      ? [
          {
            label: 'Featured testimonial',
            url: featuredTestimonial.shareUrl,
          },
        ]
      : []),
    ...publishedStories
      .map((story) =>
        story.ctaUrl
          ? {
              label: `${story.title} CTA`,
              url: story.ctaUrl,
            }
          : null,
      )
      .filter(Boolean),
  ];

  return {
    freelancer: mapFreelancerProfile(freelancer),
    summary,
    metrics,
    testimonials: {
      featured: featuredTestimonial,
      recent: remainingTestimonials,
    },
    successStories: {
      featured: featuredStory,
      collection: successStories,
    },
    badges: {
      promoted: promotedBadges,
      collection: badges,
    },
    reviewWidgets: widgets,
    automationPlaybooks,
    integrationTouchpoints,
    shareableLinks,
  };
}

export async function createTestimonial(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const clientName = sanitizeString(payload.clientName, { allowNull: false });
  const comment = sanitizeString(payload.comment, { allowNull: false, maxLength: 10000 });

  if (!clientName) {
    throw new ValidationError('clientName is required');
  }
  if (!comment) {
    throw new ValidationError('comment is required');
  }

  const rating = payload.rating == null ? null : parseDecimal(payload.rating, { allowNull: true, min: 0, max: 5 });
  const source = sanitizeString(payload.source ?? 'portal', { allowNull: false });
  if (!REPUTATION_TESTIMONIAL_SOURCES.includes(source)) {
    throw new ValidationError(`source must be one of: ${REPUTATION_TESTIMONIAL_SOURCES.join(', ')}`);
  }

  const status = sanitizeString(payload.status ?? 'pending', { allowNull: false });
  if (!REPUTATION_TESTIMONIAL_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_TESTIMONIAL_STATUSES.join(', ')}`);
  }

  const clientRole = sanitizeString(payload.clientRole);
  const company = sanitizeString(payload.company);
  const projectName = sanitizeString(payload.projectName);
  const clientEmail = sanitizeEmail(payload.clientEmail);
  const sourceUrl = payload.sourceUrl ? sanitizeUrl(payload.sourceUrl) : null;
  const verification = verifyClientIdentity({ clientName, clientEmail, company, sourceUrl });
  const moderation = analyseTestimonial({ comment, metadata: { rating } });
  const moderationStatus = moderation.status ?? 'pending';
  const moderatedAt = new Date();
  const workflowStatus =
    status === 'approved' && moderationStatus !== 'approved' ? 'pending' : status;

  const record = await ReputationTestimonial.create({
    freelancerId: id,
    clientName,
    clientRole,
    company,
    clientEmail,
    projectName,
    sourceUrl,
    rating,
    comment,
    capturedAt: parseDate(payload.capturedAt),
    deliveredAt: parseDate(payload.deliveredAt),
    source,
    status: workflowStatus,
    moderationStatus,
    moderationScore: moderation.score ?? null,
    moderationSummary: moderation.summary ?? null,
    moderationLabels: moderation.labels ?? null,
    moderatedAt,
    verifiedClient: Boolean(verification.verified),
    verificationMetadata: verification.metadata ?? null,
    isFeatured: Boolean(payload.isFeatured),
    shareUrl: payload.shareUrl ? sanitizeUrl(payload.shareUrl) : null,
    media: payload.media ?? null,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function createSuccessStory(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const title = sanitizeString(payload.title, { allowNull: false });
  const summary = sanitizeString(payload.summary, { allowNull: false, maxLength: 10000 });

  if (!title) {
    throw new ValidationError('title is required');
  }
  if (!summary) {
    throw new ValidationError('summary is required');
  }

  const status = sanitizeString(payload.status ?? 'draft', { allowNull: false });
  if (!REPUTATION_SUCCESS_STORY_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_SUCCESS_STORY_STATUSES.join(', ')}`);
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(title);
  const slug = await ensureUniqueSlug(ReputationSuccessStory, id, desiredSlug);

  const moderation = analyseSuccessStory({
    summary,
    content: payload.content ?? null,
    metadata: { status },
  });
  const moderationStatus = moderation.status ?? 'pending';
  const moderatedAt = new Date();
  const workflowStatus =
    status === 'published' && moderationStatus !== 'approved' ? 'in_review' : status;

  const record = await ReputationSuccessStory.create({
    freelancerId: id,
    title,
    slug,
    summary,
    content: payload.content ?? null,
    heroImageUrl: payload.heroImageUrl ? sanitizeUrl(payload.heroImageUrl) : null,
    status: workflowStatus,
    moderationStatus,
    moderationScore: moderation.score ?? null,
    moderationSummary: moderation.summary ?? null,
    moderationLabels: moderation.labels ?? null,
    moderatedAt,
    publishedAt: parseDate(payload.publishedAt, { allowNull: true }),
    featured: Boolean(payload.featured),
    impactMetrics: payload.impactMetrics ?? null,
    ctaUrl: payload.ctaUrl ? sanitizeUrl(payload.ctaUrl) : null,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function upsertMetric(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const metricType = sanitizeString(payload.metricType, { allowNull: false, maxLength: 120 }).toLowerCase();
  const label = sanitizeString(payload.label ?? metricType, { allowNull: false });
  const value = parseDecimal(payload.value, { allowNull: false });
  const unit = sanitizeString(payload.unit ?? null, { allowNull: true, maxLength: 60 });
  const period = sanitizeString(payload.period ?? 'rolling_12_months', { allowNull: false, maxLength: 120 }).toLowerCase();
  const trendDirection = sanitizeString(payload.trendDirection ?? 'flat', {
    allowNull: false,
    maxLength: 10,
  }).toLowerCase();

  if (!REPUTATION_METRIC_TREND_DIRECTIONS.includes(trendDirection)) {
    throw new ValidationError(`trendDirection must be one of: ${REPUTATION_METRIC_TREND_DIRECTIONS.join(', ')}`);
  }

  const trendValue = payload.trendValue == null ? null : parseDecimal(payload.trendValue, { allowNull: true });
  const verifiedAt = parseDate(payload.verifiedAt, { allowNull: true });

  const [record, created] = await ReputationMetric.findOrCreate({
    where: { freelancerId: id, metricType, period },
    defaults: {
      label,
      value,
      unit,
      source: payload.source ?? null,
      trendDirection,
      trendValue,
      verifiedBy: sanitizeString(payload.verifiedBy),
      verifiedAt,
      metadata: payload.metadata ?? null,
    },
  });

  if (!created) {
    await record.update({
      label,
      value,
      unit,
      source: payload.source ?? null,
      trendDirection,
      trendValue,
      verifiedBy: sanitizeString(payload.verifiedBy),
      verifiedAt,
      metadata: payload.metadata ?? null,
    });
  }

  return record.toPublicObject();
}

export async function createBadge(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const name = sanitizeString(payload.name, { allowNull: false });
  if (!name) {
    throw new ValidationError('name is required');
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(name);
  const slug = await ensureUniqueSlug(ReputationBadge, id, desiredSlug);

  const record = await ReputationBadge.create({
    freelancerId: id,
    name,
    slug,
    description: sanitizeString(payload.description, { maxLength: 2000 }),
    issuedBy: sanitizeString(payload.issuedBy),
    issuedAt: parseDate(payload.issuedAt),
    expiresAt: parseDate(payload.expiresAt),
    badgeType: sanitizeString(payload.badgeType),
    level: sanitizeString(payload.level, { maxLength: 60 }),
    assetUrl: payload.assetUrl ? sanitizeUrl(payload.assetUrl) : null,
    isPromoted: Boolean(payload.isPromoted),
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function createReviewWidget(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const name = sanitizeString(payload.name, { allowNull: false });
  const widgetType = sanitizeString(payload.widgetType, { allowNull: false, maxLength: 120 }).toLowerCase();
  if (!name) {
    throw new ValidationError('name is required');
  }
  if (!widgetType) {
    throw new ValidationError('widgetType is required');
  }

  const status = sanitizeString(payload.status ?? 'draft', { allowNull: false }).toLowerCase();
  if (!REPUTATION_REVIEW_WIDGET_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_REVIEW_WIDGET_STATUSES.join(', ')}`);
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(name);
  const slug = await ensureUniqueSlug(ReputationReviewWidget, id, desiredSlug);

  const theme = sanitizeString(payload.theme, { allowNull: true, maxLength: 120 });
  const themeTokens = sanitizeThemeTokens(payload.themeTokens);
  const lastSyncedAt = parseDate(payload.lastSyncedAt);
  const lastPublishedAtInput = parseDate(payload.lastPublishedAt);
  const lastRenderedAtInput = parseDate(payload.lastRenderedAt);
  const now = new Date();
  const computedLastPublishedAt =
    status === 'active' ? lastPublishedAtInput ?? now : lastPublishedAtInput ?? null;
  const computedLastRenderedAt = lastRenderedAtInput ?? null;

  const record = await ReputationReviewWidget.create({
    freelancerId: id,
    name,
    slug,
    widgetType,
    status,
    theme,
    themeTokens,
    embedScript: payload.embedScript ?? null,
    config: payload.config ?? null,
    impressions: payload.impressions == null ? 0 : Math.max(0, Number.parseInt(payload.impressions, 10) || 0),
    ctaClicks: payload.ctaClicks == null ? 0 : Math.max(0, Number.parseInt(payload.ctaClicks, 10) || 0),
    lastSyncedAt,
    lastPublishedAt: computedLastPublishedAt,
    lastRenderedAt: computedLastRenderedAt,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function generateReviewWidgetEmbed(freelancerId, slug, { preview = false } = {}) {
  const id = normalizeFreelancerId(freelancerId);
  const widgetSlug = sanitizeString(slug, { allowNull: false, maxLength: 255 });
  if (!widgetSlug) {
    throw new ValidationError('slug is required');
  }

  const widget = await ReputationReviewWidget.findOne({ where: { freelancerId: id, slug: widgetSlug } });
  if (!widget) {
    throw new NotFoundError('Review widget not found');
  }

  if (!preview && widget.status !== 'active') {
    throw new NotFoundError('Review widget is not published');
  }

  const freelancer = await User.findByPk(id, {
    include: [
      { model: Profile },
      { model: FreelancerProfile },
    ],
  });

  if (!freelancer) {
    throw new NotFoundError('Freelancer profile not found');
  }

  const [testimonialRecords, metricRecords] = await Promise.all([
    ReputationTestimonial.findAll({
      where: {
        freelancerId: id,
        status: 'approved',
        moderationStatus: 'approved',
      },
      order: [
        ['isFeatured', 'DESC'],
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: 12,
    }),
    ReputationMetric.findAll({
      where: { freelancerId: id },
      order: [
        ['trendDirection', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      limit: 8,
    }),
  ]);

  const now = new Date();
  const updates = { lastRenderedAt: now };
  if (widget.status === 'active' && !widget.lastPublishedAt) {
    updates.lastPublishedAt = now;
  }
  await widget.update(updates);

  const widgetPayload = widget.toPublicObject();
  const freelancerPayload = mapFreelancerProfile(freelancer);
  const testimonialPayload = testimonialRecords.map((record) => record.toPublicObject());
  const metricPayload = metricRecords
    .map((record) => record.toPublicObject())
    .map((metric) => ({
      label: metric.label,
      value: formatMetricValue(metric.value, metric.unit),
      trendLabel: formatTrendLabel(metric),
    }))
    .filter((metric) => metric.value != null);

  const html = renderWidgetHtml({
    freelancer: freelancerPayload,
    widget: widgetPayload,
    testimonials: testimonialPayload,
    metrics: metricPayload,
  });

  return {
    html,
    widget: widgetPayload,
    generatedAt: now,
    testimonials: testimonialPayload,
    metrics: metricPayload,
  };
}

export default {
  getFreelancerReputationOverview,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
  generateReviewWidgetEmbed,
};

