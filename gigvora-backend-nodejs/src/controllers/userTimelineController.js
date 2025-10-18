import {
  getFreelancerTimelineWorkspace,
  saveTimelineSettings,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  publishTimelinePost,
  upsertTimelinePostMetrics,
} from '../services/freelancerTimelineService.js';
import { ValidationError } from '../utils/errors.js';

function parseId(value, fieldName) {
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function resolveActorId(req) {
  if (req.user?.id) {
    return Number.parseInt(req.user.id, 10) || null;
  }
  if (req.headers['x-user-id']) {
    const numeric = Number.parseInt(req.headers['x-user-id'], 10);
    if (Number.isInteger(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return null;
}

export async function getTimelineWorkspace(req, res) {
  const { id: userId } = req.params;
  const payload = await getFreelancerTimelineWorkspace({ freelancerId: parseId(userId, 'userId') });
  res.json(payload);
}

export async function updateTimelineSettings(req, res) {
  const { id: userId } = req.params;
  const settings = await saveTimelineSettings(parseId(userId, 'userId'), req.body ?? {});
  res.json(settings);
}

export async function createTimelineEntryController(req, res) {
  const { id: userId } = req.params;
  const actorId = resolveActorId(req);
  const entry = await createTimelineEntry(parseId(userId, 'userId'), req.body ?? {}, { actorId });
  res.status(201).json(entry);
}

export async function updateTimelineEntryController(req, res) {
  const { id: userId, entryId } = req.params;
  const actorId = resolveActorId(req);
  const entry = await updateTimelineEntry(parseId(userId, 'userId'), parseId(entryId, 'entryId'), req.body ?? {}, { actorId });
  res.json(entry);
}

export async function deleteTimelineEntryController(req, res) {
  const { id: userId, entryId } = req.params;
  const result = await deleteTimelineEntry(parseId(userId, 'userId'), parseId(entryId, 'entryId'));
  res.json(result);
}

export async function createTimelinePostController(req, res) {
  const { id: userId } = req.params;
  const actorId = resolveActorId(req);
  const post = await createTimelinePost(parseId(userId, 'userId'), req.body ?? {}, { actorId });
  res.status(201).json(post);
}

export async function updateTimelinePostController(req, res) {
  const { id: userId, postId } = req.params;
  const actorId = resolveActorId(req);
  const post = await updateTimelinePost(parseId(userId, 'userId'), parseId(postId, 'postId'), req.body ?? {}, { actorId });
  res.json(post);
}

export async function deleteTimelinePostController(req, res) {
  const { id: userId, postId } = req.params;
  const result = await deleteTimelinePost(parseId(userId, 'userId'), parseId(postId, 'postId'));
  res.json(result);
}

export async function publishTimelinePostController(req, res) {
  const { id: userId, postId } = req.params;
  const actorId = resolveActorId(req);
  const post = await publishTimelinePost(parseId(userId, 'userId'), parseId(postId, 'postId'), req.body ?? {}, { actorId });
  res.json(post);
}

export async function recordTimelinePostMetrics(req, res) {
  const { id: userId, postId } = req.params;
  const metric = await upsertTimelinePostMetrics(parseId(userId, 'userId'), parseId(postId, 'postId'), req.body ?? {});
  res.status(201).json(metric);
}

export default {
  getTimelineWorkspace,
  updateTimelineSettings,
  createTimelineEntry: createTimelineEntryController,
  updateTimelineEntry: updateTimelineEntryController,
  deleteTimelineEntry: deleteTimelineEntryController,
  createTimelinePost: createTimelinePostController,
  updateTimelinePost: updateTimelinePostController,
  deleteTimelinePost: deleteTimelinePostController,
  publishTimelinePost: publishTimelinePostController,
  recordTimelinePostMetrics,
};
