import asyncHandler from '../utils/asyncHandler.js';
import trustService from '../services/trustService.js';

export const createEscrowAccount = asyncHandler(async (req, res) => {
  const account = await trustService.ensureEscrowAccount(req.body);
  res.status(201).json({ account });
});

export const updateEscrowAccount = asyncHandler(async (req, res) => {
  const account = await trustService.updateEscrowAccount(req.params.accountId, req.body);
  res.json({ account });
});

export const initiateEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.initiateEscrowTransaction(req.body);
  res.status(201).json({ transaction });
});

export const updateEscrowTransaction = asyncHandler(async (req, res) => {
  const transaction = await trustService.updateEscrowTransaction(
    req.params.transactionId,
    req.body,
  );
  res.json({ transaction });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.releaseEscrowTransaction(Number.parseInt(req.params.transactionId, 10), req.body);
  res.json({ transaction });
});

export const refundEscrow = asyncHandler(async (req, res) => {
  const transaction = await trustService.refundEscrowTransaction(Number.parseInt(req.params.transactionId, 10), req.body);
  res.json({ transaction });
});

export const createDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.createDisputeCase(req.body);
  res.status(201).json({ dispute });
});

export const appendDisputeEvent = asyncHandler(async (req, res) => {
  const result = await trustService.appendDisputeEvent(Number.parseInt(req.params.disputeId, 10), req.body);
  res.status(201).json(result);
});

export const listDisputes = asyncHandler(async (req, res) => {
  const disputes = await trustService.listDisputeCases(req.query ?? {});
  res.json({ disputes });
});

export const getDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.getDisputeCaseDetail(req.params.disputeId);
  const result = await trustService.listDisputeCases(req.query ?? {});
  res.json(result);
});

export const getDispute = asyncHandler(async (req, res) => {
  const dispute = await trustService.getDisputeCaseById(Number.parseInt(req.params.disputeId, 10));
  res.json({ dispute });
});

export const updateDispute = asyncHandler(async (req, res) => {
  const result = await trustService.updateDisputeCase(req.params.disputeId, req.body);
  res.json(result);
  const dispute = await trustService.updateDisputeCase(Number.parseInt(req.params.disputeId, 10), req.body ?? {});
  res.json({ dispute });
});

export const getTrustOverview = asyncHandler(async (req, res) => {
  const overview = await trustService.getTrustOverview();
  res.json({ overview });
});

export const listDisputes = asyncHandler(async (req, res) => {
  const {
    status,
    stage,
    priority,
    assignedToId,
    openedById,
    search,
    sort,
    page,
    limit,
    offset,
  } = req.query ?? {};

  const pageSize = limit != null ? Number.parseInt(limit, 10) : undefined;
  const pageNumber = page != null ? Number.parseInt(page, 10) : undefined;
  const offsetValue = offset != null ? Number.parseInt(offset, 10) : undefined;

  const options = {
    status,
    stage,
    priority,
    assignedToId,
    openedById,
    search,
    sort,
    limit: Number.isFinite(pageSize) ? pageSize : undefined,
    offset: Number.isFinite(offsetValue)
      ? offsetValue
      : Number.isFinite(pageNumber) && Number.isFinite(pageSize)
      ? Math.max(0, (pageNumber - 1) * pageSize)
      : undefined,
  };

  const result = await trustService.listDisputeCases(options);
  res.json(result);
});

export const getDispute = asyncHandler(async (req, res) => {
  const disputeId = Number.parseInt(req.params.disputeId, 10);
  const result = await trustService.getDisputeCaseById(disputeId);
  res.json(result);
});

export const updateDispute = asyncHandler(async (req, res) => {
  const disputeId = Number.parseInt(req.params.disputeId, 10);
  const dispute = await trustService.updateDisputeCase(disputeId, req.body ?? {});
  res.json({ dispute });
});

export const getDisputeSettings = asyncHandler(async (req, res) => {
  const workspaceId = req.query?.workspaceId != null ? Number.parseInt(req.query.workspaceId, 10) : undefined;
  const result = await trustService.getDisputeWorkflowSettings({ workspaceId: Number.isFinite(workspaceId) ? workspaceId : undefined });
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
  const workspaceId = req.query?.workspaceId != null ? Number.parseInt(req.query.workspaceId, 10) : undefined;
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
  listDisputes,
  getDispute,
  updateDispute,
  getDisputeSettings,
  updateDisputeSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
};
