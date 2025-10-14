import careerDocumentService from '../services/careerDocumentService.js';
import { ValidationError } from '../utils/errors.js';

function parseRoles(rawRoles) {
  if (!rawRoles) {
    return [];
  }
  if (Array.isArray(rawRoles)) {
    return rawRoles.map((role) => `${role}`.toLowerCase());
  }
  return `${rawRoles}`
    .split(',')
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
}

function extractActor(req) {
  const actorId =
    req.user?.id ??
    req.headers['x-user-id'] ??
    req.headers['x-actor-id'] ??
    req.headers['x-gigvora-actor-id'] ??
    req.body?.actorId ??
    null;
  const roleHeaders =
    req.headers['x-roles'] ??
    req.headers['x-role'] ??
    req.headers['x-gigvora-memberships'] ??
    req.user?.roles ??
    [];
  const actorRoles = parseRoles(roleHeaders);
  return { actorId, actorRoles };
}

function resolveUserId(req) {
  const param = req.params?.userId ?? req.params?.id;
  const parsed = Number(param);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('A valid userId is required in the route.');
  }
  return parsed;
}

export async function getWorkspace(req, res, next) {
  try {
    const userId = resolveUserId(req);
    const { actorId, actorRoles } = extractActor(req);
    const workspace = await careerDocumentService.getCvWorkspace({
      userId,
      actorId,
      actorRoles,
    });
    res.json(workspace);
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const userId = resolveUserId(req);
    const { actorId, actorRoles } = extractActor(req);
    const payload = req.body || {};
    const document = await careerDocumentService.createCvDocument({
      userId,
      actorId,
      actorRoles,
      payload,
    });
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function uploadVersion(req, res, next) {
  try {
    const userId = resolveUserId(req);
    const documentId = Number(req.params?.documentId);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      throw new ValidationError('documentId must be a positive number.');
    }
    const { actorId, actorRoles } = extractActor(req);
    const payload = req.body || {};
    const document = await careerDocumentService.uploadCvVersion({
      userId,
      documentId,
      actorId,
      actorRoles,
      payload,
    });
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export default {
  getWorkspace,
  createDocument,
  uploadVersion,
};
