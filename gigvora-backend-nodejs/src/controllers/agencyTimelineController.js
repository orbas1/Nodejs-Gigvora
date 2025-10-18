import {
  getTimelineDashboard,
  listTimelinePosts,
  getTimelinePost,
  createTimelinePost,
  updateTimelinePost,
  updateTimelinePostStatus,
  deleteTimelinePost,
  getTimelinePostAnalytics,
} from '../services/agencyTimelineService.js';

function extractActor(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? null,
  };
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const result = await getTimelineDashboard(
    { workspaceId, workspaceSlug, lookbackDays },
    extractActor(req),
  );
  res.json(result);
}

export async function index(req, res) {
  const { workspaceId, workspaceSlug, status, search, limit, offset, lookbackDays } = req.query ?? {};
  const result = await listTimelinePosts(
    { workspaceId, workspaceSlug, status, search, limit: limit ? Number(limit) : undefined, offset: offset ? Number(offset) : undefined, lookbackDays },
    extractActor(req),
  );
  res.json(result);
}

export async function show(req, res) {
  const { postId } = req.params;
  const result = await getTimelinePost(Number(postId), extractActor(req));
  res.json(result);
}

export async function create(req, res) {
  const payload = { ...req.body, workspaceId: req.body.workspaceId ?? req.query?.workspaceId };
  const result = await createTimelinePost(payload, extractActor(req));
  res.status(201).json(result);
}

export async function update(req, res) {
  const { postId } = req.params;
  const result = await updateTimelinePost(Number(postId), req.body, extractActor(req));
  res.json(result);
}

export async function updateStatus(req, res) {
  const { postId } = req.params;
  const result = await updateTimelinePostStatus(Number(postId), req.body, extractActor(req));
  res.json(result);
}

export async function destroy(req, res) {
  const { postId } = req.params;
  const result = await deleteTimelinePost(Number(postId), extractActor(req));
  res.json(result);
}

export async function analytics(req, res) {
  const { postId } = req.params;
  const { lookbackDays } = req.query ?? {};
  const result = await getTimelinePostAnalytics(Number(postId), { lookbackDays }, extractActor(req));
  res.json(result);
}

export default {
  dashboard,
  index,
  show,
  create,
  update,
  updateStatus,
  destroy,
  analytics,
};
