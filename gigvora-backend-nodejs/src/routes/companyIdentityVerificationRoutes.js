import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import companyIdentityVerificationController from '../controllers/companyIdentityVerificationController.js';
import {
  identityVerificationListQuerySchema,
  identityVerificationParamsSchema,
  identityVerificationDetailQuerySchema,
  identityVerificationCreateSchema,
  identityVerificationUpdateSchema,
} from '../validation/schemas/companyIdentityVerificationSchemas.js';

const router = Router();

router.get(
  '/',
  validateRequest({ query: identityVerificationListQuerySchema }),
  asyncHandler(companyIdentityVerificationController.index),
);

router.post(
  '/',
  validateRequest({ body: identityVerificationCreateSchema }),
  asyncHandler(companyIdentityVerificationController.store),
);

router.get(
  '/:verificationId',
  validateRequest({ params: identityVerificationParamsSchema, query: identityVerificationDetailQuerySchema }),
  asyncHandler(companyIdentityVerificationController.show),
);

router.patch(
  '/:verificationId',
  validateRequest({ params: identityVerificationParamsSchema, body: identityVerificationUpdateSchema }),
  asyncHandler(companyIdentityVerificationController.update),
);

export default router;
