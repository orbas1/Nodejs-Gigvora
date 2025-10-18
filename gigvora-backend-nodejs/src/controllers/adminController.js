import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
} from '../services/platformSettingsService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
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
  runtimeHealth,
};
