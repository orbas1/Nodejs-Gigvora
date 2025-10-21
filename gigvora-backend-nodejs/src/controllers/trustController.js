import asyncHandler from '../utils/asyncHandler.js';
import trustService from '../services/trustService.js';

function toBoolean(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return undefined;
}

function normaliseDisputeFilters(query = {}) {
  const filters = { ...query };

  if (filters.limit != null && filters.pageSize == null) {
    filters.pageSize = filters.limit;
  }

  if (filters.offset != null && filters.page == null && filters.pageSize != null) {
    const pageSize = Number.parseInt(filters.pageSize, 10);
    const offset = Number.parseInt(filters.offset, 10);
    if (Number.isFinite(pageSize) && pageSize > 0 && Number.isFinite(offset)) {
      filters.page = Math.floor(offset / pageSize) + 1;
    }
  }

  if (filters.includeClosed != null && filters.openOnly == null) {
    const includeClosed = toBoolean(filters.includeClosed);
    filters.openOnly = includeClosed === undefined ? filters.openOnly : !includeClosed;
  }
  delete filters.includeClosed;

  if (filters.openOnly != null) {
    const parsed = toBoolean(filters.openOnly);
    if (parsed !== undefined) {
      filters.openOnly = parsed;
    }
  }

  return filters;
}

export const createEscrowAccount = asyncHandler(async (req, res) => {
  const account = await trustService.ensureEscrowAccount(req.body ?? {});
  res.status(201).json({ account });
});

export const updateEscrowAccount = asyncHandler(async (req, res) => {
  const account = await trustService.updateEscrowAccount(req.params.accountId, req.body ?? {});
  res.json({ account });
});

export const initiateEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.initiateEscrowTransaction(req.body ?? {});
  res.status(201).json({ transaction });
});

export const updateEscrowTransaction = asyncHandler(async (req, res) => {
  const transaction = await trustService.updateEscrowTransaction(req.params.transactionId, req.body ?? {});
  res.json({ transaction });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.releaseEscrowTransaction(
    Number.parseInt(req.params.transactionId, 10),
    req.body ?? {},
  );
  res.json({ transaction });
});

export const refundEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.refundEscrowTransaction(
    Number.parseInt(req.params.transactionId, 10),
    req.body ?? {},
  );
  res.json({ transaction });
});

export const createDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.createDisputeCase(req.body ?? {});
  res.status(201).json({ dispute });
});

export const appendDisputeEvent = asyncHandler(async (req, res) => {
  const result = await trustService.appendDisputeEvent(Number.parseInt(req.params.disputeId, 10), req.body ?? {});
  res.status(201).json(result);
});

export const listDisputes = asyncHandler(async (req, res) => {
  const filters = normaliseDisputeFilters(req.query ?? {});
  const result = await trustService.listDisputeCases(filters);
  res.json(result);
});

export const getDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.getDisputeCaseById(Number.parseInt(req.params.disputeId, 10));
  res.json(dispute);
});

export const updateDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.updateDisputeCase(Number.parseInt(req.params.disputeId, 10), req.body ?? {});
  res.json(dispute);
});

export const getTrustOverview = asyncHandler(async (req, res) => {
  const overview = await trustService.getTrustOverview();
  res.json({ overview });
});

export const getDisputeSettings = asyncHandler(async (req, res) => {
  const workspaceId =
    req.query?.workspaceId != null ? Number.parseInt(req.query.workspaceId, 10) : undefined;
  const result = await trustService.getDisputeWorkflowSettings({
    workspaceId: Number.isFinite(workspaceId) ? workspaceId : undefined,
  });
  res.json(result);
});

export const updateDisputeSettings = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.workspaceId != null) {
    const workspaceId = Number.parseInt(payload.workspaceId, 10);
    payload.workspaceId = Number.isFinite(workspaceId) ? workspaceId : undefined;
  }
  const result = await trustService.saveDisputeWorkflowSettings(payload);
  res.json(result);
});

export const listDisputeTemplates = asyncHandler(async (req, res) => {
  const workspaceId =
    req.query?.workspaceId != null ? Number.parseInt(req.query.workspaceId, 10) : undefined;
  const includeGlobal = req.query?.includeGlobal == null ? true : req.query.includeGlobal !== 'false';
  const result = await trustService.listDisputeTemplates({
    workspaceId: Number.isFinite(workspaceId) ? workspaceId : undefined,
    includeGlobal,
  });
  res.json(result);
});

export const createDisputeTemplate = asyncHandler(async (req, res) => {
  const result = await trustService.createDisputeTemplate(req.body ?? {});
  res.status(201).json(result);
});

export const updateDisputeTemplate = asyncHandler(async (req, res) => {
  const templateId = Number.parseInt(req.params.templateId, 10);
  const result = await trustService.updateDisputeTemplate(templateId, req.body ?? {});
  res.json(result);
});

export const deleteDisputeTemplate = asyncHandler(async (req, res) => {
  const templateId = Number.parseInt(req.params.templateId, 10);
  await trustService.deleteDisputeTemplate(templateId);
  res.status(204).send();
});

export default {
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrow,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  listDisputes,
  getDispute,
  updateDispute,
  getTrustOverview,
  getDisputeSettings,
  updateDisputeSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
};

