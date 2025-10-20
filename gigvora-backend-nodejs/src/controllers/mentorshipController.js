import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
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

function resolveMentorId(req) {
  const explicitId = req.params?.mentorId ?? req.query?.mentorId ?? req.body?.mentorId;
  const inferredId = explicitId ?? resolveRequestUserId(req);
  if (!inferredId) {
    throw new ValidationError('mentorId is required.');
  }
  return inferredId;
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

function ensureMentorRole(req) {
  const potentialSources = [
    req.user?.roles,
    req.user?.role,
    req.headers?.['x-workspace-roles'],
    req.headers?.['x-user-role'],
    req.headers?.['x-role'],
  ];

  const roles = potentialSources.flatMap(normaliseRoles).filter(Boolean);
  if (!roles.includes('mentor') && !roles.includes('admin')) {
    throw new AuthorizationError('Mentor access required.');
  }
}

export function dashboard(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const lookbackDays = req.query?.lookbackDays;
  const dashboard = getMentorDashboard(mentorId, { lookbackDays });
  res.json(dashboard);
}

export function saveAvailability(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { slots } = req.body ?? {};
  const availability = updateMentorAvailability(mentorId, slots ?? []);
  res.json({ availability });
}

export function savePackages(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { packages } = req.body ?? {};
  const savedPackages = updateMentorPackages(mentorId, packages ?? []);
  res.json({ packages: savedPackages });
}

export function saveProfile(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const profile = submitMentorProfile(mentorId, req.body ?? {});
  res.status(201).json({ profile });
}

export function createBooking(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const booking = createMentorBooking(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ booking, dashboard });
}

export function updateBooking(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const bookingId = req.params?.bookingId ?? req.body?.bookingId;
  const booking = updateMentorBooking(mentorId, bookingId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ booking, dashboard });
}

export function deleteBooking(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { bookingId } = req.params ?? {};
  deleteMentorBooking(mentorId, bookingId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createClient(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const client = createMentorClient(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ client, dashboard });
}

export function updateClient(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const clientId = req.params?.clientId ?? req.body?.clientId;
  const client = updateMentorClient(mentorId, clientId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ client, dashboard });
}

export function deleteClient(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { clientId } = req.params ?? {};
  deleteMentorClient(mentorId, clientId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createEvent(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const event = createMentorEvent(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ event, dashboard });
}

export function updateEvent(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const eventId = req.params?.eventId ?? req.body?.eventId;
  const event = updateMentorEvent(mentorId, eventId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ event, dashboard });
}

export function deleteEvent(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { eventId } = req.params ?? {};
  deleteMentorEvent(mentorId, eventId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createSupportTicket(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const ticket = createMentorSupportTicket(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ ticket, dashboard });
}

export function updateSupportTicket(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const ticketId = req.params?.ticketId ?? req.body?.ticketId;
  const ticket = updateMentorSupportTicket(mentorId, ticketId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ ticket, dashboard });
}

export function deleteSupportTicket(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { ticketId } = req.params ?? {};
  deleteMentorSupportTicket(mentorId, ticketId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createMessage(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const message = createMentorMessage(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ message, dashboard });
}

export function updateMessage(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const messageId = req.params?.messageId ?? req.body?.messageId;
  const message = updateMentorMessage(mentorId, messageId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ message, dashboard });
}

export function deleteMessage(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { messageId } = req.params ?? {};
  deleteMentorMessage(mentorId, messageId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function saveVerificationStatus(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const verification = updateMentorVerificationStatus(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ verification, dashboard });
}

export function createVerificationDocument(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const document = createMentorVerificationDocument(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ document, dashboard });
}

export function updateVerificationDocument(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const documentId = req.params?.documentId ?? req.body?.documentId;
  const document = updateMentorVerificationDocument(mentorId, documentId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ document, dashboard });
}

export function deleteVerificationDocument(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { documentId } = req.params ?? {};
  deleteMentorVerificationDocument(mentorId, documentId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createWalletTransaction(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const transaction = createMentorWalletTransaction(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ transaction, dashboard });
}

export function updateWalletTransaction(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const transactionId = req.params?.transactionId ?? req.body?.transactionId;
  const transaction = updateMentorWalletTransaction(mentorId, transactionId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ transaction, dashboard });
}

export function deleteWalletTransaction(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { transactionId } = req.params ?? {};
  deleteMentorWalletTransaction(mentorId, transactionId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createInvoice(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const invoice = createMentorInvoice(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ invoice, dashboard });
}

export function updateInvoice(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const invoiceId = req.params?.invoiceId ?? req.body?.invoiceId;
  const invoice = updateMentorInvoice(mentorId, invoiceId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ invoice, dashboard });
}

export function deleteInvoice(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { invoiceId } = req.params ?? {};
  deleteMentorInvoice(mentorId, invoiceId);
  const dashboard = getMentorDashboard(mentorId);
  res.json({ dashboard });
}

export function createPayout(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const payout = createMentorPayout(mentorId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.status(201).json({ payout, dashboard });
}

export function updatePayout(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const payoutId = req.params?.payoutId ?? req.body?.payoutId;
  const payout = updateMentorPayout(mentorId, payoutId, req.body ?? {});
  const dashboard = getMentorDashboard(mentorId);
  res.json({ payout, dashboard });
}

export function deletePayout(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { payoutId } = req.params ?? {};
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
