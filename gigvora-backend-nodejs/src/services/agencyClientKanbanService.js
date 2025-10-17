import { Op } from 'sequelize';
import {
  projectGigManagementSequelize,
  ClientAccount,
  ClientKanbanColumn,
  ClientKanbanCard,
  ClientKanbanChecklistItem,
  CLIENT_ACCOUNT_HEALTH_STATUSES,
  CLIENT_ACCOUNT_STATUSES,
  CLIENT_ACCOUNT_TIERS,
  CLIENT_KANBAN_PRIORITIES,
  CLIENT_KANBAN_RISK_LEVELS,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsSynced = false;

async function ensureModelsSynced() {
  if (!modelsSynced) {
    await syncProjectGigManagementModels();
    modelsSynced = true;
  }
}

function normalizeNumber(value, { min = null, max = null } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Value must be a valid number.');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}.`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be less than or equal to ${max}.`);
  }
  return numeric;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Provide a valid date value.');
  }
  return parsed;
}

function normalizeEnum(value, options, label, fallback) {
  if (!value) {
    return fallback ?? options[0];
  }
  const normalised = String(value).toLowerCase();
  const match = options.find((option) => option.toLowerCase() === normalised);
  if (!match) {
    throw new ValidationError(`${label ?? 'Value'} must be one of: ${options.join(', ')}.`);
  }
  return match;
}

function normalizeTags(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    const tags = value
      .map((tag) => String(tag || '').trim())
      .filter(Boolean);
    return tags.length ? tags : null;
  }
  if (typeof value === 'string') {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    return tags.length ? tags : null;
  }
  return null;
}

function normalizeAttachments(value) {
  if (!value) {
    return null;
  }
  const toEntry = (entry) => {
    if (!entry) {
      return null;
    }
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) {
        return null;
      }
      return { label: trimmed, url: trimmed };
    }
    if (typeof entry === 'object') {
      const label = typeof entry.label === 'string' ? entry.label.trim() : '';
      const url = typeof entry.url === 'string' ? entry.url.trim() : '';
      if (!label && !url) {
        return null;
      }
      return { label: label || url, url: url || label };
    }
    return null;
  };

  const entries = Array.isArray(value) ? value : String(value).split('\n');
  const normalised = entries.map(toEntry).filter(Boolean);
  return normalised.length ? normalised : null;
}

function normalizeSlug(value) {
  if (!value) {
    return null;
  }
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 160);
}

function buildScope(ownerId, workspaceId) {
  if (!ownerId) {
    throw new ValidationError('Owner id is required.');
  }
  const scope = { ownerId };
  if (workspaceId != null) {
    scope.workspaceId = workspaceId;
  } else {
    scope.workspaceId = { [Op.is]: null };
  }
  return scope;
}

async function ensureColumn(ownerId, workspaceId, columnId, { transaction } = {}) {
  const scope = buildScope(ownerId, workspaceId);
  const column = await ClientKanbanColumn.findOne({
    where: { ...scope, id: columnId },
    transaction,
  });
  if (!column) {
    throw new NotFoundError('Column not found.');
  }
  return column;
}

async function ensureCard(ownerId, workspaceId, cardId, { transaction } = {}) {
  const scope = buildScope(ownerId, workspaceId);
  const card = await ClientKanbanCard.findOne({
    where: { ...scope, id: cardId },
    transaction,
  });
  if (!card) {
    throw new NotFoundError('Card not found.');
  }
  return card;
}

async function ensureClient(ownerId, workspaceId, clientId, { transaction } = {}) {
  const scope = buildScope(ownerId, workspaceId);
  const client = await ClientAccount.findOne({
    where: { ...scope, id: clientId },
    transaction,
  });
  if (!client) {
    throw new NotFoundError('Client not found.');
  }
  return client;
}

async function resolveClient(ownerId, workspaceId, payload = {}, { transaction } = {}) {
  if (payload.clientId) {
    return ensureClient(ownerId, workspaceId, payload.clientId, { transaction });
  }

  if (!payload.client || !payload.client.name) {
    return null;
  }

  const name = String(payload.client.name).trim();
  if (!name) {
    return null;
  }

  const scope = buildScope(ownerId, workspaceId);
  const [client] = await ClientAccount.findOrCreate({
    where: { ...scope, name },
    defaults: {
      ...scope,
      name,
      slug: normalizeSlug(name),
      websiteUrl: payload.client.websiteUrl ?? null,
      logoUrl: payload.client.logoUrl ?? null,
      industry: payload.client.industry ?? null,
      tier: payload.client.tier
        ? normalizeEnum(payload.client.tier, CLIENT_ACCOUNT_TIERS, 'Client tier', 'growth')
        : 'growth',
      status: payload.client.status
        ? normalizeEnum(payload.client.status, CLIENT_ACCOUNT_STATUSES, 'Client status', 'active')
        : 'active',
      healthStatus: payload.client.healthStatus
        ? normalizeEnum(
            payload.client.healthStatus,
            CLIENT_ACCOUNT_HEALTH_STATUSES,
            'Client health',
            'healthy',
          )
        : 'healthy',
      annualContractValue: normalizeNumber(payload.client.annualContractValue ?? null, { min: 0 }),
      timezone: payload.client.timezone ?? null,
      primaryContactName: payload.client.primaryContactName ?? null,
      primaryContactEmail: payload.client.primaryContactEmail ?? null,
      primaryContactPhone: payload.client.primaryContactPhone ?? null,
      accountManagerName: payload.client.accountManagerName ?? null,
      accountManagerEmail: payload.client.accountManagerEmail ?? null,
      lastInteractionAt: normalizeDate(payload.client.lastInteractionAt ?? null),
      nextReviewAt: normalizeDate(payload.client.nextReviewAt ?? null),
      tags: normalizeTags(payload.client.tags),
      notes: payload.client.notes ?? null,
      metadata: payload.client.metadata ?? null,
    },
    transaction,
  });

  const updates = {};
  if (payload.client.status) {
    updates.status = normalizeEnum(
      payload.client.status,
      CLIENT_ACCOUNT_STATUSES,
      'Client status',
      client.status,
    );
  }
  if (payload.client.tier) {
    updates.tier = normalizeEnum(payload.client.tier, CLIENT_ACCOUNT_TIERS, 'Client tier', client.tier);
  }
  if (payload.client.healthStatus) {
    updates.healthStatus = normalizeEnum(
      payload.client.healthStatus,
      CLIENT_ACCOUNT_HEALTH_STATUSES,
      'Client health',
      client.healthStatus,
    );
  }

  const directFields = [
    'websiteUrl',
    'logoUrl',
    'industry',
    'timezone',
    'primaryContactName',
    'primaryContactEmail',
    'primaryContactPhone',
    'accountManagerName',
    'accountManagerEmail',
    'notes',
  ];

  directFields.forEach((field) => {
    if (payload.client[field] != null) {
      updates[field] = payload.client[field];
    }
  });

  if (payload.client.tags != null) {
    updates.tags = normalizeTags(payload.client.tags);
  }

  if (payload.client.annualContractValue != null) {
    updates.annualContractValue = normalizeNumber(payload.client.annualContractValue, { min: 0 });
  }

  if (payload.client.lastInteractionAt != null) {
    updates.lastInteractionAt = normalizeDate(payload.client.lastInteractionAt);
  }

  if (payload.client.nextReviewAt != null) {
    updates.nextReviewAt = normalizeDate(payload.client.nextReviewAt);
  }

  if (Object.keys(updates).length) {
    await client.update(updates, { transaction });
  }

  return client;
}

async function nextSortOrder(model, where, transaction) {
  const maxSort = await model.max('sortOrder', { where, transaction });
  if (!Number.isFinite(maxSort)) {
    return 0;
  }
  return Number(maxSort) + 1;
}

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
}

function summarizeChecklist(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return { total: 0, completed: 0 };
  }
  const completed = items.filter((item) => item.completed).length;
  return { total: items.length, completed };
}

function aggregateMetrics(columns = []) {
  const allCards = columns.flatMap((column) => column.cards ?? []);
  const totalValue = allCards.reduce((total, card) => total + Number(card.valueAmount || 0), 0);
  const dueSoonThreshold = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const dueSoon = allCards.filter((card) => {
    if (!card.dueDate) {
      return false;
    }
    const due = new Date(card.dueDate).getTime();
    if (Number.isNaN(due)) {
      return false;
    }
    return due <= dueSoonThreshold;
  }).length;
  const atRisk = allCards.filter(
    (card) => card.riskLevel === 'high' || card.healthStatus === 'at_risk' || card.priority === 'critical',
  ).length;
  const nextMeetings = allCards
    .map((card) => ({ id: card.id, title: card.title, clientName: card.client?.name, at: card.nextInteractionAt }))
    .filter((item) => item.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, 8);
  const priorityBreakdown = CLIENT_KANBAN_PRIORITIES.map((priority) => ({
    priority,
    count: allCards.filter((card) => card.priority === priority).length,
  }));

  return {
    totalClients: new Set(allCards.map((card) => card.clientId).filter(Boolean)).size,
    totalActiveCards: allCards.length,
    pipelineValue: Number(totalValue.toFixed(2)),
    dueSoon,
    atRisk,
    nextMeetings,
    priorityBreakdown,
  };
}

async function fetchColumnsWithRelations(scope, { transaction } = {}) {
  const columns = await ClientKanbanColumn.findAll({
    where: scope,
    include: [
      {
        model: ClientKanbanCard,
        as: 'cards',
        where: { archivedAt: { [Op.is]: null } },
        required: false,
        include: [
          { model: ClientAccount, as: 'client' },
          { model: ClientKanbanChecklistItem, as: 'checklist' },
        ],
        order: [['sortOrder', 'ASC']],
      },
    ],
    order: [['sortOrder', 'ASC']],
    transaction,
  });

  return columns.map((column) => {
    const plain = toPlain(column);
    plain.cards = (plain.cards ?? [])
      .map((card) => {
        const checklistSummary = summarizeChecklist(card.checklist ?? []);
        return {
          ...card,
          checklistSummary,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return plain;
  });
}

export async function getClientKanban({ ownerId, workspaceId }) {
  await ensureModelsSynced();
  const scope = buildScope(ownerId, workspaceId);
  const [columns, clients] = await Promise.all([
    fetchColumnsWithRelations(scope),
    ClientAccount.findAll({
      where: scope,
      order: [['name', 'ASC']],
    }).then((records) => records.map(toPlain)),
  ]);

  const metrics = aggregateMetrics(columns);
  const columnSummary = columns.map((column) => ({
    id: column.id,
    name: column.name,
    totalCards: column.cards?.length ?? 0,
  }));

  return {
    columns,
    clients,
    metrics,
    columnSummary,
    meta: {
      workspaceId: workspaceId ?? null,
    },
  };
}

export async function createColumn(ownerId, workspaceId, payload = {}) {
  await ensureModelsSynced();
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw new ValidationError('Column name is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const scope = buildScope(ownerId, workspaceId);
    const sortOrder = await nextSortOrder(ClientKanbanColumn, scope, transaction);

    const column = await ClientKanbanColumn.create(
      {
        ...scope,
        name,
        slug: normalizeSlug(name),
        wipLimit: payload.wipLimit != null ? normalizeNumber(payload.wipLimit, { min: 0 }) : null,
        color: payload.color ? String(payload.color).trim().slice(0, 30) : null,
        sortOrder,
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );

    return toPlain(column);
  });
}

export async function updateColumn(ownerId, workspaceId, columnId, payload = {}) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const column = await ensureColumn(ownerId, workspaceId, columnId, { transaction });

    const updates = {};
    if (payload.name != null) {
      const name = String(payload.name).trim();
      if (!name) {
        throw new ValidationError('Column name cannot be empty.');
      }
      updates.name = name;
      updates.slug = normalizeSlug(name);
    }
    if (payload.wipLimit !== undefined) {
      updates.wipLimit = payload.wipLimit == null ? null : normalizeNumber(payload.wipLimit, { min: 0 });
    }
    if (payload.color !== undefined) {
      updates.color = payload.color ? String(payload.color).trim().slice(0, 30) : null;
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata;
    }

    if (Object.keys(updates).length) {
      await column.update(updates, { transaction });
    }

    return toPlain(column);
  });
}

export async function deleteColumn(ownerId, workspaceId, columnId) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const column = await ensureColumn(ownerId, workspaceId, columnId, { transaction });
    const cardCount = await ClientKanbanCard.count({
      where: { ownerId, columnId: column.id, workspaceId: workspaceId ?? null, archivedAt: { [Op.is]: null } },
      transaction,
    });
    if (cardCount > 0) {
      throw new ValidationError('Move or archive all cards before deleting a column.');
    }
    await column.destroy({ transaction });
  });
}

function buildCardUpdates(payload) {
  const updates = {};
  if (payload.title != null) {
    const title = String(payload.title).trim();
    if (!title) {
      throw new ValidationError('Card title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.projectName !== undefined) {
    updates.projectName = payload.projectName ? String(payload.projectName).trim() : null;
  }
  if (payload.summary !== undefined) {
    updates.summary = payload.summary ? String(payload.summary).trim() : null;
  }
  if (payload.priority !== undefined) {
    updates.priority = normalizeEnum(payload.priority, CLIENT_KANBAN_PRIORITIES, 'Priority', 'medium');
  }
  if (payload.riskLevel !== undefined) {
    updates.riskLevel = normalizeEnum(payload.riskLevel, CLIENT_KANBAN_RISK_LEVELS, 'Risk level', 'low');
  }
  if (payload.valueCurrency !== undefined) {
    updates.valueCurrency = payload.valueCurrency ? String(payload.valueCurrency).trim().slice(0, 6) : 'USD';
  }
  if (payload.valueAmount !== undefined) {
    updates.valueAmount = payload.valueAmount == null ? null : normalizeNumber(payload.valueAmount, { min: 0 });
  }
  if (payload.potentialMonthlyValue !== undefined) {
    updates.potentialMonthlyValue =
      payload.potentialMonthlyValue == null ? null : normalizeNumber(payload.potentialMonthlyValue, { min: 0 });
  }
  if (payload.contactName !== undefined) {
    updates.contactName = payload.contactName ? String(payload.contactName).trim() : null;
  }
  if (payload.contactEmail !== undefined) {
    updates.contactEmail = payload.contactEmail ? String(payload.contactEmail).trim() : null;
  }
  if (payload.ownerName !== undefined) {
    updates.ownerName = payload.ownerName ? String(payload.ownerName).trim() : null;
  }
  if (payload.ownerEmail !== undefined) {
    updates.ownerEmail = payload.ownerEmail ? String(payload.ownerEmail).trim() : null;
  }
  if (payload.healthStatus !== undefined) {
    updates.healthStatus = normalizeEnum(
      payload.healthStatus,
      CLIENT_ACCOUNT_HEALTH_STATUSES,
      'Health status',
      'healthy',
    );
  }
  if (payload.startDate !== undefined) {
    updates.startDate = payload.startDate == null ? null : normalizeDate(payload.startDate);
  }
  if (payload.dueDate !== undefined) {
    updates.dueDate = payload.dueDate == null ? null : normalizeDate(payload.dueDate);
  }
  if (payload.lastInteractionAt !== undefined) {
    updates.lastInteractionAt = payload.lastInteractionAt == null ? null : normalizeDate(payload.lastInteractionAt);
  }
  if (payload.nextInteractionAt !== undefined) {
    updates.nextInteractionAt = payload.nextInteractionAt == null ? null : normalizeDate(payload.nextInteractionAt);
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }
  if (payload.attachments !== undefined) {
    updates.attachments = normalizeAttachments(payload.attachments);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata;
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes ?? null;
  }
  if (payload.checklistSummary !== undefined) {
    updates.checklistSummary = payload.checklistSummary;
  }
  if (payload.updatedById !== undefined) {
    updates.updatedById = payload.updatedById;
  }
  return updates;
}

export async function createCard(ownerId, workspaceId, payload = {}) {
  await ensureModelsSynced();
  if (!payload.columnId) {
    throw new ValidationError('Column id is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const column = await ensureColumn(ownerId, workspaceId, payload.columnId, { transaction });
    const client = await resolveClient(ownerId, workspaceId, payload, { transaction });
    const scope = buildScope(ownerId, workspaceId);
    const sortOrder = await nextSortOrder(
      ClientKanbanCard,
      { ...scope, columnId: column.id, archivedAt: { [Op.is]: null } },
      transaction,
    );

    const titleSource = payload.title || payload.projectName || client?.name;
    if (!titleSource) {
      throw new ValidationError('Provide a title or project name for the card.');
    }

    const card = await ClientKanbanCard.create(
      {
        ...scope,
        columnId: column.id,
        clientId: client?.id ?? payload.clientId ?? null,
        title: String(titleSource).trim(),
        sortOrder,
        createdById: payload.actorId ?? ownerId,
        updatedById: payload.actorId ?? ownerId,
        ...buildCardUpdates(payload),
      },
      { transaction },
    );

    if (Array.isArray(payload.checklist) && payload.checklist.length) {
      const checklistPayloads = payload.checklist.map((item, index) => ({
        cardId: card.id,
        ownerId,
        workspaceId: workspaceId ?? null,
        title: item.title ? String(item.title).trim() : `Checklist item ${index + 1}`,
        completed: Boolean(item.completed),
        sortOrder: index,
        dueDate: item.dueDate ? normalizeDate(item.dueDate) : null,
        metadata: item.metadata ?? null,
      }));
      await ClientKanbanChecklistItem.bulkCreate(checklistPayloads, { transaction });
    }

    return toPlain(await ensureCard(ownerId, workspaceId, card.id, { transaction }));
  });
}

export async function updateCard(ownerId, workspaceId, cardId, payload = {}) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const card = await ensureCard(ownerId, workspaceId, cardId, { transaction });

    if (payload.columnId && payload.columnId !== card.columnId) {
      await ensureColumn(ownerId, workspaceId, payload.columnId, { transaction });
      card.columnId = payload.columnId;
    }

    if (payload.clientId || payload.client) {
      const client = await resolveClient(ownerId, workspaceId, payload, { transaction });
      card.clientId = client?.id ?? payload.clientId ?? null;
    }

    const updates = buildCardUpdates(payload);
    if (payload.actorId != null) {
      updates.updatedById = payload.actorId;
    }
    if (Object.keys(updates).length) {
      await card.update(updates, { transaction });
    }

    if (Array.isArray(payload.checklist)) {
      const existingItems = await ClientKanbanChecklistItem.findAll({
        where: { cardId: card.id },
        order: [['sortOrder', 'ASC']],
        transaction,
      });

      const seenIds = new Set();
      await Promise.all(
        payload.checklist.map(async (item, index) => {
          if (item.id) {
            const existing = existingItems.find((candidate) => candidate.id === item.id);
            if (existing) {
              seenIds.add(existing.id);
              await existing.update(
                {
                  title: item.title ? String(item.title).trim() : existing.title,
                  completed: Boolean(item.completed),
                  sortOrder: index,
                  dueDate: item.dueDate ? normalizeDate(item.dueDate) : null,
                  metadata: item.metadata ?? existing.metadata,
                },
                { transaction },
              );
              return;
            }
          }

          await ClientKanbanChecklistItem.create(
            {
              cardId: card.id,
              ownerId,
              workspaceId: workspaceId ?? null,
              title: item.title ? String(item.title).trim() : `Checklist item ${index + 1}`,
              completed: Boolean(item.completed),
              sortOrder: index,
              dueDate: item.dueDate ? normalizeDate(item.dueDate) : null,
              metadata: item.metadata ?? null,
            },
            { transaction },
          );
        }),
      );

      const itemsToRemove = existingItems.filter((item) => !seenIds.has(item.id));
      if (itemsToRemove.length) {
        await ClientKanbanChecklistItem.destroy({
          where: { id: itemsToRemove.map((item) => item.id) },
          transaction,
        });
      }
    }

    return toPlain(await ensureCard(ownerId, workspaceId, card.id, { transaction }));
  });
}

async function resequenceColumn(ownerId, workspaceId, columnId, { transaction } = {}) {
  const scope = buildScope(ownerId, workspaceId);
  const cards = await ClientKanbanCard.findAll({
    where: { ...scope, columnId, archivedAt: { [Op.is]: null } },
    order: [['sortOrder', 'ASC'], ['updatedAt', 'ASC']],
    transaction,
  });
  await Promise.all(
    cards.map((card, index) => {
      if (card.sortOrder === index) {
        return null;
      }
      return card.update({ sortOrder: index }, { transaction });
    }),
  );
}

export async function moveCard(ownerId, workspaceId, cardId, payload = {}) {
  await ensureModelsSynced();
  if (!payload.columnId) {
    throw new ValidationError('Target column id is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const card = await ensureCard(ownerId, workspaceId, cardId, { transaction });
    const targetColumn = await ensureColumn(ownerId, workspaceId, payload.columnId, { transaction });

    card.columnId = targetColumn.id;
    card.sortOrder = Number.isInteger(payload.position) ? payload.position : card.sortOrder;
    if (payload.updatedById != null) {
      card.updatedById = payload.updatedById;
    }
    await card.save({ transaction });

    await resequenceColumn(ownerId, workspaceId, targetColumn.id, { transaction });
    return toPlain(await ensureCard(ownerId, workspaceId, card.id, { transaction }));
  });
}

export async function deleteCard(ownerId, workspaceId, cardId) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const card = await ensureCard(ownerId, workspaceId, cardId, { transaction });
    await card.destroy({ transaction });
  });
}

export async function createChecklistItem(ownerId, workspaceId, cardId, payload = {}) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    await ensureCard(ownerId, workspaceId, cardId, { transaction });
    const sortOrder = await nextSortOrder(
      ClientKanbanChecklistItem,
      { cardId, ownerId, workspaceId: workspaceId ?? null },
      transaction,
    );
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('Checklist item title is required.');
    }
    const item = await ClientKanbanChecklistItem.create(
      {
        cardId,
        ownerId,
        workspaceId: workspaceId ?? null,
        title,
        completed: Boolean(payload.completed),
        sortOrder,
        dueDate: payload.dueDate ? normalizeDate(payload.dueDate) : null,
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    return toPlain(item);
  });
}

export async function updateChecklistItem(ownerId, workspaceId, cardId, itemId, payload = {}) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    await ensureCard(ownerId, workspaceId, cardId, { transaction });
    const item = await ClientKanbanChecklistItem.findOne({
      where: { id: itemId, cardId, ownerId, workspaceId: workspaceId ?? null },
      transaction,
    });
    if (!item) {
      throw new NotFoundError('Checklist item not found.');
    }
    const updates = {};
    if (payload.title != null) {
      const title = String(payload.title).trim();
      if (!title) {
        throw new ValidationError('Checklist title cannot be empty.');
      }
      updates.title = title;
    }
    if (payload.completed !== undefined) {
      updates.completed = Boolean(payload.completed);
    }
    if (payload.dueDate !== undefined) {
      updates.dueDate = payload.dueDate == null ? null : normalizeDate(payload.dueDate);
    }
    if (payload.sortOrder !== undefined) {
      updates.sortOrder = Number.isFinite(payload.sortOrder) ? Number(payload.sortOrder) : item.sortOrder;
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata;
    }
    if (Object.keys(updates).length) {
      await item.update(updates, { transaction });
    }
    return toPlain(item);
  });
}

export async function deleteChecklistItem(ownerId, workspaceId, cardId, itemId) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    await ensureCard(ownerId, workspaceId, cardId, { transaction });
    const deleted = await ClientKanbanChecklistItem.destroy({
      where: { id: itemId, cardId, ownerId, workspaceId: workspaceId ?? null },
      transaction,
    });
    if (!deleted) {
      throw new NotFoundError('Checklist item not found.');
    }
  });
}

export async function createClient(ownerId, workspaceId, payload = {}) {
  await ensureModelsSynced();
  if (!payload.name) {
    throw new ValidationError('Client name is required.');
  }
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const client = await resolveClient(ownerId, workspaceId, { client: payload }, { transaction });
    return toPlain(client);
  });
}

export async function updateClient(ownerId, workspaceId, clientId, payload = {}) {
  await ensureModelsSynced();
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const client = await ensureClient(ownerId, workspaceId, clientId, { transaction });
    const updates = {};
    if (payload.name != null) {
      const name = String(payload.name).trim();
      if (!name) {
        throw new ValidationError('Client name cannot be empty.');
      }
      updates.name = name;
      updates.slug = normalizeSlug(name);
    }
    if (payload.status != null) {
      updates.status = normalizeEnum(payload.status, CLIENT_ACCOUNT_STATUSES, 'Client status', client.status);
    }
    if (payload.tier != null) {
      updates.tier = normalizeEnum(payload.tier, CLIENT_ACCOUNT_TIERS, 'Client tier', client.tier);
    }
    if (payload.healthStatus != null) {
      updates.healthStatus = normalizeEnum(
        payload.healthStatus,
        CLIENT_ACCOUNT_HEALTH_STATUSES,
        'Client health',
        client.healthStatus,
      );
    }
    const directFields = [
      'websiteUrl',
      'logoUrl',
      'industry',
      'timezone',
      'primaryContactName',
      'primaryContactEmail',
      'primaryContactPhone',
      'accountManagerName',
      'accountManagerEmail',
      'notes',
    ];
    directFields.forEach((field) => {
      if (payload[field] !== undefined) {
        updates[field] = payload[field] ?? null;
      }
    });
    if (payload.tags !== undefined) {
      updates.tags = normalizeTags(payload.tags);
    }
    if (payload.annualContractValue !== undefined) {
      updates.annualContractValue =
        payload.annualContractValue == null ? null : normalizeNumber(payload.annualContractValue, { min: 0 });
    }
    if (payload.lastInteractionAt !== undefined) {
      updates.lastInteractionAt = payload.lastInteractionAt == null ? null : normalizeDate(payload.lastInteractionAt);
    }
    if (payload.nextReviewAt !== undefined) {
      updates.nextReviewAt = payload.nextReviewAt == null ? null : normalizeDate(payload.nextReviewAt);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata;
    }

    if (Object.keys(updates).length) {
      await client.update(updates, { transaction });
    }
    return toPlain(client);
  });
}

export default {
  getClientKanban,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClient,
  updateClient,
};

