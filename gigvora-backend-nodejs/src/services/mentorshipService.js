import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  MentorProfile,
  MentorAvailabilitySlot,
  MentorPackage,
  MentorBooking,
  MentorClient,
  MentorEvent,
  MentorSupportTicket,
  MentorMessage,
  MentorVerification,
  MentorVerificationDocument,
  MentorWalletTransaction,
  MentorInvoice,
  MentorPayout,
  MentorHubUpdate,
  MentorHubAction,
  MentorHubResource,
  MentorHubSpotlight,
  MentorOrder,
  MentorAdCampaign,
  MentorMetricWidget,
  MentorMetricReportingSetting,
  MentorSettings,
  MentorSystemPreference,
  MentorReview,
  MENTOR_AVAILABILITY_DAYS,
  MENTOR_BOOKING_STATUSES,
  MENTOR_PAYMENT_STATUSES,
  MENTOR_CLIENT_STATUSES,
  MENTOR_RELATIONSHIP_TIERS,
  MENTOR_EVENT_TYPES,
  MENTOR_EVENT_STATUSES,
  MENTOR_SUPPORT_PRIORITIES,
  MENTOR_SUPPORT_STATUSES,
  MENTOR_MESSAGE_CHANNELS,
  MENTOR_MESSAGE_STATUSES,
  MENTOR_DOCUMENT_TYPES,
  MENTOR_VERIFICATION_STATUSES,
  MENTOR_WALLET_TRANSACTION_TYPES,
  MENTOR_WALLET_TRANSACTION_STATUSES,
  MENTOR_INVOICE_STATUSES,
  MENTOR_PAYOUT_STATUSES,
} from '../models/index.js';
import { CreationStudioItem } from '../models/creationStudioModels.js';
import {
  getDashboardSnapshot as getCreationStudioDashboard,
  getWorkspace as getCreationStudioWorkspaceSnapshot,
  createItem as createOwnedCreationStudioItem,
  updateItem as updateOwnedCreationStudioItem,
  shareItem as shareOwnedCreationStudioItem,
  archiveItem as archiveOwnedCreationStudioItem,
  deleteCreationStudioItem,
  publishCreationStudioItem,
} from './creationStudioService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { encryptSecret, fingerprintSecret } from '../utils/secretStorage.js';

const MIN_SESSION_MINUTES = 25;
const MAX_SESSION_MINUTES = 6 * 60;
const MAX_AVAILABILITY_SLOTS = 40;
const MAX_PACKAGE_PRICE = 100000;
const MAX_SESSION_CAPACITY = 30;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 365;
const MAX_NOTES_LENGTH = 4000;
const DAY_MS = 24 * 60 * 60 * 1000;

function ensureTrimmedString(value, fieldName, { required = true, maxLength } = {}) {
  const trimmed = `${value ?? ''}`.trim();
  if (required && !trimmed) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  if (trimmed && maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed || null;
}

function ensureOptionalNumber(value, fieldName, { min, max } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be a number.`);
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}.`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`${fieldName} must be no more than ${max}.`);
  }
  return numeric;
}

function ensureStringArray(value, fieldName) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry ?? ''}`.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  throw new ValidationError(`${fieldName} must be an array of strings.`);
}

function normaliseMentorId(mentorId) {
  const numeric = Number.parseInt(mentorId, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid mentorId is required.');
  }
  return numeric;
}

function normaliseLookbackDays(value) {
  if (value == null) {
    return 30;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    throw new ValidationError('lookbackDays must be an integer.');
  }
  if (numeric < MIN_LOOKBACK_DAYS || numeric > MAX_LOOKBACK_DAYS) {
    throw new ValidationError(
      `lookbackDays must be between ${MIN_LOOKBACK_DAYS} and ${MAX_LOOKBACK_DAYS} days.`,
    );
  }
  return numeric;
}

function toDate(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function toISOString(value, fieldName) {
  return toDate(value, fieldName).toISOString();
}

function clampNotes(value) {
  if (!value) {
    return '';
  }
  return `${value}`.slice(0, MAX_NOTES_LENGTH);
}

function ensureEnum(value, allowed, fieldName) {
  const normalised = `${value ?? ''}`.trim();
  if (!allowed.includes(normalised)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}.`);
  }
  return normalised;
}

function sanitiseAvailabilitySlot(slot, index) {
  const day = ensureEnum(slot.day, MENTOR_AVAILABILITY_DAYS, `Slot ${index + 1} day`).trim();
  const start = toDate(slot.start, `Slot ${index + 1} start`);
  const end = toDate(slot.end, `Slot ${index + 1} end`);
  if (end <= start) {
    throw new ValidationError(`Slot ${index + 1} must end after it starts.`);
  }
  const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
  if (durationMinutes < MIN_SESSION_MINUTES || durationMinutes > MAX_SESSION_MINUTES) {
    throw new ValidationError(
      `Slot ${index + 1} must be between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes.`,
    );
  }
  const capacity = Number.parseInt(slot.capacity ?? 1, 10);
  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > MAX_SESSION_CAPACITY) {
    throw new ValidationError(`Slot ${index + 1} capacity must be between 1 and ${MAX_SESSION_CAPACITY}.`);
  }

  return {
    dayOfWeek: day,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    format: `${slot.format ?? '1:1 session'}`.trim() || '1:1 session',
    capacity,
  };
}

function validateAvailability(slots) {
  if (!Array.isArray(slots)) {
    throw new ValidationError('Availability must be an array of slots.');
  }
  if (slots.length > MAX_AVAILABILITY_SLOTS) {
    throw new ValidationError(`You can publish a maximum of ${MAX_AVAILABILITY_SLOTS} availability slots.`);
  }

  const sanitised = slots.map(sanitiseAvailabilitySlot);
  const byDay = new Map();
  for (const slot of sanitised) {
    const daySlots = byDay.get(slot.dayOfWeek) ?? [];
    for (const existing of daySlots) {
      const start = new Date(slot.startTime).getTime();
      const end = new Date(slot.endTime).getTime();
      const existingStart = new Date(existing.startTime).getTime();
      const existingEnd = new Date(existing.endTime).getTime();
      const overlaps = start < existingEnd && end > existingStart;
      if (overlaps) {
        throw new ValidationError(`Availability on ${slot.dayOfWeek} has overlapping slots.`);
      }
    }
    daySlots.push(slot);
    byDay.set(slot.dayOfWeek, daySlots);
  }
  return sanitised;
}

function sanitisePackage(pack, index) {
  const name = `${pack.name ?? ''}`.trim();
  if (!name) {
    throw new ValidationError(`Package ${index + 1} must include a name.`);
  }
  const description = `${pack.description ?? ''}`.trim();
  if (!description) {
    throw new ValidationError(`Package ${index + 1} must include a description.`);
  }
  const sessions = Number.parseInt(pack.sessions ?? 1, 10);
  if (!Number.isInteger(sessions) || sessions <= 0) {
    throw new ValidationError(`Package ${index + 1} must include at least one session.`);
  }
  const price = Number.parseFloat(pack.price ?? 0);
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PACKAGE_PRICE) {
    throw new ValidationError(`Package ${index + 1} price must be between 0 and ${MAX_PACKAGE_PRICE}.`);
  }
  return {
    name,
    description,
    sessions,
    price: Math.round(price * 100) / 100,
    currency: `${pack.currency ?? 'GBP'}`.trim() || 'GBP',
    format: `${pack.format ?? 'Virtual'}`.trim() || 'Virtual',
    outcome: `${pack.outcome ?? ''}`.trim(),
  };
}

function sanitiseBooking(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const menteeName = `${payload.mentee ?? base.menteeName ?? ''}`.trim();
  if (!menteeName) {
    throw new ValidationError('Booking must include the mentee name.');
  }

  const scheduledAt = toISOString(payload.scheduledAt ?? base.scheduledAt ?? new Date(), 'scheduledAt');
  const status = ensureEnum(payload.status ?? base.status ?? 'Scheduled', MENTOR_BOOKING_STATUSES, 'status');
  const paymentStatus = ensureEnum(
    payload.paymentStatus ?? base.paymentStatus ?? 'Pending',
    MENTOR_PAYMENT_STATUSES,
    'paymentStatus',
  );

  const priceCandidate = payload.price ?? base.price ?? 0;
  const price = Number.parseFloat(priceCandidate);
  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError('Booking price must be zero or a positive number.');
  }

  const conferenceLink = `${payload.conferenceLink ?? base.conferenceLink ?? ''}`.trim();
  if (conferenceLink && !/^https?:\/\//i.test(conferenceLink)) {
    throw new ValidationError('Provide a valid URL for the conference link.');
  }

  return {
    menteeName,
    menteeRole: `${payload.role ?? base.menteeRole ?? ''}`.trim() || null,
    packageName: `${payload.package ?? base.packageName ?? ''}`.trim() || null,
    focus: `${payload.focus ?? base.focus ?? ''}`.trim() || null,
    scheduledAt,
    status,
    price: Math.round(price * 100) / 100,
    currency: `${payload.currency ?? base.currency ?? 'GBP'}`.trim() || 'GBP',
    paymentStatus,
    channel: `${payload.channel ?? base.channel ?? 'Explorer'}`.trim() || 'Explorer',
    segment: `${payload.segment ?? base.segment ?? 'active'}`.trim() || 'active',
    conferenceLink: conferenceLink || null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
  };
}

function sanitiseClient(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const name = `${payload.name ?? base.name ?? ''}`.trim();
  if (!name) {
    throw new ValidationError('Client name is required.');
  }
  const status = ensureEnum(payload.status ?? base.status ?? 'Active', MENTOR_CLIENT_STATUSES, 'status');
  const tier = ensureEnum(payload.tier ?? base.tier ?? 'Growth', MENTOR_RELATIONSHIP_TIERS, 'tier');
  const valueCandidate = payload.value ?? base.value ?? 0;
  const value = Number.parseFloat(valueCandidate);
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError('Client value must be zero or a positive number.');
  }

  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => `${tag}`.trim()).filter(Boolean)
    : `${payload.tags ?? ''}`
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  return {
    name,
    company: `${payload.company ?? base.company ?? ''}`.trim() || null,
    role: `${payload.role ?? base.role ?? ''}`.trim() || null,
    status,
    tier,
    value: Math.round(value * 100) / 100,
    currency: `${payload.currency ?? base.currency ?? 'GBP'}`.trim() || 'GBP',
    channel: `${payload.channel ?? base.channel ?? 'Explorer'}`.trim() || 'Explorer',
    tags,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    onboardedAt: payload.onboardedAt ? toISOString(payload.onboardedAt, 'onboardedAt') : base.onboardedAt ?? null,
    lastSessionAt: payload.lastSessionAt ? toISOString(payload.lastSessionAt, 'lastSessionAt') : base.lastSessionAt ?? null,
    nextSessionAt: payload.nextSessionAt ? toISOString(payload.nextSessionAt, 'nextSessionAt') : base.nextSessionAt ?? null,
  };
}

function sanitiseEvent(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const title = `${payload.title ?? base.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('Event title is required.');
  }
  const type = ensureEnum(payload.type ?? base.type ?? 'Session', MENTOR_EVENT_TYPES, 'type');
  const status = ensureEnum(payload.status ?? base.status ?? 'Scheduled', MENTOR_EVENT_STATUSES, 'status');
  const startsAt = toISOString(payload.startsAt ?? base.startsAt ?? new Date(), 'startsAt');
  const endsAt = toISOString(payload.endsAt ?? base.endsAt ?? new Date(new Date(startsAt).getTime() + 60 * 60 * 1000), 'endsAt');
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new ValidationError('Event must end after it starts.');
  }
  return {
    title,
    type,
    status,
    startsAt,
    endsAt,
    location: `${payload.location ?? base.location ?? ''}`.trim() || null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    clientId: payload.clientId ?? base.clientId ?? null,
  };
}

function sanitiseSupportTicket(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const subject = `${payload.subject ?? base.subject ?? ''}`.trim();
  if (!subject) {
    throw new ValidationError('Support ticket subject is required.');
  }
  return {
    subject,
    category: `${payload.category ?? base.category ?? 'General'}`.trim() || 'General',
    priority: ensureEnum(payload.priority ?? base.priority ?? 'Normal', MENTOR_SUPPORT_PRIORITIES, 'priority'),
    status: ensureEnum(payload.status ?? base.status ?? 'Open', MENTOR_SUPPORT_STATUSES, 'status'),
    reference: `${payload.reference ?? base.reference ?? ''}`.trim() || null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    submittedAt: toISOString(payload.submittedAt ?? base.submittedAt ?? new Date(), 'submittedAt'),
    respondedAt: payload.updatedAt
      ? toISOString(payload.updatedAt, 'updatedAt')
      : base.respondedAt ?? null,
  };
}

function sanitiseMessage(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const senderName = `${payload.from ?? base.senderName ?? ''}`.trim();
  if (!senderName) {
    throw new ValidationError('Message sender is required.');
  }
  return {
    senderName,
    channel: ensureEnum(payload.channel ?? base.channel ?? 'Explorer', MENTOR_MESSAGE_CHANNELS, 'channel'),
    status: ensureEnum(payload.status ?? base.status ?? 'Unread', MENTOR_MESSAGE_STATUSES, 'status'),
    subject: `${payload.subject ?? base.subject ?? ''}`.trim() || null,
    preview: clampNotes(payload.preview ?? base.preview ?? ''),
    tags: Array.isArray(payload.tags)
      ? payload.tags.map((tag) => `${tag}`.trim()).filter(Boolean)
      : `${payload.tags ?? ''}`
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    receivedAt: toISOString(payload.receivedAt ?? base.receivedAt ?? new Date(), 'receivedAt'),
  };
}

function sanitiseVerificationStatus(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const status = ensureEnum(
    payload.status ?? base.status ?? 'Not started',
    MENTOR_VERIFICATION_STATUSES,
    'status',
  );
  return {
    status,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    lastSubmittedAt: payload.lastSubmittedAt
      ? toISOString(payload.lastSubmittedAt, 'lastSubmittedAt')
      : base.lastSubmittedAt ?? null,
  };
}

function sanitiseVerificationDocument(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const type = ensureEnum(payload.type ?? base.type, MENTOR_DOCUMENT_TYPES, 'type');
  const status = ensureEnum(payload.status ?? base.status ?? 'In review', ['Pending', 'In review', 'Approved', 'Action required'], 'status');
  const storageKeyCandidate = payload.storageKey ?? base.storageKey ?? null;
  const storageKey = storageKeyCandidate == null ? null : `${storageKeyCandidate}`.trim();
  if (storageKeyCandidate != null && !storageKey) {
    throw new ValidationError('storageKey cannot be empty.');
  }
  const fileNameCandidate = payload.fileName ?? base.fileName ?? null;
  const fileName = fileNameCandidate == null ? null : `${fileNameCandidate}`.trim() || null;
  const contentTypeCandidate = payload.contentType ?? base.contentType ?? null;
  const contentType = contentTypeCandidate == null ? null : `${contentTypeCandidate}`.trim() || null;
  const fileSizeCandidate = payload.fileSize ?? base.fileSize ?? null;
  const fileSize =
    fileSizeCandidate == null || Number.isNaN(Number(fileSizeCandidate))
      ? null
      : Math.max(0, Math.round(Number(fileSizeCandidate)));
  return {
    type,
    status,
    reference: `${payload.reference ?? base.reference ?? ''}`.trim() || null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    storageKey,
    fileName,
    contentType,
    fileSize,
    submittedAt: toISOString(payload.submittedAt ?? base.submittedAt ?? new Date(), 'submittedAt'),
    storedAt: payload.storedAt ? toISOString(payload.storedAt, 'storedAt') : base.storedAt ?? null,
  };
}

function sanitiseWalletTransaction(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const amountCandidate = payload.amount ?? base.amount ?? 0;
  const amount = Number.parseFloat(amountCandidate);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new ValidationError('Transaction amount must be a non-zero number.');
  }
  return {
    type: ensureEnum(payload.type ?? base.type ?? 'Mentorship earning', MENTOR_WALLET_TRANSACTION_TYPES, 'type'),
    status: ensureEnum(payload.status ?? base.status ?? 'Completed', MENTOR_WALLET_TRANSACTION_STATUSES, 'status'),
    amount: Math.round(amount * 100) / 100,
    currency: `${payload.currency ?? base.currency ?? 'GBP'}`.trim() || 'GBP',
    reference: `${payload.reference ?? base.reference ?? ''}`.trim() || `TXN-${Date.now()}`,
    description: clampNotes(payload.description ?? base.description ?? ''),
    occurredAt: toISOString(payload.occurredAt ?? base.occurredAt ?? new Date(), 'occurredAt'),
  };
}

function sanitiseInvoice(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const reference = `${payload.reference ?? base.reference ?? ''}`.trim() || `INV-${Date.now()}`;
  const menteeName = `${payload.mentee ?? base.menteeName ?? ''}`.trim();
  if (!menteeName) {
    throw new ValidationError('Invoice must include the mentee or organisation name.');
  }
  const amountCandidate = payload.amount ?? base.amount ?? 0;
  const amount = Number.parseFloat(amountCandidate);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Invoice amount must be greater than zero.');
  }
  return {
    reference,
    menteeName,
    amount: Math.round(amount * 100) / 100,
    currency: `${payload.currency ?? base.currency ?? 'GBP'}`.trim() || 'GBP',
    status: ensureEnum(payload.status ?? base.status ?? 'Draft', MENTOR_INVOICE_STATUSES, 'status'),
    issuedOn: toISOString(payload.issuedOn ?? base.issuedOn ?? new Date(), 'issuedOn'),
    dueOn: payload.dueOn ? toISOString(payload.dueOn, 'dueOn') : base.dueOn ?? null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
  };
}

function sanitisePayout(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const amountCandidate = payload.amount ?? base.amount ?? 0;
  const amount = Number.parseFloat(amountCandidate);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Payout amount must be greater than zero.');
  }
  return {
    reference: `${payload.reference ?? base.reference ?? ''}`.trim() || `PAYOUT-${Date.now()}`,
    amount: Math.round(amount * 100) / 100,
    currency: `${payload.currency ?? base.currency ?? 'GBP'}`.trim() || 'GBP',
    status: ensureEnum(payload.status ?? base.status ?? 'Scheduled', MENTOR_PAYOUT_STATUSES, 'status'),
    scheduledFor: toISOString(payload.scheduledFor ?? base.scheduledFor ?? new Date(), 'scheduledFor'),
    processedAt: payload.processedAt ? toISOString(payload.processedAt, 'processedAt') : base.processedAt ?? null,
    failureReason: `${payload.failureReason ?? base.failureReason ?? ''}`.trim() || null,
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
  };
}

function sanitiseHubUpdate(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    title: ensureTrimmedString(payload.title ?? base.title, 'title', { maxLength: 200 }),
    summary: ensureTrimmedString(payload.summary ?? base.summary, 'summary', { maxLength: 2000 }),
    category: ensureTrimmedString(payload.category ?? base.category ?? 'Operations', 'category', { maxLength: 80 }) ||
      'Operations',
    link: ensureTrimmedString(payload.link ?? base.link, 'link', { required: false, maxLength: 1024 }),
    status: ensureTrimmedString(payload.status ?? base.status ?? 'Draft', 'status', { maxLength: 40 }) || 'Draft',
    publishedAt: payload.publishedAt
      ? toISOString(payload.publishedAt, 'publishedAt')
      : base.publishedAt
      ? toISOString(base.publishedAt, 'publishedAt')
      : null,
  };
}

function sanitiseHubAction(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    label: ensureTrimmedString(payload.label ?? base.label, 'label', { maxLength: 240 }),
    owner: ensureTrimmedString(payload.owner ?? base.owner, 'owner', { required: false, maxLength: 120 }),
    dueAt: payload.dueAt ? toISOString(payload.dueAt, 'dueAt') : base.dueAt ? toISOString(base.dueAt, 'dueAt') : null,
    status: ensureTrimmedString(payload.status ?? base.status ?? 'Not started', 'status', { maxLength: 60 }) ||
      'Not started',
    priority: ensureTrimmedString(payload.priority ?? base.priority ?? 'Medium', 'priority', { maxLength: 40 }) ||
      'Medium',
  };
}

function sanitiseHubResource(payload, { existing } = {}) {
  const base = existing ? existing : {};
  const updatedAt = payload.updatedAt ?? payload.updatedAtExternal ?? base.updatedAtExternal ?? base.updatedAt ?? null;
  return {
    title: ensureTrimmedString(payload.title ?? base.title, 'title', { maxLength: 200 }),
    description: ensureTrimmedString(payload.description ?? base.description, 'description', {
      required: false,
      maxLength: 2000,
    }),
    type: ensureTrimmedString(payload.type ?? base.type ?? 'Resource', 'type', { maxLength: 60 }) || 'Resource',
    link: ensureTrimmedString(payload.link ?? base.link, 'link', { maxLength: 1024 }),
    thumbnail: ensureTrimmedString(payload.thumbnail ?? base.thumbnail, 'thumbnail', { required: false, maxLength: 1024 }),
    tags: ensureStringArray(payload.tags ?? base.tags ?? [], 'tags'),
    updatedAtExternal: updatedAt ? toISOString(updatedAt, 'updatedAt') : null,
  };
}

function sanitiseHubSpotlight(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    title: ensureTrimmedString(payload.title ?? base.title, 'title', { maxLength: 200 }),
    description: ensureTrimmedString(payload.description ?? base.description, 'description', { maxLength: 2000 }),
    videoUrl: ensureTrimmedString(payload.videoUrl ?? base.videoUrl, 'videoUrl', { required: false, maxLength: 1024 }),
    ctaLabel: ensureTrimmedString(payload.ctaLabel ?? base.ctaLabel, 'ctaLabel', { required: false, maxLength: 120 }),
    ctaLink: ensureTrimmedString(payload.ctaLink ?? base.ctaLink, 'ctaLink', { required: false, maxLength: 1024 }),
    thumbnailUrl: ensureTrimmedString(payload.thumbnailUrl ?? base.thumbnailUrl, 'thumbnailUrl', {
      required: false,
      maxLength: 1024,
    }),
    backgroundGradient: ensureTrimmedString(payload.backgroundColor ?? payload.backgroundGradient ?? base.backgroundGradient, 'backgroundColor', {
      required: false,
      maxLength: 180,
    }),
  };
}

function sanitiseOrder(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    reference: ensureTrimmedString(payload.reference ?? base.reference ?? `ORD-${Date.now()}`, 'reference', {
      maxLength: 120,
    }),
    mentee: ensureTrimmedString(payload.mentee ?? base.mentee, 'mentee', { maxLength: 191 }),
    package: ensureTrimmedString(payload.package ?? base.package, 'package', { required: false, maxLength: 191 }),
    amount: ensureOptionalNumber(payload.amount ?? base.amount, 'amount', { min: 0 }),
    currency: ensureTrimmedString(payload.currency ?? base.currency ?? 'GBP', 'currency', { maxLength: 6 }) || 'GBP',
    status: ensureTrimmedString(payload.status ?? base.status ?? 'Pending payment', 'status', { maxLength: 60 }) ||
      'Pending payment',
    channel: ensureTrimmedString(payload.channel ?? base.channel, 'channel', { required: false, maxLength: 80 }),
    orderedAt: payload.orderedAt ? toISOString(payload.orderedAt, 'orderedAt') : base.orderedAt ?? null,
    fulfillmentStatus:
      ensureTrimmedString(payload.fulfillmentStatus ?? base.fulfillmentStatus ?? 'In progress', 'fulfillmentStatus', {
        maxLength: 60,
      }) || 'In progress',
    notes: clampNotes(payload.notes ?? base.notes ?? ''),
    invoiceId: ensureTrimmedString(payload.invoiceId ?? base.invoiceId, 'invoiceId', { required: false, maxLength: 120 }),
  };
}

function sanitiseAdCampaign(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    name: ensureTrimmedString(payload.name ?? base.name, 'name', { maxLength: 191 }),
    objective: ensureTrimmedString(payload.objective ?? base.objective ?? 'Lead generation', 'objective', { maxLength: 120 }) ||
      'Lead generation',
    status: ensureTrimmedString(payload.status ?? base.status ?? 'Draft', 'status', { maxLength: 40 }) || 'Draft',
    budget: ensureOptionalNumber(payload.budget ?? base.budget, 'budget', { min: 0 }),
    spend: ensureOptionalNumber(payload.spend ?? base.spend, 'spend', { min: 0 }),
    impressions: ensureOptionalNumber(payload.impressions ?? base.impressions, 'impressions', { min: 0 }),
    clicks: ensureOptionalNumber(payload.clicks ?? base.clicks, 'clicks', { min: 0 }),
    conversions: ensureOptionalNumber(payload.conversions ?? base.conversions, 'conversions', { min: 0 }),
    startDate: payload.startDate ? toISOString(payload.startDate, 'startDate') : base.startDate ?? null,
    endDate: payload.endDate ? toISOString(payload.endDate, 'endDate') : base.endDate ?? null,
    placements: ensureStringArray(payload.placements ?? base.placements ?? [], 'placements'),
    cta: ensureTrimmedString(payload.cta ?? base.cta, 'cta', { required: false, maxLength: 160 }),
    creativeUrl: ensureTrimmedString(payload.creativeUrl ?? base.creativeUrl, 'creativeUrl', { required: false, maxLength: 1024 }),
    thumbnail: ensureTrimmedString(payload.thumbnail ?? base.thumbnail, 'thumbnail', { required: false, maxLength: 1024 }),
    audience: ensureTrimmedString(payload.audience ?? base.audience, 'audience', { required: false, maxLength: 255 }),
  };
}

function sanitiseMetricWidgetPayload(payload, { existing } = {}) {
  const base = existing ? existing : {};
  return {
    name: ensureTrimmedString(payload.name ?? base.name, 'name', { maxLength: 191 }),
    value: ensureOptionalNumber(payload.value ?? base.value ?? 0, 'value') ?? 0,
    goal: ensureOptionalNumber(payload.goal ?? base.goal, 'goal', { min: 0 }),
    unit: ensureTrimmedString(payload.unit ?? base.unit, 'unit', { required: false, maxLength: 16 }),
    timeframe: ensureTrimmedString(payload.timeframe ?? base.timeframe ?? 'Last 30 days', 'timeframe', {
      maxLength: 60,
    }) || 'Last 30 days',
    insight: ensureTrimmedString(payload.insight ?? base.insight, 'insight', { required: false, maxLength: 2000 }),
    trend: ensureOptionalNumber(payload.trend ?? base.trend, 'trend'),
    variance: ensureOptionalNumber(payload.variance ?? base.variance, 'variance'),
    samples: ensureStringArray(payload.samples ?? base.samples ?? [], 'samples').map((entry) => Number(entry) || 0),
  };
}

function sanitiseMetricReporting(payload, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  return {
    cadence: ensureTrimmedString(payload.cadence ?? base.cadence ?? 'Weekly', 'cadence', { maxLength: 80 }) || 'Weekly',
    delivery: ensureTrimmedString(payload.delivery ?? base.delivery ?? 'Email & Slack', 'delivery', { maxLength: 120 }) ||
      'Email & Slack',
    recipients: ensureStringArray(payload.recipients ?? base.recipients ?? [], 'recipients'),
    nextDispatchAt: payload.nextDispatchAt
      ? toISOString(payload.nextDispatchAt, 'nextDispatchAt')
      : base.nextDispatchAt
      ? toISOString(base.nextDispatchAt, 'nextDispatchAt')
      : null,
  };
}

function sanitiseMentorSettings(payload = {}) {
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
        .map((attachment) => ({
          id: ensureTrimmedString(attachment.id ?? `${Date.now()}`, 'attachment id', { maxLength: 120 }) || `${Date.now()}`,
          label: ensureTrimmedString(attachment.label, 'attachment label', { maxLength: 180 }),
          url: ensureTrimmedString(attachment.url, 'attachment url', { maxLength: 1024 }),
          type: ensureTrimmedString(attachment.type ?? 'Document', 'attachment type', { maxLength: 60 }) || 'Document',
        }))
        .filter((attachment) => attachment.label && attachment.url)
    : [];

  return {
    contactEmail: ensureTrimmedString(payload.contactEmail, 'contactEmail', { required: false, maxLength: 320 }),
    supportEmail: ensureTrimmedString(payload.supportEmail, 'supportEmail', { required: false, maxLength: 320 }),
    website: ensureTrimmedString(payload.website, 'website', { required: false, maxLength: 1024 }),
    timezone: ensureTrimmedString(payload.timezone, 'timezone', { required: false, maxLength: 120 }),
    availabilityLeadTimeHours: ensureOptionalNumber(payload.availabilityLeadTimeHours, 'availabilityLeadTimeHours', {
      min: 0,
      max: 240,
    }),
    bookingWindowDays: ensureOptionalNumber(payload.bookingWindowDays, 'bookingWindowDays', { min: 0, max: 365 }),
    autoAcceptReturning: Boolean(payload.autoAcceptReturning),
    doubleOptInIntroductions: Boolean(payload.doubleOptInIntroductions),
    calendlyLink: ensureTrimmedString(payload.calendlyLink, 'calendlyLink', { required: false, maxLength: 1024 }),
    zoomRoom: ensureTrimmedString(payload.zoomRoom, 'zoomRoom', { required: false, maxLength: 1024 }),
    videoGreeting: ensureTrimmedString(payload.videoGreeting, 'videoGreeting', { required: false, maxLength: 1024 }),
    signature: ensureTrimmedString(payload.signature, 'signature', { required: false, maxLength: 2000 }),
    attachments,
    brandPrimaryColor: ensureTrimmedString(payload.brandPrimaryColor, 'brandPrimaryColor', { required: false, maxLength: 14 }),
    brandSecondaryColor: ensureTrimmedString(payload.brandSecondaryColor, 'brandSecondaryColor', {
      required: false,
      maxLength: 14,
    }),
    heroTagline: ensureTrimmedString(payload.heroTagline, 'heroTagline', { required: false, maxLength: 240 }),
    confirmationEmailTemplate: clampNotes(payload.confirmationEmailTemplate ?? ''),
    reminderSmsTemplate: clampNotes(payload.reminderSmsTemplate ?? ''),
    sendAgendaSlack: Boolean(payload.sendAgendaSlack),
    autoDispatchRecap: Boolean(payload.autoDispatchRecap),
  };
}

function sanitiseMentorPreferences(payload = {}, { existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const preferences = { ...(base.preferences ?? {}), ...payload };
  if (preferences.notifications) {
    const notifications = { ...preferences.notifications };
    Object.keys(notifications).forEach((key) => {
      notifications[key] = Boolean(notifications[key]);
    });
    preferences.notifications = notifications;
  }
  if (preferences.aiAssistant) {
    const assistant = { ...preferences.aiAssistant };
    if ('tone' in assistant) {
      assistant.tone = ensureTrimmedString(assistant.tone, 'aiAssistant.tone', { required: false, maxLength: 120 });
    }
    assistant.enabled = Boolean(assistant.enabled);
    assistant.autopilot = Boolean(assistant.autopilot);
    preferences.aiAssistant = assistant;
  }
  if (preferences.security) {
    const security = { ...preferences.security };
    if ('sessionTimeoutMinutes' in security) {
      security.sessionTimeoutMinutes = ensureOptionalNumber(security.sessionTimeoutMinutes, 'sessionTimeoutMinutes', {
        min: 5,
        max: 720,
      });
    }
    if ('deviceApprovals' in security) {
      security.deviceApprovals = ensureOptionalNumber(security.deviceApprovals, 'deviceApprovals', { min: 0, max: 10 });
    }
    if (Array.isArray(security.logs)) {
      security.logs = security.logs
        .map((entry) => ({
          id: ensureTrimmedString(entry.id ?? `${Date.now()}`, 'log id', { maxLength: 120 }) || `${Date.now()}`,
          event: ensureTrimmedString(entry.event, 'log event', { maxLength: 240 }),
          occurredAt: entry.occurredAt ? toISOString(entry.occurredAt, 'log occurredAt') : null,
          level: ensureTrimmedString(entry.level ?? 'info', 'log level', { maxLength: 40 }) || 'info',
          location: ensureTrimmedString(entry.location, 'log location', { required: false, maxLength: 120 }),
        }))
        .filter((entry) => entry.event);
    }
    if (Array.isArray(security.devices)) {
      security.devices = security.devices
        .map((device) => ({
          id: ensureTrimmedString(device.id ?? `${Date.now()}`, 'device id', { maxLength: 120 }) || `${Date.now()}`,
          name: ensureTrimmedString(device.name, 'device name', { maxLength: 120 }),
          location: ensureTrimmedString(device.location, 'device location', { required: false, maxLength: 120 }),
          lastActiveAt: device.lastActiveAt ? toISOString(device.lastActiveAt, 'device lastActiveAt') : null,
        }))
        .filter((device) => device.name);
    }
    security.mfaEnabled = Boolean(security.mfaEnabled);
    preferences.security = security;
  }
  if (preferences.api) {
    const api = { ...preferences.api };
    if ('keyPreview' in api) {
      api.keyPreview = ensureTrimmedString(api.keyPreview, 'api key preview', { required: false, maxLength: 120 });
    }
    if ('lastRotatedAt' in api && api.lastRotatedAt) {
      api.lastRotatedAt = toISOString(api.lastRotatedAt, 'api lastRotatedAt');
    }
    preferences.api = api;
  }
  preferences.theme = ensureTrimmedString(preferences.theme, 'theme', { required: false, maxLength: 40 }) || preferences.theme;
  preferences.language = ensureTrimmedString(preferences.language, 'language', { required: false, maxLength: 10 }) ||
    preferences.language;
  return preferences;
}

function mapProfile(profile) {
  if (!profile) {
    return null;
  }
  const plain = profile.get({ plain: true });
  return {
    mentorId: plain.userId ?? null,
    slug: plain.slug,
    name: plain.name,
    headline: plain.headline ?? null,
    bio: plain.bio ?? null,
    region: plain.region ?? null,
    discipline: plain.discipline ?? null,
    expertise: Array.isArray(plain.expertise) ? plain.expertise : [],
    availabilityStatus: plain.availabilityStatus,
    availabilityNotes: plain.availabilityNotes ?? null,
    responseTimeHours: plain.responseTimeHours ?? null,
    reviewCount: Number(plain.reviewCount ?? 0),
    rating: plain.rating ? Number(plain.rating) : null,
    verificationBadge: plain.verificationBadge ?? null,
    testimonialHighlight: plain.testimonialHighlight ?? null,
    testimonialHighlightAuthor: plain.testimonialHighlightAuthor ?? null,
    testimonials: Array.isArray(plain.testimonials) ? plain.testimonials : [],
    packages: Array.isArray(plain.packages) ? plain.packages : [],
    avatarUrl: plain.avatarUrl ?? null,
    promoted: Boolean(plain.promoted),
    rankingScore: plain.rankingScore ? Number(plain.rankingScore) : 0,
    lastActiveAt: plain.lastActiveAt instanceof Date ? plain.lastActiveAt.toISOString() : plain.lastActiveAt,
  };
}

function mapFeedback(reviews = []) {
  if (!Array.isArray(reviews)) {
    return [];
  }

  return reviews.map((review) => {
    const plain = review.get({ plain: true });
    const reviewer = plain.reviewer ?? {};
    const fullName = [reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ').trim() || null;
    return {
      id: plain.id,
      mentee: plain.reviewerName ?? fullName,
      rating: Number(plain.rating ?? 0),
      headline: plain.headline ?? null,
      feedback: plain.feedback ?? null,
      publishedAt: plain.publishedAt instanceof Date ? plain.publishedAt.toISOString() : plain.publishedAt,
    };
  });
}

function calculateChange(current, previous) {
  if (previous == null || previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function summariseBookings(bookings, lookbackDays) {
  const now = Date.now();
  const windowStart = now - lookbackDays * DAY_MS;
  const previousWindowStart = windowStart - lookbackDays * DAY_MS;
  const previousWindowEnd = windowStart;

  const toMs = (value) => new Date(value.scheduledAt).getTime();

  const active = bookings.filter((booking) => toMs(booking) >= windowStart);
  const previous = bookings.filter((booking) => {
    const timestamp = toMs(booking);
    return timestamp >= previousWindowStart && timestamp < previousWindowEnd;
  });

  const activeMentees = new Set(active.map((booking) => booking.mentee)).size;
  const previousMentees = new Set(previous.map((booking) => booking.mentee)).size;
  const upcomingSessions = active.filter((booking) => toMs(booking) >= now).length;
  const previousUpcoming = previous.filter((booking) => toMs(booking) >= previousWindowEnd).length;

  const revenue = active
    .filter((booking) => booking.paymentStatus === 'Paid')
    .reduce((total, booking) => total + Number(booking.price ?? 0), 0);
  const previousRevenue = previous
    .filter((booking) => booking.paymentStatus === 'Paid')
    .reduce((total, booking) => total + Number(booking.price ?? 0), 0);

  return {
    activeMentees,
    previousMentees,
    upcomingSessions,
    previousUpcoming,
    revenue: Math.round(revenue * 100) / 100,
    previousRevenue: Math.round(previousRevenue * 100) / 100,
  };
}

function buildPerformanceHistory(bookings) {
  const history = [];
  const now = Date.now();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const periodEnd = now - offset * 7 * DAY_MS;
    const periodStart = periodEnd - 7 * DAY_MS;
    const slice = bookings.filter((booking) => {
      const timestamp = new Date(booking.scheduledAt).getTime();
      return timestamp >= periodStart && timestamp < periodEnd;
    });
    const activeMentees = new Set(slice.map((booking) => booking.mentee)).size;
    const upcomingSessions = slice.filter((booking) => new Date(booking.scheduledAt).getTime() >= periodEnd).length;
    const revenue = slice
      .filter((booking) => booking.paymentStatus === 'Paid')
      .reduce((total, booking) => total + Number(booking.price ?? 0), 0);
    history.push({
      recordedAt: new Date(periodEnd).toISOString(),
      activeMentees,
      upcomingSessions,
      avgRating: 0,
      monthlyRevenue: Math.round(revenue * 100) / 100,
    });
  }
  return history;
}

function buildConversionHistory(bookings) {
  const buckets = [];
  const now = Date.now();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const bucketEnd = now - offset * 7 * DAY_MS;
    const bucketStart = bucketEnd - 7 * DAY_MS;
    const slice = bookings.filter((booking) => {
      const timestamp = new Date(booking.scheduledAt).getTime();
      return timestamp >= bucketStart && timestamp < bucketEnd;
    });
    const confirmed = slice.filter((booking) => booking.status === 'Scheduled').length;
    const requests = slice.length;
    const views = Math.max(100, requests * 4 + confirmed * 6);
    buckets.push({
      recordedAt: new Date(bucketEnd).toISOString(),
      views,
      requests,
      confirmed,
    });
  }
  return buckets;
}

function buildWalletSummary(transactions) {
  if (!transactions.length) {
    return {
      balance: 0,
      currency: 'GBP',
      available: 0,
      pending: 0,
      transactions: [],
    };
  }
  const balance = transactions.reduce((total, txn) => total + Number(txn.amount ?? 0), 0);
  const available = transactions
    .filter((txn) => txn.status === 'Completed')
    .reduce((total, txn) => total + Number(txn.amount ?? 0), 0);
  const pending = transactions
    .filter((txn) => txn.status === 'Pending' || txn.status === 'Processing')
    .reduce((total, txn) => total + Number(txn.amount ?? 0), 0);
  return {
    balance: Math.round(balance * 100) / 100,
    currency: transactions[0].currency,
    available: Math.round(available * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    transactions,
  };
}

function buildFinanceSummary({ invoices, payouts, walletSummary, bookingSummary }) {
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'Paid');
  const recognisedRevenue = paidInvoices.reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0);

  const outstandingInvoices = invoices
    .filter((invoice) => invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
    .reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0);

  const upcomingPayouts = payouts
    .filter((payout) => payout.status !== 'Paid' && payout.status !== 'Failed')
    .reduce((total, payout) => total + Number(payout.amount ?? 0), 0);

  const currencyCandidate =
    walletSummary.currency ?? invoices[0]?.currency ?? payouts[0]?.currency ?? 'GBP';

  const projected = recognisedRevenue + outstandingInvoices;
  const variance = bookingSummary
    ? Math.round((recognisedRevenue - bookingSummary.revenue) * 100) / 100
    : 0;

  return {
    recognisedRevenue: Math.round(recognisedRevenue * 100) / 100,
    outstandingInvoices: Math.round(outstandingInvoices * 100) / 100,
    pendingPayouts: Math.round(upcomingPayouts * 100) / 100,
    paidInvoices: Math.round(recognisedRevenue * 100) / 100,
    availableBalance: walletSummary.available,
    upcomingPayouts: Math.round(upcomingPayouts * 100) / 100,
    walletBalance: walletSummary.balance,
    walletAvailable: walletSummary.available,
    currency: currencyCandidate,
    projected: Math.round(projected * 100) / 100,
    variance,
  };
}

function buildRevenueStreams(bookings, packages, invoices) {
  if (!Array.isArray(bookings)) {
    return [];
  }
  const packageIndex = new Map();
  (packages ?? []).forEach((pack) => {
    const key = pack.name ?? pack.id;
    if (key != null) {
      packageIndex.set(key, pack);
    }
  });

  let oneToOne = 0;
  let cohort = 0;
  let asyncValue = 0;

  bookings.forEach((booking) => {
    const amount = Number(booking.price ?? 0);
    const packageKey = booking.package ?? booking.packageName;
    const packageMeta = packageIndex.get(packageKey);
    const channel = (booking.channel ?? '').toLowerCase();
    if (packageMeta?.format && packageMeta.format.toLowerCase().includes('cohort')) {
      cohort += amount;
    } else if (channel.includes('async') || channel.includes('retainer')) {
      asyncValue += amount;
    } else {
      oneToOne += amount;
    }
  });

  const additionalInvoiceValue = (invoices ?? [])
    .filter((invoice) => invoice.status === 'Sent' || invoice.status === 'Draft')
    .reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0);

  if (additionalInvoiceValue > 0) {
    asyncValue += additionalInvoiceValue;
  }

  const streams = [
    { id: 'one-on-one', label: '1:1 mentorship', amount: Math.round(oneToOne * 100) / 100 },
    { id: 'cohort-programmes', label: 'Cohort programmes', amount: Math.round(cohort * 100) / 100 },
    { id: 'async-retainers', label: 'Async & retainers', amount: Math.round(asyncValue * 100) / 100 },
  ];

  if (!streams.some((stream) => stream.amount > 0)) {
    streams[0].amount = 0;
  }

  return streams;
}

function buildClientSummary(clients) {
  if (!Array.isArray(clients)) {
    return { total: 0, flagship: 0, pipelineValue: 0, byStatus: {} };
  }
  const summary = {
    total: clients.length,
    flagship: 0,
    pipelineValue: 0,
    byStatus: {},
  };

  clients.forEach((client) => {
    const status = client.status ?? 'Active';
    summary.byStatus[status] = (summary.byStatus[status] ?? 0) + 1;
    if ((client.tier ?? '').toLowerCase() === 'flagship') {
      summary.flagship += 1;
    }
    summary.pipelineValue += Number(client.value ?? 0);
  });

  summary.pipelineValue = Math.round(summary.pipelineValue * 100) / 100;
  return summary;
}

function buildSupportSummary(tickets) {
  if (!Array.isArray(tickets)) {
    return { open: 0, awaitingMentor: 0, urgent: 0 };
  }
  return tickets.reduce(
    (acc, ticket) => {
      const status = (ticket.status ?? '').toLowerCase();
      const priority = (ticket.priority ?? '').toLowerCase();
      if (status === 'open' || status === 'awaiting support') {
        acc.open += 1;
      }
      if (status.includes('mentor')) {
        acc.awaitingMentor += 1;
      }
      if (priority === 'urgent' || priority === 'critical') {
        acc.urgent += 1;
      }
      return acc;
    },
    { open: 0, awaitingMentor: 0, urgent: 0 },
  );
}

function buildInboxSummary(messages) {
  if (!Array.isArray(messages)) {
    return { unread: 0, total: 0 };
  }
  const unread = messages.filter((message) => (message.status ?? '').toLowerCase() === 'unread').length;
  return { unread, total: messages.length };
}

function buildCohortMetrics(bookings) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return [];
  }
  const totals = new Map();
  bookings.forEach((booking) => {
    const key = (booking.channel ?? 'Explorer').trim() || 'Explorer';
    const entry = totals.get(key) ?? { requests: 0, confirmed: 0, pending: 0 };
    entry.requests += 1;
    const status = (booking.status ?? '').toLowerCase();
    if (status === 'scheduled' || status === 'completed') {
      entry.confirmed += 1;
    } else {
      entry.pending += 1;
    }
    totals.set(key, entry);
  });

  return Array.from(totals.entries()).map(([channel, entry]) => {
    const conversion = entry.requests ? Math.round((entry.confirmed / entry.requests) * 100) : 0;
    const changeBasis = entry.requests ? ((entry.confirmed - entry.pending) / entry.requests) * 100 : 0;
    const change = Math.round(changeBasis);
    return {
      id: channel.toLowerCase().replace(/\s+/g, '-'),
      label: channel,
      conversion,
      change,
    };
  });
}

function buildOrdersSummary(orders) {
  if (!Array.isArray(orders)) {
    return { totalOrders: 0, openOrders: 0, revenue: 0, avgOrderValue: 0 };
  }
  const revenue = orders.reduce((total, order) => total + Number(order.amount ?? 0), 0);
  const openOrders = orders.filter((order) => (order.status ?? '').toLowerCase() !== 'paid').length;
  return {
    totalOrders: orders.length,
    openOrders,
    revenue: Math.round(revenue * 100) / 100,
    avgOrderValue: orders.length ? Math.round((revenue / orders.length) * 100) / 100 : 0,
  };
}

function buildAdsInsights(campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return { totalSpend: 0, leads: 0, roas: 0, avgCpc: 0 };
  }
  const totals = campaigns.reduce(
    (acc, campaign) => {
      acc.spend += Number(campaign.spend ?? 0);
      acc.conversions += Number(campaign.conversions ?? 0);
      acc.clicks += Number(campaign.clicks ?? 0);
      return acc;
    },
    { spend: 0, conversions: 0, clicks: 0 },
  );

  const roas = totals.spend > 0 ? Math.round((totals.conversions / totals.spend) * 100) / 100 : 0;
  const avgCpc = totals.clicks > 0 ? Math.round((totals.spend / totals.clicks) * 100) / 100 : 0;

  return {
    totalSpend: Math.round(totals.spend * 100) / 100,
    leads: Math.round(totals.conversions),
    roas,
    avgCpc,
  };
}

function buildHubSummary(updates = [], actions = []) {
  const now = Date.now();
  const published = updates.filter((update) => (update.status ?? '').toLowerCase() === 'published').length;
  const drafts = updates.length - published;
  const overdueActions = actions.filter((action) => {
    if (!action.dueAt) {
      return false;
    }
    const dueAt = new Date(action.dueAt).getTime();
    return Number.isFinite(dueAt) && dueAt < now && (action.status ?? '').toLowerCase() !== 'completed';
  }).length;
  const dueSoon = actions
    .filter((action) => {
      if (!action.dueAt) {
        return false;
      }
      const dueAt = new Date(action.dueAt).getTime();
      if (!Number.isFinite(dueAt)) {
        return false;
      }
      return dueAt >= now && dueAt <= now + 7 * DAY_MS;
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5)
    .map((action) => ({ id: action.id, label: action.label, dueAt: action.dueAt, owner: action.owner ?? null }));

  const actionMomentum = actions.reduce(
    (acc, action) => {
      const status = (action.status ?? '').toLowerCase();
      if (status.includes('progress') || status.includes('in-progress')) {
        acc.inProgress += 1;
      } else if (status.includes('completed') || status.includes('done')) {
        acc.completed += 1;
      } else {
        acc.notStarted += 1;
      }
      return acc;
    },
    { completed: 0, inProgress: 0, notStarted: 0 },
  );

  return {
    publishedUpdates: published,
    draftUpdates: drafts < 0 ? 0 : drafts,
    activeActions: actions.length,
    overdueActions,
    dueSoon,
    actionMomentum,
  };
}

function buildCreationStudioSummary(items = []) {
  const summary = {
    total: items.length,
    published: 0,
    drafts: 0,
    scheduled: 0,
    archived: 0,
    recentLaunches: [],
    upcomingLaunches: [],
  };

  const published = [];
  const upcoming = [];

  items.forEach((item) => {
    const status = (item.status ?? '').toLowerCase();
    if (status === 'published') {
      summary.published += 1;
      published.push(item);
    } else if (status === 'draft') {
      summary.drafts += 1;
    } else if (status === 'scheduled') {
      summary.scheduled += 1;
      upcoming.push(item);
    } else if (status === 'archived') {
      summary.archived += 1;
    }
  });

  summary.recentLaunches = published
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      publishedAt: item.publishedAt ?? item.updatedAt ?? null,
    }));

  summary.upcomingLaunches = upcoming
    .sort((a, b) => new Date(a.publishAt || a.launchAt || Infinity) - new Date(b.publishAt || b.launchAt || Infinity))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      publishAt: item.publishAt ?? item.launchAt ?? null,
    }));

  summary.nextLaunch = summary.upcomingLaunches.length ? summary.upcomingLaunches[0] : null;

  return summary;
}

function buildMetricsDashboard(widgets = [], reportingSettings = null) {
  const widgetsWithInsights = widgets.map((widget) => {
    const goal = Number(widget.goal ?? 0);
    const value = Number(widget.value ?? 0);
    const attainment = goal > 0 ? Math.round((value / goal) * 100) : null;
    return { ...widget, attainment };
  });

  const onTrack = widgetsWithInsights.filter((widget) => {
    if (widget.attainment == null) {
      return false;
    }
    if (widget.trend == null) {
      return widget.attainment >= 70;
    }
    return widget.attainment >= 70 && Number(widget.trend) >= 0;
  }).length;

  return {
    widgets: widgetsWithInsights,
    summary: {
      total: widgets.length,
      onTrack,
      needsAttention: Math.max(0, widgets.length - onTrack),
    },
    reporting:
      reportingSettings ?? {
        cadence: 'Weekly',
        delivery: 'Email & Slack',
        recipients: [],
        nextDispatchAt: null,
      },
  };
}

function mapMentorSettingsRow(row) {
  if (!row) {
    return { settings: {}, updatedAt: null };
  }
  const payload = row.toPublicObject();
  return { settings: payload.settings ?? {}, updatedAt: payload.updatedAt ?? null };
}

function mapMentorSystemPreferencesRow(row) {
  if (!row) {
    return { preferences: { notifications: {}, theme: 'system' }, updatedAt: null };
  }
  const payload = row.toPublicObject();
  return { preferences: payload.preferences ?? {}, updatedAt: payload.updatedAt ?? null };
}

function mapMetricReporting(row) {
  if (!row) {
    return { cadence: 'Weekly', delivery: 'Email & Slack', recipients: [], nextDispatchAt: null };
  }
  return row.toPublicObject();
}

function buildSegments(bookings) {
  const active = bookings.filter((booking) => booking.status === 'Scheduled').length;
  const pending = bookings.filter((booking) => booking.status === 'Awaiting pre-work').length;
  const completed = bookings.filter((booking) => booking.status === 'Completed').length;
  return [
    {
      id: 'active',
      title: 'Confirmed sessions',
      description: 'Mentorship sessions locked in with payment confirmed.',
      count: active,
    },
    {
      id: 'pending',
      title: 'Pending actions',
      description: 'Bookings awaiting payment, materials, or pre-work.',
      count: pending,
    },
    {
      id: 'completed',
      title: 'Completed sessions',
      description: 'Recently closed mentorship sessions awaiting follow-up.',
      count: completed,
    },
  ];
}

function buildExplorerPlacement(stats, walletSummary) {
  const score = Math.min(100, Math.round((stats.activeMentees + walletSummary.available) * 2));
  const position = score >= 90 ? 'Top 3 in leadership mentorship' : 'Featured in mentorship explorer';
  const nextActions = [
    'Add new availability slots for next week',
    'Upload latest testimonial video',
    'Promote async review package to mentees',
  ];
  return { score, position, nextActions };
}

function mapVerification(verification, documents) {
  const verificationPayload = verification ? verification.toPublicObject() : null;
  return {
    status: verificationPayload?.status ?? 'Not started',
    lastSubmittedAt: verificationPayload?.lastSubmittedAt ?? null,
    notes: verificationPayload?.notes ?? null,
    documents: documents.map((document) => document.toPublicObject()),
  };
}

async function fetchMentorProfile(mentorId) {
  const profile = await MentorProfile.findOne({ where: { userId: mentorId } });
  return mapProfile(profile);
}

function mapCollection(records) {
  return records.map((record) => record.toPublicObject());
}

export async function getMentorDashboard(mentorId, options = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const lookbackDays = normaliseLookbackDays(options.lookbackDays ?? 30);

  const [
    profile,
    availabilityRows,
    packageRows,
    bookingRows,
    clientRows,
    eventRows,
    ticketRows,
    messageRows,
    verificationRow,
    verificationDocumentRows,
    walletTransactionRows,
    invoiceRows,
    payoutRows,
    reviewRows,
    hubUpdateRows,
    hubActionRows,
    hubResourceRows,
    hubSpotlightRow,
    orderRows,
    adRows,
    metricWidgetRows,
    metricReportingRow,
    mentorSettingsRow,
    mentorSystemPreferenceRow,
    creationStudioSnapshot,
  ] = await Promise.all([
    fetchMentorProfile(normalisedMentorId),
    MentorAvailabilitySlot.findAll({ where: { mentorId: normalisedMentorId }, order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']] }),
    MentorPackage.findAll({ where: { mentorId: normalisedMentorId }, order: [['name', 'ASC']] }),
    MentorBooking.findAll({ where: { mentorId: normalisedMentorId }, order: [['scheduledAt', 'ASC']] }),
    MentorClient.findAll({ where: { mentorId: normalisedMentorId }, order: [['status', 'ASC'], ['name', 'ASC']] }),
    MentorEvent.findAll({ where: { mentorId: normalisedMentorId }, order: [['startsAt', 'ASC']] }),
    MentorSupportTicket.findAll({ where: { mentorId: normalisedMentorId }, order: [['submittedAt', 'DESC']] }),
    MentorMessage.findAll({ where: { mentorId: normalisedMentorId }, order: [['receivedAt', 'DESC']] }),
    MentorVerification.findOne({ where: { mentorId: normalisedMentorId } }),
    MentorVerificationDocument.findAll({ where: { mentorId: normalisedMentorId }, order: [['submittedAt', 'DESC']] }),
    MentorWalletTransaction.findAll({ where: { mentorId: normalisedMentorId }, order: [['occurredAt', 'DESC']] }),
    MentorInvoice.findAll({ where: { mentorId: normalisedMentorId }, order: [['issuedOn', 'DESC']] }),
    MentorPayout.findAll({ where: { mentorId: normalisedMentorId }, order: [['scheduledFor', 'DESC']] }),
    MentorReview.findAll({
      where: { mentorId: normalisedMentorId },
      order: [['publishedAt', 'DESC']],
      limit: 10,
      include: [{ association: 'reviewer', attributes: ['firstName', 'lastName'] }],
    }),
    MentorHubUpdate.findAll({ where: { mentorId: normalisedMentorId }, order: [['createdAt', 'DESC']] }),
    MentorHubAction.findAll({ where: { mentorId: normalisedMentorId }, order: [['dueAt', 'ASC'], ['id', 'ASC']] }),
    MentorHubResource.findAll({ where: { mentorId: normalisedMentorId }, order: [['updatedAtExternal', 'DESC'], ['updatedAt', 'DESC']] }),
    MentorHubSpotlight.findOne({ where: { mentorId: normalisedMentorId } }),
    MentorOrder.findAll({ where: { mentorId: normalisedMentorId }, order: [['orderedAt', 'DESC'], ['id', 'DESC']] }),
    MentorAdCampaign.findAll({ where: { mentorId: normalisedMentorId }, order: [['updatedAt', 'DESC'], ['id', 'DESC']] }),
    MentorMetricWidget.findAll({ where: { mentorId: normalisedMentorId }, order: [['updatedAt', 'DESC'], ['id', 'DESC']] }),
    MentorMetricReportingSetting.findOne({ where: { mentorId: normalisedMentorId } }),
    MentorSettings.findOne({ where: { mentorId: normalisedMentorId } }),
    MentorSystemPreference.findOne({ where: { mentorId: normalisedMentorId } }),
    getCreationStudioDashboard(normalisedMentorId),
  ]);

  const availability = mapCollection(availabilityRows);
  const packages = mapCollection(packageRows);
  const bookings = mapCollection(bookingRows);
  const clients = mapCollection(clientRows);
  const events = mapCollection(eventRows);
  const supportTickets = mapCollection(ticketRows);
  const messages = mapCollection(messageRows);
  const verification = mapVerification(verificationRow, verificationDocumentRows);
  const walletTransactions = mapCollection(walletTransactionRows);
  const invoices = mapCollection(invoiceRows);
  const payouts = mapCollection(payoutRows);
  const feedback = mapFeedback(reviewRows);
  const hubUpdates = mapCollection(hubUpdateRows);
  const hubActions = mapCollection(hubActionRows);
  const hubResources = mapCollection(hubResourceRows);
  const hubSpotlight = hubSpotlightRow ? hubSpotlightRow.toPublicObject() : null;
  const orders = mapCollection(orderRows);
  const adCampaigns = mapCollection(adRows);
  const metricWidgets = mapCollection(metricWidgetRows);
  const metricReporting = mapMetricReporting(metricReportingRow);
  const mentorSettings = mapMentorSettingsRow(mentorSettingsRow);
  const mentorSystemPreferences = mapMentorSystemPreferencesRow(mentorSystemPreferenceRow);
  const creationStudioItems = Array.isArray(creationStudioSnapshot?.items)
    ? creationStudioSnapshot.items
    : [];
  const creationStudioSummary = creationStudioSnapshot?.summary
    ? creationStudioSnapshot.summary
    : buildCreationStudioSummary(creationStudioItems);
  const creationStudioCatalog = creationStudioSnapshot?.catalog ?? [];
  const creationStudioShareDestinations = creationStudioSnapshot?.shareDestinations ?? [];

  const bookingSummary = summariseBookings(bookings, lookbackDays);
  const avgRating = feedback.length
    ? Math.round((feedback.reduce((total, review) => total + Number(review.rating ?? 0), 0) / feedback.length) * 10) / 10
    : 0;
  const prevAvgRating = avgRating;
  const walletSummary = buildWalletSummary(walletTransactions);
  const finance = buildFinanceSummary({
    invoices,
    payouts,
    walletSummary,
    bookingSummary,
  });
  const clientSummary = buildClientSummary(clients);
  const supportSummary = buildSupportSummary(supportTickets);
  const inboxSummary = buildInboxSummary(messages);
  const cohortMetrics = buildCohortMetrics(bookings);
  const ordersSummary = buildOrdersSummary(orders);
  const adsInsights = buildAdsInsights(adCampaigns);
  const hubSummary = buildHubSummary(hubUpdates, hubActions);
  const metricsDashboard = buildMetricsDashboard(metricWidgets, metricReporting);
  const revenueStreams = buildRevenueStreams(bookings, packages, invoices);

  return {
    mentorId: normalisedMentorId,
    profile,
    availability,
    packages,
    bookings,
    clients,
    calendar: { events },
    support: { tickets: supportTickets },
    inbox: { messages },
    verification,
    wallet: walletSummary,
    invoices,
    payouts,
    segments: buildSegments(bookings),
    feedback,
    explorerPlacement: buildExplorerPlacement(bookingSummary, walletSummary),
    finance,
    clientSummary,
    supportSummary,
    inboxSummary,
    cohortMetrics,
    revenueStreams,
    orders: { list: orders, summary: ordersSummary },
    ads: { campaigns: adCampaigns, insights: adsInsights },
    hub: {
      updates: hubUpdates,
      actions: hubActions,
      resources: hubResources,
      spotlight: hubSpotlight,
      summary: hubSummary,
    },
    creationStudio: {
      items: creationStudioItems,
      summary: creationStudioSummary,
      catalog: creationStudioCatalog,
      shareDestinations: creationStudioShareDestinations,
    },
    metricsDashboard,
    settings: mentorSettings,
    systemPreferences: mentorSystemPreferences,
    performanceHistory: buildPerformanceHistory(bookings),
    conversionHistory: buildConversionHistory(bookings),
    stats: {
      activeMentees: bookingSummary.activeMentees,
      activeMenteesChange: calculateChange(bookingSummary.activeMentees, bookingSummary.previousMentees),
      upcomingSessions: bookingSummary.upcomingSessions,
      upcomingSessionsChange: calculateChange(bookingSummary.upcomingSessions, bookingSummary.previousUpcoming),
      monthlyRevenue: bookingSummary.revenue,
      monthlyRevenueChange: calculateChange(bookingSummary.revenue, bookingSummary.previousRevenue),
      avgRating,
      avgRatingChange: calculateChange(avgRating, prevAvgRating),
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function updateMentorAvailability(mentorId, slots) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = validateAvailability(slots ?? []);
  return sequelize.transaction(async (transaction) => {
    await MentorAvailabilitySlot.destroy({ where: { mentorId: normalisedMentorId }, transaction });
    if (sanitised.length) {
      await MentorAvailabilitySlot.bulkCreate(
        sanitised.map((slot) => ({ mentorId: normalisedMentorId, ...slot })),
        { transaction },
      );
    }
    const rows = await MentorAvailabilitySlot.findAll({
      where: { mentorId: normalisedMentorId },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
      transaction,
    });
    return mapCollection(rows);
  });
}

export async function updateMentorPackages(mentorId, packagesPayload = []) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = packagesPayload.map(sanitisePackage);
  return sequelize.transaction(async (transaction) => {
    await MentorPackage.destroy({ where: { mentorId: normalisedMentorId }, transaction });
    if (sanitised.length) {
      await MentorPackage.bulkCreate(
        sanitised.map((pack) => ({ mentorId: normalisedMentorId, ...pack })),
        { transaction },
      );
    }
    const rows = await MentorPackage.findAll({
      where: { mentorId: normalisedMentorId },
      order: [['name', 'ASC']],
      transaction,
    });
    return mapCollection(rows);
  });
}

export async function submitMentorProfile(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const now = new Date();
  const profile = await MentorProfile.findOne({ where: { userId: normalisedMentorId } });
  const updates = {
    headline: payload.headline ?? profile?.headline ?? null,
    bio: payload.bio ?? profile?.bio ?? null,
    availabilityNotes: payload.availabilityNotes ?? profile?.availabilityNotes ?? null,
    responseTimeHours: payload.responseTimeHours ?? profile?.responseTimeHours ?? null,
    testimonials: payload.testimonials ?? profile?.testimonials ?? null,
    updatedAt: now,
  };
  if (profile) {
    await profile.update(updates);
    return mapProfile(profile);
  }
  const created = await MentorProfile.create({
    userId: normalisedMentorId,
    slug: payload.slug ?? `mentor-${normalisedMentorId}`,
    name: payload.name ?? `Mentor ${normalisedMentorId}`,
    availabilityStatus: payload.availabilityStatus ?? 'open',
    priceTier: payload.priceTier ?? 'tier_entry',
    ...updates,
  });
  return mapProfile(created);
}

async function findRecordOrThrow(Model, mentorId, recordId, message) {
  const record = await Model.findOne({ where: { id: recordId, mentorId } });
  if (!record) {
    throw new NotFoundError(message);
  }
  return record;
}

export async function createMentorBooking(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseBooking(payload);
  const created = await MentorBooking.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorBooking(mentorId, bookingId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const booking = await findRecordOrThrow(
    MentorBooking,
    normalisedMentorId,
    bookingId,
    'Mentor booking not found.',
  );
  const sanitised = sanitiseBooking(payload, { existing: booking });
  await booking.update(sanitised);
  return booking.toPublicObject();
}

export async function deleteMentorBooking(mentorId, bookingId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorBooking, normalisedMentorId, bookingId, 'Mentor booking not found.');
  await MentorBooking.destroy({ where: { id: bookingId, mentorId: normalisedMentorId } });
}

export async function createMentorClient(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseClient(payload);
  const created = await MentorClient.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorClient(mentorId, clientId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const client = await findRecordOrThrow(MentorClient, normalisedMentorId, clientId, 'Mentor client not found.');
  const sanitised = sanitiseClient(payload, { existing: client });
  await client.update(sanitised);
  return client.toPublicObject();
}

export async function deleteMentorClient(mentorId, clientId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorClient, normalisedMentorId, clientId, 'Mentor client not found.');
  await MentorEvent.update(
    { clientId: null },
    { where: { mentorId: normalisedMentorId, clientId } },
  );
  await MentorClient.destroy({ where: { id: clientId, mentorId: normalisedMentorId } });
}

export async function createMentorEvent(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseEvent(payload);
  const created = await MentorEvent.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorEvent(mentorId, eventId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const event = await findRecordOrThrow(MentorEvent, normalisedMentorId, eventId, 'Mentor event not found.');
  const sanitised = sanitiseEvent(payload, { existing: event });
  await event.update(sanitised);
  return event.toPublicObject();
}

export async function deleteMentorEvent(mentorId, eventId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorEvent, normalisedMentorId, eventId, 'Mentor event not found.');
  await MentorEvent.destroy({ where: { id: eventId, mentorId: normalisedMentorId } });
}

export async function createMentorSupportTicket(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseSupportTicket(payload);
  const created = await MentorSupportTicket.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorSupportTicket(mentorId, ticketId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const ticket = await findRecordOrThrow(
    MentorSupportTicket,
    normalisedMentorId,
    ticketId,
    'Mentor support ticket not found.',
  );
  const sanitised = sanitiseSupportTicket(payload, { existing: ticket });
  await ticket.update(sanitised);
  return ticket.toPublicObject();
}

export async function deleteMentorSupportTicket(mentorId, ticketId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorSupportTicket, normalisedMentorId, ticketId, 'Mentor support ticket not found.');
  await MentorSupportTicket.destroy({ where: { id: ticketId, mentorId: normalisedMentorId } });
}

export async function createMentorMessage(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseMessage(payload);
  const created = await MentorMessage.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorMessage(mentorId, messageId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const message = await findRecordOrThrow(MentorMessage, normalisedMentorId, messageId, 'Mentor message not found.');
  const sanitised = sanitiseMessage(payload, { existing: message });
  await message.update(sanitised);
  return message.toPublicObject();
}

export async function deleteMentorMessage(mentorId, messageId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorMessage, normalisedMentorId, messageId, 'Mentor message not found.');
  await MentorMessage.destroy({ where: { id: messageId, mentorId: normalisedMentorId } });
}

export async function updateMentorVerificationStatus(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const existing = await MentorVerification.findOne({ where: { mentorId: normalisedMentorId } });
  const sanitised = sanitiseVerificationStatus(payload, { existing });
  if (existing) {
    await existing.update(sanitised);
    return mapVerification(existing, []);
  }
  const created = await MentorVerification.create({ mentorId: normalisedMentorId, ...sanitised });
  return mapVerification(created, []);
}

export async function createMentorVerificationDocument(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseVerificationDocument(payload);
  const created = await MentorVerificationDocument.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorVerificationDocument(mentorId, documentId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const document = await findRecordOrThrow(
    MentorVerificationDocument,
    normalisedMentorId,
    documentId,
    'Mentor verification document not found.',
  );
  const sanitised = sanitiseVerificationDocument(payload, { existing: document });
  await document.update(sanitised);
  return document.toPublicObject();
}

export async function deleteMentorVerificationDocument(mentorId, documentId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(
    MentorVerificationDocument,
    normalisedMentorId,
    documentId,
    'Mentor verification document not found.',
  );
  await MentorVerificationDocument.destroy({ where: { id: documentId, mentorId: normalisedMentorId } });
}

export async function createMentorWalletTransaction(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseWalletTransaction(payload);
  const created = await MentorWalletTransaction.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorWalletTransaction(mentorId, transactionId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const transaction = await findRecordOrThrow(
    MentorWalletTransaction,
    normalisedMentorId,
    transactionId,
    'Mentor wallet transaction not found.',
  );
  const sanitised = sanitiseWalletTransaction(payload, { existing: transaction });
  await transaction.update(sanitised);
  return transaction.toPublicObject();
}

export async function deleteMentorWalletTransaction(mentorId, transactionId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(
    MentorWalletTransaction,
    normalisedMentorId,
    transactionId,
    'Mentor wallet transaction not found.',
  );
  await MentorWalletTransaction.destroy({ where: { id: transactionId, mentorId: normalisedMentorId } });
}

export async function createMentorInvoice(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseInvoice(payload);
  const created = await MentorInvoice.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorInvoice(mentorId, invoiceId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const invoice = await findRecordOrThrow(MentorInvoice, normalisedMentorId, invoiceId, 'Mentor invoice not found.');
  const sanitised = sanitiseInvoice(payload, { existing: invoice });
  await invoice.update(sanitised);
  return invoice.toPublicObject();
}

export async function deleteMentorInvoice(mentorId, invoiceId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorInvoice, normalisedMentorId, invoiceId, 'Mentor invoice not found.');
  await MentorInvoice.destroy({ where: { id: invoiceId, mentorId: normalisedMentorId } });
}

export async function createMentorPayout(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitisePayout(payload);
  const created = await MentorPayout.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorPayout(mentorId, payoutId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const payout = await findRecordOrThrow(MentorPayout, normalisedMentorId, payoutId, 'Mentor payout not found.');
  const sanitised = sanitisePayout(payload, { existing: payout });
  await payout.update(sanitised);
  return payout.toPublicObject();
}

export async function deleteMentorPayout(mentorId, payoutId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorPayout, normalisedMentorId, payoutId, 'Mentor payout not found.');
  await MentorPayout.destroy({ where: { id: payoutId, mentorId: normalisedMentorId } });
}

export async function createMentorHubUpdate(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseHubUpdate(payload);
  const created = await MentorHubUpdate.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorHubUpdate(mentorId, updateId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const update = await findRecordOrThrow(MentorHubUpdate, normalisedMentorId, updateId, 'Mentor hub update not found.');
  const sanitised = sanitiseHubUpdate(payload, { existing: update.get({ plain: true }) });
  await update.update(sanitised);
  return update.toPublicObject();
}

export async function deleteMentorHubUpdate(mentorId, updateId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorHubUpdate, normalisedMentorId, updateId, 'Mentor hub update not found.');
  await MentorHubUpdate.destroy({ where: { id: updateId, mentorId: normalisedMentorId } });
}

export async function createMentorHubAction(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseHubAction(payload);
  const created = await MentorHubAction.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorHubAction(mentorId, actionId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const action = await findRecordOrThrow(MentorHubAction, normalisedMentorId, actionId, 'Mentor hub action not found.');
  const sanitised = sanitiseHubAction(payload, { existing: action.get({ plain: true }) });
  await action.update(sanitised);
  return action.toPublicObject();
}

export async function deleteMentorHubAction(mentorId, actionId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorHubAction, normalisedMentorId, actionId, 'Mentor hub action not found.');
  await MentorHubAction.destroy({ where: { id: actionId, mentorId: normalisedMentorId } });
}

export async function createMentorHubResource(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseHubResource(payload);
  const created = await MentorHubResource.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorHubResource(mentorId, resourceId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const resource = await findRecordOrThrow(MentorHubResource, normalisedMentorId, resourceId, 'Mentor hub resource not found.');
  const sanitised = sanitiseHubResource(payload, { existing: resource.get({ plain: true }) });
  await resource.update(sanitised);
  return resource.toPublicObject();
}

export async function deleteMentorHubResource(mentorId, resourceId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorHubResource, normalisedMentorId, resourceId, 'Mentor hub resource not found.');
  await MentorHubResource.destroy({ where: { id: resourceId, mentorId: normalisedMentorId } });
}

export async function saveMentorHubSpotlight(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const existing = await MentorHubSpotlight.findOne({ where: { mentorId: normalisedMentorId } });
  const sanitised = sanitiseHubSpotlight(payload, { existing: existing ? existing.get({ plain: true }) : undefined });
  if (existing) {
    await existing.update(sanitised);
    return existing.toPublicObject();
  }
  const created = await MentorHubSpotlight.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function createMentorOrder(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseOrder(payload);
  const created = await MentorOrder.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorOrder(mentorId, orderId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const order = await findRecordOrThrow(MentorOrder, normalisedMentorId, orderId, 'Mentor order not found.');
  const sanitised = sanitiseOrder(payload, { existing: order.get({ plain: true }) });
  await order.update(sanitised);
  return order.toPublicObject();
}

export async function deleteMentorOrder(mentorId, orderId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorOrder, normalisedMentorId, orderId, 'Mentor order not found.');
  await MentorOrder.destroy({ where: { id: orderId, mentorId: normalisedMentorId } });
}

export async function createMentorAdCampaign(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseAdCampaign(payload);
  const created = await MentorAdCampaign.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorAdCampaign(mentorId, campaignId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const campaign = await findRecordOrThrow(MentorAdCampaign, normalisedMentorId, campaignId, 'Mentor ad campaign not found.');
  const sanitised = sanitiseAdCampaign(payload, { existing: campaign.get({ plain: true }) });
  await campaign.update(sanitised);
  return campaign.toPublicObject();
}

export async function deleteMentorAdCampaign(mentorId, campaignId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorAdCampaign, normalisedMentorId, campaignId, 'Mentor ad campaign not found.');
  await MentorAdCampaign.destroy({ where: { id: campaignId, mentorId: normalisedMentorId } });
}

export async function createMentorMetricWidget(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseMetricWidgetPayload(payload);
  const created = await MentorMetricWidget.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorMetricWidget(mentorId, widgetId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const widget = await findRecordOrThrow(MentorMetricWidget, normalisedMentorId, widgetId, 'Mentor metric widget not found.');
  const sanitised = sanitiseMetricWidgetPayload(payload, { existing: widget.get({ plain: true }) });
  await widget.update(sanitised);
  return widget.toPublicObject();
}

export async function deleteMentorMetricWidget(mentorId, widgetId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  await findRecordOrThrow(MentorMetricWidget, normalisedMentorId, widgetId, 'Mentor metric widget not found.');
  await MentorMetricWidget.destroy({ where: { id: widgetId, mentorId: normalisedMentorId } });
}

export async function saveMentorMetricReporting(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const existing = await MentorMetricReportingSetting.findOne({ where: { mentorId: normalisedMentorId } });
  const sanitised = sanitiseMetricReporting(payload, { existing });
  if (existing) {
    await existing.update(sanitised);
    return existing.toPublicObject();
  }
  const created = await MentorMetricReportingSetting.create({ mentorId: normalisedMentorId, ...sanitised });
  return created.toPublicObject();
}

export async function updateMentorSettings(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const sanitised = sanitiseMentorSettings(payload);
  const [record, created] = await MentorSettings.findOrCreate({
    where: { mentorId: normalisedMentorId },
    defaults: { mentorId: normalisedMentorId, settings: sanitised },
  });
  if (created) {
    return record.toPublicObject();
  }
  await record.update({ settings: sanitised });
  return record.toPublicObject();
}

export async function updateMentorSystemPreferences(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const existing = await MentorSystemPreference.findOne({ where: { mentorId: normalisedMentorId } });
  const preferencesPayload = sanitiseMentorPreferences(payload.preferences ?? {}, { existing });
  const updates = { preferences: preferencesPayload };

  if (payload.apiKey || payload.rotateApiKey) {
    const rawKey = payload.apiKey
      ? ensureTrimmedString(payload.apiKey, 'apiKey', { maxLength: 512 })
      : crypto.randomBytes(24).toString('base64');
    const encrypted = encryptSecret(rawKey);
    updates.apiKeyCiphertext = encrypted;
    updates.apiKeyFingerprint = fingerprintSecret(encrypted);
    updates.apiKeyLastRotatedAt = new Date();
  }

  if (existing) {
    await existing.update(updates);
    return existing.toPublicObject();
  }

  const created = await MentorSystemPreference.create({ mentorId: normalisedMentorId, ...updates });
  return created.toPublicObject();
}

export async function getMentorCreationStudioWorkspace(mentorId, options = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  return getCreationStudioWorkspaceSnapshot(normalisedMentorId, options);
}

export async function createMentorCreationStudioItem(mentorId, payload = {}, { actorId } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const created = await createOwnedCreationStudioItem(normalisedMentorId, payload, {
    actorId: actorId ?? normalisedMentorId,
  });
  return created;
}

export async function updateMentorCreationStudioItem(mentorId, itemId, payload = {}, { actorId } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const updated = await updateOwnedCreationStudioItem(normalisedMentorId, itemId, payload, {
    actorId: actorId ?? normalisedMentorId,
  });
  if (!updated) {
    throw new NotFoundError('Creation studio item not found.');
  }
  return updated;
}

export async function publishMentorCreationStudioItem(mentorId, itemId, payload = {}, { actorId } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const item = await CreationStudioItem.findOne({ where: { id: itemId, ownerId: normalisedMentorId } });
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  return publishCreationStudioItem(itemId, payload, { actorId: actorId ?? normalisedMentorId });
}

export async function shareMentorCreationStudioItem(mentorId, itemId, payload = {}, { actorId } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const shared = await shareOwnedCreationStudioItem(normalisedMentorId, itemId, payload, {
    actorId: actorId ?? normalisedMentorId,
  });
  if (!shared) {
    throw new NotFoundError('Creation studio item not found.');
  }
  return shared;
}

export async function archiveMentorCreationStudioItem(mentorId, itemId, { actorId } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const archived = await archiveOwnedCreationStudioItem(normalisedMentorId, itemId, {
    actorId: actorId ?? normalisedMentorId,
  });
  if (!archived) {
    throw new NotFoundError('Creation studio item not found.');
  }
  return archived;
}

export async function deleteMentorCreationStudioItem(mentorId, itemId) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const item = await CreationStudioItem.findOne({ where: { id: itemId, ownerId: normalisedMentorId } });
  if (!item) {
    throw new NotFoundError('Creation studio item not found.');
  }
  await deleteCreationStudioItem(itemId);
  return { success: true };
}

export default {
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
  createMentorHubUpdate,
  updateMentorHubUpdate,
  deleteMentorHubUpdate,
  createMentorHubAction,
  updateMentorHubAction,
  deleteMentorHubAction,
  createMentorHubResource,
  updateMentorHubResource,
  deleteMentorHubResource,
  saveMentorHubSpotlight,
  createMentorOrder,
  updateMentorOrder,
  deleteMentorOrder,
  createMentorAdCampaign,
  updateMentorAdCampaign,
  deleteMentorAdCampaign,
  createMentorMetricWidget,
  updateMentorMetricWidget,
  deleteMentorMetricWidget,
  saveMentorMetricReporting,
  updateMentorSettings,
  updateMentorSystemPreferences,
  getMentorCreationStudioWorkspace,
  createMentorCreationStudioItem,
  updateMentorCreationStudioItem,
  publishMentorCreationStudioItem,
  shareMentorCreationStudioItem,
  archiveMentorCreationStudioItem,
  deleteMentorCreationStudioItem,
};
