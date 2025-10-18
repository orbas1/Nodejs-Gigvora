import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminEscrowController.js';
import {
  escrowOverviewQuerySchema,
  escrowAccountsQuerySchema,
  escrowAccountCreateSchema,
  escrowAccountUpdateSchema,
  escrowTransactionsQuerySchema,
  escrowTransactionUpdateSchema,
  escrowTransactionActionSchema,
  escrowProviderSettingsSchema,
  escrowFeeTierBodySchema,
  escrowReleasePolicyBodySchema,
  accountIdParamSchema,
  transactionIdParamSchema,
  feeTierIdParamSchema,
  releasePolicyIdParamSchema,
} from '../validation/schemas/adminEscrowSchemas.js';

const router = Router();

router.get(
  '/overview',
  validateRequest({ query: escrowOverviewQuerySchema }),
  asyncHandler(controller.getOverview),
);

router.get(
  '/accounts',
  validateRequest({ query: escrowAccountsQuerySchema }),
  asyncHandler(controller.listAccounts),
);

router.post(
  '/accounts',
  validateRequest({ body: escrowAccountCreateSchema }),
  asyncHandler(controller.createAccount),
);

router.put(
  '/accounts/:accountId',
  validateRequest({ params: accountIdParamSchema, body: escrowAccountUpdateSchema }),
  asyncHandler(controller.updateAccount),
);

router.get(
  '/transactions',
  validateRequest({ query: escrowTransactionsQuerySchema }),
  asyncHandler(controller.listTransactions),
);

router.put(
  '/transactions/:transactionId',
  validateRequest({ params: transactionIdParamSchema, body: escrowTransactionUpdateSchema }),
  asyncHandler(controller.updateTransaction),
);

router.post(
  '/transactions/:transactionId/release',
  validateRequest({ params: transactionIdParamSchema, body: escrowTransactionActionSchema }),
  asyncHandler(controller.releaseTransaction),
);

router.post(
  '/transactions/:transactionId/refund',
  validateRequest({ params: transactionIdParamSchema, body: escrowTransactionActionSchema }),
  asyncHandler(controller.refundTransaction),
);

router.put(
  '/provider',
  validateRequest({ body: escrowProviderSettingsSchema }),
  asyncHandler(controller.updateProviderSettings),
);

router.get('/fee-tiers', asyncHandler(controller.listFeeTiers));
router.post(
  '/fee-tiers',
  validateRequest({ body: escrowFeeTierBodySchema }),
  asyncHandler(controller.createFeeTier),
);
router.put(
  '/fee-tiers/:tierId',
  validateRequest({ params: feeTierIdParamSchema, body: escrowFeeTierBodySchema }),
  asyncHandler(controller.updateFeeTier),
);
router.delete(
  '/fee-tiers/:tierId',
  validateRequest({ params: feeTierIdParamSchema }),
  asyncHandler(controller.deleteFeeTier),
);

router.get('/release-policies', asyncHandler(controller.listReleasePolicies));
router.post(
  '/release-policies',
  validateRequest({ body: escrowReleasePolicyBodySchema }),
  asyncHandler(controller.createReleasePolicy),
);
router.put(
  '/release-policies/:policyId',
  validateRequest({ params: releasePolicyIdParamSchema, body: escrowReleasePolicyBodySchema }),
  asyncHandler(controller.updateReleasePolicy),
);
router.delete(
  '/release-policies/:policyId',
  validateRequest({ params: releasePolicyIdParamSchema }),
  asyncHandler(controller.deleteReleasePolicy),
);

export default router;
