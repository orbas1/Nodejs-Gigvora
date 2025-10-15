import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { runtimeMaintenanceQuerySchema } from '../validation/schemas/runtimeSchemas.js';
import { maintenanceAnnouncements } from '../controllers/runtimeController.js';

const router = Router();

router.get(
  '/maintenance',
  validateRequest({ query: runtimeMaintenanceQuerySchema }),
  asyncHandler(maintenanceAnnouncements),
);

export default router;
