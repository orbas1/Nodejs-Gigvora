import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  AdminCalendarAccount,
  AdminCalendarTemplate,
  AdminCalendarEvent,
  AdminCalendarAvailabilityWindow,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseDate(value, { required = false, label = 'date' } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${label} is required.`);
    }
    return null;
  }

  const resolved = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolved?.getTime?.())) {
    throw new ValidationError(`${label} must be a valid date.`);
  }
  return resolved;
}

function ensurePlainObject(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...value };
}

function normaliseStringArray(value) {
  if (!value) {
    return [];
  }
  const array = Array.isArray(value) ? value : [`${value}`];
  return Array.from(
    new Set(
      array
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function normaliseRoles(value) {
  return normaliseStringArray(value).map((role) => role.toLowerCase());
}

function normaliseReminderMinutes(value) {
  if (!value) {
    return [];
  }
  const values = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(
      values
        .map((entry) => {
          const numeric = Number.parseInt(entry, 10);
          return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
        })
        .filter((entry) => entry != null),
    ),
  ).sort((a, b) => a - b);
}

function normaliseInvitees(value) {
  if (!value) {
    return [];
  }
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        const match = entry.match(/^(.*)<([^>]+)>$/);
        if (match) {
          const name = match[1].trim();
          const email = match[2].trim().toLowerCase();
          return email ? { name: name || null, email } : null;
        }
        const trimmed = entry.trim();
        if (trimmed.includes('@')) {
          return { name: null, email: trimmed.toLowerCase() };
        }
        return null;
      }
      if (typeof entry === 'object') {
        const name = entry.name ? `${entry.name}`.trim() : null;
        const email = entry.email ? `${entry.email}`.trim().toLowerCase() : null;
        if (!email) {
          return null;
        }
        return { name: name || null, email };
      }
      return null;
    })
    .filter(Boolean);
}

function normaliseAttachments(value) {
  if (!value) {
    return [];
  }
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        const [label, url] = entry.split('|').map((part) => part.trim());
        if (url) {
          return { label: label || null, url };
        }
        return null;
      }
      if (typeof entry === 'object') {
        const url = entry.url ? `${entry.url}`.trim() : null;
        if (!url) {
          return null;
        }
        const label = entry.label ? `${entry.label}`.trim() : null;
        return { label: label || null, url };
      }
      return null;
    })
    .filter(Boolean);
}

function parseMinutes(value, label) {
  if (value == null || value === '') {
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 24 * 60) {
    throw new ValidationError(`${label} must be between 0 and 1440 minutes.`);
  }
  return numeric;
}

function serialiseAccount(account) {
  if (!account) {
    return null;
  }
  if (typeof account.toPublicObject === 'function') {
    return account.toPublicObject();
  }
  const plain = account.get ? account.get({ plain: true }) : account;
  return {
    ...plain,
    metadata: ensurePlainObject(plain.metadata),
  };
}

function serialiseTemplate(template) {
  if (!template) {
    return null;
  }
  if (typeof template.toPublicObject === 'function') {
    return template.toPublicObject();
  }
  const plain = template.get ? template.get({ plain: true }) : template;
  return {
    ...plain,
    defaultAllowedRoles: normaliseStringArray(plain.defaultAllowedRoles),
    reminderMinutes: normaliseReminderMinutes(plain.reminderMinutes),
    metadata: ensurePlainObject(plain.metadata),
  };
}

function serialiseEvent(event) {
  if (!event) {
    return null;
  }
  const base = typeof event.toPublicObject === 'function' ? event.toPublicObject() : event.get({ plain: true });
  return {
    ...base,
    calendarAccount: event.calendarAccount ? serialiseAccount(event.calendarAccount) : null,
    template: event.template ? serialiseTemplate(event.template) : null,
    metadata: ensurePlainObject(base.metadata),
    invitees: normaliseInvitees(base.invitees),
    attachments: normaliseAttachments(base.attachments),
    allowedRoles: normaliseRoles(base.allowedRoles),
  };
}

function serialiseAvailability(records) {
  if (!Array.isArray(records)) {
    return {};
  }
  const grouped = new Map();
  records.forEach((record) => {
    const plain = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record.get({ plain: true });
    const accountId = plain.calendarAccountId;
    if (!accountId) {
      return;
    }
    const existing = grouped.get(accountId) ?? { windows: [] };
    const windowPayload = {
      id: plain.id,
      dayOfWeek: plain.dayOfWeek,
      startTimeMinutes: plain.startTimeMinutes,
      endTimeMinutes: plain.endTimeMinutes,
      timezone: plain.timezone,
      isActive: plain.isActive,
      metadata: ensurePlainObject(plain.metadata),
    };
    existing.windows.push(windowPayload);
    if (!existing.timezone && plain.timezone) {
      existing.timezone = plain.timezone;
    }
    grouped.set(accountId, existing);
  });
  const result = {};
  grouped.forEach((value, key) => {
    result[key] = {
      timezone: value.timezone ?? null,
      windows: value.windows.sort((a, b) => {
        if (a.dayOfWeek === b.dayOfWeek) {
          return a.startTimeMinutes - b.startTimeMinutes;
        }
        return a.dayOfWeek - b.dayOfWeek;
      }),
    };
  });
  return result;
}

function computeAccountMetrics(accounts = []) {
  if (!accounts.length) {
    return {
      total: 0,
      connected: 0,
      syncing: 0,
      needsAttention: 0,
      lastSyncedAt: null,
    };
  }
  let connected = 0;
  let syncing = 0;
  let needsAttention = 0;
  let lastSyncedAt = null;
  accounts.forEach((account) => {
    const status = (account.syncStatus ?? '').toLowerCase();
    if (status === 'connected') connected += 1;
    if (status === 'syncing') syncing += 1;
    if (status === 'needs_attention' || status === 'disconnected' || status === 'error') needsAttention += 1;
    const syncedAt = account.lastSyncedAt ? new Date(account.lastSyncedAt) : null;
    if (syncedAt && !Number.isNaN(syncedAt.getTime())) {
      if (!lastSyncedAt || syncedAt.getTime() > lastSyncedAt.getTime()) {
        lastSyncedAt = syncedAt;
      }
    }
  });
  return {
    total: accounts.length,
    connected,
    syncing,
    needsAttention,
    lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
  };
}

function computeTemplateMetrics(templates = []) {
  if (!templates.length) {
    return {
      total: 0,
      active: 0,
    };
  }
  const active = templates.filter((template) => Boolean(template.isActive)).length;
  return {
    total: templates.length,
    active,
  };
}

function computeEventMetrics(statusCounts = [], upcomingCount = 0, nextEvent = null) {
  const base = {
    total: 0,
    draft: 0,
    scheduled: 0,
    published: 0,
    cancelled: 0,
    upcoming: upcomingCount,
    nextEventAt: nextEvent?.startsAt ? new Date(nextEvent.startsAt).toISOString() : null,
  };
  statusCounts.forEach((row) => {
    const status = `${row.status ?? row.dataValues?.status ?? ''}`.toLowerCase();
    const count = Number(row.count ?? row.dataValues?.count ?? 0);
    if (Number.isFinite(count)) {
      base.total += count;
      if (Object.prototype.hasOwnProperty.call(base, status)) {
        base[status] += count;
      }
    }
  });
  return base;
}

export async function getAdminCalendarConsole(options = {}) {
  const now = new Date();
  const defaultWindowEnd = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const startDate = parseDate(options.startDate ?? options.rangeStart, { required: false, label: 'startDate' }) ?? now;
  const endDate =
    parseDate(options.endDate ?? options.rangeEnd, { required: false, label: 'endDate' }) ?? defaultWindowEnd;

  const [accounts, templates] = await Promise.all([
    AdminCalendarAccount.findAll({
      order: [
        ['provider', 'ASC'],
        ['displayName', 'ASC'],
      ],
    }),
    AdminCalendarTemplate.findAll({ order: [['name', 'ASC']] }),
  ]);

  const accountIds = accounts.map((account) => account.id);

  const [availabilityRows, events, statusCounts, upcomingCount, nextEvent] = await Promise.all([
    accountIds.length
      ? AdminCalendarAvailabilityWindow.findAll({ where: { calendarAccountId: accountIds } })
      : Promise.resolve([]),
    AdminCalendarEvent.findAll({
      where: {
        startsAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: AdminCalendarAccount, as: 'calendarAccount' },
        { model: AdminCalendarTemplate, as: 'template' },
      ],
      order: [['startsAt', 'ASC']],
      limit: 50,
    }),
    AdminCalendarEvent.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    AdminCalendarEvent.count({
      where: {
        startsAt: { [Op.gte]: now },
        status: { [Op.ne]: 'cancelled' },
      },
    }),
    AdminCalendarEvent.findOne({
      where: {
        startsAt: { [Op.gte]: now },
        status: { [Op.ne]: 'cancelled' },
      },
      order: [['startsAt', 'ASC']],
    }),
  ]);

  const availability = serialiseAvailability(availabilityRows);
  const serializedAccounts = accounts.map(serialiseAccount);
  const serializedTemplates = templates.map(serialiseTemplate);
  const serializedEvents = events.map(serialiseEvent);

  return {
    metrics: {
      accounts: computeAccountMetrics(serializedAccounts),
      templates: computeTemplateMetrics(serializedTemplates),
      events: computeEventMetrics(statusCounts, upcomingCount, nextEvent ? serialiseEvent(nextEvent) : null),
    },
    accounts: serializedAccounts,
    templates: serializedTemplates,
    events: serializedEvents,
    availability,
  };
}

export async function createAdminCalendarAccount(payload = {}) {
  const provider = payload.provider ? `${payload.provider}`.trim() : '';
  const accountEmail = payload.accountEmail ? `${payload.accountEmail}`.trim().toLowerCase() : '';
  if (!provider) {
    throw new ValidationError('provider is required.');
  }
  if (!accountEmail) {
    throw new ValidationError('accountEmail is required.');
  }

  const account = await AdminCalendarAccount.create({
    provider,
    accountEmail,
    displayName: payload.displayName ? `${payload.displayName}`.trim() : null,
    syncStatus: payload.syncStatus ? `${payload.syncStatus}`.trim().toLowerCase() : undefined,
    lastSyncedAt: parseDate(payload.lastSyncedAt, { label: 'lastSyncedAt' }),
    syncError: payload.syncError ? `${payload.syncError}`.trim() : null,
    timezone: payload.timezone ? `${payload.timezone}`.trim() : null,
    metadata: ensurePlainObject(payload.metadata),
  });

  return serialiseAccount(account);
}

export async function updateAdminCalendarAccount(accountId, payload = {}) {
  const id = Number.parseInt(accountId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid accountId is required.');
  }

  const account = await AdminCalendarAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Calendar account not found.');
  }

  const updates = {};
  if (payload.provider != null) updates.provider = `${payload.provider}`.trim();
  if (payload.accountEmail != null) updates.accountEmail = `${payload.accountEmail}`.trim().toLowerCase();
  if (payload.displayName !== undefined) updates.displayName = payload.displayName ? `${payload.displayName}`.trim() : null;
  if (payload.syncStatus !== undefined) updates.syncStatus = `${payload.syncStatus}`.trim().toLowerCase();
  if (payload.lastSyncedAt !== undefined) updates.lastSyncedAt = parseDate(payload.lastSyncedAt, { label: 'lastSyncedAt' });
  if (payload.syncError !== undefined) updates.syncError = payload.syncError ? `${payload.syncError}`.trim() : null;
  if (payload.timezone !== undefined) updates.timezone = payload.timezone ? `${payload.timezone}`.trim() : null;
  if (payload.metadata !== undefined) updates.metadata = ensurePlainObject(payload.metadata);

  await account.update(updates);
  await account.reload();
  return serialiseAccount(account);
}

export async function deleteAdminCalendarAccount(accountId) {
  const id = Number.parseInt(accountId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid accountId is required.');
  }

  const account = await AdminCalendarAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Calendar account not found.');
  }

  await sequelize.transaction(async (transaction) => {
    await AdminCalendarAvailabilityWindow.destroy({ where: { calendarAccountId: id }, transaction });
    await AdminCalendarEvent.update(
      { calendarAccountId: null },
      { where: { calendarAccountId: id }, transaction },
    );
    await account.destroy({ transaction });
  });

  return { success: true };
}

export async function upsertAdminCalendarAvailability(accountId, payload = {}) {
  const id = Number.parseInt(accountId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid accountId is required.');
  }

  const account = await AdminCalendarAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Calendar account not found.');
  }

  const windows = Array.isArray(payload.windows) ? payload.windows : [];
  const timezone = payload.timezone ? `${payload.timezone}`.trim() : account.timezone;

  const windowPayloads = windows.map((window) => {
    if (window == null || typeof window !== 'object') {
      throw new ValidationError('Each availability window must be an object.');
    }
    const dayOfWeek = Number.parseInt(window.dayOfWeek, 10);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ValidationError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday).');
    }
    const startTimeMinutes = parseMinutes(window.startTimeMinutes, 'startTimeMinutes');
    const endTimeMinutes = parseMinutes(window.endTimeMinutes, 'endTimeMinutes');
    if (endTimeMinutes <= startTimeMinutes) {
      throw new ValidationError('endTimeMinutes must be greater than startTimeMinutes.');
    }
    return {
      calendarAccountId: id,
      dayOfWeek,
      startTimeMinutes,
      endTimeMinutes,
      timezone: window.timezone ? `${window.timezone}`.trim() : timezone,
      isActive: window.isActive !== false,
      metadata: ensurePlainObject(window.metadata),
    };
  });

  await sequelize.transaction(async (transaction) => {
    await AdminCalendarAvailabilityWindow.destroy({ where: { calendarAccountId: id }, transaction });
    if (windowPayloads.length) {
      await AdminCalendarAvailabilityWindow.bulkCreate(windowPayloads, { transaction });
    }
    if (timezone && timezone !== account.timezone) {
      account.timezone = timezone;
      await account.save({ transaction });
    }
  });

  const [updatedAccount, availabilityRows] = await Promise.all([
    AdminCalendarAccount.findByPk(id),
    AdminCalendarAvailabilityWindow.findAll({ where: { calendarAccountId: id } }),
  ]);

  const serialisedAvailability = serialiseAvailability(availabilityRows)[id] ?? { timezone: timezone ?? null, windows: [] };

  return {
    account: serialiseAccount(updatedAccount),
    availability: serialisedAvailability,
  };
}

export async function createAdminCalendarTemplate(payload = {}) {
  const name = payload.name ? `${payload.name}`.trim() : '';
  if (!name) {
    throw new ValidationError('name is required.');
  }

  const template = await AdminCalendarTemplate.create({
    name,
    description: payload.description ? `${payload.description}`.trim() : null,
    durationMinutes:
      payload.durationMinutes == null ? null : Number.parseInt(payload.durationMinutes, 10) || null,
    defaultEventType: payload.defaultEventType ? `${payload.defaultEventType}`.trim().toLowerCase() : undefined,
    defaultVisibility: payload.defaultVisibility ? `${payload.defaultVisibility}`.trim().toLowerCase() : undefined,
    defaultLocation: payload.defaultLocation ? `${payload.defaultLocation}`.trim() : null,
    defaultMeetingUrl: payload.defaultMeetingUrl ? `${payload.defaultMeetingUrl}`.trim() : null,
    defaultAllowedRoles: normaliseRoles(payload.defaultAllowedRoles ?? payload.allowedRoles),
    reminderMinutes: normaliseReminderMinutes(payload.reminderMinutes),
    instructions: payload.instructions ? `${payload.instructions}`.trim() : null,
    bannerImageUrl: payload.bannerImageUrl ? `${payload.bannerImageUrl}`.trim() : null,
    isActive: payload.isActive !== false,
    metadata: ensurePlainObject(payload.metadata),
    createdBy: payload.createdBy ? `${payload.createdBy}`.trim() : null,
    updatedBy: payload.updatedBy ? `${payload.updatedBy}`.trim() : null,
  });

  return serialiseTemplate(template);
}

export async function updateAdminCalendarTemplate(templateId, payload = {}) {
  const id = Number.parseInt(templateId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid templateId is required.');
  }

  const template = await AdminCalendarTemplate.findByPk(id);
  if (!template) {
    throw new NotFoundError('Calendar template not found.');
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name ? `${payload.name}`.trim() : template.name;
  if (payload.description !== undefined)
    updates.description = payload.description ? `${payload.description}`.trim() : null;
  if (payload.durationMinutes !== undefined)
    updates.durationMinutes = payload.durationMinutes == null ? null : Number.parseInt(payload.durationMinutes, 10) || null;
  if (payload.defaultEventType !== undefined) updates.defaultEventType = `${payload.defaultEventType}`.trim().toLowerCase();
  if (payload.defaultVisibility !== undefined)
    updates.defaultVisibility = `${payload.defaultVisibility}`.trim().toLowerCase();
  if (payload.defaultLocation !== undefined)
    updates.defaultLocation = payload.defaultLocation ? `${payload.defaultLocation}`.trim() : null;
  if (payload.defaultMeetingUrl !== undefined)
    updates.defaultMeetingUrl = payload.defaultMeetingUrl ? `${payload.defaultMeetingUrl}`.trim() : null;
  if (payload.defaultAllowedRoles !== undefined || payload.allowedRoles !== undefined)
    updates.defaultAllowedRoles = normaliseRoles(payload.defaultAllowedRoles ?? payload.allowedRoles);
  if (payload.reminderMinutes !== undefined)
    updates.reminderMinutes = normaliseReminderMinutes(payload.reminderMinutes);
  if (payload.instructions !== undefined)
    updates.instructions = payload.instructions ? `${payload.instructions}`.trim() : null;
  if (payload.bannerImageUrl !== undefined)
    updates.bannerImageUrl = payload.bannerImageUrl ? `${payload.bannerImageUrl}`.trim() : null;
  if (payload.isActive !== undefined) updates.isActive = Boolean(payload.isActive);
  if (payload.metadata !== undefined) updates.metadata = ensurePlainObject(payload.metadata);
  if (payload.updatedBy !== undefined) updates.updatedBy = payload.updatedBy ? `${payload.updatedBy}`.trim() : null;

  await template.update(updates);
  await template.reload();
  return serialiseTemplate(template);
}

export async function deleteAdminCalendarTemplate(templateId) {
  const id = Number.parseInt(templateId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid templateId is required.');
  }

  const template = await AdminCalendarTemplate.findByPk(id);
  if (!template) {
    throw new NotFoundError('Calendar template not found.');
  }

  await sequelize.transaction(async (transaction) => {
    await AdminCalendarEvent.update({ templateId: null }, { where: { templateId: id }, transaction });
    await template.destroy({ transaction });
  });

  return { success: true };
}

async function resolveCalendarAccount(accountId) {
  if (accountId == null) {
    return null;
  }
  const id = Number.parseInt(accountId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('calendarAccountId must be a positive integer.');
  }
  const account = await AdminCalendarAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Calendar account not found.');
  }
  return account;
}

async function resolveTemplate(templateId) {
  if (templateId == null) {
    return null;
  }
  const id = Number.parseInt(templateId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('templateId must be a positive integer.');
  }
  const template = await AdminCalendarTemplate.findByPk(id);
  if (!template) {
    throw new NotFoundError('Calendar template not found.');
  }
  return template;
}

function buildEventPayload(payload = {}) {
  const startsAt = parseDate(payload.startsAt, { required: true, label: 'startsAt' });
  const endsAt = parseDate(payload.endsAt, { label: 'endsAt' });
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new ValidationError('endsAt must be later than startsAt.');
  }
  const title = payload.title ? `${payload.title}`.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }

  return {
    title,
    description: payload.description ? `${payload.description}`.trim() : null,
    eventType: payload.eventType ? `${payload.eventType}`.trim().toLowerCase() : undefined,
    status: payload.status ? `${payload.status}`.trim().toLowerCase() : undefined,
    visibility: payload.visibility ? `${payload.visibility}`.trim().toLowerCase() : undefined,
    meetingUrl: payload.meetingUrl ? `${payload.meetingUrl}`.trim() : null,
    location: payload.location ? `${payload.location}`.trim() : null,
    startsAt,
    endsAt,
    invitees: normaliseInvitees(payload.invitees),
    attachments: normaliseAttachments(payload.attachments),
    allowedRoles: normaliseRoles(payload.allowedRoles),
    coverImageUrl: payload.coverImageUrl ? `${payload.coverImageUrl}`.trim() : null,
    metadata: ensurePlainObject(payload.metadata),
    createdBy: payload.createdBy ? `${payload.createdBy}`.trim() : null,
    updatedBy: payload.updatedBy ? `${payload.updatedBy}`.trim() : null,
  };
}

export async function createAdminCalendarEvent(payload = {}) {
  const eventPayload = buildEventPayload(payload);

  const [account, template] = await Promise.all([
    resolveCalendarAccount(payload.calendarAccountId),
    resolveTemplate(payload.templateId),
  ]);

  const event = await AdminCalendarEvent.create({
    ...eventPayload,
    calendarAccountId: account ? account.id : null,
    templateId: template ? template.id : null,
  });

  const reloaded = await AdminCalendarEvent.findByPk(event.id, {
    include: [
      { model: AdminCalendarAccount, as: 'calendarAccount' },
      { model: AdminCalendarTemplate, as: 'template' },
    ],
  });

  return serialiseEvent(reloaded);
}

export async function updateAdminCalendarEvent(eventId, payload = {}) {
  const id = Number.parseInt(eventId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid eventId is required.');
  }

  const event = await AdminCalendarEvent.findByPk(id);
  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  const updates = {};
  if (payload.title !== undefined) {
    const title = payload.title ? `${payload.title}`.trim() : '';
    if (!title) {
      throw new ValidationError('title is required.');
    }
    updates.title = title;
  }
  if (payload.description !== undefined) updates.description = payload.description ? `${payload.description}`.trim() : null;
  if (payload.eventType !== undefined) updates.eventType = `${payload.eventType}`.trim().toLowerCase();
  if (payload.status !== undefined) updates.status = `${payload.status}`.trim().toLowerCase();
  if (payload.visibility !== undefined) updates.visibility = `${payload.visibility}`.trim().toLowerCase();
  if (payload.meetingUrl !== undefined) updates.meetingUrl = payload.meetingUrl ? `${payload.meetingUrl}`.trim() : null;
  if (payload.location !== undefined) updates.location = payload.location ? `${payload.location}`.trim() : null;
  if (payload.startsAt !== undefined) updates.startsAt = parseDate(payload.startsAt, { required: true, label: 'startsAt' });
  if (payload.endsAt !== undefined) updates.endsAt = parseDate(payload.endsAt, { label: 'endsAt' });
  if (updates.endsAt && updates.startsAt && updates.endsAt.getTime() <= updates.startsAt.getTime()) {
    throw new ValidationError('endsAt must be later than startsAt.');
  }
  if (payload.invitees !== undefined) updates.invitees = normaliseInvitees(payload.invitees);
  if (payload.attachments !== undefined) updates.attachments = normaliseAttachments(payload.attachments);
  if (payload.allowedRoles !== undefined) updates.allowedRoles = normaliseRoles(payload.allowedRoles);
  if (payload.coverImageUrl !== undefined)
    updates.coverImageUrl = payload.coverImageUrl ? `${payload.coverImageUrl}`.trim() : null;
  if (payload.metadata !== undefined) updates.metadata = ensurePlainObject(payload.metadata);
  if (payload.updatedBy !== undefined) updates.updatedBy = payload.updatedBy ? `${payload.updatedBy}`.trim() : null;

  if (payload.calendarAccountId !== undefined) {
    const account = await resolveCalendarAccount(payload.calendarAccountId);
    updates.calendarAccountId = account ? account.id : null;
  }

  if (payload.templateId !== undefined) {
    const template = await resolveTemplate(payload.templateId);
    updates.templateId = template ? template.id : null;
  }

  await event.update(updates);

  const reloaded = await AdminCalendarEvent.findByPk(event.id, {
    include: [
      { model: AdminCalendarAccount, as: 'calendarAccount' },
      { model: AdminCalendarTemplate, as: 'template' },
    ],
  });

  return serialiseEvent(reloaded);
}

export async function deleteAdminCalendarEvent(eventId) {
  const id = Number.parseInt(eventId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid eventId is required.');
  }

  const event = await AdminCalendarEvent.findByPk(id);
  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  await event.destroy();
  return { success: true };
}

export default {
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
};
