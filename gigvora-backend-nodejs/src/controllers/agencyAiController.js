import {
  getAgencyAiControl,
  updateAgencyAiSettings,
  createAgencyBidTemplate,
  updateAgencyBidTemplate,
  deleteAgencyBidTemplate,
} from '../services/agencyAiService.js';

function buildActorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? null,
    id: req.user?.id ?? null,
    role: req.user?.type ?? null,
  };
}

export async function fetchControlPanel(req, res) {
  const payload = {
    workspaceId: req.query.workspaceId ?? req.body?.workspaceId ?? null,
    workspaceSlug: req.query.workspaceSlug ?? null,
  };
  const actor = buildActorContext(req);
  const response = await getAgencyAiControl(payload, actor);
  res.json(response);
}

export async function updateControlPanel(req, res) {
  const payload = {
    ...req.body,
    workspaceId: req.body?.workspaceId ?? req.query.workspaceId ?? null,
    workspaceSlug: req.body?.workspaceSlug ?? req.query.workspaceSlug ?? null,
  };
  const actor = buildActorContext(req);
  const response = await updateAgencyAiSettings(payload, actor);
  res.json(response);
}

export async function createTemplate(req, res) {
  const payload = {
    ...req.body,
    workspaceId: req.body?.workspaceId ?? req.query.workspaceId ?? null,
    workspaceSlug: req.body?.workspaceSlug ?? req.query.workspaceSlug ?? null,
  };
  const actor = buildActorContext(req);
  const template = await createAgencyBidTemplate(payload, actor);
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const payload = {
    ...req.body,
    workspaceId: req.body?.workspaceId ?? req.query.workspaceId ?? null,
    workspaceSlug: req.body?.workspaceSlug ?? req.query.workspaceSlug ?? null,
  };
  const actor = buildActorContext(req);
  const template = await updateAgencyBidTemplate(req.params.templateId, payload, actor);
  res.json(template);
}

export async function destroyTemplate(req, res) {
  const payload = {
    workspaceId: req.body?.workspaceId ?? req.query.workspaceId ?? null,
    workspaceSlug: req.body?.workspaceSlug ?? req.query.workspaceSlug ?? null,
  };
  const actor = buildActorContext(req);
  await deleteAgencyBidTemplate(req.params.templateId, { ...actor, ...payload });
  res.status(204).end();
}

export default {
  fetchControlPanel,
  updateControlPanel,
  createTemplate,
  updateTemplate,
  destroyTemplate,
};
