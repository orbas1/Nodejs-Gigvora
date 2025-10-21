import {
  getUserVolunteeringManagement,
  createVolunteerApplication,
  updateVolunteerApplication,
  createVolunteerResponse,
  updateVolunteerResponse,
  deleteVolunteerResponse,
  upsertVolunteerContract,
  recordVolunteerSpend,
  updateVolunteerSpend,
  deleteVolunteerSpend,
  createVolunteerReview,
  updateVolunteerReview,
  deleteVolunteerReview,
} from '../services/volunteeringManagementService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function normaliseId(value, fieldName) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function assertCanActOnUser(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (actorId && Number(actorId) === Number(targetUserId)) {
    return;
  }
  const actorRoles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((role) => `${role}`.trim().toLowerCase())
    : [];
  if (actorRoles.some((role) => ['admin', 'platform_admin', 'support', 'operations'].includes(role))) {
    return;
  }
  throw new AuthorizationError('You do not have permission to modify this volunteer record.');
}

export async function getManagementSnapshot(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  assertCanActOnUser(req, userId);
  const snapshot = await getUserVolunteeringManagement(userId, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(snapshot);
}

export async function createApplication(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  assertCanActOnUser(req, userId);
  const application = await createVolunteerApplication(userId, req.body ?? {});
  res.status(201).json(application);
}

export async function updateApplication(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  assertCanActOnUser(req, userId);
  const application = await updateVolunteerApplication(userId, applicationId, req.body ?? {});
  res.json(application);
}

export async function createResponse(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  assertCanActOnUser(req, userId);
  const response = await createVolunteerResponse(userId, applicationId, req.body ?? {});
  res.status(201).json(response);
}

export async function updateResponse(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const responseId = normaliseId(req.params.responseId, 'responseId');
  assertCanActOnUser(req, userId);
  const response = await updateVolunteerResponse(userId, applicationId, responseId, req.body ?? {});
  res.json(response);
}

export async function deleteResponse(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const responseId = normaliseId(req.params.responseId, 'responseId');
  assertCanActOnUser(req, userId);
  await deleteVolunteerResponse(userId, applicationId, responseId);
  res.status(204).send();
}

export async function upsertContract(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  assertCanActOnUser(req, userId);
  const contract = await upsertVolunteerContract(userId, applicationId, req.body ?? {});
  res.json(contract);
}

export async function createSpend(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  assertCanActOnUser(req, userId);
  const spend = await recordVolunteerSpend(userId, applicationId, req.body ?? {});
  res.status(201).json(spend);
}

export async function updateSpend(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const spendId = normaliseId(req.params.spendId, 'spendId');
  assertCanActOnUser(req, userId);
  const spend = await updateVolunteerSpend(userId, applicationId, spendId, req.body ?? {});
  res.json(spend);
}

export async function deleteSpend(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const spendId = normaliseId(req.params.spendId, 'spendId');
  assertCanActOnUser(req, userId);
  await deleteVolunteerSpend(userId, applicationId, spendId);
  res.status(204).send();
}

export async function createReview(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  assertCanActOnUser(req, userId);
  const review = await createVolunteerReview(userId, applicationId, req.body ?? {});
  res.status(201).json(review);
}

export async function updateReview(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const reviewId = normaliseId(req.params.reviewId, 'reviewId');
  assertCanActOnUser(req, userId);
  const review = await updateVolunteerReview(userId, applicationId, reviewId, req.body ?? {});
  res.json(review);
}

export async function deleteReview(req, res) {
  const userId = normaliseId(req.params.id, 'userId');
  const applicationId = normaliseId(req.params.applicationId, 'applicationId');
  const reviewId = normaliseId(req.params.reviewId, 'reviewId');
  assertCanActOnUser(req, userId);
  await deleteVolunteerReview(userId, applicationId, reviewId);
  res.status(204).send();
}

export default {
  getManagementSnapshot,
  createApplication,
  updateApplication,
  createResponse,
  updateResponse,
  deleteResponse,
  upsertContract,
  createSpend,
  updateSpend,
  deleteSpend,
  createReview,
  updateReview,
  deleteReview,
};
