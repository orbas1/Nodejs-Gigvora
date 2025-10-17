import {
  upsertIdentityVerification,
  submitIdentityVerification,
  reviewIdentityVerification,
  getIdentityVerificationOverview,
} from '../services/complianceService.js';
import { storeIdentityDocument, readIdentityDocument } from '../services/identityDocumentStorageService.js';

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

export async function overview(req, res) {
  const { userId, profileId, includeHistory = true, actorRoles = [] } = req.query ?? {};
  const headerRoles = req.headers['x-roles'] ?? [];
  const mergedRoles = mergeActorRoles(headerRoles, actorRoles);

  const snapshot = await getIdentityVerificationOverview(userId, {
    profileId,
    includeHistory,
    actorRoles: mergedRoles,
  });

  res.json(snapshot);
}

export async function save(req, res) {
  const payload = req.body ?? {};
  const { actorRoles = [], actorId } = payload;

  const record = await upsertIdentityVerification(payload.userId ?? actorId, payload);

  const snapshot = await getIdentityVerificationOverview(payload.userId ?? actorId, {
    profileId: payload.profileId,
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
  const result = await submitIdentityVerification(payload.userId ?? actorId, payload);
  const snapshot = await getIdentityVerificationOverview(payload.userId ?? actorId, {
    profileId: payload.profileId,
    actorRoles,
  });
  res.status(200).json({ record: result.toPublicObject(), snapshot });
}

export async function review(req, res) {
  const payload = req.body ?? {};
  const { actorRoles = [], actorId } = payload;
  const result = await reviewIdentityVerification(payload.userId ?? actorId, payload);
  const snapshot = await getIdentityVerificationOverview(payload.userId ?? actorId, {
    profileId: payload.profileId,
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
