import {
  getFreelancerDisputeDashboard,
  openFreelancerDispute,
  getFreelancerDisputeDetail,
  appendFreelancerDisputeEvent,
} from '../services/freelancerDisputeService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function parseBoolean(value, fieldName) {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
    return false;
  }
  throw new ValidationError(`${fieldName} must be a boolean value.`);
}

function normaliseRoleHeader(headerValue) {
  if (!headerValue) {
    return [];
  }
  if (Array.isArray(headerValue)) {
    return headerValue
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof headerValue === 'string') {
    return headerValue
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function resolveActorContext(req, fallbackId) {
  const headers = req.headers ?? {};
  const roles = normaliseRoleHeader(headers['x-roles'] ?? headers['x-role']);
  const actorIdFromHeader = parsePositiveInteger(headers['x-user-id'], 'actorId');
  const actorId = actorIdFromHeader ?? parsePositiveInteger(req.query?.actorId, 'actorId') ?? fallbackId;
  return { actorId, roles };
}

export async function listDisputes(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId ?? req.query?.freelancerId ?? req.query?.actorId, 'freelancerId');
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }

  const { actorId, roles } = resolveActorContext(req, freelancerId);

  const dashboard = await getFreelancerDisputeDashboard(freelancerId, {
    stage: req.query?.stage,
    status: req.query?.status,
    includeClosed: parseBoolean(req.query?.includeClosed, 'includeClosed'),
    limit: parsePositiveInteger(req.query?.limit, 'limit'),
    actorId,
    actorRoles: roles,
  });

  res.json(dashboard);
}

export async function createDispute(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }

  const { actorId, roles } = resolveActorContext(req, freelancerId);
  const dispute = await openFreelancerDispute(freelancerId, req.body ?? {}, {
    actorId,
    actorRoles: roles,
  });

  res.status(201).json(dispute);
}

export async function showDispute(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const disputeId = parsePositiveInteger(req.params?.disputeId, 'disputeId');

  if (!freelancerId || !disputeId) {
    throw new ValidationError('freelancerId and disputeId are required.');
  }

  const detail = await getFreelancerDisputeDetail(freelancerId, disputeId);
  res.json(detail);
}

export async function appendEvent(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const disputeId = parsePositiveInteger(req.params?.disputeId, 'disputeId');

  if (!freelancerId || !disputeId) {
    throw new ValidationError('freelancerId and disputeId are required.');
  }

  const { actorId, roles } = resolveActorContext(req, freelancerId);
  const result = await appendFreelancerDisputeEvent(freelancerId, disputeId, req.body ?? {}, {
    actorId,
    actorRoles: roles,
  });

  res.status(201).json(result);
}

export default {
  listDisputes,
  createDispute,
  showDispute,
  appendEvent,
};
