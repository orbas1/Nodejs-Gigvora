import {
  getModerationOverview,
  listModerationQueue,
  listModerationEvents,
  resolveModerationEvent,
} from '../services/communityModerationService.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';
import { ApplicationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function parseListParam(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return undefined;
}

export async function overview(req, res) {
  const days = Number.parseInt(req.query.days, 10) || 7;
  const overview = await getModerationOverview({ days });
  res.json(overview);
}

export async function queue(req, res) {
  const severities = parseListParam(req.query.severities);
  const channels = parseListParam(req.query.channels);
  const status = parseListParam(req.query.status);
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 25;
  const search = req.query.search ? String(req.query.search).trim() : undefined;

  const queueResponse = await listModerationQueue({
    page,
    pageSize,
    severities,
    channels,
    status,
    search,
  });
  res.json(queueResponse);
}

export async function events(req, res) {
  const status = parseListParam(req.query.status);
  const actorId = req.query.actorId ? Number.parseInt(req.query.actorId, 10) : undefined;
  const channelSlug = req.query.channelSlug ? String(req.query.channelSlug).trim() : undefined;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 50;

  const eventsResponse = await listModerationEvents({
    page,
    pageSize,
    status,
    actorId,
    channelSlug,
  });
  res.json(eventsResponse);
}

export async function resolve(req, res) {
  const eventId = coercePositiveInteger(req.params?.eventId, 'eventId');
  const actor = extractAdminActor(req);
  const payload = {
    status: req.body?.status,
    resolvedBy: actor.actorId,
    resolutionNotes: req.body?.notes,
  };
  const event = await resolveModerationEvent(eventId, payload);
  if (!event) {
    throw new ApplicationError('Moderation event not found.');
  }
  logger.info({ actor: actor.reference, eventId, status: payload.status }, 'Admin moderation event resolved');
  res.json(event);
}

