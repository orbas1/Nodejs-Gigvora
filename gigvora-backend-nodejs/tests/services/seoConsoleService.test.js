import { describe, beforeEach, it, expect } from '@jest/globals';
import '../setupTestEnv.js';
import { RouteRegistryEntry } from '../../src/models/routeRegistryModels.js';
import {
  SeoMetaTemplate,
  SeoSchemaTemplate,
  SeoSitemapJob,
} from '../../src/models/seoSetting.js';
import {
  generateSeoSitemap,
  getSeoConsoleSnapshot,
  submitSeoSitemapJob,
} from '../../src/services/seoConsoleService.js';
import { findOrCreateSeoSettingModel } from '../../src/services/seoSettingsService.js';

async function seedSeoConsoleFixtures() {
  await findOrCreateSeoSettingModel({
    defaults: {
      siteName: 'Gigvora',
      defaultTitle: 'Gigvora',
      defaultDescription: 'Default marketing description',
      defaultKeywords: ['gigvora', 'network'],
      canonicalBaseUrl: 'https://gigvora.test',
      allowIndexing: true,
      socialDefaults: { ogTitle: 'Gigvora', ogDescription: 'Build premium communities' },
    },
  });

  await RouteRegistryEntry.create({
    routeId: 'home',
    collection: 'Marketing',
    path: '/',
    absolutePath: '/',
    title: 'Homepage',
    metadata: { seo: { priority: 1, images: ['https://cdn.gigvora.test/home.png'] } },
    allowedRoles: [],
    allowedMemberships: [],
  });
  await RouteRegistryEntry.create({
    routeId: 'labs',
    collection: 'Experiments',
    path: '/labs',
    absolutePath: '/labs',
    title: 'Labs',
    metadata: { seo: { indexable: false }, preview: { images: ['https://cdn.gigvora.test/labs.png'] } },
    allowedRoles: [],
    allowedMemberships: [],
  });

  await SeoMetaTemplate.create({
    slug: 'homepage',
    label: 'Homepage',
    description: 'Hero + community template',
    persona: 'marketing',
    fields: {
      title: 'Gigvora · Professional Networks',
      description: 'Connect with elite operators, founders, and mentors.',
      keywords: ['gigvora', 'mentorship', 'talent'],
      ogTitle: 'Gigvora · Elite network',
    },
    recommendedUseCases: ['homepage'],
    isDefault: true,
  });

  await SeoSchemaTemplate.create({
    slug: 'article',
    label: 'Article',
    schemaType: 'Article',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How operators scale communities',
      description: 'Insights from Gigvora mentors',
      author: { '@type': 'Person', name: 'Gigvora Editorial' },
    },
    recommendedFields: ['headline', 'description', 'author'],
    richResultPreview: {
      title: 'Gigvora Article',
      description: 'Premium editorial preview',
      url: 'https://gigvora.test/stories/operators',
    },
    isActive: true,
  });
}

describe('seoConsoleService', () => {
  beforeEach(async () => {
    await seedSeoConsoleFixtures();
  });

  it('builds a complete snapshot with routes and templates', async () => {
    const snapshot = await getSeoConsoleSnapshot();

    expect(snapshot.settings.siteName).toBe('Gigvora');
    expect(snapshot.routes.entries).toHaveLength(2);
    expect(snapshot.routes.entries[0]).toHaveProperty('path');
    expect(snapshot.metaTemplates[0].slug).toBe('homepage');
    expect(snapshot.schemaTemplates[0].slug).toBe('article');
    expect(snapshot.sitemap.lastJob).toBeNull();
  });

  it('generates sitemap xml and records excluded routes', async () => {
    const result = await generateSeoSitemap({ baseUrl: 'https://gigvora.test' });

    expect(result.xml).toContain('<loc>https://gigvora.test/</loc>');
    expect(result.excluded).toEqual([{ path: '/labs', status: 'metadata_blocked' }]);
    expect(result.job.totalUrls).toBe(1);

    const persisted = await SeoSitemapJob.findAll();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].status).toBe('generated_with_warnings');
  });

  it('submits a sitemap job and persists submission metadata', async () => {
    const { job } = await generateSeoSitemap({ baseUrl: 'https://gigvora.test' });

    const submitted = await submitSeoSitemapJob(job.id, {
      actor: { actorId: 42, actorEmail: 'ops@gigvora.com' },
      notes: 'Submitted to Search Console',
    });

    expect(submitted.status).toBe('submitted');
    expect(submitted.message).toBe('Submitted to Search Console');
    expect(new Date(submitted.submittedAt).getTime()).not.toBeNaN();

    const refreshed = await SeoSitemapJob.findByPk(job.id);
    expect(refreshed.status).toBe('submitted');
    expect(refreshed.submittedAt).toBeTruthy();
  });

  it('throws when attempting to submit a non-existent job', async () => {
    await expect(submitSeoSitemapJob(9999)).rejects.toThrow('Sitemap generation job not found');
  });
});
