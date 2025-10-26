import {
  getSiteManagementOverview,
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
} from '../src/services/siteManagementService.js';
import { sequelize } from '../src/models/index.js';

describe('siteManagementService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  test('returns defaults when no data exists', async () => {
    const overview = await getSiteManagementOverview();
    expect(overview.settings.siteName).toBeTruthy();
    expect(Array.isArray(overview.pages)).toBe(true);
    expect(overview.stats.published).toBe(0);
    expect(overview.stats.draft).toBe(0);
  });

  test('saves settings and reflects in overview', async () => {
    await saveSiteSettings({
      siteName: 'Gigvora Test',
      hero: { title: 'Operators unite' },
      marketing: {
        announcement: { title: '  ', description: ' New ship ', cta: { label: ' Learn ', href: ' /updates ' } },
        trustBadges: [{ label: '  ', description: '' }],
        productTour: { steps: [{ id: 'custom', title: '  ', summary: 'Summary' }] },
        pricing: { plans: [{ name: '  ', pricing: { monthly: 0 } }] },
      },
    });
    const overview = await getSiteManagementOverview();
    expect(overview.settings.siteName).toBe('Gigvora Test');
    expect(overview.settings.hero.title).toBe('Operators unite');
    expect(overview.settings.marketing.trustBadges.length).toBeGreaterThan(0);
    expect(overview.settings.marketing.productTour.steps.length).toBeGreaterThan(0);
    expect(overview.settings.marketing.pricing.plans[0].name).toBeTruthy();
  });

  test('creates, updates, and deletes navigation links', async () => {
    const link = await createNavigation({ label: 'Opportunities', url: 'https://gigvora.com/opportunities' });
    expect(link.label).toBe('Opportunities');
    const updated = await updateNavigation(link.id, { description: 'Featured pods', orderIndex: 2 });
    expect(updated.description).toBe('Featured pods');
    expect(updated.orderIndex).toBe(2);
    await deleteNavigation(link.id);
    const overview = await getSiteManagementOverview();
    expect(Object.values(overview.navigation).flat()).toHaveLength(0);
  });

  test('creates, updates, and deletes pages', async () => {
    const page = await createSitePage({
      title: 'Operators',
      slug: 'operators',
      status: 'published',
      summary: 'High-trust teams',
      heroEyebrow: 'Legal',
      heroTitle: 'Operators legal overview',
      heroSubtitle: 'How we govern operators',
      heroMeta: 'Applies globally',
      contactEmail: 'legal@gigvora.com',
      contactPhone: '+44 20 0000 0000',
      jurisdiction: 'United Kingdom',
      version: '1.2.0',
      lastReviewedAt: '2024-05-01T00:00:00.000Z',
    });
    expect(page.status).toBe('published');
    expect(page.publishedAt).toBeTruthy();
    expect(page.heroEyebrow).toBe('Legal');
    expect(page.heroMeta).toBe('Applies globally');
    expect(page.contactEmail).toBe('legal@gigvora.com');
    expect(page.version).toBe('1.2.0');
    expect(new Date(page.lastReviewedAt).getUTCFullYear()).toBe(2024);

    const updated = await updateSitePageById(page.id, {
      status: 'draft',
      heroTitle: 'New hero',
      heroEyebrow: 'Policy',
      version: '1.3.0',
    });
    expect(updated.status).toBe('draft');
    expect(updated.heroTitle).toBe('New hero');
    expect(updated.heroEyebrow).toBe('Policy');
    expect(updated.version).toBe('1.3.0');

    await deleteSitePageById(page.id);
    const overview = await getSiteManagementOverview();
    expect(overview.pages).toHaveLength(0);
  });

  test('returns navigation links filtered by menu key', async () => {
    await createNavigation({ label: 'Primary', url: 'https://gigvora.com/primary', menuKey: 'primary' });
    await createNavigation({ label: 'Footer', url: 'https://gigvora.com/footer', menuKey: 'footer' });

    const allLinks = await getSiteNavigation();
    expect(allLinks).toHaveLength(2);

    const footerLinks = await getSiteNavigation({ menuKey: 'footer' });
    expect(footerLinks).toHaveLength(1);
    expect(footerLinks[0].label).toBe('Footer');
  });

  test('lists only published pages by default and fetches individual page', async () => {
    const published = await createSitePage({
      title: 'Live policy',
      slug: 'live-policy',
      status: 'published',
      summary: 'Live summary',
      body: '## Heading\nContent',
    });
    await createSitePage({
      title: 'Draft policy',
      slug: 'draft-policy',
      status: 'draft',
      summary: 'Draft summary',
    });

    const pages = await listSitePages();
    expect(pages).toHaveLength(1);
    expect(pages[0].slug).toBe('live-policy');

    const page = await getPublishedSitePage('live-policy');
    expect(page.id).toBe(published.id);
    expect(page.body).toContain('Heading');
  });
});
