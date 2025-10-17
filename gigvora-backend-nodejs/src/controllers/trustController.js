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

export const getTrustOverview = asyncHandler(async (req, res) => {
  const overview = await trustService.getTrustOverview();
  res.json({ overview });
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
  getTrustOverview,
};
