import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  User,
  Profile,
  FreelancerProfile,
  FreelancerPortfolioItem,
  FreelancerPortfolioAsset,
  FreelancerPortfolioSetting,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'freelancer:portfolio';
const CACHE_TTL_SECONDS = 90;
const DEFAULT_APP_BASE_URL = (process.env.APP_BASE_URL || 'https://app.gigvora.com').replace(/\/$/, '');

const MAX_TAGS = 25;
const MAX_METRICS = 10;
const MAX_ASSETS_PER_ITEM = 30;
const ALLOWED_VISIBILITIES = ['private', 'network', 'public'];
const ALLOWED_STATUSES = ['draft', 'published', 'archived'];
const ALLOWED_ASSET_TYPES = ['image', 'video', 'document', 'link', 'embed'];

function ensureHttpStatus(error) {
  if (error && error.statusCode && !error.status) {
    error.status = error.statusCode;
  }
  return error;
}

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw ensureHttpStatus(new ValidationError('Freelancer identifier must be a positive integer.'));
  }
  return numeric;
}

function hasKey(payload, key) {
  return payload != null && Object.prototype.hasOwnProperty.call(payload, key);
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
    if (allowNull) {
      return null;
    }
    return '';
  }
  const normalized = text.slice(0, maxLength);
  return toLowerCase ? normalized.toLowerCase() : normalized;
}

function sanitizeText(value, { allowNull = true, maxLength = 10000 } = {}) {
  const text = trimmed(value);
  if (!text) {
    return allowNull ? null : '';
  }
  return text.slice(0, maxLength);
}

function sanitizeEnum(value, allowed, label, { defaultValue = null } = {}) {
  const raw = value ?? defaultValue;
  if (raw == null) {
    if (defaultValue == null) {
      throw ensureHttpStatus(new ValidationError(`${label} is required.`));
    }
    return defaultValue;
  }
  const normalized = sanitizeString(raw, { allowNull: false, toLowerCase: true });
  if (!allowed.includes(normalized)) {
    throw ensureHttpStatus(new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`));
  }
  return normalized;
}

function sanitizeBoolean(value, fallback = false) {
  if (value === undefined) {
    return Boolean(fallback);
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return Boolean(value);
}

function sanitizeInteger(value, { allowNull = true, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value == null || value === '') {
    return allowNull ? null : 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw ensureHttpStatus(new ValidationError('Value must be numeric.'));
  }
  const integer = Math.trunc(numeric);
  if (integer < min || integer > max) {
    throw ensureHttpStatus(new ValidationError(`Value must be between ${min} and ${max}.`));
  }
  return integer;
}

function sanitizeDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ensureHttpStatus(new ValidationError('Invalid date value.'));
  }
  return date;
}

function sanitizeUrl(value, { allowNull = true } = {}) {
  const text = trimmed(value);
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

function sanitizeEmail(value) {
  const text = trimmed(value);
  if (!text) {
    return null;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text)) {
    throw ensureHttpStatus(new ValidationError('Contact email must be a valid email address.'));
  }
  return text.toLowerCase();
}

function sanitizeStringList(values, { maxItems = MAX_TAGS, maxLength = 120 } = {}) {
  if (!values) {
    return [];
  }
  const array = Array.isArray(values)
    ? values
    : `${values}`
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
  const seen = new Set();
  const result = [];
  for (const entry of array) {
    const normalized = sanitizeString(entry, { allowNull: false, maxLength });
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
    if (result.length >= maxItems) {
      break;
    }
  }
  return result;
}

function sanitizeMetrics(metrics) {
  if (!metrics) {
    return [];
  }
  if (!Array.isArray(metrics)) {
    throw ensureHttpStatus(new ValidationError('Impact metrics must be provided as an array.'));
  }
  return metrics.slice(0, MAX_METRICS).map((entry, index) => {
    const label = sanitizeString(entry?.label, { allowNull: false, maxLength: 180 });
    const value = sanitizeString(entry?.value, { allowNull: false, maxLength: 180 });
    const tone = sanitizeString(entry?.tone ?? 'neutral', { allowNull: false, toLowerCase: true, maxLength: 32 });
    const allowedTones = ['positive', 'neutral', 'negative'];
    if (!allowedTones.includes(tone)) {
      throw ensureHttpStatus(
        new ValidationError(`Metric tone for entry ${index + 1} must be one of: ${allowedTones.join(', ')}.`),
      );
    }
    return { label, value, tone };
  });
}

function slugify(value, fallback = 'portfolio') {
  const base = sanitizeString(value, { allowNull: false, toLowerCase: true, maxLength: 120 }) ?? '';
  let slug = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 100);
  if (!slug) {
    slug = `${fallback}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return slug;
}

function sanitizeAssetPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw ensureHttpStatus(new ValidationError('Asset payload must be an object.'));
  }
  const data = {};
  if (!partial || hasKey(payload, 'label')) {
    data.label = sanitizeString(payload.label, { allowNull: false, maxLength: 180 });
    if (!data.label) {
      throw ensureHttpStatus(new ValidationError('Asset label is required.'));
    }
  }
  if (!partial || hasKey(payload, 'description')) {
    data.description = sanitizeText(payload.description, { allowNull: true, maxLength: 2000 });
  }
  if (!partial || hasKey(payload, 'url')) {
    data.url = sanitizeUrl(payload.url, { allowNull: false });
  }
  if (!partial || hasKey(payload, 'thumbnailUrl')) {
    data.thumbnailUrl = sanitizeUrl(payload.thumbnailUrl, { allowNull: true });
  }
  if (!partial || hasKey(payload, 'assetType')) {
    data.assetType = sanitizeEnum(payload.assetType, ALLOWED_ASSET_TYPES, 'Asset type', { defaultValue: 'image' });
  }
  if (!partial || hasKey(payload, 'sortOrder')) {
    data.sortOrder = sanitizeInteger(payload.sortOrder, { allowNull: false, min: 0, max: 9999 });
  }
  if (!partial || hasKey(payload, 'isPrimary')) {
    data.isPrimary = sanitizeBoolean(payload.isPrimary, false);
  }
  if (!partial || hasKey(payload, 'metadata')) {
    data.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  }
  return data;
}

function sanitizePortfolioItemPayload(payload, { existing = null, partial = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw ensureHttpStatus(new ValidationError('Portfolio payload must be an object.'));
  }
  const data = {};

  if (!partial || hasKey(payload, 'title')) {
    const title = sanitizeString(payload.title ?? existing?.title, { allowNull: false, maxLength: 180 });
    if (!title) {
      throw ensureHttpStatus(new ValidationError('Title is required.'));
    }
    data.title = title;
  }

  if (!partial || hasKey(payload, 'tagline')) {
    data.tagline = sanitizeString(payload.tagline ?? existing?.tagline, { allowNull: true, maxLength: 240 });
  }

  if (!partial || hasKey(payload, 'clientName')) {
    data.clientName = sanitizeString(payload.clientName ?? existing?.clientName, { allowNull: true, maxLength: 180 });
  }

  if (!partial || hasKey(payload, 'clientIndustry')) {
    data.clientIndustry = sanitizeString(payload.clientIndustry ?? existing?.clientIndustry, {
      allowNull: true,
      maxLength: 180,
    });
  }

  if (!partial || hasKey(payload, 'role')) {
    data.role = sanitizeString(payload.role ?? existing?.role, { allowNull: true, maxLength: 180 });
  }

  if (!partial || hasKey(payload, 'summary')) {
    data.summary = sanitizeText(payload.summary ?? existing?.summary, { allowNull: true, maxLength: 8000 });
  }

  if (!partial || hasKey(payload, 'problemStatement')) {
    data.problemStatement = sanitizeText(payload.problemStatement ?? existing?.problemStatement, {
      allowNull: true,
      maxLength: 8000,
    });
  }

  if (!partial || hasKey(payload, 'approachSummary')) {
    data.approachSummary = sanitizeText(payload.approachSummary ?? payload.solutionSummary ?? existing?.approachSummary, {
      allowNull: true,
      maxLength: 8000,
    });
  }

  if (!partial || hasKey(payload, 'outcomeSummary')) {
    data.outcomeSummary = sanitizeText(payload.outcomeSummary ?? existing?.outcomeSummary, {
      allowNull: true,
      maxLength: 8000,
    });
  }

  if (!partial || hasKey(payload, 'impactMetrics')) {
    data.impactMetrics = sanitizeMetrics(payload.impactMetrics ?? existing?.impactMetrics ?? []);
  }

  if (!partial || hasKey(payload, 'tags')) {
    data.tags = sanitizeStringList(payload.tags ?? existing?.tags ?? []);
  }

  if (!partial || hasKey(payload, 'industries')) {
    data.industries = sanitizeStringList(payload.industries ?? existing?.industries ?? []);
  }

  if (!partial || hasKey(payload, 'services')) {
    data.services = sanitizeStringList(payload.services ?? existing?.services ?? []);
  }

  if (!partial || hasKey(payload, 'technologies')) {
    data.technologies = sanitizeStringList(payload.technologies ?? existing?.technologies ?? []);
  }

  if (!partial || hasKey(payload, 'heroImageUrl')) {
    data.heroImageUrl = sanitizeUrl(payload.heroImageUrl ?? existing?.heroImageUrl, { allowNull: true });
  }

  if (!partial || hasKey(payload, 'heroVideoUrl')) {
    data.heroVideoUrl = sanitizeUrl(payload.heroVideoUrl ?? existing?.heroVideoUrl, { allowNull: true });
  }

  if (!partial || hasKey(payload, 'callToActionLabel')) {
    data.callToActionLabel = sanitizeString(payload.callToActionLabel ?? existing?.callToActionLabel, {
      allowNull: true,
      maxLength: 160,
    });
  }

  if (!partial || hasKey(payload, 'callToActionUrl')) {
    data.callToActionUrl = sanitizeUrl(payload.callToActionUrl ?? existing?.callToActionUrl, { allowNull: true });
  }

  if (!partial || hasKey(payload, 'repositoryUrl')) {
    data.repositoryUrl = sanitizeUrl(payload.repositoryUrl ?? existing?.repositoryUrl, { allowNull: true });
  }

  if (!partial || hasKey(payload, 'liveUrl')) {
    data.liveUrl = sanitizeUrl(payload.liveUrl ?? existing?.liveUrl, { allowNull: true });
  }

  if (!partial || hasKey(payload, 'visibility')) {
    data.visibility = sanitizeEnum(payload.visibility ?? existing?.visibility ?? 'public', ALLOWED_VISIBILITIES, 'Visibility', {
      defaultValue: 'public',
    });
  }

  if (!partial || hasKey(payload, 'status')) {
    data.status = sanitizeEnum(payload.status ?? existing?.status ?? 'draft', ALLOWED_STATUSES, 'Status', {
      defaultValue: 'draft',
    });
  }

  if (!partial || hasKey(payload, 'isFeatured')) {
    data.isFeatured = sanitizeBoolean(payload.isFeatured ?? existing?.isFeatured ?? false, false);
  }

  if (!partial || hasKey(payload, 'featuredOrder')) {
    data.featuredOrder = sanitizeInteger(payload.featuredOrder ?? existing?.featuredOrder ?? null, {
      allowNull: true,
      min: 0,
      max: 9999,
    });
  }

  if (!partial || hasKey(payload, 'startDate')) {
    data.startDate = sanitizeDate(payload.startDate ?? existing?.startDate ?? null);
  }

  if (!partial || hasKey(payload, 'endDate')) {
    data.endDate = sanitizeDate(payload.endDate ?? existing?.endDate ?? null);
  }

  if (!partial || hasKey(payload, 'publishedAt')) {
    data.publishedAt = sanitizeDate(payload.publishedAt ?? existing?.publishedAt ?? null);
  }

  if (!partial || hasKey(payload, 'archivedAt')) {
    data.archivedAt = sanitizeDate(payload.archivedAt ?? existing?.archivedAt ?? null);
  }

  if (!partial || hasKey(payload, 'lastSharedAt')) {
    data.lastSharedAt = sanitizeDate(payload.lastSharedAt ?? existing?.lastSharedAt ?? null);
  }

  if (!partial || hasKey(payload, 'lastReviewedAt')) {
    data.lastReviewedAt = sanitizeDate(payload.lastReviewedAt ?? existing?.lastReviewedAt ?? null);
  }

  return data;
}

function sanitizeSettingsPayload(payload, { existing = null } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw ensureHttpStatus(new ValidationError('Settings payload must be an object.'));
  }
  const data = {};
  if (hasKey(payload, 'heroHeadline')) {
    data.heroHeadline = sanitizeString(payload.heroHeadline ?? existing?.heroHeadline, { allowNull: true, maxLength: 180 });
  }
  if (hasKey(payload, 'heroSubheadline')) {
    data.heroSubheadline = sanitizeString(payload.heroSubheadline ?? existing?.heroSubheadline, {
      allowNull: true,
      maxLength: 255,
    });
  }
  if (hasKey(payload, 'coverImageUrl')) {
    data.coverImageUrl = sanitizeUrl(payload.coverImageUrl ?? existing?.coverImageUrl, { allowNull: true });
  }
  if (hasKey(payload, 'coverVideoUrl')) {
    data.coverVideoUrl = sanitizeUrl(payload.coverVideoUrl ?? existing?.coverVideoUrl, { allowNull: true });
  }
  if (hasKey(payload, 'brandAccentColor')) {
    const color = sanitizeString(payload.brandAccentColor ?? existing?.brandAccentColor, { allowNull: true, maxLength: 32 });
    if (color && !/^#?[0-9a-fA-F]{3,8}$/.test(color.replace(/\s+/g, ''))) {
      throw ensureHttpStatus(new ValidationError('Brand accent color must be a valid hex color value.'));
    }
    data.brandAccentColor = color ? (color.startsWith('#') ? color : `#${color}`) : null;
  }
  if (hasKey(payload, 'defaultVisibility')) {
    data.defaultVisibility = sanitizeEnum(
      payload.defaultVisibility ?? existing?.defaultVisibility ?? 'public',
      ALLOWED_VISIBILITIES,
      'Default visibility',
      { defaultValue: 'public' },
    );
  }
  if (hasKey(payload, 'allowPublicDownload')) {
    data.allowPublicDownload = sanitizeBoolean(payload.allowPublicDownload ?? existing?.allowPublicDownload ?? false, false);
  }
  if (hasKey(payload, 'autoShareToFeed')) {
    data.autoShareToFeed = sanitizeBoolean(payload.autoShareToFeed ?? existing?.autoShareToFeed ?? true, true);
  }
  if (hasKey(payload, 'showMetrics')) {
    data.showMetrics = sanitizeBoolean(payload.showMetrics ?? existing?.showMetrics ?? true, true);
  }
  if (hasKey(payload, 'showTestimonials')) {
    data.showTestimonials = sanitizeBoolean(payload.showTestimonials ?? existing?.showTestimonials ?? true, true);
  }
  if (hasKey(payload, 'showContactButton')) {
    data.showContactButton = sanitizeBoolean(payload.showContactButton ?? existing?.showContactButton ?? true, true);
  }
  if (hasKey(payload, 'contactEmail')) {
    data.contactEmail = sanitizeEmail(payload.contactEmail ?? existing?.contactEmail ?? null);
  }
  if (hasKey(payload, 'schedulingLink')) {
    data.schedulingLink = sanitizeUrl(payload.schedulingLink ?? existing?.schedulingLink ?? null, { allowNull: true });
  }
  if (hasKey(payload, 'customDomain')) {
    const domain = sanitizeString(payload.customDomain ?? existing?.customDomain ?? null, { allowNull: true, maxLength: 255 });
    data.customDomain = domain || null;
  }
  if (hasKey(payload, 'previewBasePath')) {
    const basePath = sanitizeString(payload.previewBasePath ?? existing?.previewBasePath ?? null, {
      allowNull: true,
      maxLength: 255,
    });
    data.previewBasePath = basePath || null;
  }
  if (hasKey(payload, 'lastPublishedAt')) {
    data.lastPublishedAt = sanitizeDate(payload.lastPublishedAt ?? existing?.lastPublishedAt ?? null);
  }
  if (hasKey(payload, 'lastSyncedAt')) {
    data.lastSyncedAt = sanitizeDate(payload.lastSyncedAt ?? existing?.lastSyncedAt ?? null);
  }
  return data;
}

async function ensureFreelancerExists(userId, { transaction } = {}) {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw ensureHttpStatus(new NotFoundError('Freelancer not found.'));
  }
  return user;
}

async function resolveProfileId(userId, { transaction } = {}) {
  const profile = await FreelancerProfile.findOne({ where: { userId }, transaction });
  if (profile) {
    return profile.id ?? null;
  }
  const genericProfile = await Profile.findOne({ where: { userId }, transaction });
  return genericProfile ? genericProfile.id ?? null : null;
}

async function generateUniqueSlug(userId, title, { transaction, existingId } = {}) {
  const base = slugify(title, 'portfolio');
  let candidate = base;
  let attempt = 1;
  const where = { userId, slug: candidate };
  if (existingId) {
    where.id = { [Op.ne]: existingId };
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await FreelancerPortfolioItem.findOne({ where, transaction, attributes: ['id'] });
    if (!conflict) {
      return candidate;
    }
    attempt += 1;
    candidate = `${base}-${attempt}`;
    where.slug = candidate;
  }
}

function cacheKey(userId) {
  return buildCacheKey(CACHE_NAMESPACE, { userId });
}

function invalidatePortfolioCache(userId) {
  appCache.delete(cacheKey(userId));
}

function buildPreviewBaseUrl(userId, settings = {}) {
  const customDomain = settings.customDomain ? settings.customDomain.trim() : '';
  if (customDomain) {
    if (/^https?:\/\//i.test(customDomain)) {
      return customDomain.replace(/\/$/, '');
    }
    return `https://${customDomain.replace(/^\/*/, '').replace(/\/$/, '')}`;
  }
  const basePath = settings.previewBasePath
    ? `/${settings.previewBasePath.replace(/^\/*/, '').replace(/\/$/, '')}`
    : `/freelancers/${userId}/portfolio`;
  return `${DEFAULT_APP_BASE_URL}${basePath}`;
}

async function serializePortfolioItems(items, previewBaseUrl) {
  return items.map((item) => {
    const serialized = item.toPublicObject();
    serialized.previewUrl = serialized.slug ? `${previewBaseUrl}/${serialized.slug}` : null;
    return serialized;
  });
}

async function fetchPortfolioRecords(userId, { transaction } = {}) {
  const [items, settings] = await Promise.all([
    FreelancerPortfolioItem.findAll({
      where: { userId },
      include: [{ model: FreelancerPortfolioAsset, as: 'assets' }],
      order: [
        ['isFeatured', 'DESC'],
        ['featuredOrder', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      transaction,
    }),
    FreelancerPortfolioSetting.findOne({ where: { userId }, transaction }),
  ]);
  return { items, settings };
}

async function getPortfolio(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const key = cacheKey(normalizedUserId);
  if (!bypassCache) {
    const cached = appCache.get(key);
    if (cached) {
      return cached;
    }
  }

  const { items, settings } = await fetchPortfolioRecords(normalizedUserId);
  const settingsPayload = settings ? settings.toPublicObject() : null;
  const previewBaseUrl = buildPreviewBaseUrl(normalizedUserId, settingsPayload || {});
  const serializedItems = await serializePortfolioItems(items, previewBaseUrl);

  const published = serializedItems.filter((item) => item.status === 'published');
  const drafts = serializedItems.filter((item) => item.status === 'draft');
  const archived = serializedItems.filter((item) => item.status === 'archived');
  const featured = serializedItems.filter((item) => item.isFeatured);
  const totalAssets = serializedItems.reduce((sum, item) => sum + (Array.isArray(item.assets) ? item.assets.length : 0), 0);
  const networkVisible = serializedItems.filter((item) => item.visibility !== 'private');
  const lastUpdated = serializedItems.reduce((latest, item) => {
    const timestamp = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    return timestamp > latest ? timestamp : latest;
  }, 0);

  const response = {
    items: serializedItems,
    settings: settingsPayload,
    summary: {
      total: serializedItems.length,
      published: published.length,
      drafts: drafts.length,
      archived: archived.length,
      featured: featured.length,
      assetCount: totalAssets,
      networkVisible: networkVisible.length,
      lastUpdatedAt: lastUpdated ? new Date(lastUpdated) : null,
      previewBaseUrl,
    },
  };

  appCache.set(key, response, CACHE_TTL_SECONDS);
  return response;
}

async function createPortfolioItem(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const fields = sanitizePortfolioItemPayload(payload, { partial: false });

  return sequelize.transaction(async (transaction) => {
    await ensureFreelancerExists(normalizedUserId, { transaction });
    const profileId = await resolveProfileId(normalizedUserId, { transaction });
    const slugSource = hasKey(payload, 'slug') ? payload.slug : fields.title;
    const slug = await generateUniqueSlug(normalizedUserId, slugSource, { transaction });

    const created = await FreelancerPortfolioItem.create(
      {
        ...fields,
        slug,
        userId: normalizedUserId,
        profileId,
      },
      { transaction },
    );

    invalidatePortfolioCache(normalizedUserId);
    const fresh = await FreelancerPortfolioItem.findByPk(created.id, {
      include: [{ model: FreelancerPortfolioAsset, as: 'assets' }],
      transaction,
    });
    return fresh.toPublicObject();
  });
}

async function updatePortfolioItem(userId, portfolioId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const numericId = sanitizeInteger(portfolioId, { allowNull: false, min: 1 });

  return sequelize.transaction(async (transaction) => {
    const item = await FreelancerPortfolioItem.findOne({
      where: { id: numericId, userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: [{ model: FreelancerPortfolioAsset, as: 'assets' }],
    });
    if (!item) {
      throw ensureHttpStatus(new NotFoundError('Portfolio item not found.'));
    }

    const fields = sanitizePortfolioItemPayload(payload, { existing: item, partial: true });

    if (hasKey(payload, 'slug')) {
      const newSlugSource = payload.slug ?? fields.title ?? item.title;
      const slug = await generateUniqueSlug(normalizedUserId, newSlugSource, { transaction, existingId: item.id });
      fields.slug = slug;
    }

    await item.update(fields, { transaction });

    invalidatePortfolioCache(normalizedUserId);
    const fresh = await FreelancerPortfolioItem.findByPk(item.id, {
      include: [{ model: FreelancerPortfolioAsset, as: 'assets' }],
      transaction,
    });
    return fresh.toPublicObject();
  });
}

async function deletePortfolioItem(userId, portfolioId) {
  const normalizedUserId = normalizeUserId(userId);
  const numericId = sanitizeInteger(portfolioId, { allowNull: false, min: 1 });

  const deleted = await FreelancerPortfolioItem.destroy({ where: { id: numericId, userId: normalizedUserId } });
  if (!deleted) {
    throw ensureHttpStatus(new NotFoundError('Portfolio item not found.'));
  }
  invalidatePortfolioCache(normalizedUserId);
  return { success: true };
}

async function createPortfolioAsset(userId, portfolioId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const numericId = sanitizeInteger(portfolioId, { allowNull: false, min: 1 });

  return sequelize.transaction(async (transaction) => {
    const item = await FreelancerPortfolioItem.findOne({
      where: { id: numericId, userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) {
      throw ensureHttpStatus(new NotFoundError('Portfolio item not found.'));
    }

    const assetCount = await FreelancerPortfolioAsset.count({ where: { portfolioItemId: item.id }, transaction });
    if (assetCount >= MAX_ASSETS_PER_ITEM) {
      throw ensureHttpStatus(
        new ValidationError(`A maximum of ${MAX_ASSETS_PER_ITEM} assets can be stored per portfolio item.`),
      );
    }

    const fields = sanitizeAssetPayload(payload, { partial: false });
    const created = await FreelancerPortfolioAsset.create({ ...fields, portfolioItemId: item.id }, { transaction });

    invalidatePortfolioCache(normalizedUserId);
    return created.toPublicObject();
  });
}

async function updatePortfolioAsset(userId, portfolioId, assetId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const numericPortfolioId = sanitizeInteger(portfolioId, { allowNull: false, min: 1 });
  const numericAssetId = sanitizeInteger(assetId, { allowNull: false, min: 1 });

  return sequelize.transaction(async (transaction) => {
    const item = await FreelancerPortfolioItem.findOne({
      where: { id: numericPortfolioId, userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) {
      throw ensureHttpStatus(new NotFoundError('Portfolio item not found.'));
    }

    const asset = await FreelancerPortfolioAsset.findOne({
      where: { id: numericAssetId, portfolioItemId: item.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!asset) {
      throw ensureHttpStatus(new NotFoundError('Portfolio asset not found.'));
    }

    const fields = sanitizeAssetPayload(payload, { partial: true });
    await asset.update(fields, { transaction });
    invalidatePortfolioCache(normalizedUserId);
    return asset.toPublicObject();
  });
}

async function deletePortfolioAsset(userId, portfolioId, assetId) {
  const normalizedUserId = normalizeUserId(userId);
  const numericPortfolioId = sanitizeInteger(portfolioId, { allowNull: false, min: 1 });
  const numericAssetId = sanitizeInteger(assetId, { allowNull: false, min: 1 });

  return sequelize.transaction(async (transaction) => {
    const item = await FreelancerPortfolioItem.findOne({
      where: { id: numericPortfolioId, userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) {
      throw ensureHttpStatus(new NotFoundError('Portfolio item not found.'));
    }

    const asset = await FreelancerPortfolioAsset.findOne({
      where: { id: numericAssetId, portfolioItemId: item.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!asset) {
      throw ensureHttpStatus(new NotFoundError('Portfolio asset not found.'));
    }

    await asset.destroy({ transaction });
    invalidatePortfolioCache(normalizedUserId);
    return { success: true };
  });
}

async function updatePortfolioSettings(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await ensureFreelancerExists(normalizedUserId, { transaction });
    const existing = await FreelancerPortfolioSetting.findOne({
      where: { userId: normalizedUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const fields = sanitizeSettingsPayload(payload, { existing });
    let record = existing;
    if (record) {
      await record.update(fields, { transaction });
    } else {
      const profileId = await resolveProfileId(normalizedUserId, { transaction });
      record = await FreelancerPortfolioSetting.create(
        {
          userId: normalizedUserId,
          profileId,
          ...fields,
        },
        { transaction },
      );
    }

    invalidatePortfolioCache(normalizedUserId);
    return record.toPublicObject();
  });
}

export default {
  getPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createPortfolioAsset,
  updatePortfolioAsset,
  deletePortfolioAsset,
  updatePortfolioSettings,
};
