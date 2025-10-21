import deliverableVaultService from '../services/deliverableVaultService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function resolveFreelancerId(req) {
  const candidates = [req.query?.freelancerId, req.params?.freelancerId, req.body?.freelancerId, req.user?.id];
  const candidate = candidates.find((value) => value != null && `${value}`.trim?.() !== '');
  if (candidate == null) {
    throw new ValidationError('freelancerId is required.');
  }
  return parsePositiveInteger(candidate, 'freelancerId');
}

function resolveActorId(req, fallbackFreelancerId) {
  const actorFromRequest = req.user?.id ?? req.headers?.['x-actor-id'] ?? req.body?.actorId ?? fallbackFreelancerId;
  if (actorFromRequest == null) {
    throw new ValidationError('actorId is required.');
  }
  return parsePositiveInteger(actorFromRequest, 'actorId');
}

export async function getOverview(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const overview = await deliverableVaultService.getVaultOverview({ freelancerId });
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

export async function getItem(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const itemId = parsePositiveInteger(req.params.itemId, 'itemId');
    const detail = await deliverableVaultService.getVaultItem({ itemId, freelancerId });
    res.json(detail);
  } catch (error) {
    next(error);
  }
}

export async function createItem(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const actorId = resolveActorId(req, freelancerId);
    const payload = req.body || {};
    const result = await deliverableVaultService.createVaultItem({ freelancerId, actorId, payload });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const itemId = parsePositiveInteger(req.params.itemId, 'itemId');
    const actorId = resolveActorId(req, freelancerId);
    const result = await deliverableVaultService.updateVaultItem({
      itemId,
      freelancerId,
      actorId,
      changes: req.body || {},
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function addVersion(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const itemId = parsePositiveInteger(req.params.itemId, 'itemId');
    const actorId = resolveActorId(req, freelancerId);
    const version = req.body || {};
    const result = await deliverableVaultService.addDeliverableVersion({
      itemId,
      freelancerId,
      actorId,
      version,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function generatePackage(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const itemId = parsePositiveInteger(req.params.itemId, 'itemId');
    const actorId = resolveActorId(req, freelancerId);
    const { summary, metrics, expiresInDays, includesWatermark } = req.body || {};
    const result = await deliverableVaultService.generateDeliveryPackage({
      itemId,
      freelancerId,
      actorId,
      summary,
      metrics,
      expiresInDays,
      includesWatermark,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getOverview,
  getItem,
  createItem,
  updateItem,
  addVersion,
  generatePackage,
};
