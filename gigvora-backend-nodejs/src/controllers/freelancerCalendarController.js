import {
  listFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
} from '../services/freelancerCalendarService.js';

function resolveActorId(req) {
  return req.user?.id ?? req.user?.userId ?? req.body?.actorId ?? null;
}

export async function listCalendarEvents(req, res) {
  const { freelancerId } = req.params;
  const {
    start,
    end,
    startDate,
    endDate,
    type,
    types,
    status,
    statuses,
    limit,
    lookbackDays,
    lookaheadDays,
  } = req.query ?? {};

  const response = await listFreelancerCalendarEvents(freelancerId, {
    startDate: start ?? startDate ?? null,
    endDate: end ?? endDate ?? null,
    types: types ?? type ?? null,
    statuses: statuses ?? status ?? null,
    limit,
    lookbackDays,
    lookaheadDays,
  });

  res.json(response);
}

export async function createCalendarEvent(req, res) {
  const { freelancerId } = req.params;
  const actorId = resolveActorId(req);
  const event = await createFreelancerCalendarEvent(freelancerId, req.body ?? {}, { actorId });
  res.status(201).json(event);
}

export async function updateCalendarEvent(req, res) {
  const { freelancerId, eventId } = req.params;
  const actorId = resolveActorId(req);
  const event = await updateFreelancerCalendarEvent(eventId, req.body ?? {}, { freelancerId, actorId });
  res.json(event);
}

export async function deleteCalendarEvent(req, res) {
  const { freelancerId, eventId } = req.params;
  const actorId = resolveActorId(req);
  await deleteFreelancerCalendarEvent(eventId, { freelancerId, actorId });
  res.status(204).send();
}

export default {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
