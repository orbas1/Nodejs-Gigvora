import {
  getSiteManagementOverview,
  saveSiteSettings,
  createNavigation,
  updateNavigation,
  deleteNavigation,
  createSitePage,
  updateSitePageById,
  deleteSitePageById,
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
    await saveSiteSettings({ siteName: 'Gigvora Test', hero: { title: 'Operators unite' } });
    const overview = await getSiteManagementOverview();
    expect(overview.settings.siteName).toBe('Gigvora Test');
    expect(overview.settings.hero.title).toBe('Operators unite');
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
    });
    expect(page.status).toBe('published');
    expect(page.publishedAt).toBeTruthy();

    const updated = await updateSitePageById(page.id, { status: 'draft', heroTitle: 'New hero' });
    expect(updated.status).toBe('draft');
    expect(updated.heroTitle).toBe('New hero');

    await deleteSitePageById(page.id);
    const overview = await getSiteManagementOverview();
    expect(overview.pages).toHaveLength(0);
  });
});
