import {
  getSecurityTelemetry,
  acknowledgeSecurityAlert,
  suppressSecurityAlert,
  queueThreatSweep,
} from '../services/securityOperationsService.js';
import { AuthorizationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function hasSecurityRole(req) {
  const roles = new Set();
  const roleCandidates = [];

  if (Array.isArray(req.user?.roles)) {
    roleCandidates.push(...req.user.roles);
  }
  if (req.user?.role) {
    roleCandidates.push(req.user.role);
  }
  if (req.user?.type) {
    roleCandidates.push(req.user.type);
  }

  const headerRoles = req.headers?.['x-roles'];
  if (headerRoles) {
    const parsed = Array.isArray(headerRoles) ? headerRoles : `${headerRoles}`.split(/[\s,]+/);
    parsed.filter(Boolean).forEach((value) => roleCandidates.push(value));
  }

  roleCandidates
    .map((value) => `${value}`.trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => roles.add(value));

  return (
    roles.has('admin') ||
    roles.has('security') ||
    roles.has('security-ops') ||
    roles.has('platform-security') ||
    roles.has('trust') ||
    roles.has('ops')
  );
}

function hasSecurityPermission(req) {
  const permissions = new Set(
    resolveRequestPermissions(req).map((permission) => `${permission}`.trim().toLowerCase()),
  );

  const capabilityCandidates = [];
  if (Array.isArray(req.user?.capabilities)) {
    capabilityCandidates.push(...req.user.capabilities);
  }
  if (Array.isArray(req.user?.memberships)) {
    capabilityCandidates.push(...req.user.memberships);
  }

  capabilityCandidates
    .map((value) => `${value}`.trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => permissions.add(value));

  const accepted = [
    'security:operations',
    'security.operations',
    'security_admin',
    'platform-security',
    'trust-ops',
    'compliance',
  ];

  return accepted.some((value) => permissions.has(value));
}

function ensureSecurityAccess(req) {
  if (hasSecurityRole(req) || hasSecurityPermission(req)) {
    return;
  }
  throw new AuthorizationError('Security operations access required.');
}

export async function telemetry(req, res) {
  ensureSecurityAccess(req);
  const includeResolvedAlerts = Boolean(req.query?.includeResolvedAlerts ?? req.query?.includeResolved ?? false);
  const telemetryPayload = await getSecurityTelemetry({ includeResolvedAlerts });
  res.json({ telemetry: telemetryPayload });
}

export async function acknowledgeAlert(req, res) {
  ensureSecurityAccess(req);
  const alertId = req.params?.alertId;
  const note = req.body?.note ?? null;
  const actorId = resolveRequestUserId(req);
  const alert = await acknowledgeSecurityAlert(alertId, { actorId, note });
  res.json({ alert });
}

export async function suppressAlert(req, res) {
  ensureSecurityAccess(req);
  const alertId = req.params?.alertId;
  const note = req.body?.note ?? null;
  const actorId = resolveRequestUserId(req);
  const alert = await suppressSecurityAlert(alertId, { actorId, note });
  res.json({ alert });
}

export async function triggerThreatSweep(req, res) {
  ensureSecurityAccess(req);
  const actorId = resolveRequestUserId(req);
  const sweep = await queueThreatSweep({
    requestedBy: actorId ?? null,
    sweepType: req.body?.sweepType ?? undefined,
    reason: req.body?.reason ?? undefined,
    scope: req.body?.scope ?? undefined,
    metadata: req.body?.metadata ?? undefined,
  });
  res.status(202).json({ sweep });
}

export default {
  telemetry,
  acknowledgeAlert,
  suppressAlert,
  triggerThreatSweep,
};
