import { Op } from 'sequelize';
import {
  sequelize,
  User,
  UserEvent,
  UserEventAgendaItem,
  UserEventTask,
  UserEventGuest,
  UserEventBudgetItem,
  UserEventAsset,
  UserEventChecklistItem,
  USER_EVENT_STATUSES,
  USER_EVENT_FORMATS,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_TASK_STATUSES,
  USER_EVENT_TASK_PRIORITIES,
  USER_EVENT_GUEST_STATUSES,
  USER_EVENT_BUDGET_STATUSES,
  USER_EVENT_ASSET_TYPES,
  USER_EVENT_ASSET_VISIBILITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const DEFAULT_EVENT_LIMIT = 20;
const DEFAULT_ALLOWED_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

const EVENT_TEMPLATES = [
  {
    id: 'virtual-open-house',
    name: 'Virtual open house',
    format: 'virtual',
    durationHours: 90,
    highlights: ['Welcome keynote', 'Product breakout rooms', 'Live Q&A desk'],
    techStack: ['Zoom webinar', 'Miro board', 'Slack AMA channel'],
  },
  {
    id: 'client-roundtable',
    name: 'Client roundtable & briefing',
    format: 'hybrid',
    durationHours: 120,
    highlights: ['Executive briefing', 'Success story spotlight', 'Action planning workshops'],
    techStack: ['Notion workspace', 'Figma showcase', 'Live polling'],
  },
  {
    id: 'portfolio-demo-day',
    name: 'Portfolio demo day',
    format: 'in_person',
    durationHours: 180,
    highlights: ['Product demos', 'Lightning talks', 'Investor networking'],
    techStack: ['Livestream setup', 'Canva assets kit', 'CRM check-in kiosk'],
  },
];

const EVENT_INCLUDES = [
  {
    model: UserEventAgendaItem,
    as: 'agenda',
    separate: true,
    order: [
      ['orderIndex', 'ASC'],
      ['startAt', 'ASC'],
      ['id', 'ASC'],
    ],
  },
  {
    model: UserEventTask,
    as: 'tasks',
    separate: true,
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [
      ['status', 'ASC'],
      ['priority', 'DESC'],
      ['dueAt', 'ASC'],
      ['id', 'ASC'],
    ],
  },
  {
    model: UserEventGuest,
    as: 'guests',
    separate: true,
    order: [
      ['status', 'ASC'],
      ['fullName', 'ASC'],
      ['id', 'ASC'],
    ],
  },
  {
    model: UserEventBudgetItem,
    as: 'budgetItems',
    separate: true,
    order: [
      ['category', 'ASC'],
      ['status', 'ASC'],
      ['id', 'ASC'],
    ],
  },
  {
    model: UserEventAsset,
    as: 'assets',
    separate: true,
    order: [
      ['assetType', 'ASC'],
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
  },
  {
    model: UserEventChecklistItem,
    as: 'checklist',
    separate: true,
    order: [
      ['orderIndex', 'ASC'],
      ['id', 'ASC'],
    ],
  },
];

function normalizeIdentifier(value, label) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalizeUserId(userId) {
  return normalizeIdentifier(userId, 'userId');
}

function normalizeEventId(eventId) {
  return normalizeIdentifier(eventId, 'eventId');
}

function slugify(value, fallback = 'event') {
  const candidate = (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return candidate || `${fallback}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureAllowed(value, allowed, fieldName) {
  if (value == null) {
    return value;
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function toDate(value, fieldName) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date.toISOString();
}

function toNullableInteger(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be numeric.`);
  }
  const integer = Math.round(numeric);
  if (integer < 0) {
    throw new ValidationError(`${fieldName} must be greater than or equal to 0.`);
  }
  return integer;
}

function toCurrency(value, fieldName) {
  if (value == null || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be numeric.`);
  }
  return Number(numeric.toFixed(2));
}

function normalizeMetadata(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object') {
    return value;
  }
  return null;
}

function normalizeLocation(value) {
  if (!value) {
    return { locationLabel: null, locationAddress: null, locationDetails: null };
  }
  if (typeof value === 'string') {
    const label = value.trim();
    return { locationLabel: label || null, locationAddress: null, locationDetails: null };
  }
  if (typeof value === 'object') {
    const { label = null, address = null, ...details } = value;
    return {
      locationLabel: label != null ? String(label).trim() || null : null,
      locationAddress: address != null ? String(address).trim() || null : null,
      locationDetails: Object.keys(details).length ? details : null,
    };
  }
  return { locationLabel: null, locationAddress: null, locationDetails: null };
}

function sortTasks(tasks) {
  const statusWeight = new Map([
    ['blocked', 0],
    ['todo', 1],
    ['in_progress', 2],
    ['done', 3],
  ]);
  const priorityWeight = new Map([
    ['critical', 3],
    ['high', 2],
    ['medium', 1],
    ['low', 0],
  ]);
  return [...tasks].sort((a, b) => {
    const statusDiff = (statusWeight.get(a.status) ?? 1) - (statusWeight.get(b.status) ?? 1);
    if (statusDiff !== 0) return statusDiff;
    const priorityDiff = (priorityWeight.get(b.priority) ?? 0) - (priorityWeight.get(a.priority) ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.id - b.id;
  });
}

function sortAgenda(items) {
  return [...items].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    const aStart = a.startAt ? new Date(a.startAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bStart = b.startAt ? new Date(b.startAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    return a.id - b.id;
  });
}

function sortChecklist(items) {
  return [...items].sort((a, b) => {
    if (a.isComplete !== b.isComplete) {
      return a.isComplete ? 1 : -1;
    }
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.id - b.id;
  });
}

function sumSeats(guests, predicate = () => true) {
  return guests.reduce((total, guest) => {
    if (!predicate(guest)) {
      return total;
    }
    const seats = Number(guest.seatsReserved ?? 1);
    return total + (Number.isFinite(seats) ? seats : 1);
  }, 0);
}

function calculateEventMetrics(event) {
  const tasks = Array.isArray(event.tasks) ? event.tasks : [];
  const guests = Array.isArray(event.guests) ? event.guests : [];
  const budgetItems = Array.isArray(event.budgetItems) ? event.budgetItems : [];
  const checklist = Array.isArray(event.checklist) ? event.checklist : [];

  const tasksCompleted = tasks.filter((task) => task.status === 'done').length;
  const tasksBlocked = tasks.filter((task) => task.status === 'blocked').length;
  const guestsConfirmed = sumSeats(guests, (guest) => guest.status === 'confirmed');
  const guestsCheckedIn = sumSeats(guests, (guest) => guest.status === 'checked_in');
  const guestsInvited = sumSeats(guests, () => true);
  const budgetPlanned = budgetItems.reduce((total, item) => total + Number(item.amountPlanned ?? 0), 0);
  const budgetActual = budgetItems.reduce((total, item) => total + Number(item.amountActual ?? 0), 0);
  const checklistCompleted = checklist.filter((item) => item.isComplete).length;

  const checklistTotal = checklist.length;
  const capacity = Number(event.capacity ?? 0) > 0 ? Number(event.capacity) : null;
  const capacityUtilisation = capacity ? Math.min(100, Math.round((guestsConfirmed / capacity) * 100)) : null;

  return {
    tasksTotal: tasks.length,
    tasksCompleted,
    tasksBlocked,
    guestsInvited,
    guestsConfirmed,
    guestsCheckedIn,
    capacity,
    capacityUtilisation,
    budgetPlanned: Number(budgetPlanned.toFixed(2)),
    budgetActual: Number(budgetActual.toFixed(2)),
    budgetVariance: Number((budgetActual - budgetPlanned).toFixed(2)),
    checklistCompleted,
    checklistTotal,
    checklistProgress: checklistTotal ? Math.round((checklistCompleted / checklistTotal) * 100) : 0,
  };
}

function sanitizeEvent(instance) {
  if (!instance) {
    return null;
  }
  const base = instance.toPublicObject();
  const agenda = sortAgenda((instance.agenda ?? []).map((item) => item.toPublicObject()));
  const tasks = sortTasks((instance.tasks ?? []).map((task) => task.toPublicObject()));
  const guests = (instance.guests ?? []).map((guest) => guest.toPublicObject());
  const budgetItems = (instance.budgetItems ?? []).map((item) => item.toPublicObject());
  const assets = (instance.assets ?? []).map((asset) => asset.toPublicObject());
  const checklist = sortChecklist((instance.checklist ?? []).map((item) => item.toPublicObject()));

  const metrics = calculateEventMetrics({ ...base, tasks, guests, budgetItems, checklist });

  return {
    ...base,
    metrics,
    agenda,
    tasks,
    guests,
    budget: {
      items: budgetItems,
      totals: {
        planned: metrics.budgetPlanned,
        actual: metrics.budgetActual,
        variance: metrics.budgetVariance,
      },
    },
    assets,
    checklist,
  };
}

function buildOverview(events) {
  const now = new Date();
  const totals = events.reduce(
    (accumulator, event) => {
      const start = event.startAt ? new Date(event.startAt) : null;
      const status = event.status;
      accumulator.events += 1;
      accumulator.tasksTotal += event.metrics.tasksTotal;
      accumulator.tasksCompleted += event.metrics.tasksCompleted;
      accumulator.guestsInvited += event.metrics.guestsInvited;
      accumulator.guestsConfirmed += event.metrics.guestsConfirmed;
      accumulator.guestsCheckedIn += event.metrics.guestsCheckedIn;
      accumulator.budgetPlanned += event.metrics.budgetPlanned;
      accumulator.budgetActual += event.metrics.budgetActual;
      accumulator.checklistsTotal += event.metrics.checklistTotal;
      accumulator.checklistsCompleted += event.metrics.checklistCompleted;

      if (status === 'completed') {
        accumulator.completed += 1;
      } else if (status === 'cancelled') {
        accumulator.cancelled += 1;
      } else if (status === 'archived') {
        accumulator.archived += 1;
      } else {
        accumulator.active += 1;
      }

      if (start && start >= now) {
        accumulator.upcoming += 1;
        accumulator.upcomingEvents.push({
          id: event.id,
          title: event.title,
          startAt: start.toISOString(),
          status,
          format: event.format,
          metrics: event.metrics,
        });
      }

      if (!accumulator.lastUpdatedAt || new Date(event.updatedAt) > new Date(accumulator.lastUpdatedAt)) {
        accumulator.lastUpdatedAt = event.updatedAt;
      }

      return accumulator;
    },
    {
      events: 0,
      active: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      archived: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
      guestsInvited: 0,
      guestsConfirmed: 0,
      guestsCheckedIn: 0,
      budgetPlanned: 0,
      budgetActual: 0,
      checklistsTotal: 0,
      checklistsCompleted: 0,
      upcomingEvents: [],
      lastUpdatedAt: null,
    },
  );

  totals.budgetVariance = Number((totals.budgetActual - totals.budgetPlanned).toFixed(2));
  totals.tasksCompletionRate = totals.tasksTotal
    ? Math.round((totals.tasksCompleted / totals.tasksTotal) * 100)
    : 0;
  totals.checklistCompletionRate = totals.checklistsTotal
    ? Math.round((totals.checklistsCompleted / totals.checklistsTotal) * 100)
    : 0;

  totals.upcomingEvents.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  totals.nextEvent = totals.upcomingEvents[0] ?? null;

  return totals;
}

function buildRecommendations(events, overview) {
  const recommendations = [];
  const now = new Date();

  const hasOverdueTasks = events.some((event) =>
    event.tasks.some((task) => {
      if (!task.dueAt || task.status === 'done') {
        return false;
      }
      const dueDate = new Date(task.dueAt);
      return dueDate < now;
    }),
  );

  if (hasOverdueTasks) {
    recommendations.push({
      id: 'overdue-tasks',
      title: 'Review overdue tasks',
      message: 'One or more event tasks are overdue. Reassign or update owners before they block delivery.',
      severity: 'high',
    });
  }

  const upcomingInSevenDays = events.filter((event) => {
    if (!event.startAt) {
      return false;
    }
    const start = new Date(event.startAt);
    const diffDays = Math.floor((start - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  upcomingInSevenDays.forEach((event) => {
    if (!event.bannerImageUrl && !event.assets.some((asset) => asset.assetType === 'image')) {
      recommendations.push({
        id: `branding-${event.id}`,
        title: `Add hero artwork for ${event.title}`,
        message: 'Upload a banner image or shared design asset so promo kits and invites look polished.',
        severity: 'medium',
      });
    }
    if (event.metrics.guestsConfirmed < Math.max(1, Math.round((event.capacity ?? 50) * 0.5))) {
      recommendations.push({
        id: `registrations-${event.id}`,
        title: `Boost registrations for ${event.title}`,
        message: 'Send a reminder campaign or extend invites to partners to fill the room.',
        severity: 'medium',
      });
    }
    if (!event.agenda.length) {
      recommendations.push({
        id: `agenda-${event.id}`,
        title: `Finalize agenda for ${event.title}`,
        message: 'Document the run of show with speakers, timings, and stage owners to keep the event tight.',
        severity: 'high',
      });
    }
  });

  if (overview.budgetVariance > 0) {
    recommendations.push({
      id: 'budget-variance',
      title: 'Budget running hot',
      message: 'Actual spend is above plan. Review vendor invoices and sponsorship offsets to stay on target.',
      severity: 'medium',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: 'all-clear',
      title: 'Events on track',
      message: 'Event programs are pacing well. Keep capturing feedback and celebrate your wins.',
      severity: 'low',
    });
  }

  return recommendations;
}

function normalizeEventPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.title) {
    throw new ValidationError('title is required to create an event.');
  }
  const normalized = {};
  if (payload.title != null) {
    normalized.title = String(payload.title).trim();
  }
  if (payload.slug != null) {
    normalized.slug = String(payload.slug).trim().toLowerCase();
  }
  if (payload.status != null) {
    normalized.status = ensureAllowed(payload.status, USER_EVENT_STATUSES, 'status');
  }
  if (payload.format != null) {
    normalized.format = ensureAllowed(payload.format, USER_EVENT_FORMATS, 'format');
  }
  if (payload.visibility != null) {
    normalized.visibility = ensureAllowed(payload.visibility, USER_EVENT_VISIBILITIES, 'visibility');
  }
  if (payload.timezone != null) {
    normalized.timezone = String(payload.timezone).trim() || null;
  }
  if (payload.contactEmail != null) {
    normalized.contactEmail = String(payload.contactEmail).trim() || null;
  }
  if (payload.targetAudience != null) {
    normalized.targetAudience = String(payload.targetAudience).trim() || null;
  }
  if (payload.description != null) {
    normalized.description = String(payload.description);
  }
  if (payload.goals != null) {
    normalized.goals = String(payload.goals);
  }
  if (payload.registrationUrl != null) {
    normalized.registrationUrl = String(payload.registrationUrl).trim() || null;
  }
  if (payload.streamingUrl != null) {
    normalized.streamingUrl = String(payload.streamingUrl).trim() || null;
  }
  if (payload.bannerImageUrl != null) {
    normalized.bannerImageUrl = String(payload.bannerImageUrl).trim() || null;
  }
  if (payload.startAt != null) {
    normalized.startAt = toDate(payload.startAt, 'startAt');
  }
  if (payload.endAt != null) {
    normalized.endAt = toDate(payload.endAt, 'endAt');
  }
  if (payload.registrationOpensAt != null) {
    normalized.registrationOpensAt = toDate(payload.registrationOpensAt, 'registrationOpensAt');
  }
  if (payload.registrationClosesAt != null) {
    normalized.registrationClosesAt = toDate(payload.registrationClosesAt, 'registrationClosesAt');
  }
  if (payload.capacity != null) {
    normalized.capacity = toNullableInteger(payload.capacity, 'capacity');
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  if (payload.location != null) {
    Object.assign(normalized, normalizeLocation(payload.location));
  } else {
    if (payload.locationLabel !== undefined) {
      normalized.locationLabel = payload.locationLabel == null
        ? null
        : String(payload.locationLabel).trim() || null;
    }
    if (payload.locationAddress !== undefined) {
      normalized.locationAddress = payload.locationAddress == null
        ? null
        : String(payload.locationAddress).trim() || null;
    }
    if (payload.locationDetails !== undefined) {
      normalized.locationDetails = normalizeMetadata(payload.locationDetails);
    }
  }
  if (Array.isArray(payload.agenda)) {
    normalized.agenda = payload.agenda.map((item) => normalizeAgendaPayload(item, { partial: false }));
  }
  if (Array.isArray(payload.tasks)) {
    normalized.tasks = payload.tasks.map((item) => normalizeTaskPayload(item, { partial: false }));
  }
  if (Array.isArray(payload.guests)) {
    normalized.guests = payload.guests.map((item) => normalizeGuestPayload(item, { partial: false }));
  }
  if (Array.isArray(payload.budgetItems)) {
    normalized.budgetItems = payload.budgetItems.map((item) => normalizeBudgetPayload(item, { partial: false }));
  }
  if (Array.isArray(payload.assets)) {
    normalized.assets = payload.assets.map((item) => normalizeAssetPayload(item, { partial: false }));
  }
  if (Array.isArray(payload.checklist)) {
    normalized.checklist = payload.checklist.map((item) => normalizeChecklistPayload(item, { partial: false }));
  }
  return normalized;
}

function normalizeTaskPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.title) {
    throw new ValidationError('Task title is required.');
  }
  const normalized = {};
  if (payload.title != null) {
    normalized.title = String(payload.title).trim();
  }
  if (payload.status != null) {
    normalized.status = ensureAllowed(payload.status, USER_EVENT_TASK_STATUSES, 'status');
  }
  if (payload.priority != null) {
    normalized.priority = ensureAllowed(payload.priority, USER_EVENT_TASK_PRIORITIES, 'priority');
  }
  if (payload.ownerName != null) {
    normalized.ownerName = String(payload.ownerName).trim() || null;
  }
  if (payload.ownerEmail != null) {
    normalized.ownerEmail = String(payload.ownerEmail).trim() || null;
  }
  if (payload.assigneeId !== undefined) {
    normalized.assigneeId = payload.assigneeId == null ? null : normalizeUserId(payload.assigneeId);
  }
  if (payload.dueAt != null) {
    normalized.dueAt = toDate(payload.dueAt, 'dueAt');
  }
  if (payload.notes != null) {
    normalized.notes = String(payload.notes);
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

function normalizeGuestPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.fullName) {
    throw new ValidationError('Guest name is required.');
  }
  const normalized = {};
  if (payload.fullName != null) {
    normalized.fullName = String(payload.fullName).trim();
  }
  if (payload.email != null) {
    normalized.email = String(payload.email).trim() || null;
  }
  if (payload.company != null) {
    normalized.company = String(payload.company).trim() || null;
  }
  if (payload.role != null) {
    normalized.role = String(payload.role).trim() || null;
  }
  if (payload.ticketType != null) {
    normalized.ticketType = String(payload.ticketType).trim() || null;
  }
  if (payload.status != null) {
    normalized.status = ensureAllowed(payload.status, USER_EVENT_GUEST_STATUSES, 'status');
  }
  if (payload.seatsReserved != null) {
    normalized.seatsReserved = toNullableInteger(payload.seatsReserved, 'seatsReserved') ?? 1;
  }
  if (payload.checkedInAt != null) {
    normalized.checkedInAt = toDate(payload.checkedInAt, 'checkedInAt');
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

function normalizeBudgetPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.category) {
    throw new ValidationError('Budget category is required.');
  }
  const normalized = {};
  if (payload.category != null) {
    normalized.category = String(payload.category).trim();
  }
  if (payload.vendorName != null) {
    normalized.vendorName = String(payload.vendorName).trim() || null;
  }
  if (payload.description != null) {
    normalized.description = String(payload.description);
  }
  if (payload.amountPlanned != null) {
    normalized.amountPlanned = toCurrency(payload.amountPlanned, 'amountPlanned');
  }
  if (payload.amountActual != null) {
    normalized.amountActual = toCurrency(payload.amountActual, 'amountActual');
  }
  if (payload.currency != null) {
    normalized.currency = String(payload.currency).trim().slice(0, 6) || 'USD';
  }
  if (payload.status != null) {
    normalized.status = ensureAllowed(payload.status, USER_EVENT_BUDGET_STATUSES, 'status');
  }
  if (payload.notes != null) {
    normalized.notes = String(payload.notes);
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

function normalizeAgendaPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.title) {
    throw new ValidationError('Agenda title is required.');
  }
  const normalized = {};
  if (payload.title != null) {
    normalized.title = String(payload.title).trim();
  }
  if (payload.description != null) {
    normalized.description = String(payload.description);
  }
  if (payload.startAt != null) {
    normalized.startAt = toDate(payload.startAt, 'startAt');
  }
  if (payload.endAt != null) {
    normalized.endAt = toDate(payload.endAt, 'endAt');
  }
  if (payload.ownerName != null) {
    normalized.ownerName = String(payload.ownerName).trim() || null;
  }
  if (payload.ownerEmail != null) {
    normalized.ownerEmail = String(payload.ownerEmail).trim() || null;
  }
  if (payload.location != null) {
    normalized.location = String(payload.location).trim() || null;
  }
  if (payload.orderIndex != null) {
    normalized.orderIndex = toNullableInteger(payload.orderIndex, 'orderIndex') ?? 0;
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

function normalizeAssetPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.name) {
    throw new ValidationError('Asset name is required.');
  }
  if (!partial && !payload?.url) {
    throw new ValidationError('Asset url is required.');
  }
  const normalized = {};
  if (payload.name != null) {
    normalized.name = String(payload.name).trim();
  }
  if (payload.url != null) {
    normalized.url = String(payload.url).trim();
  }
  if (payload.assetType != null) {
    normalized.assetType = ensureAllowed(payload.assetType, USER_EVENT_ASSET_TYPES, 'assetType');
  }
  if (payload.visibility != null) {
    normalized.visibility = ensureAllowed(payload.visibility, USER_EVENT_ASSET_VISIBILITIES, 'visibility');
  }
  if (payload.thumbnailUrl != null) {
    normalized.thumbnailUrl = String(payload.thumbnailUrl).trim() || null;
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

function normalizeChecklistPayload(payload, { partial = false } = {}) {
  if (!partial && !payload?.label) {
    throw new ValidationError('Checklist label is required.');
  }
  const normalized = {};
  if (payload.label != null) {
    normalized.label = String(payload.label).trim();
  }
  if (payload.isComplete != null) {
    normalized.isComplete = Boolean(payload.isComplete);
  }
  if (payload.ownerName != null) {
    normalized.ownerName = String(payload.ownerName).trim() || null;
  }
  if (payload.dueAt != null) {
    normalized.dueAt = toDate(payload.dueAt, 'dueAt');
  }
  if (payload.orderIndex != null) {
    normalized.orderIndex = toNullableInteger(payload.orderIndex, 'orderIndex') ?? 0;
  }
  if (payload.metadata != null) {
    normalized.metadata = normalizeMetadata(payload.metadata);
  }
  return normalized;
}

async function generateUniqueSlug(ownerId, title, { transaction } = {}) {
  if (!title) {
    return null;
  }
  const base = slugify(`${ownerId}-${title}`);
  let candidate = base;
  let attempt = 1;
  while (candidate) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await UserEvent.findOne({ where: { slug: candidate }, transaction });
    if (!existing) {
      return candidate;
    }
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return null;
}

async function loadEventForUser(userId, eventId, { transaction } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedEventId = normalizeEventId(eventId);
  const event = await UserEvent.findOne({
    where: { id: normalizedEventId, ownerId: normalizedUserId },
    include: EVENT_INCLUDES,
    transaction,
  });
  if (!event) {
    throw new NotFoundError('Event not found.');
  }
  return event;
}

async function ensureEventOwnership(userId, eventId, { transaction } = {}) {
  const event = await loadEventForUser(userId, eventId, { transaction });
  if (event.ownerId !== normalizeUserId(userId)) {
    throw new AuthorizationError('You do not have permission to manage this event.');
  }
  return event;
}

export async function getUserEventManagement(userId, { includeArchived = false, limit = DEFAULT_EVENT_LIMIT } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const where = { ownerId: normalizedUserId };
  if (!includeArchived) {
    where.status = { [Op.ne]: 'archived' };
  }

  const events = await UserEvent.findAll({
    where,
    include: EVENT_INCLUDES,
    order: [
      ['startAt', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
  });

  const sanitized = events.map(sanitizeEvent);
  const overview = buildOverview(sanitized);
  const recommendations = buildRecommendations(sanitized, overview);

  return {
    overview,
    events: sanitized,
    recommendations,
    templates: EVENT_TEMPLATES,
    permissions: {
      canManage: true,
      allowedRoles: DEFAULT_ALLOWED_ROLES,
    },
  };
}

export async function createEvent(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const data = normalizeEventPayload(payload, { partial: false });

  return sequelize.transaction(async (transaction) => {
    const slug = data.slug || (await generateUniqueSlug(normalizedUserId, data.title, { transaction }));
    const event = await UserEvent.create(
      {
        ownerId: normalizedUserId,
        title: data.title,
        slug,
        status: data.status ?? 'draft',
        format: data.format ?? 'virtual',
        visibility: data.visibility ?? 'invite_only',
        timezone: data.timezone ?? null,
        locationLabel: data.locationLabel ?? null,
        locationAddress: data.locationAddress ?? null,
        locationDetails: data.locationDetails ?? null,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        registrationOpensAt: data.registrationOpensAt ?? null,
        registrationClosesAt: data.registrationClosesAt ?? null,
        capacity: data.capacity ?? null,
        registrationUrl: data.registrationUrl ?? null,
        streamingUrl: data.streamingUrl ?? null,
        bannerImageUrl: data.bannerImageUrl ?? null,
        contactEmail: data.contactEmail ?? null,
        targetAudience: data.targetAudience ?? null,
        description: data.description ?? null,
        goals: data.goals ?? null,
        metadata: data.metadata ?? null,
      },
      { transaction },
    );

    if (Array.isArray(data.agenda) && data.agenda.length) {
      await UserEventAgendaItem.bulkCreate(
        data.agenda.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    if (Array.isArray(data.tasks) && data.tasks.length) {
      await UserEventTask.bulkCreate(
        data.tasks.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    if (Array.isArray(data.guests) && data.guests.length) {
      await UserEventGuest.bulkCreate(
        data.guests.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    if (Array.isArray(data.budgetItems) && data.budgetItems.length) {
      await UserEventBudgetItem.bulkCreate(
        data.budgetItems.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    if (Array.isArray(data.assets) && data.assets.length) {
      await UserEventAsset.bulkCreate(
        data.assets.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    if (Array.isArray(data.checklist) && data.checklist.length) {
      await UserEventChecklistItem.bulkCreate(
        data.checklist.map((item) => ({ ...item, eventId: event.id })),
        { transaction },
      );
    }

    const created = await loadEventForUser(normalizedUserId, event.id, { transaction });
    return sanitizeEvent(created);
  });
}

export async function getEvent(userId, eventId) {
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateEvent(userId, eventId, payload = {}) {
  const data = normalizeEventPayload(payload, { partial: true });
  return sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    const updates = { ...data };
    delete updates.agenda;
    delete updates.tasks;
    delete updates.guests;
    delete updates.budgetItems;
    delete updates.assets;
    delete updates.checklist;

    await event.update(updates, { transaction });

    if (Array.isArray(data.agenda)) {
      await UserEventAgendaItem.destroy({ where: { eventId: event.id }, transaction });
      if (data.agenda.length) {
        await UserEventAgendaItem.bulkCreate(
          data.agenda.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(data.tasks)) {
      await UserEventTask.destroy({ where: { eventId: event.id }, transaction });
      if (data.tasks.length) {
        await UserEventTask.bulkCreate(
          data.tasks.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(data.guests)) {
      await UserEventGuest.destroy({ where: { eventId: event.id }, transaction });
      if (data.guests.length) {
        await UserEventGuest.bulkCreate(
          data.guests.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(data.budgetItems)) {
      await UserEventBudgetItem.destroy({ where: { eventId: event.id }, transaction });
      if (data.budgetItems.length) {
        await UserEventBudgetItem.bulkCreate(
          data.budgetItems.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(data.assets)) {
      await UserEventAsset.destroy({ where: { eventId: event.id }, transaction });
      if (data.assets.length) {
        await UserEventAsset.bulkCreate(
          data.assets.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(data.checklist)) {
      await UserEventChecklistItem.destroy({ where: { eventId: event.id }, transaction });
      if (data.checklist.length) {
        await UserEventChecklistItem.bulkCreate(
          data.checklist.map((item) => ({ ...item, eventId: event.id })),
          { transaction },
        );
      }
    }

    const updated = await loadEventForUser(userId, eventId, { transaction });
    return sanitizeEvent(updated);
  });
}

export async function deleteEvent(userId, eventId) {
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await event.destroy({ transaction });
  });
}

export async function createTask(userId, eventId, payload = {}) {
  const data = normalizeTaskPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventTask.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateTask(userId, eventId, taskId, payload = {}) {
  const data = normalizeTaskPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const task = await UserEventTask.findOne({ where: { id: normalizeIdentifier(taskId, 'taskId'), eventId }, transaction });
    if (!task) {
      throw new NotFoundError('Task not found.');
    }
    await task.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteTask(userId, eventId, taskId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const task = await UserEventTask.findOne({ where: { id: normalizeIdentifier(taskId, 'taskId'), eventId }, transaction });
    if (task) {
      await task.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function createGuest(userId, eventId, payload = {}) {
  const data = normalizeGuestPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventGuest.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateGuest(userId, eventId, guestId, payload = {}) {
  const data = normalizeGuestPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const guest = await UserEventGuest.findOne({ where: { id: normalizeIdentifier(guestId, 'guestId'), eventId }, transaction });
    if (!guest) {
      throw new NotFoundError('Guest not found.');
    }
    await guest.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteGuest(userId, eventId, guestId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const guest = await UserEventGuest.findOne({ where: { id: normalizeIdentifier(guestId, 'guestId'), eventId }, transaction });
    if (guest) {
      await guest.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function createBudgetItem(userId, eventId, payload = {}) {
  const data = normalizeBudgetPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventBudgetItem.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateBudgetItem(userId, eventId, budgetItemId, payload = {}) {
  const data = normalizeBudgetPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const budgetItem = await UserEventBudgetItem.findOne({
      where: { id: normalizeIdentifier(budgetItemId, 'budgetItemId'), eventId },
      transaction,
    });
    if (!budgetItem) {
      throw new NotFoundError('Budget item not found.');
    }
    await budgetItem.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteBudgetItem(userId, eventId, budgetItemId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const budgetItem = await UserEventBudgetItem.findOne({
      where: { id: normalizeIdentifier(budgetItemId, 'budgetItemId'), eventId },
      transaction,
    });
    if (budgetItem) {
      await budgetItem.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function createAgendaItem(userId, eventId, payload = {}) {
  const data = normalizeAgendaPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventAgendaItem.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateAgendaItem(userId, eventId, agendaItemId, payload = {}) {
  const data = normalizeAgendaPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const agendaItem = await UserEventAgendaItem.findOne({
      where: { id: normalizeIdentifier(agendaItemId, 'agendaItemId'), eventId },
      transaction,
    });
    if (!agendaItem) {
      throw new NotFoundError('Agenda item not found.');
    }
    await agendaItem.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteAgendaItem(userId, eventId, agendaItemId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const agendaItem = await UserEventAgendaItem.findOne({
      where: { id: normalizeIdentifier(agendaItemId, 'agendaItemId'), eventId },
      transaction,
    });
    if (agendaItem) {
      await agendaItem.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function createAsset(userId, eventId, payload = {}) {
  const data = normalizeAssetPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventAsset.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateAsset(userId, eventId, assetId, payload = {}) {
  const data = normalizeAssetPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const asset = await UserEventAsset.findOne({ where: { id: normalizeIdentifier(assetId, 'assetId'), eventId }, transaction });
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }
    await asset.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteAsset(userId, eventId, assetId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const asset = await UserEventAsset.findOne({ where: { id: normalizeIdentifier(assetId, 'assetId'), eventId }, transaction });
    if (asset) {
      await asset.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function createChecklistItem(userId, eventId, payload = {}) {
  const data = normalizeChecklistPayload(payload, { partial: false });
  await sequelize.transaction(async (transaction) => {
    const event = await ensureEventOwnership(userId, eventId, { transaction });
    await UserEventChecklistItem.create({ ...data, eventId: event.id }, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function updateChecklistItem(userId, eventId, checklistItemId, payload = {}) {
  const data = normalizeChecklistPayload(payload, { partial: true });
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const checklistItem = await UserEventChecklistItem.findOne({
      where: { id: normalizeIdentifier(checklistItemId, 'checklistItemId'), eventId },
      transaction,
    });
    if (!checklistItem) {
      throw new NotFoundError('Checklist item not found.');
    }
    await checklistItem.update(data, { transaction });
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export async function deleteChecklistItem(userId, eventId, checklistItemId) {
  await sequelize.transaction(async (transaction) => {
    await ensureEventOwnership(userId, eventId, { transaction });
    const checklistItem = await UserEventChecklistItem.findOne({
      where: { id: normalizeIdentifier(checklistItemId, 'checklistItemId'), eventId },
      transaction,
    });
    if (checklistItem) {
      await checklistItem.destroy({ transaction });
    }
  });
  const event = await loadEventForUser(userId, eventId);
  return sanitizeEvent(event);
}

export default {
  getUserEventManagement,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  createTask,
  updateTask,
  deleteTask,
  createGuest,
  updateGuest,
  deleteGuest,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  createAsset,
  updateAsset,
  deleteAsset,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
};
