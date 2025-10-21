import {
  upsertIdentityVerification,
  submitIdentityVerification,
  reviewIdentityVerification,
  getIdentityVerificationOverview,
} from '../services/complianceService.js';
import { storeIdentityDocument, readIdentityDocument } from '../services/identityDocumentStorageService.js';
import { ValidationError } from '../utils/errors.js';

function mergeActorRoles(reqRoles, queryRoles) {
  const roles = new Set();
  const append = (value) => {
    if (!value) {
      return;
    }
    const items = Array.isArray(value) ? value : `${value}`.split(',');
    items
      .map((item) => (item == null ? null : `${item}`.trim().toLowerCase()))
      .filter(Boolean)
      .forEach((item) => roles.add(item));
  };
  append(reqRoles);
  append(queryRoles);
  return Array.from(roles);
}

function parseOptionalPositiveInteger(value, fieldName) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function resolveUserId({ queryUserId, actorHeaderId, authenticatedUserId }) {
  const explicitId = parseOptionalPositiveInteger(queryUserId, 'userId');
  const actorId = parseOptionalPositiveInteger(actorHeaderId, 'userId');
  const fallbackId = parseOptionalPositiveInteger(authenticatedUserId, 'userId');
  return explicitId ?? actorId ?? fallbackId;
}

function parseBoolean(value, fallback = true) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
    return false;
  }
  throw new ValidationError('includeHistory must be a boolean value.');
}

function resolvePayloadUserId(payload) {
  const candidate = parseOptionalPositiveInteger(payload.userId, 'userId');
  const actorId = parseOptionalPositiveInteger(payload.actorId, 'actorId');
  return candidate ?? actorId;
}

export async function overview(req, res) {
  const { userId, profileId, includeHistory = true, actorRoles = [] } = req.query ?? {};
  const headerRoles = req.headers?.['x-roles'] ?? [];
  const mergedRoles = mergeActorRoles(headerRoles, actorRoles);

  const resolvedUserId = resolveUserId({
    queryUserId: userId,
    actorHeaderId: req.headers?.['x-user-id'],
    authenticatedUserId: req.user?.id,
  });

  if (!resolvedUserId) {
    throw new ValidationError('userId is required.');
  }

  const snapshot = await getIdentityVerificationOverview(resolvedUserId, {
    profileId: parseOptionalPositiveInteger(profileId, 'profileId'),
    includeHistory: parseBoolean(includeHistory, true),
    actorRoles: mergedRoles,
  });

  res.json(snapshot);
}

export async function save(req, res) {
  const payload = req.body ?? {};
  const { actorRoles = [], actorId } = payload;

  const targetUserId = resolvePayloadUserId({ ...payload, actorId }) ?? parseOptionalPositiveInteger(actorId, 'actorId');
  if (!targetUserId) {
    throw new ValidationError('userId is required.');
  }

  const record = await upsertIdentityVerification(targetUserId, payload);

  const snapshot = await getIdentityVerificationOverview(targetUserId, {
    profileId: parseOptionalPositiveInteger(payload.profileId, 'profileId'),
    actorRoles,
  });

  res.status(200).json({
    record: record.toPublicObject(),
    snapshot,
  });
}

export async function submit(req, res) {
  const payload = req.body ?? {};
  const { actorRoles = [], actorId } = payload;
  const targetUserId = resolvePayloadUserId({ ...payload, actorId }) ?? parseOptionalPositiveInteger(actorId, 'actorId');
  if (!targetUserId) {
    throw new ValidationError('userId is required.');
  }
  const result = await submitIdentityVerification(targetUserId, payload);
  const snapshot = await getIdentityVerificationOverview(targetUserId, {
    profileId: parseOptionalPositiveInteger(payload.profileId, 'profileId'),
    actorRoles,
  });
  res.status(200).json({ record: result.toPublicObject(), snapshot });
}

export async function review(req, res) {
  const payload = req.body ?? {};
  const { actorRoles = [], actorId } = payload;
  const targetUserId = resolvePayloadUserId({ ...payload, actorId }) ?? parseOptionalPositiveInteger(actorId, 'actorId');
  if (!targetUserId) {
    throw new ValidationError('userId is required.');
  }
  const result = await reviewIdentityVerification(targetUserId, payload);
  const snapshot = await getIdentityVerificationOverview(targetUserId, {
    profileId: parseOptionalPositiveInteger(payload.profileId, 'profileId'),
    actorRoles,
  });
  res.json({ record: result.toPublicObject(), snapshot });
}

export async function uploadDocument(req, res) {
  const payload = req.body ?? {};
  const stored = await storeIdentityDocument(payload, { storageRoot: process.env.IDENTITY_DOCUMENT_STORAGE_PATH });
  res.status(201).json(stored);
}

export async function downloadDocument(req, res) {
  const { key } = req.query ?? {};
  if (!key) {
    throw new ValidationError('key is required.');
  }
  const document = await readIdentityDocument(key, { storageRoot: process.env.IDENTITY_DOCUMENT_STORAGE_PATH });
  res.json(document);
}

export default {
  overview,
  save,
  submit,
  review,
  uploadDocument,
  downloadDocument,
};
