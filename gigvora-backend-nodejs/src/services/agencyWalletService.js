import { Op } from 'sequelize';
import {
  sequelize,
  WalletAccount,
  WalletLedgerEntry,
  WalletFundingSource,
  WalletOperationalSetting,
  WalletTransferRule,
  WalletPayoutRequest,
  ProviderWorkspace,
  User,
  Profile,
} from '../models/index.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const ALLOWED_WALLET_ROLES = new Set(['agency', 'agency_admin', 'admin', 'finance']);
const PENDING_PAYOUT_STATUSES = ['pending_review', 'approved', 'scheduled'];

function normaliseRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.map((role) => `${role}`.toLowerCase());
}

function assertWalletAccess(roles) {
  const normalised = normaliseRoles(roles);
  const permitted = normalised.some((role) => ALLOWED_WALLET_ROLES.has(role));
  if (!permitted) {
    throw new AuthorizationError('You do not have permission to administer agency wallets.');
  }
}

function parsePositiveInteger(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName ?? 'Identifier'} must be a positive integer.`);
  }
  return numeric;
}

function parseAmount(value, fieldName = 'Amount') {
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number.`);
  }
  return numeric;
}

function toDecimal(value, precision = 4) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0.0000';
  }
  return numeric.toFixed(precision);
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalised);
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

function ensureWorkspaceExists(workspaceId) {
  if (workspaceId == null) {
    return null;
  }
  return ProviderWorkspace.findByPk(workspaceId);
}

function serialiseAccount(account) {
  const base = account.toPublicObject();
  if (account.profile) {
    base.profile = {
      id: account.profile.id,
      headline: account.profile.headline ?? null,
      userId: account.profile.userId,
    };
  }
  if (account.user) {
    base.user = {
      id: account.user.id,
      firstName: account.user.firstName ?? null,
      lastName: account.user.lastName ?? null,
      email: account.user.email ?? null,
    };
  }
  if (account.workspace) {
    base.workspace = {
      id: account.workspace.id,
      name: account.workspace.name,
      slug: account.workspace.slug,
    };
  }
  return base;
}

function serialiseFundingSource(source) {
  const base = source.toPublicObject();
  if (source.workspace) {
    base.workspace = {
      id: source.workspace.id,
      name: source.workspace.name,
      slug: source.workspace.slug,
    };
  }
  return base;
}

function serialisePayoutRequest(request) {
  const base = request.toPublicObject();
  if (request.walletAccount) {
    base.walletAccount = serialiseAccount(request.walletAccount);
  }
  if (request.fundingSource) {
    base.fundingSource = serialiseFundingSource(request.fundingSource);
  }
  if (request.workspace) {
    base.workspace = {
      id: request.workspace.id,
      name: request.workspace.name,
      slug: request.workspace.slug,
    };
  }
  return base;
}

function coerceMetadata(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new ValidationError('Metadata must be valid JSON.');
  }
}

function buildAccountWhere({ workspaceId, status, search }) {
  const where = {};
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  if (status) {
    where.status = `${status}`.toLowerCase();
  }
  if (search && `${search}`.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { displayName: { [Op.like]: term } },
      { providerAccountId: { [Op.like]: term } },
    ];
  }
  return where;
}

function buildWorkspaceFilter(workspaceId) {
  return workspaceId != null ? { workspaceId } : {};
}

function aggregateCurrencyBreakdown(accounts) {
  return accounts.reduce((acc, account) => {
    const currency = account.currencyCode || 'USD';
    const current = Number.parseFloat(account.currentBalance ?? 0) || 0;
    const available = Number.parseFloat(account.availableBalance ?? 0) || 0;
    const pending = Number.parseFloat(account.pendingHoldBalance ?? 0) || 0;
    const bucket = acc.get(currency) ?? { currency, totalBalance: 0, availableBalance: 0, pendingHoldBalance: 0, accounts: 0 };
    bucket.totalBalance += current;
    bucket.availableBalance += available;
    bucket.pendingHoldBalance += pending;
    bucket.accounts += 1;
    acc.set(currency, bucket);
    return acc;
  }, new Map());
}

export async function getWalletOverview({ workspaceId } = {}, { roles } = {}) {
  assertWalletAccess(roles);
  const resolvedWorkspaceId = workspaceId == null ? null : parsePositiveInteger(workspaceId, 'workspaceId');

  const accountWhere = buildAccountWhere({ workspaceId: resolvedWorkspaceId });
  const accounts = await WalletAccount.findAll({
    where: accountWhere,
    attributes: [
      'id',
      'workspaceId',
      'status',
      'currencyCode',
      'currentBalance',
      'availableBalance',
      'pendingHoldBalance',
      'lastReconciledAt',
    ],
  });

  const totals = accounts.reduce(
    (acc, account) => {
      const current = Number.parseFloat(account.currentBalance ?? 0) || 0;
      const available = Number.parseFloat(account.availableBalance ?? 0) || 0;
      const pending = Number.parseFloat(account.pendingHoldBalance ?? 0) || 0;
      acc.totalBalance += current;
      acc.availableBalance += available;
      acc.pendingHoldBalance += pending;
      acc.count += 1;
      acc.statusCounts[account.status] = (acc.statusCounts[account.status] ?? 0) + 1;
      if (!acc.latestReconciledAt || (account.lastReconciledAt && account.lastReconciledAt > acc.latestReconciledAt)) {
        acc.latestReconciledAt = account.lastReconciledAt;
      }
      return acc;
    },
    { totalBalance: 0, availableBalance: 0, pendingHoldBalance: 0, count: 0, statusCounts: {}, latestReconciledAt: null },
  );

  const currencyBreakdown = Array.from(aggregateCurrencyBreakdown(accounts).values()).map((bucket) => ({
    currency: bucket.currency,
    totalBalance: Number(bucket.totalBalance.toFixed(2)),
    availableBalance: Number(bucket.availableBalance.toFixed(2)),
    pendingHoldBalance: Number(bucket.pendingHoldBalance.toFixed(2)),
    accounts: bucket.accounts,
  }));

  const pendingPayouts = await WalletPayoutRequest.findAll({
    where: {
      ...buildWorkspaceFilter(resolvedWorkspaceId),
      status: { [Op.in]: PENDING_PAYOUT_STATUSES },
    },
    attributes: ['amount'],
  });
  const pendingSummary = pendingPayouts.reduce(
    (acc, request) => {
      const amount = Number.parseFloat(request.amount ?? 0) || 0;
      acc.count += 1;
      acc.amount += amount;
      return acc;
    },
    { count: 0, amount: 0 },
  );

  const [fundingSourceCount, activeTransferRules] = await Promise.all([
    WalletFundingSource.count({ where: buildWorkspaceFilter(resolvedWorkspaceId) }),
    WalletTransferRule.count({ where: { ...buildWorkspaceFilter(resolvedWorkspaceId), isActive: true } }),
  ]);

  const ledgerWhere = {};
  if (resolvedWorkspaceId != null) {
    ledgerWhere['$walletAccount.workspaceId$'] = resolvedWorkspaceId;
  }
  const recentLedgerEntries = await WalletLedgerEntry.findAll({
    where: ledgerWhere,
    include: [
      {
        model: WalletAccount,
        as: 'walletAccount',
        include: [
          { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
        ],
      },
      { model: User, as: 'initiatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit: 10,
    order: [['occurredAt', 'DESC']],
  });

  const recentLedger = recentLedgerEntries.map((entry) => {
    const base = entry.toPublicObject();
    base.walletAccount = entry.walletAccount ? serialiseAccount(entry.walletAccount) : null;
    if (entry.initiatedBy) {
      base.initiatedBy = {
        id: entry.initiatedBy.id,
        firstName: entry.initiatedBy.firstName ?? null,
        lastName: entry.initiatedBy.lastName ?? null,
        email: entry.initiatedBy.email ?? null,
      };
    }
    return base;
  });

  const settingsInstance = resolvedWorkspaceId
    ? await WalletOperationalSetting.findOne({ where: { workspaceId: resolvedWorkspaceId } })
    : null;

  return {
    workspaceId: resolvedWorkspaceId,
    totals: {
      totalBalance: Number(totals.totalBalance.toFixed(2)),
      availableBalance: Number(totals.availableBalance.toFixed(2)),
      pendingHoldBalance: Number(totals.pendingHoldBalance.toFixed(2)),
      accountCount: totals.count,
      statusCounts: totals.statusCounts,
      latestReconciledAt: totals.latestReconciledAt,
    },
    currencyBreakdown,
    fundingSourceCount,
    activeTransferRules,
    pendingPayouts: {
      count: pendingSummary.count,
      amount: Number(pendingSummary.amount.toFixed(2)),
    },
    recentLedger,
    settings: settingsInstance ? settingsInstance.toPublicObject() : null,
  };
}

export async function listWalletAccounts(
  { workspaceId, status, search, limit = 25, offset = 0 } = {},
  { roles } = {},
) {
  assertWalletAccess(roles);
  const resolvedWorkspaceId = workspaceId == null ? null : parsePositiveInteger(workspaceId, 'workspaceId');
  const paginationLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 25, 1), 100);
  const paginationOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

  const where = buildAccountWhere({ workspaceId: resolvedWorkspaceId, status, search });
  const { rows, count } = await WalletAccount.findAndCountAll({
    where,
    include: [
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: paginationLimit,
    offset: paginationOffset,
  });

  return {
    total: count,
    items: rows.map((row) => serialiseAccount(row)),
  };
}

export async function createWalletAccount(payload, { actorId, roles } = {}) {
  assertWalletAccess(roles);
  const workspaceId = payload.workspaceId == null ? null : parsePositiveInteger(payload.workspaceId, 'workspaceId');
  if (workspaceId != null) {
    const workspace = await ensureWorkspaceExists(workspaceId);
    if (!workspace) {
      throw new ValidationError('Workspace not found for the provided workspaceId.');
    }
  }

  const userId = parsePositiveInteger(payload.userId, 'userId');
  const profileId = parsePositiveInteger(payload.profileId, 'profileId');
  const accountType = payload.accountType ? `${payload.accountType}`.toLowerCase() : 'user';
  const custodyProvider = payload.custodyProvider ? `${payload.custodyProvider}`.toLowerCase() : 'stripe';
  const currencyCode = payload.currencyCode ? `${payload.currencyCode}`.toUpperCase() : 'USD';
  const status = payload.status ? `${payload.status}`.toLowerCase() : 'pending';

  if (!userId) {
    throw new ValidationError('userId is required to create a wallet account.');
  }
  if (!profileId) {
    throw new ValidationError('profileId is required to create a wallet account.');
  }

  const metadata = coerceMetadata(payload.metadata);

  const account = await sequelize.transaction(async (transaction) => {
    const created = await WalletAccount.create(
      {
        userId,
        profileId,
        workspaceId,
        accountType,
        custodyProvider,
        providerAccountId: payload.providerAccountId ?? null,
        status,
        currencyCode,
        displayName: payload.displayName ?? null,
        currentBalance: toDecimal(payload.currentBalance, 4),
        availableBalance: toDecimal(payload.availableBalance, 4),
        pendingHoldBalance: toDecimal(payload.pendingHoldBalance, 4),
        metadata,
      },
      { transaction },
    );

    if (payload.lastReconciledAt) {
      await created.update({ lastReconciledAt: new Date(payload.lastReconciledAt) }, { transaction });
    }

    return created;
  });

  const fullAccount = await WalletAccount.findByPk(account.id, {
    include: [
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
  });

  return serialiseAccount(fullAccount);
}

export async function updateWalletAccount(accountId, payload, { roles } = {}) {
  assertWalletAccess(roles);
  const id = parsePositiveInteger(accountId, 'walletAccountId');
  const account = await WalletAccount.findByPk(id);
  if (!account) {
    throw new NotFoundError('Wallet account not found.');
  }

  const updates = {};
  if (payload.workspaceId !== undefined) {
    updates.workspaceId = payload.workspaceId == null ? null : parsePositiveInteger(payload.workspaceId, 'workspaceId');
  }
  if (payload.displayName !== undefined) {
    updates.displayName = payload.displayName || null;
  }
  if (payload.custodyProvider !== undefined) {
    updates.custodyProvider = `${payload.custodyProvider}`.toLowerCase();
  }
  if (payload.status !== undefined) {
    updates.status = `${payload.status}`.toLowerCase();
  }
  if (payload.currencyCode !== undefined) {
    updates.currencyCode = `${payload.currencyCode}`.toUpperCase();
  }
  if (payload.providerAccountId !== undefined) {
    updates.providerAccountId = payload.providerAccountId || null;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = coerceMetadata(payload.metadata);
  }
  if (payload.lastReconciledAt !== undefined) {
    updates.lastReconciledAt = payload.lastReconciledAt ? new Date(payload.lastReconciledAt) : null;
  }
  if (payload.currentBalance !== undefined) {
    updates.currentBalance = toDecimal(payload.currentBalance, 4);
  }
  if (payload.availableBalance !== undefined) {
    updates.availableBalance = toDecimal(payload.availableBalance, 4);
  }
  if (payload.pendingHoldBalance !== undefined) {
    updates.pendingHoldBalance = toDecimal(payload.pendingHoldBalance, 4);
  }

  await account.update(updates);

  const refreshed = await WalletAccount.findByPk(id, {
    include: [
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
  });

  return serialiseAccount(refreshed);
}

export async function listLedgerEntries(
  walletAccountId,
  { limit = 50, offset = 0, entryType } = {},
  { roles } = {},
) {
  assertWalletAccess(roles);
  const id = parsePositiveInteger(walletAccountId, 'walletAccountId');
  const account = await WalletAccount.findByPk(id, {
    include: [
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
  });
  if (!account) {
    throw new NotFoundError('Wallet account not found.');
  }

  const paginationLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 200);
  const paginationOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

  const where = { walletAccountId: id };
  if (entryType) {
    where.entryType = `${entryType}`.toLowerCase();
  }

  const { rows, count } = await WalletLedgerEntry.findAndCountAll({
    where,
    include: [{ model: User, as: 'initiatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['occurredAt', 'DESC']],
    limit: paginationLimit,
    offset: paginationOffset,
  });

  const items = rows.map((entry) => {
    const base = entry.toPublicObject();
    if (entry.initiatedBy) {
      base.initiatedBy = {
        id: entry.initiatedBy.id,
        firstName: entry.initiatedBy.firstName ?? null,
        lastName: entry.initiatedBy.lastName ?? null,
        email: entry.initiatedBy.email ?? null,
      };
    }
    return base;
  });

  return {
    total: count,
    items,
    account: serialiseAccount(account),
  };
}

export async function createLedgerEntry(walletAccountId, payload, { actorId, roles } = {}) {
  assertWalletAccess(roles);
  const id = parsePositiveInteger(walletAccountId, 'walletAccountId');
  const entryType = payload.entryType ? `${payload.entryType}`.toLowerCase() : 'credit';
  const amount = parseAmount(payload.amount, 'amount');
  const currencyCode = payload.currencyCode ? `${payload.currencyCode}`.toUpperCase() : null;
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();
  const metadata = coerceMetadata(payload.metadata);

  let createdEntry = null;
  await sequelize.transaction(async (transaction) => {
    const account = await WalletAccount.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction });
    if (!account) {
      throw new NotFoundError('Wallet account not found.');
    }

    const currentBalance = Number.parseFloat(account.currentBalance ?? 0) || 0;
    const availableBalance = Number.parseFloat(account.availableBalance ?? 0) || 0;

    let nextCurrent = currentBalance;
    let nextAvailable = availableBalance;

    if (entryType === 'credit') {
      nextCurrent += amount;
      nextAvailable += amount;
    } else if (entryType === 'debit') {
      if (availableBalance < amount) {
        throw new ValidationError('Insufficient available balance for debit.');
      }
      nextCurrent -= amount;
      nextAvailable -= amount;
    } else {
      throw new ValidationError('entryType must be either credit or debit.');
    }

    const reference = payload.reference && `${payload.reference}`.trim().length
      ? `${payload.reference}`.trim()
      : `wallet-${id}-${Date.now()}`;

    createdEntry = await WalletLedgerEntry.create(
      {
        walletAccountId: id,
        entryType,
        amount,
        currencyCode: currencyCode || account.currencyCode,
        reference,
        externalReference: payload.externalReference ? `${payload.externalReference}`.trim() : null,
        description: payload.description ? `${payload.description}`.trim() : null,
        initiatedById: actorId ?? null,
        occurredAt,
        balanceAfter: toDecimal(nextCurrent, 4),
        metadata,
      },
      { transaction },
    );

    await account.update(
      {
        currentBalance: toDecimal(nextCurrent, 4),
        availableBalance: toDecimal(nextAvailable, 4),
        lastReconciledAt: occurredAt,
      },
      { transaction },
    );
  });

  const entry = await WalletLedgerEntry.findByPk(createdEntry.id, {
    include: [{ model: User, as: 'initiatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  const base = entry.toPublicObject();
  if (entry.initiatedBy) {
    base.initiatedBy = {
      id: entry.initiatedBy.id,
      firstName: entry.initiatedBy.firstName ?? null,
      lastName: entry.initiatedBy.lastName ?? null,
      email: entry.initiatedBy.email ?? null,
    };
  }
  return base;
}

export async function listFundingSources({ workspaceId } = {}, { roles } = {}) {
  assertWalletAccess(roles);
  const resolvedWorkspaceId = workspaceId == null ? null : parsePositiveInteger(workspaceId, 'workspaceId');
  const sources = await WalletFundingSource.findAll({
    where: buildWorkspaceFilter(resolvedWorkspaceId),
    include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }],
    order: [['isPrimary', 'DESC'], ['label', 'ASC']],
  });

  return sources.map((source) => serialiseFundingSource(source));
}

export async function createFundingSource(payload, { actorId, roles } = {}) {
  assertWalletAccess(roles);
  const workspaceId = parsePositiveInteger(payload.workspaceId, 'workspaceId');
  const workspace = await ensureWorkspaceExists(workspaceId);
  if (!workspace) {
    throw new ValidationError('Workspace not found for the provided workspaceId.');
  }

  const metadata = coerceMetadata(payload.metadata);

  const source = await WalletFundingSource.create({
    workspaceId,
    label: payload.label,
    type: payload.type ? `${payload.type}`.toLowerCase() : 'bank_account',
    provider: payload.provider ?? null,
    accountNumberLast4: payload.accountNumberLast4 ?? null,
    currencyCode: payload.currencyCode ? `${payload.currencyCode}`.toUpperCase() : 'USD',
    status: payload.status ? `${payload.status}`.toLowerCase() : 'active',
    isPrimary: coerceBoolean(payload.isPrimary),
    metadata,
    createdById: actorId ?? null,
  });

  if (coerceBoolean(payload.isPrimary)) {
    await WalletFundingSource.update(
      { isPrimary: false },
      { where: { workspaceId, id: { [Op.ne]: source.id } } },
    );
    await source.update({ isPrimary: true });
  }

  const fullSource = await WalletFundingSource.findByPk(source.id, {
    include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }],
  });

  return serialiseFundingSource(fullSource);
}

export async function updateFundingSource(sourceId, payload, { roles } = {}) {
  assertWalletAccess(roles);
  const id = parsePositiveInteger(sourceId, 'fundingSourceId');
  const source = await WalletFundingSource.findByPk(id);
  if (!source) {
    throw new NotFoundError('Funding source not found.');
  }

  const updates = {};
  if (payload.label !== undefined) updates.label = payload.label || null;
  if (payload.type !== undefined) updates.type = `${payload.type}`.toLowerCase();
  if (payload.provider !== undefined) updates.provider = payload.provider || null;
  if (payload.accountNumberLast4 !== undefined) updates.accountNumberLast4 = payload.accountNumberLast4 || null;
  if (payload.currencyCode !== undefined) updates.currencyCode = `${payload.currencyCode}`.toUpperCase();
  if (payload.status !== undefined) updates.status = `${payload.status}`.toLowerCase();
  if (payload.metadata !== undefined) updates.metadata = coerceMetadata(payload.metadata);
  if (payload.updatedById !== undefined) updates.updatedById = payload.updatedById;

  if (payload.isPrimary !== undefined) {
    updates.isPrimary = coerceBoolean(payload.isPrimary);
  }

  await source.update(updates);

  if (updates.isPrimary) {
    await WalletFundingSource.update(
      { isPrimary: false },
      { where: { workspaceId: source.workspaceId, id: { [Op.ne]: source.id } } },
    );
  }

  const refreshed = await WalletFundingSource.findByPk(id, {
    include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }],
  });

  return serialiseFundingSource(refreshed);
}

export async function listPayoutRequests({ workspaceId, status } = {}, { roles } = {}) {
  assertWalletAccess(roles);
  const resolvedWorkspaceId = workspaceId == null ? null : parsePositiveInteger(workspaceId, 'workspaceId');
  const where = buildWorkspaceFilter(resolvedWorkspaceId);
  if (status) {
    where.status = `${status}`.toLowerCase();
  }

  const requests = await WalletPayoutRequest.findAll({
    where,
    include: [
      {
        model: WalletAccount,
        as: 'walletAccount',
        include: [
          { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
        ],
      },
      { model: WalletFundingSource, as: 'fundingSource', include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
    order: [['requestedAt', 'DESC']],
  });

  return requests.map((request) => serialisePayoutRequest(request));
}

export async function createPayoutRequest(payload, { actorId, roles } = {}) {
  assertWalletAccess(roles);
  const workspaceId = parsePositiveInteger(payload.workspaceId, 'workspaceId');
  const workspace = await ensureWorkspaceExists(workspaceId);
  if (!workspace) {
    throw new ValidationError('Workspace not found for the provided workspaceId.');
  }

  const walletAccountId = parsePositiveInteger(payload.walletAccountId, 'walletAccountId');
  const account = await WalletAccount.findByPk(walletAccountId);
  if (!account) {
    throw new ValidationError('Wallet account not found for payout request.');
  }

  if (account.workspaceId && account.workspaceId !== workspaceId) {
    throw new ValidationError('Wallet account does not belong to the provided workspace.');
  }

  const fundingSourceId = payload.fundingSourceId == null ? null : parsePositiveInteger(payload.fundingSourceId, 'fundingSourceId');
  if (fundingSourceId != null) {
    const source = await WalletFundingSource.findByPk(fundingSourceId);
    if (!source || source.workspaceId !== workspaceId) {
      throw new ValidationError('Funding source not found for the provided workspace.');
    }
  }

  const amount = parseAmount(payload.amount, 'amount');
  const metadata = coerceMetadata(payload.metadata);

  const request = await WalletPayoutRequest.create({
    workspaceId,
    walletAccountId,
    fundingSourceId,
    amount,
    currencyCode: payload.currencyCode ? `${payload.currencyCode}`.toUpperCase() : account.currencyCode,
    status: payload.status ? `${payload.status}`.toLowerCase() : 'pending_review',
    requestedById: actorId ?? parsePositiveInteger(payload.requestedById ?? actorId ?? account.userId, 'requestedById'),
    reviewedById: payload.reviewedById ?? null,
    processedById: payload.processedById ?? null,
    requestedAt: payload.requestedAt ? new Date(payload.requestedAt) : new Date(),
    notes: payload.notes ?? null,
    metadata,
  });

  const fullRequest = await WalletPayoutRequest.findByPk(request.id, {
    include: [
      {
        model: WalletAccount,
        as: 'walletAccount',
        include: [
          { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
        ],
      },
      { model: WalletFundingSource, as: 'fundingSource', include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
  });

  return serialisePayoutRequest(fullRequest);
}

export async function updatePayoutRequest(requestId, payload, { roles } = {}) {
  assertWalletAccess(roles);
  const id = parsePositiveInteger(requestId, 'payoutRequestId');
  const request = await WalletPayoutRequest.findByPk(id);
  if (!request) {
    throw new NotFoundError('Payout request not found.');
  }

  const updates = {};
  if (payload.status !== undefined) {
    updates.status = `${payload.status}`.toLowerCase();
  }
  if (payload.reviewedById !== undefined) {
    updates.reviewedById = payload.reviewedById == null ? null : parsePositiveInteger(payload.reviewedById, 'reviewedById');
  }
  if (payload.processedById !== undefined) {
    updates.processedById = payload.processedById == null ? null : parsePositiveInteger(payload.processedById, 'processedById');
  }
  if (payload.approvedAt !== undefined) {
    updates.approvedAt = payload.approvedAt ? new Date(payload.approvedAt) : null;
  }
  if (payload.processedAt !== undefined) {
    updates.processedAt = payload.processedAt ? new Date(payload.processedAt) : null;
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes || null;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = coerceMetadata(payload.metadata);
  }

  await request.update(updates);

  const refreshed = await WalletPayoutRequest.findByPk(id, {
    include: [
      {
        model: WalletAccount,
        as: 'walletAccount',
        include: [
          { model: Profile, as: 'profile', attributes: ['id', 'headline', 'userId'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
        ],
      },
      { model: WalletFundingSource, as: 'fundingSource', include: [{ model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] }] },
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug'] },
    ],
  });

  return serialisePayoutRequest(refreshed);
}

export async function getOperationalSettings({ workspaceId } = {}, { roles } = {}) {
  assertWalletAccess(roles);
  if (workspaceId == null) {
    throw new ValidationError('workspaceId is required to load wallet settings.');
  }
  const resolvedWorkspaceId = parsePositiveInteger(workspaceId, 'workspaceId');
  const settings = await WalletOperationalSetting.findOne({ where: { workspaceId: resolvedWorkspaceId } });
  return settings ? settings.toPublicObject() : null;
}

export async function updateOperationalSettings(payload, { actorId, roles } = {}) {
  assertWalletAccess(roles);
  const workspaceId = parsePositiveInteger(payload.workspaceId, 'workspaceId');
  const workspace = await ensureWorkspaceExists(workspaceId);
  if (!workspace) {
    throw new ValidationError('Workspace not found for the provided workspaceId.');
  }

  const updates = {
    workspaceId,
    lowBalanceAlertThreshold:
      payload.lowBalanceAlertThreshold == null ? null : Number.parseFloat(payload.lowBalanceAlertThreshold),
    autoSweepEnabled: coerceBoolean(payload.autoSweepEnabled),
    autoSweepThreshold: payload.autoSweepThreshold == null ? null : Number.parseFloat(payload.autoSweepThreshold),
    reconciliationCadence: payload.reconciliationCadence ? `${payload.reconciliationCadence}`.toLowerCase() : null,
    dualControlEnabled: coerceBoolean(payload.dualControlEnabled),
    complianceContactEmail: payload.complianceContactEmail || null,
    payoutWindow: payload.payoutWindow || null,
    riskTier: payload.riskTier ? `${payload.riskTier}`.toLowerCase() : null,
    complianceNotes: payload.complianceNotes || null,
    metadata: coerceMetadata(payload.metadata),
    updatedById: actorId ?? null,
  };

  const [settings, created] = await WalletOperationalSetting.findOrCreate({
    where: { workspaceId },
    defaults: { ...updates, createdById: actorId ?? null },
  });

  if (!created) {
    await settings.update(updates);
  }

  const refreshed = await WalletOperationalSetting.findOne({ where: { workspaceId } });
  return refreshed ? refreshed.toPublicObject() : null;
}

export default {
  getWalletOverview,
  listWalletAccounts,
  createWalletAccount,
  updateWalletAccount,
  listLedgerEntries,
  createLedgerEntry,
  listFundingSources,
  createFundingSource,
  updateFundingSource,
  listPayoutRequests,
  createPayoutRequest,
  updatePayoutRequest,
  getOperationalSettings,
  updateOperationalSettings,
};
