import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  getCampaign,
  createCreative,
  updateCreative,
  createPlacement,
  updatePlacement,
  getReferenceData,
} from '../services/agencyAdService.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildActor(req) {
  return {
    actorId: parseNumeric(req.user?.id) ?? null,
    roles: Array.isArray(req.user?.roles) ? req.user.roles : [],
  };
}

export async function referenceData(req, res) {
  const data = getReferenceData();
  res.json(data);
}

export async function list(req, res) {
  const { workspaceId, status, search, page, pageSize } = req.query ?? {};
  const payload = {
    workspaceId: parseNumeric(workspaceId),
    status: status ?? undefined,
    search: search ?? undefined,
    page: page != null ? Number(page) : undefined,
    pageSize: pageSize != null ? Number(pageSize) : undefined,
  };
  const result = await listCampaigns(payload, buildActor(req));
  res.json(result);
}

export async function create(req, res) {
  const body = { ...req.body };
  body.workspaceId = parseNumeric(body.workspaceId);
  body.ownerId = body.ownerId != null ? parseNumeric(body.ownerId) : undefined;
  const campaign = await createCampaign(body, buildActor(req));
  res.status(201).json(campaign);
}

export async function update(req, res) {
  const campaignId = parseNumeric(req.params?.campaignId);
  const body = { ...req.body };
  body.workspaceId = body.workspaceId != null ? parseNumeric(body.workspaceId) : undefined;
  const campaign = await updateCampaign(campaignId, body, buildActor(req));
  res.json(campaign);
}

export async function detail(req, res) {
  const campaignId = parseNumeric(req.params?.campaignId);
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const result = await getCampaign(campaignId, { workspaceId }, buildActor(req));
  res.json(result);
}

export async function createCreativeHandler(req, res) {
  const campaignId = parseNumeric(req.params?.campaignId);
  const body = { ...req.body };
  body.workspaceId = body.workspaceId != null ? parseNumeric(body.workspaceId) : undefined;
  const creative = await createCreative(campaignId, body, buildActor(req));
  res.status(201).json(creative);
}

export async function updateCreativeHandler(req, res) {
  const creativeId = parseNumeric(req.params?.creativeId);
  const body = { ...req.body };
  body.workspaceId = body.workspaceId != null ? parseNumeric(body.workspaceId) : undefined;
  const creative = await updateCreative(creativeId, body, buildActor(req));
  res.json(creative);
}

export async function createPlacementHandler(req, res) {
  const campaignId = parseNumeric(req.params?.campaignId);
  const body = { ...req.body };
  body.workspaceId = body.workspaceId != null ? parseNumeric(body.workspaceId) : undefined;
  body.creativeId = parseNumeric(body.creativeId);
  const placement = await createPlacement(campaignId, body, buildActor(req));
  res.status(201).json(placement);
}

export async function updatePlacementHandler(req, res) {
  const placementId = parseNumeric(req.params?.placementId);
  const body = { ...req.body };
  body.workspaceId = body.workspaceId != null ? parseNumeric(body.workspaceId) : undefined;
  const placement = await updatePlacement(placementId, body, buildActor(req));
  res.json(placement);
}

export default {
  referenceData,
  list,
  create,
  update,
  detail,
  createCreative: createCreativeHandler,
  updateCreative: updateCreativeHandler,
  createPlacement: createPlacementHandler,
  updatePlacement: updatePlacementHandler,
};
