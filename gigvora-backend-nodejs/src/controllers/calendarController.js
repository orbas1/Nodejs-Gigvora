import calendarService from '../services/calendarService.js';
import { getCalendarSyncStatus, triggerCalendarSync } from '../services/calendarSyncService.js';

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

export async function downloadEventInvite(req, res) {
  const { ics, filename } = await calendarService.exportEventAsICalendar(
    Number(req.params.id),
    Number(req.params.eventId),
  );
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(ics);
}

export async function downloadEventsFeed(req, res) {
  const { ics, filename, count } = await calendarService.exportEventsAsICalendar(
    Number(req.params.id),
    req.query ?? {},
  );
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Total-Events', String(count));
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

export async function getSyncStatus(req, res) {
  const status = await getCalendarSyncStatus(req.params.id);
  res.json(status);
}

export async function triggerSync(req, res) {
  const job = await triggerCalendarSync(req.params.id, { actorId: req.user?.id ?? null });
  res.status(202).json(job);
}

export default {
  getOverview,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  downloadEventInvite,
  downloadEventsFeed,
  listFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  getSettings,
  updateSettings,
  getSyncStatus,
  triggerSync,
};
