import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  ClientPortal,
  ClientPortalTimelineEvent,
  ClientPortalScopeItem,
  ClientPortalDecisionLog,
  ClientPortalInsightWidget,
  Project,
  User,
  CLIENT_PORTAL_STATUSES,
  CLIENT_PORTAL_TIMELINE_STATUSES,
  CLIENT_PORTAL_SCOPE_STATUSES,
  CLIENT_PORTAL_DECISION_VISIBILITIES,
  CLIENT_PORTAL_INSIGHT_TYPES,
  CLIENT_PORTAL_INSIGHT_VISIBILITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseInteger(value, { field, allowNull = true } = {}) {
  if (value == null) {
    if (allowNull) return null;
    throw new ValidationError(`${field ?? 'value'} is required.`);
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ValidationError(`${field ?? 'value'} must be a positive integer.`);
  }
  return number;
}

function slugify(input) {
  if (!input) {
    return '';
  }
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 150);
}

async function generateUniqueSlug(titleOrSlug, { transaction, excludePortalId } = {}) {
  let base = slugify(titleOrSlug);
  if (!base) {
    base = `portal-${randomUUID().slice(0, 8)}`;
  }
  let candidate = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const whereClause = excludePortalId
      ? { slug: candidate, id: { [Op.ne]: excludePortalId } }
      : { slug: candidate };
    // eslint-disable-next-line no-await-in-loop
    const existing = await ClientPortal.count({ where: whereClause, transaction });
    if (!existing) {
      return candidate;
    }
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

function normalizeStatus(value, allowed, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`Status must be a string.`);
  }
  const normalized = value.trim().toLowerCase();
  if (!allowed.includes(normalized)) {
    throw new ValidationError(`Status must be one of: ${allowed.join(', ')}.`);
  }
  return normalized;
}

function normalizeHexColor(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Colors must be provided as hex strings.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(formatted)) {
    throw new ValidationError('Colors must be a valid 3 or 6 character hex code.');
  }
  return formatted.toUpperCase();
}

function normalizeStakeholders(value) {
  if (!value) {
    return [];
  }
  const items = Array.isArray(value)
    ? value
    : typeof value === 'object'
    ? Object.values(value)
    : [];

  return items
    .map((entry) => {
      if (!entry) return null;
      const name = entry.name ? String(entry.name).trim() : '';
      const role = entry.role ? String(entry.role).trim() : '';
      const email = entry.email ? String(entry.email).trim() : '';
      const organization = entry.organization ? String(entry.organization).trim() : '';
      const timezone = entry.timezone ? String(entry.timezone).trim() : '';
      if (!name && !email) {
        return null;
      }
      return {
        name,
        role: role || null,
        email: email || null,
        organization: organization || null,
        timezone: timezone || null,
        preferredChannel: entry.preferredChannel ? String(entry.preferredChannel).trim() : null,
        notify: entry.notify === false ? false : true,
      };
    })
    .filter(Boolean);
}

function normalizePreferences(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const clone = { ...value };
  const digest = clone.digest && typeof clone.digest === 'object' ? { ...clone.digest } : {};
  const frequencySource = clone.digestFrequency ?? digest.frequency;
  if (frequencySource) {
    digest.frequency = String(frequencySource).toLowerCase();
  }
  if (!digest.frequency) {
    digest.frequency = 'weekly';
  }
  const recipientsSource = clone.digestRecipients ?? digest.recipients;
  if (recipientsSource) {
    digest.recipients = Array.isArray(recipientsSource)
      ? recipientsSource.map((recipient) => String(recipient).trim()).filter(Boolean)
      : typeof recipientsSource === 'string'
      ? recipientsSource
          .split(',')
          .map((recipient) => recipient.trim())
          .filter(Boolean)
      : [];
  }
  if (!Array.isArray(digest.recipients)) {
    digest.recipients = [];
  }
  const theme = clone.theme && typeof clone.theme === 'object' ? { ...clone.theme } : {};
  if (clone.brandColor && !theme.brand) {
    theme.brand = clone.brandColor;
  }
  if (clone.accentColor && !theme.accent) {
    theme.accent = clone.accentColor;
  }

  return {
    ...clone,
    digest,
    theme,
  };
}

function normalizeMetadata(value) {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  }
  throw new ValidationError('metadata must be an object or array when provided.');
}

function parseDate(value, { field, allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) return null;
    throw new ValidationError(`${field ?? 'date'} is required.`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field ?? 'date'} must be a valid datetime.`);
  }
  return date;
}

async function ensurePortalExists(portalId, { transaction } = {}) {
  const portal = await ClientPortal.findByPk(portalId, { transaction });
  if (!portal) {
    throw new NotFoundError('Client portal not found.');
  }
  return portal;
}

async function ensureUserExists(userId, { transaction } = {}) {
  if (userId == null) {
    return null;
  }
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new ValidationError('Referenced user was not found.');
  }
  return user;
}

export async function createClientPortal(input = {}) {
  const projectId = parseInteger(input.projectId, { field: 'projectId', allowNull: false });
  const ownerId = input.ownerId == null ? null : parseInteger(input.ownerId, { field: 'ownerId' });
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }
  const summary = typeof input.summary === 'string' ? input.summary.trim() : null;
  const status = normalizeStatus(input.status, CLIENT_PORTAL_STATUSES, 'draft');
  const brandColor = normalizeHexColor(input.brandColor ?? input.theme?.brand ?? input.preferences?.theme?.brand);
  const accentColor = normalizeHexColor(input.accentColor ?? input.theme?.accent ?? input.preferences?.theme?.accent);
  const stakeholders = normalizeStakeholders(input.stakeholders ?? input.clientStakeholders);
  const preferences = normalizePreferences(input.preferences ?? {});

  return sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction });
    if (!project) {
      throw new ValidationError('projectId must reference an existing project.');
    }
    if (ownerId != null) {
      await ensureUserExists(ownerId, { transaction });
    }

    const slug = await generateUniqueSlug(input.slug ?? title, { transaction });

    const portal = await ClientPortal.create(
      {
        projectId,
        ownerId,
        slug,
        title,
        summary,
        status,
        brandColor,
        accentColor,
        preferences,
        stakeholders,
      },
      { transaction },
    );

    await portal.reload({ include: [{ model: User, as: 'owner' }, { model: Project, as: 'project' }], transaction });

    return portal.toPublicObject();
  });
}

export async function updateClientPortal(portalId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  return sequelize.transaction(async (transaction) => {
    const portal = await ClientPortal.findByPk(id, { transaction });
    if (!portal) {
      throw new NotFoundError('Client portal not found.');
    }

    const updates = {};

    if (input.title !== undefined) {
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      if (!title) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = title;
    }

    if (input.summary !== undefined) {
      updates.summary = typeof input.summary === 'string' ? input.summary.trim() : null;
    }

    if (input.status !== undefined) {
      updates.status = normalizeStatus(input.status, CLIENT_PORTAL_STATUSES, portal.status);
    }

    if (input.ownerId !== undefined) {
      updates.ownerId = input.ownerId == null ? null : parseInteger(input.ownerId, { field: 'ownerId' });
      if (updates.ownerId != null) {
        await ensureUserExists(updates.ownerId, { transaction });
      }
    }

    if (input.projectId !== undefined) {
      const projectId = parseInteger(input.projectId, { field: 'projectId', allowNull: false });
      const project = await Project.findByPk(projectId, { transaction });
      if (!project) {
        throw new ValidationError('projectId must reference an existing project.');
      }
      updates.projectId = projectId;
    }

    if (input.slug !== undefined) {
      const slug = await generateUniqueSlug(input.slug ?? portal.slug, {
        transaction,
        excludePortalId: portal.id,
      });
      updates.slug = slug;
    }

    if (input.brandColor !== undefined) {
      updates.brandColor = normalizeHexColor(input.brandColor);
    }

    if (input.accentColor !== undefined) {
      updates.accentColor = normalizeHexColor(input.accentColor);
    }

    if (input.stakeholders !== undefined) {
      updates.stakeholders = normalizeStakeholders(input.stakeholders);
    }

    if (input.preferences !== undefined) {
      const current = portal.preferences && typeof portal.preferences === 'object' ? portal.preferences : {};
      updates.preferences = { ...current, ...normalizePreferences(input.preferences) };
    }

    if (Object.keys(updates).length === 0) {
      await portal.reload({ include: [{ model: User, as: 'owner' }, { model: Project, as: 'project' }], transaction });
      return portal.toPublicObject();
    }

    await portal.update(updates, { transaction });
    await portal.reload({ include: [{ model: User, as: 'owner' }, { model: Project, as: 'project' }], transaction });
    return portal.toPublicObject();
  });
}

export async function addTimelineEvent(portalId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }
  const status = normalizeStatus(input.status, CLIENT_PORTAL_TIMELINE_STATUSES, 'planned');
  const startDate = parseDate(input.startDate, { field: 'startDate' });
  const dueDate = parseDate(input.dueDate, { field: 'dueDate' });
  const ownerId = input.ownerId == null ? null : parseInteger(input.ownerId, { field: 'ownerId' });

  return sequelize.transaction(async (transaction) => {
    await ensurePortalExists(id, { transaction });
    if (ownerId != null) {
      await ensureUserExists(ownerId, { transaction });
    }

      const event = await ClientPortalTimelineEvent.create(
        {
          portalId: id,
          ownerId,
          title,
          description: typeof input.description === 'string' ? input.description.trim() : null,
          eventType: typeof input.eventType === 'string' && input.eventType.trim() ? input.eventType.trim().toLowerCase() : 'milestone',
          status,
          startDate,
          dueDate,
          metadata: normalizeMetadata(input.metadata),
        },
        { transaction },
      );

    await event.reload({ include: [{ model: User, as: 'owner' }], transaction });
    return event.toPublicObject();
  });
}

export async function updateTimelineEvent(portalId, eventId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const timelineEventId = parseInteger(eventId, { field: 'eventId', allowNull: false });

  return sequelize.transaction(async (transaction) => {
    const event = await ClientPortalTimelineEvent.findByPk(timelineEventId, {
      transaction,
      include: [{ model: User, as: 'owner' }],
    });
    if (!event || event.portalId !== id) {
      throw new NotFoundError('Timeline event not found for this portal.');
    }

    const updates = {};
    if (input.title !== undefined) {
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      if (!title) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = title;
    }
    if (input.description !== undefined) {
      updates.description = typeof input.description === 'string' ? input.description.trim() : null;
    }
    if (input.status !== undefined) {
      updates.status = normalizeStatus(input.status, CLIENT_PORTAL_TIMELINE_STATUSES, event.status);
    }
    if (input.eventType !== undefined) {
      updates.eventType = typeof input.eventType === 'string' && input.eventType.trim()
        ? input.eventType.trim().toLowerCase()
        : event.eventType;
    }
    if (input.startDate !== undefined) {
      updates.startDate = parseDate(input.startDate, { field: 'startDate' });
    }
    if (input.dueDate !== undefined) {
      updates.dueDate = parseDate(input.dueDate, { field: 'dueDate' });
    }
    if (input.ownerId !== undefined) {
      updates.ownerId = input.ownerId == null ? null : parseInteger(input.ownerId, { field: 'ownerId' });
      if (updates.ownerId != null) {
        await ensureUserExists(updates.ownerId, { transaction });
      }
    }
    if (input.metadata !== undefined) {
      const current = event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
      updates.metadata = { ...current, ...normalizeMetadata(input.metadata) };
    }

    if (Object.keys(updates).length === 0) {
      return event.toPublicObject();
    }

    await event.update(updates, { transaction });
    await event.reload({ include: [{ model: User, as: 'owner' }], transaction });
    return event.toPublicObject();
  });
}

export async function addScopeItem(portalId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }
  const status = normalizeStatus(input.status, CLIENT_PORTAL_SCOPE_STATUSES, 'committed');

  return sequelize.transaction(async (transaction) => {
    await ensurePortalExists(id, { transaction });

    const scopeItem = await ClientPortalScopeItem.create(
      {
        portalId: id,
        title,
        description: typeof input.description === 'string' ? input.description.trim() : null,
        category: typeof input.category === 'string' ? input.category.trim() : null,
        status,
        effortHours: input.effortHours == null ? null : Number(input.effortHours),
        valueCurrency: typeof input.valueCurrency === 'string' ? input.valueCurrency.trim().toUpperCase() : null,
        valueAmount: input.valueAmount == null ? null : Number(input.valueAmount),
        lastDecisionAt: parseDate(input.lastDecisionAt, { field: 'lastDecisionAt' }),
        metadata: normalizeMetadata(input.metadata),
      },
      { transaction },
    );

    return scopeItem.toPublicObject();
  });
}

export async function updateScopeItem(portalId, itemId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const scopeItemId = parseInteger(itemId, { field: 'scopeItemId', allowNull: false });

  return sequelize.transaction(async (transaction) => {
    const scopeItem = await ClientPortalScopeItem.findByPk(scopeItemId, { transaction });
    if (!scopeItem || scopeItem.portalId !== id) {
      throw new NotFoundError('Scope item not found for this portal.');
    }

    const updates = {};
    if (input.title !== undefined) {
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      if (!title) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = title;
    }
    if (input.description !== undefined) {
      updates.description = typeof input.description === 'string' ? input.description.trim() : null;
    }
    if (input.category !== undefined) {
      updates.category = typeof input.category === 'string' ? input.category.trim() : null;
    }
    if (input.status !== undefined) {
      updates.status = normalizeStatus(input.status, CLIENT_PORTAL_SCOPE_STATUSES, scopeItem.status);
    }
    if (input.effortHours !== undefined) {
      updates.effortHours = input.effortHours == null ? null : Number(input.effortHours);
    }
    if (input.valueCurrency !== undefined) {
      updates.valueCurrency =
        input.valueCurrency == null ? null : String(input.valueCurrency).trim().toUpperCase();
    }
    if (input.valueAmount !== undefined) {
      updates.valueAmount = input.valueAmount == null ? null : Number(input.valueAmount);
    }
    if (input.lastDecisionAt !== undefined) {
      updates.lastDecisionAt = parseDate(input.lastDecisionAt, { field: 'lastDecisionAt' });
    }
    if (input.metadata !== undefined) {
      const current = scopeItem.metadata && typeof scopeItem.metadata === 'object' ? scopeItem.metadata : {};
      updates.metadata = { ...current, ...normalizeMetadata(input.metadata) };
    }

    if (Object.keys(updates).length === 0) {
      return scopeItem.toPublicObject();
    }

    await scopeItem.update(updates, { transaction });
    return scopeItem.toPublicObject();
  });
}

export async function recordDecision(portalId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const summary = typeof input.summary === 'string' ? input.summary.trim() : '';
  if (!summary) {
    throw new ValidationError('summary is required.');
  }
  const decision = typeof input.decision === 'string' ? input.decision.trim() : '';
  if (!decision) {
    throw new ValidationError('decision is required.');
  }
  const decidedAt = parseDate(input.decidedAt ?? new Date(), { field: 'decidedAt', allowNull: false });
  const decidedById = input.decidedById == null ? null : parseInteger(input.decidedById, { field: 'decidedById' });
  const visibility = normalizeStatus(
    input.visibility,
    CLIENT_PORTAL_DECISION_VISIBILITIES,
    'client',
  );

  return sequelize.transaction(async (transaction) => {
    await ensurePortalExists(id, { transaction });
    if (decidedById != null) {
      await ensureUserExists(decidedById, { transaction });
    }

    const record = await ClientPortalDecisionLog.create(
      {
        portalId: id,
        summary,
        decision,
        decidedAt,
        decidedById,
        category: typeof input.category === 'string' ? input.category.trim() : null,
        impactSummary: typeof input.impactSummary === 'string' ? input.impactSummary.trim() : null,
        followUpDate: parseDate(input.followUpDate, { field: 'followUpDate' }),
        visibility,
        attachments: normalizeMetadata(input.attachments),
      },
      { transaction },
    );

    await record.reload({ include: [{ model: User, as: 'decidedBy' }], transaction });
    return record.toPublicObject();
  });
}

export async function createInsightWidget(portalId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }
  const widgetType = normalizeStatus(input.widgetType, CLIENT_PORTAL_INSIGHT_TYPES, 'custom');
  const visibility = normalizeStatus(input.visibility, CLIENT_PORTAL_INSIGHT_VISIBILITIES, 'shared');

  return sequelize.transaction(async (transaction) => {
    await ensurePortalExists(id, { transaction });
    const maxOrder = (await ClientPortalInsightWidget.max('orderIndex', { where: { portalId: id }, transaction })) ?? 0;

    const widget = await ClientPortalInsightWidget.create(
      {
        portalId: id,
        widgetType,
        title,
        description: typeof input.description === 'string' ? input.description.trim() : null,
        data: normalizeMetadata(input.data),
        visibility,
        orderIndex: input.orderIndex == null ? maxOrder + 1 : Number(input.orderIndex),
      },
      { transaction },
    );

    return widget.toPublicObject();
  });
}

export async function updateInsightWidget(portalId, widgetId, input = {}) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const insightId = parseInteger(widgetId, { field: 'widgetId', allowNull: false });

  return sequelize.transaction(async (transaction) => {
    const widget = await ClientPortalInsightWidget.findByPk(insightId, { transaction });
    if (!widget || widget.portalId !== id) {
      throw new NotFoundError('Insight widget not found for this portal.');
    }

    const updates = {};
    if (input.title !== undefined) {
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      if (!title) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = title;
    }
    if (input.description !== undefined) {
      updates.description = typeof input.description === 'string' ? input.description.trim() : null;
    }
    if (input.widgetType !== undefined) {
      updates.widgetType = normalizeStatus(input.widgetType, CLIENT_PORTAL_INSIGHT_TYPES, widget.widgetType);
    }
    if (input.visibility !== undefined) {
      updates.visibility = normalizeStatus(
        input.visibility,
        CLIENT_PORTAL_INSIGHT_VISIBILITIES,
        widget.visibility,
      );
    }
    if (input.data !== undefined) {
      const current = widget.data && typeof widget.data === 'object' ? widget.data : {};
      updates.data = { ...current, ...normalizeMetadata(input.data) };
    }
    if (input.orderIndex !== undefined) {
      updates.orderIndex = Number(input.orderIndex);
    }

    if (Object.keys(updates).length === 0) {
      return widget.toPublicObject();
    }

    await widget.update(updates, { transaction });
    return widget.toPublicObject();
  });
}

function computeTimelineSummary(events) {
  const now = new Date();
  const totalCount = events.length;
  const completedCount = events.filter((event) => event.status === 'completed').length;
  const atRiskEvents = events.filter(
    (event) =>
      event.status === 'at_risk' ||
      (event.status !== 'completed' && event.dueDate && new Date(event.dueDate).getTime() < now.getTime()),
  );
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const upcomingMilestones = events
    .filter(
      (event) =>
        event.dueDate &&
        new Date(event.dueDate).getTime() >= now.getTime() &&
        (event.status === 'planned' || event.status === 'in_progress' || event.status === 'at_risk'),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
  const overdueCount = events.filter(
    (event) => event.status !== 'completed' && event.dueDate && new Date(event.dueDate).getTime() < now.getTime(),
  ).length;

  const lastUpdatedAt = events.reduce((latest, event) => {
    if (event.updatedAt) {
      const updatedAt = new Date(event.updatedAt);
      if (!latest || updatedAt.getTime() > latest.getTime()) {
        return updatedAt;
      }
    }
    return latest;
  }, null);

  return {
    totalCount,
    completedCount,
    progressPercent,
    overdueCount,
    upcomingMilestones,
    atRiskEvents,
    lastUpdatedAt,
  };
}

function computeScopeSummary(items) {
  return items.reduce(
    (accumulator, item) => {
      const result = { ...accumulator };
      result.totalCount += 1;
      switch (item.status) {
        case 'delivered':
          result.deliveredCount += 1;
          break;
        case 'in_delivery':
          result.inDeliveryCount += 1;
          break;
        case 'proposed':
          result.proposedCount += 1;
          break;
        case 'out_of_scope':
          result.outOfScopeCount += 1;
          break;
        default:
          result.committedCount += 1;
          break;
      }
      if (item.effortHours != null) {
        result.totalEffortHours += Number(item.effortHours);
        if (item.status === 'delivered') {
          result.deliveredEffortHours += Number(item.effortHours);
        }
      }
      if (item.valueAmount != null) {
        result.totalValueAmount += Number(item.valueAmount);
      }
      return result;
    },
    {
      totalCount: 0,
      committedCount: 0,
      inDeliveryCount: 0,
      deliveredCount: 0,
      proposedCount: 0,
      outOfScopeCount: 0,
      totalEffortHours: 0,
      deliveredEffortHours: 0,
      totalValueAmount: 0,
    },
  );
}

function computeDecisionSummary(decisions) {
  const summary = {
    totalCount: decisions.length,
    lastDecisionAt: null,
    categories: {},
  };

  for (const decision of decisions) {
    if (decision.category) {
      summary.categories[decision.category] = (summary.categories[decision.category] ?? 0) + 1;
    }
    if (decision.decidedAt) {
      const decidedAtDate = new Date(decision.decidedAt);
      if (!summary.lastDecisionAt || decidedAtDate.getTime() > new Date(summary.lastDecisionAt).getTime()) {
        summary.lastDecisionAt = decidedAtDate.toISOString();
      }
    }
  }

  return summary;
}

export async function getClientPortalDashboard(portalId) {
  const id = parseInteger(portalId, { field: 'portalId', allowNull: false });
  const portal = await ClientPortal.findByPk(id, {
    include: [
      { model: Project, as: 'project' },
      { model: User, as: 'owner' },
      { model: ClientPortalTimelineEvent, as: 'timelineEvents', include: [{ model: User, as: 'owner' }] },
      { model: ClientPortalScopeItem, as: 'scopeItems' },
      { model: ClientPortalDecisionLog, as: 'decisions', include: [{ model: User, as: 'decidedBy' }] },
      { model: ClientPortalInsightWidget, as: 'insightWidgets' },
    ],
    order: [
      [{ model: ClientPortalTimelineEvent, as: 'timelineEvents' }, 'dueDate', 'ASC'],
      [{ model: ClientPortalInsightWidget, as: 'insightWidgets' }, 'orderIndex', 'ASC'],
    ],
  });

  if (!portal) {
    throw new NotFoundError('Client portal not found.');
  }

  const portalPublic = portal.toPublicObject();
  const timelineEvents = (portal.timelineEvents ?? []).map((event) => event.toPublicObject());
  timelineEvents.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
  });
  const scopeItems = (portal.scopeItems ?? []).map((item) => item.toPublicObject());
  const decisions = (portal.decisions ?? [])
    .map((entry) => entry.toPublicObject())
    .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
  const insightWidgets = (portal.insightWidgets ?? [])
    .map((widget) => widget.toPublicObject())
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const timelineSummary = computeTimelineSummary(timelineEvents);
  const scopeSummary = computeScopeSummary(scopeItems);
  const decisionSummary = computeDecisionSummary(decisions);

  const baseHealth = 68 + Math.min(timelineSummary.progressPercent, 90) / 3;
  const riskPenalty = timelineSummary.overdueCount * 8 + scopeSummary.outOfScopeCount * 6 + scopeSummary.inDeliveryCount * 2;
  const healthScore = Math.max(0, Math.min(100, Math.round(baseHealth - riskPenalty + scopeSummary.deliveredCount * 2)));
  const riskLevel = healthScore >= 80 ? 'confident' : healthScore >= 60 ? 'watch' : 'at_risk';

  const digestConfig = portalPublic.preferences?.digest ?? {};

  return {
    portal: {
      ...portalPublic,
      healthScore,
      riskLevel,
    },
    timeline: {
      events: timelineEvents,
      summary: timelineSummary,
    },
    scope: {
      items: scopeItems,
      summary: {
        ...scopeSummary,
        completionRatio:
          scopeSummary.totalCount > 0 ? Math.round((scopeSummary.deliveredCount / scopeSummary.totalCount) * 100) : 0,
      },
    },
    decisions: {
      entries: decisions,
      summary: decisionSummary,
    },
    insights: {
      widgets: insightWidgets,
      digest: {
        frequency: digestConfig.frequency ?? 'weekly',
        recipients: Array.isArray(digestConfig.recipients) ? digestConfig.recipients : [],
      },
      summary: {
        activeCount: insightWidgets.length,
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

export default {
  createClientPortal,
  updateClientPortal,
  getClientPortalDashboard,
  addTimelineEvent,
  updateTimelineEvent,
  addScopeItem,
  updateScopeItem,
  recordDecision,
  createInsightWidget,
  updateInsightWidget,
};
