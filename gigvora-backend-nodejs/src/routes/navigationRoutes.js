import { Router } from 'express';

import * as navigationController from '../controllers/navigationController.js';
import { authenticateRequest } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import { navigationPulseQuerySchema } from '../validation/schemas/navigationSchemas.js';

const router = Router();

router.use(authenticateRequest());

router.get(
  '/pulse',
  validateRequest({ query: navigationPulseQuerySchema }),
  asyncHandler(navigationController.pulse),
);

export default router;
