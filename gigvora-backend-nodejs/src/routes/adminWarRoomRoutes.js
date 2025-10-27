import { Router } from 'express';

import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import { warRoomPerformanceQuerySchema, warRoomSecurityQuerySchema } from '../validation/schemas/warRoomSchemas.js';
import { platformPerformance, securityFabric } from '../controllers/adminWarRoomController.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/platform-performance',
  validateRequest({ query: warRoomPerformanceQuerySchema }),
  asyncHandler(platformPerformance),
);

router.get(
  '/security-fabric',
  validateRequest({ query: warRoomSecurityQuerySchema }),
  asyncHandler(securityFabric),
);

export default router;
