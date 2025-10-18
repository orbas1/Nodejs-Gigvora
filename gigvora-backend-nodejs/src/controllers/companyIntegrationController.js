import {
  listCompanyIntegrations,
  updateCrmIntegration,
  rotateCrmIntegrationCredential,
  updateCrmIntegrationFieldMappings,
  updateCrmIntegrationRoleAssignments,
  triggerCrmIntegrationSync,
  createCrmIntegrationIncident,
  resolveCrmIntegrationIncident,
} from '../services/companyIntegrationService.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function buildActor(req) {
  const body = req.body ?? {};
  const id = parseNumeric(body.actorId ?? req.user?.id);
  const name = body.actorName ?? req.user?.name ?? null;
  return { id, name };
}

export async function list(req, res) {
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const result = await listCompanyIntegrations({ workspaceId });
  res.json(result);
}

export async function update(req, res) {
  const providerKey = req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const payload = req.body ?? {};
  const actor = buildActor(req);
  const connector = await updateCrmIntegration(workspaceId, providerKey, payload, actor);
  res.json(connector);
}

export async function rotateCredential(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const payload = {
    providerKey,
    secret: req.body?.secret,
    credentialType: req.body?.credentialType,
    expiresAt: req.body?.expiresAt,
  };
  const connector = await rotateCrmIntegrationCredential(workspaceId, integrationId, payload, actor);
  res.json(connector);
}

export async function updateFieldMappings(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const mappings = Array.isArray(req.body?.mappings) ? req.body.mappings : [];
  const connector = await updateCrmIntegrationFieldMappings(
    workspaceId,
    integrationId,
    providerKey,
    mappings,
    actor,
  );
  res.json(connector);
}

export async function updateRoleAssignments(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const assignments = Array.isArray(req.body?.assignments) ? req.body.assignments : [];
  const connector = await updateCrmIntegrationRoleAssignments(
    workspaceId,
    integrationId,
    providerKey,
    assignments,
    actor,
  );
  res.json(connector);
}

export async function triggerSync(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const payload = {
    trigger: req.body?.trigger ?? 'manual',
    notes: req.body?.notes ?? null,
  };
  const connector = await triggerCrmIntegrationSync(workspaceId, integrationId, providerKey, payload, actor);
  res.json(connector);
}

export async function createIncident(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const payload = {
    severity: req.body?.severity,
    summary: req.body?.summary,
    description: req.body?.description,
  };
  const connector = await createCrmIntegrationIncident(workspaceId, integrationId, providerKey, payload, actor);
  res.status(201).json(connector);
}

export async function resolveIncident(req, res) {
  const integrationId = parseNumeric(req.params.integrationId);
  const incidentId = parseNumeric(req.params.incidentId);
  const providerKey = req.body?.providerKey ?? req.params.providerKey;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const actor = buildActor(req);
  const connector = await resolveCrmIntegrationIncident(
    workspaceId,
    integrationId,
    providerKey,
    incidentId,
    actor,
  );
  res.json(connector);
}

export default {
  list,
  update,
  rotateCredential,
  updateFieldMappings,
  updateRoleAssignments,
  triggerSync,
  createIncident,
  resolveIncident,
};
