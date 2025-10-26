import {
  getHuddleContext,
  listRecommendedParticipants,
  createHuddle,
  scheduleHuddle,
  requestInstantHuddle,
} from '../services/huddleService.js';
import { ValidationError } from '../utils/errors.js';

function parseLimit(value, fallback) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return parsed;
}

export async function context(req, res) {
  const result = await getHuddleContext({
    workspaceId: req.query?.workspaceId,
    projectId: req.query?.projectId,
  });
  res.json(result);
}

export async function recommended(req, res) {
  const limit = parseLimit(req.query?.limit, 6);
  const participants = await listRecommendedParticipants({
    workspaceId: req.query?.workspaceId,
    projectId: req.query?.projectId,
    limit,
  });
  res.json({ items: participants });
}

export async function store(req, res) {
  const huddle = await createHuddle(req.body ?? {}, { actorId: req.user?.id ?? null });
  res.status(201).json(huddle);
}

export async function schedule(req, res) {
  const huddle = await scheduleHuddle(req.params?.huddleId, req.body ?? {}, { actorId: req.user?.id ?? null });
  res.json(huddle);
}

export async function launch(req, res) {
  const huddle = await requestInstantHuddle(req.body ?? {}, { actorId: req.user?.id ?? null });
  res.status(201).json(huddle);
}

export default {
  context,
  recommended,
  store,
  schedule,
  launch,
};
