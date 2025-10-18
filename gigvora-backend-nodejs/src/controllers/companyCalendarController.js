import {
  getCompanyCalendarState,
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
} from '../services/companyCalendarService.js';

export async function index(req, res) {
  const { workspaceId, workspaceSlug, from, to, types, limit, search } = req.query ?? {};

  const payload = {
    workspaceId,
    workspaceSlug,
    from,
    to,
    types,
    limit,
    search,
    actor: req.user ?? null,
  };

  const result = await getCompanyCalendarState(payload);
  res.json(result);
}

export async function store(req, res) {
  const { workspaceId, workspaceSlug, title, eventType, startsAt, endsAt, location, metadata } = req.body ?? {};

  const result = await createCompanyCalendarEvent({
    workspaceId,
    workspaceSlug,
    title,
    eventType,
    startsAt,
    endsAt,
    location,
    metadata,
    actor: req.user ?? null,
  });

  res.status(201).json(result);
}

export async function update(req, res) {
  const { eventId } = req.params ?? {};
  const payload = { ...req.body };

  const result = await updateCompanyCalendarEvent({
    eventId: Number(eventId),
    payload,
    actor: req.user ?? null,
  });

  res.json(result);
}

export async function destroy(req, res) {
  const { eventId } = req.params ?? {};

  const result = await deleteCompanyCalendarEvent({
    eventId: Number(eventId),
    actor: req.user ?? null,
  });

  if (result?.deleted) {
    res.status(204).send();
    return;
  }

  res.status(200).json(result ?? { deleted: false });
}

export default {
  index,
  store,
  update,
  destroy,
};
