import {
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  submitEmployerRequest,
  recordLaunchpadPlacement,
  linkLaunchpadOpportunity,
  listLaunchpadApplications,
  getLaunchpadDashboard,
  getLaunchpadWorkflow,
} from '../services/launchpadService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalNumber(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label} must be a valid number.`);
  }
  return parsed;
}

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function ensureLaunchpadAccess(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  const allowed = ['admin', 'launchpad.manage.any', 'talent.manage.any', 'employer', 'recruiter'];
  if (!allowed.some((permission) => permissions.has(permission))) {
    throw new AuthorizationError('You do not have permission to manage launchpad applications.');
  }

  return actorId;
}

export async function createApplication(req, res) {
  const payload = ensureObjectPayload(req.body, 'launchpad application');
  const result = await applyToLaunchpad(payload);
  res.status(201).json(result);
}

export async function updateApplication(req, res) {
  const applicationId = parsePositiveInteger(req.params?.applicationId, 'applicationId');
  ensureLaunchpadAccess(req);
  const payload = ensureObjectPayload(req.body, 'launchpad application update');
  const result = await updateLaunchpadApplicationStatus(applicationId, payload);
  res.json(result);
}

export async function createEmployerRequest(req, res) {
  const payload = ensureObjectPayload(req.body, 'employer request');
  const actorId = ensureLaunchpadAccess(req);
  const result = await submitEmployerRequest(payload, { actorId });
  res.status(201).json(result);
}

export async function createPlacement(req, res) {
  const payload = ensureObjectPayload(req.body, 'launchpad placement');
  const actorId = ensureLaunchpadAccess(req);
  const result = await recordLaunchpadPlacement(payload, { actorId });
  res.status(201).json(result);
}

export async function createOpportunityLink(req, res) {
  const payload = ensureObjectPayload(req.body, 'opportunity link');
  const actorId = ensureLaunchpadAccess(req);
  const result = await linkLaunchpadOpportunity(payload, { actorId });
  res.status(201).json(result);
}

export async function listApplications(req, res) {
  const {
    launchpadId,
    status,
    statuses,
    search,
    page,
    pageSize,
    minScore,
    maxScore,
    sort,
    includeMatches,
  } = req.query ?? {};

  const normalizedLaunchpadId = launchpadId ? parsePositiveInteger(launchpadId, 'launchpadId') : null;
  const normalizedStatuses = statuses ?? status ?? undefined;
  ensureLaunchpadAccess(req);
  const result = await listLaunchpadApplications({
    launchpadId: normalizedLaunchpadId,
    statuses: normalizedStatuses,
    search,
    page: page ? parsePositiveInteger(page, 'page') : undefined,
    pageSize: pageSize ? Math.min(parsePositiveInteger(pageSize, 'pageSize'), 100) : undefined,
    minScore: parseOptionalNumber(minScore, 'minScore'),
    maxScore: parseOptionalNumber(maxScore, 'maxScore'),
    sort,
    includeMatches:
      includeMatches == null ? true : includeMatches === true || `${includeMatches}`.toLowerCase() === 'true',
  });

  res.json(result);
}

export async function dashboard(req, res) {
  const { launchpadId, lookbackDays } = req.query ?? {};
  ensureLaunchpadAccess(req);
  const result = await getLaunchpadDashboard(launchpadId ? parsePositiveInteger(launchpadId, 'launchpadId') : null, {
    lookbackDays: Math.min(parsePositiveInteger(lookbackDays ?? 60, 'lookbackDays'), 365),
  });
  res.json(result);
}

export async function workflow(req, res) {
  const { launchpadId, lookbackDays } = req.query ?? {};
  ensureLaunchpadAccess(req);
  const result = await getLaunchpadWorkflow(launchpadId ? parsePositiveInteger(launchpadId, 'launchpadId') : null, {
    lookbackDays: Math.min(parsePositiveInteger(lookbackDays ?? 45, 'lookbackDays'), 365),
  });
  res.json(result);
}

export default {
  createApplication,
  updateApplication,
  createEmployerRequest,
  createPlacement,
  createOpportunityLink,
  listApplications,
  dashboard,
  workflow,
};
