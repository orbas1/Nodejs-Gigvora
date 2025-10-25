import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';
import { ensurePlainObject, toOptionalPositiveInteger, toPositiveInteger } from '../utils/controllerUtils.js';
import notificationService from '../services/notificationService.js';
import { storeIdentityDocument } from '../services/identityDocumentStorageService.js';
import logger from '../utils/logger.js';
import {
  getMentorDashboard,
  updateMentorAvailability,
  updateMentorPackages,
  submitMentorProfile,
  createMentorBooking,
  updateMentorBooking,
  deleteMentorBooking,
  createMentorClient,
  updateMentorClient,
  deleteMentorClient,
  createMentorEvent,
  updateMentorEvent,
  deleteMentorEvent,
  createMentorSupportTicket,
  updateMentorSupportTicket,
  deleteMentorSupportTicket,
  createMentorMessage,
  updateMentorMessage,
  deleteMentorMessage,
  updateMentorVerificationStatus,
  createMentorVerificationDocument,
  updateMentorVerificationDocument,
  deleteMentorVerificationDocument,
  createMentorWalletTransaction,
  updateMentorWalletTransaction,
  deleteMentorWalletTransaction,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
} from '../services/mentorshipService.js';

const DASHBOARD_CACHE_SYMBOL = Symbol('mentorDashboardCache');

function resolveMentorId(req) {
  const explicitId = req.params?.mentorId ?? req.query?.mentorId ?? req.body?.mentorId;
  const inferredId = explicitId ?? resolveRequestUserId(req);
  if (!inferredId) {
    throw new ValidationError('mentorId is required.');
  }
  return toPositiveInteger(inferredId, { fieldName: 'mentorId' });
}

function normaliseRoles(rolesCandidate) {
  if (!rolesCandidate) {
    return [];
  }
  if (Array.isArray(rolesCandidate)) {
    return rolesCandidate.map((role) => `${role}`.toLowerCase());
  }
  return `${rolesCandidate}`
    .split(/[;,\s]+/)
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
}

function ensureMentorRole(req, mentorId) {
  const potentialSources = [
    req.user?.roles,
    req.user?.role,
    req.headers?.['x-workspace-roles'],
    req.headers?.['x-user-role'],
    req.headers?.['x-role'],
  ];

  const roles = potentialSources.flatMap(normaliseRoles).filter(Boolean);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  roles.forEach((role) => permissions.add(role));

  const actorId = resolveRequestUserId(req);
  if (actorId && actorId === mentorId) {
    if (!roles.includes('mentor') && !permissions.has('mentor')) {
      throw new AuthorizationError('Mentor access required.');
    }
    return;
  }

  if (
    permissions.has('admin') ||
    permissions.has('mentorship.manage.any') ||
    roles.includes('mentor.admin')
  ) {
    return;
  }

  throw new AuthorizationError('Mentor access required.');
}

function getDashboardCache(req) {
  if (!req[DASHBOARD_CACHE_SYMBOL]) {
    Object.defineProperty(req, DASHBOARD_CACHE_SYMBOL, {
      value: new Map(),
      configurable: true,
    });
  }
  return req[DASHBOARD_CACHE_SYMBOL];
}

function clearDashboardCache(req) {
  const cache = req?.[DASHBOARD_CACHE_SYMBOL];
  if (cache instanceof Map) {
    cache.clear();
  }
}

function getMemoizedDashboard(req, mentorId, options = {}) {
  const cache = getDashboardCache(req);
  const key = JSON.stringify({ mentorId, lookbackDays: options.lookbackDays ?? null });
  if (!cache.has(key)) {
    cache.set(key, getMentorDashboard(mentorId, options));
  }
  return cache.get(key);
}

async function queueMentorNotification(mentorId, {
  type,
  title,
  body,
  priority = 'normal',
  payload = {},
  bypassQuietHours = false,
} = {}) {
  if (!mentorId || !type || !title) {
    return;
  }
  try {
    await notificationService.queueNotification(
      {
        userId: mentorId,
        category: 'mentorship',
        priority,
        type,
        title,
        body: body ?? null,
        payload: { mentorId, ...payload },
      },
      { bypassQuietHours },
    );
  } catch (error) {
    logger.warn('Failed to queue mentor notification', { error, mentorId, type });
  }
}

async function persistVerificationEvidence(filePayload, { actorId } = {}) {
  if (!filePayload || typeof filePayload !== 'object') {
    return null;
  }

  const { storageKey, data, fileName, contentType, fileSize, storedAt } = filePayload;
  if (storageKey) {
    const key = `${storageKey}`.trim();
    if (!key) {
      throw new ValidationError('storageKey cannot be empty.');
    }
    return {
      key,
      fileName: fileName ? `${fileName}`.trim() : null,
      contentType: contentType ? `${contentType}`.trim() : null,
      size: fileSize == null ? null : Number(fileSize),
      storedAt: storedAt ? new Date(storedAt).toISOString() : new Date().toISOString(),
    };
  }

  if (!data) {
    throw new ValidationError('file.data is required when storageKey is not provided.');
  }

  const metadata = await storeIdentityDocument({
    data,
    fileName: fileName ?? 'mentor-document',
    contentType: contentType ?? 'application/octet-stream',
    actorId,
  });

  return {
    key: metadata.key,
    fileName: metadata.fileName,
    contentType: metadata.contentType,
    size: metadata.size,
    storedAt: metadata.storedAt,
  };
}

export async function dashboard(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const lookbackDays = toOptionalPositiveInteger(req.query?.lookbackDays, {
    fieldName: 'lookbackDays',
  });
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: lookbackDays ?? null });
  res.json(dashboard);
}

export async function saveAvailability(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const { slots } = ensurePlainObject(req.body ?? {}, 'availability payload');
  if (slots != null && !Array.isArray(slots)) {
    throw new ValidationError('slots must be an array.');
  }
  const availability = await updateMentorAvailability(mentorId, Array.isArray(slots) ? slots : []);
  res.json({ availability });
}

export async function savePackages(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const { packages } = ensurePlainObject(req.body ?? {}, 'packages payload');
  if (packages != null && !Array.isArray(packages)) {
    throw new ValidationError('packages must be an array.');
  }
  const savedPackages = await updateMentorPackages(mentorId, Array.isArray(packages) ? packages : []);
  res.json({ packages: savedPackages });
}

export async function saveProfile(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const profile = await submitMentorProfile(mentorId, ensurePlainObject(req.body ?? {}, 'mentor profile'));
  res.status(201).json({ profile });
}

export async function createBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const booking = await createMentorBooking(mentorId, ensurePlainObject(req.body ?? {}, 'mentor booking'));
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ booking, dashboard });
}

export async function updateBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const bookingId = toPositiveInteger(req.params?.bookingId ?? req.body?.bookingId, {
    fieldName: 'bookingId',
  });
  const booking = await updateMentorBooking(
    mentorId,
    bookingId,
    ensurePlainObject(req.body ?? {}, 'mentor booking update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ booking, dashboard });
}

export async function deleteBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const bookingId = toPositiveInteger(req.params?.bookingId, { fieldName: 'bookingId' });
  await deleteMentorBooking(mentorId, bookingId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export async function createClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const client = await createMentorClient(mentorId, ensurePlainObject(req.body ?? {}, 'mentor client'));
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ client, dashboard });
}

export async function updateClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const clientId = toPositiveInteger(req.params?.clientId ?? req.body?.clientId, {
    fieldName: 'clientId',
  });
  const client = await updateMentorClient(
    mentorId,
    clientId,
    ensurePlainObject(req.body ?? {}, 'mentor client update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ client, dashboard });
}

export async function deleteClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const clientId = toPositiveInteger(req.params?.clientId, { fieldName: 'clientId' });
  await deleteMentorClient(mentorId, clientId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export async function createEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const event = await createMentorEvent(mentorId, ensurePlainObject(req.body ?? {}, 'mentor event'));
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ event, dashboard });
}

export async function updateEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const eventId = toPositiveInteger(req.params?.eventId ?? req.body?.eventId, {
    fieldName: 'eventId',
  });
  const event = await updateMentorEvent(
    mentorId,
    eventId,
    ensurePlainObject(req.body ?? {}, 'mentor event update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ event, dashboard });
}

export async function deleteEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const eventId = toPositiveInteger(req.params?.eventId, { fieldName: 'eventId' });
  await deleteMentorEvent(mentorId, eventId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export async function createSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticket = await createMentorSupportTicket(
    mentorId,
    ensurePlainObject(req.body ?? {}, 'support ticket'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.support.ticket.created',
    title: 'Support ticket submitted',
    body: `${ticket.subject} • ${ticket.priority}`,
    payload: { ticketId: ticket.id, status: ticket.status, priority: ticket.priority },
  });
  res.status(201).json({ ticket, dashboard });
}

export async function updateSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticketId = toPositiveInteger(req.params?.ticketId ?? req.body?.ticketId, {
    fieldName: 'ticketId',
  });
  const ticket = await updateMentorSupportTicket(
    mentorId,
    ticketId,
    ensurePlainObject(req.body ?? {}, 'support ticket update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.support.ticket.updated',
    title: 'Support ticket updated',
    body: `${ticket.subject} • ${ticket.status}`,
    payload: { ticketId: ticket.id, status: ticket.status, priority: ticket.priority },
  });
  res.json({ ticket, dashboard });
}

export async function deleteSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticketId = toPositiveInteger(req.params?.ticketId, { fieldName: 'ticketId' });
  await deleteMentorSupportTicket(mentorId, ticketId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.support.ticket.deleted',
    title: 'Support ticket removed',
    body: `Ticket ${ticketId} deleted`,
    payload: { ticketId },
  });
  res.json({ dashboard });
}

export async function createMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const message = await createMentorMessage(
    mentorId,
    ensurePlainObject(req.body ?? {}, 'mentor message'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.inbox.message.created',
    title: 'New inbox message logged',
    body: `${message.from} • ${message.subject || message.channel}`,
    payload: { messageId: message.id, status: message.status, channel: message.channel },
  });
  res.status(201).json({ message, dashboard });
}

export async function updateMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const messageId = toPositiveInteger(req.params?.messageId ?? req.body?.messageId, {
    fieldName: 'messageId',
  });
  const message = await updateMentorMessage(
    mentorId,
    messageId,
    ensurePlainObject(req.body ?? {}, 'mentor message update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.inbox.message.updated',
    title: 'Inbox message updated',
    body: `${message.from} • ${message.status}`,
    payload: { messageId: message.id, status: message.status, channel: message.channel },
  });
  res.json({ message, dashboard });
}

export async function deleteMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const messageId = toPositiveInteger(req.params?.messageId, { fieldName: 'messageId' });
  await deleteMentorMessage(mentorId, messageId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.inbox.message.deleted',
    title: 'Inbox message removed',
    body: `Message ${messageId} deleted`,
    payload: { messageId },
  });
  res.json({ dashboard });
}

export async function saveVerificationStatus(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const verification = await updateMentorVerificationStatus(
    mentorId,
    ensurePlainObject(req.body ?? {}, 'verification status'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ verification, dashboard });
}

export async function createVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payload = ensurePlainObject(req.body ?? {}, 'verification document');
  const actorId = resolveRequestUserId(req) ?? mentorId;
  const evidence = await persistVerificationEvidence(payload.file, { actorId });
  const document = await createMentorVerificationDocument(mentorId, {
    ...payload,
    storageKey: evidence?.key ?? payload.storageKey ?? null,
    fileName: evidence?.fileName ?? payload.fileName ?? null,
    contentType: evidence?.contentType ?? payload.contentType ?? null,
    fileSize: evidence?.size ?? payload.fileSize ?? null,
    storedAt: evidence?.storedAt ?? payload.storedAt ?? new Date().toISOString(),
  });
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.verification.document.created',
    title: 'Verification document submitted',
    body: `${document.type} • ${document.status}`,
    priority: 'high',
    payload: { documentId: document.id, status: document.status, storageKey: document.storageKey ?? null },
    bypassQuietHours: true,
  });
  res.status(201).json({ document, dashboard });
}

export async function updateVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const documentId = toPositiveInteger(req.params?.documentId ?? req.body?.documentId, {
    fieldName: 'documentId',
  });
  const payload = ensurePlainObject(req.body ?? {}, 'verification document update');
  const actorId = resolveRequestUserId(req) ?? mentorId;
  const evidence = await persistVerificationEvidence(payload.file, { actorId });
  const document = await updateMentorVerificationDocument(
    mentorId,
    documentId,
    {
      ...payload,
      storageKey: evidence?.key ?? payload.storageKey ?? null,
      fileName: evidence?.fileName ?? payload.fileName ?? null,
      contentType: evidence?.contentType ?? payload.contentType ?? null,
      fileSize: evidence?.size ?? payload.fileSize ?? null,
      storedAt: evidence?.storedAt ?? payload.storedAt ?? new Date().toISOString(),
    },
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.verification.document.updated',
    title: 'Verification document updated',
    body: `${document.type} • ${document.status}`,
    priority: 'high',
    payload: { documentId: document.id, status: document.status, storageKey: document.storageKey ?? null },
  });
  res.json({ document, dashboard });
}

export async function deleteVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const documentId = toPositiveInteger(req.params?.documentId, { fieldName: 'documentId' });
  await deleteMentorVerificationDocument(mentorId, documentId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  await queueMentorNotification(mentorId, {
    type: 'mentorship.verification.document.deleted',
    title: 'Verification document removed',
    body: `Document ${documentId} deleted`,
    priority: 'normal',
    payload: { documentId },
  });
  res.json({ dashboard });
}

export async function createWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transaction = await createMentorWalletTransaction(
    mentorId,
    ensurePlainObject(req.body ?? {}, 'wallet transaction'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ transaction, dashboard });
}

export async function updateWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transactionId = toPositiveInteger(req.params?.transactionId ?? req.body?.transactionId, {
    fieldName: 'transactionId',
  });
  const transaction = await updateMentorWalletTransaction(
    mentorId,
    transactionId,
    ensurePlainObject(req.body ?? {}, 'wallet transaction update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ transaction, dashboard });
}

export async function deleteWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transactionId = toPositiveInteger(req.params?.transactionId, { fieldName: 'transactionId' });
  await deleteMentorWalletTransaction(mentorId, transactionId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export async function createInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoice = await createMentorInvoice(mentorId, ensurePlainObject(req.body ?? {}, 'mentor invoice'));
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ invoice, dashboard });
}

export async function updateInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoiceId = toPositiveInteger(req.params?.invoiceId ?? req.body?.invoiceId, {
    fieldName: 'invoiceId',
  });
  const invoice = await updateMentorInvoice(
    mentorId,
    invoiceId,
    ensurePlainObject(req.body ?? {}, 'mentor invoice update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ invoice, dashboard });
}

export async function deleteInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoiceId = toPositiveInteger(req.params?.invoiceId, { fieldName: 'invoiceId' });
  await deleteMentorInvoice(mentorId, invoiceId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export async function createPayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payout = await createMentorPayout(mentorId, ensurePlainObject(req.body ?? {}, 'mentor payout'));
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.status(201).json({ payout, dashboard });
}

export async function updatePayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payoutId = toPositiveInteger(req.params?.payoutId ?? req.body?.payoutId, {
    fieldName: 'payoutId',
  });
  const payout = await updateMentorPayout(
    mentorId,
    payoutId,
    ensurePlainObject(req.body ?? {}, 'mentor payout update'),
  );
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ payout, dashboard });
}

export async function deletePayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payoutId = toPositiveInteger(req.params?.payoutId, { fieldName: 'payoutId' });
  await deleteMentorPayout(mentorId, payoutId);
  clearDashboardCache(req);
  const dashboard = await getMemoizedDashboard(req, mentorId, { lookbackDays: null });
  res.json({ dashboard });
}

export default {
  dashboard,
  saveAvailability,
  savePackages,
  saveProfile,
  createBooking,
  updateBooking,
  deleteBooking,
  createClient,
  updateClient,
  deleteClient,
  createEvent,
  updateEvent,
  deleteEvent,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  createMessage,
  updateMessage,
  deleteMessage,
  saveVerificationStatus,
  createVerificationDocument,
  updateVerificationDocument,
  deleteVerificationDocument,
  createWalletTransaction,
  updateWalletTransaction,
  deleteWalletTransaction,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createPayout,
  updatePayout,
  deletePayout,
};
