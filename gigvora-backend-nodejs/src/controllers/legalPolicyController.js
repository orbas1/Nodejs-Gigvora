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

export async function index(req, res) {
  const documents = await listLegalDocuments({
    category: req.query?.category,
    status: req.query?.status,
    locale: req.query?.locale,
    includeVersions: req.query?.includeVersions === 'true',
  });
  res.json({ documents });
}

export async function show(req, res) {
  const { slug } = req.params;
  const document = await getLegalDocument(slug, {
    includeVersions: req.query?.includeVersions !== 'false',
    includeAudit: req.query?.includeAudit === 'true',
  });
  res.json(document);
}

export async function store(req, res) {
  const document = await createLegalDocument(req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.status(201).json(document);
}

export async function update(req, res) {
  const { documentId } = req.params;
  const document = await updateLegalDocument(Number(documentId), req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.json(document);
}

export async function createVersion(req, res) {
  const { documentId } = req.params;
  const version = await createDocumentVersion(Number(documentId), req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.status(201).json(version);
}

export async function updateVersion(req, res) {
  const { documentId, versionId } = req.params;
  const version = await updateDocumentVersion(Number(documentId), Number(versionId), req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.json(version);
}

export async function publishVersion(req, res) {
  const { documentId, versionId } = req.params;
  const version = await publishDocumentVersion(Number(documentId), Number(versionId), req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.json(version);
}

export async function activateVersion(req, res) {
  const { documentId, versionId } = req.params;
  const document = await activateDocumentVersion(Number(documentId), Number(versionId), {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
  res.json(document);
}

export async function archiveVersion(req, res) {
  const { documentId, versionId } = req.params;
  const version = await archiveDocumentVersion(Number(documentId), Number(versionId), req.body ?? {}, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });
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
