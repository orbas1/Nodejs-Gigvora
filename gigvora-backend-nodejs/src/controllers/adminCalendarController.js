import {
  getAdminCalendarConsole,
  createAdminCalendarAccount,
  updateAdminCalendarAccount,
  deleteAdminCalendarAccount,
  upsertAdminCalendarAvailability,
  createAdminCalendarTemplate,
  updateAdminCalendarTemplate,
  deleteAdminCalendarTemplate,
  createAdminCalendarEvent,
  updateAdminCalendarEvent,
  deleteAdminCalendarEvent,
} from '../services/adminCalendarService.js';

export async function fetchConsole(req, res) {
  const snapshot = await getAdminCalendarConsole(req.query ?? {});
  res.json(snapshot);
}

export async function createAccount(req, res) {
  const account = await createAdminCalendarAccount(req.body ?? {});
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const account = await updateAdminCalendarAccount(req.params.accountId, req.body ?? {});
  res.json(account);
}

export async function removeAccount(req, res) {
  await deleteAdminCalendarAccount(req.params.accountId);
  res.status(204).send();
}

export async function updateAvailability(req, res) {
  const result = await upsertAdminCalendarAvailability(req.params.accountId, req.body ?? {});
  res.json(result);
}

export async function createTemplate(req, res) {
  const template = await createAdminCalendarTemplate(req.body ?? {});
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const template = await updateAdminCalendarTemplate(req.params.templateId, req.body ?? {});
  res.json(template);
}

export async function removeTemplate(req, res) {
  await deleteAdminCalendarTemplate(req.params.templateId);
  res.status(204).send();
}

export async function createEvent(req, res) {
  const event = await createAdminCalendarEvent(req.body ?? {});
  res.status(201).json(event);
}

export async function updateEvent(req, res) {
  const event = await updateAdminCalendarEvent(req.params.eventId, req.body ?? {});
  res.json(event);
}

export async function removeEvent(req, res) {
  await deleteAdminCalendarEvent(req.params.eventId);
  res.status(204).send();
}

export default {
  fetchConsole,
  createAccount,
  updateAccount,
  removeAccount,
  updateAvailability,
  createTemplate,
  updateTemplate,
  removeTemplate,
  createEvent,
  updateEvent,
  removeEvent,
};
