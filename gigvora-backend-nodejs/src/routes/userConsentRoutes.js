import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import userConsentController from '../controllers/userConsentController.js';
import { consentSnapshotQuerySchema, updateUserConsentBodySchema } from '../validation/schemas/consentSchemas.js';

const router = Router({ mergeParams: true });

const CONSENT_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'];

const consentParamsSchema = z
  .object({
    id: z.coerce.number().int().positive({ message: 'id must be a positive integer.' }),
    policyCode: z.string().trim().min(2).max(120).optional(),
  })
  .strip();

router.get(
  '/',
  authenticate({ roles: CONSENT_ROLES, matchParam: 'id' }),
  validateRequest({ params: consentParamsSchema, query: consentSnapshotQuerySchema }),
  asyncHandler(userConsentController.snapshot),
);

router.put(
  '/:policyCode',
  authenticate({ roles: CONSENT_ROLES, matchParam: 'id' }),
  validateRequest({ params: consentParamsSchema, body: updateUserConsentBodySchema }),
  asyncHandler(userConsentController.update),
);

export default router;
