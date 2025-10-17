import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as walletController from '../controllers/walletController.js';
import {
  walletOverviewQuerySchema,
  walletFundingSourceCreateSchema,
  walletFundingSourceUpdateSchema,
  walletFundingSourceParamsSchema,
  walletTransferRuleCreateSchema,
  walletTransferRuleUpdateSchema,
  walletTransferRuleParamsSchema,
  walletTransferRequestCreateSchema,
  walletTransferRequestUpdateSchema,
  walletTransferRequestParamsSchema,
} from '../validation/schemas/walletSchemas.js';

const router = Router({ mergeParams: true });

router.get('/', validateRequest({ query: walletOverviewQuerySchema }), asyncHandler(walletController.overview));

router.post(
  '/funding-sources',
  validateRequest({ body: walletFundingSourceCreateSchema }),
  asyncHandler(walletController.createFundingSource),
);
router.patch(
  '/funding-sources/:fundingSourceId',
  validateRequest({ params: walletFundingSourceParamsSchema, body: walletFundingSourceUpdateSchema }),
  asyncHandler(walletController.updateFundingSource),
);

router.post(
  '/transfer-rules',
  validateRequest({ body: walletTransferRuleCreateSchema }),
  asyncHandler(walletController.createTransferRule),
);
router.patch(
  '/transfer-rules/:ruleId',
  validateRequest({ params: walletTransferRuleParamsSchema, body: walletTransferRuleUpdateSchema }),
  asyncHandler(walletController.updateTransferRule),
);
router.delete(
  '/transfer-rules/:ruleId',
  validateRequest({ params: walletTransferRuleParamsSchema }),
  asyncHandler(walletController.deleteTransferRule),
);

router.post(
  '/transfers',
  validateRequest({ body: walletTransferRequestCreateSchema }),
  asyncHandler(walletController.createTransferRequest),
);
router.patch(
  '/transfers/:transferId',
  validateRequest({ params: walletTransferRequestParamsSchema, body: walletTransferRequestUpdateSchema }),
  asyncHandler(walletController.updateTransferRequest),
);

export default router;
