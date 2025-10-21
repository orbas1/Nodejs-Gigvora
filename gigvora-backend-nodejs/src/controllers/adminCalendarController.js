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
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor } from '../utils/adminRequestContext.js';

export async function fetchConsole(req, res) {
  const snapshot = await getAdminCalendarConsole(req.query ?? {});
  res.json(snapshot);
}

export async function createAccount(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    metadataKey: 'metadata',
    forceMetadata: true,
  });
  const account = await createAdminCalendarAccount(payload);
  logger.info({ actor: actor.reference, accountId: account?.id }, 'Admin calendar account created');
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    metadataKey: 'metadata',
  });
  const account = await updateAdminCalendarAccount(req.params.accountId, payload);
  logger.info({ actor: actor.reference, accountId: account?.id }, 'Admin calendar account updated');
  res.json(account);
}

export async function removeAccount(req, res) {
  await deleteAdminCalendarAccount(req.params.accountId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, accountId: req.params.accountId }, 'Admin calendar account deleted');
  res.status(204).send();
}

export async function updateAvailability(req, res) {
  const result = await upsertAdminCalendarAvailability(req.params.accountId, req.body ?? {});
  const actor = extractAdminActor(req);
  logger.info(
    { actor: actor.reference, accountId: req.params.accountId },
    'Admin calendar availability upserted',
  );
  res.json(result);
}

export async function createTemplate(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
    metadataKey: 'metadata',
    forceMetadata: true,
  });
  const template = await createAdminCalendarTemplate(payload);
  logger.info({ actor: actor.reference, templateId: template?.id }, 'Admin calendar template created');
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setUpdatedBy: true,
    metadataKey: 'metadata',
  });
  const template = await updateAdminCalendarTemplate(req.params.templateId, payload);
  logger.info({ actor: actor.reference, templateId: template?.id }, 'Admin calendar template updated');
  res.json(template);
}

export async function removeTemplate(req, res) {
  await deleteAdminCalendarTemplate(req.params.templateId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, templateId: req.params.templateId }, 'Admin calendar template removed');
  res.status(204).send();
}

export async function createEvent(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
    metadataKey: 'metadata',
    forceMetadata: true,
  });
  const event = await createAdminCalendarEvent(payload);
  logger.info({ actor: actor.reference, eventId: event?.id }, 'Admin calendar event created');
  res.status(201).json(event);
}

export async function updateEvent(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setUpdatedBy: true,
    metadataKey: 'metadata',
  });
  const event = await updateAdminCalendarEvent(req.params.eventId, payload);
  logger.info({ actor: actor.reference, eventId: event?.id }, 'Admin calendar event updated');
  res.json(event);
}

export async function removeEvent(req, res) {
  await deleteAdminCalendarEvent(req.params.eventId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, eventId: req.params.eventId }, 'Admin calendar event removed');
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
