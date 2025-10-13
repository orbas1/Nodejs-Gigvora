import {
  createComplianceDocument,
  addComplianceDocumentVersion,
  getComplianceLockerOverview,
  acknowledgeComplianceReminder,
} from '../services/complianceLockerService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function normalizeFrameworkQuery(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) =>
        String(entry)
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean),
      )
      .filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export async function overview(req, res) {
  const { userId, limit, region, frameworks, useCache } = req.query ?? {};
  const ownerId = parsePositiveInteger(userId, 'userId');
  if (!ownerId) {
    throw new ValidationError('userId is required.');
  }

  const maxResults = parsePositiveInteger(limit, 'limit');
  const frameworkFilters = normalizeFrameworkQuery(frameworks);
  const locker = await getComplianceLockerOverview(ownerId, {
    limit: maxResults ?? undefined,
    region: region ? String(region).trim() : undefined,
    frameworks: frameworkFilters.length ? frameworkFilters : undefined,
    useCache: useCache === undefined ? undefined : useCache !== 'false',
  });
  res.json(locker);
}

export async function storeDocument(req, res) {
  const payload = req.body ?? {};
  const actorId = parsePositiveInteger(payload.actorId, 'actorId');
  const document = await createComplianceDocument(payload, { actorId });
  res.status(201).json(document);
}

export async function addVersion(req, res) {
  const { documentId } = req.params ?? {};
  const payload = req.body ?? {};
  const actorId = parsePositiveInteger(payload.actorId, 'actorId');
  const result = await addComplianceDocumentVersion(documentId, payload, { actorId });
  res.status(201).json(result);
}

export async function acknowledgeReminder(req, res) {
  const { reminderId } = req.params ?? {};
  const payload = req.body ?? {};
  const actorId = parsePositiveInteger(payload.actorId, 'actorId');
  const status = payload.status ? String(payload.status).trim() : 'acknowledged';
  const reminder = await acknowledgeComplianceReminder(reminderId, status, { actorId });
  res.json(reminder);
}

export default {
  overview,
  storeDocument,
  addVersion,
  acknowledgeReminder,
};
