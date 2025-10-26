import {
  listTaxDocuments,
  acknowledgeTaxDocument,
  uploadTaxDocument,
  downloadTaxDocument,
  snoozeTaxReminder,
} from '../services/taxDocumentService.js';
import { ValidationError } from '../utils/errors.js';

function resolveFreelancerId(req) {
  const explicit = req.query?.freelancerId ?? req.body?.freelancerId;
  if (explicit != null) {
    return explicit;
  }
  const sessionUserId = req.user?.id ?? req.user?.userId ?? null;
  if (sessionUserId == null) {
    throw new ValidationError('freelancerId is required.');
  }
  return sessionUserId;
}

export async function index(req, res) {
  const freelancerId = resolveFreelancerId(req);
  const { lookbackYears } = req.query ?? {};
  const payload = await listTaxDocuments(freelancerId, { lookbackYears });
  res.json(payload);
}

export async function acknowledge(req, res) {
  const { filingId } = req.params ?? {};
  const { actorId } = req.body ?? {};
  const record = await acknowledgeTaxDocument(filingId, { actorId });
  res.json({ record });
}

export async function upload(req, res) {
  const { filingId } = req.params ?? {};
  const { data, fileName, contentType, actorId, workspaceId, storageProvider, storageRegion, sha256 } = req.body ?? {};
  const result = await uploadTaxDocument(filingId, {
    data,
    fileName,
    contentType,
    actorId,
    workspaceId,
    storageProvider,
    storageRegion,
    sha256,
  });
  res.status(201).json(result);
}

export async function download(req, res) {
  const { filingId } = req.params ?? {};
  const result = await downloadTaxDocument(filingId);
  res.json(result);
}

export async function snooze(req, res) {
  const { reminderId } = req.params ?? {};
  const { days } = req.body ?? {};
  const reminder = await snoozeTaxReminder(reminderId, { days });
  res.json({ reminder });
}

export default {
  index,
  acknowledge,
  upload,
  download,
  snooze,
};
