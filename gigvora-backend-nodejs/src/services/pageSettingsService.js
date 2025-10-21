import { Op } from 'sequelize';
import {
  PageSetting,
  PAGE_LAYOUT_VARIANTS,
  PAGE_SETTING_STATUSES,
  PAGE_SETTING_VISIBILITIES,
} from '../models/pageSetting.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const ALLOWED_SECTION_TYPES = new Set([
  'hero',
  'metrics',
  'testimonials',
  'gallery',
  'cta',
  'faq',
  'highlights',
  'news',
  'custom',
]);
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video', 'embed']);
const ALLOWED_ALIGNMENTS = new Set(['left', 'center', 'right']);

function slugify(value, fallback = 'page') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 180) || fallback;
}

function normaliseLimit(limit) {
  if (limit == null) return DEFAULT_LIMIT;
  const numeric = Number(limit);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(numeric), MAX_LIMIT);
}

function normaliseOffset(offset) {
  if (offset == null) return 0;
  const numeric = Number(offset);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.trunc(numeric);
}

function sanitiseKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }
  const normalised = keywords
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
    .filter(Boolean);
  return Array.from(new Set(normalised)).slice(0, 30);
}

function sanitiseNavigationLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .map((link, index) => {
      if (!link || typeof link !== 'object') {
        return null;
      }
      const label = typeof link.label === 'string' ? link.label.trim() : '';
      const url = typeof link.url === 'string' ? link.url.trim() : '';
      if (!label || !url) {
        return null;
      }
      return {
        id: typeof link.id === 'string' && link.id.trim() ? link.id.trim() : `link-${index + 1}`,
        label: label.slice(0, 80),
        url: url.slice(0, 2048),
        external: Boolean(link.external),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function sanitiseTheme(theme = {}) {
  const result = {};
  if (typeof theme.accent === 'string') {
    result.accent = theme.accent.trim().slice(0, 20);
  }
  if (typeof theme.background === 'string') {
    result.background = theme.background.trim().slice(0, 20);
  }
  if (typeof theme.text === 'string') {
    result.text = theme.text.trim().slice(0, 20);
  }
  return result;
}

function sanitiseHero(hero = {}) {
  if (!hero || typeof hero !== 'object') {
    return {};
  }
  const alignmentCandidate = typeof hero.alignment === 'string' ? hero.alignment.trim().toLowerCase() : '';
  const mediaTypeCandidate = typeof hero.mediaType === 'string' ? hero.mediaType.trim().toLowerCase() : '';

  return {
    title: typeof hero.title === 'string' ? hero.title.trim().slice(0, 200) : '',
    subtitle: typeof hero.subtitle === 'string' ? hero.subtitle.trim().slice(0, 480) : '',
    badge: typeof hero.badge === 'string' ? hero.badge.trim().slice(0, 80) : '',
    mediaType: ALLOWED_MEDIA_TYPES.has(mediaTypeCandidate) ? mediaTypeCandidate : 'image',
    mediaUrl: typeof hero.mediaUrl === 'string' ? hero.mediaUrl.trim().slice(0, 2048) : '',
    backgroundImageUrl:
      typeof hero.backgroundImageUrl === 'string' ? hero.backgroundImageUrl.trim().slice(0, 2048) : '',
    accentColor: typeof hero.accentColor === 'string' ? hero.accentColor.trim().slice(0, 20) : '',
    alignment: ALLOWED_ALIGNMENTS.has(alignmentCandidate) ? alignmentCandidate : 'left',
  };
}

function sanitiseSeo(seo = {}) {
  if (!seo || typeof seo !== 'object') {
    return {};
  }
  return {
    title: typeof seo.title === 'string' ? seo.title.trim().slice(0, 200) : '',
    description: typeof seo.description === 'string' ? seo.description.trim().slice(0, 320) : '',
    keywords: sanitiseKeywords(seo.keywords ?? []),
  };
}

function sanitiseCta(link = {}) {
  if (!link || typeof link !== 'object') {
    return null;
  }
  const label = typeof link.label === 'string' ? link.label.trim() : '';
  const url = typeof link.url === 'string' ? link.url.trim() : '';
  if (!label && !url) {
    return null;
  }
  return {
    label: label.slice(0, 80),
    url: url.slice(0, 2048),
    external: Boolean(link.external),
  };
}

function sanitiseCallToAction(callToAction = {}) {
  const primary = sanitiseCta(callToAction.primary);
  const secondary = sanitiseCta(callToAction.secondary);
  const result = {};
  if (primary) {
    result.primary = primary;
  }
  if (secondary) {
    result.secondary = secondary;
  }
  return result;
}

function sanitiseSections(sections = []) {
  if (!Array.isArray(sections)) {
    return [];
  }
  return sections
    .map((section, index) => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      const title = typeof section.title === 'string' ? section.title.trim() : '';
      if (!title) {
        return null;
      }
      const typeCandidate = typeof section.type === 'string' ? section.type.trim().toLowerCase() : 'custom';
      const media = section.media && typeof section.media === 'object'
        ? {
            type:
              typeof section.media.type === 'string' && ALLOWED_MEDIA_TYPES.has(section.media.type.trim().toLowerCase())
                ? section.media.type.trim().toLowerCase()
                : 'image',
            url: typeof section.media.url === 'string' ? section.media.url.trim().slice(0, 2048) : '',
            altText: typeof section.media.altText === 'string' ? section.media.altText.trim().slice(0, 255) : '',
          }
        : null;
      const cta = sanitiseCta(section.cta);
      const summary = typeof section.summary === 'string' ? section.summary.trim().slice(0, 600) : '';
      const order = Number.isFinite(section.order) ? Math.max(0, Math.trunc(section.order)) : index;
      return {
        id: typeof section.id === 'string' && section.id.trim() ? section.id.trim().slice(0, 120) : `section-${index + 1}`,
        title: title.slice(0, 160),
        type: ALLOWED_SECTION_TYPES.has(typeCandidate) ? typeCandidate : 'custom',
        summary,
        enabled: section.enabled !== false,
        media: media ?? undefined,
        cta: cta ?? undefined,
        order,
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function sanitiseAllowedRoles(input) {
  if (!Array.isArray(input)) {
    return ['admin'];
  }
  const roles = input
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const unique = Array.from(new Set(roles));
  return unique.length ? unique.slice(0, 20) : ['admin'];
}

function sanitiseNavigation(navigation = {}) {
  if (!navigation || typeof navigation !== 'object') {
    return { header: [], footer: [] };
  }
  return {
    header: sanitiseNavigationLinks(navigation.header ?? []),
    footer: sanitiseNavigationLinks(navigation.footer ?? []),
  };
}

function buildPayload(input = {}, existing = null) {
  const payload = {};

  if (input.name != null) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      throw new ValidationError('Page name is required.');
    }
    payload.name = input.name.trim().slice(0, 160);
  } else if (!existing) {
    throw new ValidationError('Page name is required.');
  }

  const slugSource = input.slug ?? payload.name ?? existing?.slug ?? existing?.name;
  if (!slugSource || typeof slugSource !== 'string') {
    throw new ValidationError('Page slug is required.');
  }
  payload.slug = slugify(slugSource, existing?.slug ?? 'page');

  if (input.description !== undefined) {
    payload.description = typeof input.description === 'string' ? input.description.trim().slice(0, 480) : null;
  } else if (!existing) {
    payload.description = null;
  }

  if (input.status != null) {
    const status = typeof input.status === 'string' ? input.status.trim().toLowerCase() : '';
    if (!PAGE_SETTING_STATUSES.includes(status)) {
      throw new ValidationError('Invalid page status.');
    }
    payload.status = status;
  } else if (!existing) {
    payload.status = 'draft';
  }

  if (input.visibility != null) {
    const visibility = typeof input.visibility === 'string' ? input.visibility.trim().toLowerCase() : '';
    if (!PAGE_SETTING_VISIBILITIES.includes(visibility)) {
      throw new ValidationError('Invalid page visibility.');
    }
    payload.visibility = visibility;
  } else if (!existing) {
    payload.visibility = 'private';
  }

  if (input.layout != null) {
    const layout = typeof input.layout === 'string' ? input.layout.trim().toLowerCase() : '';
    payload.layout = PAGE_LAYOUT_VARIANTS.includes(layout) ? layout : 'standard';
  } else if (!existing) {
    payload.layout = 'standard';
  }

  if (input.hero !== undefined || !existing) {
    payload.hero = sanitiseHero(input.hero ?? {});
  }

  if (input.seo !== undefined || !existing) {
    payload.seo = sanitiseSeo(input.seo ?? {});
  }

  if (input.callToAction !== undefined || !existing) {
    payload.callToAction = sanitiseCallToAction(input.callToAction ?? {});
  }

  if (input.navigation !== undefined || !existing) {
    payload.navigation = sanitiseNavigation(input.navigation ?? {});
  }

  if (input.sections !== undefined || !existing) {
    payload.sections = sanitiseSections(input.sections ?? []);
  }

  if (input.theme !== undefined || !existing) {
    payload.theme = sanitiseTheme(input.theme ?? {});
  }

  if (input.allowedRoles !== undefined || input.roleAccess !== undefined || !existing) {
    const allowedRoles =
      input.allowedRoles ?? input.roleAccess?.allowedRoles ?? existing?.roleAccess?.allowedRoles ?? ['admin'];
    payload.roleAccess = { allowedRoles: sanitiseAllowedRoles(allowedRoles) };
  }

  if (input.media !== undefined) {
    payload.media = input.media && typeof input.media === 'object' ? input.media : {};
  } else if (!existing) {
    payload.media = {};
  }

  return payload;
}

export async function listPageSettings({ limit, offset } = {}) {
  const resolvedLimit = normaliseLimit(limit);
  const resolvedOffset = normaliseOffset(offset);

  const { rows, count } = await PageSetting.findAndCountAll({
    limit: resolvedLimit,
    offset: resolvedOffset,
    order: [
      ['updatedAt', 'DESC'],
      ['name', 'ASC'],
    ],
  });

  return {
    items: rows.map((row) => row.toPublicObject()),
    meta: {
      total: count,
      limit: resolvedLimit,
      offset: resolvedOffset,
    },
  };
}

async function ensureSlugUnique(slug, excludeId = null) {
  const where = excludeId
    ? {
        slug,
        id: { [Op.ne]: excludeId },
      }
    : { slug };

  const existing = await PageSetting.findOne({ where });
  if (existing) {
    throw new ConflictError('A page with this slug already exists.');
  }
}

export async function createPageSetting(input = {}, { actorId } = {}) {
  const payload = buildPayload(input);
  await ensureSlugUnique(payload.slug);
  if (actorId) {
    payload.updatedBy = actorId;
  }
  if (payload.status === 'published') {
    payload.lastPublishedAt = new Date();
  }
  const record = await PageSetting.create(payload);
  logger.info({ component: 'page-settings', action: 'create', slug: record.slug, id: record.id }, 'Page created');
  return record.toPublicObject();
}

export async function updatePageSetting(identifier, input = {}, { actorId } = {}) {
  if (!identifier) {
    throw new ValidationError('Page identifier is required.');
  }

  let record = null;
  if (typeof identifier === 'string') {
    record = await PageSetting.findByPk(identifier);
    if (!record) {
      record = await PageSetting.findOne({ where: { slug: identifier } });
    }
  }

  if (!record) {
    throw new NotFoundError('Page configuration not found.');
  }

  const payload = buildPayload(input, record.toJSON());
  if (payload.slug && payload.slug !== record.slug) {
    await ensureSlugUnique(payload.slug, record.id);
  }
  if (actorId) {
    payload.updatedBy = actorId;
  }

  if (payload.status === 'published') {
    payload.lastPublishedAt = record.lastPublishedAt ?? new Date();
  } else if (payload.status && payload.status !== 'published') {
    payload.lastPublishedAt = record.lastPublishedAt ?? null;
  }

  record.set(payload);
  await record.save();
  logger.info(
    { component: 'page-settings', action: 'update', slug: record.slug, id: record.id },
    'Page configuration updated',
  );
  return record.toPublicObject();
}

export async function deletePageSetting(identifier) {
  if (!identifier) {
    throw new ValidationError('Page identifier is required.');
  }

  let record = null;
  if (typeof identifier === 'string') {
    record = await PageSetting.findByPk(identifier);
    if (!record) {
      record = await PageSetting.findOne({ where: { slug: identifier } });
    }
  }

  if (!record) {
    throw new NotFoundError('Page configuration not found.');
  }

  await record.destroy();
  logger.info(
    { component: 'page-settings', action: 'delete', slug: record.slug, id: record.id },
    'Page configuration deleted',
  );

  return { id: record.id };
}

export const __testing = {
  slugify,
  normaliseLimit,
  normaliseOffset,
  sanitiseKeywords,
  sanitiseNavigationLinks,
  sanitiseTheme,
  sanitiseHero,
  sanitiseSeo,
  sanitiseCallToAction,
  sanitiseSections,
  buildPayload,
};

export default {
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
};
