import { Op } from 'sequelize';

import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  User,
  CompanyProfile,
  ESCROW_ACCOUNT_STATUSES,
} from '../models/index.js';
import { ensureEscrowAccount, initiateEscrowTransaction, releaseEscrowTransaction, refundEscrowTransaction } from './trustService.js';
import { appCache } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_PREFIX = 'company:escrow:overview';
const CACHE_TTL_SECONDS = 45;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 180;

function clamp(value, { min, max, fallback }) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return Math.round(numeric);
}

function parseDecimal(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number.parseFloat(numeric.toFixed(2));
}

function buildWorkspaceCacheKey({ workspaceId, workspaceSlug, lookbackDays }) {
  const lookbackSegment = lookbackDays ?? 'default';
  const idSegment = workspaceId ? `id:${workspaceId}` : 'id:unknown';
  const slugSegment = workspaceSlug ? `slug:${workspaceSlug}` : 'slug:unknown';
  return `${CACHE_PREFIX}:${idSegment}:${slugSegment}:${lookbackSegment}`;
}

function invalidateWorkspaceCache({ id, slug }) {
  if (id) {
    appCache.flushByPrefix(`${CACHE_PREFIX}:id:${id}:`);
  }
  if (slug) {
    appCache.flushByPrefix(`${CACHE_PREFIX}:slug:${slug}:`);
  }
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 50,
  });

  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

async function resolveWorkspace({ workspaceId, workspaceSlug }) {
  const where = { type: 'company' };
  if (workspaceId != null) {
    const id = Number.parseInt(workspaceId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    where.id = id;
  } else if (workspaceSlug != null && `${workspaceSlug}`.trim().length > 0) {
    where.slug = `${workspaceSlug}`.trim().toLowerCase();
  } else {
    throw new ValidationError('workspaceId or workspaceSlug is required.');
  }

  const workspace = await ProviderWorkspace.findOne({ where });
  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }

  return workspace;
}

async function ensureWorkspaceMemberUserIds(workspace) {
  const members = await ProviderWorkspaceMember.findAll({
    where: { workspaceId: workspace.id, status: 'active' },
    attributes: ['userId'],
  });
  const ids = new Set(members.map((member) => member.userId).filter(Boolean));
  if (workspace.ownerId) {
    ids.add(workspace.ownerId);
  }
  return ids;
}

function normaliseUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  const firstName = plain.firstName ?? '';
  const lastName = plain.lastName ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || plain.email || 'Workspace member';
  return {
    id: plain.id,
    name,
    email: plain.email ?? null,
    firstName: firstName || null,
    lastName: lastName || null,
  };
}

function mapAccount(account) {
  const plain = account.get ? account.get({ plain: true }) : account;
  const metadata = plain.metadata && typeof plain.metadata === 'object' ? { ...plain.metadata } : {};
  return {
    id: plain.id,
    userId: plain.userId,
    provider: plain.provider,
    status: plain.status,
    currencyCode: plain.currencyCode,
    currentBalance: parseDecimal(plain.currentBalance),
    pendingReleaseTotal: parseDecimal(plain.pendingReleaseTotal),
    lastReconciledAt: plain.lastReconciledAt,
    metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    label: metadata.label ?? `Account ${plain.id}`,
    notes: metadata.notes ?? null,
    logoUrl: metadata.logoUrl ?? null,
    owner: normaliseUser(plain.owner),
  };
}

function mapDispute(dispute) {
  if (!dispute) {
    return null;
  }
  const plain = dispute.toPublicObject ? dispute.toPublicObject() : dispute.get?.({ plain: true }) ?? dispute;
  return {
    id: plain.id,
    transactionId: plain.escrowTransactionId,
    stage: plain.stage,
    status: plain.status,
    priority: plain.priority,
    summary: plain.summary,
    reasonCode: plain.reasonCode,
    openedAt: plain.openedAt,
    resolvedAt: plain.resolvedAt,
    metadata: plain.metadata ?? {},
  };
}

function mapTransaction(transaction) {
  const plain = transaction.toPublicObject ? transaction.toPublicObject() : transaction.get?.({ plain: true }) ?? transaction;
  const disputes = Array.isArray(transaction.disputes)
    ? transaction.disputes.map(mapDispute).filter(Boolean)
    : [];
  return {
    id: plain.id,
    accountId: plain.accountId,
    reference: plain.reference,
    externalId: plain.externalId,
    type: plain.type,
    status: plain.status,
    amount: parseDecimal(plain.amount),
    feeAmount: parseDecimal(plain.feeAmount),
    netAmount: parseDecimal(plain.netAmount),
    currencyCode: plain.currencyCode,
    initiatedById: plain.initiatedById,
    counterpartyId: plain.counterpartyId,
    projectId: plain.projectId,
    gigId: plain.gigId,
    milestoneLabel: plain.milestoneLabel,
    scheduledReleaseAt: plain.scheduledReleaseAt,
    releasedAt: plain.releasedAt,
    refundedAt: plain.refundedAt,
    cancelledAt: plain.cancelledAt,
    metadata: plain.metadata ?? {},
    auditTrail: plain.auditTrail ?? [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    disputes,
    account: transaction.account ? mapAccount(transaction.account) : null,
  };
}

function computeSummary({ accounts, transactions, lookbackSince }) {
  const totalBalance = accounts.reduce((sum, account) => sum + parseDecimal(account.currentBalance), 0);
  const pendingRelease = accounts.reduce((sum, account) => sum + parseDecimal(account.pendingReleaseTotal), 0);
  const activeAccounts = accounts.filter((account) => account.status === 'active').length;
  const openTransactions = transactions.filter((txn) => ['in_escrow', 'funded', 'initiated'].includes(txn.status)).length;
  const disputes = transactions.flatMap((txn) => txn.disputes ?? []).length;
  const releasedLastWindow = transactions
    .filter((txn) => txn.status === 'released' && txn.releasedAt && (!lookbackSince || new Date(txn.releasedAt) >= lookbackSince))
    .reduce((sum, txn) => sum + parseDecimal(txn.netAmount || txn.amount), 0);

  return {
    totalBalance: parseDecimal(totalBalance),
    pendingRelease: parseDecimal(pendingRelease),
    activeAccounts,
    totalAccounts: accounts.length,
    openTransactions,
    openDisputes: disputes,
    releasedInWindow: parseDecimal(releasedLastWindow),
  };
}

function extractAutomationSettings(workspace) {
  const settings = workspace.settings && typeof workspace.settings === 'object' ? workspace.settings : {};
  const escrowSettings = settings.escrow && typeof settings.escrow === 'object' ? settings.escrow : {};

  return {
    autoReleaseEnabled: escrowSettings.autoReleaseEnabled !== false,
    manualReviewThreshold: Number.isFinite(Number(escrowSettings.manualReviewThreshold))
      ? Number(escrowSettings.manualReviewThreshold)
      : 10000,
    notifyFinanceTeam: escrowSettings.notifyFinanceTeam !== false,
    defaultReleaseOffsetHours: Number.isFinite(Number(escrowSettings.defaultReleaseOffsetHours))
      ? Number(escrowSettings.defaultReleaseOffsetHours)
      : 24,
    releasePolicy: escrowSettings.releasePolicy ?? 'milestone',
    webhookUrl: escrowSettings.webhookUrl ?? null,
  };
}

function buildRecentActivity(transactions) {
  return transactions.slice(0, 10).map((txn) => ({
    id: `txn-${txn.id}`,
    type: txn.status,
    reference: txn.reference,
    occurredAt: txn.updatedAt ?? txn.createdAt,
    amount: txn.amount,
    currencyCode: txn.currencyCode,
    milestoneLabel: txn.milestoneLabel ?? null,
  }));
}

export async function getCompanyEscrowOverview({ workspaceId, workspaceSlug, lookbackDays, forceRefresh = false } = {}) {
  const lookback = clamp(lookbackDays, { min: MIN_LOOKBACK_DAYS, max: MAX_LOOKBACK_DAYS, fallback: 30 });
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const cacheKey = buildWorkspaceCacheKey({ workspaceId: workspace.id, workspaceSlug: workspace.slug, lookbackDays: lookback });

  if (!forceRefresh) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const lookbackSince = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  if (!memberIds.size) {
    throw new ValidationError('No active members found for this workspace.');
  }

  const accounts = await EscrowAccount.findAll({
    where: { userId: { [Op.in]: Array.from(memberIds) } },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['updatedAt', 'DESC']],
  });

  const accountModels = accounts.map(mapAccount);
  const accountIds = accountModels.map((account) => account.id);

  let transactions = [];
  if (accountIds.length) {
    const transactionRecords = await EscrowTransaction.findAll({
      where: {
        accountId: { [Op.in]: accountIds },
        createdAt: { [Op.gte]: lookbackSince },
      },
      include: [
        {
          model: EscrowAccount,
          as: 'account',
          include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        { model: DisputeCase, as: 'disputes' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    transactions = transactionRecords.map(mapTransaction);
  }

  const releaseQueue = transactions
    .filter((txn) => ['in_escrow', 'funded'].includes(txn.status))
    .sort((a, b) => new Date(a.scheduledReleaseAt ?? a.createdAt) - new Date(b.scheduledReleaseAt ?? b.createdAt));

  const disputes = transactions.flatMap((txn) => txn.disputes ?? []);

  const members = await ProviderWorkspaceMember.findAll({
    where: { workspaceId: workspace.id, status: 'active' },
    include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['role', 'ASC']],
  });

  const memberProfiles = members.map((member) => ({
    id: member.userId,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
    user: normaliseUser(member.member),
  }));

  if (workspace.ownerId && !memberProfiles.some((member) => member.id === workspace.ownerId)) {
    const owner = await User.findByPk(workspace.ownerId);
    if (owner) {
      memberProfiles.unshift({
        id: workspace.ownerId,
        role: 'owner',
        status: 'active',
        joinedAt: workspace.createdAt,
        user: normaliseUser(owner),
      });
    }
  }

  const companyProfile = await CompanyProfile.findOne({ where: { userId: workspace.ownerId } });
  const summary = computeSummary({ accounts: accountModels, transactions, lookbackSince });
  const automation = extractAutomationSettings(workspace);
  const activity = buildRecentActivity(transactions);
  const availableWorkspaces = await listAvailableWorkspaces();

  const payload = {
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      defaultCurrency: workspace.defaultCurrency,
      timezone: workspace.timezone,
    },
    profile: companyProfile ? companyProfile.get({ plain: true }) : null,
    summary,
    accounts: accountModels,
    transactions,
    releaseQueue,
    disputes,
    automation,
    members: memberProfiles,
    recentActivity: activity,
    permissions: {
      canCreateAccount: true,
      canManageTransactions: true,
      requiredRole: 'company_admin',
    },
    meta: {
      selectedWorkspaceId: workspace.id,
      selectedWorkspaceSlug: workspace.slug,
      lookbackDays: lookback,
      availableWorkspaces,
    },
  };

  appCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

  return payload;
}

function assertAccountBelongsToWorkspace(account, memberIds) {
  if (!memberIds.has(account.userId)) {
    throw new ValidationError('Escrow account is not linked to the requested workspace.');
  }
}

function mergeMetadata(existingMetadata, updates) {
  const base = existingMetadata && typeof existingMetadata === 'object' ? { ...existingMetadata } : {};
  Object.entries(updates)
    .filter(([, value]) => value !== undefined)
    .forEach(([key, value]) => {
      base[key] = value === null ? null : value;
    });
  return base;
}

export async function createWorkspaceEscrowAccount(payload) {
  const { workspaceId, workspaceSlug, userId, provider, currencyCode, label, notes, logoUrl, metadata = {}, status, actorId } = payload;
  if (!userId) {
    throw new ValidationError('userId is required to create an escrow account.');
  }
  if (!provider) {
    throw new ValidationError('provider is required to create an escrow account.');
  }
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  if (!memberIds.has(Number(userId))) {
    throw new ValidationError('Selected member is not part of this workspace.');
  }

  const account = await ensureEscrowAccount({
    userId,
    provider,
    currencyCode: currencyCode ?? workspace.defaultCurrency ?? 'USD',
    metadata: mergeMetadata({}, { createdBy: actorId ?? null }),
  });

  const accountRecord = await EscrowAccount.findByPk(account.id);
  if (!accountRecord) {
    throw new NotFoundError('Escrow account could not be loaded after creation.');
  }

  const metadataUpdates = mergeMetadata(accountRecord.metadata, { label: label ?? null, notes: notes ?? null, logoUrl: logoUrl ?? null, ...metadata });
  const updates = {
    metadata: metadataUpdates,
  };
  if (currencyCode) {
    updates.currencyCode = currencyCode.toUpperCase();
  }
  if (status && ESCROW_ACCOUNT_STATUSES.includes(status)) {
    updates.status = status;
  } else if (!status && accountRecord.status === 'pending') {
    updates.status = 'active';
  }

  await accountRecord.update(updates);

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return mapAccount(accountRecord);
}

export async function updateWorkspaceEscrowAccount({ workspaceId, workspaceSlug, accountId, status, currencyCode, label, notes, logoUrl, metadata = {}, actorId }) {
  if (!accountId) {
    throw new ValidationError('accountId is required.');
  }
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const account = await EscrowAccount.findByPk(accountId);
  if (!account) {
    throw new NotFoundError('Escrow account not found.');
  }
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  assertAccountBelongsToWorkspace(account, memberIds);

  const updates = {};
  if (status) {
    if (!ESCROW_ACCOUNT_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${ESCROW_ACCOUNT_STATUSES.join(', ')}.`);
    }
    updates.status = status;
  }
  if (currencyCode) {
    updates.currencyCode = currencyCode.toUpperCase();
  }

  const metadataUpdates = mergeMetadata(account.metadata, {
    label: label ?? undefined,
    notes: notes ?? undefined,
    logoUrl: logoUrl ?? undefined,
    updatedBy: actorId ?? null,
    updatedAt: new Date().toISOString(),
    ...metadata,
  });
  updates.metadata = metadataUpdates;

  await account.update(updates);

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return mapAccount(account);
}

export async function initiateWorkspaceEscrowTransaction(payload) {
  const {
    workspaceId,
    workspaceSlug,
    accountId,
    reference,
    amount,
    currencyCode,
    feeAmount,
    type = 'project',
    counterpartyId,
    projectId,
    gigId,
    milestoneLabel,
    scheduledReleaseAt,
    metadata = {},
    actorId,
  } = payload;

  if (!accountId) {
    throw new ValidationError('accountId is required to initiate an escrow transaction.');
  }
  if (!reference) {
    throw new ValidationError('reference is required to initiate an escrow transaction.');
  }
  if (!actorId) {
    throw new ValidationError('actorId is required to initiate an escrow transaction.');
  }

  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const account = await EscrowAccount.findByPk(accountId);
  if (!account) {
    throw new NotFoundError('Escrow account not found.');
  }
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  assertAccountBelongsToWorkspace(account, memberIds);

  const transaction = await initiateEscrowTransaction({
    accountId,
    reference,
    amount,
    currencyCode: currencyCode ?? account.currencyCode,
    feeAmount,
    type,
    initiatedById: actorId,
    counterpartyId,
    projectId,
    gigId,
    milestoneLabel,
    scheduledReleaseAt,
    metadata: mergeMetadata(metadata, { workspaceId: workspace.id, initiatedBy: actorId }),
  });

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return transaction;
}

export async function releaseWorkspaceEscrowTransaction({ workspaceId, workspaceSlug, transactionId, actorId, notes, metadata = {} }) {
  if (!transactionId) {
    throw new ValidationError('transactionId is required.');
  }
  if (!actorId) {
    throw new ValidationError('actorId is required to release an escrow transaction.');
  }

  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const transaction = await EscrowTransaction.findByPk(transactionId, { include: [{ model: EscrowAccount, as: 'account' }] });
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found.');
  }
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  assertAccountBelongsToWorkspace(transaction.account, memberIds);

  const result = await releaseEscrowTransaction(transactionId, { actorId, notes, metadata: mergeMetadata(metadata, { workspaceId: workspace.id }) });

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return result;
}

export async function refundWorkspaceEscrowTransaction({ workspaceId, workspaceSlug, transactionId, actorId, notes, metadata = {} }) {
  if (!transactionId) {
    throw new ValidationError('transactionId is required.');
  }
  if (!actorId) {
    throw new ValidationError('actorId is required to refund an escrow transaction.');
  }

  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const transaction = await EscrowTransaction.findByPk(transactionId, { include: [{ model: EscrowAccount, as: 'account' }] });
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found.');
  }
  const memberIds = await ensureWorkspaceMemberUserIds(workspace);
  assertAccountBelongsToWorkspace(transaction.account, memberIds);

  const result = await refundEscrowTransaction(transactionId, { actorId, notes, metadata: mergeMetadata(metadata, { workspaceId: workspace.id }) });

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return result;
}

export async function updateWorkspaceEscrowAutomation({ workspaceId, workspaceSlug, autoReleaseEnabled, manualReviewThreshold, notifyFinanceTeam, defaultReleaseOffsetHours, releasePolicy, webhookUrl, actorId }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const settings = workspace.settings && typeof workspace.settings === 'object' ? { ...workspace.settings } : {};
  const escrowSettings = settings.escrow && typeof settings.escrow === 'object' ? { ...settings.escrow } : {};

  if (autoReleaseEnabled != null) {
    escrowSettings.autoReleaseEnabled = Boolean(autoReleaseEnabled);
  }
  if (manualReviewThreshold != null && Number.isFinite(Number(manualReviewThreshold))) {
    escrowSettings.manualReviewThreshold = Number(manualReviewThreshold);
  }
  if (notifyFinanceTeam != null) {
    escrowSettings.notifyFinanceTeam = Boolean(notifyFinanceTeam);
  }
  if (defaultReleaseOffsetHours != null && Number.isFinite(Number(defaultReleaseOffsetHours))) {
    escrowSettings.defaultReleaseOffsetHours = Number(defaultReleaseOffsetHours);
  }
  if (releasePolicy) {
    escrowSettings.releasePolicy = releasePolicy;
  }
  if (webhookUrl !== undefined) {
    escrowSettings.webhookUrl = webhookUrl || null;
  }

  escrowSettings.updatedAt = new Date().toISOString();
  escrowSettings.updatedBy = actorId ?? null;

  settings.escrow = escrowSettings;

  await workspace.update({ settings });

  invalidateWorkspaceCache({ id: workspace.id, slug: workspace.slug });

  return escrowSettings;
}

export default {
  getCompanyEscrowOverview,
  createWorkspaceEscrowAccount,
  updateWorkspaceEscrowAccount,
  initiateWorkspaceEscrowTransaction,
  releaseWorkspaceEscrowTransaction,
  refundWorkspaceEscrowTransaction,
  updateWorkspaceEscrowAutomation,
};
