import asyncHandler from '../utils/asyncHandler.js';
import {
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
} from '../services/agencyEscrowService.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildActorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? null,
  };
}

export const fetchOverview = asyncHandler(async (req, res) => {
  const result = await getEscrowOverview(req.query ?? {}, buildActorContext(req));
  res.json(result);
});

export const fetchAccounts = asyncHandler(async (req, res) => {
  const result = await listEscrowAccounts(
    {
      ...req.query,
      limit: parseNumber(req.query?.limit, 25),
      offset: parseNumber(req.query?.offset, 0),
    },
    buildActorContext(req),
  );
  res.json(result);
});

export const createAccount = asyncHandler(async (req, res) => {
  const result = await createEscrowAccountForWorkspace(req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.status(201).json(result);
});

export const updateAccount = asyncHandler(async (req, res) => {
  const accountId = parseNumber(req.params?.accountId);
  const result = await updateEscrowAccountForWorkspace(accountId, req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.json(result);
});

export const fetchTransactions = asyncHandler(async (req, res) => {
  const result = await listEscrowTransactions(
    {
      ...req.query,
      limit: parseNumber(req.query?.limit, 50),
      offset: parseNumber(req.query?.offset, 0),
    },
    buildActorContext(req),
  );
  res.json(result);
});

export const createTransaction = asyncHandler(async (req, res) => {
  const result = await createEscrowTransactionForWorkspace(req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.status(201).json(result);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transactionId = parseNumber(req.params?.transactionId);
  const result = await updateEscrowTransactionDetails(
    transactionId,
    req.body ?? {},
    req.query ?? {},
    buildActorContext(req),
  );
  res.json(result);
});

export const releaseTransaction = asyncHandler(async (req, res) => {
  const transactionId = parseNumber(req.params?.transactionId);
  const result = await releaseEscrowForWorkspace(transactionId, req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.json(result);
});

export const refundTransaction = asyncHandler(async (req, res) => {
  const transactionId = parseNumber(req.params?.transactionId);
  const result = await refundEscrowForWorkspace(transactionId, req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.json(result);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const result = await updateEscrowSettingsForWorkspace(req.body ?? {}, req.query ?? {}, buildActorContext(req));
  res.json(result);
});

export default {
  fetchOverview,
  fetchAccounts,
  createAccount,
  updateAccount,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  releaseTransaction,
  refundTransaction,
  updateSettings,
};
