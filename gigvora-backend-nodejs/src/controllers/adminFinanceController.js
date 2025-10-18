import {
  getAdminFinanceDashboard,
  upsertTreasuryPolicy,
  createFeeRule,
  updateFeeRule,
  deleteFeeRule,
  createPayoutSchedule,
  updatePayoutSchedule,
  deletePayoutSchedule,
  createEscrowAdjustment,
  updateEscrowAdjustment,
  deleteEscrowAdjustment,
} from '../services/adminFinanceService.js';

function resolveActorId(req) {
  const candidate = req.user?.id ?? req.auth?.userId;
  if (candidate == null) {
    return null;
  }
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : candidate;
}

export async function dashboard(req, res) {
  const { lookbackDays } = req.query ?? {};
  const snapshot = await getAdminFinanceDashboard({ lookbackDays: lookbackDays ? Number(lookbackDays) : undefined });
  res.json(snapshot);
}

export async function saveTreasuryPolicy(req, res) {
  const actorId = resolveActorId(req);
  const policy = await upsertTreasuryPolicy(req.body ?? {}, actorId);
  res.json(policy);
}

export async function createFeeRuleController(req, res) {
  const actorId = resolveActorId(req);
  const rule = await createFeeRule(req.body ?? {}, actorId);
  res.status(201).json(rule);
}

export async function updateFeeRuleController(req, res) {
  const actorId = resolveActorId(req);
  const { feeRuleId } = req.params ?? {};
  const rule = await updateFeeRule(Number(feeRuleId), req.body ?? {}, actorId);
  res.json(rule);
}

export async function deleteFeeRuleController(req, res) {
  const { feeRuleId } = req.params ?? {};
  await deleteFeeRule(Number(feeRuleId));
  res.status(204).send();
}

export async function createPayoutScheduleController(req, res) {
  const actorId = resolveActorId(req);
  const schedule = await createPayoutSchedule(req.body ?? {}, actorId);
  res.status(201).json(schedule);
}

export async function updatePayoutScheduleController(req, res) {
  const actorId = resolveActorId(req);
  const { payoutScheduleId } = req.params ?? {};
  const schedule = await updatePayoutSchedule(Number(payoutScheduleId), req.body ?? {}, actorId);
  res.json(schedule);
}

export async function deletePayoutScheduleController(req, res) {
  const { payoutScheduleId } = req.params ?? {};
  await deletePayoutSchedule(Number(payoutScheduleId));
  res.status(204).send();
}

export async function createEscrowAdjustmentController(req, res) {
  const actorId = resolveActorId(req);
  const adjustment = await createEscrowAdjustment(req.body ?? {}, actorId);
  res.status(201).json(adjustment);
}

export async function updateEscrowAdjustmentController(req, res) {
  const actorId = resolveActorId(req);
  const { adjustmentId } = req.params ?? {};
  const adjustment = await updateEscrowAdjustment(Number(adjustmentId), req.body ?? {}, actorId);
  res.json(adjustment);
}

export async function deleteEscrowAdjustmentController(req, res) {
  const { adjustmentId } = req.params ?? {};
  await deleteEscrowAdjustment(Number(adjustmentId));
  res.status(204).send();
}

export default {
  dashboard,
  saveTreasuryPolicy,
  createFeeRuleController,
  updateFeeRuleController,
  deleteFeeRuleController,
  createPayoutScheduleController,
  updatePayoutScheduleController,
  deletePayoutScheduleController,
  createEscrowAdjustmentController,
  updateEscrowAdjustmentController,
  deleteEscrowAdjustmentController,
};
