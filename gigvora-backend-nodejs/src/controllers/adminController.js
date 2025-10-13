import { getAdminDashboardSnapshot } from '../services/adminDashboardService.js';

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

export default {
  dashboard,
};
