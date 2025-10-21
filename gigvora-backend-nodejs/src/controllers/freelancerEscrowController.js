import asyncHandler from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';
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

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function resolveFreelancerId(rawValue) {
  if (rawValue == null || rawValue === '') {
    throw new ValidationError('freelancerId is required.');
  }
  return parsePositiveInteger(rawValue, 'freelancerId');
}

function parseOptionalLimit(value, fieldName = 'limit') {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export const overview = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const { status, limit } = req.query ?? {};
  const payload = await getFreelancerEscrowOverview(freelancerId, {
    status: status ?? undefined,
    limit: parseOptionalLimit(limit),
  });
  res.json(payload);
});

export const createAccount = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const account = await ensureFreelancerEscrowAccount(freelancerId, req.body ?? {});
  res.status(201).json({ account });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const accountId = parsePositiveInteger(req.params?.accountId, 'accountId');
  const account = await updateFreelancerEscrowAccount(freelancerId, accountId, req.body ?? {});
  res.json({ account });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const transaction = await createFreelancerEscrowTransaction(freelancerId, req.body ?? {});
  res.status(201).json({ transaction });
});

export const releaseTransaction = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const transactionId = parsePositiveInteger(req.params?.transactionId, 'transactionId');
  const transaction = await releaseFreelancerEscrowTransaction(freelancerId, transactionId, req.body ?? {});
  res.json({ transaction });
});

export const refundTransaction = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const transactionId = parsePositiveInteger(req.params?.transactionId, 'transactionId');
  const transaction = await refundFreelancerEscrowTransaction(freelancerId, transactionId, req.body ?? {});
  res.json({ transaction });
});

export const openDispute = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const transactionId = parsePositiveInteger(req.params?.transactionId, 'transactionId');
  const dispute = await openFreelancerEscrowDispute(freelancerId, transactionId, req.body ?? {});
  res.status(201).json({ dispute });
});

export const appendDisputeEvent = asyncHandler(async (req, res) => {
  const freelancerId = resolveFreelancerId(req.params?.freelancerId);
  const disputeId = parsePositiveInteger(req.params?.disputeId, 'disputeId');
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
