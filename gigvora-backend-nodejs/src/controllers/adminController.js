import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettingsService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
import { getSystemSettings, updateSystemSettings } from '../services/systemSettingsService.js';
import { getRuntimeOperationalSnapshot } from '../services/runtimeObservabilityService.js';

function parseInteger(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function dashboard(req, res) {
  const { lookbackDays, eventWindowDays } = req.query ?? {};
  const snapshot = await getAdminDashboardSnapshot({
    lookbackDays: parseInteger(lookbackDays, undefined),
    eventWindowDays: parseInteger(eventWindowDays, undefined),
  });
  res.json(snapshot);
}

export async function fetchPlatformSettings(req, res) {
  const settings = await getPlatformSettings();
  res.json(settings);
}

export async function persistPlatformSettings(req, res) {
  const settings = await updatePlatformSettings(req.body ?? {});
  res.json(settings);
}

export async function fetchAffiliateSettings(req, res) {
  const settings = await getAffiliateSettings();
  res.json(settings);
}

export async function persistAffiliateSettings(req, res) {
  const settings = await updateAffiliateSettings(req.body ?? {});
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
  fetchAffiliateSettings,
  persistAffiliateSettings,
  fetchSystemSettings,
  persistSystemSettings,
  runtimeHealth,
};
