import request from 'supertest';
import { app } from '../src/app.js';
import { SitePage, sequelize } from '../src/models/index.js';

describe('site routes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  test('GET /api/site/pages returns only published pages', async () => {
    await SitePage.create({
      title: 'Published policy',
      slug: 'published-policy',
      status: 'published',
      summary: 'Live summary',
      body: '## Heading\nContent',
    });
    await SitePage.create({
      title: 'Draft policy',
      slug: 'draft-policy',
      status: 'draft',
      summary: 'Draft summary',
    });

    const response = await request(app).get('/api/site/pages');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.pages)).toBe(true);
    expect(response.body.pages).toHaveLength(1);
    expect(response.body.pages[0].slug).toBe('published-policy');
  });

  test('GET /api/site/pages/:slug returns published page detail', async () => {
    const page = await SitePage.create({
      title: 'Community Guidelines',
      slug: 'community-guidelines',
      status: 'published',
      summary: 'Community expectations',
      body: '## Welcome\nBe kind.',
      heroEyebrow: 'Community',
      heroTitle: 'Community Guidelines',
      heroSubtitle: 'How to behave',
      contactEmail: 'community@gigvora.com',
      version: '3.0.0',
    });

    const response = await request(app).get(`/api/site/pages/${page.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.page.slug).toBe(page.slug);
    expect(response.body.page.body).toContain('Welcome');
    expect(response.body.page.heroEyebrow).toBe('Community');
    expect(response.body.page.version).toBe('3.0.0');
  });

  test('GET /api/site/pages respects limit parameter', async () => {
    await SitePage.bulkCreate(
      Array.from({ length: 3 }).map((_, index) => ({
        title: `Policy ${index}`,
        slug: `policy-${index}`,
        status: 'published',
        summary: 'Summary',
        body: '## Heading\nCopy',
      })),
    );

    const response = await request(app).get('/api/site/pages').query({ limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.pages).toHaveLength(2);
  });
});
