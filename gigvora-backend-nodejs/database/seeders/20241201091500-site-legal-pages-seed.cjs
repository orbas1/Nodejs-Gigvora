'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { QueryTypes } = require('sequelize');

async function loadDocument(relativePath) {
  const absolutePath = path.resolve(
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
  const moduleUrl = pathToFileURL(absolutePath).href;
  const imported = await import(moduleUrl);
  return imported.default;
}

function buildPagePayload(document) {
  const now = new Date();
  const publishedAt = document.lastUpdated ? new Date(document.lastUpdated) : now;
  const lastReviewedAt = document.lastReviewedAt
    ? new Date(document.lastReviewedAt)
    : document.lastUpdated
    ? new Date(document.lastUpdated)
    : null;
  return {
    slug: document.slug,
    title: document.hero?.title || document.title || document.slug,
    summary: document.summary || '',
    heroTitle: document.hero?.title || document.title || '',
    heroSubtitle: document.hero?.description || '',
    heroEyebrow: document.hero?.eyebrow || '',
    heroMeta: document.hero?.meta || '',
    heroImageUrl: document.hero?.imageUrl || null,
    heroImageAlt: document.hero?.imageAlt || null,
    ctaLabel: document.hero?.ctaLabel || null,
    ctaUrl: document.hero?.ctaUrl || null,
    layout: document.layout || 'standard',
    body: document.body || '',
    seoTitle: document.seo?.title || document.hero?.title || null,
    seoDescription: document.seo?.description || document.summary || null,
    seoKeywords: Array.isArray(document.seo?.keywords) ? document.seo.keywords : [],
    contactEmail: document.contactEmail || 'support@gigvora.com',
    contactPhone: document.contactPhone || null,
    jurisdiction: document.jurisdiction || 'United Kingdom',
    version: document.version || '1.0.0',
    lastReviewedAt,
    status: 'published',
    publishedAt,
    featureHighlights: Array.isArray(document.featureHighlights) ? document.featureHighlights : [],
    allowedRoles: Array.isArray(document.allowedRoles) ? document.allowedRoles : [],
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const documents = await Promise.all([
        loadDocument('terms.js'),
        loadDocument('privacy.js'),
        loadDocument('refund.js'),
        loadDocument('about.js'),
        loadDocument('communityGuidelines.js'),
        loadDocument('faq.js'),
      ]);

      const payloads = documents.map(buildPagePayload);
      const slugs = payloads.map((doc) => doc.slug);

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
      await queryInterface.bulkDelete(
        'site_pages',
        {
          slug: ['terms', 'privacy', 'refunds', 'about', 'community-guidelines', 'faq'],
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
