import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettingsService.js';

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

export default {
  dashboard,
  fetchPlatformSettings,
  persistPlatformSettings,
};
