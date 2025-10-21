import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const siteLegalSeed = require('../../database/seeders/20241201091500-site-legal-pages-seed.cjs');

const { buildPagePayload } = siteLegalSeed.__private__;

describe('site legal pages seeder helpers', () => {
  it('normalises legal document payloads for persistence', () => {
    const payload = buildPagePayload({
      slug: ' Terms-and Conditions  ',
      title: '  Terms & Conditions  ',
      summary: '  Governs usage across the marketplace.  ',
      hero: {
        title: 'Terms and Conditions',
        description: '  Detailed obligations for every workspace. ',
        eyebrow: 'Legal',
        meta: 'Updated quarterly',
        imageUrl: ' https://cdn.gigvora.com/trust/hero.png ',
        imageAlt: 'Gigvora trust centre hero',
        ctaLabel: ' Read now ',
        ctaUrl: ' https://gigvora.com/trust/terms ',
      },
      layout: ' longform ',
      body: '<h1>Terms</h1>',
      seo: {
        title: 'Gigvora Terms of Service',
        description: 'All policies that govern the Gigvora network.',
        keywords: ['Gigvora', ' Terms  ', '', null],
      },
      featureHighlights: ['Trust architecture', 'Data residency ', '', null],
      allowedRoles: ['Admin', ' user ', 'ADMIN'],
      contactEmail: 'legal@gigvora.com',
      jurisdiction: '  United Kingdom  ',
      version: ' 2.0.0 ',
      lastUpdated: '2024-08-14T11:00:00.000Z',
      lastReviewedAt: '2024-08-20T09:30:00.000Z',
    });

    expect(payload.slug).toBe('terms-and-conditions');
    expect(payload.title).toBe('Terms and Conditions');
    expect(payload.heroTitle).toBe('Terms and Conditions');
    expect(payload.heroSubtitle).toBe('Detailed obligations for every workspace.');
    expect(payload.heroEyebrow).toBe('Legal');
    expect(payload.heroMeta).toBe('Updated quarterly');
    expect(payload.heroImageUrl).toBe('https://cdn.gigvora.com/trust/hero.png');
    expect(payload.heroImageAlt).toBe('Gigvora trust centre hero');
    expect(payload.ctaLabel).toBe('Read now');
    expect(payload.ctaUrl).toBe('https://gigvora.com/trust/terms');
    expect(payload.layout).toBe('longform');
    expect(payload.body).toBe('<h1>Terms</h1>');
    expect(payload.seoTitle).toBe('Gigvora Terms of Service');
    expect(payload.seoDescription).toBe('All policies that govern the Gigvora network.');
    expect(payload.seoKeywords).toEqual(['Gigvora', 'Terms']);
    expect(payload.featureHighlights).toEqual(['Trust architecture', 'Data residency']);
    expect(payload.allowedRoles).toEqual(['admin', 'user']);
    expect(payload.contactEmail).toBe('legal@gigvora.com');
    expect(payload.jurisdiction).toBe('United Kingdom');
    expect(payload.version).toBe('2.0.0');
    expect(payload.lastReviewedAt).toBeInstanceOf(Date);
    expect(payload.publishedAt).toBeInstanceOf(Date);
    expect(payload.status).toBe('published');
  });

  it('throws when the document lacks a usable slug source', () => {
    expect(() => buildPagePayload({})).toThrow('Site document must define a slug or title.');
  });
});
