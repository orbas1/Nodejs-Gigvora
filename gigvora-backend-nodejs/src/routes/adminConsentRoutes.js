import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import consentController from '../controllers/consentController.js';
import {
  consentPolicyQuerySchema,
  createConsentPolicyBodySchema,
  updateConsentPolicyBodySchema,
  createConsentVersionBodySchema,
} from '../validation/schemas/consentSchemas.js';

const router = Router();

const policyIdParamSchema = z
  .object({ policyId: z.coerce.number().int().positive({ message: 'policyId must be a positive integer.' }) })
  .strip();

const policyCodeParamSchema = z
  .object({ policyCode: z.string().trim().min(2).max(120) })
  .strip();

router.get(
  '/',
  validateRequest({ query: consentPolicyQuerySchema }),
  asyncHandler(consentController.index),
);

router.get(
  '/:policyCode',
  validateRequest({ params: policyCodeParamSchema }),
  asyncHandler(consentController.show),
);

router.post(
  '/',
  validateRequest({ body: createConsentPolicyBodySchema }),
  asyncHandler(consentController.store),
);

router.patch(
  '/:policyId',
  validateRequest({ params: policyIdParamSchema, body: updateConsentPolicyBodySchema }),
  asyncHandler(consentController.update),
);

router.post(
  '/:policyId/versions',
  validateRequest({ params: policyIdParamSchema, body: createConsentVersionBodySchema }),
  asyncHandler(consentController.createVersion),
);

router.delete(
  '/:policyId',
  validateRequest({ params: policyIdParamSchema }),
  asyncHandler(consentController.destroy),
);

export default router;
