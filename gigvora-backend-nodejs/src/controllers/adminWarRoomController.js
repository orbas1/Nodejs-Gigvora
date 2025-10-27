import { getPlatformPerformanceWarRoomSnapshot } from '../services/platformPerformanceWarRoomService.js';
import { getSecurityPrivacyFabricSnapshot } from '../services/securityPrivacyFabricService.js';

function parsePositiveInteger(value, fallback = undefined) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

export async function platformPerformance(req, res) {
  const { windowMinutes } = req.query ?? {};
  const snapshot = await getPlatformPerformanceWarRoomSnapshot({
    windowMinutes: parsePositiveInteger(windowMinutes),
  });
  res.json(snapshot);
}

export async function securityFabric(req, res) {
  const { limit } = req.query ?? {};
  const snapshot = await getSecurityPrivacyFabricSnapshot({
    limit: parsePositiveInteger(limit, 12),
  });
  res.json(snapshot);
}

export default {
  platformPerformance,
  securityFabric,
};
