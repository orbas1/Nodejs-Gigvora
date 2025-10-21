import {
  getVolunteeringDashboard,
  createVolunteeringPost,
  updateVolunteeringPost,
  deleteVolunteeringPost,
  createVolunteeringApplication,
  updateVolunteeringApplication,
  deleteVolunteeringApplication,
  createVolunteeringResponse,
  updateVolunteeringResponse,
  deleteVolunteeringResponse,
  scheduleVolunteeringInterview,
  updateVolunteeringInterview,
  deleteVolunteeringInterview,
  createVolunteeringContract,
  updateVolunteeringContract,
  addVolunteeringSpend,
  updateVolunteeringSpend,
  deleteVolunteeringSpend,
} from '../services/volunteeringManagementService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function resolveActorContext(req) {
  const actorIdFromAuth = resolveRequestUserId(req);
  const fallback = req.user?.userId ?? null;
  const explicit = req.body?.actorId ?? req.query?.actorId ?? fallback;
  const actorId = Number.parseInt(explicit ?? actorIdFromAuth ?? fallback, 10);
  const validActorId = Number.isInteger(actorId) && actorId > 0 ? actorId : actorIdFromAuth ?? fallback ?? null;
  const actorRoles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((role) => `${role}`.trim().toLowerCase()).filter(Boolean)
    : [];
  return { actorId: validActorId ?? null, actorRoles };
}

function resolveWorkspaceContext(req) {
  const workspaceId =
    req.body?.workspaceId ?? req.query?.workspaceId ?? req.params?.workspaceId ?? undefined;
  const workspaceSlug =
    req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? req.params?.workspaceSlug ?? undefined;
  return { workspaceId, workspaceSlug };
}

function normaliseLookbackDays(value) {
  if (value == null) {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return undefined;
  }
  return Math.min(Math.max(numeric, 7), 365);
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const result = await getVolunteeringDashboard({
    workspaceId,
    workspaceSlug,
    lookbackDays: normaliseLookbackDays(lookbackDays),
  });
  res.json(result);
}

export async function createPost(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const post = await createVolunteeringPost({
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.status(201).json({ post });
}

export async function updatePost(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { postId } = req.params;
  const post = await updateVolunteeringPost({
    postId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.json({ post });
}

export async function removePost(req, res) {
  const { workspaceId, workspaceSlug } = { ...resolveWorkspaceContext(req), ...req.body };
  const { postId } = req.params;
  await deleteVolunteeringPost({ postId, workspaceId, workspaceSlug });
  res.status(204).end();
}

export async function createApplication(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { postId } = req.params;
  const application = await createVolunteeringApplication({
    postId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.status(201).json({ application });
}

export async function updateApplication(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { applicationId } = req.params;
  const application = await updateVolunteeringApplication({
    applicationId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.json({ application });
}

export async function removeApplication(req, res) {
  const { workspaceId, workspaceSlug } = { ...resolveWorkspaceContext(req), ...req.body };
  const { applicationId } = req.params;
  await deleteVolunteeringApplication({ applicationId, workspaceId, workspaceSlug });
  res.status(204).end();
}

export async function createResponse(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { applicationId } = req.params;
  const application = await createVolunteeringResponse({ applicationId, workspaceId, workspaceSlug, payload });
  res.status(201).json({ application });
}

export async function updateResponse(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { responseId } = req.params;
  const application = await updateVolunteeringResponse({ responseId, workspaceId, workspaceSlug, payload });
  res.json({ application });
}

export async function removeResponse(req, res) {
  const { workspaceId, workspaceSlug } = { ...resolveWorkspaceContext(req), ...req.body };
  const { responseId } = req.params;
  const application = await deleteVolunteeringResponse({ responseId, workspaceId, workspaceSlug });
  res.json({ application });
}

export async function createInterview(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { applicationId } = req.params;
  const application = await scheduleVolunteeringInterview({
    applicationId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.status(201).json({ application });
}

export async function updateInterview(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { interviewId } = req.params;
  const application = await updateVolunteeringInterview({
    interviewId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.json({ application });
}

export async function removeInterview(req, res) {
  const { workspaceId, workspaceSlug } = { ...resolveWorkspaceContext(req), ...req.body };
  const { interviewId } = req.params;
  const application = await deleteVolunteeringInterview({ interviewId, workspaceId, workspaceSlug });
  res.json({ application });
}

export async function createContract(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { applicationId } = req.params;
  const application = await createVolunteeringContract({
    applicationId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.status(201).json({ application });
}

export async function updateContract(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { contractId } = req.params;
  const application = await updateVolunteeringContract({
    contractId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.json({ application });
}

export async function addSpend(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { contractId } = req.params;
  const application = await addVolunteeringSpend({
    contractId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.status(201).json({ application });
}

export async function updateSpend(req, res) {
  const { workspaceId, workspaceSlug, ...payload } = req.body ?? {};
  const { spendId } = req.params;
  const application = await updateVolunteeringSpend({
    spendId,
    workspaceId,
    workspaceSlug,
    payload,
    ...resolveActorContext(req),
  });
  res.json({ application });
}

export async function removeSpend(req, res) {
  const { workspaceId, workspaceSlug } = { ...resolveWorkspaceContext(req), ...req.body };
  const { spendId } = req.params;
  const application = await deleteVolunteeringSpend({ spendId, workspaceId, workspaceSlug });
  res.json({ application });
}

export default {
  dashboard,
  createPost,
  updatePost,
  removePost,
  createApplication,
  updateApplication,
  removeApplication,
  createResponse,
  updateResponse,
  removeResponse,
  createInterview,
  updateInterview,
  removeInterview,
  createContract,
  updateContract,
  addSpend,
  updateSpend,
  removeSpend,
};
