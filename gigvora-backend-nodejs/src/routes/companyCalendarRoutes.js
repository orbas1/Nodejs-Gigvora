import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import companyCalendarController from '../controllers/companyCalendarController.js';
import {
  companyCalendarQuerySchema,
  createCompanyCalendarEventSchema,
  updateCompanyCalendarEventSchema,
  companyCalendarParamsSchema,
} from '../validation/schemas/companyCalendarSchemas.js';

const router = Router();

const WRITE_ROLES = ['admin', 'company', 'company_admin', 'workspace_admin', 'manager'];

router.get(
  '/events',
  authenticateRequest(),
  validateRequest({ query: companyCalendarQuerySchema }),
  asyncHandler(companyCalendarController.index),
);

router.post(
  '/events',
  authenticateRequest(),
  requireRoles(WRITE_ROLES),
  validateRequest({ body: createCompanyCalendarEventSchema }),
  asyncHandler(companyCalendarController.store),
);

router.patch(
  '/events/:eventId',
  authenticateRequest(),
  requireRoles(WRITE_ROLES),
  validateRequest({ params: companyCalendarParamsSchema, body: updateCompanyCalendarEventSchema }),
  asyncHandler(companyCalendarController.update),
);

router.delete(
  '/events/:eventId',
  authenticateRequest(),
  requireRoles(WRITE_ROLES),
  validateRequest({ params: companyCalendarParamsSchema }),
  asyncHandler(companyCalendarController.destroy),
);

export default router;
