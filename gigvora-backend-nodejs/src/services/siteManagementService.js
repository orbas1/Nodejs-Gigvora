import { Op } from 'sequelize';
import {
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SITE_PAGE_STATUSES,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const SITE_SETTINGS_KEY = 'site:global';

function coerceString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  const text = `${value}`.trim();
  return text.length ? text : fallback;
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(lowered)) {
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

function coerceInteger(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? fallback : numeric;
}

function normalizeRoles(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  const unique = new Set();
  source.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return;
    }
    unique.add(trimmed.toLowerCase());
  });
  return Array.from(unique);
}

function slugify(value) {
  return coerceString(value, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 150);
}

function buildDefaultSiteSettings() {
  return {
    siteName: coerceString(process.env.SITE_NAME, 'Gigvora'),
    tagline: coerceString(process.env.SITE_TAGLINE, 'Where global operators build together'),
    domain: coerceString(process.env.SITE_DOMAIN, 'gigvora.com'),
    primaryColor: coerceString(process.env.SITE_PRIMARY_COLOR, '#2563eb'),
    accentColor: coerceString(process.env.SITE_ACCENT_COLOR, '#f97316'),
    supportEmail: coerceString(process.env.SITE_SUPPORT_EMAIL, 'support@gigvora.com'),
    supportPhone: coerceString(process.env.SITE_SUPPORT_PHONE),
    hero: {
      title: coerceString(process.env.SITE_HERO_TITLE, 'Launch high-trust squads in days'),
      subtitle: coerceString(
        process.env.SITE_HERO_SUBTITLE,
        'Gigvora orchestrates hiring, payments, and trust so your operators can ship outcomes.',
      ),
      backgroundImageUrl: coerceString(process.env.SITE_HERO_IMAGE_URL),
      backgroundImageAlt: coerceString(process.env.SITE_HERO_IMAGE_ALT),
      ctaLabel: coerceString(process.env.SITE_HERO_CTA_LABEL, 'Book a demo'),
      ctaUrl: coerceString(process.env.SITE_HERO_CTA_URL, 'https://gigvora.com/demo'),
    },
    assets: {
      logoUrl: coerceString(process.env.SITE_LOGO_URL),
      faviconUrl: coerceString(process.env.SITE_FAVICON_URL),
    },
    seo: {
      defaultTitle: coerceString(process.env.SITE_SEO_TITLE, 'Gigvora — Enterprise talent network'),
      defaultDescription: coerceString(
        process.env.SITE_SEO_DESCRIPTION,
        'Gigvora connects mission-aligned builders with ready-to-ship operators backed by trust infrastructure.',
      ),
      socialImageUrl: coerceString(process.env.SITE_SOCIAL_IMAGE_URL),
    },
    social: {
      twitter: coerceString(process.env.SITE_TWITTER_URL),
      linkedin: coerceString(process.env.SITE_LINKEDIN_URL),
      youtube: coerceString(process.env.SITE_YOUTUBE_URL),
      instagram: coerceString(process.env.SITE_INSTAGRAM_URL),
    },
    announcement: {
      enabled: coerceBoolean(process.env.SITE_ANNOUNCEMENT_ENABLED, false),
      message: coerceString(process.env.SITE_ANNOUNCEMENT_MESSAGE),
      linkLabel: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_LABEL),
      linkUrl: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_URL),
    },
    footer: {
      links: [],
      copyright: coerceString(process.env.SITE_FOOTER_COPYRIGHT, '© {year} Gigvora. All rights reserved.'),
    },
  };
}

function sanitizeFooterLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  const sanitized = [];
  links.forEach((link) => {
    const label = coerceString(link?.label);
    const url = coerceString(link?.url);
    if (!label || !url) {
      return;
    }
    sanitized.push({
      id: link?.id ?? null,
      label,
      url,
      description: coerceString(link?.description),
      icon: coerceString(link?.icon),
      orderIndex: coerceInteger(link?.orderIndex, sanitized.length),
    });
  });
  return sanitized;
}

function sanitizeSettingsCandidate(candidate = {}) {
  const baseline = buildDefaultSiteSettings();
  const settings = { ...baseline, ...candidate };
  settings.hero = { ...baseline.hero, ...(candidate.hero ?? {}) };
  settings.assets = { ...baseline.assets, ...(candidate.assets ?? {}) };
  settings.seo = { ...baseline.seo, ...(candidate.seo ?? {}) };
  settings.social = { ...baseline.social, ...(candidate.social ?? {}) };
  settings.announcement = { ...baseline.announcement, ...(candidate.announcement ?? {}) };
  settings.footer = { ...baseline.footer, ...(candidate.footer ?? {}) };
  settings.footer.links = sanitizeFooterLinks(settings.footer.links);
  return settings;
}

async function ensureSiteSetting({ transaction } = {}) {
  const existing = await SiteSetting.findOne({ where: { key: SITE_SETTINGS_KEY }, transaction });
  if (existing) {
    return existing;
  }
  const defaults = buildDefaultSiteSettings();
  return SiteSetting.create(
    {
      key: SITE_SETTINGS_KEY,
      value: defaults,
    },
    { transaction },
  );
}

function normalizeNavigationPayload(payload = {}, { forUpdate = false } = {}) {
  const label = coerceString(payload.label);
  const url = coerceString(payload.url);
  if (!label) {
    throw new ValidationError('Navigation label is required.');
  }
  if (!url) {
    throw new ValidationError('Navigation URL is required.');
  }
  const menuKey = coerceString(payload.menuKey, 'primary').toLowerCase();
  const orderIndex = coerceInteger(payload.orderIndex, 0);
  const allowedRoles = normalizeRoles(payload.allowedRoles);
  return {
    ...(forUpdate ? {} : { menuKey }),
    menuKey,
    label,
    url,
    description: coerceString(payload.description),
    icon: coerceString(payload.icon),
    orderIndex,
    isExternal: coerceBoolean(payload.isExternal, false),
    openInNewTab: coerceBoolean(payload.openInNewTab, false),
    allowedRoles,
    parentId: payload.parentId ?? null,
  };
}

function normalizePagePayload(payload = {}) {
  const title = coerceString(payload.title);
  if (!title) {
    throw new ValidationError('Page title is required.');
  }
  const slug = slugify(payload.slug || title);
  if (!slug) {
    throw new ValidationError('A slug is required to publish the page.');
  }
  const status = coerceString(payload.status, 'draft');
  if (!SITE_PAGE_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of ${SITE_PAGE_STATUSES.join(', ')}.`);
  }
  const featureHighlights = Array.isArray(payload.featureHighlights)
    ? payload.featureHighlights.map((item) => coerceString(item)).filter(Boolean)
    : [];
  const seoKeywords = Array.isArray(payload.seoKeywords)
    ? payload.seoKeywords.map((item) => coerceString(item)).filter(Boolean)
    : [];
  return {
    slug,
    title,
    summary: coerceString(payload.summary),
    heroTitle: coerceString(payload.heroTitle),
    heroSubtitle: coerceString(payload.heroSubtitle),
    heroImageUrl: coerceString(payload.heroImageUrl),
    heroImageAlt: coerceString(payload.heroImageAlt),
    ctaLabel: coerceString(payload.ctaLabel),
    ctaUrl: coerceString(payload.ctaUrl),
    layout: coerceString(payload.layout, 'standard'),
    body: payload.body ?? null,
    featureHighlights,
    seoTitle: coerceString(payload.seoTitle),
    seoDescription: coerceString(payload.seoDescription),
    seoKeywords,
    thumbnailUrl: coerceString(payload.thumbnailUrl),
    status,
    allowedRoles: normalizeRoles(payload.allowedRoles),
  };
}

export async function getSiteManagementOverview() {
  const [settingsModel, navigationLinks, pages] = await Promise.all([
    ensureSiteSetting(),
    SiteNavigationLink.findAll({ order: [['menuKey', 'ASC'], ['orderIndex', 'ASC'], ['id', 'ASC']] }),
    SitePage.findAll({ order: [['updatedAt', 'DESC']] }),
  ]);

  const navigation = navigationLinks.reduce((acc, link) => {
    const bucket = link.menuKey ?? 'primary';
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(link.toPublicObject());
    return acc;
  }, {});

  const pageObjects = pages.map((page) => page.toPublicObject());
  const stats = {
    published: pageObjects.filter((page) => page.status === 'published').length,
    draft: pageObjects.filter((page) => page.status !== 'published').length,
  };

  return {
    settings: settingsModel.value ?? buildDefaultSiteSettings(),
    navigation,
    pages: pageObjects,
    stats,
    updatedAt: new Date().toISOString(),
  };
}

export async function getSiteSettings() {
  const model = await ensureSiteSetting();
  return model.value ?? buildDefaultSiteSettings();
}

export async function getSiteNavigation({ menuKey } = {}) {
  const where = {};
  if (menuKey) {
    where.menuKey = `${menuKey}`.trim();
  }

  const links = await SiteNavigationLink.findAll({
    where,
    order: [
      ['menuKey', 'ASC'],
      ['orderIndex', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return links.map((link) => link.toPublicObject());
}

export async function saveSiteSettings(patch = {}) {
  const sanitized = sanitizeSettingsCandidate(patch);
  const result = await sequelize.transaction(async (transaction) => {
    const setting = await ensureSiteSetting({ transaction });
    setting.value = sanitized;
    await setting.save({ transaction });
    return setting;
  });
  return { settings: result.toPublicObject().value, updatedAt: result.updatedAt };
}

export async function createNavigation(payload = {}) {
  const normalized = normalizeNavigationPayload(payload);
  const link = await SiteNavigationLink.create(normalized);
  return link.toPublicObject();
}

export async function updateNavigation(linkId, patch = {}) {
  const link = await SiteNavigationLink.findByPk(linkId);
  if (!link) {
    throw new NotFoundError('Navigation link not found.');
  }
  const normalized = normalizeNavigationPayload({ ...link.get({ plain: true }), ...patch }, { forUpdate: true });
  Object.assign(link, normalized);
  await link.save();
  return link.toPublicObject();
}

export async function deleteNavigation(linkId) {
  const deleted = await SiteNavigationLink.destroy({ where: { id: linkId } });
  if (!deleted) {
    throw new NotFoundError('Navigation link not found.');
  }
  return { success: true };
}

export async function createSitePage(payload = {}) {
  const normalized = normalizePagePayload(payload);
  const page = await sequelize.transaction(async (transaction) => {
    const existing = await SitePage.findOne({ where: { slug: normalized.slug }, transaction });
    if (existing) {
      throw new ValidationError('A page with this slug already exists.');
    }
    const created = await SitePage.create(
      {
        ...normalized,
        publishedAt: normalized.status === 'published' ? new Date() : null,
      },
      { transaction },
    );
    return created;
  });
  return page.toPublicObject();
}

export async function updateSitePageById(pageId, patch = {}) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await SitePage.findByPk(pageId, { transaction });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }
    const mergedPayload = { ...page.toPublicObject(), ...patch };
    const normalized = normalizePagePayload(mergedPayload);
    if (normalized.slug !== page.slug) {
      const clash = await SitePage.findOne({
        where: { slug: normalized.slug, id: { [Op.ne]: pageId } },
        transaction,
      });
      if (clash) {
        throw new ValidationError('Another page already uses this slug.');
      }
    }
    const wasPublished = page.status === 'published';
    const willBePublished = normalized.status === 'published';
    Object.assign(page, normalized);
    if (willBePublished && !wasPublished) {
      page.publishedAt = new Date();
    }
    if (!willBePublished && wasPublished && normalized.status !== 'published') {
      page.publishedAt = page.publishedAt ?? null;
    }
    await page.save({ transaction });
    return page.toPublicObject();
  });
}

export async function deleteSitePageById(pageId) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  const deleted = await SitePage.destroy({ where: { id: pageId } });
  if (!deleted) {
    throw new NotFoundError('Page not found.');
  }
  return { success: true };
}

export async function listSitePages({
  status = 'published',
  includeDrafts = false,
  limit = 50,
  offset = 0,
  order = [['publishedAt', 'DESC'], ['updatedAt', 'DESC']],
} = {}) {
  const where = {};
  if (!includeDrafts) {
    const statuses = Array.isArray(status) ? status : [status];
    const sanitised = statuses.map((value) => coerceString(value)).filter((value) => value && value !== 'all');
    where.status = sanitised.length ? sanitised : ['published'];
  } else if (status && status !== 'all') {
    where.status = Array.isArray(status)
      ? status.map((value) => coerceString(value)).filter(Boolean)
      : [coerceString(status)].filter(Boolean);
  }

  const pages = await SitePage.findAll({
    where,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    offset: Number.isFinite(offset) && offset > 0 ? offset : undefined,
    order,
  });

  return pages.map((page) => page.toPublicObject());
}

export async function getPublishedSitePage(slug, { allowDraft = false } = {}) {
  const normalisedSlug = coerceString(slug);
  if (!normalisedSlug) {
    throw new ValidationError('A slug is required.');
  }

  const where = { slug: normalisedSlug };
  if (!allowDraft) {
    where.status = 'published';
  }

  const page = await SitePage.findOne({ where });
  if (!page) {
    throw new NotFoundError('Page not found.');
  }
  return page.toPublicObject();
}

export default {
  getSiteManagementOverview,
  getSiteSettings,
  getSiteNavigation,
  saveSiteSettings,
  createNavigation,
  updateNavigation,
  deleteNavigation,
  createSitePage,
  updateSitePageById,
  deleteSitePageById,
  listSitePages,
  getPublishedSitePage,
};
