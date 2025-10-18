import { apiClient } from './apiClient.js';

function assertFreelancerId(freelancerId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required for calendar operations.');
  }
}

function toIso(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function formatList(value) {
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value;
}

export function fetchFreelancerCalendarEvents(freelancerId, options = {}) {
  assertFreelancerId(freelancerId);
  const {
    startDate,
    endDate,
    types,
    statuses,
    limit,
    lookbackDays,
    lookaheadDays,
  } = options;

  return apiClient.get(`/freelancer/${freelancerId}/calendar/events`, {
    params: {
      start: toIso(startDate),
      end: toIso(endDate),
      types: formatList(types),
      statuses: formatList(statuses),
      limit: limit ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
      lookaheadDays: lookaheadDays ?? undefined,
    },
  });
}

export function createFreelancerCalendarEvent(freelancerId, payload, { actorId } = {}) {
  assertFreelancerId(freelancerId);
  const body = {
    ...payload,
    startsAt: toIso(payload?.startsAt),
    endsAt: toIso(payload?.endsAt),
    actorId: actorId ?? payload?.actorId ?? undefined,
  };

  return apiClient.post(`/freelancer/${freelancerId}/calendar/events`, body);
}

export function updateFreelancerCalendarEvent(freelancerId, eventId, payload, { actorId } = {}) {
  assertFreelancerId(freelancerId);
  if (!eventId) {
    throw new Error('eventId is required to update a calendar event.');
  }
  const body = {
    ...payload,
    startsAt: payload?.startsAt ? toIso(payload.startsAt) : undefined,
    endsAt: payload?.endsAt ? toIso(payload.endsAt) : undefined,
    actorId: actorId ?? payload?.actorId ?? undefined,
  };
  return apiClient.put(`/freelancer/${freelancerId}/calendar/events/${eventId}`, body);
}

export function deleteFreelancerCalendarEvent(freelancerId, eventId, { actorId } = {}) {
  assertFreelancerId(freelancerId);
  if (!eventId) {
    throw new Error('eventId is required to delete a calendar event.');
  }
  return apiClient.delete(`/freelancer/${freelancerId}/calendar/events/${eventId}`, {
    data: actorId ? { actorId } : undefined,
  });
}

export default {
  fetchFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
};
