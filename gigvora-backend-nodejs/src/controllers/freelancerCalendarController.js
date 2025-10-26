import {
  listFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
  exportFreelancerCalendarEventInvite,
} from '../services/freelancerCalendarService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function requireActorId(req) {
  const actorId = parsePositiveInteger(
    req.user?.id ?? req.user?.userId ?? req.body?.actorId ?? req.query?.actorId,
  );
  if (!actorId) {
    throw new AuthorizationError('An authenticated actor is required for calendar changes.');
  }
  return actorId;
}

export async function listCalendarEvents(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
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
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  const actorId = requireActorId(req);
  const event = await createFreelancerCalendarEvent(freelancerId, req.body ?? {}, { actorId });
  res.status(201).json(event);
}

export async function updateCalendarEvent(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  const eventId = parsePositiveInteger(req.params?.eventId);
  if (!freelancerId || !eventId) {
    throw new ValidationError('Valid freelancerId and eventId are required.');
  }
  const actorId = requireActorId(req);
  const event = await updateFreelancerCalendarEvent(eventId, req.body ?? {}, { freelancerId, actorId });
  res.json(event);
}

export async function deleteCalendarEvent(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  const eventId = parsePositiveInteger(req.params?.eventId);
  if (!freelancerId || !eventId) {
    throw new ValidationError('Valid freelancerId and eventId are required.');
  }
  const actorId = requireActorId(req);
  await deleteFreelancerCalendarEvent(eventId, { freelancerId, actorId });
  res.status(204).send();
}

export async function downloadCalendarEventInvite(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId);
  const eventId = parsePositiveInteger(req.params?.eventId);
  if (!freelancerId || !eventId) {
    throw new ValidationError('Valid freelancerId and eventId are required.');
  }
  const actorId = requireActorId(req);
  const { ics, filename } = await exportFreelancerCalendarEventInvite(eventId, {
    freelancerId,
    actorId,
  });
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(ics);
}

export default {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  downloadCalendarEventInvite,
};
