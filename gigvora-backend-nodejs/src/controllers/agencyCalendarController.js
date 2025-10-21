import {
  listAgencyCalendarEvents,
  getAgencyCalendarEvent,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
} from '../services/agencyCalendarService.js';
import {
  buildAgencyActorContext,
  ensurePlainObject,
  mergeDefined,
  toOptionalString,
  toRequiredString,
} from '../utils/controllerUtils.js';
import { resolveWorkspaceIdentifiersFromRequest } from '../utils/agencyWorkspaceAccess.js';

function normaliseTypes(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const candidates = Array.isArray(value) ? value : `${value}`.split(',');
  const results = [];
  const seen = new Set();
  for (const entry of candidates) {
    const text = `${entry}`.trim();
    if (!text) {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(key);
  }
  return results.length ? results : undefined;
}

function normaliseQuery(req) {
  const identifiers = resolveWorkspaceIdentifiersFromRequest(req, {}, { required: true });
  const types = normaliseTypes(req.query?.types);
  const status = toOptionalString(req.query?.status, { fieldName: 'status', maxLength: 40, lowercase: true });
  const from = toOptionalString(req.query?.from, { fieldName: 'from', maxLength: 40 });
  const to = toOptionalString(req.query?.to, { fieldName: 'to', maxLength: 40 });
  return mergeDefined(identifiers, { types, status, from, to });
}

function normaliseBody(req, body = {}) {
  const payload = ensurePlainObject(body, 'body');
  const identifiers = resolveWorkspaceIdentifiersFromRequest(req, payload, { required: true });
  return mergeDefined(payload, identifiers);
}

export async function index(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = normaliseQuery(req);
  const result = await listAgencyCalendarEvents(payload, actor);
  res.json(result);
}

export async function show(req, res) {
  const actor = buildAgencyActorContext(req);
  const eventId = toRequiredString(req.params?.eventId, { fieldName: 'eventId', maxLength: 80 });
  const payload = resolveWorkspaceIdentifiersFromRequest(req, {}, { required: true });
  const result = await getAgencyCalendarEvent(eventId, payload, actor);
  res.json(result);
}

export async function store(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = normaliseBody(req, req.body ?? {});
  const result = await createAgencyCalendarEvent(payload, actor);
  res.status(201).json(result);
}

export async function update(req, res) {
  const actor = buildAgencyActorContext(req);
  const eventId = toRequiredString(req.params?.eventId, { fieldName: 'eventId', maxLength: 80 });
  const payload = normaliseBody(req, req.body ?? {});
  const result = await updateAgencyCalendarEvent(eventId, payload, actor);
  res.json(result);
}

export async function destroy(req, res) {
  const actor = buildAgencyActorContext(req);
  const eventId = toRequiredString(req.params?.eventId, { fieldName: 'eventId', maxLength: 80 });
  const payload = resolveWorkspaceIdentifiersFromRequest(req, req.body ?? {}, { required: true });
  const result = await deleteAgencyCalendarEvent(eventId, payload, actor);
  res.json(result);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};
