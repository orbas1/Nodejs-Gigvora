import adminTimelineService from '../services/adminTimelineService.js';
import { ValidationError } from '../utils/errors.js';

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
  const actorId = req.user?.id ?? null;
  const timeline = await adminTimelineService.createTimeline(req.body ?? {}, { actorId });
  res.status(201).json(timeline);
}

export async function update(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const actorId = req.user?.id ?? null;
  const timeline = await adminTimelineService.updateTimeline(timelineId, req.body ?? {}, { actorId });
  res.json(timeline);
}

export async function destroy(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  await adminTimelineService.deleteTimeline(timelineId);
  res.status(204).send();
}

export async function storeEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const event = await adminTimelineService.createTimelineEvent(timelineId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const eventId = parseId(req.params.eventId, 'eventId');
  const event = await adminTimelineService.updateTimelineEvent(timelineId, eventId, req.body ?? {});
  res.json(event);
}

export async function destroyEvent(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const eventId = parseId(req.params.eventId, 'eventId');
  await adminTimelineService.deleteTimelineEvent(timelineId, eventId);
  res.status(204).send();
}

export async function reorderEvents(req, res) {
  const timelineId = parseId(req.params.timelineId, 'timelineId');
  const orderedIds = req.body?.order ?? [];
  const timeline = await adminTimelineService.reorderTimelineEvents(timelineId, orderedIds);
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
