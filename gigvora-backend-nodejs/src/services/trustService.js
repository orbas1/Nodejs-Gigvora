import { Op } from 'sequelize';
import {
  sequelize,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  DisputeWorkflowSetting,
  DisputeTemplate,
  User,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_TRANSACTION_TYPES,
  ESCROW_TRANSACTION_STATUSES,
  DISPUTE_STATUSES,
  DISPUTE_STAGES,
  DISPUTE_PRIORITIES,
  DISPUTE_REASON_CODES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import r2Client from '../utils/r2Client.js';

const USER_SAFE_ATTRIBUTES = ['id', 'firstName', 'lastName', 'email', 'userType'];

function withTransaction(externalTransaction, handler) {
  if (externalTransaction) {
    return handler(externalTransaction);
  }
  return sequelize.transaction(handler);
}

function normaliseAmount(value) {
  const amount = Number.parseFloat(value ?? 0);
  if (Number.isNaN(amount)) {
    throw new ValidationError('Invalid monetary amount supplied');
  }
  return Number.parseFloat(amount.toFixed(4));
}

function buildAuditTrail(existingTrail, entry) {
  const trail = Array.isArray(existingTrail) ? [...existingTrail] : [];
  trail.push({ ...entry, at: new Date().toISOString() });
  return trail;
}

function normaliseInteger(value, { min, max, fallback }) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function normaliseOptionalInteger(value, { min, max }) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function normaliseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry == null ? '' : `${entry}`.trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
function coerceInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toDisputeCaseDto(caseRecord) {
  if (!caseRecord) {
    return null;
  }
  const dispute = caseRecord.toPublicObject();
  if (caseRecord.transaction?.toPublicObject) {
    dispute.transaction = caseRecord.transaction.toPublicObject();
  }
  if (Array.isArray(caseRecord.events)) {
    dispute.events = caseRecord.events.map((event) => event.toPublicObject());
  }
  return dispute;
}

function aggregateCountRows(rows, key) {
  const aggregate = {};
  for (const row of rows ?? []) {
    const label = row?.get ? row.get(key) : row?.[key];
    if (!label) {
      continue;
    }
    const countRaw = row?.get ? row.get('count') : row?.count;
    const count = Number.parseInt(countRaw, 10);
    aggregate[label] = Number.isNaN(count) ? 0 : count;
  }
  return aggregate;
}

function normaliseChecklist(value) {
  return normaliseList(value);
}

function escapeLikeTerm(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function buildTransactionInclude({ attributes, required = false } = {}) {
  return {
    model: EscrowTransaction,
    as: 'transaction',
    required,
    attributes:
      attributes ?? ['id', 'reference', 'amount', 'currencyCode', 'status', 'scheduledReleaseAt'],
  };
}

function buildEventInclude(limit = 5) {
  return {
    model: DisputeEvent,
    as: 'events',
    separate: true,
    limit,
    order: [['eventAt', 'DESC']],
    attributes: ['id', 'actorId', 'actorType', 'actionType', 'notes', 'eventAt', 'evidenceFileName', 'evidenceUrl'],
  };
}

const DEFAULT_WORKFLOW_SETTINGS = Object.freeze({
  responseSlaHours: 24,
  resolutionSlaHours: 120,
  autoEscalateHours: 48,
  autoCloseHours: 72,
  evidenceRequirements: [],
  notificationEmails: [],
  defaultAssigneeId: null,
});
function buildWhereFromConditions(conditions = []) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { [Op.and]: conditions };
}

function normaliseDateInput(value) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ValidationError('Invalid date supplied');
    }
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date supplied');
  }
  return date;
}

function formatUserRecord(record) {
  if (!record) {
    return null;
  }

  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  if (!plain || typeof plain !== 'object') {
    return null;
  }

  const firstName = plain.firstName ?? null;
  const lastName = plain.lastName ?? null;
  const derivedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: plain.id ?? null,
    firstName,
    lastName,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
    name: plain.name ?? (derivedName || plain.email || null),
  };
}

function formatDisputeEventRecord(record) {
  if (!record) {
    return null;
  }

  const base = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record;
  const actorInstance = record.get?.('actor') ?? record.actor ?? null;
  const actor = formatUserRecord(actorInstance);

  return {
    ...base,
    actor,
  };
}

function formatDisputeRecord(record, { includeEvents = false } = {}) {
  if (!record) {
    return null;
  }

  const base = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record;
  const transactionInstance = record.get?.('transaction') ?? record.transaction ?? null;
  const openedByInstance = record.get?.('openedBy') ?? record.openedBy ?? null;
  const assignedToInstance = record.get?.('assignedTo') ?? record.assignedTo ?? null;

  let transaction = null;
  if (transactionInstance) {
    transaction =
      typeof transactionInstance.toPublicObject === 'function'
        ? transactionInstance.toPublicObject()
        : transactionInstance;

    const accountInstance = transactionInstance.get?.('account') ?? transactionInstance.account ?? null;
    if (accountInstance) {
      transaction.account =
        typeof accountInstance.toPublicObject === 'function'
          ? accountInstance.toPublicObject()
          : accountInstance;
    }

    const initiatorInstance = transactionInstance.get?.('initiator') ?? transactionInstance.initiator ?? null;
    if (initiatorInstance) {
      transaction.initiator = formatUserRecord(initiatorInstance);
    }

    const counterpartyInstance = transactionInstance.get?.('counterparty') ?? transactionInstance.counterparty ?? null;
    if (counterpartyInstance) {
      transaction.counterparty = formatUserRecord(counterpartyInstance);
    }
  }

  const openedBy = formatUserRecord(openedByInstance);
  const assignedTo = formatUserRecord(assignedToInstance);

  let events = undefined;
  if (includeEvents) {
    const eventRecords = Array.isArray(record.events) ? record.events : [];
    events = eventRecords.map((eventRecord) => formatDisputeEventRecord(eventRecord));
  }

  return {
    ...base,
    transaction,
    openedBy,
    assignedTo,
    events,
  };
}

async function fetchGroupedCounts(groupKey, baseWhere, include = []) {
  if (!groupKey) {
    return {};
  }

  const rows = await DisputeCase.findAll({
    where: baseWhere,
    include,
    attributes: [
      [sequelize.col(`DisputeCase.${groupKey}`), groupKey],
      [sequelize.fn('COUNT', sequelize.col('DisputeCase.id')), 'count'],
    ],
    group: [sequelize.col(`DisputeCase.${groupKey}`)],
    raw: true,
  });

  const summary = {};
  rows.forEach((row) => {
    const bucket = row[groupKey];
    if (bucket == null) {
      return;
    }
    const value = Number.parseInt(row.count, 10);
    summary[bucket] = Number.isNaN(value) ? 0 : value;
  });

  return summary;
}

function buildDisputeInclude({ transactionFilters = [], includeEvents = false } = {}) {
  const include = [
    {
      model: EscrowTransaction,
      as: 'transaction',
      include: [
        { model: EscrowAccount, as: 'account' },
        { model: User, as: 'initiator', attributes: USER_SAFE_ATTRIBUTES },
        { model: User, as: 'counterparty', attributes: USER_SAFE_ATTRIBUTES },
      ],
      required: Boolean(transactionFilters.length),
    },
    { model: User, as: 'openedBy', attributes: USER_SAFE_ATTRIBUTES },
    { model: User, as: 'assignedTo', attributes: USER_SAFE_ATTRIBUTES },
  ];

  if (transactionFilters.length) {
    include[0].where = { [Op.or]: transactionFilters };
  }

  if (includeEvents) {
    include.push({
      model: DisputeEvent,
      as: 'events',
      include: [{ model: User, as: 'actor', attributes: USER_SAFE_ATTRIBUTES }],
      separate: true,
      order: [['eventAt', 'ASC']],
    });
  }

  return include;
}

export async function ensureEscrowAccount({ userId, provider, currencyCode = 'USD', metadata }) {
  if (!userId || !provider) {
    throw new ValidationError('userId and provider are required to create an escrow account');
  }

  const [account] = await EscrowAccount.findOrCreate({
    where: { userId, provider },
    defaults: {
      currencyCode,
      status: 'pending',
      metadata: metadata ?? null,
    },
  });

  if (currencyCode && account.currencyCode !== currencyCode) {
    await account.update({ currencyCode });
  }

  return account.toPublicObject();
}

export async function updateEscrowAccount(accountId, payload = {}) {
  const id = Number.parseInt(accountId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid accountId is required to update an escrow account');
  }

  const account = await EscrowAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Escrow account not found');
  }

  const updates = {};

  if (payload.status) {
    if (!ESCROW_ACCOUNT_STATUSES.includes(payload.status)) {
      throw new ValidationError(`Status must be one of: ${ESCROW_ACCOUNT_STATUSES.join(', ')}`);
    }
    updates.status = payload.status;
  }

  if (payload.currencyCode) {
    updates.currencyCode = payload.currencyCode;
  }

  if (payload.externalId !== undefined) {
    updates.externalId = payload.externalId || null;
  }

  if (payload.walletAccountId !== undefined) {
    updates.walletAccountId = payload.walletAccountId || null;
  }

  if (payload.lastReconciledAt !== undefined) {
    if (payload.lastReconciledAt === null || payload.lastReconciledAt === '') {
      updates.lastReconciledAt = null;
    } else {
      const reconciledAt = new Date(payload.lastReconciledAt);
      if (Number.isNaN(reconciledAt.getTime())) {
        throw new ValidationError('Invalid reconciliation timestamp supplied');
      }
      updates.lastReconciledAt = reconciledAt;
    }
  }

  if (payload.metadata !== undefined) {
    if (payload.metadata == null || typeof payload.metadata === 'object') {
      updates.metadata = payload.metadata ?? null;
    } else {
      throw new ValidationError('Metadata must be an object when updating escrow accounts');
    }
  }

  if (Object.keys(updates).length === 0) {
    return account.toPublicObject();
  }

  await account.update(updates);
  return account.toPublicObject();
}

async function loadTransactionWithAccount(transactionId, trx) {
  const transactionRecord = await EscrowTransaction.findByPk(transactionId, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });

  if (!transactionRecord) {
    throw new NotFoundError('Escrow transaction not found');
  }

  const account = await EscrowAccount.findByPk(transactionRecord.accountId, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });

  if (!account) {
    throw new NotFoundError('Escrow account not found for transaction');
  }

  return { transactionRecord, account };
}

export async function initiateEscrowTransaction(payload, { transaction: externalTransaction } = {}) {
  const {
    accountId,
    reference,
    amount,
    currencyCode,
    feeAmount = 0,
    type = 'project',
    initiatedById,
    counterpartyId,
    projectId,
    gigId,
    milestoneLabel,
    scheduledReleaseAt,
    metadata,
  } = payload;

  if (!accountId || !reference || !initiatedById) {
    throw new ValidationError('accountId, reference, and initiatedById are required');
  }

  if (!amount || Number.parseFloat(amount) <= 0) {
    throw new ValidationError('Escrow transactions must specify a positive amount');
  }

  return withTransaction(externalTransaction, async (trx) => {
    const account = await EscrowAccount.findByPk(accountId, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!account) {
      throw new NotFoundError('Escrow account not found');
    }

    if (account.status === 'closed') {
      throw new ValidationError('Escrow account is closed and cannot accept new transactions');
    }

    if (!ESCROW_ACCOUNT_STATUSES.includes(account.status)) {
      throw new ValidationError('Escrow account is in an unknown status');
    }

    const existing = await EscrowTransaction.findOne({
      where: { reference },
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (existing) {
      throw new ConflictError('An escrow transaction with this reference already exists');
    }

    const gross = normaliseAmount(amount);
    const fee = Math.max(0, normaliseAmount(feeAmount));
    if (fee > gross) {
      throw new ValidationError('Fee amount cannot exceed the gross escrow amount');
    }

    if (!ESCROW_TRANSACTION_TYPES.includes(type)) {
      throw new ValidationError(`Escrow transaction type must be one of: ${ESCROW_TRANSACTION_TYPES.join(', ')}`);
    }

    const net = normaliseAmount(gross - fee);
    const transactionRecord = await EscrowTransaction.create(
      {
        accountId,
        reference,
        amount: gross,
        feeAmount: fee,
        netAmount: net,
        currencyCode: currencyCode || account.currencyCode,
        type,
        initiatedById,
        counterpartyId: counterpartyId ?? null,
        projectId: projectId ?? null,
        gigId: gigId ?? null,
        milestoneLabel: milestoneLabel ?? null,
        scheduledReleaseAt: scheduledReleaseAt ?? null,
        status: 'in_escrow',
        metadata: metadata ?? null,
        auditTrail: buildAuditTrail(null, {
          action: 'initiated',
          actorId: initiatedById,
          amount: gross,
          fee,
          net,
        }),
      },
      { transaction: trx },
    );

    const currentBalance = normaliseAmount(Number.parseFloat(account.currentBalance ?? 0) + gross);
    const pendingRelease = normaliseAmount(Number.parseFloat(account.pendingReleaseTotal ?? 0) + net);

    await account.update(
      {
        status: account.status === 'pending' ? 'active' : account.status,
        currencyCode: currencyCode || account.currencyCode,
        currentBalance,
        pendingReleaseTotal: pendingRelease,
        lastReconciledAt: new Date(),
      },
      { transaction: trx },
    );

    return transactionRecord.toPublicObject();
  });
}

export async function updateEscrowTransaction(
  transactionId,
  payload = {},
  { transaction: externalTransaction } = {},
) {
  const id = Number.parseInt(transactionId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid transactionId is required to update an escrow transaction');
  }

  return withTransaction(externalTransaction, async (trx) => {
    const transactionRecord = await EscrowTransaction.findByPk(id, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!transactionRecord) {
      throw new NotFoundError('Escrow transaction not found');
    }

    const updates = {};

    if (payload.reference && payload.reference !== transactionRecord.reference) {
      const existing = await EscrowTransaction.findOne({
        where: { reference: payload.reference },
        transaction: trx,
        lock: trx?.LOCK?.UPDATE,
      });

      if (existing) {
        throw new ConflictError('Another escrow transaction already uses this reference');
      }

      updates.reference = payload.reference;
    }

    if (payload.status) {
      if (!ESCROW_TRANSACTION_STATUSES.includes(payload.status)) {
        throw new ValidationError(
          `Status must be one of: ${ESCROW_TRANSACTION_STATUSES.join(', ')}`,
        );
      }
      updates.status = payload.status;

      if (payload.status === 'released' && !transactionRecord.releasedAt) {
        const releasedAt = payload.releasedAt ? new Date(payload.releasedAt) : new Date();
        if (Number.isNaN(releasedAt.getTime())) {
          throw new ValidationError('releasedAt must be a valid datetime');
        }
        updates.releasedAt = releasedAt;
      }

      if (payload.status === 'refunded' && !transactionRecord.refundedAt) {
        const refundedAt = payload.refundedAt ? new Date(payload.refundedAt) : new Date();
        if (Number.isNaN(refundedAt.getTime())) {
          throw new ValidationError('refundedAt must be a valid datetime');
        }
        updates.refundedAt = refundedAt;
      }

      if (payload.status === 'cancelled' && !transactionRecord.cancelledAt) {
        updates.cancelledAt = new Date();
      }
    }

    if (payload.milestoneLabel !== undefined) {
      updates.milestoneLabel = payload.milestoneLabel || null;
    }

    if (payload.scheduledReleaseAt !== undefined) {
      if (payload.scheduledReleaseAt === null || payload.scheduledReleaseAt === '') {
        updates.scheduledReleaseAt = null;
      } else {
        const scheduledAt = new Date(payload.scheduledReleaseAt);
        if (Number.isNaN(scheduledAt.getTime())) {
          throw new ValidationError('scheduledReleaseAt must be a valid datetime');
        }
        updates.scheduledReleaseAt = scheduledAt;
      }
    }

    if (payload.metadata !== undefined) {
      if (payload.metadata == null || typeof payload.metadata === 'object') {
        updates.metadata = payload.metadata ?? null;
      } else {
        throw new ValidationError('Metadata must be an object when updating transactions');
      }
    }

    const amountUpdated = payload.amount !== undefined;
    const feeUpdated = payload.feeAmount !== undefined;

    if (amountUpdated) {
      const amount = normaliseAmount(payload.amount);
      if (amount <= 0) {
        throw new ValidationError('Escrow amount must be greater than zero');
      }
      updates.amount = amount;
    }

    if (feeUpdated) {
      const fee = normaliseAmount(payload.feeAmount);
      if (fee < 0) {
        throw new ValidationError('Fee amount cannot be negative');
      }
      updates.feeAmount = fee;
    }

    if (amountUpdated || feeUpdated) {
      const gross = amountUpdated ? updates.amount : normaliseAmount(transactionRecord.amount);
      const fee = feeUpdated ? updates.feeAmount : normaliseAmount(transactionRecord.feeAmount ?? 0);
      if (fee > gross) {
        throw new ValidationError('Fee amount cannot exceed the escrow amount');
      }
      updates.netAmount = Number.parseFloat((gross - fee).toFixed(4));
    } else if (payload.netAmount !== undefined) {
      const net = normaliseAmount(payload.netAmount);
      updates.netAmount = net;
    }

    if (Object.keys(updates).length === 0) {
      return transactionRecord.toPublicObject();
    }

    updates.auditTrail = buildAuditTrail(transactionRecord.auditTrail, {
      type: 'update',
      actorId: payload.actorId ?? null,
      metadata: { fields: Object.keys(updates) },
    });

    await transactionRecord.update(updates, { transaction: trx });
    return transactionRecord.toPublicObject();
  });
}

export async function releaseEscrowTransaction(transactionId, payload = {}, options = {}) {
  const { actorId = null, notes, metadata } = payload;
  return withTransaction(options.transaction, async (trx) => {
    const { transactionRecord, account } = await loadTransactionWithAccount(transactionId, trx);

    if (!ESCROW_TRANSACTION_STATUSES.includes(transactionRecord.status)) {
      throw new ValidationError('Escrow transaction is in an unknown status');
    }

    if (!['in_escrow', 'funded', 'disputed'].includes(transactionRecord.status)) {
      throw new ValidationError('Only in-progress escrow transactions can be released');
    }

    const currentBalance = normaliseAmount(
      Number.parseFloat(account.currentBalance ?? 0) - Number.parseFloat(transactionRecord.amount ?? 0),
    );
    const pendingRelease = normaliseAmount(
      Number.parseFloat(account.pendingReleaseTotal ?? 0) -
        Number.parseFloat(transactionRecord.netAmount ?? transactionRecord.amount ?? 0),
    );

    await transactionRecord.update(
      {
        status: 'released',
        releasedAt: new Date(),
        auditTrail: buildAuditTrail(transactionRecord.auditTrail, {
          action: 'released',
          actorId,
          notes,
          metadata,
        }),
      },
      { transaction: trx },
    );

    await account.update(
      {
        currentBalance: Math.max(currentBalance, 0),
        pendingReleaseTotal: Math.max(pendingRelease, 0),
        lastReconciledAt: new Date(),
      },
      { transaction: trx },
    );

    return transactionRecord.toPublicObject();
  });
}

export async function refundEscrowTransaction(transactionId, payload = {}, options = {}) {
  const { actorId = null, notes, metadata } = payload;
  return withTransaction(options.transaction, async (trx) => {
    const { transactionRecord, account } = await loadTransactionWithAccount(transactionId, trx);

    if (!ESCROW_TRANSACTION_STATUSES.includes(transactionRecord.status)) {
      throw new ValidationError('Escrow transaction is in an unknown status');
    }

    if (!['in_escrow', 'funded', 'disputed'].includes(transactionRecord.status)) {
      throw new ValidationError('Only active escrow transactions can be refunded');
    }

    const currentBalance = normaliseAmount(
      Number.parseFloat(account.currentBalance ?? 0) - Number.parseFloat(transactionRecord.amount ?? 0),
    );
    const pendingRelease = normaliseAmount(
      Number.parseFloat(account.pendingReleaseTotal ?? 0) -
        Number.parseFloat(transactionRecord.netAmount ?? transactionRecord.amount ?? 0),
    );

    await transactionRecord.update(
      {
        status: 'refunded',
        refundedAt: new Date(),
        auditTrail: buildAuditTrail(transactionRecord.auditTrail, {
          action: 'refunded',
          actorId,
          notes,
          metadata,
        }),
      },
      { transaction: trx },
    );

    await account.update(
      {
        currentBalance: Math.max(currentBalance, 0),
        pendingReleaseTotal: Math.max(pendingRelease, 0),
        lastReconciledAt: new Date(),
      },
      { transaction: trx },
    );

    return transactionRecord.toPublicObject();
  });
}

export async function createDisputeCase(payload, options = {}) {
  const {
    escrowTransactionId,
    openedById,
    assignedToId = null,
    priority = 'medium',
    reasonCode,
    summary,
    customerDeadlineAt,
    providerDeadlineAt,
    metadata,
  } = payload;

  if (!escrowTransactionId || !openedById || !reasonCode || !summary) {
    throw new ValidationError('escrowTransactionId, openedById, reasonCode, and summary are required');
  }

  if (!DISPUTE_PRIORITIES.includes(priority)) {
    throw new ValidationError(`priority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
  }

  if (!DISPUTE_REASON_CODES.includes(reasonCode)) {
    throw new ValidationError(`reasonCode must be one of: ${DISPUTE_REASON_CODES.join(', ')}`);
  }

  return withTransaction(options.transaction, async (trx) => {
    const { transactionRecord } = await loadTransactionWithAccount(escrowTransactionId, trx);

    const existing = await DisputeCase.findOne({
      where: {
        escrowTransactionId,
        status: ['open', 'awaiting_customer', 'under_review'],
      },
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (existing) {
      throw new ConflictError('A dispute is already active for this escrow transaction');
    }

    const dispute = await DisputeCase.create(
      {
        escrowTransactionId,
        openedById,
        assignedToId,
        priority,
        reasonCode,
        summary,
        customerDeadlineAt: customerDeadlineAt ?? null,
        providerDeadlineAt: providerDeadlineAt ?? null,
        metadata: metadata ?? null,
        stage: 'intake',
        status: 'open',
      },
      { transaction: trx },
    );

    await transactionRecord.update(
      {
        status: 'disputed',
        auditTrail: buildAuditTrail(transactionRecord.auditTrail, {
          action: 'dispute_opened',
          actorId: openedById,
          reasonCode,
        }),
      },
      { transaction: trx },
    );

    await DisputeEvent.create(
      {
        disputeCaseId: dispute.id,
        actorId: openedById,
        actorType: 'customer',
        actionType: 'comment',
        notes: summary,
        metadata: { system: true },
      },
      { transaction: trx },
    );

    const created = await DisputeCase.findByPk(dispute.id, {
      transaction: trx,
      include: buildDisputeInclude(),
    });

    return formatDisputeRecord(created);
  });
}

export async function appendDisputeEvent(disputeCaseId, payload, options = {}) {
  const {
    actorId = null,
    actorType = 'system',
    actionType = 'comment',
    notes,
    stage,
    status,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    evidence,
    transactionResolution,
    metadata,
  } = payload;

  return withTransaction(options.transaction, async (trx) => {
    const dispute = await DisputeCase.findByPk(disputeCaseId, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!dispute) {
      throw new NotFoundError('Dispute case not found');
    }

    const uploader = options.uploader ?? r2Client;
    let evidenceResult = null;

    if (evidence?.content) {
      const encoding = evidence.encoding ?? 'base64';
      const buffer = Buffer.from(evidence.content, encoding);
      evidenceResult = await uploader.uploadEvidence({
        prefix: `disputes/${dispute.id}`,
        fileName: evidence.fileName,
        contentType: evidence.contentType ?? 'application/octet-stream',
        body: buffer,
        metadata: {
          disputeCaseId: String(dispute.id),
          actorType,
        },
      });
    }

    const event = await DisputeEvent.create(
      {
        disputeCaseId,
        actorId,
        actorType,
        actionType,
        notes,
        evidenceKey: evidenceResult?.key ?? null,
        evidenceUrl: evidenceResult?.url ?? null,
        evidenceFileName: evidence?.fileName ?? null,
        evidenceContentType: evidence?.contentType ?? null,
        metadata: metadata ?? null,
      },
      { transaction: trx },
    );

    const updates = {};

    if (stage && DISPUTE_STAGES.includes(stage) && stage !== dispute.stage) {
      updates.stage = stage;
    }

    if (status && DISPUTE_STATUSES.includes(status) && status !== dispute.status) {
      updates.status = status;
      if (['settled', 'closed'].includes(status)) {
        updates.resolvedAt = new Date();
      }
    }

    if (customerDeadlineAt !== undefined) {
      updates.customerDeadlineAt = customerDeadlineAt;
    }

    if (providerDeadlineAt !== undefined) {
      updates.providerDeadlineAt = providerDeadlineAt;
    }

    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes;
    }

    if (Object.keys(updates).length > 0) {
      await dispute.update(updates, { transaction: trx });
    }

    if (transactionResolution === 'release') {
      await releaseEscrowTransaction(dispute.escrowTransactionId, { actorId, notes: 'Released via dispute resolution' }, {
        transaction: trx,
      });
    }
    if (transactionResolution === 'refund') {
      await refundEscrowTransaction(dispute.escrowTransactionId, { actorId, notes: 'Refunded via dispute resolution' }, {
        transaction: trx,
      });
    }

    const { dispute: updatedDispute } = await getDisputeCaseById(disputeCaseId, { transaction: trx });

    return {
      dispute: updatedDispute,
      event: event.toPublicObject(),
    };
  });
}

export async function listDisputeCases(options = {}) {
  const {
    status,
    stage,
    priority,
    assignedToId,
    openedById,
    search,
    limit = 20,
    offset = 0,
    sort = 'recent',
    includeEvents = true,
  } = options;

  const pageSize = normaliseInteger(limit, { min: 1, max: 100, fallback: 20 });
  const pageOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const toArray = (value) => {
    if (value == null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [`${value}`];
  };

  const where = {};
  const applyEnumFilter = (field, value, allowed) => {
    const entries = toArray(value)
      .map((entry) => `${entry}`.trim())
      .filter(Boolean);
    if (!entries.length) {
      return;
    }
    const invalid = entries.some((entry) => !allowed.includes(entry));
    if (invalid) {
      throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`);
    }
    where[field] = entries.length === 1 ? entries[0] : { [Op.in]: entries };
  };

  applyEnumFilter('status', status, DISPUTE_STATUSES);
  applyEnumFilter('stage', stage, DISPUTE_STAGES);
  applyEnumFilter('priority', priority, DISPUTE_PRIORITIES);

  if (assignedToId !== undefined) {
    if (assignedToId === null || assignedToId === '' || assignedToId === 'null') {
      where.assignedToId = null;
    } else {
      const parsed = Number.parseInt(assignedToId, 10);
      if (Number.isNaN(parsed)) {
        throw new ValidationError('assignedToId must be numeric when provided');
      }
      where.assignedToId = parsed;
    }
  }

  if (openedById !== undefined && openedById !== null && openedById !== '') {
    const parsed = Number.parseInt(openedById, 10);
    if (!Number.isNaN(parsed)) {
      where.openedById = parsed;
    }
  }

  const searchTerm = typeof search === 'string' ? search.trim() : '';
  const include = [buildTransactionInclude()];
  if (includeEvents) {
    include.push(buildEventInclude(5));
  }

  if (searchTerm) {
    const dialect = sequelize.getDialect();
    const operator = ['postgres', 'postgresql'].includes(dialect) ? Op.iLike : Op.like;
    const likeValue = `%${escapeLikeTerm(searchTerm)}%`;
    where[Op.or] = [
      { reasonCode: { [operator]: likeValue } },
      { summary: { [operator]: likeValue } },
      sequelize.where(sequelize.col('transaction.reference'), { [operator]: likeValue }),
    ];
  }

  const order = [];
  if (sort === 'priority') {
    order.push(['priority', 'DESC']);
  } else if (sort === 'oldest') {
    order.push(['updatedAt', 'ASC']);
  } else if (sort === 'deadline') {
    order.push(['providerDeadlineAt', 'ASC']);
  } else {
    order.push(['updatedAt', 'DESC']);
  }
  order.push(['id', 'DESC']);
    const [reloadedDispute, eventWithActor] = await Promise.all([
      DisputeCase.findByPk(dispute.id, {
        transaction: trx,
        include: buildDisputeInclude(),
      }),
      DisputeEvent.findByPk(event.id, {
        transaction: trx,
        include: [{ model: User, as: 'actor', attributes: USER_SAFE_ATTRIBUTES }],
      }),
    ]);

    return {
      dispute: formatDisputeRecord(reloadedDispute),
      event: formatDisputeEventRecord(eventWithActor),
    };
  });
}

export async function listDisputeCases(query = {}) {
  const {
    page = 1,
    pageSize = 20,
    stage,
    stages,
    status,
    statuses,
    priority,
    priorities,
    assignedToId,
    openedById,
    transactionReference,
    search,
    sortBy,
    sortDirection,
    includeClosed = false,
  } = query;

  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const offset = (normalizedPage - 1) * normalizedPageSize;

  const stageFilters = normalizeArrayInput(stages ?? stage).filter((value) => DISPUTE_STAGES.includes(value));
  const statusFilters = normalizeArrayInput(statuses ?? status).filter((value) => DISPUTE_STATUSES.includes(value));
  const priorityFilters = normalizeArrayInput(priorities ?? priority).filter((value) => DISPUTE_PRIORITIES.includes(value));
  const assignedTo = coerceInteger(assignedToId);
  const openedBy = coerceInteger(openedById);
  const trimmedReference =
    typeof transactionReference === 'string' && transactionReference.trim().length
      ? transactionReference.trim()
      : null;
  const trimmedSearch = typeof search === 'string' ? search.trim() : '';
  const likeOperator = Op.iLike ?? Op.like;

  const baseConditions = [];

  if (stageFilters.length === 1) {
    baseConditions.push({ stage: stageFilters[0] });
  } else if (stageFilters.length > 1) {
    baseConditions.push({ stage: { [Op.in]: stageFilters } });
  }

  const includeClosedNormalized =
    typeof includeClosed === 'string'
      ? includeClosed.toLowerCase() === 'true'
      : Boolean(includeClosed);

  if (statusFilters.length === 1) {
    baseConditions.push({ status: statusFilters[0] });
  } else if (statusFilters.length > 1) {
    baseConditions.push({ status: { [Op.in]: statusFilters } });
  } else if (!includeClosedNormalized) {
    baseConditions.push({ status: { [Op.notIn]: ['settled', 'closed'] } });
  }

  if (priorityFilters.length === 1) {
    baseConditions.push({ priority: priorityFilters[0] });
  } else if (priorityFilters.length > 1) {
    baseConditions.push({ priority: { [Op.in]: priorityFilters } });
  }

  if (assignedTo !== null) {
    baseConditions.push({ assignedToId: assignedTo });
  }

  if (openedBy !== null) {
    baseConditions.push({ openedById: openedBy });
  }

  const transactionFilters = [];

  if (trimmedReference) {
    transactionFilters.push({ reference: trimmedReference });
  }

  if (trimmedSearch) {
    const escaped = trimmedSearch.replace(/[\\%_]/g, '\\$&');
    const pattern = `%${escaped}%`;
    baseConditions.push({
      [Op.or]: [
        { summary: { [likeOperator]: pattern } },
        { reasonCode: { [likeOperator]: pattern } },
      ],
    });
    transactionFilters.push({ reference: { [likeOperator]: pattern } });
  }

  const where = buildWhereFromConditions(baseConditions);
  const include = buildDisputeInclude({ transactionFilters });

  const sortDirectionNormalized =
    typeof sortDirection === 'string' && sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const sortMap = {
    openedAt: { column: 'openedAt' },
    updatedAt: { column: 'updatedAt' },
    priority: { column: 'priority' },
    stage: { column: 'stage' },
    status: { column: 'status' },
    amount: { association: { model: EscrowTransaction, as: 'transaction' }, column: 'amount' },
    reference: { association: { model: EscrowTransaction, as: 'transaction' }, column: 'reference' },
  };

  const sortConfig = sortMap[sortBy] ?? sortMap.updatedAt;
  const order = [];

  if (sortConfig.association) {
    order.push([sortConfig.association, sortConfig.column, sortDirectionNormalized]);
  } else {
    order.push([sortConfig.column, sortDirectionNormalized]);
  }

  if (!order.some((entry) => Array.isArray(entry) && entry[0] === 'updatedAt')) {
    order.push(['updatedAt', 'DESC']);
  }

  const { rows, count } = await DisputeCase.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: pageSize,
    offset: pageOffset,
    order,
  });

  const disputes = rows.map(toDisputeCaseDto);
  const totalCount = typeof count === 'number' ? count : count?.length ?? 0;
  const page = Math.floor(pageOffset / pageSize) + 1;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const summaryCases = await DisputeCase.findAll({
    where,
    include: [buildTransactionInclude()],
    attributes: ['id', 'status', 'stage', 'priority', 'openedAt', 'resolvedAt'],
  });

  const totalsByStatus = {};
  const totalsByStage = {};
  const totalsByPriority = {};
  const openAmountsByCurrency = {};
  let resolutionTotalHours = 0;
  let resolvedCount = 0;

  for (const record of summaryCases) {
    totalsByStatus[record.status] = (totalsByStatus[record.status] ?? 0) + 1;
    totalsByStage[record.stage] = (totalsByStage[record.stage] ?? 0) + 1;
    totalsByPriority[record.priority] = (totalsByPriority[record.priority] ?? 0) + 1;

    if (record.resolvedAt && record.openedAt) {
      const opened = new Date(record.openedAt).getTime();
      const resolved = new Date(record.resolvedAt).getTime();
      if (Number.isFinite(opened) && Number.isFinite(resolved) && resolved >= opened) {
        resolutionTotalHours += (resolved - opened) / (1000 * 60 * 60);
        resolvedCount += 1;
      }
    }

    if (['open', 'awaiting_customer', 'under_review'].includes(record.status)) {
      const transaction = record.transaction?.toPublicObject?.();
      if (transaction) {
        const currency = transaction.currencyCode || 'USD';
        const amount = Number.parseFloat(transaction.amount ?? 0);
        if (!Number.isNaN(amount)) {
          openAmountsByCurrency[currency] = (openAmountsByCurrency[currency] ?? 0) + amount;
        }
      }
    }
  }

  const averageResolutionHours =
    resolvedCount > 0 ? Number((resolutionTotalHours / resolvedCount).toFixed(2)) : null;

  return {
    disputes,
    pagination: { total: totalCount, limit: pageSize, offset: pageOffset, page, pageCount },
    summary: {
      totalsByStatus,
      totalsByStage,
      totalsByPriority,
      openAmountsByCurrency,
      averageResolutionHours,
      lastUpdated: new Date().toISOString(),
    limit: normalizedPageSize,
    offset,
    order,
    distinct: true,
  });

  const disputes = rows.map((record) => formatDisputeRecord(record));
  const totalItems =
    typeof count === 'number'
      ? count
      : Array.isArray(count)
        ? count.length
        : Number.parseInt(count, 10) || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));

  const aggregateInclude = transactionFilters.length
    ? [
        {
          model: EscrowTransaction,
          as: 'transaction',
          required: true,
          where: { [Op.or]: transactionFilters },
        },
      ]
    : [];

  const [countsByStage, countsByStatus, countsByPriority] = await Promise.all([
    fetchGroupedCounts('stage', where, aggregateInclude),
    fetchGroupedCounts('status', where, aggregateInclude),
    fetchGroupedCounts('priority', where, aggregateInclude),
  ]);

  const openStatuses = new Set(['open', 'awaiting_customer', 'under_review']);
  const openDisputes = Object.entries(countsByStatus).reduce((accumulator, [statusKey, value]) => {
    if (openStatuses.has(statusKey)) {
      return accumulator + value;
    }
    return accumulator;
  }, 0);

  const overdueConditions = [...baseConditions];
  overdueConditions.push({
    [Op.or]: [
      { customerDeadlineAt: { [Op.lt]: new Date() } },
      { providerDeadlineAt: { [Op.lt]: new Date() } },
    ],
  });
  const overdueWhere = buildWhereFromConditions(overdueConditions);
  const overdue = await DisputeCase.count({ where: overdueWhere, include: aggregateInclude });

  return {
    disputes,
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
    totals: {
      byStage: countsByStage,
      byStatus: countsByStatus,
      byPriority: countsByPriority,
      openDisputes,
      overdue,
    },
    filters: {
      stage: stageFilters,
      status: statusFilters,
      priority: priorityFilters,
      assignedToId: assignedTo,
      openedById: openedBy,
      transactionReference: trimmedReference,
      search: trimmedSearch || null,
    },
  };
}

export async function getDisputeCaseById(disputeCaseId, options = {}) {
  const dispute = await DisputeCase.findByPk(disputeCaseId, {
    transaction: options.transaction,
    include: [buildTransactionInclude(), buildEventInclude(20)],
  const disputeId = coerceInteger(disputeCaseId);
  if (!disputeId) {
    throw new ValidationError('A valid dispute identifier is required');
  }

  const dispute = await DisputeCase.findByPk(disputeId, {
    transaction: options.transaction,
    include: buildDisputeInclude({ includeEvents: true }),
  });

  if (!dispute) {
    throw new NotFoundError('Dispute case not found');
  }

  return { dispute: toDisputeCaseDto(dispute) };
}

export async function updateDisputeCase(disputeCaseId, payload, options = {}) {
  const {
    assignedToId,
    priority,
    stage,
    status,
    reasonCode,
    summary,
  return formatDisputeRecord(dispute, { includeEvents: true });
}

export async function updateDisputeCase(disputeCaseId, payload = {}, options = {}) {
  const disputeId = coerceInteger(disputeCaseId);
  if (!disputeId) {
    throw new ValidationError('A valid dispute identifier is required');
  }

  const {
    assignedToId: nextAssignedToId,
    priority,
    stage,
    status,
    summary,
    reasonCode,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    metadata,
  } = payload ?? {};

  return withTransaction(options.transaction, async (trx) => {
    const dispute = await DisputeCase.findByPk(disputeCaseId, {
  } = payload;

  return withTransaction(options.transaction, async (trx) => {
    const dispute = await DisputeCase.findByPk(disputeId, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!dispute) {
      throw new NotFoundError('Dispute case not found');
    }

    const updates = {};

    if (assignedToId !== undefined) {
      if (assignedToId === null || assignedToId === '' || assignedToId === 'null') {
        updates.assignedToId = null;
      } else {
        const parsed = Number.parseInt(assignedToId, 10);
        if (Number.isNaN(parsed)) {
          throw new ValidationError('assignedToId must be numeric when provided');
        }
        updates.assignedToId = parsed;
      }
    }

    if (priority !== undefined) {
      if (!DISPUTE_PRIORITIES.includes(priority)) {
        throw new ValidationError(`priority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
      }
      updates.priority = priority;
    }

    if (stage !== undefined) {
      if (!DISPUTE_STAGES.includes(stage)) {
        throw new ValidationError(`stage must be one of: ${DISPUTE_STAGES.join(', ')}`);
      }
      updates.stage = stage;
    }

    if (status !== undefined) {
      if (!DISPUTE_STATUSES.includes(status)) {
        throw new ValidationError(`status must be one of: ${DISPUTE_STATUSES.join(', ')}`);
      }
      updates.status = status;
      if (['settled', 'closed'].includes(status)) {
        updates.resolvedAt = new Date();
      } else if (['open', 'awaiting_customer', 'under_review'].includes(status)) {
        updates.resolvedAt = null;
      }
    }

    if (reasonCode !== undefined) {
      if (!reasonCode || `${reasonCode}`.trim().length === 0) {
        throw new ValidationError('reasonCode cannot be empty');
      }
      updates.reasonCode = `${reasonCode}`.trim();
    }

    if (summary !== undefined) {
      if (!summary || `${summary}`.trim().length === 0) {
        throw new ValidationError('summary cannot be empty');
      }
      updates.summary = `${summary}`.trim();
    }

    if (customerDeadlineAt !== undefined) {
      updates.customerDeadlineAt = customerDeadlineAt ? new Date(customerDeadlineAt) : null;
    }

    if (providerDeadlineAt !== undefined) {
      updates.providerDeadlineAt = providerDeadlineAt ? new Date(providerDeadlineAt) : null;
    }

    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes ?? null;
    }

    if (metadata !== undefined) {
      updates.metadata = metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await dispute.update(updates, { transaction: trx });
    }

    return (await getDisputeCaseById(disputeCaseId, { transaction: trx })).dispute;
  });
}

export async function getDisputeWorkflowSettings({ workspaceId } = {}) {
  if (!workspaceId) {
    return { settings: { ...DEFAULT_WORKFLOW_SETTINGS } };
  }

  const record = await DisputeWorkflowSetting.findOne({ where: { workspaceId } });

  if (!record) {
    return { settings: { ...DEFAULT_WORKFLOW_SETTINGS, workspaceId } };
  }

  return { settings: { ...DEFAULT_WORKFLOW_SETTINGS, ...record.toPublicObject() } };
}

export async function saveDisputeWorkflowSettings(payload, options = {}) {
  const { workspaceId } = payload ?? {};
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to update dispute workflow settings');
  }

  const defaultAssigneeId =
    payload.defaultAssigneeId === null || payload.defaultAssigneeId === '' || payload.defaultAssigneeId === 'null'
      ? null
      : Number.parseInt(payload.defaultAssigneeId, 10);

  if (defaultAssigneeId != null && Number.isNaN(defaultAssigneeId)) {
    throw new ValidationError('defaultAssigneeId must be numeric when provided');
  }

  const updates = {
    defaultAssigneeId,
    responseSlaHours: normaliseInteger(payload.responseSlaHours, {
      min: 1,
      max: 720,
      fallback: DEFAULT_WORKFLOW_SETTINGS.responseSlaHours,
    }),
    resolutionSlaHours: normaliseInteger(payload.resolutionSlaHours, {
      min: 1,
      max: 1440,
      fallback: DEFAULT_WORKFLOW_SETTINGS.resolutionSlaHours,
    }),
    autoEscalateHours: normaliseOptionalInteger(payload.autoEscalateHours, { min: 1, max: 720 }),
    autoCloseHours: normaliseOptionalInteger(payload.autoCloseHours, { min: 1, max: 1440 }),
    evidenceRequirements: normaliseChecklist(payload.evidenceRequirements),
    notificationEmails: normaliseList(payload.notificationEmails),
    metadata: payload.metadata ?? null,
  };

  return withTransaction(options.transaction, async (trx) => {
    const [record] = await DisputeWorkflowSetting.findOrCreate({
      where: { workspaceId },
      defaults: { workspaceId, ...updates },
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    await record.update(updates, { transaction: trx });

    return { settings: { ...DEFAULT_WORKFLOW_SETTINGS, ...record.toPublicObject() } };
  });
}

export async function listDisputeTemplates({ workspaceId, includeGlobal = true } = {}) {
  const where = {};

  if (workspaceId) {
    where[Op.or] = includeGlobal ? [{ workspaceId }, { workspaceId: null }] : [{ workspaceId }];
  } else if (!includeGlobal) {
    where.workspaceId = null;
  }

  const templates = await DisputeTemplate.findAll({
    where,
    order: [
      ['active', 'DESC'],
      ['workspaceId', 'ASC'],
      ['name', 'ASC'],
    ],
  });

  return { templates: templates.map((template) => template.toPublicObject()) };
}

export async function createDisputeTemplate(payload, options = {}) {
  const {
    workspaceId = null,
    name,
    reasonCode = null,
    defaultStage = 'intake',
    defaultPriority = 'medium',
    guidance = null,
    checklist,
    active = true,
    createdById = null,
    metadata = null,
  } = payload ?? {};

  if (!name || `${name}`.trim().length === 0) {
    throw new ValidationError('Template name is required');
  }

  if (!DISPUTE_STAGES.includes(defaultStage)) {
    throw new ValidationError(`defaultStage must be one of: ${DISPUTE_STAGES.join(', ')}`);
  }

  if (!DISPUTE_PRIORITIES.includes(defaultPriority)) {
    throw new ValidationError(`defaultPriority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
  }

  return withTransaction(options.transaction, async (trx) => {
    const template = await DisputeTemplate.create(
      {
        workspaceId,
        name: `${name}`.trim(),
        reasonCode: reasonCode ? `${reasonCode}`.trim() : null,
        defaultStage,
        defaultPriority,
        guidance: guidance ?? null,
        checklist: normaliseChecklist(checklist),
        active: Boolean(active),
        createdById: createdById ?? null,
        updatedById: createdById ?? null,
        metadata: metadata ?? null,
      },
      { transaction: trx },
    );

    return { template: template.toPublicObject() };
  });
}

export async function updateDisputeTemplate(templateId, payload, options = {}) {
  return withTransaction(options.transaction, async (trx) => {
    const template = await DisputeTemplate.findByPk(templateId, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!template) {
      throw new NotFoundError('Dispute template not found');
    }

    const updates = {};

    if (payload.name !== undefined) {
      if (!payload.name || `${payload.name}`.trim().length === 0) {
        throw new ValidationError('Template name cannot be empty');
      }
      updates.name = `${payload.name}`.trim();
    }

    if (payload.reasonCode !== undefined) {
      updates.reasonCode = payload.reasonCode ? `${payload.reasonCode}`.trim() : null;
    }

    if (payload.defaultStage !== undefined) {
      if (!DISPUTE_STAGES.includes(payload.defaultStage)) {
        throw new ValidationError(`defaultStage must be one of: ${DISPUTE_STAGES.join(', ')}`);
      }
      updates.defaultStage = payload.defaultStage;
    }

    if (payload.defaultPriority !== undefined) {
      if (!DISPUTE_PRIORITIES.includes(payload.defaultPriority)) {
        throw new ValidationError(`defaultPriority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
      }
      updates.defaultPriority = payload.defaultPriority;
    }

    if (payload.guidance !== undefined) {
      updates.guidance = payload.guidance ?? null;
    }

    if (payload.checklist !== undefined) {
      updates.checklist = normaliseChecklist(payload.checklist);
    }

    if (payload.active !== undefined) {
      updates.active = Boolean(payload.active);
    }

    if (payload.updatedById !== undefined) {
      updates.updatedById = payload.updatedById ?? null;
    }

    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await template.update(updates, { transaction: trx });
    }

    return { template: template.toPublicObject() };
  });
}

export async function deleteDisputeTemplate(templateId, options = {}) {
  return withTransaction(options.transaction, async (trx) => {
    const template = await DisputeTemplate.findByPk(templateId, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
    });

    if (!template) {
      throw new NotFoundError('Dispute template not found');
    }

    await template.destroy({ transaction: trx });

    return { success: true };
    if (nextAssignedToId !== undefined) {
      const nextAssigned = coerceInteger(nextAssignedToId);
      updates.assignedToId = nextAssigned;
    }

    if (priority !== undefined) {
      if (priority && !DISPUTE_PRIORITIES.includes(priority)) {
        throw new ValidationError(`priority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
      }
      if (priority) {
        updates.priority = priority;
      }
    }

    if (stage !== undefined) {
      if (stage && !DISPUTE_STAGES.includes(stage)) {
        throw new ValidationError(`stage must be one of: ${DISPUTE_STAGES.join(', ')}`);
      }
      if (stage && stage !== dispute.stage) {
        updates.stage = stage;
      }
    }

    if (status !== undefined) {
      if (status && !DISPUTE_STATUSES.includes(status)) {
        throw new ValidationError(`status must be one of: ${DISPUTE_STATUSES.join(', ')}`);
      }
      if (status && status !== dispute.status) {
        updates.status = status;
        if (['settled', 'closed'].includes(status)) {
          updates.resolvedAt = dispute.resolvedAt ?? new Date();
        } else if (['settled', 'closed'].includes(dispute.status)) {
          updates.resolvedAt = null;
        }
      }
    }

    if (summary !== undefined) {
      if (summary == null || !String(summary).trim().length) {
        throw new ValidationError('summary cannot be empty');
      }
      updates.summary = String(summary).trim();
    }

    if (reasonCode !== undefined) {
      if (reasonCode == null || !String(reasonCode).trim().length) {
        throw new ValidationError('reasonCode cannot be empty');
      }
      updates.reasonCode = String(reasonCode).trim();
    }

    if (customerDeadlineAt !== undefined) {
      updates.customerDeadlineAt = normaliseDateInput(customerDeadlineAt);
    }

    if (providerDeadlineAt !== undefined) {
      updates.providerDeadlineAt = normaliseDateInput(providerDeadlineAt);
    }

    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes == null ? null : String(resolutionNotes);
    }

    if (metadata !== undefined) {
      if (metadata === null) {
        updates.metadata = null;
      } else if (typeof metadata === 'object') {
        updates.metadata = metadata;
      } else {
        throw new ValidationError('metadata must be an object or null');
      }
    }

    if (Object.keys(updates).length === 0) {
      return getDisputeCaseById(disputeId, { transaction: trx });
    }

    await dispute.update(updates, { transaction: trx });

    const updated = await DisputeCase.findByPk(disputeId, {
      transaction: trx,
      include: buildDisputeInclude(),
    });

    return formatDisputeRecord(updated);
  });
}

export async function getTrustOverview() {
  const [statusTotals, disputeStages, accounts, releaseQueue, openDisputes] = await Promise.all([
    EscrowTransaction.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      group: ['status'],
    }),
    DisputeCase.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['stage'],
    }),
    EscrowAccount.findAll({
      where: { status: ['pending', 'active'] },
      limit: 50,
      order: [['updatedAt', 'DESC']],
    }),
    EscrowTransaction.findAll({
      where: { status: 'in_escrow' },
      limit: 10,
      order: [['scheduledReleaseAt', 'ASC']],
    }),
    DisputeCase.findAll({
      where: { status: ['open', 'awaiting_customer', 'under_review'] },
      limit: 10,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: EscrowTransaction,
          as: 'transaction',
        },
      ],
    }),
  ]);

  const statusAggregate = {};
  for (const row of statusTotals) {
    const status = row.get('status');
    statusAggregate[status] = {
      count: Number.parseInt(row.get('count'), 10) || 0,
      total: Number.parseFloat(row.get('totalAmount') ?? 0) || 0,
    };
  }

  const stageAggregate = {};
  for (const row of disputeStages) {
    const stage = row.get('stage');
    stageAggregate[stage] = Number.parseInt(row.get('count'), 10) || 0;
  }

  const releaseAgingBuckets = {
    '0-3_days': 0,
    '4-7_days': 0,
    '8-14_days': 0,
    '15+_days': 0,
  };

  const now = Date.now();
  for (const record of releaseQueue) {
    if (!record.scheduledReleaseAt) {
      continue;
    }
    const diffDays = Math.floor((new Date(record.scheduledReleaseAt).getTime() - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      releaseAgingBuckets['0-3_days'] += 1;
    } else if (diffDays <= 7) {
      releaseAgingBuckets['4-7_days'] += 1;
    } else if (diffDays <= 14) {
      releaseAgingBuckets['8-14_days'] += 1;
    } else {
      releaseAgingBuckets['15+_days'] += 1;
    }
  }

  return {
    totalsByStatus: statusAggregate,
    disputesByStage: stageAggregate,
    activeAccounts: accounts.map((account) => account.toPublicObject()),
    releaseQueue: releaseQueue.map((entry) => entry.toPublicObject()),
    disputeQueue: openDisputes.map((caseRecord) => ({
      ...caseRecord.toPublicObject(),
      transaction: caseRecord.transaction?.toPublicObject?.(),
    })),
    releaseAgingBuckets,
  };
}

export default {
  ensureEscrowAccount,
  updateEscrowAccount,
  initiateEscrowTransaction,
  updateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
  createDisputeCase,
  appendDisputeEvent,
  listDisputeCases,
  getDisputeCaseById,
  updateDisputeCase,
  getDisputeWorkflowSettings,
  saveDisputeWorkflowSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
  getTrustOverview,
};
