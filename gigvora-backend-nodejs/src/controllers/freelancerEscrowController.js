import asyncHandler from '../utils/asyncHandler.js';
import {
  getFreelancerEscrowOverview,
  ensureFreelancerEscrowAccount,
  updateFreelancerEscrowAccount,
  createFreelancerEscrowTransaction,
  releaseFreelancerEscrowTransaction,
  refundFreelancerEscrowTransaction,
  openFreelancerEscrowDispute,
  appendFreelancerEscrowDisputeEvent,
} from '../services/freelancerEscrowService.js';

export const overview = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;
  const { status, limit } = req.query ?? {};
  const payload = await getFreelancerEscrowOverview(freelancerId, {
    status,
    limit,
  });
  res.json(payload);
});

export const createAccount = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;
  const account = await ensureFreelancerEscrowAccount(freelancerId, req.body ?? {});
  res.status(201).json({ account });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const { freelancerId, accountId } = req.params;
  const account = await updateFreelancerEscrowAccount(freelancerId, accountId, req.body ?? {});
  res.json({ account });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const { freelancerId } = req.params;
  const transaction = await createFreelancerEscrowTransaction(freelancerId, req.body ?? {});
  res.status(201).json({ transaction });
});

export const releaseTransaction = asyncHandler(async (req, res) => {
  const { freelancerId, transactionId } = req.params;
  const transaction = await releaseFreelancerEscrowTransaction(freelancerId, transactionId, req.body ?? {});
  res.json({ transaction });
});

export const refundTransaction = asyncHandler(async (req, res) => {
  const { freelancerId, transactionId } = req.params;
  const transaction = await refundFreelancerEscrowTransaction(freelancerId, transactionId, req.body ?? {});
  res.json({ transaction });
});

export const openDispute = asyncHandler(async (req, res) => {
  const { freelancerId, transactionId } = req.params;
  const dispute = await openFreelancerEscrowDispute(freelancerId, transactionId, req.body ?? {});
  res.status(201).json({ dispute });
});

export const appendDisputeEvent = asyncHandler(async (req, res) => {
  const { freelancerId, disputeId } = req.params;
  const result = await appendFreelancerEscrowDisputeEvent(freelancerId, disputeId, req.body ?? {});
  res.status(201).json(result);
});

export default {
  overview,
  createAccount,
  updateAccount,
  createTransaction,
  releaseTransaction,
  refundTransaction,
  openDispute,
  appendDisputeEvent,
};
