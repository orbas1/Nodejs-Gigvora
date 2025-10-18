import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
} from '../services/platformSettingsService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
import { getSystemSettings, updateSystemSettings } from '../services/systemSettingsService.js';
import {
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
} from '../services/pageSettingsService.js';
import { getGdprSettings, updateGdprSettings } from '../services/gdprSettingsService.js';
import { getSeoSettings, updateSeoSettings } from '../services/seoSettingsService.js';
import { getRuntimeOperationalSnapshot } from '../services/runtimeObservabilityService.js';
import {
  sanitizeAdminDashboardFilters,
  sanitizePlatformSettingsInput,
  sanitizeHomepageSettingsInput,
  sanitizeAffiliateSettingsInput,
} from '../utils/adminSanitizers.js';

export async function dashboard(req, res) {
  const filters = sanitizeAdminDashboardFilters(req.query ?? {});
  const snapshot = await getAdminDashboardSnapshot(filters);
  res.json(snapshot);
}

export async function fetchPlatformSettings(req, res) {
  const settings = await getPlatformSettings();
  res.json(settings);
}

export async function persistPlatformSettings(req, res) {
  const payload = sanitizePlatformSettingsInput(req.body ?? {});
  const settings = await updatePlatformSettings(payload);
  res.json(settings);
}

export async function fetchHomepageSettings(req, res) {
  const settings = await getHomepageSettings();
  res.json(settings);
}

export async function persistHomepageSettings(req, res) {
  const payload = sanitizeHomepageSettingsInput(req.body ?? {});
  const settings = await updateHomepageSettings(payload);
  res.json(settings);
}

export async function fetchAffiliateSettings(req, res) {
  const settings = await getAffiliateSettings();
  res.json(settings);
}

export async function persistAffiliateSettings(req, res) {
  const payload = sanitizeAffiliateSettingsInput(req.body ?? {});
  const settings = await updateAffiliateSettings(payload);
  res.json(settings);
}

export async function fetchPageSettings(req, res) {
  const { limit, offset } = req.query ?? {};
  const result = await listPageSettings({ limit, offset });
  res.json(result);
}

export async function createAdminPageSetting(req, res) {
  const record = await createPageSetting(req.body ?? {}, { actorId: req.user?.id });
  res.status(201).json(record);
}

export async function persistPageSetting(req, res) {
  const { pageId } = req.params;
  const record = await updatePageSetting(pageId, req.body ?? {}, { actorId: req.user?.id });
  res.json(record);
}

export async function removePageSetting(req, res) {
  const { pageId } = req.params;
  await deletePageSetting(pageId);
  res.status(204).send();
export async function fetchGdprSettings(req, res) {
  const settings = await getGdprSettings();
  res.json(settings);
}

export async function persistGdprSettings(req, res) {
  const settings = await updateGdprSettings(req.body ?? {});
export async function fetchSeoSettings(req, res) {
  const settings = await getSeoSettings();
  res.json(settings);
}

export async function persistSeoSettings(req, res) {
  const settings = await updateSeoSettings(req.body ?? {});
  res.json(settings);
}

export async function fetchSystemSettings(req, res) {
  const settings = await getSystemSettings();
  res.json(settings);
}

export async function persistSystemSettings(req, res) {
  const settings = await updateSystemSettings(req.body ?? {});
  res.json(settings);
}

export async function runtimeHealth(req, res) {
  const snapshot = await getRuntimeOperationalSnapshot();
  res.json(snapshot);
}

export default {
  dashboard,
  fetchPlatformSettings,
  persistPlatformSettings,
  fetchHomepageSettings,
  persistHomepageSettings,
  fetchAffiliateSettings,
  persistAffiliateSettings,
  fetchSystemSettings,
  persistSystemSettings,
  fetchPageSettings,
  createAdminPageSetting,
  persistPageSetting,
  removePageSetting,
  fetchGdprSettings,
  persistGdprSettings,
  fetchSeoSettings,
  persistSeoSettings,
  runtimeHealth,
};
