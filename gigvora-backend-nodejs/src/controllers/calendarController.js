import calendarService from '../services/calendarService.js';

export async function getOverview(req, res) {
  const overview = await calendarService.getOverview(Number(req.params.id), req.query ?? {});
  res.json(overview);
}

export async function listEvents(req, res) {
  const events = await calendarService.listEvents(Number(req.params.id), req.query ?? {});
  res.json({ items: events });
}

export async function createEvent(req, res) {
  const event = await calendarService.createEvent(Number(req.params.id), req.body ?? {});
  res.status(201).json(event);
}

export async function updateEvent(req, res) {
  const event = await calendarService.updateEvent(Number(req.params.id), Number(req.params.eventId), req.body ?? {});
  res.json(event);
}

export async function deleteEvent(req, res) {
  await calendarService.deleteEvent(Number(req.params.id), Number(req.params.eventId));
  res.status(204).send();
}

export async function exportEventsAsIcs(req, res) {
  const ics = await calendarService.exportEventsAsIcs(Number(req.params.id), req.query ?? {});
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="gigvora-events.ics"');
  res.send(ics);
}

export async function listFocusSessions(req, res) {
  const sessions = await calendarService.listFocusSessions(Number(req.params.id), req.query ?? {});
  res.json({ items: sessions });
}

export async function createFocusSession(req, res) {
  const session = await calendarService.createFocusSession(Number(req.params.id), req.body ?? {});
  res.status(201).json(session);
}

export async function updateFocusSession(req, res) {
  const session = await calendarService.updateFocusSession(
    Number(req.params.id),
    Number(req.params.focusSessionId),
    req.body ?? {},
  );
  res.json(session);
}

export async function deleteFocusSession(req, res) {
  await calendarService.deleteFocusSession(Number(req.params.id), Number(req.params.focusSessionId));
  res.status(204).send();
}

export async function getSettings(req, res) {
  const settings = await calendarService.getSettings(Number(req.params.id));
  res.json(settings);
}

export async function updateSettings(req, res) {
  const settings = await calendarService.updateSettings(Number(req.params.id), req.body ?? {});
  res.json(settings);
}

export default {
  getOverview,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  exportEventsAsIcs,
  listFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  getSettings,
  updateSettings,
};
