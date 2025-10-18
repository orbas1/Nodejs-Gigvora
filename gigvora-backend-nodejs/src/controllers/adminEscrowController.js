import * as adminEscrowService from '../services/adminEscrowService.js';

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
  res.json(accounts);
}

export async function createAccount(req, res) {
  const account = await adminEscrowService.createEscrowAccountForUser(req.body ?? {});
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const account = await adminEscrowService.updateEscrowAccount(req.params.accountId, req.body ?? {});
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
  res.json(transactions);
}

export async function updateTransaction(req, res) {
  const transaction = await adminEscrowService.updateEscrowTransactionRecord(
    req.params.transactionId,
    req.body ?? {},
  );
  res.json(transaction);
}

export async function releaseTransaction(req, res) {
  const actorId = req.user?.id ?? null;
  const transaction = await adminEscrowService.releaseEscrow(req.params.transactionId, {
    ...req.body,
    actorId,
  });
  res.json(transaction);
}

export async function refundTransaction(req, res) {
  const actorId = req.user?.id ?? null;
  const transaction = await adminEscrowService.refundEscrow(req.params.transactionId, {
    ...req.body,
    actorId,
  });
  res.json(transaction);
}

export async function updateProviderSettings(req, res) {
  const settings = await adminEscrowService.updateProviderSettings(req.body ?? {});
  res.json(settings);
}

export async function createFeeTier(req, res) {
  const tier = await adminEscrowService.createEscrowFeeTier(req.body ?? {});
  res.status(201).json(tier);
}

export async function listFeeTiers(req, res) {
  const tiers = await adminEscrowService.listEscrowFeeTiers();
  res.json(tiers);
}

export async function updateFeeTier(req, res) {
  const tier = await adminEscrowService.updateEscrowFeeTier(req.params.tierId, req.body ?? {});
  res.json(tier);
}

export async function deleteFeeTier(req, res) {
  await adminEscrowService.deleteEscrowFeeTier(req.params.tierId);
  res.status(204).send();
}

export async function createReleasePolicy(req, res) {
  const policy = await adminEscrowService.createEscrowReleasePolicy(req.body ?? {});
  res.status(201).json(policy);
}

export async function listReleasePolicies(req, res) {
  const policies = await adminEscrowService.listEscrowReleasePolicies();
  res.json(policies);
}

export async function updateReleasePolicy(req, res) {
  const policy = await adminEscrowService.updateEscrowReleasePolicy(
    req.params.policyId,
    req.body ?? {},
  );
  res.json(policy);
}

export async function deleteReleasePolicy(req, res) {
  await adminEscrowService.deleteEscrowReleasePolicy(req.params.policyId);
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
