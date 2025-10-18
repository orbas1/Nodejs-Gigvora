import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  financeDashboardQuerySchema,
  treasuryPolicyBodySchema,
  feeRuleCreateBodySchema,
  feeRuleUpdateBodySchema,
  payoutScheduleCreateBodySchema,
  payoutScheduleUpdateBodySchema,
  escrowAdjustmentCreateBodySchema,
  escrowAdjustmentUpdateBodySchema,
  feeRuleParamsSchema,
  payoutScheduleParamsSchema,
  escrowAdjustmentParamsSchema,
} from '../validation/schemas/adminFinanceSchemas.js';
import {
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
} from '../controllers/adminFinanceController.js';

const router = Router();

router.get('/dashboard', validateRequest({ query: financeDashboardQuerySchema }), asyncHandler(dashboard));

router.put('/treasury-policy', validateRequest({ body: treasuryPolicyBodySchema }), asyncHandler(saveTreasuryPolicy));

router.post('/fee-rules', validateRequest({ body: feeRuleCreateBodySchema }), asyncHandler(createFeeRuleController));
router.put(
  '/fee-rules/:feeRuleId',
  validateRequest({ params: feeRuleParamsSchema, body: feeRuleUpdateBodySchema }),
  asyncHandler(updateFeeRuleController),
);
router.delete(
  '/fee-rules/:feeRuleId',
  validateRequest({ params: feeRuleParamsSchema }),
  asyncHandler(deleteFeeRuleController),
);

router.post(
  '/payout-schedules',
  validateRequest({ body: payoutScheduleCreateBodySchema }),
  asyncHandler(createPayoutScheduleController),
);
router.put(
  '/payout-schedules/:payoutScheduleId',
  validateRequest({ params: payoutScheduleParamsSchema, body: payoutScheduleUpdateBodySchema }),
  asyncHandler(updatePayoutScheduleController),
);
router.delete(
  '/payout-schedules/:payoutScheduleId',
  validateRequest({ params: payoutScheduleParamsSchema }),
  asyncHandler(deletePayoutScheduleController),
);

router.post(
  '/escrow-adjustments',
  validateRequest({ body: escrowAdjustmentCreateBodySchema }),
  asyncHandler(createEscrowAdjustmentController),
);
router.put(
  '/escrow-adjustments/:adjustmentId',
  validateRequest({ params: escrowAdjustmentParamsSchema, body: escrowAdjustmentUpdateBodySchema }),
  asyncHandler(updateEscrowAdjustmentController),
);
router.delete(
  '/escrow-adjustments/:adjustmentId',
  validateRequest({ params: escrowAdjustmentParamsSchema }),
  asyncHandler(deleteEscrowAdjustmentController),
);

export default router;
