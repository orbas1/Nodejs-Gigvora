import sequelize from '../models/sequelizeClient.js';
import { SeoPageOverride, SeoSetting } from '../models/seoSetting.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const DEFAULT_KEY = 'global';
const MAX_KEYWORDS = 64;
const MAX_OVERRIDES = 200;
const VALID_TWITTER_CARD_TYPES = new Set(['summary', 'summary_large_image', 'player', 'app']);

function normalizeString(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

function normalizeOptionalString(value) {
  const normalized = normalizeString(value);
  return normalized.length ? normalized : '';
}

function normaliseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function uniqueStringList(values, { limit, transform } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set();
  const result = [];
  for (const raw of values) {
    const normalized = transform ? transform(normalizeString(raw)) : normalizeString(raw);
    if (!normalized) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
    if (typeof limit === 'number' && result.length >= limit) {
      break;
    }
  }
  return result;
}

function ensureLeadingSlash(path) {
  const value = normalizeString(path);
  if (!value) {
    return '';
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return value;
  }
  return `/${value}`;
}

function sanitizeKeywords(values) {
  const keywords = uniqueStringList(values, { limit: MAX_KEYWORDS, transform: (value) => value.toLowerCase() });
  return keywords.map((keyword) => keyword.slice(0, 120));
}

function sanitizeMetaTags(metaTags) {
  if (!Array.isArray(metaTags)) {
    return [];
  }
  return metaTags
    .map((tag) => {
      if (!tag || typeof tag !== 'object') {
        return null;
      }
      const attribute = normalizeString(tag.attribute).toLowerCase();
      const normalizedAttribute = attribute === 'property' ? 'property' : 'name';
      const key = normalizeString(tag.key).slice(0, 120);
      const value = normalizeString(tag.value).slice(0, 500);
      if (!key || !value) {
        return null;
      }
      return {
        attribute: normalizedAttribute,
        key,
        value,
      };
    })
    .filter(Boolean);
}

function sanitizeStructuredData(input) {
  if (input == null) {
    return {};
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
      return {};
    } catch (error) {
      throw new ValidationError('structured data must be valid JSON.');
    }
  }
  if (typeof input === 'object') {
    return input;
  }
  return {};
}

function sanitiseVerificationCodes(input = {}) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  return {
    google: normalizeOptionalString(input.google).slice(0, 255),
    bing: normalizeOptionalString(input.bing).slice(0, 255),
    yandex: normalizeOptionalString(input.yandex).slice(0, 255),
    pinterest: normalizeOptionalString(input.pinterest).slice(0, 255),
    baidu: normalizeOptionalString(input.baidu).slice(0, 255),
  };
}

function sanitizeSocialDefaults(input = {}) {
  if (!input || typeof input !== 'object') {
    return {
      ogTitle: '',
      ogDescription: '',
      ogImageUrl: '',
      ogImageAlt: '',
      twitterHandle: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterCardType: 'summary_large_image',
      twitterImageUrl: '',
    };
  }
  const twitterCard = normalizeString(input.twitterCardType).toLowerCase();
  return {
    ogTitle: normalizeOptionalString(input.ogTitle).slice(0, 180),
    ogDescription: normalizeOptionalString(input.ogDescription).slice(0, 5000),
    ogImageUrl: normalizeOptionalString(input.ogImageUrl).slice(0, 2048),
    ogImageAlt: normalizeOptionalString(input.ogImageAlt).slice(0, 255),
    twitterHandle: normalizeOptionalString(input.twitterHandle).slice(0, 80),
    twitterTitle: normalizeOptionalString(input.twitterTitle).slice(0, 180),
    twitterDescription: normalizeOptionalString(input.twitterDescription).slice(0, 5000),
    twitterCardType: VALID_TWITTER_CARD_TYPES.has(twitterCard)
      ? twitterCard
      : 'summary_large_image',
    twitterImageUrl: normalizeOptionalString(input.twitterImageUrl).slice(0, 2048),
  };
}

function sanitizeOrganizationStructuredData(input = {}) {
  if (!input || typeof input !== 'object') {
    return {
      name: '',
      url: '',
      logoUrl: '',
      contactEmail: '',
      sameAs: [],
    };
  }
  return {
    name: normalizeOptionalString(input.name).slice(0, 255),
    url: normalizeOptionalString(input.url).slice(0, 2048),
    logoUrl: normalizeOptionalString(input.logoUrl ?? input.logo).slice(0, 2048),
    contactEmail: normalizeOptionalString(input.contactEmail ?? input.email).slice(0, 255),
    sameAs: uniqueStringList(input.sameAs, { limit: 50 }),
  };
}

function sanitizeSeoPayload(payload = {}) {
  const siteName = normalizeOptionalString(payload.siteName).slice(0, 180) || 'Gigvora';
  const defaultTitle = normalizeOptionalString(payload.defaultTitle).slice(0, 180) || siteName;
  const defaultDescription = normalizeOptionalString(payload.defaultDescription).slice(0, 5000);
  const canonicalBaseUrl = normalizeOptionalString(payload.canonicalBaseUrl).slice(0, 2048);
  const sitemapUrl = normalizeOptionalString(payload.sitemapUrl).slice(0, 2048);
  const allowIndexing = normaliseBoolean(payload.allowIndexing, true);
  const robotsPolicy = normalizeString(payload.robotsPolicy).slice(0, 12000);
  const defaultKeywords = sanitizeKeywords(payload.defaultKeywords);
  const noindexPaths = uniqueStringList(payload.noindexPaths, {
    limit: 200,
    transform: ensureLeadingSlash,
  });
  const verificationCodes = sanitiseVerificationCodes(payload.verificationCodes);
  const socialDefaults = sanitizeSocialDefaults(payload.socialDefaults);
  const structuredDataPayload = payload.structuredData ?? {};
  const structuredData = {
    organization: sanitizeOrganizationStructuredData(structuredDataPayload.organization),
    customJson: sanitizeStructuredData(structuredDataPayload.customJson ?? structuredDataPayload.custom),
  };

  const pageOverridesInput = Array.isArray(payload.pageOverrides) ? payload.pageOverrides : [];
  if (pageOverridesInput.length > MAX_OVERRIDES) {
    throw new ValidationError(`a maximum of ${MAX_OVERRIDES} page overrides are supported.`);
  }

  const pathSet = new Set();
  const pageOverrides = pageOverridesInput.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new ValidationError('override entries must be objects.');
    }
    const id = typeof entry.id === 'number' && Number.isFinite(entry.id) ? entry.id : undefined;
    const path = ensureLeadingSlash(entry.path);
    if (!path) {
      throw new ValidationError('override path is required.');
    }
    const normalizedPath = path.toLowerCase();
    if (pathSet.has(normalizedPath)) {
      throw new ValidationError(`duplicate override detected for path ${path}.`);
    }
    pathSet.add(normalizedPath);
    const keywords = sanitizeKeywords(entry.keywords);
    const social = sanitizeSocialDefaults({
      ogTitle: entry.ogTitle ?? entry.social?.ogTitle,
      ogDescription: entry.ogDescription ?? entry.social?.ogDescription,
      ogImageUrl: entry.ogImageUrl ?? entry.social?.ogImageUrl,
      ogImageAlt: entry.ogImageAlt ?? entry.social?.ogImageAlt,
      twitterHandle: entry.twitterHandle ?? entry.twitter?.twitterHandle,
      twitterTitle: entry.twitterTitle ?? entry.social?.twitterTitle ?? entry.twitter?.title,
      twitterDescription:
        entry.twitterDescription ?? entry.social?.twitterDescription ?? entry.twitter?.description,
      twitterCardType: entry.twitterCardType ?? entry.twitter?.twitterCardType ?? entry.twitter?.cardType,
      twitterImageUrl: entry.twitterImageUrl ?? entry.social?.twitterImageUrl ?? entry.twitter?.imageUrl,
    });

    return {
      id,
      path,
      title: normalizeOptionalString(entry.title).slice(0, 180),
      description: normalizeOptionalString(entry.description).slice(0, 5000),
      keywords,
      canonicalUrl: normalizeOptionalString(entry.canonicalUrl).slice(0, 2048),
      social,
      twitter: {
        title: social.twitterTitle,
        description: social.twitterDescription,
        cardType: social.twitterCardType,
        imageUrl: social.twitterImageUrl,
      },
      structuredData: {
        customJson: sanitizeStructuredData(
          entry.structuredData?.customJson ?? entry.structuredData ?? entry.customStructuredData,
        ),
      },
      metaTags: sanitizeMetaTags(entry.metaTags),
      noindex: normaliseBoolean(entry.noindex, false),
    };
  });

  return {
    siteName,
    defaultTitle,
    defaultDescription,
    canonicalBaseUrl,
    sitemapUrl,
    allowIndexing,
    robotsPolicy,
    defaultKeywords,
    noindexPaths,
    verificationCodes,
    socialDefaults,
    structuredData,
    pageOverrides,
  };
}

function buildDefaultSeoSettings() {
  return {
    siteName: 'Gigvora',
    defaultTitle: 'Gigvora',
    defaultDescription: '',
    defaultKeywords: [],
    canonicalBaseUrl: '',
    sitemapUrl: '',
    allowIndexing: true,
    robotsPolicy: 'User-agent: *\nDisallow:',
    noindexPaths: [],
    verificationCodes: {
      google: '',
      bing: '',
      yandex: '',
      pinterest: '',
      baidu: '',
    },
    socialDefaults: sanitizeSocialDefaults({}),
    structuredData: {
      organization: sanitizeOrganizationStructuredData({}),
      customJson: {},
    },
    pageOverrides: [],
    createdAt: null,
    updatedAt: null,
  };
}

function normalizeOverrideRecord(record) {
  if (!record) {
    return null;
  }
  const payload = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record;
  const social = sanitizeSocialDefaults({
    ogTitle: payload.social?.ogTitle ?? payload.social?.title ?? payload.ogTitle,
    ogDescription: payload.social?.ogDescription ?? payload.ogDescription,
    ogImageUrl: payload.social?.ogImageUrl ?? payload.social?.imageUrl ?? payload.ogImageUrl,
    ogImageAlt: payload.social?.ogImageAlt ?? payload.ogImageAlt,
    twitterHandle: payload.social?.twitterHandle ?? payload.twitter?.twitterHandle,
    twitterTitle: payload.twitter?.title ?? payload.social?.twitterTitle ?? payload.twitterTitle,
    twitterDescription:
      payload.twitter?.description ?? payload.social?.twitterDescription ?? payload.twitterDescription,
    twitterCardType: payload.twitter?.cardType ?? payload.social?.twitterCardType ?? payload.twitterCardType,
    twitterImageUrl: payload.twitter?.imageUrl ?? payload.social?.twitterImageUrl ?? payload.twitterImageUrl,
  });

  return {
    id: payload.id,
    path: payload.path,
    title: payload.title ?? '',
    description: payload.description ?? '',
    keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
    canonicalUrl: payload.canonicalUrl ?? '',
    ogTitle: social.ogTitle,
    ogDescription: social.ogDescription,
    ogImageUrl: social.ogImageUrl,
    ogImageAlt: social.ogImageAlt,
    twitterTitle: social.twitterTitle,
    twitterDescription: social.twitterDescription,
    twitterCardType: social.twitterCardType,
    twitterImageUrl: social.twitterImageUrl,
    metaTags: Array.isArray(payload.metaTags) ? payload.metaTags : [],
    noindex: Boolean(payload.noindex),
    structuredData: {
      customJson: payload.structuredData?.customJson ?? payload.structuredData ?? {},
    },
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

function normalizeSeoRecord(record) {
  if (!record) {
    return buildDefaultSeoSettings();
  }
  const payload = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record;
  const overrides = Array.isArray(payload.overrides)
    ? payload.overrides.map(normalizeOverrideRecord).filter(Boolean)
    : [];
  return {
    siteName: payload.siteName ?? 'Gigvora',
    defaultTitle: payload.defaultTitle ?? payload.siteName ?? 'Gigvora',
    defaultDescription: payload.defaultDescription ?? '',
    defaultKeywords: Array.isArray(payload.defaultKeywords) ? payload.defaultKeywords : [],
    canonicalBaseUrl: payload.canonicalBaseUrl ?? '',
    sitemapUrl: payload.sitemapUrl ?? '',
    allowIndexing: Boolean(payload.allowIndexing ?? true),
    robotsPolicy: payload.robotsPolicy ?? '',
    noindexPaths: Array.isArray(payload.noindexPaths) ? payload.noindexPaths : [],
    verificationCodes: payload.verificationCodes ?? {},
    socialDefaults: sanitizeSocialDefaults(payload.socialDefaults),
    structuredData: {
      organization: sanitizeOrganizationStructuredData(payload.structuredData?.organization),
      customJson: payload.structuredData?.customJson ?? payload.structuredData ?? {},
    },
    pageOverrides: overrides,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

export async function getSeoSettings() {
  const record = await SeoSetting.findOne({
    where: { key: DEFAULT_KEY },
    include: [
      {
        model: SeoPageOverride,
        as: 'overrides',
        separate: false,
        order: [['path', 'ASC'], ['id', 'ASC']],
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!record) {
    return buildDefaultSeoSettings();
  }

  return normalizeSeoRecord(record);
}

export async function updateSeoSettings(payload = {}) {
  const sanitized = sanitizeSeoPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const [setting] = await SeoSetting.findOrCreate({
      where: { key: DEFAULT_KEY },
      defaults: {
        key: DEFAULT_KEY,
        siteName: sanitized.siteName,
        defaultTitle: sanitized.defaultTitle,
        defaultDescription: sanitized.defaultDescription,
        defaultKeywords: sanitized.defaultKeywords,
        canonicalBaseUrl: sanitized.canonicalBaseUrl || null,
        sitemapUrl: sanitized.sitemapUrl || null,
        allowIndexing: sanitized.allowIndexing,
        robotsPolicy: sanitized.robotsPolicy || null,
        noindexPaths: sanitized.noindexPaths,
        verificationCodes: sanitized.verificationCodes,
        socialDefaults: sanitized.socialDefaults,
        structuredData: sanitized.structuredData,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    await setting.update(
      {
        siteName: sanitized.siteName,
        defaultTitle: sanitized.defaultTitle,
        defaultDescription: sanitized.defaultDescription,
        defaultKeywords: sanitized.defaultKeywords,
        canonicalBaseUrl: sanitized.canonicalBaseUrl || null,
        sitemapUrl: sanitized.sitemapUrl || null,
        allowIndexing: sanitized.allowIndexing,
        robotsPolicy: sanitized.robotsPolicy || null,
        noindexPaths: sanitized.noindexPaths,
        verificationCodes: sanitized.verificationCodes,
        socialDefaults: sanitized.socialDefaults,
        structuredData: sanitized.structuredData,
      },
      { transaction },
    );

    const existingOverrides = await SeoPageOverride.findAll({
      where: { seoSettingId: setting.id },
      transaction,
    });
    const overridesById = new Map(existingOverrides.map((override) => [override.id, override]));
    const retainedIds = new Set();

    for (const override of sanitized.pageOverrides) {
      if (override.id && overridesById.has(override.id)) {
        const existing = overridesById.get(override.id);
        retainedIds.add(existing.id);
        await existing.update(
          {
            path: override.path,
            title: override.title || null,
            description: override.description || null,
            keywords: override.keywords,
            canonicalUrl: override.canonicalUrl || null,
            social: override.social,
            twitter: override.twitter,
            structuredData: override.structuredData,
            metaTags: override.metaTags,
            noindex: override.noindex,
          },
          { transaction },
        );
      } else {
        const created = await SeoPageOverride.create(
          {
            seoSettingId: setting.id,
            path: override.path,
            title: override.title || null,
            description: override.description || null,
            keywords: override.keywords,
            canonicalUrl: override.canonicalUrl || null,
            social: override.social,
            twitter: override.twitter,
            structuredData: override.structuredData,
            metaTags: override.metaTags,
            noindex: override.noindex,
          },
          { transaction },
        );
        retainedIds.add(created.id);
      }
    }

    const removalIds = existingOverrides
      .filter((override) => !retainedIds.has(override.id))
      .map((override) => override.id);
    if (removalIds.length) {
      await SeoPageOverride.destroy({ where: { id: removalIds }, transaction });
    }

    await setting.reload({
      include: [
        {
          model: SeoPageOverride,
          as: 'overrides',
          separate: false,
          order: [['path', 'ASC'], ['id', 'ASC']],
        },
      ],
      transaction,
    });

    logger.info({ event: 'seo_settings.update', settingId: setting.id }, 'SEO settings updated');

    return normalizeSeoRecord(setting);
  });
}

export default {
  getSeoSettings,
  updateSeoSettings,
};
