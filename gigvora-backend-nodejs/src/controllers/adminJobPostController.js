import {
  listJobPosts,
  getJobPost,
  createJobPost,
  updateJobPost,
  publishJobPost,
  archiveJobPost,
  deleteJobPost,
} from '../services/adminJobPostService.js';

function parseIdentifier(value) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && `${numeric}` === `${value}`.trim()) {
    return numeric;
  }
  return `${value}`.trim();
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

export async function list(req, res) {
  const { status, workflowStage, visibility, search, page, pageSize } = req.query ?? {};
  const payload = await listJobPosts({ status, workflowStage, visibility, search, page, pageSize });
  res.json(payload);
}

export async function retrieve(req, res) {
  const identifier = parseIdentifier(req.params?.postId ?? req.params?.identifier);
  const payload = await getJobPost(identifier);
  res.json(payload);
}

export async function create(req, res) {
  const { id: actorId } = req.user ?? {};
  const payload = await createJobPost(req.body ?? {}, { actorId });
  res.status(201).json(payload);
}

export async function update(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const { id: actorId } = req.user ?? {};
  const payload = await updateJobPost(identifier, req.body ?? {}, { actorId });
  res.json(payload);
}

export async function publish(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const { id: actorId } = req.user ?? {};
  const payload = await publishJobPost(identifier, { actorId, publishedAt: req.body?.publishedAt });
  res.json(payload);
}

export async function archive(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const { id: actorId } = req.user ?? {};
  const payload = await archiveJobPost(identifier, { actorId, reason: req.body?.reason });
  res.json(payload);
}

export async function destroy(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const hardDelete = parseBoolean(req.query?.hardDelete ?? req.query?.hard);
  const payload = await deleteJobPost(identifier, { hardDelete });
  if (hardDelete) {
    res.status(204).send();
    return;
  }
  res.json(payload);
}

export default {
  list,
  retrieve,
  create,
  update,
  publish,
  archive,
  destroy,
};
