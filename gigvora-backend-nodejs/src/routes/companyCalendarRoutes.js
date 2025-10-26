import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requirePermission } from '../middleware/authorization.js';
import validateRequest from '../middleware/validateRequest.js';
import companyCalendarController from '../controllers/companyCalendarController.js';
import {
  companyCalendarQuerySchema,
  createCompanyCalendarEventSchema,
  updateCompanyCalendarEventSchema,
  companyCalendarParamsSchema,
} from '../validation/schemas/companyCalendarSchemas.js';

const router = Router();

router.get(
  '/events',
  authenticateRequest(),
  requirePermission('calendar:view'),
  validateRequest({ query: companyCalendarQuerySchema }),
  asyncHandler(companyCalendarController.index),
);

router.post(
  '/events',
  authenticateRequest(),
  requirePermission('calendar:manage'),
  validateRequest({ body: createCompanyCalendarEventSchema }),
  asyncHandler(companyCalendarController.store),
);

router.patch(
  '/events/:eventId',
  authenticateRequest(),
  requirePermission('calendar:manage'),
  validateRequest({ params: companyCalendarParamsSchema, body: updateCompanyCalendarEventSchema }),
  asyncHandler(companyCalendarController.update),
);

router.delete(
  '/events/:eventId',
  authenticateRequest(),
  requirePermission('calendar:manage'),
  validateRequest({ params: companyCalendarParamsSchema }),
  asyncHandler(companyCalendarController.destroy),
);

export default router;
