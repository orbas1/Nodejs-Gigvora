import crypto from 'crypto';
import {
  sequelize,
  User,
  Profile,
  FreelancerProfile,
  FreelancerExpertiseArea,
  FreelancerSuccessMetric,
  FreelancerTestimonial,
  FreelancerHeroBanner,
  FREELANCER_EXPERTISE_STATUSES,
  FREELANCER_SUCCESS_TRENDS,
  FREELANCER_TESTIMONIAL_STATUSES,
  FREELANCER_HERO_BANNER_STATUSES,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'freelancer:profile-hub';
const CACHE_TTL_SECONDS = 120;
const MAX_EXPERTISE_AREAS = 20;
const MAX_SUCCESS_METRICS = 30;
const MAX_TESTIMONIALS = 25;
const MAX_HERO_BANNERS = 15;
const MAX_TAGS = 20;
const MAX_RECOMMENDATIONS = 20;
const MAX_TRACTION_ITEMS = 10;
const MAX_METRIC_BREAKDOWN_ITEMS = 10;
const MAX_TESTIMONIAL_METRICS = 10;
const MAX_HERO_METRICS = 10;
const TRACTION_TONES = ['positive', 'neutral', 'negative'];

function ensureHttpStatus(error) {
  if (error && error.statusCode && !error.status) {
    error.status = error.statusCode;
  }
  return error;
}

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw ensureHttpStatus(new ValidationError('userId must be a positive integer.'));
  }
  return numeric;
}

function trimmed(value) {
  if (value == null) {
    return '';
  }
  return `${value}`.trim();
}

function sanitizeString(value, { allowNull = true, maxLength = 255, toLowerCase = false } = {}) {
  const text = trimmed(value);
  if (!text) {
    return allowNull ? null : '';
  }
  const truncated = text.slice(0, maxLength);
  return toLowerCase ? truncated.toLowerCase() : truncated;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const normalized = sanitizeString(value, { allowNull: false });
    if (!normalized) {
      return;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

function sanitizeStringList(values, { maxItems = MAX_TAGS, maxLength = 120 } = {}) {
  if (!values) {
    return [];
  }
  const array = Array.isArray(values)
    ? values
    : `${values}`
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean);
  const normalized = uniqueStrings(array)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
  return normalized;
}

function sanitizeEnum(value, allowed, label) {
  const normalized = sanitizeString(value, { allowNull: false, toLowerCase: true });
  if (!allowed.includes(normalized)) {
    throw ensureHttpStatus(new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`));
  }
  return normalized;
}

function sanitizeNumber(
  value,
  { allowNull = true, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {},
) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw ensureHttpStatus(new ValidationError('Value must be numeric.'));
  }
  const clamped = Math.min(Math.max(numeric, min), max);
  return clamped;
}

function sanitizeDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ensureHttpStatus(new ValidationError('Invalid date value.'));
  }
  return date;
}

function slugify(value, fallbackPrefix) {
  const base = sanitizeString(value, { allowNull: false, toLowerCase: true }) ?? '';
  let slug = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 80);

  if (!slug) {
    const fallback = `${fallbackPrefix || 'item'}-${crypto.randomUUID().slice(0, 8)}`;
    slug = fallback.toLowerCase();
  }
  return slug;
}

function sanitizeMetricPairs(values, { allowTone = false, maxItems = MAX_METRIC_BREAKDOWN_ITEMS } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.slice(0, maxItems).map((entry) => {
    const label = sanitizeString(entry?.label, { allowNull: false, maxLength: 180 });
    const value = sanitizeString(entry?.value, { allowNull: false, maxLength: 180 });
    const payload = { label, value };
    if (allowTone) {
      const tone = entry?.tone ? sanitizeEnum(entry.tone, TRACTION_TONES, 'Traction tone') : 'neutral';
      payload.tone = tone;
    }
    return payload;
  });
}

function sanitizeUrl(value, { allowNull = true } = {}) {
  const text = sanitizeString(value, { allowNull: true });
  if (!text) {
    return allowNull ? null : '';
  }
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return url.toString();
  } catch (error) {
    throw ensureHttpStatus(new ValidationError('Invalid URL provided.'));
  }
}

function normalizeId(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw ensureHttpStatus(new ValidationError('Identifiers must be positive integers.'));
  }
  return numeric;
}

function sanitizeExpertiseAreas(items = []) {
  if (!Array.isArray(items)) {
    throw ensureHttpStatus(new ValidationError('Expertise areas must be provided as an array.'));
  }
  if (items.length > MAX_EXPERTISE_AREAS) {
    throw ensureHttpStatus(
      new ValidationError(`A maximum of ${MAX_EXPERTISE_AREAS} expertise areas can be stored.`),
    );
  }

  const seen = new Set();

  return items.map((item, index) => {
    const title = sanitizeString(item?.title, { allowNull: false, maxLength: 200 });
    const slug = slugify(item?.slug ?? title, `expertise-${index + 1}`);
    if (seen.has(slug)) {
      throw ensureHttpStatus(new ValidationError('Duplicate expertise area identifiers detected.'));
    }
    seen.add(slug);

    const status = sanitizeEnum(item?.status ?? 'live', FREELANCER_EXPERTISE_STATUSES, 'Expertise area status');
    const description = sanitizeString(item?.description, { allowNull: true, maxLength: 2000 });
    const tags = sanitizeStringList(item?.tags ?? item?.tagList, { maxItems: MAX_TAGS, maxLength: 80 });
    const recommendations = sanitizeStringList(item?.recommendations, {
      maxItems: MAX_RECOMMENDATIONS,
      maxLength: 200,
    });
    const tractionSnapshot = sanitizeMetricPairs(item?.traction ?? item?.tractionSnapshot ?? [], {
      allowTone: true,
      maxItems: MAX_TRACTION_ITEMS,
    });
    const healthScore = sanitizeNumber(item?.healthScore, { min: 0, max: 100 });
    const displayOrder = Number.isInteger(item?.displayOrder)
      ? Math.max(0, item.displayOrder)
      : index;

    return {
      id: normalizeId(item?.id),
      slug,
      title,
      description,
      status,
      tags,
      recommendations,
      tractionSnapshot,
      healthScore,
      displayOrder,
    };
  });
}

function sanitizeSuccessMetrics(items = []) {
  if (!Array.isArray(items)) {
    throw ensureHttpStatus(new ValidationError('Success metrics must be provided as an array.'));
  }
  if (items.length > MAX_SUCCESS_METRICS) {
    throw ensureHttpStatus(
      new ValidationError(`A maximum of ${MAX_SUCCESS_METRICS} success metrics can be stored.`),
    );
  }

  const seen = new Set();

  return items.map((item, index) => {
    const label = sanitizeString(item?.label, { allowNull: false, maxLength: 200 });
    const metricKey = slugify(item?.metricKey ?? label, `metric-${index + 1}`);
    if (seen.has(metricKey)) {
      throw ensureHttpStatus(new ValidationError('Duplicate success metric identifiers detected.'));
    }
    seen.add(metricKey);

    const value = sanitizeString(item?.value, { allowNull: false, maxLength: 200 });
    const numericValue = sanitizeNumber(item?.numericValue, { allowNull: true });
    const deltaLabel = sanitizeString(item?.delta ?? item?.deltaLabel, { allowNull: true, maxLength: 200 });
    const targetLabel = sanitizeString(item?.target ?? item?.targetLabel, { allowNull: true, maxLength: 200 });
    const trendDirection = sanitizeEnum(
      item?.trend ?? item?.trendDirection ?? 'steady',
      FREELANCER_SUCCESS_TRENDS,
      'Metric trend',
    );
    const breakdown = sanitizeMetricPairs(item?.breakdown ?? [], {
      allowTone: false,
      maxItems: MAX_METRIC_BREAKDOWN_ITEMS,
    });
    const periodStart = sanitizeDate(item?.periodStart ?? item?.period?.start);
    const periodEnd = sanitizeDate(item?.periodEnd ?? item?.period?.end);
    const displayOrder = Number.isInteger(item?.displayOrder)
      ? Math.max(0, item.displayOrder)
      : index;

    return {
      id: normalizeId(item?.id),
      metricKey,
      label,
      value,
      numericValue,
      deltaLabel,
      targetLabel,
      trendDirection,
      breakdown,
      periodStart,
      periodEnd,
      displayOrder,
    };
  });
}

function sanitizeTestimonialMetrics(metrics = []) {
  return sanitizeMetricPairs(metrics, {
    allowTone: false,
    maxItems: MAX_TESTIMONIAL_METRICS,
  });
}

function sanitizeTestimonials(items = []) {
  if (!Array.isArray(items)) {
    throw ensureHttpStatus(new ValidationError('Testimonials must be provided as an array.'));
  }
  if (items.length > MAX_TESTIMONIALS) {
    throw ensureHttpStatus(
      new ValidationError(`A maximum of ${MAX_TESTIMONIALS} testimonials can be stored.`),
    );
  }

  const seen = new Set();

  return items.map((item, index) => {
    const clientName = sanitizeString(item?.client ?? item?.clientName, { allowNull: false, maxLength: 200 });
    const testimonialKey = slugify(item?.testimonialKey ?? `${clientName}-${index + 1}`, `testimonial-${index + 1}`);
    if (seen.has(testimonialKey)) {
      throw ensureHttpStatus(new ValidationError('Duplicate testimonial identifiers detected.'));
    }
    seen.add(testimonialKey);

    const status = sanitizeEnum(
      item?.status ?? 'draft',
      FREELANCER_TESTIMONIAL_STATUSES,
      'Testimonial status',
    );
    const quote = sanitizeString(item?.quote, { allowNull: false, maxLength: 4000 });
    const clientRole = sanitizeString(item?.role ?? item?.clientRole, { allowNull: true, maxLength: 200 });
    const clientCompany = sanitizeString(item?.company ?? item?.clientCompany, {
      allowNull: true,
      maxLength: 200,
    });
    const projectName = sanitizeString(item?.project ?? item?.projectName, { allowNull: true, maxLength: 200 });
    const isFeatured = Boolean(item?.isFeatured ?? item?.featured);
    const weight = sanitizeNumber(item?.weight, { allowNull: true, min: 0, max: 100 });
    const nextAction = sanitizeString(item?.nextAction, { allowNull: true, maxLength: 255 });
    const curationNotes = sanitizeString(item?.curationNotes, { allowNull: true, maxLength: 4000 });
    const requestedAt = sanitizeDate(item?.requestedAt);
    const recordedAt = sanitizeDate(item?.recordedAt);
    const publishedAt = sanitizeDate(item?.publishedAt);
    const metrics = sanitizeTestimonialMetrics(item?.metrics ?? []);
    const displayOrder = Number.isInteger(item?.displayOrder)
      ? Math.max(0, item.displayOrder)
      : index;

    return {
      id: normalizeId(item?.id),
      testimonialKey,
      clientName,
      clientRole,
      clientCompany,
      projectName,
      quote,
      status,
      isFeatured,
      weight,
      nextAction,
      curationNotes,
      metrics,
      requestedAt,
      recordedAt,
      publishedAt,
      displayOrder,
    };
  });
}

function sanitizeHeroBannerMetrics(metrics = []) {
  return sanitizeMetricPairs(metrics, {
    allowTone: false,
    maxItems: MAX_HERO_METRICS,
  });
}

function sanitizeHeroBanners(items = []) {
  if (!Array.isArray(items)) {
    throw ensureHttpStatus(new ValidationError('Hero banners must be provided as an array.'));
  }
  if (items.length > MAX_HERO_BANNERS) {
    throw ensureHttpStatus(
      new ValidationError(`A maximum of ${MAX_HERO_BANNERS} hero banners can be stored.`),
    );
  }

  const seen = new Set();

  return items.map((item, index) => {
    const title = sanitizeString(item?.title, { allowNull: false, maxLength: 200 });
    const bannerKey = slugify(item?.bannerKey ?? title, `banner-${index + 1}`);
    if (seen.has(bannerKey)) {
      throw ensureHttpStatus(new ValidationError('Duplicate hero banner identifiers detected.'));
    }
    seen.add(bannerKey);

    const headline = sanitizeString(item?.headline, { allowNull: false, maxLength: 220 });
    const audience = sanitizeString(item?.audience, { allowNull: true, maxLength: 200 });
    const callToActionLabel = sanitizeString(item?.cta?.label ?? item?.callToActionLabel ?? item?.ctaLabel, {
      allowNull: true,
      maxLength: 200,
    });
    const callToActionUrl = sanitizeUrl(item?.cta?.url ?? item?.callToActionUrl ?? item?.ctaUrl, { allowNull: true });
    const status = sanitizeEnum(
      item?.status ?? 'planned',
      FREELANCER_HERO_BANNER_STATUSES,
      'Hero banner status',
    );
    const gradient = sanitizeString(item?.gradient, { allowNull: true, maxLength: 255 });
    const experimentId = sanitizeString(item?.experimentId, { allowNull: true, maxLength: 120 });
    const backgroundImageUrl = sanitizeUrl(item?.backgroundImageUrl, { allowNull: true });
    const conversionTarget = sanitizeString(item?.conversionTarget, { allowNull: true, maxLength: 200 });
    const lastLaunchedAt = sanitizeDate(item?.lastLaunchedAt);
    const metrics = sanitizeHeroBannerMetrics(item?.metrics ?? []);
    const displayOrder = Number.isInteger(item?.displayOrder)
      ? Math.max(0, item.displayOrder)
      : index;

    return {
      id: normalizeId(item?.id),
      bannerKey,
      title,
      headline,
      audience,
      callToActionLabel,
      callToActionUrl,
      status,
      gradient,
      experimentId,
      backgroundImageUrl,
      conversionTarget,
      lastLaunchedAt,
      metrics,
      displayOrder,
    };
  });
}

function cacheKeyForUser(userId) {
  return buildCacheKey(CACHE_NAMESPACE, { userId });
}

function buildInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatStatus(value) {
  if (!value) {
    return null;
  }
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function mapExpertiseArea(record) {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description,
    status: record.status,
    tags: Array.isArray(record.tags) ? record.tags : [],
    recommendations: Array.isArray(record.recommendations) ? record.recommendations : [],
    traction: Array.isArray(record.tractionSnapshot) ? record.tractionSnapshot : [],
    healthScore: record.healthScore == null ? null : Number(record.healthScore),
    displayOrder: record.displayOrder ?? 0,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

function mapSuccessMetric(record) {
  return {
    id: record.id,
    metricKey: record.metricKey,
    label: record.label,
    value: record.value,
    numericValue: record.numericValue == null ? null : Number(record.numericValue),
    delta: record.deltaLabel,
    target: record.targetLabel,
    trend: record.trendDirection,
    breakdown: Array.isArray(record.breakdown) ? record.breakdown : [],
    period: {
      start: record.periodStart ? record.periodStart.toISOString() : null,
      end: record.periodEnd ? record.periodEnd.toISOString() : null,
    },
    displayOrder: record.displayOrder ?? 0,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

function mapTestimonial(record) {
  return {
    id: record.id,
    testimonialKey: record.testimonialKey,
    client: record.clientName,
    role: record.clientRole,
    company: record.clientCompany,
    project: record.projectName,
    quote: record.quote,
    status: record.status,
    isFeatured: Boolean(record.isFeatured),
    weight: record.weight == null ? null : Number(record.weight),
    nextAction: record.nextAction,
    curationNotes: record.curationNotes,
    metrics: Array.isArray(record.metrics) ? record.metrics : [],
    requestedAt: record.requestedAt ? record.requestedAt.toISOString() : null,
    recordedAt: record.recordedAt ? record.recordedAt.toISOString() : null,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    displayOrder: record.displayOrder ?? 0,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

function mapHeroBanner(record) {
  return {
    id: record.id,
    bannerKey: record.bannerKey,
    title: record.title,
    headline: record.headline,
    audience: record.audience,
    cta: {
      label: record.callToActionLabel,
      url: record.callToActionUrl,
    },
    status: record.status,
    gradient: record.gradient,
    experimentId: record.experimentId,
    backgroundImageUrl: record.backgroundImageUrl,
    conversionTarget: record.conversionTarget,
    lastLaunchedAt: record.lastLaunchedAt ? record.lastLaunchedAt.toISOString() : null,
    metrics: Array.isArray(record.metrics) ? record.metrics : [],
    displayOrder: record.displayOrder ?? 0,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

function buildSidebarProfile(user, profile, successMetrics, heroBanners, testimonials, expertiseAreas) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Gigvora Freelancer';
  const headline = profile.headline || user.FreelancerProfile?.title || 'Independent professional';
  const availabilityStatus = formatStatus(profile.availabilityStatus);
  const availabilityLabel = availabilityStatus ? `Availability: ${availabilityStatus}` : null;
  const launchpadStatus = profile.launchpadEligibility?.status === 'eligible' ? 'Launchpad ready' : null;
  const badges = [];

  if (Array.isArray(profile.statusFlags)) {
    profile.statusFlags.slice(0, 3).forEach((flag) => {
      const formatted = formatStatus(flag);
      if (formatted) {
        badges.push(formatted);
      }
    });
  }
  if (launchpadStatus) {
    badges.push(launchpadStatus);
  }

  const metricByKey = new Map(successMetrics.map((metric) => [metric.metricKey, metric]));
  const metrics = [
    { label: 'Active retainers', value: metricByKey.get('active_retainers')?.value ?? '0' },
    { label: 'Launchpad gigs', value: metricByKey.get('launchpad_gigs')?.value ?? '0' },
    { label: 'Avg. CSAT', value: metricByKey.get('avg_csat')?.value ?? 'N/A' },
    {
      label: 'Net-new revenue (90d)',
      value: metricByKey.get('revenue_90d')?.value ?? '$0',
    },
  ];

  return {
    name: fullName,
    role: headline,
    initials: buildInitials(fullName),
    status: availabilityLabel,
    badges,
    metrics,
    totals: {
      heroBannersLive: heroBanners.filter((banner) => banner.status === 'live').length,
      testimonialsPublished: testimonials.filter((testimonial) => testimonial.status === 'published').length,
      expertiseLive: expertiseAreas.filter((area) => area.status === 'live').length,
    },
  };
}

function buildSummary(expertiseAreas, successMetrics, testimonials, heroBanners) {
  const metricByKey = new Map(successMetrics.map((metric) => [metric.metricKey, metric]));
  const toNumber = (metricKey) => {
    const metric = metricByKey.get(metricKey);
    if (!metric) return 0;
    return Number(metric.numericValue ?? Number.parseFloat(metric.value)) || 0;
  };

  const nextScheduledTestimonial = testimonials
    .filter((testimonial) => testimonial.status === 'scheduled' && testimonial.requestedAt)
    .sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt))[0];

  return {
    retainerCount: toNumber('active_retainers'),
    launchpadGigCount: toNumber('launchpad_gigs'),
    satisfactionScore: metricByKey.get('avg_csat')?.value ?? null,
    revenueTrailing90d: metricByKey.get('revenue_90d')?.value ?? null,
    heroBannersLive: heroBanners.filter((banner) => banner.status === 'live').length,
    testimonialsPublished: testimonials.filter((testimonial) => testimonial.status === 'published').length,
    expertiseLiveCount: expertiseAreas.filter((area) => area.status === 'live').length,
    successMetricCount: successMetrics.length,
    nextTestimonialDueAt: nextScheduledTestimonial?.requestedAt ?? null,
  };
}

async function loadFreelancerContext(userId, { transaction, lock = false, includeCollections = true } = {}) {
  const profileInclude = {
    model: Profile,
    include: [],
  };

  if (includeCollections) {
    profileInclude.include.push(
      {
        model: FreelancerExpertiseArea,
        as: 'expertiseAreas',
        separate: true,
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      {
        model: FreelancerSuccessMetric,
        as: 'successMetrics',
        separate: true,
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      {
        model: FreelancerTestimonial,
        as: 'testimonials',
        separate: true,
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      {
        model: FreelancerHeroBanner,
        as: 'heroBanners',
        separate: true,
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      },
    );
  }

  const user = await User.findByPk(userId, {
    include: [profileInclude, FreelancerProfile],
    transaction,
    lock: lock ? transaction?.LOCK?.UPDATE : undefined,
  });

  if (!user) {
    throw ensureHttpStatus(new NotFoundError('User not found.'));
  }
  if (!user.Profile) {
    throw ensureHttpStatus(new NotFoundError('Profile not found for user.'));
  }
  return user;
}

function buildResponseFromContext(user) {
  const profile = user.Profile;
  const expertiseAreas = Array.isArray(profile.expertiseAreas)
    ? profile.expertiseAreas.map(mapExpertiseArea)
    : [];
  const successMetrics = Array.isArray(profile.successMetrics)
    ? profile.successMetrics.map(mapSuccessMetric)
    : [];
  const testimonials = Array.isArray(profile.testimonials)
    ? profile.testimonials.map(mapTestimonial)
    : [];
  const heroBanners = Array.isArray(profile.heroBanners)
    ? profile.heroBanners.map(mapHeroBanner)
    : [];

  const sidebarProfile = buildSidebarProfile(
    user,
    profile,
    successMetrics,
    heroBanners,
    testimonials,
    expertiseAreas,
  );
  const summary = buildSummary(expertiseAreas, successMetrics, testimonials, heroBanners);

  return {
    sidebarProfile,
    summary,
    expertiseAreas,
    successMetrics,
    testimonials,
    heroBanners,
    availability: {
      status: profile.availabilityStatus,
      hoursPerWeek: profile.availableHoursPerWeek,
      openToRemote: profile.openToRemote,
      notes: profile.availabilityNotes,
      updatedAt: profile.availabilityUpdatedAt ? profile.availabilityUpdatedAt.toISOString() : null,
    },
    profile: {
      id: profile.id,
      userId: profile.userId,
      headline: profile.headline,
      missionStatement: profile.missionStatement,
      location: profile.location,
      timezone: profile.timezone,
    },
    availableDashboards: ['freelancer', 'user', 'agency'],
  };
}

async function syncCollection(model, profileId, items, { transaction }) {
  const existing = await model.findAll({
    where: { profileId },
    transaction,
  });

  const existingById = new Map(existing.map((record) => [record.id, record]));
  const retainedIds = new Set();

  for (const item of items) {
    const { id, ...payload } = item;
    payload.profileId = profileId;
    if (id && existingById.has(id)) {
      await existingById.get(id).update(payload, { transaction });
      retainedIds.add(id);
    } else {
      const created = await model.create(payload, { transaction });
      retainedIds.add(created.id);
    }
  }

  const deletions = existing.filter((record) => !retainedIds.has(record.id));
  await Promise.all(deletions.map((record) => record.destroy({ transaction })));
}

export async function getFreelancerProfileHub(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const key = cacheKeyForUser(normalizedUserId);

  if (!bypassCache) {
    const cached = appCache.get(key);
    if (cached) {
      return cached;
    }
  }

  const user = await loadFreelancerContext(normalizedUserId, { includeCollections: true });
  const response = buildResponseFromContext(user);
  appCache.set(key, response, CACHE_TTL_SECONDS);
  return response;
}

export async function updateFreelancerProfileHub(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const key = cacheKeyForUser(normalizedUserId);

  const result = await sequelize.transaction(async (transaction) => {
    const user = await loadFreelancerContext(normalizedUserId, {
      transaction,
      lock: true,
      includeCollections: false,
    });
    const profileId = user.Profile.id;

    if (payload.expertiseAreas !== undefined) {
      const items = sanitizeExpertiseAreas(payload.expertiseAreas);
      await syncCollection(FreelancerExpertiseArea, profileId, items, { transaction });
    }
    if (payload.successMetrics !== undefined) {
      const items = sanitizeSuccessMetrics(payload.successMetrics);
      await syncCollection(FreelancerSuccessMetric, profileId, items, { transaction });
    }
    if (payload.testimonials !== undefined) {
      const items = sanitizeTestimonials(payload.testimonials);
      await syncCollection(FreelancerTestimonial, profileId, items, { transaction });
    }
    if (payload.heroBanners !== undefined) {
      const items = sanitizeHeroBanners(payload.heroBanners);
      await syncCollection(FreelancerHeroBanner, profileId, items, { transaction });
    }

    const refreshed = await loadFreelancerContext(normalizedUserId, {
      transaction,
      includeCollections: true,
    });
    return buildResponseFromContext(refreshed);
  });

  appCache.set(key, result, CACHE_TTL_SECONDS);
  return result;
}

export async function updateFreelancerExpertiseAreas(userId, items) {
  return updateFreelancerProfileHub(userId, { expertiseAreas: items });
}

export async function updateFreelancerSuccessMetrics(userId, items) {
  return updateFreelancerProfileHub(userId, { successMetrics: items });
}

export async function updateFreelancerTestimonials(userId, items) {
  return updateFreelancerProfileHub(userId, { testimonials: items });
}

export async function updateFreelancerHeroBanners(userId, items) {
  return updateFreelancerProfileHub(userId, { heroBanners: items });
}

export default {
  getFreelancerProfileHub,
  updateFreelancerProfileHub,
  updateFreelancerExpertiseAreas,
  updateFreelancerSuccessMetrics,
  updateFreelancerTestimonials,
  updateFreelancerHeroBanners,
};
