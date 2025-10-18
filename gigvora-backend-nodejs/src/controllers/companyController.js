import { getCompanyDashboard } from '../services/companyDashboardService.js';
import {
  getTimelineManagementSnapshot,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  changeTimelinePostStatus,
  deleteTimelinePost,
  recordTimelinePostMetrics,
} from '../services/companyTimelineService.js';
import { ValidationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveWorkspaceId(req) {
  const candidates = [
    req.body?.workspaceId,
    req.query?.workspaceId,
    req.params?.workspaceId,
    req.body?.workspace_id,
  ];
  for (const candidate of candidates) {
    const parsed = parseNumber(candidate);
    if (parsed != null) {
      return parsed;
    }
  }
  throw new ValidationError('workspaceId is required.');
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getCompanyDashboard(payload);
  res.json(result);
}

export async function timeline(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const lookbackDays = parseNumber(req.query?.lookbackDays ?? req.body?.lookbackDays);
  const snapshot = await getTimelineManagementSnapshot({ workspaceId, lookbackDays });
  res.json(snapshot);
}

export async function storeTimelineEvent(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = parseNumber(req.body?.actorId ?? req.user?.id);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const event = await createTimelineEvent({ workspaceId, actorId, payload });
  res.status(201).json(event);
}

export async function updateTimelineEventController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const eventId = parseNumber(req.params?.eventId);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const event = await updateTimelineEvent(eventId, { workspaceId, payload });
  res.json(event);
}

export async function destroyTimelineEvent(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const eventId = parseNumber(req.params?.eventId);
  await deleteTimelineEvent(eventId, { workspaceId });
  res.status(204).send();
}

export async function storeTimelinePost(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = parseNumber(req.body?.actorId ?? req.user?.id);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const post = await createTimelinePost({ workspaceId, actorId, payload });
  res.status(201).json(post);
}

export async function updateTimelinePostController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const payload = { ...req.body };
  delete payload.workspaceId;
  delete payload.actorId;
  const post = await updateTimelinePost(postId, { workspaceId, payload });
  res.json(post);
}

export async function changeTimelinePostStatusController(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const status = req.body?.status;
  const publishedAt = req.body?.publishedAt;
  const scheduledFor = req.body?.scheduledFor;
  const post = await changeTimelinePostStatus(postId, {
    workspaceId,
    status,
    publishedAt,
    scheduledFor,
  });
  res.json(post);
}

export async function destroyTimelinePost(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  await deleteTimelinePost(postId, { workspaceId });
  res.status(204).send();
}

export async function recordTimelineMetrics(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const postId = parseNumber(req.params?.postId);
  const metricDate = req.body?.metricDate;
  const metrics = req.body?.metrics ?? req.body;
  const metadata = req.body?.metadata;
  const result = await recordTimelinePostMetrics(postId, {
    workspaceId,
    metricDate,
    metrics,
    metadata,
  });
  res.status(201).json(result);
}

export default {
  dashboard,
  timeline,
  storeTimelineEvent,
  updateTimelineEvent: updateTimelineEventController,
  destroyTimelineEvent,
  storeTimelinePost,
  updateTimelinePost: updateTimelinePostController,
  changeTimelinePostStatus: changeTimelinePostStatusController,
  destroyTimelinePost,
  recordTimelineMetrics,
};

