import asyncHandler from '../utils/asyncHandler.js';
import userDisputeService from '../services/userDisputeService.js';

export const listUserDisputes = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const { stage, status } = req.query;
  const payload = await userDisputeService.listUserDisputes(userId, { stage, status });
  res.json(payload);
});

export const getUserDispute = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const disputeId = Number.parseInt(req.params.disputeId, 10);
  const dispute = await userDisputeService.getUserDispute(userId, disputeId);
  res.json({ dispute });
});

export const createUserDispute = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const dispute = await userDisputeService.createUserDispute(userId, req.body);
  res.status(201).json({ dispute });
});

export const appendUserDisputeEvent = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const disputeId = Number.parseInt(req.params.disputeId, 10);
  const dispute = await userDisputeService.appendUserDisputeEvent(userId, disputeId, req.body);
  res.status(201).json({ dispute });
});

export default {
  listUserDisputes,
  getUserDispute,
  createUserDispute,
  appendUserDisputeEvent,
};
