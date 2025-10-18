import { getAdminDashboardSnapshot, updateAdminOverview } from '../services/adminDashboardService.js';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettingsService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
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
    adminUserId: req.user?.id ?? null,
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

export async function runtimeHealth(req, res) {
  const snapshot = await getRuntimeOperationalSnapshot();
  res.json(snapshot);
}

export async function persistAdminOverview(req, res) {
  const adminId = req.user?.id ?? null;
  const overview = await updateAdminOverview(adminId, req.body ?? {});
  res.json(overview);
}

export default {
  dashboard,
  fetchPlatformSettings,
  persistPlatformSettings,
  fetchAffiliateSettings,
  persistAffiliateSettings,
  runtimeHealth,
  persistAdminOverview,
};
