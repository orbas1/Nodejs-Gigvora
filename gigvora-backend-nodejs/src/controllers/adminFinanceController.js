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
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function parseOptionalPositiveInteger(value, label) {
  if (value == null || value === '') {
    return undefined;
  }
  return coercePositiveInteger(value, label);
}

export async function dashboard(req, res) {
  const lookbackDays = parseOptionalPositiveInteger(req.query?.lookbackDays, 'lookbackDays');
  const snapshot = await getAdminFinanceDashboard({ lookbackDays });
  res.json(snapshot);
}

export async function saveTreasuryPolicy(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
  });
  const policy = await upsertTreasuryPolicy(payload, actor.actorId);
  logger.info({ actor: actor.reference }, 'Admin finance treasury policy saved');
  res.json(policy);
}

export async function createFeeRuleController(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
  });
  const rule = await createFeeRule(payload, actor.actorId);
  logger.info({ actor: actor.reference, feeRuleId: rule?.id }, 'Admin finance fee rule created');
  res.status(201).json(rule);
}

export async function updateFeeRuleController(req, res) {
  const actor = extractAdminActor(req);
  const feeRuleId = coercePositiveInteger(req.params?.feeRuleId, 'feeRuleId');
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setUpdatedBy: true,
  });
  const rule = await updateFeeRule(feeRuleId, payload, actor.actorId);
  logger.info({ actor: actor.reference, feeRuleId }, 'Admin finance fee rule updated');
  res.json(rule);
}

export async function deleteFeeRuleController(req, res) {
  const feeRuleId = coercePositiveInteger(req.params?.feeRuleId, 'feeRuleId');
  await deleteFeeRule(feeRuleId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, feeRuleId }, 'Admin finance fee rule deleted');
  res.status(204).send();
}

export async function createPayoutScheduleController(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
  });
  const schedule = await createPayoutSchedule(payload, actor.actorId);
  logger.info({ actor: actor.reference, payoutScheduleId: schedule?.id }, 'Admin finance payout schedule created');
  res.status(201).json(schedule);
}

export async function updatePayoutScheduleController(req, res) {
  const actor = extractAdminActor(req);
  const payoutScheduleId = coercePositiveInteger(req.params?.payoutScheduleId, 'payoutScheduleId');
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setUpdatedBy: true,
  });
  const schedule = await updatePayoutSchedule(payoutScheduleId, payload, actor.actorId);
  logger.info({ actor: actor.reference, payoutScheduleId }, 'Admin finance payout schedule updated');
  res.json(schedule);
}

export async function deletePayoutScheduleController(req, res) {
  const payoutScheduleId = coercePositiveInteger(req.params?.payoutScheduleId, 'payoutScheduleId');
  await deletePayoutSchedule(payoutScheduleId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, payoutScheduleId }, 'Admin finance payout schedule deleted');
  res.status(204).send();
}

export async function createEscrowAdjustmentController(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setCreatedBy: true,
    setUpdatedBy: true,
  });
  const adjustment = await createEscrowAdjustment(payload, actor.actorId);
  logger.info({ actor: actor.reference, adjustmentId: adjustment?.id }, 'Admin finance escrow adjustment created');
  res.status(201).json(adjustment);
}

export async function updateEscrowAdjustmentController(req, res) {
  const actor = extractAdminActor(req);
  const adjustmentId = coercePositiveInteger(req.params?.adjustmentId, 'adjustmentId');
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    setUpdatedBy: true,
  });
  const adjustment = await updateEscrowAdjustment(adjustmentId, payload, actor.actorId);
  logger.info({ actor: actor.reference, adjustmentId }, 'Admin finance escrow adjustment updated');
  res.json(adjustment);
}

export async function deleteEscrowAdjustmentController(req, res) {
  const adjustmentId = coercePositiveInteger(req.params?.adjustmentId, 'adjustmentId');
  await deleteEscrowAdjustment(adjustmentId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, adjustmentId }, 'Admin finance escrow adjustment deleted');
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
