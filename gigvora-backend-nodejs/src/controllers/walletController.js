import walletManagementService from '../services/walletManagementService.js';

function buildActorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRoles: Array.isArray(req.user?.roles) ? req.user.roles : [],
  };
}

export async function overview(req, res) {
  const snapshot = await walletManagementService.getWalletOverview(req.params.id, {
    bypassCache: req.query.refresh === true || req.query.refresh === 'true',
  });
  res.json(snapshot);
}

export async function createFundingSource(req, res) {
  const source = await walletManagementService.createFundingSource(req.params.id, req.body, buildActorContext(req));
  res.status(201).json(source);
}

export async function updateFundingSource(req, res) {
  const source = await walletManagementService.updateFundingSource(
    req.params.id,
    req.params.fundingSourceId,
    req.body,
    buildActorContext(req),
  );
  res.json(source);
}

export async function createTransferRule(req, res) {
  const rule = await walletManagementService.createTransferRule(req.params.id, req.body, buildActorContext(req));
  res.status(201).json(rule);
}

export async function updateTransferRule(req, res) {
  const rule = await walletManagementService.updateTransferRule(
    req.params.id,
    req.params.ruleId,
    req.body,
    buildActorContext(req),
  );
  res.json(rule);
}

export async function deleteTransferRule(req, res) {
  const result = await walletManagementService.deleteTransferRule(
    req.params.id,
    req.params.ruleId,
    buildActorContext(req),
  );
  res.json(result);
}

export async function createTransferRequest(req, res) {
  const transfer = await walletManagementService.createTransferRequest(
    req.params.id,
    req.body,
    buildActorContext(req),
  );
  res.status(201).json(transfer);
}

export async function updateTransferRequest(req, res) {
  const transfer = await walletManagementService.updateTransferRequest(
    req.params.id,
    req.params.transferId,
    req.body,
    buildActorContext(req),
  );
  res.json(transfer);
}

export default {
  overview,
  createFundingSource,
  updateFundingSource,
  createTransferRule,
  updateTransferRule,
  deleteTransferRule,
  createTransferRequest,
  updateTransferRequest,
};
