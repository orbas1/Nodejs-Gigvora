import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminTwoFactorOverviewQuerySchema,
  adminTwoFactorPolicyBodySchema,
  adminTwoFactorPolicyParamsSchema,
  adminTwoFactorPolicyUpdateBodySchema,
  adminTwoFactorBypassBodySchema,
  adminTwoFactorBypassParamsSchema,
  adminTwoFactorBypassUpdateBodySchema,
  adminTwoFactorEnrollmentParamsSchema,
  adminTwoFactorEnrollmentActionBodySchema,
} from '../validation/schemas/adminSchemas.js';
import {
  fetchOverview,
  createPolicy,
  updatePolicy,
  removePolicy,
  createBypass,
  updateBypass,
  approveEnrollment,
  revokeEnrollment,
} from '../controllers/adminTwoFactorController.js';

const router = Router();

router.get('/', validateRequest({ query: adminTwoFactorOverviewQuerySchema }), asyncHandler(fetchOverview));

router.post(
  '/policies',
  validateRequest({ body: adminTwoFactorPolicyBodySchema }),
  asyncHandler(createPolicy),
);

router.put(
  '/policies/:policyId',
  validateRequest({ params: adminTwoFactorPolicyParamsSchema, body: adminTwoFactorPolicyUpdateBodySchema }),
  asyncHandler(updatePolicy),
);

router.delete(
  '/policies/:policyId',
  validateRequest({ params: adminTwoFactorPolicyParamsSchema }),
  asyncHandler(removePolicy),
);

router.post(
  '/bypasses',
  validateRequest({ body: adminTwoFactorBypassBodySchema }),
  asyncHandler(createBypass),
);

router.patch(
  '/bypasses/:bypassId',
  validateRequest({ params: adminTwoFactorBypassParamsSchema, body: adminTwoFactorBypassUpdateBodySchema }),
  asyncHandler(updateBypass),
);

router.post(
  '/enrollments/:enrollmentId/approve',
  validateRequest({ params: adminTwoFactorEnrollmentParamsSchema, body: adminTwoFactorEnrollmentActionBodySchema }),
  asyncHandler(approveEnrollment),
);

router.post(
  '/enrollments/:enrollmentId/revoke',
  validateRequest({ params: adminTwoFactorEnrollmentParamsSchema, body: adminTwoFactorEnrollmentActionBodySchema }),
  asyncHandler(revokeEnrollment),
);

export default router;
