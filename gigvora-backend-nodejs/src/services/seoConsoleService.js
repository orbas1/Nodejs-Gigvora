import { Op } from 'sequelize';
import {
  SeoMetaTemplate,
  SeoSchemaTemplate,
  SeoSitemapJob,
} from '../models/seoSetting.js';
import { listRouteRegistry } from './routeRegistryService.js';
import {
  getSeoSettings,
  findOrCreateSeoSettingModel,
} from './seoSettingsService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function escapeXml(value) {
  return `${value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normaliseBaseUrl(baseUrl, fallback) {
  const candidate = `${baseUrl || fallback || ''}`.trim();
  if (!candidate) {
    return '';
  }
  try {
    const parsed = new URL(candidate);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    return '';
  }
}

function normalisePath(path) {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function computePriority(path, metadata = {}) {
  if (metadata?.seo?.priority != null) {
    const numeric = Number(metadata.seo.priority);
    if (Number.isFinite(numeric)) {
      return Math.max(0.1, Math.min(1, Number(numeric.toFixed(1))));
    }
  }
  if (path === '/') {
    return 1;
  }
  const segments = path.split('/').filter(Boolean).length;
  return Math.max(0.2, Number((1 - segments * 0.1).toFixed(1)));
}

function computeChangeFrequency(metadata = {}) {
  const candidate = metadata?.seo?.changeFrequency || metadata?.changefreq || metadata?.changeFreq;
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  return 'weekly';
}

function extractImages(metadata = {}) {
  if (Array.isArray(metadata?.seo?.images)) {
    return metadata.seo.images.map((image) => `${image}`.trim()).filter(Boolean);
  }
  if (Array.isArray(metadata?.preview?.images)) {
    return metadata.preview.images.map((image) => `${image}`.trim()).filter(Boolean);
  }
  if (metadata?.preview?.imageUrl) {
    return [`${metadata.preview.imageUrl}`.trim()];
  }
  return [];
}

function buildRouteEntries(settings, registryEntries) {
  const allowIndexing = Boolean(settings.allowIndexing);
  const noindexSet = new Set((settings.noindexPaths ?? []).map((path) => normalisePath(path).toLowerCase()));
  const overrides = new Map(
    (settings.pageOverrides ?? []).map((override) => [normalisePath(override.path).toLowerCase(), override]),
  );

  const entries = registryEntries.map((entry) => {
    const path = normalisePath(entry.absolutePath || entry.path);
    const pathKey = path.toLowerCase();
    const override = overrides.get(pathKey);
    const metadata = entry.metadata ?? {};
    const suppressedByOverride = Boolean(override?.noindex);
    const suppressedBySettings = noindexSet.has(pathKey);
    const suppressedByMetadata = metadata?.seo?.indexable === false || metadata?.robots === 'noindex';
    const suppressedByGlobal = !allowIndexing;

    let indexingStatus = 'index';
    if (suppressedByGlobal) {
      indexingStatus = 'global_disabled';
    } else if (suppressedByOverride || suppressedBySettings) {
      indexingStatus = 'settings_noindex';
    } else if (suppressedByMetadata) {
      indexingStatus = 'metadata_blocked';
    }
    const indexed = indexingStatus === 'index';

    const lastModified = metadata?.seo?.lastUpdatedAt || metadata?.contentUpdatedAt || entry.updatedAt;
    return {
      path,
      title: entry.title,
      collection: entry.collection,
      persona: entry.persona,
      featureFlag: entry.featureFlag,
      metadata,
      override,
      indexed,
      indexingStatus,
      priority: computePriority(path, metadata),
      changefreq: computeChangeFrequency(metadata),
      lastModified,
      images: extractImages(metadata),
    };
  });

  const totals = entries.reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.indexed) {
        acc.indexable += 1;
      } else {
        acc.suppressed += 1;
      }
      const key = entry.collection || 'Other';
      acc.collections[key] = (acc.collections[key] || 0) + 1;
      return acc;
    },
    { total: 0, indexable: 0, suppressed: 0, collections: {} },
  );

  return { entries, totals };
}

function buildSitemapXml(baseUrl, routes, { includeImages, includeLastModified }) {
  const prefix = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const urlSegments = routes.map((route) => {
    const parts = [`<loc>${escapeXml(`${prefix}${route.path}`)}</loc>`];
    parts.push(`<priority>${route.priority.toFixed(1)}</priority>`);
    parts.push(`<changefreq>${escapeXml(route.changefreq)}</changefreq>`);
    if (includeLastModified && route.lastModified) {
      try {
        const iso = new Date(route.lastModified).toISOString();
        parts.push(`<lastmod>${iso.split('T')[0]}</lastmod>`);
      } catch (error) {
        // ignore invalid dates
      }
    }
    if (includeImages && Array.isArray(route.images)) {
      route.images
        .filter(Boolean)
        .forEach((imageUrl) => {
          parts.push(`<image:image><image:loc>${escapeXml(imageUrl)}</image:loc></image:image>`);
        });
    }
    return `<url>${parts.join('')}</url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urlSegments.join('')}</urlset>`;
}

export async function getSeoConsoleSnapshot() {
  const settingModel = await findOrCreateSeoSettingModel();
  const [settings, registryEntries, schemaTemplates, metaTemplates, lastJob, jobCount] = await Promise.all([
    getSeoSettings(),
    listRouteRegistry({ includeInactive: false }),
    SeoSchemaTemplate.findAll({
      where: { [Op.or]: [{ isActive: true }, { isActive: null }] },
      order: [['label', 'ASC']],
    }),
    SeoMetaTemplate.findAll({ order: [['isDefault', 'DESC'], ['label', 'ASC']] }),
    SeoSitemapJob.findOne({
      where: { seoSettingId: settingModel.id },
      order: [['generatedAt', 'DESC']],
    }),
    SeoSitemapJob.count({ where: { seoSettingId: settingModel.id } }),
  ]);

  const routeSnapshot = buildRouteEntries(settings, registryEntries);

  return {
    settings,
    routes: {
      totals: routeSnapshot.totals,
      entries: routeSnapshot.entries,
    },
    sitemap: {
      lastJob: lastJob ? lastJob.toPublicObject() : null,
      totalJobs: jobCount,
    },
    schemaTemplates: schemaTemplates.map((template) => template.toPublicObject()),
    metaTemplates: metaTemplates.map((template) => template.toPublicObject()),
  };
}

export async function listSeoMetaTemplates() {
  const templates = await SeoMetaTemplate.findAll({ order: [['isDefault', 'DESC'], ['label', 'ASC']] });
  return templates.map((template) => template.toPublicObject());
}

export async function listSeoSchemaTemplates({ includeInactive = false } = {}) {
  const where = includeInactive ? {} : { [Op.or]: [{ isActive: true }, { isActive: null }] };
  const templates = await SeoSchemaTemplate.findAll({ where, order: [['label', 'ASC']] });
  return templates.map((template) => template.toPublicObject());
}

export async function listSeoSitemapJobs({ limit = 20 } = {}) {
  const settingModel = await findOrCreateSeoSettingModel();
  const jobs = await SeoSitemapJob.findAll({
    where: { seoSettingId: settingModel.id },
    order: [['generatedAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
  });
  return jobs.map((job) => job.toPublicObject());
}

export async function generateSeoSitemap(
  { baseUrl, includeImages = true, includeLastModified = true } = {},
  { actor } = {},
) {
  const settingModel = await findOrCreateSeoSettingModel();
  const settings = await getSeoSettings();
  const normalisedBaseUrl = normaliseBaseUrl(baseUrl, settings.canonicalBaseUrl);
  if (!normalisedBaseUrl) {
    throw new ValidationError('baseUrl must be a valid absolute URL.');
  }

  const registryEntries = await listRouteRegistry({ includeInactive: false });
  const routeSnapshot = buildRouteEntries(settings, registryEntries);
  const indexableRoutes = routeSnapshot.entries.filter((entry) => entry.indexed);
  if (!indexableRoutes.length) {
    throw new ValidationError('No indexable routes available for sitemap generation.');
  }

  const xml = buildSitemapXml(normalisedBaseUrl, indexableRoutes, {
    includeImages,
    includeLastModified,
  });

  const warnings = routeSnapshot.entries
    .filter((entry) => !entry.indexed)
    .map((entry) => ({ path: entry.path, status: entry.indexingStatus }));

  const job = await SeoSitemapJob.create({
    seoSettingId: settingModel.id,
    baseUrl: normalisedBaseUrl,
    includeImages: Boolean(includeImages),
    includeLastModified: Boolean(includeLastModified),
    totalUrls: indexableRoutes.length,
    indexedUrls: indexableRoutes.length,
    warnings: warnings.length ? warnings : null,
    xml,
    status: warnings.length ? 'generated_with_warnings' : 'generated',
    message: warnings.length ? 'Generated with suppressed routes excluded.' : null,
    triggeredBy: actor || null,
    generatedAt: new Date(),
  });

  logger.info(
    {
      event: 'seo_console.sitemap_generated',
      settingId: settingModel.id,
      urls: indexableRoutes.length,
      warnings: warnings.length,
    },
    'SEO sitemap generated',
  );

  return {
    xml,
    job: job.toPublicObject(),
    excluded: warnings,
  };
}

export async function submitSeoSitemapJob(jobId, { actor, notes } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required to submit a sitemap job.');
  }

  const settingModel = await findOrCreateSeoSettingModel();
  const job = await SeoSitemapJob.findOne({
    where: { id: jobId, seoSettingId: settingModel.id },
  });

  if (!job) {
    throw new NotFoundError('Sitemap generation job not found.');
  }

  const submittedAt = new Date();
  const nextStatus = 'submitted';
  const nextMessage = notes && notes.trim().length ? notes.trim() : job.message;

  await job.update({
    status: nextStatus,
    submittedAt,
    message: nextMessage ?? null,
    triggeredBy: actor ?? job.triggeredBy ?? null,
  });

  logger.info(
    {
      event: 'seo_console.sitemap_submitted',
      jobId: job.id,
      settingId: settingModel.id,
      actor,
    },
    'SEO sitemap job submitted to search console',
  );

  return job.toPublicObject();
}

export default {
  getSeoConsoleSnapshot,
  generateSeoSitemap,
  listSeoSitemapJobs,
  listSeoSchemaTemplates,
  listSeoMetaTemplates,
  submitSeoSitemapJob,
};
