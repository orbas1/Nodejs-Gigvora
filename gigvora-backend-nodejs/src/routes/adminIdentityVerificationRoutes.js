import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminIdentityVerificationController.js';
import {
  identityVerificationOverviewQuerySchema,
  identityVerificationListQuerySchema,
  identityVerificationCreateSchema,
  identityVerificationUpdateSchema,
  identityVerificationEventBodySchema,
  identityVerificationSettingsSchema,
} from '../validation/schemas/identityVerificationSchemas.js';

const router = Router();

const verificationIdParamSchema = z
  .object({
    verificationId: z.coerce.number().int().positive({ message: 'verificationId must be a positive integer.' }),
  })
  .strip();

router.get(
  '/overview',
  validateRequest({ query: identityVerificationOverviewQuerySchema }),
  asyncHandler(controller.overview),
);

router.get(
  '/requests',
  validateRequest({ query: identityVerificationListQuerySchema }),
  asyncHandler(controller.index),
);

router.post(
  '/requests',
  validateRequest({ body: identityVerificationCreateSchema }),
  asyncHandler(controller.store),
);

router.get(
  '/requests/:verificationId',
  validateRequest({ params: verificationIdParamSchema }),
  asyncHandler(controller.show),
);

router.patch(
  '/requests/:verificationId',
  validateRequest({ params: verificationIdParamSchema, body: identityVerificationUpdateSchema }),
  asyncHandler(controller.update),
);

router.post(
  '/requests/:verificationId/events',
  validateRequest({ params: verificationIdParamSchema, body: identityVerificationEventBodySchema }),
  asyncHandler(controller.createEvent),
);

router.get('/settings', asyncHandler(controller.fetchSettings));
router.put('/settings', validateRequest({ body: identityVerificationSettingsSchema }), asyncHandler(controller.updateSettings));

export default router;
