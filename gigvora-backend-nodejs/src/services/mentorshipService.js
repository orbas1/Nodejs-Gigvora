import crypto from 'node:crypto';
import { ValidationError } from '../utils/errors.js';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MIN_SESSION_MINUTES = 25;
const MAX_SESSION_MINUTES = 6 * 60;
const MAX_AVAILABILITY_SLOTS = 40;
const MAX_PACKAGE_PRICE = 100000;
const MAX_SESSION_CAPACITY = 30;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 365;

const mentorStores = new Map();

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normaliseMentorId(mentorId) {
  const numeric = Number.parseInt(mentorId, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid mentorId is required.');
  }
  return numeric;
}

function normaliseLookbackDays(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return 30;
  }
  return Math.min(Math.max(numeric, MIN_LOOKBACK_DAYS), MAX_LOOKBACK_DAYS);
}

function toIsoDate(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date supplied for mentorship availability.');
  }
  return date.toISOString();
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function ensureUnique(items, makeKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = makeKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function calculateChange(current, previous) {
  if (previous === null || previous === undefined) {
    return null;
  }
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  const delta = ((current - previous) / previous) * 100;
  return Math.round(delta);
}

function parseCapacity(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric <= 0) {
    throw new ValidationError('Availability capacity must be a positive integer.');
  }
  if (numeric > MAX_SESSION_CAPACITY) {
    throw new ValidationError(`Availability capacity cannot exceed ${MAX_SESSION_CAPACITY} seats.`);
  }
  return numeric;
}

function sanitiseAvailabilitySlot(slot, index) {
  const day = `${slot.day ?? ''}`.trim();
  if (!DAY_NAMES.includes(day)) {
    throw new ValidationError(`Slot ${index + 1} has an invalid day. Choose from ${DAY_NAMES.join(', ')}.`);
  }

  const startIso = toIsoDate(slot.start);
  const endIso = toIsoDate(slot.end);
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (end <= start) {
    throw new ValidationError(`Slot ${index + 1} must end after it starts.`);
  }

  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < MIN_SESSION_MINUTES || durationMinutes > MAX_SESSION_MINUTES) {
    throw new ValidationError(
      `Slot ${index + 1} must be at least ${MIN_SESSION_MINUTES} minutes and no longer than ${MAX_SESSION_MINUTES} minutes.`,
    );
  }

  const format = `${slot.format ?? ''}`.trim() || '1:1 session';
  const capacity = parseCapacity(slot.capacity ?? 1);
  const resolvedId = `${slot.id ?? ''}`.trim() || generateId(`slot_${day.toLowerCase()}`);

  return {
    id: resolvedId,
    day,
    start: startIso,
    end: endIso,
    format,
    capacity,
  };
}

function validateAvailability(slots) {
  if (!Array.isArray(slots)) {
    throw new ValidationError('Availability must be supplied as an array of slots.');
  }
  if (slots.length > MAX_AVAILABILITY_SLOTS) {
    throw new ValidationError(`You can publish a maximum of ${MAX_AVAILABILITY_SLOTS} availability slots.`);
  }

  const sanitised = slots.map(sanitiseAvailabilitySlot);
  const sorted = sanitised.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const byDay = new Map();
  for (const slot of sorted) {
    const daySlots = byDay.get(slot.day) ?? [];
    for (const existing of daySlots) {
      const startsInsideExisting = new Date(slot.start) < new Date(existing.end);
      const endsAfterExistingStarts = new Date(slot.end) > new Date(existing.start);
      if (startsInsideExisting && endsAfterExistingStarts) {
        throw new ValidationError(`The slot on ${slot.day} overlaps with another published slot.`);
      }
    }
    daySlots.push(slot);
    byDay.set(slot.day, daySlots);
  }

  return ensureUnique(sorted, (slot) => `${slot.day}:${slot.start}:${slot.end}:${slot.format}`);
}

function parsePackageSessions(value, index) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`Package ${index + 1} must include at least one session.`);
  }
  if (numeric > 60) {
    throw new ValidationError(`Package ${index + 1} cannot exceed 60 sessions.`);
  }
  return numeric;
}

function parsePackagePrice(value, index) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric) || numeric <= 0) {
    throw new ValidationError(`Package ${index + 1} must have a positive price.`);
  }
  if (numeric > MAX_PACKAGE_PRICE) {
    throw new ValidationError(`Package ${index + 1} cannot exceed £${MAX_PACKAGE_PRICE.toLocaleString()}.`);
  }
  return Math.round(numeric * 100) / 100;
}

function sanitisePackage(pack, index) {
  const name = `${pack.name ?? ''}`.trim();
  const description = `${pack.description ?? ''}`.trim();
  const outcome = `${pack.outcome ?? ''}`.trim();
  const format = `${pack.format ?? ''}`.trim() || 'Virtual';
  const currency = `${pack.currency ?? '£'}`.trim() || '£';

  if (!name) {
    throw new ValidationError(`Package ${index + 1} must include a name.`);
  }
  if (!description) {
    throw new ValidationError(`Package ${index + 1} must include a description.`);
  }
  if (!outcome) {
    throw new ValidationError(`Package ${index + 1} must define a headline outcome.`);
  }

  const sessions = parsePackageSessions(pack.sessions, index);
  const price = parsePackagePrice(pack.price, index);
  const resolvedId = `${pack.id ?? ''}`.trim() || generateId(`package_${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

  return {
    id: resolvedId,
    name,
    description,
    sessions,
    price,
    currency,
    format,
    outcome,
  };
}

function sanitisePackages(packages) {
  if (!Array.isArray(packages)) {
    throw new ValidationError('Packages must be supplied as an array.');
  }
  if (packages.length > 24) {
    throw new ValidationError('You can configure up to 24 mentorship packages at once.');
  }

  const sanitised = packages.map(sanitisePackage);
  return ensureUnique(sanitised, (pack) => pack.id);
}

function defaultAvailability() {
  const now = new Date();
  const nextTuesday = new Date(now.getTime());
  nextTuesday.setDate(now.getDate() + ((2 - now.getDay() + 7) % 7 || 7));
  nextTuesday.setHours(13, 0, 0, 0);

  const nextThursday = new Date(now.getTime());
  nextThursday.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 7));
  nextThursday.setHours(16, 0, 0, 0);

  return [
    {
      id: generateId('slot_tuesday'),
      day: 'Tuesday',
      start: nextTuesday.toISOString(),
      end: new Date(nextTuesday.getTime() + 60 * 60 * 1000).toISOString(),
      format: '1:1 session',
      capacity: 1,
    },
    {
      id: generateId('slot_thursday'),
      day: 'Thursday',
      start: nextThursday.toISOString(),
      end: new Date(nextThursday.getTime() + 60 * 60 * 1000).toISOString(),
      format: 'Office hours',
      capacity: 6,
    },
  ];
}

function defaultPackages() {
  return [
    {
      id: generateId('package_leadership'),
      name: 'Leadership accelerator',
      description: 'Six weeks of strategic rituals, async reviews, and executive storytelling prep.',
      sessions: 6,
      price: 1800,
      currency: '£',
      format: 'Hybrid',
      outcome: 'Promotion narrative & influence plan',
    },
    {
      id: generateId('package_growth'),
      name: 'Product growth audit',
      description: 'Three deep dives into activation, monetisation, and experiment velocity.',
      sessions: 3,
      price: 720,
      currency: '£',
      format: 'Virtual',
      outcome: '90-day experiment roadmap',
    },
  ];
}

function defaultBookings() {
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  return [
    {
      id: generateId('booking'),
      mentee: 'Alex Rivera',
      role: 'Director of Product',
      package: 'Leadership accelerator',
      focus: 'Influence & stakeholder mapping',
      scheduledAt: new Date(now + twoDays).toISOString(),
      status: 'Scheduled',
      price: 1800,
      currency: '£',
      paymentStatus: 'Paid',
      channel: 'Explorer',
      segment: 'active',
    },
    {
      id: generateId('booking'),
      mentee: 'Linh Tran',
      role: 'Head of Product Marketing',
      package: 'Product growth audit',
      focus: 'Activation storytelling',
      scheduledAt: new Date(now + fiveDays).toISOString(),
      status: 'Awaiting pre-work',
      price: 720,
      currency: '£',
      paymentStatus: 'Pending',
      channel: 'Referral',
      segment: 'pending',
    },
  ];
}

function defaultSegments() {
  return [
    {
      id: 'active',
      title: 'Confirmed sessions',
      description: 'Mentorship sessions locked in with payment confirmed.',
    },
    {
      id: 'pending',
      title: 'Pending actions',
      description: 'Bookings awaiting payment, materials, or pre-work.',
    },
  ];
}

function defaultFeedback() {
  return [
    {
      id: generateId('feedback'),
      mentee: 'Priya Desai',
      highlight: 'Unlocked a promotion narrative that resonated with senior leadership.',
      rating: 5,
    },
    {
      id: generateId('feedback'),
      mentee: 'Chris Osei',
      highlight: 'Loved the async Loom reviews between sessions – sped up implementation.',
      rating: 5,
    },
  ];
}

function defaultExplorerPlacement() {
  return {
    score: 92,
    position: 'Top 3 in leadership mentorship',
    nextActions: ['Add 2 more availability slots', 'Upload testimonial video', 'Promote new async review package'],
  };
}

function defaultPerformanceHistory() {
  return [
    {
      recordedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      activeMentees: 10,
      upcomingSessions: 6,
      avgRating: 4.8,
      monthlyRevenue: 3600,
    },
    {
      recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      activeMentees: 12,
      upcomingSessions: 8,
      avgRating: 4.9,
      monthlyRevenue: 4200,
    },
  ];
}

function defaultConversionHistory() {
  return [
    {
      recordedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      views: 162,
      requests: 32,
      confirmed: 18,
    },
    {
      recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      views: 186,
      requests: 38,
      confirmed: 24,
    },
  ];
}

function defaultProfile(mentorId) {
  return {
    id: mentorId,
    name: 'Jordan Mentor',
    role: 'Mentor-in-residence',
    initials: 'JM',
    status: 'Accepting mentees',
    badges: ['Product strategy', 'Leadership pods'],
    metrics: [
      { label: 'Active mentees', value: '12', change: '+2 this month' },
      { label: 'Avg. rating', value: '4.9', change: 'Last 90 days' },
      { label: 'Net promoter', value: '78', change: 'Mentor guild benchmark: 72' },
    ],
    email: 'mentor@gigvora.com',
    timezone: 'GMT',
    focusAreas: ['Leadership sprints', 'Product strategy'],
    sessionFee: {
      amount: 180,
      currency: '£',
    },
    availabilityNotes: 'Tuesday & Thursday afternoons for deep dives, Friday mornings for async reviews.',
  };
}

function buildDefaultState(mentorId) {
  return {
    mentorId,
    profile: defaultProfile(mentorId),
    availability: defaultAvailability(),
    packages: defaultPackages(),
    bookings: defaultBookings(),
    segments: defaultSegments(),
    feedback: defaultFeedback(),
    explorerPlacement: defaultExplorerPlacement(),
    performanceHistory: defaultPerformanceHistory(),
    conversionHistory: defaultConversionHistory(),
    updatedAt: new Date().toISOString(),
  };
}

function getMentorState(mentorId) {
  if (!mentorStores.has(mentorId)) {
    mentorStores.set(mentorId, buildDefaultState(mentorId));
  }
  return mentorStores.get(mentorId);
}

function recordPerformanceSnapshot(state, stats) {
  const now = new Date();
  const latest = state.performanceHistory.at(-1);
  if (!latest) {
    state.performanceHistory.push({ recordedAt: now.toISOString(), ...stats });
    return;
  }
  const lastRecordedAt = new Date(latest.recordedAt);
  if (now.getTime() - lastRecordedAt.getTime() > 12 * 60 * 60 * 1000) {
    state.performanceHistory.push({ recordedAt: now.toISOString(), ...stats });
  } else {
    Object.assign(latest, { recordedAt: now.toISOString(), ...stats });
  }
  if (state.performanceHistory.length > 12) {
    state.performanceHistory.splice(0, state.performanceHistory.length - 12);
  }
}

function recordConversionSnapshot(state, snapshot) {
  const now = new Date();
  const latest = state.conversionHistory.at(-1);
  if (!latest) {
    state.conversionHistory.push({ recordedAt: now.toISOString(), ...snapshot });
    return;
  }
  const lastRecordedAt = new Date(latest.recordedAt);
  if (now.getTime() - lastRecordedAt.getTime() > 12 * 60 * 60 * 1000) {
    state.conversionHistory.push({ recordedAt: now.toISOString(), ...snapshot });
  } else {
    Object.assign(latest, { recordedAt: now.toISOString(), ...snapshot });
  }
  if (state.conversionHistory.length > 12) {
    state.conversionHistory.splice(0, state.conversionHistory.length - 12);
  }
}

function computeStats(state, lookbackDays) {
  const now = Date.now();
  const windowStart = now - lookbackDays * 24 * 60 * 60 * 1000;
  const bookings = state.bookings.map((booking) => ({
    ...booking,
    scheduledAtMs: new Date(booking.scheduledAt).getTime(),
  }));

  const activeBookings = bookings.filter((booking) => booking.scheduledAtMs >= windowStart);
  const activeMentees = new Set(activeBookings.map((booking) => booking.mentee)).size;
  const upcomingSessions = bookings.filter((booking) => booking.scheduledAtMs >= now).length;
  const paidWithinWindow = activeBookings.filter((booking) => booking.paymentStatus === 'Paid');
  const monthlyRevenue = paidWithinWindow.reduce((total, booking) => total + Number(booking.price || 0), 0);
  const avgRating = state.feedback.length
    ? state.feedback.reduce((total, entry) => total + Number(entry.rating || 0), 0) / state.feedback.length
    : 0;

  const stats = {
    activeMentees,
    upcomingSessions,
    avgRating: Math.round(avgRating * 10) / 10,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
  };

  recordPerformanceSnapshot(state, stats);
  const history = state.performanceHistory;
  const current = history.at(-1);
  const previous = history.length > 1 ? history.at(-2) : null;

  return {
    ...stats,
    activeMenteesChange: calculateChange(current?.activeMentees, previous?.activeMentees),
    upcomingSessionsChange: calculateChange(current?.upcomingSessions, previous?.upcomingSessions),
    avgRatingChange: calculateChange(current?.avgRating, previous?.avgRating),
    monthlyRevenueChange: calculateChange(current?.monthlyRevenue, previous?.monthlyRevenue),
  };
}

function computeConversion(state) {
  const confirmedSessions = state.bookings.filter((booking) => booking.status === 'Scheduled').length;
  const pendingRequests = state.bookings.length + 10;
  const explorerViews = Math.max(120, confirmedSessions * 6 + pendingRequests * 2);

  const snapshot = {
    views: explorerViews,
    requests: pendingRequests,
    confirmed: confirmedSessions,
  };

  recordConversionSnapshot(state, snapshot);
  const history = state.conversionHistory;
  const current = history.at(-1);
  const previous = history.length > 1 ? history.at(-2) : null;

  return [
    {
      id: 'views',
      label: 'Explorer profile views',
      value: current?.views ?? 0,
      delta: calculateChange(current?.views, previous?.views),
    },
    {
      id: 'requests',
      label: 'Booking requests',
      value: current?.requests ?? 0,
      delta: calculateChange(current?.requests, previous?.requests),
    },
    {
      id: 'confirmed',
      label: 'Confirmed sessions',
      value: current?.confirmed ?? 0,
      delta: calculateChange(current?.confirmed, previous?.confirmed),
    },
  ];
}

function recalculateExplorerPlacement(state) {
  const availabilityScore = Math.min(state.availability.length * 4, 16);
  const packageScore = Math.min(state.packages.length * 6, 24);
  const feedbackBonus = Math.min(state.feedback.length * 2, 12);
  const baseScore = 70;
  const newScore = Math.max(40, Math.min(100, baseScore + availabilityScore + packageScore + feedbackBonus));

  state.explorerPlacement.score = Math.round(newScore);

  if (newScore >= 92) {
    state.explorerPlacement.position = 'Top 3 in leadership mentorship';
  } else if (newScore >= 85) {
    state.explorerPlacement.position = 'Top 5 in leadership mentorship';
  } else if (newScore >= 75) {
    state.explorerPlacement.position = 'Top 10 in leadership mentorship';
  } else {
    state.explorerPlacement.position = 'Rising mentor';
  }

  const actions = new Set(state.explorerPlacement.nextActions);
  const availabilityAction = 'Add 2 more availability slots';
  const packageAction = 'Publish your flagship mentorship package to boost conversion';

  if (state.availability.length >= 3) {
    actions.delete(availabilityAction);
  } else {
    actions.add(availabilityAction);
  }

  if (state.packages.length >= 1) {
    actions.delete(packageAction);
  } else {
    actions.add(packageAction);
  }

  state.explorerPlacement.nextActions = Array.from(actions);
}

export function getMentorDashboard(mentorId, { lookbackDays } = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const state = getMentorState(normalisedMentorId);
  const days = normaliseLookbackDays(lookbackDays);

  const stats = computeStats(state, days);
  const conversion = computeConversion(state);
  recalculateExplorerPlacement(state);

  const orderedBookings = [...state.bookings].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return {
    profile: deepClone(state.profile),
    stats,
    conversion,
    availability: deepClone(state.availability),
    packages: deepClone(state.packages),
    bookings: deepClone(orderedBookings),
    segments: deepClone(state.segments),
    feedback: deepClone(state.feedback),
    explorerPlacement: deepClone(state.explorerPlacement),
    metadata: {
      lookbackDays: days,
      generatedAt: new Date().toISOString(),
      updatedAt: state.updatedAt,
    },
  };
}

export function updateMentorAvailability(mentorId, slots) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const state = getMentorState(normalisedMentorId);
  const sanitisedSlots = validateAvailability(slots);
  state.availability = sanitisedSlots;
  state.updatedAt = new Date().toISOString();
  recalculateExplorerPlacement(state);
  return deepClone(state.availability);
}

export function updateMentorPackages(mentorId, packages) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const state = getMentorState(normalisedMentorId);
  const sanitisedPackages = sanitisePackages(packages);
  state.packages = sanitisedPackages.sort((a, b) => b.price - a.price);
  state.updatedAt = new Date().toISOString();
  recalculateExplorerPlacement(state);
  return deepClone(state.packages);
}

export function submitMentorProfile(mentorId, payload = {}) {
  const normalisedMentorId = normaliseMentorId(mentorId);
  const state = getMentorState(normalisedMentorId);

  const name = `${payload.name ?? ''}`.trim();
  const email = `${payload.email ?? ''}`.trim();
  const timezone = `${payload.timezone ?? ''}`.trim();

  if (!name) {
    throw new ValidationError('Name is required to update your mentor profile.');
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError('A valid email address is required.');
  }
  if (!timezone) {
    throw new ValidationError('Let mentees know which timezone you operate in.');
  }

  const expertise = Array.isArray(payload.expertise)
    ? payload.expertise.map((item) => `${item}`.trim()).filter(Boolean)
    : `${payload.expertise ?? ''}`
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const headline = `${payload.headline ?? ''}`.trim();
  const availabilityNotes = `${payload.availabilityNotes ?? ''}`.trim();
  const packagesOverview = `${payload.packages ?? ''}`.trim();

  const feeAmount = Number.parseFloat(payload.sessionFee?.amount ?? payload.sessionFee);
  const feeCurrency = `${payload.sessionFee?.currency ?? payload.currency ?? '£'}`.trim() || '£';
  const sessionFee = Number.isFinite(feeAmount) && feeAmount > 0 ? Math.round(feeAmount * 100) / 100 : null;

  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || state.profile.initials;

  state.profile = {
    ...state.profile,
    name,
    initials,
    role: headline || state.profile.role,
    status: 'Profile updated',
    email,
    timezone,
    focusAreas: expertise.length ? expertise : state.profile.focusAreas,
    availabilityNotes: availabilityNotes || state.profile.availabilityNotes,
    packagesOverview: packagesOverview || state.profile.packagesOverview,
    sessionFee:
      sessionFee !== null
        ? {
            amount: sessionFee,
            currency: feeCurrency,
          }
        : state.profile.sessionFee,
  };

  if (expertise.length) {
    state.profile.badges = expertise.slice(0, 3);
  }

  if (packagesOverview) {
    recalculateExplorerPlacement(state);
  }

  state.updatedAt = new Date().toISOString();
  return deepClone(state.profile);
}

export function __resetMentorshipState() {
  mentorStores.clear();
}

export default {
  getMentorDashboard,
  updateMentorAvailability,
  updateMentorPackages,
  submitMentorProfile,
  __resetMentorshipState,
};
