import { Op } from 'sequelize';
import {
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  ESCROW_ACCOUNT_STATUSES,
} from '../models/index.js';
import trustService from './trustService.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors.js';

const OUTSTANDING_TRANSACTION_STATUSES = new Set(['initiated', 'funded', 'in_escrow', 'disputed']);
const RELEASE_ELIGIBLE_STATUSES = new Set(['initiated', 'funded', 'in_escrow']);

function parseFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

function parsePositiveInteger(value, fieldName) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function normaliseLimit(limit, fallback = 50, maximum = 200) {
  if (limit == null || limit === '') {
    return fallback;
  }
  const numeric = Number(limit);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(numeric, maximum);
}

function safeNumber(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function calculateDurations(transactions) {
  const durations = transactions
    .filter((txn) => txn.releasedAt)
    .map((txn) => {
      const started = new Date(txn.createdAt ?? txn.updatedAt ?? Date.now());
      const completed = new Date(txn.releasedAt);
      return Math.max(0, Math.round((completed.getTime() - started.getTime()) / (1000 * 60 * 60 * 24)));
    });
  if (!durations.length) {
    return { averageReleaseDays: null, longestReleaseDays: null };
  }
  const total = durations.reduce((sum, value) => sum + value, 0);
  return {
    averageReleaseDays: Number((total / durations.length).toFixed(1)),
    longestReleaseDays: Math.max(...durations),
  };
}

async function ensureAccountOwnership(accountId, freelancerId) {
  const parsedAccountId = parsePositiveInteger(accountId, 'accountId');
  const account = await EscrowAccount.findByPk(parsedAccountId);
  if (!account) {
    throw new NotFoundError('Escrow account not found.');
  }
  if (account.userId !== freelancerId) {
    throw new AuthorizationError('This escrow account is not managed by the requested freelancer.');
  }
  return account;
}

async function ensureTransactionOwnership(transactionId, freelancerId) {
  const parsedTransactionId = parsePositiveInteger(transactionId, 'transactionId');
  const transaction = await EscrowTransaction.findByPk(parsedTransactionId);
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found.');
  }
  const account = await EscrowAccount.findByPk(transaction.accountId);
  if (!account || account.userId !== freelancerId) {
    throw new AuthorizationError('This escrow transaction is not managed by the requested freelancer.');
  }
  return { transaction, account };
}

function buildAccountSummaries(accounts, transactions, disputes) {
  const disputeCounts = new Map();
  disputes.forEach((dispute) => {
    const txnId = dispute.escrowTransactionId;
    disputeCounts.set(txnId, (disputeCounts.get(txnId) ?? 0) + 1);
  });

  const transactionGroups = new Map();
  transactions.forEach((txn) => {
    const group = transactionGroups.get(txn.accountId) ?? { transactions: [], outstanding: 0, released: 0 };
    group.transactions.push(txn);
    if (OUTSTANDING_TRANSACTION_STATUSES.has(txn.status)) {
      group.outstanding += safeNumber(txn.netAmount, txn.amount);
    }
    if (txn.status === 'released') {
      group.released += safeNumber(txn.netAmount, txn.amount);
    }
    transactionGroups.set(txn.accountId, group);
  });

  return accounts.map((account) => {
    const publicAccount = account.toPublicObject();
    const group = transactionGroups.get(account.id) ?? { transactions: [], outstanding: 0, released: 0 };
    const disputeTotal = group.transactions.reduce(
      (sum, txn) => sum + (disputeCounts.get(txn.id) ?? 0),
      0,
    );

    return {
      ...publicAccount,
      outstandingBalance: Number(group.outstanding.toFixed(2)),
      releasedVolume: Number(group.released.toFixed(2)),
      openTransactions: group.transactions.filter((txn) => OUTSTANDING_TRANSACTION_STATUSES.has(txn.status)).length,
      disputedTransactions: disputeTotal,
      settings: {
        autoReleaseOnApproval: Boolean(account.metadata?.settings?.autoReleaseOnApproval ?? true),
        notifyOnDispute: Boolean(account.metadata?.settings?.notifyOnDispute ?? true),
        manualHold: Boolean(account.metadata?.settings?.manualHold ?? false),
      },
    };
  });
}

function buildTransactionSummaries(transactions, accountsById) {
  return transactions.map((transaction) => {
    const plain = transaction.toPublicObject();
    return {
      ...plain,
      amount: safeNumber(plain.amount),
      netAmount: safeNumber(plain.netAmount, plain.amount),
      feeAmount: safeNumber(plain.feeAmount),
      account: accountsById.get(transaction.accountId)?.toPublicObject?.() ?? null,
      releaseEligible: RELEASE_ELIGIBLE_STATUSES.has(plain.status),
    };
  });
}

function buildDisputeSummaries(disputes) {
  return disputes.map((dispute) => {
    const plain = dispute.toPublicObject();
    return {
      ...plain,
      transaction: dispute.transaction?.toPublicObject?.() ?? null,
      events: Array.isArray(dispute.events)
        ? dispute.events.map((event) => event.toPublicObject?.() ?? event)
        : [],
    };
  });
}

function buildActivityLog(transactions) {
  const entries = [];
  transactions.forEach((txn) => {
    const auditTrail = Array.isArray(txn.auditTrail) ? txn.auditTrail : [];
    auditTrail.forEach((entry) => {
      entries.push({
        transactionId: txn.id,
        reference: txn.reference,
        status: txn.status,
        actorId: entry.actorId ?? null,
        action: entry.action ?? 'event',
        amount: safeNumber(entry.amount ?? txn.netAmount ?? txn.amount),
        notes: entry.notes ?? entry.metadata?.notes ?? null,
        occurredAt: entry.at ?? entry.occurredAt ?? txn.updatedAt ?? txn.createdAt,
      });
    });
  });
  entries.sort((a, b) => new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0));
  return entries.slice(0, 60);
}

export async function getFreelancerEscrowOverview(freelancerIdInput, { status, limit, includeDisputes = true } = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  const cappedLimit = normaliseLimit(limit, 50, 200);

  const accounts = await EscrowAccount.findAll({
    where: { userId: freelancerId },
    order: [['updatedAt', 'DESC']],
  });
  if (!accounts.length) {
    return {
      accounts: [],
      transactions: [],
      releaseQueue: [],
      disputes: [],
      metrics: {
        totalAccounts: 0,
        grossVolume: 0,
        netVolume: 0,
        outstanding: 0,
        released: 0,
        refunded: 0,
        disputedCount: 0,
        averageReleaseDays: null,
        longestReleaseDays: null,
      },
      activityLog: [],
    };
  }

  const accountIds = accounts.map((account) => account.id);
  const transactionWhere = { accountId: { [Op.in]: accountIds } };
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    transactionWhere.status = { [Op.in]: statuses }; // eslint-disable-line
  }

  const transactions = await EscrowTransaction.findAll({
    where: transactionWhere,
    limit: cappedLimit,
    order: [['createdAt', 'DESC']],
  });

  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const accountSummaries = buildAccountSummaries(accounts, transactions, []);

  let disputes = [];
  if (includeDisputes) {
    const transactionIds = transactions.map((txn) => txn.id);
    if (transactionIds.length) {
      disputes = await DisputeCase.findAll({
        where: { escrowTransactionId: { [Op.in]: transactionIds } },
        include: [
          { model: EscrowTransaction, as: 'transaction' },
          {
            model: DisputeEvent,
            as: 'events',
            separate: true,
            limit: 5,
            order: [['eventAt', 'DESC']],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 25,
      });
    }
  }

  const transactionSummaries = buildTransactionSummaries(transactions, accountsById);
  const disputeSummaries = buildDisputeSummaries(disputes);

  let grossVolume = 0;
  let netVolume = 0;
  let outstanding = 0;
  let released = 0;
  let refunded = 0;
  let disputedCount = 0;

  transactionSummaries.forEach((txn) => {
    grossVolume += safeNumber(txn.amount);
    netVolume += safeNumber(txn.netAmount, txn.amount);
    if (OUTSTANDING_TRANSACTION_STATUSES.has(txn.status)) {
      outstanding += safeNumber(txn.netAmount, txn.amount);
    }
    if (txn.status === 'released') {
      released += safeNumber(txn.netAmount, txn.amount);
    }
    if (txn.status === 'refunded') {
      refunded += safeNumber(txn.netAmount, txn.amount);
    }
    if (txn.status === 'disputed') {
      disputedCount += 1;
    }
  });

  const releaseQueue = transactionSummaries
    .filter((txn) => txn.scheduledReleaseAt && OUTSTANDING_TRANSACTION_STATUSES.has(txn.status))
    .sort((a, b) => new Date(a.scheduledReleaseAt) - new Date(b.scheduledReleaseAt))
    .slice(0, 20);

  const durations = calculateDurations(transactionSummaries);

  return {
    accounts: accountSummaries,
    transactions: transactionSummaries,
    releaseQueue,
    disputes: disputeSummaries,
    metrics: {
      totalAccounts: accounts.length,
      grossVolume: Number(grossVolume.toFixed(2)),
      netVolume: Number(netVolume.toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
      released: Number(released.toFixed(2)),
      refunded: Number(refunded.toFixed(2)),
      disputedCount,
      averageReleaseDays: durations.averageReleaseDays,
      longestReleaseDays: durations.longestReleaseDays,
    },
    activityLog: buildActivityLog(transactionSummaries),
  };
}

export async function ensureFreelancerEscrowAccount(freelancerIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  const { provider, currencyCode = 'USD', metadata = {} } = payload;
  if (!provider) {
    throw new ValidationError('provider is required to create an escrow account.');
  }
  return trustService.ensureEscrowAccount({
    userId: freelancerId,
    provider,
    currencyCode,
    metadata,
  });
}

export async function updateFreelancerEscrowAccount(freelancerIdInput, accountIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  const account = await ensureAccountOwnership(accountIdInput, freelancerId);

  const updates = {};
  if (payload.status) {
    if (!ESCROW_ACCOUNT_STATUSES.includes(payload.status)) {
      throw new ValidationError(`status must be one of: ${ESCROW_ACCOUNT_STATUSES.join(', ')}`);
    }
    updates.status = payload.status;
  }
  if (payload.currencyCode) {
    updates.currencyCode = payload.currencyCode;
  }

  const existingMetadata = account.metadata ?? {};
  if (payload.settings && typeof payload.settings === 'object') {
    updates.metadata = {
      ...existingMetadata,
      settings: {
        autoReleaseOnApproval: payload.settings.autoReleaseOnApproval ?? existingMetadata.settings?.autoReleaseOnApproval ?? true,
        notifyOnDispute: payload.settings.notifyOnDispute ?? existingMetadata.settings?.notifyOnDispute ?? true,
        manualHold: payload.settings.manualHold ?? existingMetadata.settings?.manualHold ?? false,
      },
    };
  } else if (payload.metadata) {
    updates.metadata = { ...existingMetadata, ...payload.metadata };
  }

  if (Object.keys(updates).length === 0) {
    return account.toPublicObject();
  }

  await account.update(updates);
  return account.toPublicObject();
}

export async function createFreelancerEscrowTransaction(freelancerIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  if (!payload.accountId) {
    throw new ValidationError('accountId is required to initiate an escrow transaction.');
  }
  const account = await ensureAccountOwnership(payload.accountId, freelancerId);
  return trustService.initiateEscrowTransaction({
    ...payload,
    accountId: account.id,
  });
}

export async function releaseFreelancerEscrowTransaction(freelancerIdInput, transactionIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  await ensureTransactionOwnership(transactionIdInput, freelancerId);
  return trustService.releaseEscrowTransaction(transactionIdInput, payload);
}

export async function refundFreelancerEscrowTransaction(freelancerIdInput, transactionIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  await ensureTransactionOwnership(transactionIdInput, freelancerId);
  return trustService.refundEscrowTransaction(transactionIdInput, payload);
}

export async function openFreelancerEscrowDispute(freelancerIdInput, transactionIdInput, payload = {}) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  const { transaction } = await ensureTransactionOwnership(transactionIdInput, freelancerId);
  return trustService.createDisputeCase({
    ...payload,
    escrowTransactionId: transaction.id,
    openedById: payload.openedById ?? freelancerId,
  });
}

export async function appendFreelancerEscrowDisputeEvent(
  freelancerIdInput,
  disputeIdInput,
  payload = {},
) {
  const freelancerId = parseFreelancerId(freelancerIdInput);
  const disputeId = parsePositiveInteger(disputeIdInput, 'disputeId');
  const dispute = await DisputeCase.findByPk(disputeId);
  if (!dispute) {
    throw new NotFoundError('Dispute case not found.');
  }
  await ensureTransactionOwnership(dispute.escrowTransactionId, freelancerId);
  return trustService.appendDisputeEvent(disputeId, payload);
}

export default {
  getFreelancerEscrowOverview,
  ensureFreelancerEscrowAccount,
  updateFreelancerEscrowAccount,
  createFreelancerEscrowTransaction,
  releaseFreelancerEscrowTransaction,
  refundFreelancerEscrowTransaction,
  openFreelancerEscrowDispute,
  appendFreelancerEscrowDisputeEvent,
};
