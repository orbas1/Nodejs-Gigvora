import { Op } from 'sequelize';
import {
  sequelize,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  User,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_TRANSACTION_TYPES,
  ESCROW_TRANSACTION_STATUSES,
  DISPUTE_STATUSES,
  DISPUTE_STAGES,
  DISPUTE_PRIORITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import r2Client from '../utils/r2Client.js';

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

const LIKE_OPERATOR = Op.iLike ?? Op.like;
const ACTIVE_DISPUTE_STATUSES = new Set(['open', 'awaiting_customer', 'under_review']);

function normalizeList(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => (item == null ? '' : String(item)))
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  return normalizeList(String(value).split(','));
}

function parseInteger(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeOpenDurationHours(openedAt, resolvedAt) {
  const start = parseDate(openedAt);
  const end = resolvedAt ? parseDate(resolvedAt) : new Date();
  if (!start || !end) {
    return null;
  }
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(diff)) {
    return null;
  }
  return Number(diff.toFixed(2));
}

function isOverdueCase(dispute) {
  if (!dispute || ACTIVE_DISPUTE_STATUSES.has(dispute.status) === false) {
    return false;
  }

  const now = Date.now();
  const deadlines = [dispute.customerDeadlineAt, dispute.providerDeadlineAt]
    .map((deadline) => (deadline ? new Date(deadline).getTime() : null))
    .filter((timestamp) => Number.isFinite(timestamp));

  if (!deadlines.length) {
    return false;
  }

  return deadlines.some((timestamp) => timestamp < now);
}

function isDueSoonCase(dispute, windowHours = 48) {
  if (!dispute || ACTIVE_DISPUTE_STATUSES.has(dispute.status) === false) {
    return false;
  }

  const now = Date.now();
  const threshold = now + windowHours * 60 * 60 * 1000;
  const deadlines = [dispute.customerDeadlineAt, dispute.providerDeadlineAt]
    .map((deadline) => (deadline ? new Date(deadline).getTime() : null))
    .filter((timestamp) => Number.isFinite(timestamp));

  if (!deadlines.length) {
    return false;
  }

  return deadlines.some((timestamp) => timestamp >= now && timestamp <= threshold);
}

function formatUserSummary(instance) {
  if (!instance) {
    return null;
  }

  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();

  return {
    id: plain.id ?? null,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
    avatarUrl: plain.avatarUrl ?? plain.profileImageUrl ?? null,
    displayName: plain.displayName ?? (fullName || plain.email || null),
  };
}

function formatDisputeEventRecord(record) {
  if (!record) {
    return null;
  }

  const base = record.toPublicObject?.() ?? record;
  const actorInstance = record.get?.('actor') ?? record.actor;

  return {
    ...base,
    actor: formatUserSummary(actorInstance),
  };
}

function formatDisputeCaseRecord(record, { includeEvents = false } = {}) {
  if (!record) {
    return null;
  }

  const base = record.toPublicObject();
  const transactionInstance = record.get?.('transaction') ?? record.transaction ?? null;
  const openedByInstance = record.get?.('openedBy') ?? record.openedBy ?? null;
  const assignedToInstance = record.get?.('assignedTo') ?? record.assignedTo ?? null;
  const rawEvents = Array.isArray(record.get?.('events')) ? record.get('events') : Array.isArray(record.events) ? record.events : [];

  const sortedEvents = rawEvents
    .map((event) => event)
    .sort((a, b) => {
      const aTime = new Date(a.eventAt ?? a.createdAt ?? a.updatedAt ?? 0).getTime();
      const bTime = new Date(b.eventAt ?? b.createdAt ?? b.updatedAt ?? 0).getTime();
      return aTime - bTime;
    });

  const latestEventRecord = sortedEvents.length ? sortedEvents[sortedEvents.length - 1] : null;

  const transaction = transactionInstance?.toPublicObject?.() ?? transactionInstance ?? null;

  const payload = {
    ...base,
    transaction,
    openedBy: formatUserSummary(openedByInstance),
    assignedTo: formatUserSummary(assignedToInstance),
    latestEvent: formatDisputeEventRecord(latestEventRecord),
    openDurationHours: computeOpenDurationHours(base.openedAt, base.resolvedAt),
    overdue: isOverdueCase(base),
    dueSoon: isDueSoonCase(base),
  };

  if (includeEvents) {
    payload.events = sortedEvents.map((event) => formatDisputeEventRecord(event));
  }

  return payload;
}

function cloneInclude(include = []) {
  return include.map((item) => {
    const cloned = { ...item };
    if (item.include) {
      cloned.include = cloneInclude(item.include);
    }
    return cloned;
  });
}

function combineWhere(baseWhere, additionalWhere) {
  if (!additionalWhere || !Object.keys(additionalWhere).length) {
    return baseWhere;
  }

  if (!baseWhere || !Object.keys(baseWhere).length) {
    return additionalWhere;
  }

  return {
    [Op.and]: [baseWhere, additionalWhere],
  };
}

function buildDisputeQueryComponents(filters = {}) {
  const where = {};
  const include = [];
  const aggregateInclude = [];
  const normalizedFilters = {};

  const normalizedStages = normalizeList(filters.stage).filter((value) => DISPUTE_STAGES.includes(value));
  if (normalizedStages.length) {
    where.stage = normalizedStages.length === 1 ? normalizedStages[0] : { [Op.in]: normalizedStages };
    normalizedFilters.stage = normalizedStages;
  }

  const normalizedStatuses = normalizeList(filters.status).filter((value) => DISPUTE_STATUSES.includes(value));
  if (normalizedStatuses.length) {
    where.status = normalizedStatuses.length === 1 ? normalizedStatuses[0] : { [Op.in]: normalizedStatuses };
    normalizedFilters.status = normalizedStatuses;
  }

  const normalizedPriorities = normalizeList(filters.priority).filter((value) => DISPUTE_PRIORITIES.includes(value));
  if (normalizedPriorities.length) {
    where.priority = normalizedPriorities.length === 1 ? normalizedPriorities[0] : { [Op.in]: normalizedPriorities };
    normalizedFilters.priority = normalizedPriorities;
  }

  if (filters.assignedToId !== undefined) {
    if (filters.assignedToId === null || filters.assignedToId === 'null' || filters.assignedToId === 'unassigned') {
      where.assignedToId = null;
      normalizedFilters.assignedToId = null;
    } else {
      const parsed = parseInteger(filters.assignedToId);
      if (parsed != null) {
        where.assignedToId = parsed;
        normalizedFilters.assignedToId = parsed;
      }
    }
  }

  if (filters.openedById !== undefined) {
    const parsed = parseInteger(filters.openedById);
    if (parsed != null) {
      where.openedById = parsed;
      normalizedFilters.openedById = parsed;
    }
  }

  if (!normalizedStatuses.length && (filters.openOnly === true || filters.openOnly === 'true')) {
    where.status = { [Op.notIn]: ['settled', 'closed'] };
    normalizedFilters.openOnly = true;
  }

  if (filters.reasonCode) {
    const reason = String(filters.reasonCode).trim();
    if (reason) {
      where.reasonCode = reason;
      normalizedFilters.reasonCode = reason;
    }
  }

  const searchTerm = typeof filters.search === 'string' ? filters.search.trim() : '';
  let requireTransactionJoin = true;
  if (searchTerm) {
    normalizedFilters.search = searchTerm;
    const sanitized = searchTerm.replace(/[%_]/g, '\\$&');
    const searchConditions = [
      { summary: { [LIKE_OPERATOR]: `%${sanitized}%` } },
      { reasonCode: { [LIKE_OPERATOR]: `%${sanitized}%` } },
      { '$transaction.reference$': { [LIKE_OPERATOR]: `%${sanitized}%` } },
    ];
    if (/^#?\d+$/.test(searchTerm)) {
      const numeric = parseInteger(searchTerm.replace('#', ''));
      if (numeric != null) {
        searchConditions.push({ id: numeric });
      }
    }
    where[Op.or] = searchConditions;
    requireTransactionJoin = true;
  }

  const normalizedTransactionStatuses = normalizeList(filters.transactionStatus).filter((value) =>
    ESCROW_TRANSACTION_STATUSES.includes(value),
  );
  const transactionInclude = {
    model: EscrowTransaction,
    as: 'transaction',
    attributes: [
      'id',
      'reference',
      'status',
      'type',
      'amount',
      'netAmount',
      'currencyCode',
      'scheduledReleaseAt',
      'releasedAt',
      'refundedAt',
    ],
    required: requireTransactionJoin || normalizedTransactionStatuses.length > 0,
  };

  if (normalizedTransactionStatuses.length) {
    transactionInclude.where =
      normalizedTransactionStatuses.length === 1
        ? { status: normalizedTransactionStatuses[0] }
        : { status: { [Op.in]: normalizedTransactionStatuses } };
    normalizedFilters.transactionStatus = normalizedTransactionStatuses;
  }

  include.push(transactionInclude);
  aggregateInclude.push({ ...transactionInclude, attributes: [], separate: undefined, limit: undefined });

  include.push(
    {
      model: User,
      as: 'openedBy',
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
    },
    {
      model: User,
      as: 'assignedTo',
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
    },
  );

  return { where, include, aggregateInclude, normalizedFilters };
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

    const detailedDispute = await DisputeCase.findByPk(dispute.id, {
      transaction: trx,
      include: [
        {
          model: EscrowTransaction,
          as: 'transaction',
          attributes: [
            'id',
            'reference',
            'status',
            'type',
            'amount',
            'netAmount',
            'currencyCode',
            'scheduledReleaseAt',
            'releasedAt',
            'refundedAt',
          ],
        },
        {
          model: User,
          as: 'openedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: DisputeEvent,
          as: 'events',
          separate: true,
          order: [['eventAt', 'ASC']],
          include: [
            {
              model: User,
              as: 'actor',
              attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
            },
          ],
        },
      ],
    });

    return formatDisputeCaseRecord(detailedDispute, { includeEvents: true });
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

    await event.reload({
      transaction: trx,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
    });

    const detailedDispute = await DisputeCase.findByPk(dispute.id, {
      transaction: trx,
      include: [
        {
          model: EscrowTransaction,
          as: 'transaction',
          attributes: [
            'id',
            'reference',
            'status',
            'type',
            'amount',
            'netAmount',
            'currencyCode',
            'scheduledReleaseAt',
            'releasedAt',
            'refundedAt',
          ],
        },
        {
          model: User,
          as: 'openedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: DisputeEvent,
          as: 'events',
          separate: true,
          order: [['eventAt', 'ASC']],
          include: [
            {
              model: User,
              as: 'actor',
              attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
            },
          ],
        },
      ],
    });

    return {
      dispute: formatDisputeCaseRecord(detailedDispute, { includeEvents: true }),
      event: formatDisputeEventRecord(event),
    };
  });
}

export async function listDisputeCases(filters = {}) {
  const rawPage = parseInteger(filters.page, 1) ?? 1;
  const rawPageSize = parseInteger(filters.pageSize, 25) ?? 25;
  const page = Math.max(1, rawPage);
  const pageSize = Math.min(100, Math.max(1, rawPageSize));
  const offset = (page - 1) * pageSize;

  const { where, include, aggregateInclude, normalizedFilters } = buildDisputeQueryComponents(filters);

  const sortBy = typeof filters.sortBy === 'string' ? filters.sortBy.trim().toLowerCase() : 'updatedat';
  const rawDirection = typeof filters.sortDirection === 'string' ? filters.sortDirection.trim().toLowerCase() : filters.sortDirection;
  const sortDirection = rawDirection === 'asc' || rawDirection === 'ascending' ? 'ASC' : 'DESC';

  const order = [];
  switch (sortBy) {
    case 'priority':
      order.push(['priority', sortDirection]);
      order.push(['updatedAt', 'DESC']);
      break;
    case 'stage':
      order.push(['stage', sortDirection]);
      order.push(['updatedAt', 'DESC']);
      break;
    case 'status':
      order.push(['status', sortDirection]);
      order.push(['updatedAt', 'DESC']);
      break;
    case 'openedat':
      order.push(['openedAt', sortDirection]);
      break;
    case 'amount':
      order.push([{ model: EscrowTransaction, as: 'transaction' }, 'amount', sortDirection]);
      order.push(['updatedAt', 'DESC']);
      break;
    default:
      order.push(['updatedAt', sortDirection]);
      break;
  }

  const eventInclude = {
    model: DisputeEvent,
    as: 'events',
    attributes: ['id', 'actorId', 'actorType', 'actionType', 'notes', 'evidenceFileName', 'eventAt', 'createdAt', 'updatedAt'],
    include: [
      {
        model: User,
        as: 'actor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
      },
    ],
    separate: true,
    limit: 1,
    order: [['eventAt', 'DESC']],
  };

  const queryInclude = [...include, eventInclude];

  const { rows, count } = await DisputeCase.findAndCountAll({
    where,
    include: queryInclude,
    limit: pageSize,
    offset,
    order,
    distinct: true,
  });

  const items = rows.map((record) => formatDisputeCaseRecord(record, { includeEvents: false }));
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const aggregatesInclude = cloneInclude(aggregateInclude);
  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const [
    stageRows,
    priorityRows,
    statusRows,
    overdueCount,
    dueSoonCount,
    unassignedCount,
    awaitingCustomerCount,
    totalHeldRaw,
  ] = await Promise.all([
    DisputeCase.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('DisputeCase.id')), 'count'],
      ],
      where,
      include: aggregatesInclude,
      group: ['DisputeCase.stage'],
      raw: true,
    }),
    DisputeCase.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('DisputeCase.id')), 'count'],
      ],
      where,
      include: aggregatesInclude,
      group: ['DisputeCase.priority'],
      raw: true,
    }),
    DisputeCase.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('DisputeCase.id')), 'count'],
      ],
      where,
      include: aggregatesInclude,
      group: ['DisputeCase.status'],
      raw: true,
    }),
    DisputeCase.count({
      where: combineWhere(where, {
        status: { [Op.notIn]: ['settled', 'closed'] },
        [Op.or]: [
          { customerDeadlineAt: { [Op.lt]: now } },
          { providerDeadlineAt: { [Op.lt]: now } },
        ],
      }),
      include: aggregatesInclude,
      distinct: true,
    }),
    DisputeCase.count({
      where: combineWhere(where, {
        status: { [Op.notIn]: ['settled', 'closed'] },
        [Op.or]: [
          { customerDeadlineAt: { [Op.between]: [now, soon] } },
          { providerDeadlineAt: { [Op.between]: [now, soon] } },
        ],
      }),
      include: aggregatesInclude,
      distinct: true,
    }),
    DisputeCase.count({
      where: combineWhere(where, {
        assignedToId: null,
        status: { [Op.notIn]: ['settled', 'closed'] },
      }),
      include: aggregatesInclude,
      distinct: true,
    }),
    DisputeCase.count({
      where: combineWhere(where, { status: 'awaiting_customer' }),
      include: aggregatesInclude,
      distinct: true,
    }),
    DisputeCase.findOne({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('transaction.amount')), 0), 'totalAmount']],
      where: combineWhere(where, { status: { [Op.notIn]: ['settled', 'closed'] } }),
      include: cloneInclude(aggregateInclude).map((item) =>
        item.as === 'transaction' ? { ...item, required: true } : item,
      ),
      raw: true,
    }),
  ]);

  const totalsByStage = stageRows.reduce((acc, row) => {
    if (row.stage) {
      acc[row.stage] = Number.parseInt(row.count, 10) || 0;
    }
    return acc;
  }, {});

  const totalsByPriority = priorityRows.reduce((acc, row) => {
    if (row.priority) {
      acc[row.priority] = Number.parseInt(row.count, 10) || 0;
    }
    return acc;
  }, {});

  const totalsByStatus = statusRows.reduce((acc, row) => {
    if (row.status) {
      acc[row.status] = Number.parseInt(row.count, 10) || 0;
    }
    return acc;
  }, {});

  const openCount = Object.entries(totalsByStatus).reduce((sum, [status, value]) => {
    return ACTIVE_DISPUTE_STATUSES.has(status) ? sum + value : sum;
  }, 0);

  const totalHeldAmount = Number.parseFloat(totalHeldRaw?.totalAmount ?? 0);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages,
    },
    summary: {
      totalsByStage,
      totalsByPriority,
      totalsByStatus,
      openCount,
      overdueCount,
      dueSoonCount,
      unassignedCount,
      awaitingCustomerCount,
      totalHeldAmount: Number.isFinite(totalHeldAmount) ? Number(totalHeldAmount.toFixed(2)) : 0,
    },
    filters: normalizedFilters,
  };
}

export async function getDisputeCaseDetail(disputeCaseId) {
  const id = parseInteger(disputeCaseId);
  if (id == null) {
    throw new ValidationError('A valid disputeCaseId is required');
  }

  const dispute = await DisputeCase.findByPk(id, {
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        attributes: [
          'id',
          'reference',
          'status',
          'type',
          'amount',
          'netAmount',
          'currencyCode',
          'scheduledReleaseAt',
          'releasedAt',
          'refundedAt',
        ],
      },
      {
        model: User,
        as: 'openedBy',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
      },
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
      },
      {
        model: DisputeEvent,
        as: 'events',
        separate: true,
        order: [['eventAt', 'ASC']],
        include: [
          {
            model: User,
            as: 'actor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          },
        ],
      },
    ],
  });

  if (!dispute) {
    throw new NotFoundError('Dispute case not found');
  }

  return formatDisputeCaseRecord(dispute, { includeEvents: true });
}

export async function updateDisputeCase(disputeCaseId, payload, options = {}) {
  const id = parseInteger(disputeCaseId);
  if (id == null) {
    throw new ValidationError('A valid disputeCaseId is required');
  }

  const {
    actorId = null,
    actorType = 'admin',
    notes,
    actionType,
    stage,
    status,
    priority,
    assignedToId,
    reasonCode,
    summary,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    metadata,
    transactionResolution,
  } = payload;

  return withTransaction(options.transaction, async (trx) => {
    const dispute = await DisputeCase.findByPk(id, {
      transaction: trx,
      lock: trx?.LOCK?.UPDATE,
      include: [
        {
          model: EscrowTransaction,
          as: 'transaction',
          attributes: ['id', 'reference', 'status'],
        },
      ],
    });

    if (!dispute) {
      throw new NotFoundError('Dispute case not found');
    }

    const updates = {};

    if (stage !== undefined) {
      if (!stage) {
        throw new ValidationError('Stage cannot be empty');
      }
      if (!DISPUTE_STAGES.includes(stage)) {
        throw new ValidationError(`Stage must be one of: ${DISPUTE_STAGES.join(', ')}`);
      }
      if (stage !== dispute.stage) {
        updates.stage = stage;
      }
    }

    if (status !== undefined) {
      if (!status) {
        throw new ValidationError('Status cannot be empty');
      }
      if (!DISPUTE_STATUSES.includes(status)) {
        throw new ValidationError(`Status must be one of: ${DISPUTE_STATUSES.join(', ')}`);
      }
      if (status !== dispute.status) {
        updates.status = status;
        if (['settled', 'closed'].includes(status)) {
          updates.resolvedAt = new Date();
        } else if (dispute.resolvedAt) {
          updates.resolvedAt = null;
        }
      }
    }

    if (priority !== undefined) {
      if (!priority) {
        throw new ValidationError('Priority cannot be empty');
      }
      if (!DISPUTE_PRIORITIES.includes(priority)) {
        throw new ValidationError(`Priority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
      }
      if (priority !== dispute.priority) {
        updates.priority = priority;
      }
    }

    if (assignedToId !== undefined) {
      if (assignedToId === null || assignedToId === 'null' || assignedToId === 'unassigned') {
        updates.assignedToId = null;
      } else {
        const parsedAssigned = parseInteger(assignedToId);
        if (parsedAssigned == null) {
          throw new ValidationError('assignedToId must be a numeric identifier or null');
        }
        updates.assignedToId = parsedAssigned;
      }
    }

    if (reasonCode !== undefined) {
      const normalizedReason = reasonCode == null ? null : String(reasonCode).trim();
      if (!normalizedReason) {
        throw new ValidationError('reasonCode cannot be empty');
      }
      if (normalizedReason !== dispute.reasonCode) {
        updates.reasonCode = normalizedReason;
      }
    }

    if (summary !== undefined) {
      const normalizedSummary = summary == null ? '' : String(summary).trim();
      if (!normalizedSummary) {
        throw new ValidationError('summary cannot be empty');
      }
      if (normalizedSummary !== dispute.summary) {
        updates.summary = normalizedSummary;
      }
    }

    if (customerDeadlineAt !== undefined) {
      updates.customerDeadlineAt = customerDeadlineAt ? parseDate(customerDeadlineAt) : null;
    }

    if (providerDeadlineAt !== undefined) {
      updates.providerDeadlineAt = providerDeadlineAt ? parseDate(providerDeadlineAt) : null;
    }

    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes ?? null;
    }

    if (metadata !== undefined) {
      if (metadata === null) {
        updates.metadata = null;
      } else if (typeof metadata === 'object' && !Array.isArray(metadata)) {
        updates.metadata = metadata;
      } else {
        throw new ValidationError('metadata must be an object or null');
      }
    }

    if (Object.keys(updates).length) {
      await dispute.update(updates, { transaction: trx });
    }

    if (transactionResolution) {
      if (!['release', 'refund'].includes(transactionResolution)) {
        throw new ValidationError('transactionResolution must be release or refund');
      }
      if (transactionResolution === 'release') {
        await releaseEscrowTransaction(
          dispute.escrowTransactionId,
          { actorId, notes: 'Released from dispute workspace' },
          { transaction: trx },
        );
      } else if (transactionResolution === 'refund') {
        await refundEscrowTransaction(
          dispute.escrowTransactionId,
          { actorId, notes: 'Refunded from dispute workspace' },
          { transaction: trx },
        );
      }
    }

    let eventRecord = null;
    const eventMetadata = {};
    if (Object.keys(updates).length) {
      eventMetadata.updates = updates;
    }
    if (transactionResolution) {
      eventMetadata.transactionResolution = transactionResolution;
    }

    if (notes || Object.keys(updates).length || transactionResolution) {
      let derivedActionType = actionType;
      if (!derivedActionType) {
        if (transactionResolution) {
          derivedActionType = 'system_notice';
        } else if (updates.status) {
          derivedActionType = 'status_change';
        } else if (updates.stage) {
          derivedActionType = 'stage_advanced';
        } else if (updates.customerDeadlineAt || updates.providerDeadlineAt) {
          derivedActionType = 'deadline_adjusted';
        } else {
          derivedActionType = 'comment';
        }
      }

      eventRecord = await DisputeEvent.create(
        {
          disputeCaseId: dispute.id,
          actorId: actorId ?? null,
          actorType: actorType ?? 'admin',
          actionType: derivedActionType,
          notes: notes ?? null,
          metadata: Object.keys(eventMetadata).length ? eventMetadata : null,
        },
        { transaction: trx },
      );
    }

    const reloadedDispute = await DisputeCase.findByPk(dispute.id, {
      transaction: trx,
      include: [
        {
          model: EscrowTransaction,
          as: 'transaction',
          attributes: [
            'id',
            'reference',
            'status',
            'type',
            'amount',
            'netAmount',
            'currencyCode',
            'scheduledReleaseAt',
            'releasedAt',
            'refundedAt',
          ],
        },
        {
          model: User,
          as: 'openedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
        {
          model: DisputeEvent,
          as: 'events',
          separate: true,
          order: [['eventAt', 'ASC']],
          include: [
            {
              model: User,
              as: 'actor',
              attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
            },
          ],
        },
      ],
    });

    let formattedEvent = null;
    if (eventRecord) {
      await eventRecord.reload({
        transaction: trx,
        include: [
          {
            model: User,
            as: 'actor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          },
        ],
      });
      formattedEvent = formatDisputeEventRecord(eventRecord);
    }

    return {
      dispute: formatDisputeCaseRecord(reloadedDispute, { includeEvents: true }),
      event: formattedEvent,
    };
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
  initiateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
  createDisputeCase,
  appendDisputeEvent,
  listDisputeCases,
  getDisputeCaseDetail,
  updateDisputeCase,
  getTrustOverview,
};
