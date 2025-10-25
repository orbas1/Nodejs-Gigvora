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
import { ValidationError, NotFoundError } from '../utils/errors.js';

const MIN_SESSION_MINUTES = 25;
const MAX_SESSION_MINUTES = 6 * 60;
const MAX_AVAILABILITY_SLOTS = 40;
const MAX_PACKAGE_PRICE = 100000;
const MAX_SESSION_CAPACITY = 30;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 365;
const MAX_NOTES_LENGTH = 4000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

function buildFinanceSummary(invoices, payouts, walletSummary) {
  const recognisedRevenue = invoices
    .filter((invoice) => invoice.status === 'Paid')
    .reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0);
  const outstandingInvoices = invoices
    .filter((invoice) => invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
    .reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0);
  const pendingPayouts = payouts
    .filter((payout) => payout.status !== 'Paid' && payout.status !== 'Failed')
    .reduce((total, payout) => total + Number(payout.amount ?? 0), 0);
  return {
    recognisedRevenue: Math.round(recognisedRevenue * 100) / 100,
    outstandingInvoices: Math.round(outstandingInvoices * 100) / 100,
    pendingPayouts: Math.round(pendingPayouts * 100) / 100,
    walletBalance: walletSummary.balance,
    walletAvailable: walletSummary.available,
  };
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

  const bookingSummary = summariseBookings(bookings, lookbackDays);
  const avgRating = feedback.length
    ? Math.round((feedback.reduce((total, review) => total + Number(review.rating ?? 0), 0) / feedback.length) * 10) / 10
    : 0;
  const prevAvgRating = avgRating;
  const walletSummary = buildWalletSummary(walletTransactions);
  const finance = buildFinanceSummary(invoices, payouts, walletSummary);

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
};
