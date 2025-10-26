import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  featureFlagListQuerySchema,
  featureFlagParamsSchema,
  featureFlagUpdateSchema,
} from '../validation/schemas/featureFlagSchemas.js';
import {
  indexFeatureFlags,
  showFeatureFlag,
  patchFeatureFlag,
} from '../controllers/adminPlatformController.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/feature-flags',
  validateRequest({ query: featureFlagListQuerySchema }),
  asyncHandler(indexFeatureFlags),
);

router.get(
  '/feature-flags/:flagKey',
  validateRequest({ params: featureFlagParamsSchema }),
  asyncHandler(showFeatureFlag),
);

router.patch(
  '/feature-flags/:flagKey',
  validateRequest({ params: featureFlagParamsSchema, body: featureFlagUpdateSchema }),
  asyncHandler(patchFeatureFlag),
);

export default router;
