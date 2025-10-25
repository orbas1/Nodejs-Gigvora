import {
  getComplianceOverview,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  createComplianceAudit,
  updateComplianceAudit,
  deleteComplianceAudit,
  createComplianceObligation,
  updateComplianceObligation,
  deleteComplianceObligation,
  logComplianceEvidence,
} from '../services/adminComplianceManagementService.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

export async function overview(req, res) {
  const snapshot = await getComplianceOverview();
  res.json(snapshot);
}

export async function storeFramework(req, res) {
  const actor = extractAdminActor(req);
  const framework = await createComplianceFramework(req.body, actor);
  res.status(201).json(framework);
}

export async function updateFramework(req, res) {
  const frameworkId = coercePositiveInteger(req.params.frameworkId, 'frameworkId');
  const actor = extractAdminActor(req);
  const framework = await updateComplianceFramework(frameworkId, req.body ?? {}, actor);
  res.json(framework);
}

export async function destroyFramework(req, res) {
  const frameworkId = coercePositiveInteger(req.params.frameworkId, 'frameworkId');
  await deleteComplianceFramework(frameworkId);
  res.status(204).send();
}

export async function storeAudit(req, res) {
  const actor = extractAdminActor(req);
  const audit = await createComplianceAudit(req.body, actor);
  res.status(201).json(audit);
}

export async function updateAudit(req, res) {
  const auditId = coercePositiveInteger(req.params.auditId, 'auditId');
  const actor = extractAdminActor(req);
  const audit = await updateComplianceAudit(auditId, req.body ?? {}, actor);
  res.json(audit);
}

export async function destroyAudit(req, res) {
  const auditId = coercePositiveInteger(req.params.auditId, 'auditId');
  await deleteComplianceAudit(auditId);
  res.status(204).send();
}

export async function storeObligation(req, res) {
  const actor = extractAdminActor(req);
  const obligation = await createComplianceObligation(req.body, actor);
  res.status(201).json(obligation);
}

export async function updateObligation(req, res) {
  const obligationId = coercePositiveInteger(req.params.obligationId, 'obligationId');
  const actor = extractAdminActor(req);
  const obligation = await updateComplianceObligation(obligationId, req.body ?? {}, actor);
  res.json(obligation);
}

export async function destroyObligation(req, res) {
  const obligationId = coercePositiveInteger(req.params.obligationId, 'obligationId');
  await deleteComplianceObligation(obligationId);
  res.status(204).send();
}

export async function storeEvidence(req, res) {
  const obligationId = coercePositiveInteger(req.params.obligationId, 'obligationId');
  const actor = extractAdminActor(req);
  const evidence = await logComplianceEvidence(obligationId, req.body ?? {}, actor);
  res.status(201).json(evidence);
}

export default {
  overview,
  storeFramework,
  updateFramework,
  destroyFramework,
  storeAudit,
  updateAudit,
  destroyAudit,
  storeObligation,
  updateObligation,
  destroyObligation,
  storeEvidence,
};
