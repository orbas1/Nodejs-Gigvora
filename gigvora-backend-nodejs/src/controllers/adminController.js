import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettingsService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
import { getGdprSettings, updateGdprSettings } from '../services/gdprSettingsService.js';
import { getSeoSettings, updateSeoSettings } from '../services/seoSettingsService.js';
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
  fetchGdprSettings,
  persistGdprSettings,
  fetchSeoSettings,
  persistSeoSettings,
  runtimeHealth,
};
