import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyEscrowController from '../controllers/companyEscrowController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  companyEscrowOverviewQuerySchema,
  companyEscrowAccountCreateSchema,
  companyEscrowAccountUpdateSchema,
  companyEscrowTransactionCreateSchema,
  companyEscrowAccountParamsSchema,
  companyEscrowTransactionParamsSchema,
  companyEscrowTransactionActionBodySchema,
  companyEscrowAutomationUpdateSchema,
} from '../validation/schemas/companyEscrowSchemas.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));

router.get(
  '/escrow/overview',
  validateRequest({ query: companyEscrowOverviewQuerySchema }),
  asyncHandler(companyEscrowController.overview),
);

router.post(
  '/escrow/accounts',
  validateRequest({ body: companyEscrowAccountCreateSchema }),
  asyncHandler(companyEscrowController.createAccount),
);

router.patch(
  '/escrow/accounts/:accountId',
  validateRequest({
    params: companyEscrowAccountParamsSchema,
    body: companyEscrowAccountUpdateSchema,
  }),
  asyncHandler(companyEscrowController.updateAccount),
);

router.post(
  '/escrow/transactions',
  validateRequest({ body: companyEscrowTransactionCreateSchema }),
  asyncHandler(companyEscrowController.createTransaction),
);

router.post(
  '/escrow/transactions/:transactionId/release',
  validateRequest({
    params: companyEscrowTransactionParamsSchema,
    body: companyEscrowTransactionActionBodySchema,
  }),
  asyncHandler(companyEscrowController.releaseTransaction),
);

router.post(
  '/escrow/transactions/:transactionId/refund',
  validateRequest({
    params: companyEscrowTransactionParamsSchema,
    body: companyEscrowTransactionActionBodySchema,
  }),
  asyncHandler(companyEscrowController.refundTransaction),
);

router.patch(
  '/escrow/automation',
  validateRequest({ body: companyEscrowAutomationUpdateSchema }),
  asyncHandler(companyEscrowController.updateAutomation),
);

export default router;

