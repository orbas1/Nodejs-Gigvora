import {
  listAgencyCalendarEvents,
  getAgencyCalendarEvent,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
} from '../services/agencyCalendarService.js';

function parseNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseTypes(value) {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? req.user?.roles?.[0] ?? null,
  };
}

export async function index(req, res) {
  const { workspaceId, workspaceSlug, types, status, from, to } = req.query ?? {};

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    types: parseTypes(types),
    status: status ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  };

  const result = await listAgencyCalendarEvents(payload, buildContext(req));
  res.json(result);
}

export async function show(req, res) {
  const { eventId } = req.params;
  const { workspaceId, workspaceSlug } = req.query ?? {};

  const result = await getAgencyCalendarEvent(
    eventId,
    {
      workspaceId: parseNumber(workspaceId),
      workspaceSlug: workspaceSlug ?? undefined,
    },
    buildContext(req),
  );

  res.json(result);
}

export async function store(req, res) {
  const payload = {
    ...req.body,
    workspaceId: parseNumber(req.body?.workspaceId ?? req.query?.workspaceId) ?? undefined,
    workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? undefined,
  };

  const result = await createAgencyCalendarEvent(payload, buildContext(req));
  res.status(201).json(result);
}

export async function update(req, res) {
  const { eventId } = req.params;
  const payload = {
    ...req.body,
    workspaceId: parseNumber(req.body?.workspaceId ?? req.query?.workspaceId) ?? undefined,
    workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? undefined,
  };

  const result = await updateAgencyCalendarEvent(eventId, payload, buildContext(req));
  res.json(result);
}

export async function destroy(req, res) {
  const { eventId } = req.params;
  const payload = {
    workspaceId: parseNumber(req.body?.workspaceId ?? req.query?.workspaceId) ?? undefined,
    workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? undefined,
  };

  const result = await deleteAgencyCalendarEvent(eventId, payload, buildContext(req));
  res.json(result);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};

