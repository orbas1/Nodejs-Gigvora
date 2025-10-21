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
import {
  buildAgencyActorContext,
  ensurePlainObject,
  mergeDefined,
  toOptionalPositiveInteger,
  toOptionalString,
  toPositiveInteger,
} from '../utils/controllerUtils.js';
import { resolveWorkspaceIdentifiersFromRequest } from '../utils/agencyWorkspaceAccess.js';

function normaliseWorkspaceQuery(req) {
  return resolveWorkspaceIdentifiersFromRequest(req, {}, { required: false });
}

function normalisePaging(query = {}, { defaultLimit = 25, maxLimit = 100 } = {}) {
  const limit =
    toOptionalPositiveInteger(query.limit, { fieldName: 'limit', required: false, allowZero: false }) ?? defaultLimit;
  const offset =
    toOptionalPositiveInteger(query.offset, { fieldName: 'offset', required: false, allowZero: true }) ?? 0;
  return { limit: Math.min(limit, maxLimit), offset };
}

function normaliseAccountQuery(req) {
  const workspace = normaliseWorkspaceQuery(req);
  const paging = normalisePaging(req.query ?? {}, { defaultLimit: 25, maxLimit: 100 });
  const status = toOptionalString(req.query?.status, { fieldName: 'status', maxLength: 40, lowercase: true });
  const search = toOptionalString(req.query?.search, { fieldName: 'search', maxLength: 200 });
  return mergeDefined(workspace, { ...paging, status, search });
}

function normaliseTransactionQuery(req) {
  const workspace = normaliseWorkspaceQuery(req);
  const paging = normalisePaging(req.query ?? {}, { defaultLimit: 50, maxLimit: 200 });
  const status = toOptionalString(req.query?.status, { fieldName: 'status', maxLength: 40, lowercase: true });
  const type = toOptionalString(req.query?.type, { fieldName: 'type', maxLength: 40, lowercase: true });
  return mergeDefined(workspace, { ...paging, status, type });
}

export async function fetchOverview(req, res) {
  const actor = buildAgencyActorContext(req);
  const filters = mergeDefined(normaliseWorkspaceQuery(req), {});
  const result = await getEscrowOverview(filters, actor);
  res.json(result);
}

export async function fetchAccounts(req, res) {
  const actor = buildAgencyActorContext(req);
  const filters = normaliseAccountQuery(req);
  const result = await listEscrowAccounts(filters, actor);
  res.json(result);
}

export async function createAccount(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await createEscrowAccountForWorkspace(payload, query, actor);
  res.status(201).json(result);
}

export async function updateAccount(req, res) {
  const actor = buildAgencyActorContext(req);
  const accountId = toPositiveInteger(req.params?.accountId, { fieldName: 'accountId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await updateEscrowAccountForWorkspace(accountId, payload, query, actor);
  res.json(result);
}

export async function fetchTransactions(req, res) {
  const actor = buildAgencyActorContext(req);
  const filters = normaliseTransactionQuery(req);
  const result = await listEscrowTransactions(filters, actor);
  res.json(result);
}

export async function createTransaction(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await createEscrowTransactionForWorkspace(payload, query, actor);
  res.status(201).json(result);
}

export async function updateTransaction(req, res) {
  const actor = buildAgencyActorContext(req);
  const transactionId = toPositiveInteger(req.params?.transactionId, { fieldName: 'transactionId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await updateEscrowTransactionDetails(transactionId, payload, query, actor);
  res.json(result);
}

export async function releaseTransaction(req, res) {
  const actor = buildAgencyActorContext(req);
  const transactionId = toPositiveInteger(req.params?.transactionId, { fieldName: 'transactionId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await releaseEscrowForWorkspace(transactionId, payload, query, actor);
  res.json(result);
}

export async function refundTransaction(req, res) {
  const actor = buildAgencyActorContext(req);
  const transactionId = toPositiveInteger(req.params?.transactionId, { fieldName: 'transactionId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await refundEscrowForWorkspace(transactionId, payload, query, actor);
  res.json(result);
}

export async function updateSettings(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const query = normaliseWorkspaceQuery(req);
  const result = await updateEscrowSettingsForWorkspace(payload, query, actor);
  res.json(result);
}

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
