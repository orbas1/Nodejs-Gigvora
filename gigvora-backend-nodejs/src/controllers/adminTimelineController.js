import adminTimelineService from '../services/adminTimelineService.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor } from '../utils/adminRequestContext.js';

function parseId(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive integer.`);
  }
  return parsed;
}

export async function index(req, res) {
  const payload = await adminTimelineService.listTimelines(req.query ?? {});
  res.json(payload);
}

export async function show(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const timeline = await adminTimelineService.getTimeline(timelineId);
  res.json(timeline);
}

export async function store(req, res) {
  const actor = extractAdminActor(req);
  const timeline = await adminTimelineService.createTimeline(
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
    { actorId: actor.actorId },
  );
  logger.info({ actor: actor.reference, timelineId: timeline?.id }, 'Admin timeline created');
  res.status(201).json(timeline);
}

export async function update(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const actor = extractAdminActor(req);
  const timeline = await adminTimelineService.updateTimeline(
    timelineId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    { actorId: actor.actorId },
  );
  logger.info({ actor: actor.reference, timelineId }, 'Admin timeline updated');
  res.json(timeline);
}

export async function destroy(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  await adminTimelineService.deleteTimeline(timelineId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, timelineId }, 'Admin timeline deleted');
  res.status(204).send();
}

export async function storeEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const actor = extractAdminActor(req);
  const event = await adminTimelineService.createTimelineEvent(
    timelineId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, timelineId, eventId: event?.id }, 'Admin timeline event created');
  res.status(201).json(event);
}

export async function updateEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const eventId = parseId(req.params.eventId, 'eventId');
  const actor = extractAdminActor(req);
  const event = await adminTimelineService.updateTimelineEvent(
    timelineId,
    eventId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, timelineId, eventId }, 'Admin timeline event updated');
  res.json(event);
}

export async function destroyEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const eventId = parseId(req.params.eventId, 'eventId');
  await adminTimelineService.deleteTimelineEvent(timelineId, eventId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, timelineId, eventId }, 'Admin timeline event deleted');
  res.status(204).send();
}

export async function reorderEvents(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const orderedIds = req.body?.order ?? [];
  const timeline = await adminTimelineService.reorderTimelineEvents(timelineId, orderedIds);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, timelineId, eventOrderCount: orderedIds.length }, 'Admin timeline events reordered');
  res.json(timeline);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  storeEvent,
  updateEvent,
  destroyEvent,
  reorderEvents,
};
