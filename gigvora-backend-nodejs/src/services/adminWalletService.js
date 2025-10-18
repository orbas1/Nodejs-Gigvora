import { Op, ValidationError as SequelizeValidationError } from 'sequelize';
import {
  WalletAccount,
  WalletLedgerEntry,
  User,
  Profile,
  sequelize,
  WALLET_ACCOUNT_STATUSES,
  WALLET_ACCOUNT_TYPES,
  ESCROW_INTEGRATION_PROVIDERS,
  WALLET_LEDGER_ENTRY_TYPES,
} from '../models/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import { ensureWalletAccount, recordWalletLedgerEntry } from './complianceService.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const LIKE_OPERATOR = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

function parseId(value, label = 'id') {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function coerceMetadata(metadata) {
  if (metadata == null) {
    return null;
  }
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new ValidationError('metadata must be an object.');
  }
  return { ...metadata };
}

function toAccountResponse(account) {
  const base = account.toPublicObject();
  if (account.user) {
    const plainUser = account.user.get({ plain: true });
    base.user = {
      id: plainUser.id,
      email: plainUser.email,
      firstName: plainUser.firstName,
      lastName: plainUser.lastName,
      userType: plainUser.userType,
      role: plainUser.role ?? plainUser.userType,
    };
  }
  if (account.profile) {
    const plainProfile = account.profile.get({ plain: true });
    base.profile = {
      id: plainProfile.id,
      headline: plainProfile.headline,
      location: plainProfile.location,
      timezone: plainProfile.timezone,
      availabilityStatus: plainProfile.availabilityStatus,
    };
  }
  return base;
}

function toLedgerEntryResponse(entry) {
  const plain = entry.get({ plain: true });
  return {
    id: plain.id,
    walletAccountId: plain.walletAccountId,
    entryType: plain.entryType,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    reference: plain.reference,
    externalReference: plain.externalReference,
    description: plain.description,
    initiatedById: plain.initiatedById,
    occurredAt: plain.occurredAt,
    balanceAfter: Number.parseFloat(plain.balanceAfter ?? 0),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    initiatedBy: entry.initiatedBy
      ? {
          id: entry.initiatedBy.id,
          email: entry.initiatedBy.email,
          firstName: entry.initiatedBy.firstName,
          lastName: entry.initiatedBy.lastName,
        }
      : null,
  };
}

function normalisePagination(page, pageSize) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const limit = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const offset = (currentPage - 1) * limit;
  return { page: currentPage, pageSize: limit, offset };
}

async function buildSummary(where = {}) {
  const [totalsRow, statusRows, typeRows] = await Promise.all([
    WalletAccount.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('WalletAccount.id')), 'count'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('WalletAccount.currentBalance')), 0), 'currentBalance'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('WalletAccount.availableBalance')), 0), 'availableBalance'],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('WalletAccount.pendingHoldBalance')), 0),
          'pendingHoldBalance',
        ],
      ],
      where,
      raw: true,
    }).then((rows) => rows[0] ?? {}),
    WalletAccount.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where,
      group: ['status'],
      raw: true,
    }),
    WalletAccount.findAll({
      attributes: ['accountType', [sequelize.fn('COUNT', sequelize.col('accountType')), 'count']],
      where,
      group: ['accountType'],
      raw: true,
    }),
  ]);

  const byStatus = statusRows.reduce((acc, row) => {
    acc[row.status] = Number.parseInt(row.count, 10) || 0;
    return acc;
  }, {});

  const byType = typeRows.reduce((acc, row) => {
    acc[row.accountType] = Number.parseInt(row.count, 10) || 0;
    return acc;
  }, {});

  return {
    totals: {
      accounts: Number.parseInt(totalsRow.count, 10) || 0,
      currentBalance: Number.parseFloat(totalsRow.currentBalance ?? 0),
      availableBalance: Number.parseFloat(totalsRow.availableBalance ?? 0),
      pendingHoldBalance: Number.parseFloat(totalsRow.pendingHoldBalance ?? 0),
    },
    byStatus,
    byType,
  };
}

export async function listWalletAccounts(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.accountType) {
    where.accountType = filters.accountType;
  }
  if (filters.custodyProvider) {
    where.custodyProvider = filters.custodyProvider;
  }
  if (filters.currency) {
    where.currencyCode = filters.currency;
  }
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.profileId) {
    where.profileId = filters.profileId;
  }

  const include = [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'firstName', 'lastName', 'userType', 'role'],
      required: false,
    },
    {
      model: Profile,
      as: 'profile',
      attributes: ['id', 'headline', 'location', 'timezone', 'availabilityStatus'],
      required: false,
    },
  ];

  const searchTerm = filters.search ? `${filters.search}`.trim() : '';
  if (searchTerm) {
    const orClauses = [
      { providerAccountId: { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { '$user.email$': { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { '$user.firstName$': { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { '$user.lastName$': { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { '$profile.headline$': { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { '$profile.location$': { [LIKE_OPERATOR]: `%${searchTerm}%` } },
    ];

    const numericSearch = Number.parseInt(searchTerm, 10);
    if (Number.isInteger(numericSearch)) {
      orClauses.push({ id: numericSearch }, { userId: numericSearch }, { profileId: numericSearch });
    }

    where[Op.or] = orClauses;
  }

  const { page, pageSize, offset } = normalisePagination(filters.page, filters.pageSize);

  let order;
  switch (filters.sort) {
    case 'balance_asc':
      order = [['currentBalance', 'ASC']];
      break;
    case 'balance_desc':
    case 'balance':
      order = [['currentBalance', 'DESC']];
      break;
    case 'recent':
    default:
      order = [['updatedAt', 'DESC']];
      break;
  }

  const [result, globalSummary, filteredSummary] = await Promise.all([
    WalletAccount.findAndCountAll({
      where,
      include,
      order,
      limit: pageSize,
      offset,
      distinct: true,
      subQuery: false,
    }),
    buildSummary(),
    buildSummary(where),
  ]);

  const accounts = result.rows.map((account) => toAccountResponse(account));
  const totalItems = typeof result.count === 'number' ? result.count : result.count.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    accounts,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    summary: {
      global: globalSummary,
      filtered: filteredSummary,
    },
  };
}

export async function getWalletAccountById(accountId) {
  const id = parseId(accountId, 'accountId');
  const account = await WalletAccount.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'userType', 'role'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'timezone', 'availabilityStatus'] },
    ],
  });

  if (!account) {
    throw new NotFoundError('Wallet account not found.');
  }

  return toAccountResponse(account);
}

export async function createWalletAccount(payload = {}) {
  const userId = parseId(payload.userId, 'userId');
  const profileId = parseId(payload.profileId, 'profileId');
  const normalizedType = `${payload.accountType}`.toLowerCase();
  if (!WALLET_ACCOUNT_TYPES.includes(normalizedType)) {
    throw new ValidationError(`accountType must be one of: ${WALLET_ACCOUNT_TYPES.join(', ')}.`);
  }

  const existing = await WalletAccount.findOne({ where: { userId, profileId, accountType: normalizedType } });
  if (existing) {
    throw new ConflictError('A wallet account for this profile and account type already exists.');
  }

  const requestedProvider = payload.custodyProvider ? `${payload.custodyProvider}`.toLowerCase() : undefined;
  if (requestedProvider && !ESCROW_INTEGRATION_PROVIDERS.includes(requestedProvider)) {
    throw new ValidationError(`custodyProvider must be one of: ${ESCROW_INTEGRATION_PROVIDERS.join(', ')}.`);
  }

  const currencyCode = (payload.currencyCode ?? 'USD').toUpperCase();

  const account = await ensureWalletAccount({
    userId,
    profileId,
    accountType: normalizedType,
    custodyProvider: requestedProvider,
    currencyCode,
  });

  const updates = {
    status: payload.status ? `${payload.status}`.toLowerCase() : 'active',
    currencyCode,
    providerAccountId: payload.providerAccountId ? `${payload.providerAccountId}`.slice(0, 160) : null,
    metadata: coerceMetadata(payload.metadata),
    lastReconciledAt: payload.lastReconciledAt ? new Date(payload.lastReconciledAt) : new Date(),
  };

  if (!WALLET_ACCOUNT_STATUSES.includes(updates.status)) {
    throw new ValidationError(`status must be one of: ${WALLET_ACCOUNT_STATUSES.join(', ')}.`);
  }

  await account.update(updates);

  const reloaded = await WalletAccount.findByPk(account.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'userType', 'role'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'timezone', 'availabilityStatus'] },
    ],
  });

  return toAccountResponse(reloaded);
}

export async function updateWalletAccount(accountId, payload = {}) {
  const id = parseId(accountId, 'accountId');
  const account = await WalletAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Wallet account not found.');
  }

  const updates = {};

  if (payload.status) {
    const normalizedStatus = `${payload.status}`.toLowerCase();
    if (!WALLET_ACCOUNT_STATUSES.includes(normalizedStatus)) {
      throw new ValidationError(`status must be one of: ${WALLET_ACCOUNT_STATUSES.join(', ')}.`);
    }
    updates.status = normalizedStatus;
  }

  if (payload.custodyProvider) {
    const normalizedProvider = `${payload.custodyProvider}`.toLowerCase();
    if (!ESCROW_INTEGRATION_PROVIDERS.includes(normalizedProvider)) {
      throw new ValidationError(`custodyProvider must be one of: ${ESCROW_INTEGRATION_PROVIDERS.join(', ')}.`);
    }
    updates.custodyProvider = normalizedProvider;
  }

  if (payload.currencyCode) {
    updates.currencyCode = `${payload.currencyCode}`.toUpperCase().slice(0, 3);
  }

  if (payload.providerAccountId !== undefined) {
    updates.providerAccountId = payload.providerAccountId ? `${payload.providerAccountId}`.slice(0, 160) : null;
  }

  if (payload.metadata !== undefined) {
    updates.metadata = coerceMetadata(payload.metadata);
  }

  if (payload.lastReconciledAt) {
    const reconciledAt = new Date(payload.lastReconciledAt);
    if (Number.isNaN(reconciledAt.getTime())) {
      throw new ValidationError('lastReconciledAt must be a valid date.');
    }
    updates.lastReconciledAt = reconciledAt;
  }

  if (Object.keys(updates).length === 0) {
    return toAccountResponse(account);
  }

  try {
    await account.update(updates);
  } catch (error) {
    if (error instanceof SequelizeValidationError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }

  const reloaded = await WalletAccount.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'userType', 'role'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'timezone', 'availabilityStatus'] },
    ],
  });

  return toAccountResponse(reloaded);
}

export async function listWalletLedgerEntries(accountId, filters = {}) {
  const id = parseId(accountId, 'accountId');

  const where = { walletAccountId: id };
  if (filters.entryType) {
    where.entryType = filters.entryType;
  }

  const searchTerm = filters.search ? `${filters.search}`.trim() : '';
  if (searchTerm) {
    where[Op.or] = [
      { reference: { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { externalReference: { [LIKE_OPERATOR]: `%${searchTerm}%` } },
      { description: { [LIKE_OPERATOR]: `%${searchTerm}%` } },
    ];
  }

  if (filters.startDate || filters.endDate) {
    where.occurredAt = {};
    if (filters.startDate) {
      where.occurredAt[Op.gte] = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.occurredAt[Op.lte] = new Date(filters.endDate);
    }
  }

  const { page, pageSize, offset } = normalisePagination(filters.page, filters.pageSize);

  const result = await WalletLedgerEntry.findAndCountAll({
    where,
    include: [
      { model: User, as: 'initiatedBy', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
    ],
    order: [['occurredAt', 'DESC']],
    limit: pageSize,
    offset,
  });

  const entries = result.rows.map((entry) => toLedgerEntryResponse(entry));
  const totalItems = typeof result.count === 'number' ? result.count : result.count.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    entries,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function createWalletLedgerEntry(accountId, payload = {}, { initiatedById } = {}) {
  const id = parseId(accountId, 'accountId');

  const normalizedType = `${payload.entryType}`.toLowerCase();
  if (!WALLET_LEDGER_ENTRY_TYPES.includes(normalizedType)) {
    throw new ValidationError(`entryType must be one of: ${WALLET_LEDGER_ENTRY_TYPES.join(', ')}.`);
  }

  const ledgerPayload = {
    entryType: normalizedType,
    amount: payload.amount,
    currencyCode: payload.currencyCode,
    reference: payload.reference,
    externalReference: payload.externalReference,
    description: payload.description,
    occurredAt: payload.occurredAt,
    metadata: payload.metadata,
    initiatedById: payload.initiatedById ?? initiatedById ?? null,
  };

  const entry = await recordWalletLedgerEntry(id, ledgerPayload);

  const reloaded = await WalletLedgerEntry.findByPk(entry.id, {
    include: [
      { model: User, as: 'initiatedBy', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
    ],
  });

  return toLedgerEntryResponse(reloaded);
}

export default {
  listWalletAccounts,
  getWalletAccountById,
  createWalletAccount,
  updateWalletAccount,
  listWalletLedgerEntries,
  createWalletLedgerEntry,
};
