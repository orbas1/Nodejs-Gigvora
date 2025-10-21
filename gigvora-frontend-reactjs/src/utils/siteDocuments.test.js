import { describe, expect, it } from 'vitest';
import { buildHeroConfig, normaliseDocumentMetadata, parseDocumentSections } from './siteDocuments.js';

describe('parseDocumentSections', () => {
  it('splits markdown headings into section objects', () => {
    const body = '## One\nParagraph one.\n\n- Item A\n- Item B\n\n## Two\nAnother paragraph.';
    const sections = parseDocumentSections(body);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('One');
    expect(sections[0].blocks[0]).toEqual({ type: 'paragraph', text: 'Paragraph one.' });
    expect(sections[0].blocks[1]).toEqual({ type: 'list', items: ['Item A', 'Item B'] });
    expect(sections[1].blocks[0].text).toBe('Another paragraph.');
  });

  it('falls back to provided sections when body is empty', () => {
    const fallback = [
      {
        id: 'intro',
        title: 'Intro',
        blocks: [{ type: 'paragraph', text: 'Fallback content.' }],
      },
    ];
    const sections = parseDocumentSections('', fallback);
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('intro');
    expect(sections[0].blocks[0].text).toBe('Fallback content.');
  });
});

describe('normaliseDocumentMetadata', () => {
  it('merges metadata from live page and fallback values', () => {
    const fallback = {
      slug: 'terms',
      version: '1.0.0',
      contactEmail: 'legal@example.com',
      lastUpdated: '2024-08-10',
      hero: {
        title: 'Fallback title',
        description: 'Fallback description',
      },
    };
    const page = {
      slug: 'terms',
      version: '2.0.0',
      contactPhone: '+44 20 0000 0000',
      updatedAt: '2024-08-15T10:00:00Z',
      heroTitle: 'Live title',
    };
    const metadata = normaliseDocumentMetadata(page, fallback);
    expect(metadata.version).toBe('2.0.0');
    expect(metadata.contactEmail).toBe('legal@example.com');
    expect(metadata.contactPhone).toBe('+44 20 0000 0000');
    expect(metadata.lastUpdated).toBeInstanceOf(Date);
    expect(metadata.heroTitle).toBe('Live title');
  });
});

describe('buildHeroConfig', () => {
  it('builds hero configuration with sensible fallbacks', () => {
    const hero = buildHeroConfig(
      { heroSubtitle: 'Live subtitle', ctaLabel: 'Contact us', ctaUrl: '/contact' },
      { hero: { title: 'Fallback title', description: 'Fallback description' } },
    );

    expect(hero.title).toBe('Fallback title');
    expect(hero.description).toBe('Live subtitle');
    expect(hero.ctaLabel).toBe('Contact us');
    expect(hero.ctaUrl).toBe('/contact');
  });
});
