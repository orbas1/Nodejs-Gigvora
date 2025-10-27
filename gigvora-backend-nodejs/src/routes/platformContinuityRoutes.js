import { Router } from 'express';
import { authenticateRequest } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/platformContinuityController.js';
import { continuityBootstrapQuerySchema } from '../validation/schemas/platformContinuitySchemas.js';

const router = Router();

router.use(authenticateRequest({ optional: true }));

router.get(
  '/bootstrap',
  validateRequest({ query: continuityBootstrapQuerySchema }),
  asyncHandler(controller.bootstrap),
);

export default router;
