import { Op, fn, col } from 'sequelize';
import {
  EscrowAccount,
  EscrowTransaction,
  EscrowReleasePolicy,
  EscrowFeeTier,
  DisputeCase,
  User,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_TRANSACTION_STATUSES,
  ESCROW_INTEGRATION_PROVIDERS,
  ESCROW_RELEASE_POLICY_TYPES,
  ESCROW_RELEASE_POLICY_STATUSES,
  ESCROW_FEE_TIER_STATUSES,
} from '../models/index.js';
import { getPlatformSettings, updatePlatformSettings } from './platformSettingsService.js';
import {
  ensureEscrowAccount,
  releaseEscrowTransaction,
  refundEscrowTransaction,
} from './trustService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const ACTIVE_TRANSACTION_STATUSES = new Set(['initiated', 'funded', 'in_escrow', 'disputed']);
const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveInteger(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function parseNonNegativeNumber(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return numeric;
}

function normaliseEnum(value, allowedValues, fallback) {
  if (!value) {
    return fallback;
  }
  const lowered = `${value}`.toLowerCase();
  const match = allowedValues.find((candidate) => candidate === lowered);
  return match ?? fallback;
}

function serialiseUser(userInstance) {
  if (!userInstance) {
    return null;
  }
  const plain = userInstance.get({ plain: true });
  return {
    id: plain.id,
    email: plain.email,
    firstName: plain.firstName,
    lastName: plain.lastName,
  };
}

function serialiseAccount(accountInstance) {
  if (!accountInstance) {
    return null;
  }
  const base = accountInstance.toPublicObject();
  return {
    ...base,
    owner: serialiseUser(accountInstance.owner ?? null),
  };
}

function serialiseTransaction(transactionInstance) {
  if (!transactionInstance) {
    return null;
  }
  const base = transactionInstance.toPublicObject();
  return {
    ...base,
    account: transactionInstance.account ? serialiseAccount(transactionInstance.account) : null,
    initiator: serialiseUser(transactionInstance.initiator ?? null),
    counterparty: serialiseUser(transactionInstance.counterparty ?? null),
  };
}

function buildPaginationMeta(page, pageSize, totalItems) {
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

async function computeEscrowSummary(lookbackDays = DEFAULT_LOOKBACK_DAYS) {
  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const [volumeRow, accountTotalsRow, recentReleases, outstandingTransactions, openDisputes] = await Promise.all([
    EscrowTransaction.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'grossVolume'],
        [fn('COALESCE', fn('SUM', col('netAmount')), 0), 'netVolume'],
        [fn('COALESCE', fn('SUM', col('feeAmount')), 0), 'feeVolume'],
      ],
      where: { createdAt: { [Op.gte]: lookbackDate } },
      raw: true,
    }),
    EscrowAccount.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('currentBalance')), 0), 'currentBalance'],
        [fn('COALESCE', fn('SUM', col('pendingReleaseTotal')), 0), 'pendingReleaseTotal'],
      ],
      raw: true,
    }),
    EscrowTransaction.findAll({
      attributes: ['createdAt', 'releasedAt'],
      where: {
        releasedAt: { [Op.ne]: null },
        createdAt: { [Op.gte]: lookbackDate },
      },
      limit: 250,
      order: [['releasedAt', 'DESC']],
    }),
    EscrowTransaction.count({
      where: {
        status: { [Op.in]: Array.from(ACTIVE_TRANSACTION_STATUSES) },
      },
    }),
    DisputeCase.count({
      where: { status: { [Op.ne]: 'closed' } },
    }),
  ]);

  const averageReleaseHours = (() => {
    if (!Array.isArray(recentReleases) || !recentReleases.length) {
      return 0;
    }
    let totalMillis = 0;
    let count = 0;
    recentReleases.forEach((release) => {
      if (!release.releasedAt || !release.createdAt) {
        return;
      }
      const releasedAt = new Date(release.releasedAt);
      const createdAt = new Date(release.createdAt);
      if (Number.isNaN(releasedAt.getTime()) || Number.isNaN(createdAt.getTime())) {
        return;
      }
      if (releasedAt.getTime() <= createdAt.getTime()) {
        return;
      }
      totalMillis += releasedAt.getTime() - createdAt.getTime();
      count += 1;
    });
    if (!count) {
      return 0;
    }
    return Math.round((totalMillis / count / (1000 * 60 * 60)) * 10) / 10;
  })();

  return {
    grossVolume: Number.parseFloat(volumeRow?.grossVolume ?? 0),
    netVolume: Number.parseFloat(volumeRow?.netVolume ?? 0),
    feeVolume: Number.parseFloat(volumeRow?.feeVolume ?? 0),
    currentBalance: Number.parseFloat(accountTotalsRow?.currentBalance ?? 0),
    pendingReleaseTotal: Number.parseFloat(accountTotalsRow?.pendingReleaseTotal ?? 0),
    outstandingTransactions,
    openDisputes,
    averageReleaseHours,
  };
}

function buildAccountWhereClause(filters = {}) {
  const where = {};
  const status = normaliseEnum(filters.status, ESCROW_ACCOUNT_STATUSES, null);
  if (status) {
    where.status = status;
  }
  const provider = normaliseEnum(filters.provider, ESCROW_INTEGRATION_PROVIDERS, null);
  if (provider) {
    where.provider = provider;
  }
  return where;
}

function buildAccountInclude(filters = {}) {
  const searchTerm = filters.search ? `${filters.search}`.trim() : '';
  if (!searchTerm) {
    return [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }];
  }
  return [
    {
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      where: {
        [Op.or]: [
          { email: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
          { firstName: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
        ],
      },
      required: true,
    },
  ];
}

export async function listEscrowAccounts(filters = {}) {
  const page = parsePositiveInteger(filters.page, 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parsePositiveInteger(filters.pageSize, DEFAULT_PAGE_SIZE)),
  );
  const offset = (page - 1) * pageSize;

  const where = buildAccountWhereClause(filters);
  const include = buildAccountInclude(filters);

  const { rows, count } = await EscrowAccount.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((row) => serialiseAccount(row)),
    pagination: buildPaginationMeta(page, pageSize, count),
  };
}

function buildTransactionWhereClause(filters = {}) {
  const where = {};
  const status = normaliseEnum(filters.status, ESCROW_TRANSACTION_STATUSES, null);
  if (status) {
    where.status = status;
  }
  if (filters.reference) {
    where.reference = `${filters.reference}`.trim();
  }
  const type = filters.type ? `${filters.type}`.trim().toLowerCase() : '';
  if (type && ['project', 'gig', 'milestone', 'retainer'].includes(type)) {
    where.type = type;
  }
  if (filters.accountId) {
    const accountId = parsePositiveInteger(filters.accountId, null);
    if (accountId) {
      where.accountId = accountId;
    }
  }
  if (filters.minAmount != null) {
    const minAmount = parseNonNegativeNumber(filters.minAmount, null);
    if (minAmount != null) {
      where.amount = { ...(where.amount ?? {}), [Op.gte]: minAmount };
    }
  }
  if (filters.maxAmount != null) {
    const maxAmount = parseNonNegativeNumber(filters.maxAmount, null);
    if (maxAmount != null) {
      where.amount = { ...(where.amount ?? {}), [Op.lte]: maxAmount };
    }
  }
  return where;
}

export async function listEscrowTransactions(filters = {}) {
  const page = parsePositiveInteger(filters.page, 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parsePositiveInteger(filters.pageSize, DEFAULT_PAGE_SIZE)),
  );
  const offset = (page - 1) * pageSize;

  const where = buildTransactionWhereClause(filters);

  const { rows, count } = await EscrowTransaction.findAndCountAll({
    where,
    include: [
      { model: EscrowAccount, as: 'account', include: [{ model: User, as: 'owner' }] },
      { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((row) => serialiseTransaction(row)),
    pagination: buildPaginationMeta(page, pageSize, count),
  };
}

export async function getEscrowOverview(options = {}) {
  const lookbackDays = parsePositiveInteger(options.lookbackDays, DEFAULT_LOOKBACK_DAYS);
  const [settings, summary, accounts, transactions, feeTiers, policies] = await Promise.all([
    getPlatformSettings(),
    computeEscrowSummary(lookbackDays),
    listEscrowAccounts(options.accounts ?? {}),
    listEscrowTransactions(options.transactions ?? {}),
    EscrowFeeTier.findAll({ order: [['minimumAmount', 'ASC'], ['id', 'ASC']] }),
    EscrowReleasePolicy.findAll({ order: [['orderIndex', 'ASC'], ['id', 'ASC']] }),
  ]);

  return {
    lookbackDays,
    summary,
    providerSettings: settings.payments,
    accounts,
    transactions,
    feeTiers: feeTiers.map((tier) => tier.toPublicObject()),
    releasePolicies: policies.map((policy) => policy.toPublicObject()),
  };
}

export async function listEscrowFeeTiers() {
  const tiers = await EscrowFeeTier.findAll({
    order: [['minimumAmount', 'ASC'], ['id', 'ASC']],
  });
  return tiers.map((tier) => tier.toPublicObject());
}

export async function listEscrowReleasePolicies() {
  const policies = await EscrowReleasePolicy.findAll({
    order: [['orderIndex', 'ASC'], ['id', 'ASC']],
  });
  return policies.map((policy) => policy.toPublicObject());
}

export async function createEscrowAccountForUser(payload = {}) {
  const userId = parsePositiveInteger(payload.userId, null);
  const provider = normaliseEnum(payload.provider, ESCROW_INTEGRATION_PROVIDERS, null);
  if (!userId || !provider) {
    throw new ValidationError('userId and provider are required to create an escrow account.');
  }
  const account = await ensureEscrowAccount({
    userId,
    provider,
    currencyCode: payload.currencyCode ?? 'USD',
    metadata: payload.metadata ?? null,
  });
  return account;
}

export async function updateEscrowAccount(accountId, payload = {}) {
  const id = parsePositiveInteger(accountId, null);
  if (!id) {
    throw new ValidationError('A valid account id is required.');
  }
  const account = await EscrowAccount.findByPk(id, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!account) {
    throw new NotFoundError('Escrow account not found.');
  }

  const updates = {};
  if (payload.status) {
    const status = normaliseEnum(payload.status, ESCROW_ACCOUNT_STATUSES, null);
    if (!status) {
      throw new ValidationError(`status must be one of: ${ESCROW_ACCOUNT_STATUSES.join(', ')}.`);
    }
    updates.status = status;
  }
  if (payload.currencyCode) {
    const currency = `${payload.currencyCode}`.trim().toUpperCase();
    if (currency.length !== 3) {
      throw new ValidationError('currencyCode must be a 3-letter ISO currency code.');
    }
    updates.currencyCode = currency;
  }
  if (payload.pendingReleaseTotal != null) {
    const pending = parseNonNegativeNumber(payload.pendingReleaseTotal, null);
    if (pending == null) {
      throw new ValidationError('pendingReleaseTotal must be a positive number.');
    }
    updates.pendingReleaseTotal = pending;
  }
  if (payload.currentBalance != null) {
    const balance = parseNonNegativeNumber(payload.currentBalance, null);
    if (balance == null) {
      throw new ValidationError('currentBalance must be a positive number.');
    }
    updates.currentBalance = balance;
  }
  if (payload.metadata != null) {
    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object.');
    }
    updates.metadata = payload.metadata ?? null;
  }
  if (payload.lastReconciledAt) {
    const reconciledAt = new Date(payload.lastReconciledAt);
    if (Number.isNaN(reconciledAt.getTime())) {
      throw new ValidationError('lastReconciledAt must be a valid ISO date.');
    }
    updates.lastReconciledAt = reconciledAt;
  }

  if (!Object.keys(updates).length) {
    return serialiseAccount(account);
  }

  await account.update(updates);
  await account.reload({
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  return serialiseAccount(account);
}

export async function updateEscrowTransactionRecord(transactionId, payload = {}) {
  const id = parsePositiveInteger(transactionId, null);
  if (!id) {
    throw new ValidationError('A valid transaction id is required.');
  }
  const transaction = await EscrowTransaction.findByPk(id, {
    include: [
      { model: EscrowAccount, as: 'account', include: [{ model: User, as: 'owner' }] },
      { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found.');
  }

  const updates = {};
  if (payload.status) {
    const status = normaliseEnum(payload.status, ESCROW_TRANSACTION_STATUSES, null);
    if (!status) {
      throw new ValidationError(
        `status must be one of: ${ESCROW_TRANSACTION_STATUSES.join(', ')}.`,
      );
    }
    if (['released', 'refunded'].includes(status)) {
      throw new ValidationError('Use the release/refund endpoints to settle funds.');
    }
    updates.status = status;
  }
  if (payload.scheduledReleaseAt != null) {
    if (!payload.scheduledReleaseAt) {
      updates.scheduledReleaseAt = null;
    } else {
      const schedule = new Date(payload.scheduledReleaseAt);
      if (Number.isNaN(schedule.getTime())) {
        throw new ValidationError('scheduledReleaseAt must be a valid ISO date.');
      }
      updates.scheduledReleaseAt = schedule;
    }
  }
  if (payload.metadata != null) {
    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object.');
    }
    updates.metadata = payload.metadata ?? null;
  }
  if (payload.auditTrail != null) {
    if (!Array.isArray(payload.auditTrail)) {
      throw new ValidationError('auditTrail must be an array of entries.');
    }
    updates.auditTrail = payload.auditTrail;
  }

  if (!Object.keys(updates).length) {
    return serialiseTransaction(transaction);
  }

  await transaction.update(updates);
  await transaction.reload({
    include: [
      { model: EscrowAccount, as: 'account', include: [{ model: User, as: 'owner' }] },
      { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  return serialiseTransaction(transaction);
}

export async function releaseEscrow(transactionId, payload = {}) {
  return releaseEscrowTransaction(transactionId, payload);
}

export async function refundEscrow(transactionId, payload = {}) {
  return refundEscrowTransaction(transactionId, payload);
}

export async function updateProviderSettings(payload = {}) {
  const settings = await updatePlatformSettings({ payments: payload });
  return settings.payments;
}

function normaliseTierPayload(payload = {}) {
  const provider = normaliseEnum(payload.provider, ESCROW_INTEGRATION_PROVIDERS, 'stripe');
  const status = normaliseEnum(payload.status, ESCROW_FEE_TIER_STATUSES, 'active');
  const currencyCode = payload.currencyCode
    ? `${payload.currencyCode}`.trim().toUpperCase()
    : 'USD';
  if (currencyCode.length !== 3) {
    throw new ValidationError('currencyCode must be a 3-letter ISO currency code.');
  }
  return {
    provider,
    status,
    currencyCode,
    minimumAmount: parseNonNegativeNumber(payload.minimumAmount, 0),
    maximumAmount:
      payload.maximumAmount != null ? parseNonNegativeNumber(payload.maximumAmount, null) : null,
    percentFee: parseNonNegativeNumber(payload.percentFee, 0),
    flatFee: parseNonNegativeNumber(payload.flatFee, 0),
    label: payload.label ?? null,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  };
}

export async function createEscrowFeeTier(payload = {}) {
  const prepared = normaliseTierPayload(payload);
  const tier = await EscrowFeeTier.create(prepared);
  return tier.toPublicObject();
}

export async function updateEscrowFeeTier(tierId, payload = {}) {
  const id = parsePositiveInteger(tierId, null);
  if (!id) {
    throw new ValidationError('A valid fee tier id is required.');
  }
  const tier = await EscrowFeeTier.findByPk(id);
  if (!tier) {
    throw new NotFoundError('Escrow fee tier not found.');
  }
  const prepared = normaliseTierPayload({ ...tier.toPublicObject(), ...payload });
  await tier.update(prepared);
  return tier.toPublicObject();
}

export async function deleteEscrowFeeTier(tierId) {
  const id = parsePositiveInteger(tierId, null);
  if (!id) {
    throw new ValidationError('A valid fee tier id is required.');
  }
  const tier = await EscrowFeeTier.findByPk(id);
  if (!tier) {
    throw new NotFoundError('Escrow fee tier not found.');
  }
  await tier.destroy();
  return { success: true };
}

function normalisePolicyPayload(payload = {}) {
  const policyType = normaliseEnum(
    payload.policyType,
    ESCROW_RELEASE_POLICY_TYPES,
    'auto_release_after_hours',
  );
  const status = normaliseEnum(payload.status, ESCROW_RELEASE_POLICY_STATUSES, 'draft');
  const orderIndex = parsePositiveInteger(payload.orderIndex, 1) - 1;
  return {
    name: payload.name ? `${payload.name}`.trim() : 'Policy',
    policyType,
    status,
    thresholdAmount:
      payload.thresholdAmount != null
        ? parseNonNegativeNumber(payload.thresholdAmount, null)
        : null,
    thresholdHours:
      payload.thresholdHours != null
        ? parsePositiveInteger(payload.thresholdHours, null)
        : null,
    requiresComplianceHold: Boolean(payload.requiresComplianceHold),
    requiresManualApproval: Boolean(payload.requiresManualApproval),
    notifyEmails: Array.isArray(payload.notifyEmails)
      ? payload.notifyEmails.map((email) => `${email}`.trim()).filter(Boolean)
      : [],
    description: payload.description ? `${payload.description}`.trim() : null,
    orderIndex: Number.isFinite(orderIndex) && orderIndex >= 0 ? orderIndex : 0,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  };
}

export async function createEscrowReleasePolicy(payload = {}) {
  const prepared = normalisePolicyPayload(payload);
  const policy = await EscrowReleasePolicy.create(prepared);
  return policy.toPublicObject();
}

export async function updateEscrowReleasePolicy(policyId, payload = {}) {
  const id = parsePositiveInteger(policyId, null);
  if (!id) {
    throw new ValidationError('A valid release policy id is required.');
  }
  const policy = await EscrowReleasePolicy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Escrow release policy not found.');
  }
  const prepared = normalisePolicyPayload({ ...policy.toPublicObject(), ...payload });
  await policy.update(prepared);
  return policy.toPublicObject();
}

export async function deleteEscrowReleasePolicy(policyId) {
  const id = parsePositiveInteger(policyId, null);
  if (!id) {
    throw new ValidationError('A valid release policy id is required.');
  }
  const policy = await EscrowReleasePolicy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Escrow release policy not found.');
  }
  await policy.destroy();
  return { success: true };
}

export default {
  getEscrowOverview,
  listEscrowAccounts,
  listEscrowTransactions,
  createEscrowAccountForUser,
  updateEscrowAccount,
  updateEscrowTransactionRecord,
  releaseEscrow,
  refundEscrow,
  updateProviderSettings,
  listEscrowFeeTiers,
  createEscrowFeeTier,
  updateEscrowFeeTier,
  deleteEscrowFeeTier,
  listEscrowReleasePolicies,
  createEscrowReleasePolicy,
  updateEscrowReleasePolicy,
  deleteEscrowReleasePolicy,
};
