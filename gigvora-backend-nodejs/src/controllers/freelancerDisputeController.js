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
  const roles = normaliseRoleHeader(req.headers['x-roles'] ?? req.headers['x-role']);
  const actorIdFromHeader = parsePositiveInteger(req.headers['x-user-id'], 'actorId');
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
    includeClosed: req.query?.includeClosed,
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
