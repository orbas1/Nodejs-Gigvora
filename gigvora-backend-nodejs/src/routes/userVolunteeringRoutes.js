import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/userVolunteeringController.js';
import {
  volunteerParamsSchema,
  applicationParamsSchema,
  responseParamsSchema,
  spendParamsSchema,
  reviewParamsSchema,
  createApplicationSchema,
  updateApplicationSchema,
  createResponseSchema,
  updateResponseSchema,
  upsertContractSchema,
  createSpendSchema,
  updateSpendSchema,
  createReviewSchema,
  updateReviewSchema,
} from '../validation/schemas/volunteeringManagementSchemas.js';

const router = Router({ mergeParams: true });

const VOLUNTEER_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

const managementQuerySchema = z
  .object({
    fresh: z.enum(['true', 'false']).optional(),
  })
  .strip();

router.get(
  '/',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: volunteerParamsSchema, query: managementQuerySchema }),
  asyncHandler(controller.getManagementSnapshot),
);

router.post(
  '/applications',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: volunteerParamsSchema, body: createApplicationSchema }),
  asyncHandler(controller.createApplication),
);

router.patch(
  '/applications/:applicationId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: applicationParamsSchema, body: updateApplicationSchema }),
  asyncHandler(controller.updateApplication),
);

router.post(
  '/applications/:applicationId/responses',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: applicationParamsSchema, body: createResponseSchema }),
  asyncHandler(controller.createResponse),
);

router.patch(
  '/applications/:applicationId/responses/:responseId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: responseParamsSchema, body: updateResponseSchema }),
  asyncHandler(controller.updateResponse),
);

router.delete(
  '/applications/:applicationId/responses/:responseId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: responseParamsSchema }),
  asyncHandler(controller.deleteResponse),
);

router.put(
  '/applications/:applicationId/contract',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: applicationParamsSchema, body: upsertContractSchema }),
  asyncHandler(controller.upsertContract),
);

router.post(
  '/applications/:applicationId/spend',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: applicationParamsSchema, body: createSpendSchema }),
  asyncHandler(controller.createSpend),
);

router.patch(
  '/applications/:applicationId/spend/:spendId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: spendParamsSchema, body: updateSpendSchema }),
  asyncHandler(controller.updateSpend),
);

router.delete(
  '/applications/:applicationId/spend/:spendId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: spendParamsSchema }),
  asyncHandler(controller.deleteSpend),
);

router.post(
  '/applications/:applicationId/reviews',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: applicationParamsSchema, body: createReviewSchema }),
  asyncHandler(controller.createReview),
);

router.patch(
  '/applications/:applicationId/reviews/:reviewId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: reviewParamsSchema, body: updateReviewSchema }),
  asyncHandler(controller.updateReview),
);

router.delete(
  '/applications/:applicationId/reviews/:reviewId',
  authenticate({ roles: VOLUNTEER_ROLES, matchParam: 'id' }),
  validateRequest({ params: reviewParamsSchema }),
  asyncHandler(controller.deleteReview),
);

export default router;
