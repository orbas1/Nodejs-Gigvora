import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminModerationController.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  adminModerationQueueQuerySchema,
  adminModerationEventsQuerySchema,
  adminModerationResolveSchema,
} from '../validation/schemas/adminModerationSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/overview', asyncHandler(controller.overview));
router.get(
  '/queue',
  validateRequest({ query: adminModerationQueueQuerySchema }),
  asyncHandler(controller.queue),
);
router.get(
  '/events',
  validateRequest({ query: adminModerationEventsQuerySchema }),
  asyncHandler(controller.events),
);
router.post(
  '/events/:eventId/resolve',
  validateRequest({ body: adminModerationResolveSchema }),
  asyncHandler(controller.resolve),
);

export default router;
