import {
  listLegalDocuments,
  getLegalDocument,
  createLegalDocument,
  updateLegalDocument,
  createDocumentVersion,
  updateDocumentVersion,
  publishDocumentVersion,
  activateDocumentVersion,
  archiveDocumentVersion,
} from '../services/legalPolicyService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalised)) {
    return false;
  }
  throw new ValidationError('Boolean query parameters must be true or false.');
}

function parsePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function resolveActorContext(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('compliance') ||
    permissions.has('legal.manage.any')
  ) {
    return { actorId: String(actorId), actorType: 'admin' };
  }

  throw new AuthorizationError('You do not have permission to manage legal policies.');
}

export async function index(req, res) {
  const documents = await listLegalDocuments({
    category: req.query?.category,
    status: req.query?.status,
    locale: req.query?.locale,
    includeVersions: parseBoolean(req.query?.includeVersions, false),
  });
  res.json({ documents });
}

export async function show(req, res) {
  const { slug } = req.params;
  const document = await getLegalDocument(slug, {
    includeVersions: !parseBoolean(req.query?.includeVersions === 'false', false),
    includeAudit: parseBoolean(req.query?.includeAudit, false),
  });
  res.json(document);
}

export async function store(req, res) {
  const actor = resolveActorContext(req);
  const document = await createLegalDocument(ensureObjectPayload(req.body, 'legal document'), actor);
  res.status(201).json(document);
}

export async function update(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const actor = resolveActorContext(req);
  const document = await updateLegalDocument(documentId, ensureObjectPayload(req.body, 'legal document update'), actor);
  res.json(document);
}

export async function createVersion(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const actor = resolveActorContext(req);
  const version = await createDocumentVersion(
    documentId,
    ensureObjectPayload(req.body, 'legal document version'),
    actor,
  );
  res.status(201).json(version);
}

export async function updateVersion(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const versionId = parsePositiveInteger(req.params?.versionId, 'versionId');
  const actor = resolveActorContext(req);
  const version = await updateDocumentVersion(
    documentId,
    versionId,
    ensureObjectPayload(req.body, 'legal document version update'),
    actor,
  );
  res.json(version);
}

export async function publishVersion(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const versionId = parsePositiveInteger(req.params?.versionId, 'versionId');
  const actor = resolveActorContext(req);
  const version = await publishDocumentVersion(
    documentId,
    versionId,
    ensureObjectPayload(req.body, 'legal document publish payload'),
    actor,
  );
  res.json(version);
}

export async function activateVersion(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const versionId = parsePositiveInteger(req.params?.versionId, 'versionId');
  const actor = resolveActorContext(req);
  const document = await activateDocumentVersion(documentId, versionId, actor);
  res.json(document);
}

export async function archiveVersion(req, res) {
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  const versionId = parsePositiveInteger(req.params?.versionId, 'versionId');
  const actor = resolveActorContext(req);
  const version = await archiveDocumentVersion(
    documentId,
    versionId,
    ensureObjectPayload(req.body, 'legal document archive payload'),
    actor,
  );
  res.json(version);
}

export default {
  index,
  show,
  store,
  update,
  createVersion,
  updateVersion,
  publishVersion,
  activateVersion,
  archiveVersion,
};
