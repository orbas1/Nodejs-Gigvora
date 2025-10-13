import deliverableVaultService from '../services/deliverableVaultService.js';
import { ValidationError } from '../utils/errors.js';

function resolveFreelancerId(req, fallback) {
  const fromQuery = req.query.freelancerId ?? req.params.freelancerId;
  const fromBody = req.body?.freelancerId;
  const resolved = fromQuery ?? fromBody ?? req.user?.id ?? fallback;
  const parsed = Number(resolved);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function resolveActorId(req) {
  const actorFromRequest = req.user?.id ?? req.headers['x-actor-id'] ?? req.body?.actorId;
  const parsed = Number(actorFromRequest);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function getOverview(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    if (!freelancerId) {
      throw new ValidationError('freelancerId is required.');
    }
    const overview = await deliverableVaultService.getVaultOverview({ freelancerId });
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

export async function getItem(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    const itemId = Number(req.params.itemId);
    const detail = await deliverableVaultService.getVaultItem({ itemId, freelancerId });
    res.json(detail);
  } catch (error) {
    next(error);
  }
}

export async function createItem(req, res, next) {
  try {
    const freelancerId = resolveFreelancerId(req);
    if (!freelancerId) {
      throw new ValidationError('freelancerId is required.');
    }
    const actorId = resolveActorId(req) ?? freelancerId;
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
    if (!freelancerId) {
      throw new ValidationError('freelancerId is required.');
    }
    const itemId = Number(req.params.itemId);
    const actorId = resolveActorId(req) ?? freelancerId;
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
    if (!freelancerId) {
      throw new ValidationError('freelancerId is required.');
    }
    const itemId = Number(req.params.itemId);
    const actorId = resolveActorId(req) ?? freelancerId;
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
    if (!freelancerId) {
      throw new ValidationError('freelancerId is required.');
    }
    const itemId = Number(req.params.itemId);
    const actorId = resolveActorId(req) ?? freelancerId;
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
