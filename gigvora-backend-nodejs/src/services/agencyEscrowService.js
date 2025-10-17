import { Op } from 'sequelize';
import {
  EscrowAccount,
  EscrowTransaction,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  User,
} from '../models/index.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import {
  ensureEscrowAccount,
  initiateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
} from './trustService.js';

const AGENCY_ALLOWED_ROLES = new Set(['agency', 'agency_admin', 'admin']);
const LIKE_OPERATOR = Op.iLike ?? Op.like;
const DEFAULT_ESCROW_SETTINGS = Object.freeze({
  autoReleaseEnabled: true,
  autoReleaseAfterDays: 7,
  requireDualApproval: true,
  notifyHoursBeforeRelease: 24,
  holdLargePaymentsThreshold: 25000,
});

function normaliseNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

async function resolveAgencyWorkspace({ workspaceId, workspaceSlug } = {}, { actorId, actorRole } = {}) {
  if (!actorId) {
    throw new AuthenticationError('Authentication is required.');
  }

  const normalizedRole = typeof actorRole === 'string' ? actorRole.toLowerCase() : null;
  if (!AGENCY_ALLOWED_ROLES.has(normalizedRole)) {
    throw new AuthorizationError('You do not have permission to manage agency escrow.');
  }

  const baseWhere = { type: 'agency' };
  let workspace = null;

  if (workspaceId || workspaceSlug) {
    const where = { ...baseWhere };
    if (workspaceId) {
      where.id = workspaceId;
    }
    if (workspaceSlug) {
      where.slug = workspaceSlug;
    }
    workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
  } else if (normalizedRole === 'admin') {
    workspace = await ProviderWorkspace.findOne({
      where: baseWhere,
      order: [['createdAt', 'ASC']],
    });
    if (!workspace) {
      throw new NotFoundError('No agency workspace is registered yet.');
    }
  } else {
    workspace = await ProviderWorkspace.findOne({
      where: { ...baseWhere, ownerId: actorId },
      order: [['createdAt', 'ASC']],
    });

    if (!workspace) {
      const membership = await ProviderWorkspaceMember.findOne({
        where: { userId: actorId },
        include: [
          {
            model: ProviderWorkspace,
            as: 'workspace',
            where: baseWhere,
            required: true,
          },
        ],
        order: [['createdAt', 'ASC']],
      });
      workspace = membership?.workspace ?? null;
    }

    if (!workspace) {
      throw new AuthorizationError('No agency workspace is linked to your account yet.');
    }
  }

  if (normalizedRole !== 'admin' && workspace.ownerId !== actorId) {
    const membershipCount = await ProviderWorkspaceMember.count({
      where: { workspaceId: workspace.id, userId: actorId },
    });

    if (membershipCount === 0) {
      throw new AuthorizationError('You do not have access to this workspace.');
    }
  }

  return workspace;
}

function mergeEscrowSettings(existingSettings) {
  const escrowSettings = existingSettings?.escrow ?? existingSettings ?? {};
  return {
    ...DEFAULT_ESCROW_SETTINGS,
    ...escrowSettings,
    autoReleaseEnabled:
      escrowSettings?.autoReleaseEnabled ?? escrowSettings?.autoRelease ?? DEFAULT_ESCROW_SETTINGS.autoReleaseEnabled,
  };
}

function summariseTransactions(transactions = []) {
  const summary = {
    totals: {
      inEscrow: 0,
      released: 0,
      refunded: 0,
      feesCollected: 0,
    },
    counts: {
      awaitingRelease: 0,
      released: 0,
      refunded: 0,
      disputed: 0,
    },
    currencyTotals: new Map(),
    upcoming: [],
    agingBuckets: {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    },
    trailingVolume: {
      last30Days: 0,
      last90Days: 0,
      yearToDate: 0,
    },
  };

  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const startYear = new Date(now.getFullYear(), 0, 1);

  transactions.forEach((transaction) => {
    const amount = normaliseNumber(transaction.amount);
    const fee = normaliseNumber(transaction.feeAmount);
    const status = String(transaction.status ?? '').toLowerCase();
    const currency = transaction.currencyCode ?? 'USD';
    const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : null;
    const scheduled = transaction.scheduledReleaseAt ? new Date(transaction.scheduledReleaseAt) : null;

    if (!summary.currencyTotals.has(currency)) {
      summary.currencyTotals.set(currency, {
        currency,
        inEscrow: 0,
        released: 0,
        refunded: 0,
      });
    }
    const currencyBucket = summary.currencyTotals.get(currency);

    const openStatuses = new Set(['in_escrow', 'funded', 'pending_release', 'held']);
    const releasedStatuses = new Set(['released', 'completed']);

    if (openStatuses.has(status)) {
      summary.totals.inEscrow += amount;
      summary.counts.awaitingRelease += 1;
      currencyBucket.inEscrow += amount;
      if (scheduled && !Number.isNaN(scheduled.getTime())) {
        summary.upcoming.push({
          id: transaction.id,
          reference: transaction.reference,
          amount,
          currencyCode: currency,
          scheduledReleaseAt: scheduled,
          counterpartyId: transaction.counterpartyId ?? null,
          milestoneLabel: transaction.milestoneLabel ?? null,
        });
      }
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays <= 30) {
          summary.agingBuckets['0-30'] += amount;
        } else if (ageDays <= 60) {
          summary.agingBuckets['31-60'] += amount;
        } else if (ageDays <= 90) {
          summary.agingBuckets['61-90'] += amount;
        } else {
          summary.agingBuckets['90+'] += amount;
        }
      }
    } else if (releasedStatuses.has(status)) {
      summary.totals.released += amount;
      summary.counts.released += 1;
      currencyBucket.released += amount;
      summary.totals.feesCollected += fee;
    } else if (status === 'refunded' || status === 'cancelled' || status === 'voided') {
      summary.totals.refunded += amount;
      summary.counts.refunded += 1;
      currencyBucket.refunded += amount;
    } else if (status === 'disputed') {
      summary.counts.disputed += 1;
      summary.upcoming.push({
        id: transaction.id,
        reference: transaction.reference,
        amount,
        currencyCode: currency,
        scheduledReleaseAt: null,
        counterpartyId: transaction.counterpartyId ?? null,
        milestoneLabel: transaction.milestoneLabel ?? 'Dispute in progress',
      });
    }

    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      if (createdAt >= start30) {
        summary.trailingVolume.last30Days += amount;
      }
      if (createdAt >= start90) {
        summary.trailingVolume.last90Days += amount;
      }
      if (createdAt >= startYear) {
        summary.trailingVolume.yearToDate += amount;
      }
    }
  });

  summary.currencyTotals = Array.from(summary.currencyTotals.values());
  summary.upcoming = summary.upcoming
    .filter((item) => !item.scheduledReleaseAt || !Number.isNaN(item.scheduledReleaseAt.getTime()))
    .sort((a, b) => {
      if (!a.scheduledReleaseAt && !b.scheduledReleaseAt) {
        return 0;
      }
      if (!a.scheduledReleaseAt) {
        return 1;
      }
      if (!b.scheduledReleaseAt) {
        return -1;
      }
      return a.scheduledReleaseAt.getTime() - b.scheduledReleaseAt.getTime();
    })
    .slice(0, 12)
    .map((item) => ({
      ...item,
      scheduledReleaseAt: item.scheduledReleaseAt ? item.scheduledReleaseAt.toISOString() : null,
    }));

  return summary;
}

async function fetchWorkspaceAccounts(workspace) {
  const ownerId = workspace.ownerId;
  const accounts = await EscrowAccount.findAll({
    where: { userId: ownerId },
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });
  return accounts.map((account) => account.toPublicObject());
}

async function fetchWorkspaceTransactions(accountIds, { limit = 200, since } = {}) {
  if (!accountIds.length) {
    return [];
  }
  const where = { accountId: { [Op.in]: accountIds } };
  if (since) {
    const sinceDate = new Date(since);
    if (!Number.isNaN(sinceDate.getTime())) {
      where.createdAt = { [Op.gte]: sinceDate };
    }
  }

  const rows = await EscrowTransaction.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 200, 50), 500),
  });
  return rows.map((row) => row.toPublicObject());
}

export async function getEscrowOverview(query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const accounts = await fetchWorkspaceAccounts(workspace);
  const transactions = await fetchWorkspaceTransactions(accounts.map((account) => account.id));
  const summary = summariseTransactions(transactions);
  const settings = mergeEscrowSettings(workspace.settings ?? {});

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    },
    accountsSummary: {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter((account) => account.status === 'active').length,
      currencies: Array.from(new Set(accounts.map((account) => account.currencyCode ?? 'USD'))),
    },
    summary,
    settings,
    recentTransactions: transactions.slice(0, 6),
  };
}

export async function listEscrowAccounts(query = {}, actor = {}) {
  const { status, provider, search, limit = 25, offset = 0 } = query;
  const workspace = await resolveAgencyWorkspace(query, actor);
  const ownerId = workspace.ownerId;

  const where = { userId: ownerId };
  if (status) {
    where.status = status;
  }
  if (provider) {
    where.provider = provider;
  }

  const searchFilters = [];
  if (search) {
    const trimmed = String(search).trim();
    if (trimmed) {
      searchFilters.push({ provider: { [LIKE_OPERATOR]: `%${trimmed}%` } });
      searchFilters.push({ externalId: { [LIKE_OPERATOR]: `%${trimmed}%` } });
      searchFilters.push({ currencyCode: { [LIKE_OPERATOR]: `%${trimmed.toUpperCase()}%` } });
    }
  }

  if (searchFilters.length) {
    where[Op.or] = searchFilters;
  }

  const numericLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const numericOffset = Math.max(Number(offset) || 0, 0);

  const { rows, count } = await EscrowAccount.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: numericLimit,
    offset: numericOffset,
  });

  const accounts = rows.map((row) => {
    const account = row.toPublicObject();
    const owner = row.owner ? row.owner.get({ plain: true }) : null;
    return {
      ...account,
      owner: owner
        ? {
            id: owner.id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
          }
        : null,
    };
  });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
    },
    accounts,
    pagination: {
      total: count,
      limit: numericLimit,
      offset: numericOffset,
    },
  };
}

function ensureAccountBelongsToWorkspace(account, workspace) {
  if (!account) {
    throw new NotFoundError('Escrow account not found.');
  }
  if (account.userId !== workspace.ownerId) {
    throw new AuthorizationError('This escrow account is not managed by the selected workspace.');
  }
}

export async function createEscrowAccountForWorkspace(payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const { provider, currencyCode = 'USD', metadata } = payload;

  if (!provider) {
    throw new ValidationError('Provider is required.');
  }

  const account = await ensureEscrowAccount({
    userId: workspace.ownerId,
    provider,
    currencyCode,
    metadata,
  });

  return {
    account,
  };
}

export async function updateEscrowAccountForWorkspace(accountId, payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const account = await EscrowAccount.findByPk(accountId);
  ensureAccountBelongsToWorkspace(account, workspace);

  const updates = {};
  if (payload.status) {
    updates.status = payload.status;
  }
  if (payload.currencyCode) {
    updates.currencyCode = payload.currencyCode;
  }
  if (payload.lastReconciledAt) {
    const reconciled = new Date(payload.lastReconciledAt);
    if (!Number.isNaN(reconciled.getTime())) {
      updates.lastReconciledAt = reconciled;
    }
  }
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }

  if (Object.keys(updates).length === 0) {
    return { account: account.toPublicObject() };
  }

  await account.update(updates);
  return { account: account.toPublicObject() };
}

export async function listEscrowTransactions(query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const { status, type, search, from, to, limit = 50, offset = 0 } = query;
  const accounts = await fetchWorkspaceAccounts(workspace);
  const accountIds = accounts.map((account) => account.id);
  if (!accountIds.length) {
    return { transactions: [], pagination: { total: 0, limit: Number(limit) || 50, offset: 0 } };
  }

  const where = { accountId: { [Op.in]: accountIds } };
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        where.createdAt[Op.gte] = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        where.createdAt[Op.lte] = toDate;
      }
    }
    if (!Object.keys(where.createdAt).length) {
      delete where.createdAt;
    }
  }

  const numericLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const numericOffset = Math.max(Number(offset) || 0, 0);

  const searchFilters = [];
  if (search) {
    const trimmed = String(search).trim();
    if (trimmed) {
      searchFilters.push({ reference: { [LIKE_OPERATOR]: `%${trimmed}%` } });
      searchFilters.push({ milestoneLabel: { [LIKE_OPERATOR]: `%${trimmed}%` } });
    }
  }
  if (searchFilters.length) {
    where[Op.or] = searchFilters;
  }

  const { rows, count } = await EscrowTransaction.findAndCountAll({
    where,
    include: [
      { model: EscrowAccount, as: 'account', attributes: ['id', 'provider', 'currencyCode', 'status'] },
      { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: numericLimit,
    offset: numericOffset,
  });

  const transactions = rows.map((row) => {
    const transaction = row.toPublicObject();
    const account = row.account ? row.account.toPublicObject?.() ?? row.account.get?.({ plain: true }) : null;
    const initiator = row.initiator ? row.initiator.get({ plain: true }) : null;
    const counterparty = row.counterparty ? row.counterparty.get({ plain: true }) : null;
    return {
      ...transaction,
      account,
      initiator,
      counterparty,
    };
  });

  return {
    transactions,
    pagination: {
      total: count,
      limit: numericLimit,
      offset: numericOffset,
    },
  };
}

function ensureTransactionBelongsToWorkspace(transaction, workspace) {
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found.');
  }
  if (!transaction.accountId) {
    throw new AuthorizationError('Escrow transaction is missing an account.');
  }
  if (transaction.account?.userId && transaction.account.userId !== workspace.ownerId) {
    throw new AuthorizationError('This escrow transaction is not managed by the selected workspace.');
  }
}

export async function createEscrowTransactionForWorkspace(payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const {
    accountId,
    reference,
    amount,
    currencyCode,
    feeAmount,
    type,
    counterpartyId,
    projectId,
    gigId,
    milestoneLabel,
    scheduledReleaseAt,
    metadata,
  } = payload;

  if (!accountId || !reference || !amount) {
    throw new ValidationError('accountId, reference, and amount are required.');
  }

  const account = await EscrowAccount.findByPk(accountId);
  ensureAccountBelongsToWorkspace(account, workspace);

  const initiatorId = actor.actorId ?? actor.userId ?? actor.id ?? workspace.ownerId;

  const transaction = await initiateEscrowTransaction({
    accountId,
    reference,
    amount,
    currencyCode,
    feeAmount,
    type,
    initiatedById: initiatorId,
    counterpartyId,
    projectId,
    gigId,
    milestoneLabel,
    scheduledReleaseAt,
    metadata,
  });

  return { transaction };
}

export async function updateEscrowTransactionDetails(transactionId, payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const transaction = await EscrowTransaction.findByPk(transactionId, {
    include: [{ model: EscrowAccount, as: 'account', attributes: ['id', 'userId'] }],
  });
  ensureTransactionBelongsToWorkspace(transaction, workspace);

  const updates = {};
  if (payload.scheduledReleaseAt) {
    const releaseDate = new Date(payload.scheduledReleaseAt);
    if (!Number.isNaN(releaseDate.getTime())) {
      updates.scheduledReleaseAt = releaseDate;
    }
  }
  if (payload.milestoneLabel != null) {
    updates.milestoneLabel = payload.milestoneLabel;
  }
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }

  if (!Object.keys(updates).length) {
    return { transaction: transaction.toPublicObject() };
  }

  await transaction.update(updates);
  return { transaction: transaction.toPublicObject() };
}

export async function releaseEscrowForWorkspace(transactionId, payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const transaction = await EscrowTransaction.findByPk(transactionId, {
    include: [{ model: EscrowAccount, as: 'account', attributes: ['id', 'userId'] }],
  });
  ensureTransactionBelongsToWorkspace(transaction, workspace);

  const releasePayload = {
    ...payload,
    actorId: payload.actorId ?? actor.actorId ?? actor.userId ?? actor.id ?? workspace.ownerId,
  };

  const result = await releaseEscrowTransaction(transactionId, releasePayload);
  return { transaction: result };
}

export async function refundEscrowForWorkspace(transactionId, payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const transaction = await EscrowTransaction.findByPk(transactionId, {
    include: [{ model: EscrowAccount, as: 'account', attributes: ['id', 'userId'] }],
  });
  ensureTransactionBelongsToWorkspace(transaction, workspace);

  const refundPayload = {
    ...payload,
    actorId: payload.actorId ?? actor.actorId ?? actor.userId ?? actor.id ?? workspace.ownerId,
  };

  const result = await refundEscrowTransaction(transactionId, refundPayload);
  return { transaction: result };
}

export async function updateEscrowSettingsForWorkspace(payload = {}, query = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(query, actor);
  const nextEscrowSettings = mergeEscrowSettings(payload);
  const nextSettings = {
    ...(workspace.settings ?? {}),
    escrow: nextEscrowSettings,
  };

  await workspace.update({ settings: nextSettings });

  return {
    settings: nextEscrowSettings,
  };
}

export default {
  getEscrowOverview,
  listEscrowAccounts,
  createEscrowAccountForWorkspace,
  updateEscrowAccountForWorkspace,
  listEscrowTransactions,
  createEscrowTransactionForWorkspace,
  updateEscrowTransactionDetails,
  releaseEscrowForWorkspace,
  refundEscrowForWorkspace,
  updateEscrowSettingsForWorkspace,
};
