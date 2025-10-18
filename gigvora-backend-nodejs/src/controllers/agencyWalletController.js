import * as walletService from '../services/agencyWalletService.js';

function getRoles(req) {
  return Array.isArray(req.user?.roles) ? req.user.roles : req.user?.type ? [req.user.type] : [];
}

export async function overview(req, res) {
  const { workspaceId } = req.query ?? {};
  const result = await walletService.getWalletOverview(
    { workspaceId: workspaceId ?? undefined },
    { roles: getRoles(req) },
  );
  res.json(result);
}

export async function listAccounts(req, res) {
  const { workspaceId, status, search, limit, offset } = req.query ?? {};
  const result = await walletService.listWalletAccounts(
    {
      workspaceId: workspaceId ?? undefined,
      status: status ?? undefined,
      search: search ?? undefined,
      limit: limit ?? undefined,
      offset: offset ?? undefined,
    },
    { roles: getRoles(req) },
  );
  res.json(result);
}

export async function createAccount(req, res) {
  const result = await walletService.createWalletAccount(req.body ?? {}, {
    actorId: req.user?.id ?? null,
    roles: getRoles(req),
  });
  res.status(201).json(result);
}

export async function updateAccount(req, res) {
  const { accountId } = req.params ?? {};
  const result = await walletService.updateWalletAccount(accountId, req.body ?? {}, { roles: getRoles(req) });
  res.json(result);
}

export async function listLedger(req, res) {
  const { accountId } = req.params ?? {};
  const { limit, offset, entryType } = req.query ?? {};
  const result = await walletService.listLedgerEntries(
    accountId,
    {
      limit: limit ?? undefined,
      offset: offset ?? undefined,
      entryType: entryType ?? undefined,
    },
    { roles: getRoles(req) },
  );
  res.json(result);
}

export async function createLedger(req, res) {
  const { accountId } = req.params ?? {};
  const result = await walletService.createLedgerEntry(accountId, req.body ?? {}, {
    actorId: req.user?.id ?? null,
    roles: getRoles(req),
  });
  res.status(201).json(result);
}

export async function listFundingSources(req, res) {
  const { workspaceId } = req.query ?? {};
  const result = await walletService.listFundingSources(
    { workspaceId: workspaceId ?? undefined },
    { roles: getRoles(req) },
  );
  res.json(result);
}

export async function createFundingSource(req, res) {
  const result = await walletService.createFundingSource(req.body ?? {}, {
    actorId: req.user?.id ?? null,
    roles: getRoles(req),
  });
  res.status(201).json(result);
}

export async function updateFundingSource(req, res) {
  const { sourceId } = req.params ?? {};
  const result = await walletService.updateFundingSource(sourceId, req.body ?? {}, { roles: getRoles(req) });
  res.json(result);
}

export async function listPayoutRequests(req, res) {
  const { workspaceId, status } = req.query ?? {};
  const result = await walletService.listPayoutRequests(
    { workspaceId: workspaceId ?? undefined, status: status ?? undefined },
    { roles: getRoles(req) },
  );
  res.json(result);
}

export async function createPayoutRequest(req, res) {
  const result = await walletService.createPayoutRequest(req.body ?? {}, {
    actorId: req.user?.id ?? null,
    roles: getRoles(req),
  });
  res.status(201).json(result);
}

export async function updatePayoutRequest(req, res) {
  const { requestId } = req.params ?? {};
  const result = await walletService.updatePayoutRequest(requestId, req.body ?? {}, { roles: getRoles(req) });
  res.json(result);
}

export async function getSettings(req, res) {
  const { workspaceId } = req.query ?? {};
  const result = await walletService.getOperationalSettings({ workspaceId }, { roles: getRoles(req) });
  res.json({ settings: result });
}

export async function updateSettings(req, res) {
  const result = await walletService.updateOperationalSettings(req.body ?? {}, {
    actorId: req.user?.id ?? null,
    roles: getRoles(req),
  });
  res.json({ settings: result });
}

export default {
  overview,
  listAccounts,
  createAccount,
  updateAccount,
  listLedger,
  createLedger,
  listFundingSources,
  createFundingSource,
  updateFundingSource,
  listPayoutRequests,
  createPayoutRequest,
  updatePayoutRequest,
  getSettings,
  updateSettings,
};
