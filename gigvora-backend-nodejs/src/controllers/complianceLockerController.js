import {
  createComplianceDocument,
  addComplianceDocumentVersion,
  getComplianceLockerOverview,
  acknowledgeComplianceReminder,
} from '../services/complianceLockerService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function parseFrameworks(frameworks) {
  if (!frameworks) {
    return undefined;
  }
  if (Array.isArray(frameworks)) {
    const normalised = frameworks
      .map((value) => (value ? String(value).trim() : ''))
      .filter((value) => value.length);
    return normalised.length ? normalised : undefined;
  }
  if (typeof frameworks === 'string') {
    const tokens = frameworks
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length);
    return tokens.length ? tokens : undefined;
  }
  return undefined;
}

export async function overview(req, res) {
  const { userId, limit, region, frameworks, useCache } = req.query ?? {};
  if (!userId) {
    throw new ValidationError('userId is required for compliance locker overview.');
  }
  const parsedLimit = Number.parseInt(limit, 10);
  const locker = await getComplianceLockerOverview(parsePositiveInteger(userId, 'userId'), {
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined,
    region: region ?? undefined,
    frameworks: parseFrameworks(frameworks),
    useCache: useCache === 'true' || useCache === true,
  });
  res.json(locker);
}

export async function storeDocument(req, res) {
  const payload = req.body ?? {};
  const { actorId, ...documentPayload } = payload;
  if (!documentPayload.workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  const document = await createComplianceDocument(
    {
      ...documentPayload,
      workspaceId: parsePositiveInteger(documentPayload.workspaceId, 'workspaceId'),
    },
    {
      actorId,
      logger: req.log,
      requestId: req.id,
    },
  );
  res.status(201).json(document);
}

export async function addVersion(req, res) {
  const { documentId } = req.params ?? {};
  if (!documentId) {
    throw new ValidationError('documentId is required.');
  }
  const payload = req.body ?? {};
  const { actorId, ...versionPayload } = payload;
  const result = await addComplianceDocumentVersion(parsePositiveInteger(documentId, 'documentId'), versionPayload, {
    actorId,
    logger: req.log,
    requestId: req.id,
  });
  res.status(201).json(result);
}

export async function acknowledgeReminder(req, res) {
  const { reminderId } = req.params ?? {};
  if (!reminderId) {
    throw new ValidationError('reminderId is required.');
  }
  const payload = req.body ?? {};
  const { actorId, status } = payload;
  const reminder = await acknowledgeComplianceReminder(
    parsePositiveInteger(reminderId, 'reminderId'),
    status ?? 'acknowledged',
    {
      actorId,
      logger: req.log,
      requestId: req.id,
    },
  );
  res.json(reminder);
}

export default {
  overview,
  storeDocument,
  addVersion,
  acknowledgeReminder,
};
