import { sampleLiveServiceTelemetry } from '../services/liveServiceTelemetryService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function ensureTelemetryAccess(req) {
  const actorId = resolveRequestUserId(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('ops') ||
    permissions.has('sre') ||
    permissions.has('telemetry.ingest')
  ) {
    return actorId;
  }

  const internalToken = req.headers?.['x-internal-token'];
  if (internalToken && process.env.LIVE_TELEMETRY_TOKEN && internalToken === process.env.LIVE_TELEMETRY_TOKEN) {
    return actorId ?? 0;
  }

  throw new AuthorizationError('Telemetry access denied.');
}

function parseWindowMinutes(value) {
  if (value == null || value === '') {
    return 15;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('windowMinutes must be a positive integer.');
  }
  return Math.min(parsed, 240);
}

function parseBoolean(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalised)) {
    return false;
  }
  throw new ValidationError('forceRefresh must be true or false.');
}

export async function getLiveServiceTelemetry(req, res) {
  ensureTelemetryAccess(req);
  const { windowMinutes, forceRefresh } = req.query ?? {};
  const telemetry = await sampleLiveServiceTelemetry({
    windowMinutes: parseWindowMinutes(windowMinutes),
    forceRefresh: parseBoolean(forceRefresh),
  });
  res.json({ telemetry });
}

export default {
  getLiveServiceTelemetry,
};
