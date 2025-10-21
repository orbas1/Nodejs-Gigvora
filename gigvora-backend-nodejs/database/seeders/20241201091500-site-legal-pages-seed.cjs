'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { QueryTypes } = require('sequelize');

const DOCUMENT_FILES = [
  'terms.js',
  'privacy.js',
  'refund.js',
  'about.js',
  'communityGuidelines.js',
  'faq.js',
];

function resolveContentPath(relativePath) {
  return path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'gigvora-frontend-reactjs',
    'src',
    'content',
    'site',
    relativePath,
  );
}

async function loadDocument(relativePath) {
  const absolutePath = resolveContentPath(relativePath);
  const moduleUrl = pathToFileURL(absolutePath).href;
  const imported = await import(moduleUrl);
  if (!imported || typeof imported.default !== 'object') {
    throw new Error(`Expected ${relativePath} to export a default object`);
  }
  return imported.default;
}

function coerceString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function coerceNullableString(value) {
  const text = coerceString(value, '');
  return text.length ? text : null;
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const candidate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
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

function toStringArray(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : [value];
  const normalized = [];
  source.forEach((item) => {
    const text = coerceString(item, '');
    if (text) {
      normalized.push(text);
    }
  });
  return normalized;
}

function normalizeRoles(value) {
  const roles = toStringArray(value);
  const seen = new Set();
  roles.forEach((role) => {
    const lowered = role.toLowerCase();
    if (!seen.has(lowered)) {
      seen.add(lowered);
    }
  });
  return Array.from(seen);
}

function buildPagePayload(document) {
  if (!document || typeof document !== 'object') {
    throw new Error('Site document must be an object.');
  }
  const slugSource = document.slug || document.hero?.title || document.title;
  const slug = slugify(slugSource);
  if (!slug) {
    throw new Error('Site document must define a slug or title.');
  }
  const now = new Date();
  const publishedAt = coerceDate(document.publishedAt || document.lastUpdated) || now;
  const lastReviewedAt =
    coerceDate(document.lastReviewedAt) || coerceDate(document.lastUpdated) || null;
  const summary = coerceString(document.summary, '');
  const heroTitle = coerceString(document.hero?.title || document.title || slug, slug);
  return {
    slug,
    title: heroTitle,
    summary,
    heroTitle,
    heroSubtitle: coerceString(document.hero?.description, ''),
    heroEyebrow: coerceString(document.hero?.eyebrow, ''),
    heroMeta: coerceString(document.hero?.meta, ''),
    heroImageUrl: coerceNullableString(document.hero?.imageUrl),
    heroImageAlt: coerceNullableString(document.hero?.imageAlt),
    ctaLabel: coerceNullableString(document.hero?.ctaLabel),
    ctaUrl: coerceNullableString(document.hero?.ctaUrl),
    layout: coerceString(document.layout, 'standard'),
    body: typeof document.body === 'string' ? document.body : '',
    seoTitle: coerceNullableString(document.seo?.title || heroTitle),
    seoDescription: coerceNullableString(document.seo?.description || summary),
    seoKeywords: toStringArray(document.seo?.keywords),
    contactEmail: coerceNullableString(document.contactEmail || 'support@gigvora.com'),
    contactPhone: coerceNullableString(document.contactPhone),
    jurisdiction: coerceString(document.jurisdiction, 'United Kingdom'),
    version: coerceString(document.version, '1.0.0'),
    lastReviewedAt,
    status: 'published',
    publishedAt,
    featureHighlights: toStringArray(document.featureHighlights),
    allowedRoles: normalizeRoles(document.allowedRoles),
  };
}

async function loadAllDocuments() {
  return Promise.all(DOCUMENT_FILES.map((file) => loadDocument(file)));
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const documents = await loadAllDocuments();
      const payloads = documents.map(buildPagePayload);
      const slugs = payloads.map((doc) => doc.slug);
      const slugSet = new Set(slugs);
      if (slugSet.size !== slugs.length) {
        throw new Error('Duplicate slugs detected in site legal page payloads.');
      }

      const existingRows = await queryInterface.sequelize.query(
        'SELECT id, slug FROM site_pages WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          replacements: { slugs },
          transaction,
        },
      );
      const existingBySlug = new Map(existingRows.map((row) => [row.slug, row.id]));

      const now = new Date();
      for (const payload of payloads) {
        const pageId = existingBySlug.get(payload.slug);
        if (pageId) {
          await queryInterface.bulkUpdate(
            'site_pages',
            {
              ...payload,
              updatedAt: now,
            },
            { id: pageId },
            { transaction },
          );
        } else {
          await queryInterface.bulkInsert(
            'site_pages',
            [
              {
                ...payload,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const documents = await loadAllDocuments();
      const slugs = documents.map((document) => buildPagePayload(document).slug);
      await queryInterface.bulkDelete(
        'site_pages',
        {
          slug: slugs,
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  __private__: {
    DOCUMENT_FILES,
    resolveContentPath,
    loadDocument,
    buildPagePayload,
    slugify,
    normalizeRoles,
    toStringArray,
  },
};
