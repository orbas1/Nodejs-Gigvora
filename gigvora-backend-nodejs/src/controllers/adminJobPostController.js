import {
  listJobPosts,
  getJobPost,
  createJobPost,
  updateJobPost,
  publishJobPost,
  archiveJobPost,
  deleteJobPost,
} from '../services/adminJobPostService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor } from '../utils/adminRequestContext.js';

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
  const actor = extractAdminActor(req);
  const payload = await createJobPost(
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
    { actorId: actor.actorId },
  );
  logger.info({ actor: actor.reference, jobPostId: payload?.id ?? payload?.slug }, 'Admin job post created');
  res.status(201).json(payload);
}

export async function update(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const actor = extractAdminActor(req);
  const payload = await updateJobPost(
    identifier,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    { actorId: actor.actorId },
  );
  logger.info({ actor: actor.reference, jobPostId: identifier }, 'Admin job post updated');
  res.json(payload);
}

export async function publish(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const actor = extractAdminActor(req);
  const payload = await publishJobPost(identifier, {
    actorId: actor.actorId,
    publishedAt: req.body?.publishedAt ?? null,
  });
  logger.info({ actor: actor.reference, jobPostId: identifier }, 'Admin job post published');
  res.json(payload);
}

export async function archive(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const actor = extractAdminActor(req);
  const payload = await archiveJobPost(identifier, {
    actorId: actor.actorId,
    reason: req.body?.reason ?? null,
  });
  logger.info({ actor: actor.reference, jobPostId: identifier }, 'Admin job post archived');
  res.json(payload);
}

export async function destroy(req, res) {
  const identifier = parseIdentifier(req.params?.postId);
  const hardDelete = parseBoolean(req.query?.hardDelete ?? req.query?.hard);
  const actor = extractAdminActor(req);
  const payload = await deleteJobPost(identifier, { hardDelete });
  if (hardDelete) {
    logger.info({ actor: actor.reference, jobPostId: identifier }, 'Admin job post deleted');
    res.status(204).send();
    return;
  }
  logger.info({ actor: actor.reference, jobPostId: identifier }, 'Admin job post soft deleted');
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
