import { PlatformSetting } from '../models/platformSetting.js';
import { PlatformSettingAudit } from '../models/platformSettingAudit.js';
import { ESCROW_INTEGRATION_PROVIDERS } from '../models/constants/index.js';
import { ValidationError } from '../utils/errors.js';
import { syncCriticalDependencies } from '../observability/dependencyHealth.js';
import { appCache } from '../utils/cache.js';
import { encryptSecret, decryptSecret, isEncryptedSecret, maskSecret } from '../utils/secretStorage.js';
import { UserRole } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

const PLATFORM_SETTINGS_KEY = 'platform';
const PAYMENT_PROVIDERS = new Set(ESCROW_INTEGRATION_PROVIDERS);
const SUBSCRIPTION_INTERVALS = ['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'];

const PLATFORM_SETTINGS_CACHE_KEY = 'platform-settings:snapshot';
const PLATFORM_SETTINGS_CACHE_TTL_SECONDS = 60;
const RECIPIENT_CACHE_KEY = 'platform-settings:recipients';
const RECIPIENT_CACHE_TTL_SECONDS = 300;

const SECRET_FIELD_PATHS = [
  ['payments', 'stripe', 'secretKey'],
  ['payments', 'stripe', 'webhookSecret'],
  ['payments', 'escrow_com', 'apiKey'],
  ['payments', 'escrow_com', 'apiSecret'],
  ['smtp', 'password'],
  ['storage', 'cloudflare_r2', 'accessKeyId'],
  ['storage', 'cloudflare_r2', 'secretAccessKey'],
];

const SECRET_FIELD_LOOKUP = new Set(SECRET_FIELD_PATHS.map((segments) => segments.join('.')));
const NOTIFICATION_ROLE_KEYS = [
  'platform_admin',
  'admin',
  'compliance',
  'compliance_manager',
  'finance',
  'trust',
];

let notificationServicePromise = null;

function deepClone(value) {
  if (value == null) {
    return value ?? null;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function getValueAtPath(object, pathSegments) {
  return pathSegments.reduce((acc, segment) => {
    if (acc == null) {
      return undefined;
    }
    return acc[segment];
  }, object);
}

function setValueAtPath(object, pathSegments, value) {
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return object;
  }
  let cursor = object;
  for (let index = 0; index < pathSegments.length; index += 1) {
    const segment = pathSegments[index];
    const isLast = index === pathSegments.length - 1;
    if (isLast) {
      cursor[segment] = value;
    } else {
      if (cursor[segment] == null || typeof cursor[segment] !== 'object') {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }
  }
  return object;
}

function decryptSecretsInPlace(snapshot) {
  SECRET_FIELD_PATHS.forEach((segments) => {
    const currentValue = getValueAtPath(snapshot, segments);
    if (isEncryptedSecret(currentValue)) {
      setValueAtPath(snapshot, segments, decryptSecret(currentValue));
    }
  });
  return snapshot;
}

function encryptSecretsForPersistence(snapshot) {
  const clone = deepClone(snapshot) ?? {};
  SECRET_FIELD_PATHS.forEach((segments) => {
    const plainValue = getValueAtPath(snapshot, segments);
    const normalized = typeof plainValue === 'string' ? plainValue.trim() : plainValue;
    if (normalized == null || normalized === '') {
      setValueAtPath(clone, segments, null);
      return;
    }
    if (isEncryptedSecret(normalized)) {
      setValueAtPath(clone, segments, normalized);
      return;
    }
    setValueAtPath(clone, segments, encryptSecret(normalized));
  });
  return clone;
}

function pathToString(pathSegments = []) {
  return pathSegments
    .map((segment) => (typeof segment === 'number' ? `[${segment}]` : segment))
    .filter((segment) => segment !== undefined && segment !== '')
    .join('.');
}

function secretKeyFromSegments(pathSegments = []) {
  return pathSegments.filter((segment) => typeof segment === 'string').join('.');
}

function flattenSnapshot(snapshot, pathSegments = []) {
  if (Array.isArray(snapshot)) {
    return snapshot.flatMap((value, index) => flattenSnapshot(value, [...pathSegments, index]));
  }
  if (snapshot && typeof snapshot === 'object') {
    return Object.entries(snapshot).flatMap(([key, value]) =>
      flattenSnapshot(value, [...pathSegments, key]),
    );
  }
  return [
    {
      path: pathSegments,
      field: pathToString(pathSegments),
      secret: SECRET_FIELD_LOOKUP.has(secretKeyFromSegments(pathSegments)),
      value: snapshot,
    },
  ];
}

function computeDiffEntries(beforeSnapshot, afterSnapshot) {
  const beforeEntries = new Map();
  flattenSnapshot(beforeSnapshot).forEach((entry) => {
    if (entry.field) {
      beforeEntries.set(entry.field, entry);
    }
  });

  const afterEntries = new Map();
  flattenSnapshot(afterSnapshot).forEach((entry) => {
    if (entry.field) {
      afterEntries.set(entry.field, entry);
    }
  });

  const keys = new Set([...beforeEntries.keys(), ...afterEntries.keys()]);
  const diff = [];

  keys.forEach((key) => {
    const beforeEntry = beforeEntries.get(key);
    const afterEntry = afterEntries.get(key);
    const beforeValue = beforeEntry?.value;
    const afterValue = afterEntry?.value;
    if (!Object.is(beforeValue, afterValue)) {
      diff.push({
        field: key,
        segments: afterEntry?.path ?? beforeEntry?.path ?? [],
        secret: afterEntry?.secret ?? beforeEntry?.secret ?? false,
        before: beforeValue,
        after: afterValue,
      });
    }
  });

  return diff;
}

function sanitizeDiffEntries(diffEntries = []) {
  return diffEntries.map((entry) => ({
    field: entry.field,
    before: entry.secret ? maskSecret(entry.before) ?? null : entry.before ?? null,
    after: entry.secret ? maskSecret(entry.after) ?? null : entry.after ?? null,
  }));
}

function buildSnapshotFromDiff(diffEntries = [], key = 'before') {
  return diffEntries.reduce((acc, entry) => {
    const value = entry[key];
    if (value !== undefined) {
      acc[entry.field] = value;
    }
    return acc;
  }, {});
}

function buildChangeSummary(diffEntries = []) {
  if (!diffEntries.length) {
    return 'No fields changed';
  }
  const fields = diffEntries.map((entry) => entry.field);
  const headline = fields.slice(0, 5).join(', ');
  return fields.length > 5 ? `${headline} +${fields.length - 5} more` : headline;
}

async function loadNotificationService() {
  if (!notificationServicePromise) {
    notificationServicePromise = import('./notificationService.js').catch((error) => {
      logger.warn({ error }, 'Unable to load notification service for platform settings updates');
      return null;
    });
  }
  const module = await notificationServicePromise;
  return module?.default ?? module;
}

async function resolveNotificationRecipients() {
  return appCache.remember(RECIPIENT_CACHE_KEY, RECIPIENT_CACHE_TTL_SECONDS, async () => {
    const rows = await UserRole.findAll({
      attributes: ['userId'],
      where: { role: { [Op.in]: NOTIFICATION_ROLE_KEYS } },
      raw: true,
    });
    const unique = new Set();
    rows.forEach((row) => {
      const candidate = Number.parseInt(row.userId, 10);
      if (Number.isFinite(candidate)) {
        unique.add(candidate);
      }
    });
    return Array.from(unique);
  });
}

async function dispatchSettingsUpdateNotification({ actorId, diff }) {
  if (!diff?.length) {
    return;
  }
  const notificationService = await loadNotificationService();
  if (!notificationService?.queueNotification) {
    return;
  }

  const recipients = await resolveNotificationRecipients();
  const summary = buildChangeSummary(diff);
  const payload = {
    changedFields: diff.map((entry) => entry.field),
    summary,
  };

  await Promise.allSettled(
    recipients
      .filter((userId) => userId && userId !== actorId)
      .map((userId) =>
        notificationService.queueNotification(
          {
            userId,
            category: 'compliance',
            priority: 'high',
            type: 'platform.settings.updated',
            title: 'Platform settings updated',
            body: `Updated fields: ${summary}`,
            payload,
          },
          { bypassQuietHours: true },
        ),
      ),
  );
}

async function recordPlatformSettingAudit({ actorId, actorType, diff }) {
  if (!diff?.length) {
    return null;
  }

  const sanitizedDiff = sanitizeDiffEntries(diff);
  const summary = buildChangeSummary(sanitizedDiff);

  try {
    return await PlatformSettingAudit.create({
      settingKey: PLATFORM_SETTINGS_KEY,
      actorId: actorId ?? null,
      actorType: actorType ?? null,
      changeType: 'update',
      summary,
      diff: sanitizedDiff,
      beforeSnapshot: buildSnapshotFromDiff(sanitizedDiff, 'before'),
      afterSnapshot: buildSnapshotFromDiff(sanitizedDiff, 'after'),
      metadata: {
        changedFieldCount: sanitizedDiff.length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to record platform setting audit entry');
    return null;
  }
}

function invalidatePlatformSettingsCache() {
  appCache.delete(PLATFORM_SETTINGS_CACHE_KEY);
}

function cachePlatformSettingsSnapshot(snapshot) {
  appCache.set(PLATFORM_SETTINGS_CACHE_KEY, deepClone(snapshot), PLATFORM_SETTINGS_CACHE_TTL_SECONDS);
}

function validateSettingsSnapshot(snapshot = {}) {
  const provider = snapshot?.payments?.provider ?? 'stripe';
  if (!PAYMENT_PROVIDERS.has(provider)) {
    throw new ValidationError(`Unsupported payment provider: ${provider}`);
  }

  if (provider === 'stripe') {
    const publishableKey = snapshot?.payments?.stripe?.publishableKey ?? '';
    const secretKey = snapshot?.payments?.stripe?.secretKey ?? '';
    if (!publishableKey.trim()) {
      throw new ValidationError('Stripe publishable key is required when Stripe is the active payment provider.');
    }
    if (!secretKey.trim()) {
      throw new ValidationError('Stripe secret key is required when Stripe is the active payment provider.');
    }
  }

  if (provider === 'escrow_com') {
    const apiKey = snapshot?.payments?.escrow_com?.apiKey ?? '';
    const apiSecret = snapshot?.payments?.escrow_com?.apiSecret ?? '';
    if (!apiKey.trim()) {
      throw new ValidationError('Escrow.com API key is required when escrow_com is the active payment provider.');
    }
    if (!apiSecret.trim()) {
      throw new ValidationError('Escrow.com API secret is required when escrow_com is the active payment provider.');
    }
    if (snapshot?.featureToggles?.escrow === false) {
      throw new ValidationError('Escrow compliance toggle cannot be disabled while escrow_com payments are active.');
    }
  }
}

function coerceBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === '1') return true;
    if (lowered === 'false' || lowered === '0') return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceNumber(value, fallback, { min, max, precision } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let sanitized = numeric;
  if (typeof min === 'number' && sanitized < min) {
    sanitized = min;
  }
  if (typeof max === 'number' && sanitized > max) {
    sanitized = max;
  }
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    sanitized = Math.round(sanitized * multiplier) / multiplier;
  }
  return sanitized;
}

function coerceInteger(value, fallback, options = {}) {
  const numeric = coerceNumber(value, fallback, options);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function coerceString(value, fallback) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return fallback;
}

function coerceOptionalString(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function uniqueStringList(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function coerceIsoDateString(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? fallback : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function ensureIdentifier(prefix, candidateId, fallbackId, index) {
  const candidate = coerceOptionalString(candidateId, '') || coerceOptionalString(fallbackId, '');
  if (candidate) {
    return candidate;
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${index + 1}-${random}`;
}

function normalizeCollection(inputList, fallbackList, limit, normalizer) {
  const sourceList = Array.isArray(inputList) ? inputList : Array.isArray(fallbackList) ? fallbackList : [];
  const baselineList = Array.isArray(fallbackList) ? fallbackList : [];
  const normalized = sourceList
    .map((item, index) => normalizer(item, baselineList[index] ?? {}, index))
    .filter(Boolean);
  if (typeof limit === 'number') {
    return normalized.slice(0, limit);
  }
  return normalized;
}

function normalizeHomepageStat(stat = {}, fallback = {}, index = 0) {
  const label = coerceOptionalString(stat.label, fallback.label ?? '');
  const suffix = coerceOptionalString(stat.suffix, fallback.suffix ?? '');
  const value = coerceNumber(stat.value, fallback.value ?? 0, { min: 0, precision: 2 });
  if (!label && value <= 0) {
    return null;
  }
  return {
    id: ensureIdentifier('homepage-stat', stat.id, fallback.id, index),
    label,
    value,
    suffix,
  };
}

function normalizeHomepageValueProp(item = {}, fallback = {}, index = 0) {
  const title = coerceOptionalString(item.title, fallback.title ?? '');
  const description = coerceOptionalString(item.description, fallback.description ?? '');
  if (!title && !description) {
    return null;
  }
  return {
    id: ensureIdentifier('homepage-value', item.id, fallback.id, index),
    title,
    description,
    icon: coerceOptionalString(item.icon, fallback.icon ?? ''),
    ctaLabel: coerceOptionalString(item.ctaLabel, fallback.ctaLabel ?? ''),
    ctaHref: coerceOptionalString(item.ctaHref, fallback.ctaHref ?? ''),
    mediaUrl: coerceOptionalString(item.mediaUrl, fallback.mediaUrl ?? ''),
    mediaAlt: coerceOptionalString(item.mediaAlt, fallback.mediaAlt ?? ''),
  };
}

function normalizeHomepageBullet(rawBullet, fallback = {}, index = 0, prefix = 'homepage-bullet') {
  if (rawBullet == null) {
    return null;
  }
  const value =
    typeof rawBullet === 'string'
      ? rawBullet
      : typeof rawBullet === 'object'
      ? rawBullet.text ?? rawBullet.label ?? ''
      : '';
  const text = coerceOptionalString(value, fallback.text ?? fallback.label ?? '');
  if (!text) {
    return null;
  }
  return {
    id: ensureIdentifier(prefix, rawBullet.id, fallback.id, index),
    text,
  };
}

function normalizeHomepageFeature(section = {}, fallback = {}, index = 0) {
  const title = coerceOptionalString(section.title, fallback.title ?? '');
  const description = coerceOptionalString(section.description, fallback.description ?? '');
  if (!title && !description) {
    return null;
  }
  const mediaTypeCandidate = coerceOptionalString(section.mediaType, fallback.mediaType ?? 'image').toLowerCase();
  const mediaType = ['image', 'video', 'illustration'].includes(mediaTypeCandidate) ? mediaTypeCandidate : 'image';
  const fallbackBullets = Array.isArray(fallback.bullets) ? fallback.bullets : [];
  const bullets = normalizeCollection(
    section.bullets,
    fallbackBullets,
    6,
    (bullet, fallbackBullet, bulletIndex) =>
      normalizeHomepageBullet(bullet, fallbackBullet, bulletIndex, `homepage-feature-${index + 1}-bullet`),
  ).filter(Boolean);

  return {
    id: ensureIdentifier('homepage-feature', section.id, fallback.id, index),
    title,
    description,
    mediaType,
    mediaUrl: coerceOptionalString(section.mediaUrl, fallback.mediaUrl ?? ''),
    mediaAlt: coerceOptionalString(section.mediaAlt, fallback.mediaAlt ?? ''),
    bullets,
  };
}

function normalizeHomepageTestimonial(testimonial = {}, fallback = {}, index = 0) {
  const quote = coerceOptionalString(testimonial.quote, fallback.quote ?? '');
  const authorName = coerceOptionalString(testimonial.authorName, fallback.authorName ?? '');
  if (!quote && !authorName) {
    return null;
  }
  return {
    id: ensureIdentifier('homepage-testimonial', testimonial.id, fallback.id, index),
    quote,
    authorName,
    authorRole: coerceOptionalString(testimonial.authorRole, fallback.authorRole ?? ''),
    avatarUrl: coerceOptionalString(testimonial.avatarUrl, fallback.avatarUrl ?? ''),
    highlight: coerceBoolean(testimonial.highlight, fallback.highlight ?? false),
  };
}

function normalizeHomepageFaq(entry = {}, fallback = {}, index = 0) {
  const question = coerceOptionalString(entry.question, fallback.question ?? '');
  const answer = coerceOptionalString(entry.answer, fallback.answer ?? '');
  if (!question && !answer) {
    return null;
  }
  return {
    id: ensureIdentifier('homepage-faq', entry.id, fallback.id, index),
    question,
    answer,
  };
}

function normalizeHomepageQuickLink(link = {}, fallback = {}, index = 0) {
  const label = coerceOptionalString(link.label, fallback.label ?? '');
  const href = coerceOptionalString(link.href, fallback.href ?? '');
  if (!label && !href) {
    return null;
  }
  const targetCandidate = coerceOptionalString(link.target, fallback.target ?? '_self').toLowerCase();
  const target = ['_self', '_blank'].includes(targetCandidate) ? targetCandidate : '_self';
  return {
    id: ensureIdentifier('homepage-link', link.id, fallback.id, index),
    label,
    href,
    target,
  };
}

function normalizeHomepageSeo(seo = {}, fallback = {}) {
  const source = seo && typeof seo === 'object' ? seo : {};
  const fallbackKeywords = Array.isArray(fallback.keywords) ? fallback.keywords : [];
  let keywords = fallbackKeywords;
  if (Array.isArray(source.keywords)) {
    keywords = source.keywords;
  } else if (typeof source.keywords === 'string') {
    keywords = source.keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
  } else if (source.keywords === null) {
    keywords = [];
  }

  return {
    title: coerceOptionalString(source.title, fallback.title ?? ''),
    description: coerceOptionalString(source.description, fallback.description ?? ''),
    keywords: uniqueStringList(keywords).slice(0, 20),
    ogImageUrl: coerceOptionalString(source.ogImageUrl, fallback.ogImageUrl ?? ''),
  };
}

function normalizeHomepageSettings(input = {}, fallback = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const baseline = fallback && typeof fallback === 'object' ? fallback : {};
  const announcementSource = source.announcementBar && typeof source.announcementBar === 'object' ? source.announcementBar : {};
  const announcementFallback = baseline.announcementBar && typeof baseline.announcementBar === 'object'
    ? baseline.announcementBar
    : {};

  const heroSource = source.hero && typeof source.hero === 'object' ? source.hero : {};
  const heroFallback = baseline.hero && typeof baseline.hero === 'object' ? baseline.hero : {};

  return {
    announcementBar: {
      enabled: coerceBoolean(announcementSource.enabled, announcementFallback.enabled ?? true),
      message: coerceOptionalString(announcementSource.message, announcementFallback.message ?? ''),
      ctaLabel: coerceOptionalString(announcementSource.ctaLabel, announcementFallback.ctaLabel ?? ''),
      ctaHref: coerceOptionalString(announcementSource.ctaHref, announcementFallback.ctaHref ?? ''),
    },
    hero: {
      title: coerceOptionalString(heroSource.title, heroFallback.title ?? ''),
      subtitle: coerceOptionalString(heroSource.subtitle, heroFallback.subtitle ?? ''),
      primaryCtaLabel: coerceOptionalString(heroSource.primaryCtaLabel, heroFallback.primaryCtaLabel ?? ''),
      primaryCtaHref: coerceOptionalString(heroSource.primaryCtaHref, heroFallback.primaryCtaHref ?? ''),
      secondaryCtaLabel: coerceOptionalString(heroSource.secondaryCtaLabel, heroFallback.secondaryCtaLabel ?? ''),
      secondaryCtaHref: coerceOptionalString(heroSource.secondaryCtaHref, heroFallback.secondaryCtaHref ?? ''),
      backgroundImageUrl: coerceOptionalString(heroSource.backgroundImageUrl, heroFallback.backgroundImageUrl ?? ''),
      backgroundImageAlt: coerceOptionalString(heroSource.backgroundImageAlt, heroFallback.backgroundImageAlt ?? ''),
      overlayOpacity: coerceNumber(heroSource.overlayOpacity, heroFallback.overlayOpacity ?? 0.45, {
        min: 0,
        max: 1,
        precision: 2,
      }),
      stats: normalizeCollection(heroSource.stats, heroFallback.stats, 4, normalizeHomepageStat).filter(Boolean),
    },
    valueProps: normalizeCollection(source.valueProps, baseline.valueProps, 6, normalizeHomepageValueProp).filter(Boolean),
    featureSections: normalizeCollection(source.featureSections, baseline.featureSections, 4, normalizeHomepageFeature).filter(
      Boolean,
    ),
    testimonials: normalizeCollection(source.testimonials, baseline.testimonials, 6, normalizeHomepageTestimonial).filter(
      Boolean,
    ),
    faqs: normalizeCollection(source.faqs, baseline.faqs, 8, normalizeHomepageFaq).filter(Boolean),
    quickLinks: normalizeCollection(source.quickLinks, baseline.quickLinks, 6, normalizeHomepageQuickLink).filter(Boolean),
    seo: normalizeHomepageSeo(source.seo, baseline.seo),
  };
}

function buildDefaultPlatformSettings() {
  return {
    commissions: {
      enabled: coerceBoolean(process.env.PLATFORM_COMMISSIONS_ENABLED, true),
      rate: coerceNumber(process.env.PLATFORM_COMMISSION_RATE, 2.5, { min: 0, max: 100, precision: 2 }),
      currency: coerceString(process.env.PLATFORM_COMMISSION_CURRENCY, 'USD'),
      minimumFee: coerceNumber(process.env.PLATFORM_COMMISSION_MINIMUM_FEE, 0, { min: 0, precision: 2 }),
      providerControlsServicemanPay: coerceBoolean(
        process.env.PLATFORM_PROVIDER_CONTROLS_SERVICEMAN_PAY,
        true,
      ),
      servicemanMinimumRate: coerceNumber(
        process.env.PLATFORM_SERVICEMAN_MINIMUM_RATE,
        0,
        { min: 0, max: 100, precision: 2 },
      ),
      servicemanPayoutNotes:
        coerceOptionalString(
          process.env.PLATFORM_SERVICEMAN_PAYOUT_NOTES,
          'Providers remain responsible for compensating their servicemen directly. Gigvora captures a 2.5% platform service fee and does not operate as an FCA-regulated e-money issuer.',
        ) || '',
    },
    subscriptions: {
      enabled: coerceBoolean(process.env.PLATFORM_SUBSCRIPTIONS_ENABLED, true),
      restrictedFeatures: uniqueStringList(
        (process.env.PLATFORM_SUBSCRIPTION_RESTRICTED_FEATURES ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
      plans: [],
    },
    payments: {
      provider: coerceString(process.env.PAYMENT_PROVIDER, 'stripe'),
      stripe: {
        publishableKey: coerceOptionalString(process.env.STRIPE_PUBLISHABLE_KEY),
        secretKey: coerceOptionalString(process.env.STRIPE_SECRET_KEY),
        webhookSecret: coerceOptionalString(process.env.STRIPE_WEBHOOK_SECRET),
        accountId: coerceOptionalString(process.env.STRIPE_ACCOUNT_ID),
      },
      escrow_com: {
        apiKey: coerceOptionalString(process.env.ESCROW_COM_API_KEY),
        apiSecret: coerceOptionalString(process.env.ESCROW_COM_API_SECRET),
        sandbox: coerceBoolean(process.env.ESCROW_COM_SANDBOX, true),
      },
      escrowControls: {
        defaultHoldPeriodHours: coerceInteger(process.env.ESCROW_DEFAULT_HOLD_HOURS, 72, {
          min: 0,
        }),
        autoReleaseHours: coerceInteger(process.env.ESCROW_AUTO_RELEASE_HOURS, 48, { min: 0 }),
        requireManualApproval: coerceBoolean(process.env.ESCROW_REQUIRE_MANUAL_APPROVAL, false),
        manualApprovalThreshold: coerceNumber(process.env.ESCROW_MANUAL_APPROVAL_THRESHOLD, 25000, {
          min: 0,
          precision: 2,
        }),
        notificationEmails: uniqueStringList(
          (process.env.ESCROW_NOTIFICATION_EMAILS ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
        statementDescriptor: coerceOptionalString(process.env.ESCROW_STATEMENT_DESCRIPTOR),
      },
    },
    smtp: {
      host: coerceOptionalString(process.env.SMTP_HOST),
      port: coerceInteger(process.env.SMTP_PORT, 587, { min: 1 }),
      secure: coerceBoolean(process.env.SMTP_SECURE, false),
      username: coerceOptionalString(process.env.SMTP_USERNAME),
      password: coerceOptionalString(process.env.SMTP_PASSWORD),
      fromAddress: coerceOptionalString(process.env.SMTP_FROM_ADDRESS),
      fromName: coerceOptionalString(process.env.SMTP_FROM_NAME, process.env.APP_NAME ?? 'GigVora'),
    },
    storage: {
      provider: 'cloudflare_r2',
      cloudflare_r2: {
        accountId: coerceOptionalString(process.env.CLOUDFLARE_R2_ACCOUNT_ID),
        accessKeyId: coerceOptionalString(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID),
        secretAccessKey: coerceOptionalString(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY),
        bucket: coerceOptionalString(process.env.CLOUDFLARE_R2_BUCKET),
        endpoint: coerceOptionalString(process.env.CLOUDFLARE_R2_ENDPOINT),
        publicBaseUrl: coerceOptionalString(process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL),
      },
    },
    app: {
      name: coerceOptionalString(process.env.APP_NAME, 'GigVora'),
      environment: coerceOptionalString(process.env.NODE_ENV, 'development'),
      clientUrl: coerceOptionalString(process.env.CLIENT_URL),
      apiUrl: coerceOptionalString(process.env.API_URL),
    },
    database: {
      url: coerceOptionalString(process.env.DB_URL),
      host: coerceOptionalString(process.env.DB_HOST),
      port: coerceInteger(process.env.DB_PORT, process.env.DB_URL ? null : 3306, { min: 1 }),
      name: coerceOptionalString(process.env.DB_NAME),
      username: coerceOptionalString(process.env.DB_USER ?? process.env.DB_USERNAME),
      password: coerceOptionalString(process.env.DB_PASSWORD),
    },
    featureToggles: {
      escrow: coerceBoolean(process.env.FEATURE_ESCROW_ENABLED, true),
      subscriptions: coerceBoolean(process.env.FEATURE_SUBSCRIPTIONS_ENABLED, true),
      commissions: coerceBoolean(process.env.FEATURE_COMMISSIONS_ENABLED, true),
    },
    maintenance: {
      windows: [],
      statusPageUrl: coerceOptionalString(process.env.MAINTENANCE_STATUS_URL),
      supportContact: coerceOptionalString(
        process.env.MAINTENANCE_SUPPORT_CONTACT ?? process.env.SUPPORT_EMAIL,
        'support@gigvora.com',
      ),
    },
    homepage: normalizeHomepageSettings(
      {
        announcementBar: {
          enabled: coerceBoolean(process.env.HOMEPAGE_ANNOUNCEMENT_ENABLED, true),
          message:
            coerceOptionalString(
              process.env.HOMEPAGE_ANNOUNCEMENT_MESSAGE,
              'Gigvora deploys vetted product teams with finance, compliance, and delivery safeguards.',
            ) || '',
          ctaLabel: coerceOptionalString(process.env.HOMEPAGE_ANNOUNCEMENT_CTA_LABEL, 'Book a demo'),
          ctaHref: coerceOptionalString(process.env.HOMEPAGE_ANNOUNCEMENT_CTA_HREF, '/contact/sales'),
        },
        hero: {
          title: coerceOptionalString(
            process.env.HOMEPAGE_HERO_TITLE,
            'Build resilient product squads without the guesswork',
          ),
          subtitle: coerceOptionalString(
            process.env.HOMEPAGE_HERO_SUBTITLE,
            'Spin up verified designers, engineers, and operators with treasury, compliance, and delivery guardrails baked in.',
          ),
          primaryCtaLabel: coerceOptionalString(process.env.HOMEPAGE_PRIMARY_CTA_LABEL, 'Book enterprise demo'),
          primaryCtaHref: coerceOptionalString(process.env.HOMEPAGE_PRIMARY_CTA_HREF, '/contact/sales'),
          secondaryCtaLabel: coerceOptionalString(process.env.HOMEPAGE_SECONDARY_CTA_LABEL, 'Explore marketplace'),
          secondaryCtaHref: coerceOptionalString(process.env.HOMEPAGE_SECONDARY_CTA_HREF, '/gigs'),
          backgroundImageUrl: coerceOptionalString(
            process.env.HOMEPAGE_HERO_BACKGROUND_URL,
            'https://cdn.gigvora.com/assets/hero/command-center.jpg',
          ),
          backgroundImageAlt: coerceOptionalString(
            process.env.HOMEPAGE_HERO_BACKGROUND_ALT,
            'Gigvora admin control tower dashboard',
          ),
          overlayOpacity: coerceNumber(process.env.HOMEPAGE_HERO_OVERLAY_OPACITY, 0.55, {
            min: 0,
            max: 1,
            precision: 2,
          }),
          stats: [
            {
              id: 'specialists',
              label: 'Verified specialists',
              value: coerceNumber(process.env.HOMEPAGE_STAT_SPECIALISTS, 12800, {
                min: 0,
                precision: 0,
              }),
              suffix: '+',
            },
            {
              id: 'satisfaction',
              label: 'Client satisfaction',
              value: coerceNumber(process.env.HOMEPAGE_STAT_SATISFACTION, 97, {
                min: 0,
                max: 100,
                precision: 0,
              }),
              suffix: '%',
            },
            {
              id: 'regions',
              label: 'Countries served',
              value: coerceNumber(process.env.HOMEPAGE_STAT_REGIONS, 32, { min: 0, precision: 0 }),
              suffix: '',
            },
            {
              id: 'sla',
              label: 'Matching SLA (hrs)',
              value: coerceNumber(process.env.HOMEPAGE_STAT_SLA_HOURS, 48, { min: 0, precision: 0 }),
              suffix: '',
            },
          ],
        },
        valueProps: [
          {
            id: 'compliance',
            title: 'Compliance handled',
            description: 'NDAs, KYC, and region-specific controls live inside every engagement.',
            icon: 'ShieldCheckIcon',
            ctaLabel: 'Review trust center',
            ctaHref: '/trust-center',
          },
          {
            id: 'payments',
            title: 'Unified payouts',
            description: 'Escrow, subscriptions, and milestone releases flow through one treasury.',
            icon: 'CurrencyDollarIcon',
            ctaLabel: 'View payment options',
            ctaHref: '/finance',
          },
          {
            id: 'insights',
            title: 'Operational telemetry',
            description: 'Live scorecards keep delivery, spend, and sentiment transparent.',
            icon: 'ChartBarIcon',
            ctaLabel: 'See analytics',
            ctaHref: '/dashboard/company/analytics',
          },
        ],
        featureSections: [
          {
            id: 'project-launch',
            title: 'Launch projects without friction',
            description: 'Spin up scopes, approvals, and budgets with prebuilt compliance guardrails.',
            mediaType: 'image',
            mediaUrl: 'https://cdn.gigvora.com/assets/features/project-launch.png',
            mediaAlt: 'Gigvora project launch workflow',
            bullets: [
              { id: 'templates', text: 'Reusable scope templates with approval routing' },
              { id: 'governance', text: 'Automatic vendor risk and policy checks' },
            ],
          },
          {
            id: 'workspace',
            title: 'Collaborate in one workspace',
            description: 'Docs, deliverables, feedback, and finance sync across teams and partners.',
            mediaType: 'image',
            mediaUrl: 'https://cdn.gigvora.com/assets/features/workspace.png',
            mediaAlt: 'Cross-functional workspace collaboration',
            bullets: [
              { id: 'vault', text: 'Role-based deliverable vault with versioning' },
              { id: 'status', text: 'Automated status digests for stakeholders' },
            ],
          },
        ],
        testimonials: [
          {
            id: 'northwind',
            quote:
              'Gigvora unlocked a vetted product pod in 48 hours—finance, compliance, and delivery were already aligned.',
            authorName: 'Leah Patel',
            authorRole: 'VP Operations, Northwind Labs',
            avatarUrl: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
            highlight: true,
          },
          {
            id: 'acme',
            quote: 'Compliance workflows and milestone escrow meant we focused on shipping, not paperwork.',
            authorName: 'Marcus Chen',
            authorRole: 'Head of Product, Acme Robotics',
            avatarUrl: 'https://cdn.gigvora.com/assets/avatars/marcus-chen.png',
            highlight: false,
          },
        ],
        faqs: [
          {
            id: 'getting-started',
            question: 'How quickly can teams onboard?',
            answer: 'Submit a brief and receive a vetted shortlist with compliance approval inside 48 hours.',
          },
          {
            id: 'pricing-models',
            question: 'What pricing models are supported?',
            answer: 'Choose milestone-based projects, subscription pods, or hourly retainers based on the workstream.',
          },
        ],
        quickLinks: [
          { id: 'demo', label: 'Book a live demo', href: '/contact/sales', target: '_self' },
          { id: 'login', label: 'Sign in to workspace', href: '/login', target: '_self' },
          { id: 'updates', label: 'Read product updates', href: '/blog', target: '_self' },
        ],
        seo: {
          title: coerceOptionalString(
            process.env.HOMEPAGE_SEO_TITLE,
            'Gigvora | Product-ready teams on demand',
          ),
          description: coerceOptionalString(
            process.env.HOMEPAGE_SEO_DESCRIPTION,
            'Gigvora delivers vetted product talent with treasury, compliance, and delivery automation so teams can launch faster.',
          ),
          keywords: uniqueStringList(
            (process.env.HOMEPAGE_SEO_KEYWORDS ?? 'gigvora,product talent,freelancer marketplace,managed marketplace')
              .split(',')
              .map((keyword) => keyword.trim()),
          ),
          ogImageUrl: coerceOptionalString(
            process.env.HOMEPAGE_SEO_OG_IMAGE_URL,
            'https://cdn.gigvora.com/assets/og/homepage.png',
          ),
        },
      },
      {},
    ),
    security: {
      tokens: {
        metricsBearer: coerceOptionalString(process.env.METRICS_BEARER_TOKEN, ''),
        rotatedBy: null,
        lastRotatedAt: null,
      },
      rotation: {
        contactEmails: uniqueStringList(
          (process.env.SECURITY_ROTATION_CONTACTS ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
        reminderHours: coerceInteger(process.env.SECURITY_ROTATION_REMINDER_HOURS, 24 * 30, {
          min: 24,
          max: 24 * 180,
        }),
      },
    },
  };
}

function normalizeCommissionSettings(input = {}, fallback = {}) {
  if (input.rate != null && input.rate !== '') {
    const candidate = Number(input.rate);
    if (!Number.isFinite(candidate)) {
      throw new ValidationError('commission rate must be numeric.');
    }
    if (candidate < 0 || candidate > 100) {
      throw new ValidationError('commission rate must be between 0 and 100 percent.');
    }
  }

  if (input.minimumFee != null && input.minimumFee !== '') {
    const candidate = Number(input.minimumFee);
    if (!Number.isFinite(candidate)) {
      throw new ValidationError('minimum commission fee must be numeric.');
    }
    if (candidate < 0) {
      throw new ValidationError('minimum commission fee cannot be negative.');
    }
  }

  if (input.servicemanMinimumRate != null && input.servicemanMinimumRate !== '') {
    const candidate = Number(input.servicemanMinimumRate);
    if (!Number.isFinite(candidate)) {
      throw new ValidationError('serviceman minimum rate must be numeric.');
    }
    if (candidate < 0 || candidate > 100) {
      throw new ValidationError('serviceman minimum rate must be between 0 and 100 percent.');
    }
  }

  if (input.servicemanPayoutNotes != null && input.servicemanPayoutNotes !== undefined) {
    const stringValue = String(input.servicemanPayoutNotes);
    if (stringValue.length > 1000) {
      throw new ValidationError('serviceman payout notes must be 1000 characters or fewer.');
    }
  }

  const normalized = {
    enabled: coerceBoolean(input.enabled, fallback.enabled ?? true),
    rate: coerceNumber(input.rate, fallback.rate ?? 0, { min: 0, max: 100, precision: 2 }),
    currency: coerceString(input.currency, fallback.currency ?? 'USD'),
    minimumFee: coerceNumber(input.minimumFee, fallback.minimumFee ?? 0, { min: 0, precision: 2 }),
    providerControlsServicemanPay: coerceBoolean(
      input.providerControlsServicemanPay,
      fallback.providerControlsServicemanPay ?? true,
    ),
    servicemanMinimumRate: coerceNumber(
      input.servicemanMinimumRate,
      fallback.servicemanMinimumRate ?? 0,
      { min: 0, max: 100, precision: 2 },
    ),
    servicemanPayoutNotes: coerceOptionalString(
      input.servicemanPayoutNotes,
      fallback.servicemanPayoutNotes ?? '',
    ),
  };

  if (normalized.rate + normalized.servicemanMinimumRate > 100) {
    throw new ValidationError(
      'combined platform commission and serviceman minimum rate cannot exceed 100 percent.',
    );
  }

  return normalized;
}

function normalizeSubscriptionPlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new ValidationError('subscription plans must be objects.');
  }

  const name = coerceString(plan.name, null);
  if (!name) {
    throw new ValidationError('subscription plans require a name.');
  }

  const id = coerceString(plan.id, name.toLowerCase().replace(/\s+/g, '-'));
  const interval = coerceString(plan.interval, plan.billingInterval);
  const normalizedInterval = SUBSCRIPTION_INTERVALS.includes(interval)
    ? interval
    : 'monthly';
  const price = coerceNumber(plan.price, 0, { min: 0, precision: 2 });
  const currency = coerceString(plan.currency, 'USD');
  const description = coerceOptionalString(plan.description);
  const restrictedFeatures = uniqueStringList(plan.restrictedFeatures);
  const trialDays = coerceInteger(plan.trialDays, null, { min: 0 });

  return {
    id,
    name,
    price,
    currency,
    interval: normalizedInterval,
    description,
    restrictedFeatures,
    trialDays,
  };
}

function normalizeSubscriptionSettings(input = {}, fallback = {}) {
  const normalized = {
    enabled: coerceBoolean(input.enabled, fallback.enabled ?? true),
    restrictedFeatures: uniqueStringList(
      input.restrictedFeatures ?? fallback.restrictedFeatures ?? [],
    ),
    plans: Array.isArray(fallback.plans) ? [...fallback.plans] : [],
  };

  if (Array.isArray(input.plans)) {
    normalized.plans = input.plans.map((plan) => normalizeSubscriptionPlan(plan));
  }

  return normalized;
}

function normalizeEscrowControls(input = {}, fallback = {}) {
  return {
    defaultHoldPeriodHours: coerceInteger(
      input.defaultHoldPeriodHours,
      fallback.defaultHoldPeriodHours ?? 72,
      { min: 0 },
    ),
    autoReleaseHours: coerceInteger(input.autoReleaseHours, fallback.autoReleaseHours ?? 48, {
      min: 0,
    }),
    requireManualApproval: coerceBoolean(
      input.requireManualApproval,
      fallback.requireManualApproval ?? false,
    ),
    manualApprovalThreshold: coerceNumber(
      input.manualApprovalThreshold,
      fallback.manualApprovalThreshold ?? 25000,
      { min: 0, precision: 2 },
    ),
    notificationEmails: uniqueStringList(input.notificationEmails ?? fallback.notificationEmails ?? []),
    statementDescriptor: coerceOptionalString(
      input.statementDescriptor,
      fallback.statementDescriptor ?? '',
    ),
  };
}

function normalizePaymentSettings(input = {}, fallback = {}) {
  const providerCandidate = coerceString(input.provider, fallback.provider ?? 'stripe');
  const provider = PAYMENT_PROVIDERS.has(providerCandidate) ? providerCandidate : 'stripe';

  const stripeSettings = {
    publishableKey: coerceOptionalString(input.stripe?.publishableKey, fallback.stripe?.publishableKey ?? ''),
    secretKey: coerceOptionalString(input.stripe?.secretKey, fallback.stripe?.secretKey ?? ''),
    webhookSecret: coerceOptionalString(
      input.stripe?.webhookSecret,
      fallback.stripe?.webhookSecret ?? '',
    ),
    accountId: coerceOptionalString(input.stripe?.accountId, fallback.stripe?.accountId ?? ''),
  };

  const escrowSettings = {
    apiKey: coerceOptionalString(input.escrow_com?.apiKey, fallback.escrow_com?.apiKey ?? ''),
    apiSecret: coerceOptionalString(
      input.escrow_com?.apiSecret,
      fallback.escrow_com?.apiSecret ?? '',
    ),
    sandbox: coerceBoolean(input.escrow_com?.sandbox, fallback.escrow_com?.sandbox ?? true),
  };

  return {
    provider,
    stripe: stripeSettings,
    escrow_com: escrowSettings,
    escrowControls: normalizeEscrowControls(input.escrowControls, fallback.escrowControls),
  };
}

function normalizeSmtpSettings(input = {}, fallback = {}) {
  return {
    host: coerceOptionalString(input.host, fallback.host ?? ''),
    port: coerceInteger(input.port, fallback.port ?? 587, { min: 1 }),
    secure: coerceBoolean(input.secure, fallback.secure ?? false),
    username: coerceOptionalString(input.username, fallback.username ?? ''),
    password: coerceOptionalString(input.password, fallback.password ?? ''),
    fromAddress: coerceOptionalString(input.fromAddress, fallback.fromAddress ?? ''),
    fromName: coerceOptionalString(input.fromName, fallback.fromName ?? ''),
  };
}

function normalizeStorageSettings(input = {}, fallback = {}) {
  const provider = coerceString(input.provider, fallback.provider ?? 'cloudflare_r2');
  const cloudflareDefaults = fallback.cloudflare_r2 ?? {};
  const cloudflareInput = input.cloudflare_r2 ?? {};

  return {
    provider,
    cloudflare_r2: {
      accountId: coerceOptionalString(cloudflareInput.accountId, cloudflareDefaults.accountId ?? ''),
      accessKeyId: coerceOptionalString(
        cloudflareInput.accessKeyId,
        cloudflareDefaults.accessKeyId ?? '',
      ),
      secretAccessKey: coerceOptionalString(
        cloudflareInput.secretAccessKey,
        cloudflareDefaults.secretAccessKey ?? '',
      ),
      bucket: coerceOptionalString(cloudflareInput.bucket, cloudflareDefaults.bucket ?? ''),
      endpoint: coerceOptionalString(
        cloudflareInput.endpoint,
        cloudflareDefaults.endpoint ?? '',
      ),
      publicBaseUrl: coerceOptionalString(
        cloudflareInput.publicBaseUrl,
        cloudflareDefaults.publicBaseUrl ?? '',
      ),
    },
  };
}

function normalizeAppSettings(input = {}, fallback = {}) {
  return {
    name: coerceOptionalString(input.name, fallback.name ?? 'GigVora'),
    environment: coerceOptionalString(input.environment, fallback.environment ?? 'development'),
    clientUrl: coerceOptionalString(input.clientUrl, fallback.clientUrl ?? ''),
    apiUrl: coerceOptionalString(input.apiUrl, fallback.apiUrl ?? ''),
  };
}

function normalizeDatabaseSettings(input = {}, fallback = {}) {
  return {
    url: coerceOptionalString(input.url, fallback.url ?? ''),
    host: coerceOptionalString(input.host, fallback.host ?? ''),
    port: coerceInteger(input.port, fallback.port ?? null, { min: 1 }),
    name: coerceOptionalString(input.name, fallback.name ?? ''),
    username: coerceOptionalString(input.username, fallback.username ?? ''),
    password: coerceOptionalString(input.password, fallback.password ?? ''),
  };
}

function normalizeFeatureToggles(input = {}, fallback = {}) {
  return {
    escrow: coerceBoolean(input.escrow, fallback.escrow ?? true),
    subscriptions: coerceBoolean(input.subscriptions, fallback.subscriptions ?? true),
    commissions: coerceBoolean(input.commissions, fallback.commissions ?? true),
  };
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate.toISOString();
}

function normalizeMaintenanceSettings(input = {}, fallback = {}) {
  const fallbackWindows = Array.isArray(fallback.windows) ? fallback.windows : [];
  const rawWindows = Array.isArray(input.windows) ? input.windows : fallbackWindows;

  const windows = rawWindows
    .map((window, index) => {
      if (!window || typeof window !== 'object') {
        return null;
      }
      const startAt = parseIsoDate(window.startAt ?? window.start ?? window.beginAt);
      const endAt = parseIsoDate(window.endAt ?? window.end ?? window.completeAt);
      if (!startAt || !endAt || new Date(startAt).getTime() >= new Date(endAt).getTime()) {
        return null;
      }
      const impactRaw = coerceOptionalString(window.impact ?? window.state ?? '', 'notice').toLowerCase();
      const impact = ['maintenance', 'degraded', 'down', 'notice'].includes(impactRaw)
        ? impactRaw
        : 'notice';

      return {
        id:
          coerceOptionalString(window.id ?? window.windowId ?? window.slug, '') ||
          `maintenance-${startAt}-${index}`,
        summary:
          coerceOptionalString(window.summary ?? window.title, '') ||
          `Scheduled maintenance starting ${startAt}`,
        impact,
        startAt,
        endAt,
        timezone: coerceOptionalString(window.timezone, fallback.timezone ?? 'UTC'),
        contact:
          coerceOptionalString(
            window.contact ?? window.supportContact,
            fallback.supportContact ?? 'support@gigvora.com',
          ) || 'support@gigvora.com',
        publishedAt: parseIsoDate(window.publishedAt),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return {
    windows,
    statusPageUrl: coerceOptionalString(input.statusPageUrl, fallback.statusPageUrl ?? ''),
    supportContact: coerceOptionalString(
      input.supportContact,
      fallback.supportContact ?? 'support@gigvora.com',
    ),
  };
}

function normalizeSecurityTokens(tokens = {}, fallback = {}) {
  const metricsBearer = coerceOptionalString(tokens.metricsBearer, fallback.metricsBearer ?? '');
  if (metricsBearer && metricsBearer.length < 16) {
    throw new ValidationError('security.tokens.metricsBearer must be at least 16 characters when set.');
  }

  const rotatedBy = coerceOptionalString(tokens.rotatedBy, fallback.rotatedBy ?? '');
  const lastRotatedAt =
    tokens.lastRotatedAt != null
      ? coerceIsoDateString(tokens.lastRotatedAt, fallback.lastRotatedAt ?? null)
      : fallback.lastRotatedAt ?? null;

  return {
    metricsBearer,
    rotatedBy: rotatedBy || null,
    lastRotatedAt,
  };
}

function normalizeSecurityRotation(rotation = {}, fallback = {}) {
  const contacts = Array.isArray(rotation.contactEmails)
    ? rotation.contactEmails
    : Array.isArray(fallback.contactEmails)
      ? fallback.contactEmails
      : [];
  const reminderHours = coerceInteger(rotation.reminderHours, fallback.reminderHours ?? 24 * 30, {
    min: 24,
    max: 24 * 180,
  });

  return {
    contactEmails: uniqueStringList(contacts),
    reminderHours,
  };
}

function normalizeSecuritySettings(source = {}, baseline = {}) {
  const fallback = baseline ?? {};
  return {
    tokens: normalizeSecurityTokens(source.tokens ?? {}, fallback.tokens ?? {}),
    rotation: normalizeSecurityRotation(source.rotation ?? {}, fallback.rotation ?? {}),
  };
}

function normalizeSettings(payload = {}, baseline = {}) {
  return {
    commissions: normalizeCommissionSettings(payload.commissions, baseline.commissions),
    subscriptions: normalizeSubscriptionSettings(payload.subscriptions, baseline.subscriptions),
    payments: normalizePaymentSettings(payload.payments, baseline.payments),
    smtp: normalizeSmtpSettings(payload.smtp, baseline.smtp),
    storage: normalizeStorageSettings(payload.storage, baseline.storage),
    app: normalizeAppSettings(payload.app, baseline.app),
    database: normalizeDatabaseSettings(payload.database, baseline.database),
    featureToggles: normalizeFeatureToggles(payload.featureToggles, baseline.featureToggles),
    maintenance: normalizeMaintenanceSettings(payload.maintenance, baseline.maintenance),
    homepage: normalizeHomepageSettings(payload.homepage, baseline.homepage),
    security: normalizeSecuritySettings(payload.security, baseline.security),
  };
}

function mergeDefaults(defaults, stored) {
  if (!stored || typeof stored !== 'object') {
    return defaults;
  }
  return {
    commissions: { ...defaults.commissions, ...(stored.commissions ?? {}) },
    subscriptions: {
      ...defaults.subscriptions,
      ...(stored.subscriptions ?? {}),
      restrictedFeatures: uniqueStringList(
        [...(defaults.subscriptions.restrictedFeatures ?? []), ...(stored.subscriptions?.restrictedFeatures ?? [])],
      ),
      plans: Array.isArray(stored.subscriptions?.plans)
        ? stored.subscriptions.plans.map((plan) => normalizeSubscriptionPlan(plan))
        : defaults.subscriptions.plans,
    },
    payments: {
      ...defaults.payments,
      ...(stored.payments ?? {}),
      provider: stored.payments?.provider ?? defaults.payments.provider,
      stripe: {
        ...defaults.payments.stripe,
        ...(stored.payments?.stripe ?? {}),
      },
      escrow_com: {
        ...defaults.payments.escrow_com,
        ...(stored.payments?.escrow_com ?? {}),
      },
      escrowControls: {
        ...defaults.payments.escrowControls,
        ...(stored.payments?.escrowControls ?? {}),
      },
    },
    smtp: { ...defaults.smtp, ...(stored.smtp ?? {}) },
    storage: {
      ...defaults.storage,
      ...(stored.storage ?? {}),
      cloudflare_r2: {
        ...defaults.storage.cloudflare_r2,
        ...(stored.storage?.cloudflare_r2 ?? {}),
      },
    },
    app: { ...defaults.app, ...(stored.app ?? {}) },
    database: { ...defaults.database, ...(stored.database ?? {}) },
    featureToggles: { ...defaults.featureToggles, ...(stored.featureToggles ?? {}) },
    maintenance: normalizeMaintenanceSettings(stored.maintenance, defaults.maintenance),
    homepage: normalizeHomepageSettings(stored.homepage, defaults.homepage),
    security: {
      tokens: {
        metricsBearer:
          stored.security?.tokens?.metricsBearer ?? defaults.security?.tokens?.metricsBearer ?? '',
        rotatedBy: stored.security?.tokens?.rotatedBy ?? defaults.security?.tokens?.rotatedBy ?? null,
        lastRotatedAt:
          stored.security?.tokens?.lastRotatedAt ?? defaults.security?.tokens?.lastRotatedAt ?? null,
      },
      rotation: {
        contactEmails: uniqueStringList([
          ...(defaults.security?.rotation?.contactEmails ?? []),
          ...(stored.security?.rotation?.contactEmails ?? []),
        ]),
        reminderHours:
          stored.security?.rotation?.reminderHours ?? defaults.security?.rotation?.reminderHours ?? 24 * 30,
      },
    },
  };
}

async function loadSettingsSnapshot() {
  const defaults = buildDefaultPlatformSettings();
  const record = await PlatformSetting.findOne({ where: { key: PLATFORM_SETTINGS_KEY } });
  const merged = mergeDefaults(defaults, record?.value ?? {});
  return decryptSecretsInPlace(merged);
}

export async function getPlatformSettings(options = {}) {
  const { bypassCache = false } = options ?? {};
  if (!bypassCache) {
    const cached = appCache.get(PLATFORM_SETTINGS_CACHE_KEY);
    if (cached) {
      return deepClone(cached);
    }
  }

  const snapshot = await loadSettingsSnapshot();
  cachePlatformSettingsSnapshot(snapshot);
  return snapshot;
}

export async function updatePlatformSettings(payload = {}, options = {}) {
  const defaults = buildDefaultPlatformSettings();
  const existing = await PlatformSetting.findOne({ where: { key: PLATFORM_SETTINGS_KEY } });
  const baseline = decryptSecretsInPlace(mergeDefaults(defaults, existing?.value ?? {}));
  const normalized = normalizeSettings(payload, baseline);

  validateSettingsSnapshot(normalized);
  const encrypted = encryptSecretsForPersistence(normalized);

  if (existing) {
    await existing.update({ value: encrypted });
  } else {
    await PlatformSetting.create({ key: PLATFORM_SETTINGS_KEY, value: encrypted });
  }

  const snapshot = mergeDefaults(defaults, encrypted);
  decryptSecretsInPlace(snapshot);

  const diffEntries = computeDiffEntries(baseline, snapshot);
  await recordPlatformSettingAudit({
    actorId: options.actorId ?? null,
    actorType: options.actorType ?? null,
    diff: diffEntries,
  });
  await dispatchSettingsUpdateNotification({
    actorId: options.actorId ?? null,
    diff: sanitizeDiffEntries(diffEntries),
  });

  syncCriticalDependencies(snapshot, { logger: logger.child({ component: 'platform-settings' }) });
  invalidatePlatformSettingsCache();
  cachePlatformSettingsSnapshot(snapshot);
  return snapshot;
}

export async function getHomepageSettings(options = {}) {
  const snapshot = await getPlatformSettings(options);
  return snapshot.homepage;
}

export async function updateHomepageSettings(payload = {}, options = {}) {
  const defaults = buildDefaultPlatformSettings();
  const existing = await PlatformSetting.findOne({ where: { key: PLATFORM_SETTINGS_KEY } });
  const storedValue = existing?.value ?? {};
  const baseline = decryptSecretsInPlace(mergeDefaults(defaults, storedValue));
  const normalizedHomepage = normalizeHomepageSettings(payload, baseline.homepage ?? defaults.homepage);
  const nextPlain = { ...baseline, homepage: normalizedHomepage };
  const encryptedNext = encryptSecretsForPersistence(nextPlain);

  if (existing) {
    await existing.update({ value: encryptedNext });
  } else {
    await PlatformSetting.create({ key: PLATFORM_SETTINGS_KEY, value: encryptedNext });
  }

  const snapshot = mergeDefaults(defaults, encryptedNext);
  decryptSecretsInPlace(snapshot);

  const diffEntries = computeDiffEntries(baseline, snapshot);
  await recordPlatformSettingAudit({
    actorId: options.actorId ?? null,
    actorType: options.actorType ?? null,
    diff: diffEntries,
  });
  await dispatchSettingsUpdateNotification({
    actorId: options.actorId ?? null,
    diff: sanitizeDiffEntries(diffEntries),
  });

  syncCriticalDependencies(snapshot, { logger: logger.child({ component: 'platform-settings' }) });
  invalidatePlatformSettingsCache();
  cachePlatformSettingsSnapshot(snapshot);
  return snapshot.homepage;
}

export default {
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
};
