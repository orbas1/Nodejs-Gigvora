import {
  getCompanyEscrowOverview,
  createWorkspaceEscrowAccount,
  updateWorkspaceEscrowAccount,
  initiateWorkspaceEscrowTransaction,
  releaseWorkspaceEscrowTransaction,
  refundWorkspaceEscrowTransaction,
  updateWorkspaceEscrowAutomation,
} from '../services/companyEscrowService.js';

function parseActorId(req) {
  const headerValue = req.headers?.['x-user-id'] ?? req.headers?.['X-User-Id'];
  if (headerValue != null && `${headerValue}`.trim().length > 0) {
    const numeric = Number.parseInt(`${headerValue}`.trim(), 10);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  const bodyActor = req.body?.actorId ?? req.body?.userId ?? null;
  if (bodyActor != null && `${bodyActor}`.trim().length > 0) {
    const numeric = Number.parseInt(`${bodyActor}`.trim(), 10);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

export async function overview(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays, forceRefresh } = req.query ?? {};

  const result = await getCompanyEscrowOverview({
    workspaceId: workspaceId ?? undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays,
    forceRefresh,
  });

  res.json(result);
}

export async function createAccount(req, res) {
  const actorId = parseActorId(req);
  const payload = {
    ...req.body,
    actorId,
  };
  const account = await createWorkspaceEscrowAccount(payload);
  res.status(201).json(account);
}

export async function updateAccount(req, res) {
  const actorId = parseActorId(req);
  const accountId = Number.parseInt(req.params?.accountId, 10);
  const account = await updateWorkspaceEscrowAccount({
    ...req.body,
    accountId,
    actorId,
  });
  res.json(account);
}

export async function createTransaction(req, res) {
  const actorId = parseActorId(req);
  const transaction = await initiateWorkspaceEscrowTransaction({
    ...req.body,
    actorId,
  });
  res.status(201).json(transaction);
}

export async function releaseTransaction(req, res) {
  const actorId = parseActorId(req);
  const transactionId = Number.parseInt(req.params?.transactionId, 10);
  const result = await releaseWorkspaceEscrowTransaction({
    ...req.body,
    transactionId,
    actorId,
  });
  res.json(result);
}

export async function refundTransaction(req, res) {
  const actorId = parseActorId(req);
  const transactionId = Number.parseInt(req.params?.transactionId, 10);
  const result = await refundWorkspaceEscrowTransaction({
    ...req.body,
    transactionId,
    actorId,
  });
  res.json(result);
}

export async function updateAutomation(req, res) {
  const actorId = parseActorId(req);
  const settings = await updateWorkspaceEscrowAutomation({
    ...req.body,
    actorId,
  });
  res.json(settings);
}

export default {
  overview,
  createAccount,
  updateAccount,
  createTransaction,
  releaseTransaction,
  refundTransaction,
  updateAutomation,
};
