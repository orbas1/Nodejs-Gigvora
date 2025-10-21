import * as adminEscrowService from '../services/adminEscrowService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, buildAuditMetadata } from '../utils/adminRequestContext.js';

export async function getOverview(req, res) {
  const data = await adminEscrowService.getEscrowOverview({
    lookbackDays: req.query.lookbackDays,
    accounts: {
      status: req.query.accountStatus,
      provider: req.query.accountProvider,
      search: req.query.accountSearch,
      page: req.query.accountPage,
      pageSize: req.query.accountPageSize,
    },
    transactions: {
      status: req.query.transactionStatus,
      type: req.query.transactionType,
      reference: req.query.transactionReference,
      accountId: req.query.transactionAccountId,
      page: req.query.transactionPage,
      pageSize: req.query.transactionPageSize,
      minAmount: req.query.transactionMinAmount,
      maxAmount: req.query.transactionMaxAmount,
    },
  });
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin escrow overview fetched');
  res.json(data);
}

export async function listAccounts(req, res) {
  const accounts = await adminEscrowService.listEscrowAccounts({
    status: req.query.status,
    provider: req.query.provider,
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin escrow accounts listed');
  res.json(accounts);
}

export async function createAccount(req, res) {
  const actor = extractAdminActor(req);
  const account = await adminEscrowService.createEscrowAccountForUser(req.body ?? {});
  logger.info({ actor: actor.reference, accountId: account?.id }, 'Admin escrow account created');
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const actor = extractAdminActor(req);
  const account = await adminEscrowService.updateEscrowAccount(req.params.accountId, req.body ?? {});
  logger.info({ actor: actor.reference, accountId: req.params.accountId }, 'Admin escrow account updated');
  res.json(account);
}

export async function listTransactions(req, res) {
  const transactions = await adminEscrowService.listEscrowTransactions({
    status: req.query.status,
    type: req.query.type,
    reference: req.query.reference,
    accountId: req.query.accountId,
    page: req.query.page,
    pageSize: req.query.pageSize,
    minAmount: req.query.minAmount,
    maxAmount: req.query.maxAmount,
  });
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin escrow transactions listed');
  res.json(transactions);
}

export async function updateTransaction(req, res) {
  const actor = extractAdminActor(req);
  const transaction = await adminEscrowService.updateEscrowTransactionRecord(req.params.transactionId, {
    ...req.body,
    actorId: actor.actorId ?? null,
  });
  logger.info({ actor: actor.reference, transactionId: req.params.transactionId }, 'Admin escrow transaction updated');
  res.json(transaction);
}

export async function releaseTransaction(req, res) {
  const actor = extractAdminActor(req);
  const transaction = await adminEscrowService.releaseEscrow(req.params.transactionId, {
    ...req.body,
    actorId: actor.actorId ?? null,
    metadata: {
      ...(req.body?.metadata ?? {}),
      actor: buildAuditMetadata(actor, { action: 'release' }),
    },
  });
  logger.info({ actor: actor.reference, transactionId: req.params.transactionId }, 'Admin escrow transaction released');
  res.json(transaction);
}

export async function refundTransaction(req, res) {
  const actor = extractAdminActor(req);
  const transaction = await adminEscrowService.refundEscrow(req.params.transactionId, {
    ...req.body,
    actorId: actor.actorId ?? null,
    metadata: {
      ...(req.body?.metadata ?? {}),
      actor: buildAuditMetadata(actor, { action: 'refund' }),
    },
  });
  logger.info({ actor: actor.reference, transactionId: req.params.transactionId }, 'Admin escrow transaction refunded');
  res.json(transaction);
}

export async function updateProviderSettings(req, res) {
  const actor = extractAdminActor(req);
  const settings = await adminEscrowService.updateProviderSettings(req.body ?? {});
  logger.info({ actor: actor.reference }, 'Admin escrow provider settings updated');
  res.json(settings);
}

export async function createFeeTier(req, res) {
  const actor = extractAdminActor(req);
  const tier = await adminEscrowService.createEscrowFeeTier(req.body ?? {});
  logger.info({ actor: actor.reference, tierId: tier?.id }, 'Admin escrow fee tier created');
  res.status(201).json(tier);
}

export async function listFeeTiers(req, res) {
  const tiers = await adminEscrowService.listEscrowFeeTiers();
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin escrow fee tiers listed');
  res.json(tiers);
}

export async function updateFeeTier(req, res) {
  const actor = extractAdminActor(req);
  const tier = await adminEscrowService.updateEscrowFeeTier(req.params.tierId, req.body ?? {});
  logger.info({ actor: actor.reference, tierId: req.params.tierId }, 'Admin escrow fee tier updated');
  res.json(tier);
}

export async function deleteFeeTier(req, res) {
  await adminEscrowService.deleteEscrowFeeTier(req.params.tierId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, tierId: req.params.tierId }, 'Admin escrow fee tier deleted');
  res.status(204).send();
}

export async function createReleasePolicy(req, res) {
  const actor = extractAdminActor(req);
  const policy = await adminEscrowService.createEscrowReleasePolicy(req.body ?? {});
  logger.info({ actor: actor.reference, policyId: policy?.id }, 'Admin escrow release policy created');
  res.status(201).json(policy);
}

export async function listReleasePolicies(req, res) {
  const policies = await adminEscrowService.listEscrowReleasePolicies();
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin escrow release policies listed');
  res.json(policies);
}

export async function updateReleasePolicy(req, res) {
  const actor = extractAdminActor(req);
  const policy = await adminEscrowService.updateEscrowReleasePolicy(req.params.policyId, req.body ?? {});
  logger.info({ actor: actor.reference, policyId: req.params.policyId }, 'Admin escrow release policy updated');
  res.json(policy);
}

export async function deleteReleasePolicy(req, res) {
  await adminEscrowService.deleteEscrowReleasePolicy(req.params.policyId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, policyId: req.params.policyId }, 'Admin escrow release policy deleted');
  res.status(204).send();
}

export default {
  getOverview,
  listAccounts,
  createAccount,
  updateAccount,
  listTransactions,
  updateTransaction,
  releaseTransaction,
  refundTransaction,
  updateProviderSettings,
  listFeeTiers,
  createFeeTier,
  updateFeeTier,
  deleteFeeTier,
  listReleasePolicies,
  createReleasePolicy,
  updateReleasePolicy,
  deleteReleasePolicy,
};
