process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { jest } from '@jest/globals';

const adminDashboardModuleUrl = new URL('../src/services/adminDashboardService.js', import.meta.url);
const platformSettingsModuleUrl = new URL('../src/services/platformSettingsService.js', import.meta.url);
const platformSettingsWatchersModuleUrl = new URL('../src/services/platformSettingsWatchersService.js', import.meta.url);
const affiliateSettingsModuleUrl = new URL('../src/services/affiliateSettingsService.js', import.meta.url);
const systemSettingsModuleUrl = new URL('../src/services/systemSettingsService.js', import.meta.url);
const pageSettingsModuleUrl = new URL('../src/services/pageSettingsService.js', import.meta.url);
const gdprSettingsModuleUrl = new URL('../src/services/gdprSettingsService.js', import.meta.url);
const seoSettingsModuleUrl = new URL('../src/services/seoSettingsService.js', import.meta.url);
const runtimeObservabilityModuleUrl = new URL('../src/services/runtimeObservabilityService.js', import.meta.url);
const adminSanitizersModuleUrl = new URL('../src/utils/adminSanitizers.js', import.meta.url);

const getAdminDashboardSnapshot = jest.fn().mockResolvedValue({ metrics: [] });
const updateAdminOverview = jest.fn().mockResolvedValue({ saved: true });

const getPlatformSettings = jest.fn().mockResolvedValue({});
const updatePlatformSettings = jest.fn().mockResolvedValue({ persisted: true });
const getHomepageSettings = jest.fn().mockResolvedValue({});
const updateHomepageSettings = jest.fn().mockResolvedValue({ published: true });
const listPlatformSettingsAuditEvents = jest.fn().mockResolvedValue({ events: [], total: 0, limit: 20 });
const listPlatformSettingsWatchers = jest.fn().mockResolvedValue([{ id: 1 }]);
const createPlatformSettingsWatcher = jest.fn().mockResolvedValue({ id: 1, enabled: true });
const updatePlatformSettingsWatcher = jest.fn().mockResolvedValue({ id: 1, enabled: true });
const deletePlatformSettingsWatcher = jest.fn().mockResolvedValue({ deleted: true });

const getAffiliateSettings = jest.fn().mockResolvedValue({});
const updateAffiliateSettings = jest.fn().mockResolvedValue({ stored: true });

const getSystemSettings = jest.fn().mockResolvedValue({});
const updateSystemSettings = jest.fn().mockResolvedValue({ system: 'ok' });

const listPageSettings = jest.fn().mockResolvedValue({ items: [], meta: { total: 0, limit: 25, offset: 0 } });
const createPageSetting = jest.fn().mockResolvedValue({ id: 'page-1' });
const updatePageSetting = jest.fn().mockResolvedValue({ id: 'page-1', name: 'Updated' });
const deletePageSetting = jest.fn().mockResolvedValue({ id: 'page-1' });

const getGdprSettings = jest.fn().mockResolvedValue({});
const updateGdprSettings = jest.fn().mockResolvedValue({ updated: true });

const getSeoSettings = jest.fn().mockResolvedValue({});
const updateSeoSettings = jest.fn().mockResolvedValue({ seo: true });

const getRuntimeOperationalSnapshot = jest.fn().mockResolvedValue({ status: 'healthy' });

const sanitizeAdminDashboardFilters = jest.fn().mockReturnValue({ lookbackDays: 45, eventWindowDays: 7 });
const sanitizePlatformSettingsAuditFilters = jest.fn().mockReturnValue({});
const sanitizePlatformSettingsInput = jest.fn().mockImplementation((payload) => ({ ...payload, sanitized: true }));
const sanitizeHomepageSettingsInput = jest.fn().mockImplementation((payload) => ({ ...payload, normalized: true }));
const sanitizeAffiliateSettingsInput = jest.fn().mockImplementation((payload) => ({ ...payload, coerced: true }));

jest.unstable_mockModule(adminDashboardModuleUrl.pathname, () => ({
  getAdminDashboardSnapshot,
  updateAdminOverview,
}));

jest.unstable_mockModule(platformSettingsModuleUrl.pathname, () => ({
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
  listPlatformSettingsAuditEvents,
}));

jest.unstable_mockModule(platformSettingsWatchersModuleUrl.pathname, () => ({
  listPlatformSettingsWatchers,
  createPlatformSettingsWatcher,
  updatePlatformSettingsWatcher,
  deletePlatformSettingsWatcher,
}));

jest.unstable_mockModule(affiliateSettingsModuleUrl.pathname, () => ({
  getAffiliateSettings,
  updateAffiliateSettings,
}));

jest.unstable_mockModule(systemSettingsModuleUrl.pathname, () => ({
  getSystemSettings,
  updateSystemSettings,
}));

jest.unstable_mockModule(pageSettingsModuleUrl.pathname, () => ({
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
}));

jest.unstable_mockModule(gdprSettingsModuleUrl.pathname, () => ({
  getGdprSettings,
  updateGdprSettings,
}));

jest.unstable_mockModule(seoSettingsModuleUrl.pathname, () => ({
  getSeoSettings,
  updateSeoSettings,
}));

jest.unstable_mockModule(runtimeObservabilityModuleUrl.pathname, () => ({
  getRuntimeOperationalSnapshot,
}));

jest.unstable_mockModule(adminSanitizersModuleUrl.pathname, () => ({
  sanitizeAdminDashboardFilters,
  sanitizePlatformSettingsAuditFilters,
  sanitizePlatformSettingsInput,
  sanitizeHomepageSettingsInput,
  sanitizeAffiliateSettingsInput,
}));

let controller;
let dashboard;
let listPlatformSettingsAuditTrail;
let persistPlatformSettings;
let fetchPageSettings;
let createAdminPageSetting;
let persistPageSetting;
let removePageSetting;
let persistGdprSettings;
let persistSeoSettings;
let persistAdminOverview;
let listPlatformSettingsWatchersController;
let createPlatformSettingsWatcherController;
let updatePlatformSettingsWatcherController;
let removePlatformSettingsWatcher;

beforeAll(async () => {
  controller = await import('../src/controllers/adminController.js');
  ({
    dashboard,
    listPlatformSettingsAuditTrail,
    persistPlatformSettings,
    fetchPageSettings,
    createAdminPageSetting,
    persistPageSetting,
    removePageSetting,
    persistGdprSettings,
    persistSeoSettings,
    persistAdminOverview,
    listPlatformSettingsWatchersController,
    createPlatformSettingsWatcherController,
    updatePlatformSettingsWatcherController,
    removePlatformSettingsWatcher,
  } = controller);
});

beforeEach(() => {
  jest.clearAllMocks();
});

function createResponse() {
  const res = {};
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload) => {
    res.jsonPayload = payload;
    return res;
  });
  res.send = jest.fn().mockImplementation((payload) => {
    res.sent = payload;
    return res;
  });
  return res;
}

describe('adminController.dashboard', () => {
  it('sanitises filters and forwards admin user id when present', async () => {
    const req = { query: { lookbackDays: '60' }, user: { id: '42' } };
    const res = createResponse();

    await dashboard(req, res);

    expect(sanitizeAdminDashboardFilters).toHaveBeenCalledWith(req.query);
    expect(getAdminDashboardSnapshot).toHaveBeenCalledWith({ lookbackDays: 45, eventWindowDays: 7, adminUserId: 42 });
    expect(res.json).toHaveBeenCalledWith({ metrics: [] });
  });

  it('omits admin user id when the actor cannot be resolved', async () => {
    sanitizeAdminDashboardFilters.mockReturnValueOnce({ lookbackDays: 30 });

    const req = { query: {}, user: { id: 'abc' } };
    const res = createResponse();

    await dashboard(req, res);

    expect(getAdminDashboardSnapshot).toHaveBeenCalledWith({ lookbackDays: 30 });
  });
});

describe('adminController.listPlatformSettingsAuditTrail', () => {
  it('sanitises filters before querying audit events', async () => {
    sanitizePlatformSettingsAuditFilters.mockReturnValueOnce({ limit: 5, actorEmail: 'ops' });
    listPlatformSettingsAuditEvents.mockResolvedValueOnce({ events: [], total: 3, limit: 5 });

    const req = { query: { limit: '5', actorEmail: 'ops' } };
    const res = createResponse();

    await listPlatformSettingsAuditTrail(req, res);

    expect(sanitizePlatformSettingsAuditFilters).toHaveBeenCalledWith(req.query);
    expect(listPlatformSettingsAuditEvents).toHaveBeenCalledWith({ limit: 5, actorEmail: 'ops' });
    expect(res.json).toHaveBeenCalledWith({ events: [], total: 3, limit: 5 });
  });
});

describe('adminController.platformSettingsWatcher management', () => {
  it('lists watchers with includeDisabled flag', async () => {
    listPlatformSettingsWatchers.mockResolvedValueOnce([{ id: 3, enabled: false }]);
    const req = { query: { includeDisabled: true } };
    const res = createResponse();

    await listPlatformSettingsWatchersController(req, res);

    expect(listPlatformSettingsWatchers).toHaveBeenCalledWith({ includeDisabled: true });
    expect(res.json).toHaveBeenCalledWith({ watchers: [{ id: 3, enabled: false }] });
  });

  it('creates watchers with actor metadata', async () => {
    const req = { body: { userId: 10 }, user: { email: 'admin@gigvora.com', id: 5 } };
    const res = createResponse();

    await createPlatformSettingsWatcherController(req, res);

    expect(createPlatformSettingsWatcher).toHaveBeenCalledWith({ userId: 10 }, expect.objectContaining({ actor: expect.any(Object) }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, enabled: true });
  });

  it('updates watchers and returns payload', async () => {
    const req = { params: { watcherId: '7' }, body: { digestFrequency: 'weekly' }, user: { email: 'ops@gigvora.com' } };
    const res = createResponse();

    await updatePlatformSettingsWatcherController(req, res);

    expect(updatePlatformSettingsWatcher).toHaveBeenCalledWith('7', { digestFrequency: 'weekly' }, expect.objectContaining({ actor: expect.any(Object) }));
    expect(res.json).toHaveBeenCalledWith({ id: 1, enabled: true });
  });

  it('removes watchers via service', async () => {
    const req = { params: { watcherId: '9' }, user: { email: 'ops@gigvora.com' } };
    const res = createResponse();

    await removePlatformSettingsWatcher(req, res);

    expect(deletePlatformSettingsWatcher).toHaveBeenCalledWith('9', expect.objectContaining({ actor: expect.any(Object) }));
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe('adminController.persistPlatformSettings', () => {
  it('uses sanitized payload before updating platform settings', async () => {
    const req = { body: { raw: true } };
    const res = createResponse();

    await persistPlatformSettings(req, res);

    expect(sanitizePlatformSettingsInput).toHaveBeenCalledWith({ raw: true });
    expect(updatePlatformSettings).toHaveBeenCalledWith({ raw: true, sanitized: true });
    expect(res.json).toHaveBeenCalledWith({ persisted: true });
  });
});

describe('adminController.fetchPageSettings', () => {
  it('forwards pagination options to the page settings service', async () => {
    const req = { query: { limit: 10, offset: 30 } };
    const res = createResponse();

    await fetchPageSettings(req, res);

    expect(listPageSettings).toHaveBeenCalledWith({ limit: 10, offset: 30 });
    expect(res.json).toHaveBeenCalledWith({ items: [], meta: { total: 0, limit: 25, offset: 0 } });
  });
});

describe('adminController.createAdminPageSetting', () => {
  it('attaches the resolved actor id when creating a page configuration', async () => {
    const req = { body: { name: 'Homepage' }, user: { id: '55' } };
    const res = createResponse();

    await createAdminPageSetting(req, res);

    expect(createPageSetting).toHaveBeenCalledWith({ name: 'Homepage' }, { actorId: 55 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'page-1' });
  });
});

describe('adminController.persistPageSetting', () => {
  it('updates the page using the page identifier and actor context', async () => {
    const req = { params: { pageId: 'landing' }, body: { title: 'Landing' }, user: { userId: '88' } };
    const res = createResponse();

    await persistPageSetting(req, res);

    expect(updatePageSetting).toHaveBeenCalledWith('landing', { title: 'Landing' }, { actorId: 88 });
    expect(res.json).toHaveBeenCalledWith({ id: 'page-1', name: 'Updated' });
  });
});

describe('adminController.removePageSetting', () => {
  it('removes the page and responds with no content', async () => {
    const req = { params: { pageId: 'landing' } };
    const res = createResponse();

    await removePageSetting(req, res);

    expect(deletePageSetting).toHaveBeenCalledWith('landing');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});

describe('adminController.persistGdprSettings', () => {
  it('returns the updated GDPR settings snapshot', async () => {
    const req = { body: { dpo: { name: 'Alex' } } };
    const res = createResponse();

    await persistGdprSettings(req, res);

    expect(updateGdprSettings).toHaveBeenCalledWith({ dpo: { name: 'Alex' } });
    expect(res.json).toHaveBeenCalledWith({ updated: true });
  });
});

describe('adminController.persistSeoSettings', () => {
  it('persists SEO settings changes', async () => {
    const req = { body: { title: 'Gigvora' } };
    const res = createResponse();

    await persistSeoSettings(req, res);

    expect(updateSeoSettings).toHaveBeenCalledWith({ title: 'Gigvora' });
    expect(res.json).toHaveBeenCalledWith({ seo: true });
  });
});

describe('adminController.persistAdminOverview', () => {
  it('falls back to null when there is no authenticated admin actor', async () => {
    const req = { body: { notes: 'Refreshed' } };
    const res = createResponse();

    await persistAdminOverview(req, res);

    expect(updateAdminOverview).toHaveBeenCalledWith(null, { notes: 'Refreshed' });
    expect(res.json).toHaveBeenCalledWith({ saved: true });
  });
});
