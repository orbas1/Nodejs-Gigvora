import { Router } from 'express';
import { z } from 'zod';
import {
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrow,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  listDisputes,
  getDispute,
  updateDispute,
  getTrustOverview,
  getDisputeSettings,
  updateDisputeSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
} from '../controllers/trustController.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

const trustAccessRoles = ['admin', 'support', 'company', 'agency', 'freelancer', 'mentor'];
const requireTrustAccess = authenticate({ roles: trustAccessRoles, allowAdminOverride: true });

const accountParamsSchema = z
  .object({
    accountId: z.coerce.number().int().positive({ message: 'accountId must be a positive integer.' }),
  })
  .strip();

const transactionParamsSchema = z
  .object({
    transactionId: z.coerce.number().int().positive({ message: 'transactionId must be a positive integer.' }),
  })
  .strip();

const disputeParamsSchema = z
  .object({
    disputeId: z.coerce.number().int().positive({ message: 'disputeId must be a positive integer.' }),
  })
  .strip();

const templateParamsSchema = z
  .object({
    templateId: z.coerce.number().int().positive({ message: 'templateId must be a positive integer.' }),
  })
  .strip();

router.get('/overview', requireTrustAccess, asyncHandler(getTrustOverview));
router.post('/escrow/accounts', requireTrustAccess, asyncHandler(createEscrowAccount));
router.patch(
  '/escrow/accounts/:accountId',
  requireTrustAccess,
  validateRequest({ params: accountParamsSchema }),
  asyncHandler(updateEscrowAccount),
);
router.post('/escrow/transactions', requireTrustAccess, asyncHandler(initiateEscrow));
router.patch(
  '/escrow/transactions/:transactionId',
  requireTrustAccess,
  validateRequest({ params: transactionParamsSchema }),
  asyncHandler(updateEscrowTransaction),
);
router.post(
  '/escrow/transactions/:transactionId/release',
  requireTrustAccess,
  validateRequest({ params: transactionParamsSchema }),
  asyncHandler(releaseEscrow),
);
router.post(
  '/escrow/transactions/:transactionId/refund',
  requireTrustAccess,
  validateRequest({ params: transactionParamsSchema }),
  asyncHandler(refundEscrow),
);
router.get('/disputes', requireTrustAccess, asyncHandler(listDisputes));
router.post('/disputes', requireTrustAccess, asyncHandler(createDispute));
router.get(
  '/disputes/:disputeId',
  requireTrustAccess,
  validateRequest({ params: disputeParamsSchema }),
  asyncHandler(getDispute),
);
router.patch(
  '/disputes/:disputeId',
  requireTrustAccess,
  validateRequest({ params: disputeParamsSchema }),
  asyncHandler(updateDispute),
);
router.post(
  '/disputes/:disputeId/events',
  requireTrustAccess,
  validateRequest({ params: disputeParamsSchema }),
  asyncHandler(appendDisputeEvent),
);

router.get('/disputes/settings', requireTrustAccess, asyncHandler(getDisputeSettings));
router.put('/disputes/settings', requireTrustAccess, asyncHandler(updateDisputeSettings));

router.get('/disputes/templates', requireTrustAccess, asyncHandler(listDisputeTemplates));
router.post('/disputes/templates', requireTrustAccess, asyncHandler(createDisputeTemplate));
router.patch(
  '/disputes/templates/:templateId',
  requireTrustAccess,
  validateRequest({ params: templateParamsSchema }),
  asyncHandler(updateDisputeTemplate),
);
router.delete(
  '/disputes/templates/:templateId',
  requireTrustAccess,
  validateRequest({ params: templateParamsSchema }),
  asyncHandler(deleteDisputeTemplate),
);

export default router;
