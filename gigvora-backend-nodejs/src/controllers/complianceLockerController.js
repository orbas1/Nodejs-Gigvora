import {
  createComplianceDocument,
  addComplianceDocumentVersion,
  getComplianceLockerOverview,
  acknowledgeComplianceReminder,
} from '../services/complianceLockerService.js';

export async function overview(req, res) {
  const { userId, limit, region, frameworks = [], useCache } = req.query ?? {};
  const locker = await getComplianceLockerOverview(userId, {
    limit: limit ?? undefined,
    region: region ?? undefined,
    frameworks: frameworks.length ? frameworks : undefined,
    useCache,
  });
  res.json(locker);
}

export async function storeDocument(req, res) {
  const payload = req.body ?? {};
  const { actorId, ...documentPayload } = payload;
  const document = await createComplianceDocument(documentPayload, {
    actorId,
    logger: req.log,
    requestId: req.id,
  });
  res.status(201).json(document);
}

export async function addVersion(req, res) {
  const { documentId } = req.params ?? {};
  const payload = req.body ?? {};
  const { actorId, ...versionPayload } = payload;
  const result = await addComplianceDocumentVersion(documentId, versionPayload, {
    actorId,
    logger: req.log,
    requestId: req.id,
  });
  res.status(201).json(result);
}

export async function acknowledgeReminder(req, res) {
  const { reminderId } = req.params ?? {};
  const payload = req.body ?? {};
  const { actorId, status } = payload;
  const reminder = await acknowledgeComplianceReminder(reminderId, status ?? 'acknowledged', {
    actorId,
    logger: req.log,
    requestId: req.id,
  });
  res.json(reminder);
}

export default {
  overview,
  storeDocument,
  addVersion,
  acknowledgeReminder,
};
