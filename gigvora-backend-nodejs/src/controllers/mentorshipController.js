import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';
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

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function resolveMentorId(req) {
  const explicitId = req.params?.mentorId ?? req.query?.mentorId ?? req.body?.mentorId;
  const inferredId = explicitId ?? resolveRequestUserId(req);
  if (!inferredId) {
    throw new ValidationError('mentorId is required.');
  }
  return parsePositiveInteger(inferredId, 'mentorId');
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

function parseOptionalPositiveInteger(value, label) {
  if (value == null || value === '') {
    return null;
  }
  return parsePositiveInteger(value, label);
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

export function dashboard(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const lookbackDays = parseOptionalPositiveInteger(req.query?.lookbackDays, 'lookbackDays');
  const dashboard = getMentorDashboard(mentorId, { lookbackDays });
  res.json(dashboard);
}

export function saveAvailability(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const { slots } = ensureObjectPayload(req.body, 'availability payload');
  if (slots != null && !Array.isArray(slots)) {
    throw new ValidationError('slots must be an array.');
  }
  const availability = updateMentorAvailability(mentorId, Array.isArray(slots) ? slots : []);
  res.json({ availability });
}

export function savePackages(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const { packages } = ensureObjectPayload(req.body, 'packages payload');
  if (packages != null && !Array.isArray(packages)) {
    throw new ValidationError('packages must be an array.');
  }
  const savedPackages = updateMentorPackages(mentorId, Array.isArray(packages) ? packages : []);
  res.json({ packages: savedPackages });
}

export function saveProfile(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const profile = submitMentorProfile(mentorId, ensureObjectPayload(req.body, 'mentor profile'));
  res.status(201).json({ profile });
}

export function createBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const booking = createMentorBooking(mentorId, ensureObjectPayload(req.body, 'mentor booking'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ booking, dashboard });
}

export function updateBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const bookingId = parsePositiveInteger(req.params?.bookingId ?? req.body?.bookingId, 'bookingId');
  const booking = updateMentorBooking(mentorId, bookingId, ensureObjectPayload(req.body, 'mentor booking update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ booking, dashboard });
}

export function deleteBooking(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const bookingId = parsePositiveInteger(req.params?.bookingId, 'bookingId');
  deleteMentorBooking(mentorId, bookingId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const client = createMentorClient(mentorId, ensureObjectPayload(req.body, 'mentor client'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ client, dashboard });
}

export function updateClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const clientId = parsePositiveInteger(req.params?.clientId ?? req.body?.clientId, 'clientId');
  const client = updateMentorClient(mentorId, clientId, ensureObjectPayload(req.body, 'mentor client update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ client, dashboard });
}

export function deleteClient(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const clientId = parsePositiveInteger(req.params?.clientId, 'clientId');
  deleteMentorClient(mentorId, clientId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const event = createMentorEvent(mentorId, ensureObjectPayload(req.body, 'mentor event'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ event, dashboard });
}

export function updateEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const eventId = parsePositiveInteger(req.params?.eventId ?? req.body?.eventId, 'eventId');
  const event = updateMentorEvent(mentorId, eventId, ensureObjectPayload(req.body, 'mentor event update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ event, dashboard });
}

export function deleteEvent(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const eventId = parsePositiveInteger(req.params?.eventId, 'eventId');
  deleteMentorEvent(mentorId, eventId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticket = createMentorSupportTicket(mentorId, ensureObjectPayload(req.body, 'support ticket'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ ticket, dashboard });
}

export function updateSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticketId = parsePositiveInteger(req.params?.ticketId ?? req.body?.ticketId, 'ticketId');
  const ticket = updateMentorSupportTicket(
    mentorId,
    ticketId,
    ensureObjectPayload(req.body, 'support ticket update'),
  );
  const dashboard = getMentorDashboard(mentorId);
  res.json({ ticket, dashboard });
}

export function deleteSupportTicket(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const ticketId = parsePositiveInteger(req.params?.ticketId, 'ticketId');
  deleteMentorSupportTicket(mentorId, ticketId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const message = createMentorMessage(mentorId, ensureObjectPayload(req.body, 'mentor message'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ message, dashboard });
}

export function updateMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const messageId = parsePositiveInteger(req.params?.messageId ?? req.body?.messageId, 'messageId');
  const message = updateMentorMessage(mentorId, messageId, ensureObjectPayload(req.body, 'mentor message update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ message, dashboard });
}

export function deleteMessage(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const messageId = parsePositiveInteger(req.params?.messageId, 'messageId');
  deleteMentorMessage(mentorId, messageId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function saveVerificationStatus(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const verification = updateMentorVerificationStatus(
    mentorId,
    ensureObjectPayload(req.body, 'verification status'),
  );
  const dashboard = getMentorDashboard(mentorId);
  res.json({ verification, dashboard });
}

export function createVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const document = createMentorVerificationDocument(mentorId, ensureObjectPayload(req.body, 'verification document'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ document, dashboard });
}

export function updateVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const documentId = parsePositiveInteger(req.params?.documentId ?? req.body?.documentId, 'documentId');
  const document = updateMentorVerificationDocument(
    mentorId,
    documentId,
    ensureObjectPayload(req.body, 'verification document update'),
  );
  const dashboard = getMentorDashboard(mentorId);
  res.json({ document, dashboard });
}

export function deleteVerificationDocument(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const documentId = parsePositiveInteger(req.params?.documentId, 'documentId');
  deleteMentorVerificationDocument(mentorId, documentId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transaction = createMentorWalletTransaction(
    mentorId,
    ensureObjectPayload(req.body, 'wallet transaction'),
  );
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ transaction, dashboard });
}

export function updateWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transactionId = parsePositiveInteger(req.params?.transactionId ?? req.body?.transactionId, 'transactionId');
  const transaction = updateMentorWalletTransaction(
    mentorId,
    transactionId,
    ensureObjectPayload(req.body, 'wallet transaction update'),
  );
  const dashboard = getMentorDashboard(mentorId);
  res.json({ transaction, dashboard });
}

export function deleteWalletTransaction(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const transactionId = parsePositiveInteger(req.params?.transactionId, 'transactionId');
  deleteMentorWalletTransaction(mentorId, transactionId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoice = createMentorInvoice(mentorId, ensureObjectPayload(req.body, 'mentor invoice'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ invoice, dashboard });
}

export function updateInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoiceId = parsePositiveInteger(req.params?.invoiceId ?? req.body?.invoiceId, 'invoiceId');
  const invoice = updateMentorInvoice(mentorId, invoiceId, ensureObjectPayload(req.body, 'mentor invoice update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ invoice, dashboard });
}

export function deleteInvoice(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const invoiceId = parsePositiveInteger(req.params?.invoiceId, 'invoiceId');
  deleteMentorInvoice(mentorId, invoiceId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createPayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payout = createMentorPayout(mentorId, ensureObjectPayload(req.body, 'mentor payout'));
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ payout, dashboard });
}

export function updatePayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payoutId = parsePositiveInteger(req.params?.payoutId ?? req.body?.payoutId, 'payoutId');
  const payout = updateMentorPayout(mentorId, payoutId, ensureObjectPayload(req.body, 'mentor payout update'));
  const dashboard = getMentorDashboard(mentorId);
  res.json({ payout, dashboard });
}

export function deletePayout(req, res) {
  const mentorId = resolveMentorId(req);
  ensureMentorRole(req, mentorId);
  const payoutId = parsePositiveInteger(req.params?.payoutId, 'payoutId');
  deleteMentorPayout(mentorId, payoutId);
  const dashboard = getMentorDashboard(mentorId);
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
