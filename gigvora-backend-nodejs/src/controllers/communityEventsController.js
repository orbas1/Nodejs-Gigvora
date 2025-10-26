import {
  listCommunityCalendar,
  getCommunityEvent,
  getVolunteerRoster,
} from '../services/communityEventsService.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value == null) {
    return false;
  }
  const normalised = String(value).trim().toLowerCase();
  if (!normalised) {
    return false;
  }
  return ['true', '1', 'yes', 'y', 'on'].includes(normalised);
}

export async function calendar(req, res) {
  const membershipRoles = Array.isArray(req.user?.memberships)
    ? req.user.memberships
        .map((membership) => membership.role)
        .filter(Boolean)
        .map((role) => String(role).toLowerCase())
    : undefined;

  const payload = await listCommunityCalendar({
    limit: req.query.limit,
    timezone: req.query.timezone,
    volunteerOnly: parseBoolean(req.query.volunteerOnly),
    focus: req.query.focus,
    persona: req.query.persona,
    location: req.query.location,
    membershipRoles,
    userId: req.user?.id ?? null,
  });

  res.json(payload);
}

export async function show(req, res) {
  const payload = await getCommunityEvent(req.params.eventId, {
    timezone: req.query.timezone,
  });

  res.json(payload);
}

export async function volunteers(req, res) {
  const payload = await getVolunteerRoster({
    limit: req.query.limit,
    focus: req.query.focus,
    status: req.query.status,
    availability: req.query.availability,
  });

  res.json(payload);
}

export default {
  calendar,
  show,
  volunteers,
};
