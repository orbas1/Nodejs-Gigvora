import { Op } from 'sequelize';
import {
  sequelize,
  User,
  WalletAccount,
  WalletLedgerEntry,
  WalletFundingSource,
  WalletTransferRule,
  WalletTransferRequest,
  EscrowAccount,
  EscrowTransaction,
} from '../models/index.js';
import { ensureProfileWallets, getProfileComplianceSnapshot } from './complianceService.js';
import { appCache } from '../utils/cache.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'wallet:management';
const CACHE_TTL_SECONDS = 60;

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${userId}`;
}

function normalizeUserId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function sanitizeString(value, { maxLength = 255, allowNull = true, toLowerCase = false, toUpperCase = false } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const text = `${value}`.trim();
  if (!text) {
    return allowNull ? null : '';
  }
  let normalized = text.slice(0, maxLength);
  if (toLowerCase) {
    normalized = normalized.toLowerCase();
  }
  if (toUpperCase) {
    normalized = normalized.toUpperCase();
  }
  return normalized;
}

function sanitizeMetadata(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return null;
}

function toNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function sumNumbers(values) {
  return values.reduce((total, value) => total + toNumber(value, 0), 0);
}

function buildAccessContext(user) {
  const actorRole = sanitizeString(user?.userType, { allowNull: true, toLowerCase: true });
  const allowedRoles = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'];
  const canManage = actorRole ? allowedRoles.includes(actorRole) : true;
  return {
    canManage,
    actorRole,
    allowedRoles,
    reason: canManage
      ? null
      : 'Wallet operations require an upgraded membership. Switch to an operator role or contact support.',
  };
}

function buildLedgerEntries(entries) {
  return entries.map((entry) => {
    const plain = entry.toPublicObject();
    return {
      ...plain,
      metadata: plain.metadata ?? {},
    };
  });
}

function mapFundingSources(sources) {
  const ordered = [...sources].sort((a, b) => {
    if (a.isPrimary === b.isPrimary) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.isPrimary ? -1 : 1;
  });

  const items = ordered.map((source) => {
    const plain = source.toPublicObject();
    return {
      ...plain,
      connectedAt: plain.connectedAt ?? plain.createdAt,
    };
  });

  return {
    primaryId: items.find((source) => source.isPrimary)?.id ?? null,
    items,
  };
}

function mapTransferRules(rules, fundingSourceLookup) {
  return rules
    .map((rule) => {
      const plain = rule.toPublicObject();
      return {
        ...plain,
        fundingSource: plain.fundingSourceId ? fundingSourceLookup.get(plain.fundingSourceId) ?? null : null,
      };
    })
    .sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
      }
      return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
    });
}

function mapTransferRequests(requests, fundingSourceLookup) {
  return requests
    .map((request) => {
      const plain = request.toPublicObject();
      return {
        ...plain,
        fundingSource: plain.fundingSourceId ? fundingSourceLookup.get(plain.fundingSourceId) ?? null : null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mapEscrowAccounts(accounts, transactions) {
  const transactionsByAccount = new Map();
  transactions.forEach((transaction) => {
    const plain = transaction.toPublicObject();
    const list = transactionsByAccount.get(plain.accountId) ?? [];
    list.push({
      ...plain,
      metadata: plain.metadata ?? {},
    });
    transactionsByAccount.set(plain.accountId, list);
  });

  return accounts.map((account) => {
    const plain = account.toPublicObject();
    const accountTransactions = transactionsByAccount.get(plain.id) ?? [];
    return {
      ...plain,
      transactions: accountTransactions
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 10),
    };
  });
}

function mergeAccountCompliance(accounts, complianceSnapshot, ledgerEntries) {
  const complianceById = new Map();
  (complianceSnapshot?.accounts ?? []).forEach((snapshot) => {
    complianceById.set(snapshot.id, snapshot);
  });

  const ledgerByAccount = new Map();
  ledgerEntries.forEach((entry) => {
    const list = ledgerByAccount.get(entry.walletAccountId) ?? [];
    list.push(entry);
    ledgerByAccount.set(entry.walletAccountId, list);
  });

  return accounts.map((account) => {
    const plain = account.toPublicObject();
    const compliance = complianceById.get(plain.id) ?? null;
    const ledger = (ledgerByAccount.get(plain.id) ?? [])
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 10)
      .map((entry) => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: toNumber(entry.amount),
        balanceAfter: toNumber(entry.balanceAfter),
        occurredAt: entry.occurredAt,
        reference: entry.reference,
        description: entry.description,
        metadata: entry.metadata ?? {},
      }));

    return {
      ...plain,
      ledger,
      ledgerEntryCount: ledgerByAccount.get(plain.id)?.length ?? 0,
      complianceStatus: compliance?.complianceStatus ?? compliance?.status ?? 'unknown',
      complianceNotes: compliance?.complianceNotes ?? null,
      ledgerBalanced: compliance?.ledgerBalanced ?? null,
      ledgerNotes: compliance?.ledgerNotes ?? null,
      lastEntryAt: compliance?.lastEntryAt ?? ledger[0]?.occurredAt ?? null,
      appStoreCompliant: compliance?.appStoreCompliant ?? true,
    };
  });
}

function buildSummary(accounts, complianceSnapshot, transferRequests) {
  const currency = accounts[0]?.currencyCode ?? 'USD';
  const totalBalance = sumNumbers(accounts.map((account) => account.currentBalance));
  const availableBalance = sumNumbers(accounts.map((account) => account.availableBalance));
  const pendingHoldBalance = sumNumbers(accounts.map((account) => account.pendingHoldBalance));
  const lastReconciledAt = accounts
    .map((account) => account.lastReconciledAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  const pendingStatuses = new Set(['pending', 'scheduled', 'processing']);
  const pendingTransfers = transferRequests.filter((request) => pendingStatuses.has(request.status));
  const nextScheduledTransferAt = pendingTransfers
    .map((request) => request.scheduledAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  const compliance = complianceSnapshot ?? {};

  return {
    currency,
    accountCount: accounts.length,
    totalBalance,
    availableBalance,
    pendingHoldBalance,
    ledgerIntegrity: compliance.ledgerIntegrity ?? 'unknown',
    complianceStatus: compliance.complianceStatus ?? 'inactive',
    appStoreCompliant: compliance.appStoreCompliant !== false,
    nextScheduledTransferAt,
    pendingTransferCount: pendingTransfers.length,
    lastReconciledAt,
  };
}

function assertCanManageWallet(userId, { actorId, actorRoles } = {}) {
  if (actorRoles?.includes?.('admin')) {
    return;
  }
  if (actorId != null && Number(actorId) === Number(userId)) {
    return;
  }
  throw new AuthorizationError('You do not have permission to manage this wallet.');
}

async function loadWalletPayload(userId, { bypassCache = false } = {}) {
  const user = await User.findByPk(userId, {
    include: [{ association: 'Profile' }],
  });
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  await ensureProfileWallets(user, {
    requestId: `wallet-management:${userId}`,
    forceRefresh: bypassCache,
  });

  const accounts = await WalletAccount.findAll({
    where: { userId },
    order: [
      ['accountType', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
  const accountIds = accounts.map((account) => account.id);

  const [ledgerEntries, fundingSources, transferRules, transferRequests, escrowAccounts, escrowTransactions, complianceSnapshot] =
    await Promise.all([
      accountIds.length
        ? WalletLedgerEntry.findAll({
            where: { walletAccountId: accountIds },
            order: [['occurredAt', 'DESC']],
            limit: 120,
          })
        : [],
      WalletFundingSource.findAll({
        where: { userId },
        order: [
          ['isPrimary', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      }),
      WalletTransferRule.findAll({
        where: { walletAccountId: { [Op.in]: accountIds.length ? accountIds : [0] } },
        order: [['updatedAt', 'DESC']],
      }),
      WalletTransferRequest.findAll({
        where: { walletAccountId: { [Op.in]: accountIds.length ? accountIds : [0] } },
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
      EscrowAccount.findAll({ where: { userId }, order: [['createdAt', 'DESC']] }),
      EscrowTransaction.findAll({
        where: { accountId: { [Op.in]: accountIds.length ? accountIds : [0] } },
        order: [['createdAt', 'DESC']],
        limit: 50,
      }),
      getProfileComplianceSnapshot(user, {}),
    ]);

  const ledgerPlain = ledgerEntries.map((entry) => entry.toPublicObject());
  const fundingSourceLookup = new Map(fundingSources.map((source) => [source.id, source.toPublicObject()]));
  const decoratedAccounts = mergeAccountCompliance(accounts, complianceSnapshot.wallet, ledgerPlain);
  const decoratedFundingSources = mapFundingSources(fundingSources);
  const decoratedTransferRules = mapTransferRules(transferRules, fundingSourceLookup);
  const decoratedTransferRequests = mapTransferRequests(transferRequests, fundingSourceLookup);
  const decoratedEscrow = mapEscrowAccounts(escrowAccounts, escrowTransactions);

  const summary = buildSummary(decoratedAccounts, complianceSnapshot.wallet, decoratedTransferRequests);

  const alerts = [];
  if (summary.complianceStatus !== 'closed_loop') {
    alerts.push({
      severity: summary.complianceStatus === 'review_required' ? 'critical' : 'warning',
      message:
        summary.complianceStatus === 'inactive'
          ? 'Activate your wallet by connecting a payout method and completing the first transaction.'
          : 'Wallet compliance needs review. Resolve flagged ledger entries before releasing funds.',
    });
  }
  if (summary.ledgerIntegrity === 'attention_required') {
    alerts.push({
      severity: 'warning',
      message: 'Ledger totals do not match custodial balances. Reconcile before scheduling payouts.',
    });
  }

  return {
    access: buildAccessContext(user),
    summary,
    compliance: complianceSnapshot.wallet,
    accounts: decoratedAccounts,
    ledger: {
      entries: buildLedgerEntries(ledgerEntries),
      pagination: { total: ledgerPlain.length, limit: 120 },
    },
    fundingSources: decoratedFundingSources,
    transferRules: decoratedTransferRules,
    transfers: {
      recent: decoratedTransferRequests,
      pendingCount: decoratedTransferRequests.filter((request) =>
        ['pending', 'scheduled', 'processing'].includes(request.status),
      ).length,
    },
    escrow: {
      accounts: decoratedEscrow,
    },
    alerts,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function getWalletOverview(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(normalizedUserId);

  if (bypassCache) {
    return loadWalletPayload(normalizedUserId, { bypassCache: true });
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () =>
    loadWalletPayload(normalizedUserId, { bypassCache: false }),
  );
}

function invalidateCache(userId) {
  appCache.delete(buildCacheKey(userId));
}

async function resolveWalletAccount(userId, walletAccountId) {
  if (walletAccountId != null) {
    const account = await WalletAccount.findOne({ where: { id: walletAccountId, userId } });
    if (!account) {
      throw new NotFoundError('Wallet account not found.');
    }
    return account;
  }

  const fallback = await WalletAccount.findOne({
    where: { userId },
    order: [
      ['accountType', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
  if (!fallback) {
    throw new NotFoundError('Wallet account not available.');
  }
  return fallback;
}

export async function createFundingSource(userId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const account = await resolveWalletAccount(normalizedUserId, payload.walletAccountId);

  const label = sanitizeString(payload.label, { allowNull: false, maxLength: 160 });
  if (!label) {
    throw new ValidationError('Funding source label is required.');
  }
  const type = sanitizeString(payload.type ?? 'bank_account', { allowNull: false, maxLength: 60, toLowerCase: true });
  if (!type) {
    throw new ValidationError('Funding source type is required.');
  }
  const status = sanitizeString(payload.status ?? 'pending', {
    allowNull: false,
    maxLength: 60,
    toLowerCase: true,
  });
  const provider = sanitizeString(payload.provider, { maxLength: 120, allowNull: true });
  const lastFour = sanitizeString(payload.lastFour, { maxLength: 8, allowNull: true });
  const currencyCode = sanitizeString(payload.currencyCode ?? account.currencyCode ?? 'USD', {
    maxLength: 3,
    allowNull: false,
    toUpperCase: true,
  });
  const metadata = sanitizeMetadata(payload.metadata);
  const isPrimary = Boolean(payload.makePrimary);

  const fundingSource = await sequelize.transaction(async (transaction) => {
    if (isPrimary) {
      await WalletFundingSource.update(
        { isPrimary: false },
        { where: { walletAccountId: account.id }, transaction },
      );
    }

    const record = await WalletFundingSource.create(
      {
        userId: normalizedUserId,
        walletAccountId: account.id,
        type,
        label,
        status,
        provider,
        lastFour,
        currencyCode,
        isPrimary,
        connectedAt: payload.connectedAt ?? new Date().toISOString(),
        metadata,
      },
      { transaction },
    );
    return record;
  });

  invalidateCache(normalizedUserId);
  return fundingSource.toPublicObject();
}

export async function updateFundingSource(userId, fundingSourceId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const fundingSource = await WalletFundingSource.findOne({
    where: { id: fundingSourceId, userId: normalizedUserId },
  });
  if (!fundingSource) {
    throw new NotFoundError('Funding source not found.');
  }

  const updates = {};
  if (payload.label !== undefined) {
    const label = sanitizeString(payload.label, { allowNull: false, maxLength: 160 });
    if (!label) {
      throw new ValidationError('Funding source label is required.');
    }
    updates.label = label;
  }
  if (payload.status !== undefined) {
    updates.status = sanitizeString(payload.status, { allowNull: false, maxLength: 60, toLowerCase: true });
  }
  if (payload.provider !== undefined) {
    updates.provider = sanitizeString(payload.provider, { maxLength: 120, allowNull: true });
  }
  if (payload.lastFour !== undefined) {
    updates.lastFour = sanitizeString(payload.lastFour, { maxLength: 8, allowNull: true });
  }
  if (payload.currencyCode !== undefined) {
    updates.currencyCode = sanitizeString(payload.currencyCode, {
      maxLength: 3,
      allowNull: false,
      toUpperCase: true,
    });
  }
  if (payload.metadata !== undefined) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }
  const makePrimary = payload.makePrimary === true;
  const clearPrimary = payload.makePrimary === false;
  const disable = payload.disable === true;

  await sequelize.transaction(async (transaction) => {
    if (makePrimary) {
      await WalletFundingSource.update(
        { isPrimary: false },
        { where: { walletAccountId: fundingSource.walletAccountId }, transaction },
      );
      updates.isPrimary = true;
    } else if (clearPrimary) {
      updates.isPrimary = false;
    }

    if (disable) {
      updates.status = 'disabled';
      updates.disabledAt = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    await WalletFundingSource.update(updates, { where: { id: fundingSource.id }, transaction });
    await fundingSource.reload({ transaction });
  });

  invalidateCache(normalizedUserId);
  return fundingSource.toPublicObject();
}

export async function createTransferRule(userId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const account = await resolveWalletAccount(normalizedUserId, payload.walletAccountId);
  const fundingSourceId = payload.fundingSourceId ?? null;
  if (fundingSourceId != null) {
    const fundingSource = await WalletFundingSource.findOne({
      where: { id: fundingSourceId, walletAccountId: account.id },
    });
    if (!fundingSource) {
      throw new ValidationError('Funding source not found for this wallet account.');
    }
  }

  const name = sanitizeString(payload.name, { allowNull: false, maxLength: 160 });
  if (!name) {
    throw new ValidationError('Automation rule name is required.');
  }
  const transferType = sanitizeString(payload.transferType ?? 'payout', {
    allowNull: false,
    maxLength: 60,
    toLowerCase: true,
  });
  const cadence = sanitizeString(payload.cadence ?? 'monthly', {
    allowNull: false,
    maxLength: 40,
    toLowerCase: true,
  });
  const status = sanitizeString(payload.status ?? 'active', {
    allowNull: false,
    maxLength: 40,
    toLowerCase: true,
  });
  const thresholdAmount = toNumber(payload.thresholdAmount, 0);
  if (thresholdAmount < 0) {
    throw new ValidationError('Threshold amount cannot be negative.');
  }
  const thresholdCurrency = sanitizeString(payload.thresholdCurrency ?? account.currencyCode ?? 'USD', {
    allowNull: false,
    maxLength: 3,
    toUpperCase: true,
  });
  const executionDay = payload.executionDay != null ? Number.parseInt(payload.executionDay, 10) : null;
  if (executionDay != null && (Number.isNaN(executionDay) || executionDay < 1 || executionDay > 31)) {
    throw new ValidationError('Execution day must be between 1 and 31.');
  }
  const metadata = sanitizeMetadata(payload.metadata);

  const rule = await WalletTransferRule.create({
    walletAccountId: account.id,
    fundingSourceId,
    name,
    transferType,
    cadence,
    status,
    thresholdAmount,
    thresholdCurrency,
    executionDay,
    metadata,
    createdById: actor?.actorId ?? actor?.id ?? actor?.userId ?? null,
  });

  invalidateCache(normalizedUserId);
  return rule.toPublicObject();
}

export async function updateTransferRule(userId, ruleId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const rule = await WalletTransferRule.findByPk(ruleId);
  if (!rule) {
    throw new NotFoundError('Transfer rule not found.');
  }

  const account = await WalletAccount.findOne({ where: { id: rule.walletAccountId, userId: normalizedUserId } });
  if (!account) {
    throw new AuthorizationError('You do not have access to this transfer rule.');
  }

  const updates = {};
  if (payload.name !== undefined) {
    const name = sanitizeString(payload.name, { allowNull: false, maxLength: 160 });
    if (!name) {
      throw new ValidationError('Automation rule name is required.');
    }
    updates.name = name;
  }
  if (payload.transferType !== undefined) {
    updates.transferType = sanitizeString(payload.transferType, { allowNull: false, maxLength: 60, toLowerCase: true });
  }
  if (payload.cadence !== undefined) {
    updates.cadence = sanitizeString(payload.cadence, { allowNull: false, maxLength: 40, toLowerCase: true });
  }
  if (payload.status !== undefined) {
    updates.status = sanitizeString(payload.status, { allowNull: false, maxLength: 40, toLowerCase: true });
  }
  if (payload.thresholdAmount !== undefined) {
    const amount = toNumber(payload.thresholdAmount, 0);
    if (amount < 0) {
      throw new ValidationError('Threshold amount cannot be negative.');
    }
    updates.thresholdAmount = amount;
  }
  if (payload.thresholdCurrency !== undefined) {
    updates.thresholdCurrency = sanitizeString(payload.thresholdCurrency, {
      allowNull: false,
      maxLength: 3,
      toUpperCase: true,
    });
  }
  if (payload.executionDay !== undefined) {
    if (payload.executionDay === null) {
      updates.executionDay = null;
    } else {
      const executionDay = Number.parseInt(payload.executionDay, 10);
      if (Number.isNaN(executionDay) || executionDay < 1 || executionDay > 31) {
        throw new ValidationError('Execution day must be between 1 and 31.');
      }
      updates.executionDay = executionDay;
    }
  }
  if (payload.metadata !== undefined) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }
  if (payload.fundingSourceId !== undefined) {
    if (payload.fundingSourceId == null) {
      updates.fundingSourceId = null;
    } else {
      const fundingSource = await WalletFundingSource.findOne({
        where: { id: payload.fundingSourceId, walletAccountId: account.id },
      });
      if (!fundingSource) {
        throw new ValidationError('Funding source not found for this wallet account.');
      }
      updates.fundingSourceId = fundingSource.id;
    }
  }

  updates.updatedById = actor?.actorId ?? actor?.id ?? actor?.userId ?? null;

  await rule.update(updates);
  invalidateCache(normalizedUserId);
  return rule.toPublicObject();
}

export async function deleteTransferRule(userId, ruleId, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const rule = await WalletTransferRule.findByPk(ruleId);
  if (!rule) {
    throw new NotFoundError('Transfer rule not found.');
  }

  const account = await WalletAccount.findOne({ where: { id: rule.walletAccountId, userId: normalizedUserId } });
  if (!account) {
    throw new AuthorizationError('You do not have access to this transfer rule.');
  }

  await rule.update({ status: 'archived' });
  invalidateCache(normalizedUserId);
  return { id: rule.id, status: 'archived' };
}

export async function createTransferRequest(userId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const account = await resolveWalletAccount(normalizedUserId, payload.walletAccountId);
  const amount = toNumber(payload.amount, null);
  if (amount == null || amount <= 0) {
    throw new ValidationError('Transfer amount must be greater than zero.');
  }
  if (amount > toNumber(account.availableBalance) + 1) {
    throw new ValidationError('Transfer amount exceeds available balance.');
  }
  const currencyCode = sanitizeString(payload.currencyCode ?? account.currencyCode ?? 'USD', {
    allowNull: false,
    maxLength: 3,
    toUpperCase: true,
  });
  const transferType = sanitizeString(payload.transferType ?? 'payout', {
    allowNull: false,
    maxLength: 40,
    toLowerCase: true,
  });
  const fundingSourceId = payload.fundingSourceId ?? null;
  if (fundingSourceId != null) {
    const fundingSource = await WalletFundingSource.findOne({
      where: { id: fundingSourceId, walletAccountId: account.id, status: { [Op.ne]: 'disabled' } },
    });
    if (!fundingSource) {
      throw new ValidationError('Funding source not available.');
    }
  }
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : null;
  if (scheduledAt && Number.isNaN(new Date(scheduledAt).getTime())) {
    throw new ValidationError('scheduledAt must be a valid ISO-8601 date.');
  }
  const notes = sanitizeString(payload.notes, { maxLength: 500, allowNull: true });
  const metadata = sanitizeMetadata(payload.metadata);

  const transfer = await WalletTransferRequest.create({
    walletAccountId: account.id,
    fundingSourceId,
    transferType,
    status: scheduledAt ? 'scheduled' : 'pending',
    amount,
    currencyCode,
    requestedById: actor?.actorId ?? actor?.id ?? actor?.userId ?? normalizedUserId,
    scheduledAt,
    notes,
    metadata,
  });

  invalidateCache(normalizedUserId);
  return transfer.toPublicObject();
}

export async function updateTransferRequest(userId, transferId, payload, actor) {
  const normalizedUserId = normalizeUserId(userId);
  assertCanManageWallet(normalizedUserId, actor);

  const transfer = await WalletTransferRequest.findByPk(transferId);
  if (!transfer) {
    throw new NotFoundError('Transfer request not found.');
  }

  const account = await WalletAccount.findOne({ where: { id: transfer.walletAccountId, userId: normalizedUserId } });
  if (!account) {
    throw new AuthorizationError('You do not have access to this transfer request.');
  }

  const updates = {};
  if (payload.status !== undefined) {
    const status = sanitizeString(payload.status, { allowNull: false, maxLength: 40, toLowerCase: true });
    const allowed = new Set(['pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled']);
    if (!allowed.has(status)) {
      throw new ValidationError('Invalid transfer status.');
    }
    updates.status = status;
    if (status === 'cancelled') {
      updates.metadata = {
        ...(transfer.metadata ?? {}),
        cancelledAt: new Date().toISOString(),
        cancelledBy: actor?.actorId ?? actor?.id ?? actor?.userId ?? normalizedUserId,
      };
    }
    if (status === 'completed') {
      updates.processedAt = new Date().toISOString();
    }
  }
  if (payload.notes !== undefined) {
    updates.notes = sanitizeString(payload.notes, { maxLength: 500, allowNull: true });
  }
  if (payload.scheduledAt !== undefined) {
    if (payload.scheduledAt == null || payload.scheduledAt === '') {
      updates.scheduledAt = null;
    } else {
      const scheduledAt = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new ValidationError('scheduledAt must be a valid ISO-8601 date.');
      }
      updates.scheduledAt = scheduledAt.toISOString();
      if (!['completed', 'failed'].includes(transfer.status)) {
        updates.status = 'scheduled';
      }
    }
  }
  if (payload.metadata !== undefined) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }

  await transfer.update(updates);
  invalidateCache(normalizedUserId);
  return transfer.toPublicObject();
}

export default {
  getWalletOverview,
  createFundingSource,
  updateFundingSource,
  createTransferRule,
  updateTransferRule,
  deleteTransferRule,
  createTransferRequest,
  updateTransferRequest,
};
