import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminCalendarController.js';
import {
  adminCalendarQuerySchema,
  adminCalendarAccountCreateSchema,
  adminCalendarAccountUpdateSchema,
  adminCalendarAvailabilitySchema,
  adminCalendarTemplateCreateSchema,
  adminCalendarTemplateUpdateSchema,
  adminCalendarEventCreateSchema,
  adminCalendarEventUpdateSchema,
  adminCalendarAccountParamsSchema,
  adminCalendarTemplateParamsSchema,
  adminCalendarEventParamsSchema,
} from '../validation/schemas/adminCalendarSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: adminCalendarQuerySchema }), asyncHandler(controller.fetchConsole));

router.post(
  '/accounts',
  validateRequest({ body: adminCalendarAccountCreateSchema }),
  asyncHandler(controller.createAccount),
);

router.put(
  '/accounts/:accountId',
  validateRequest({ params: adminCalendarAccountParamsSchema, body: adminCalendarAccountUpdateSchema }),
  asyncHandler(controller.updateAccount),
);

router.delete(
  '/accounts/:accountId',
  validateRequest({ params: adminCalendarAccountParamsSchema }),
  asyncHandler(controller.removeAccount),
);

router.put(
  '/accounts/:accountId/availability',
  validateRequest({ params: adminCalendarAccountParamsSchema, body: adminCalendarAvailabilitySchema }),
  asyncHandler(controller.updateAvailability),
);

router.post(
  '/templates',
  validateRequest({ body: adminCalendarTemplateCreateSchema }),
  asyncHandler(controller.createTemplate),
);

router.put(
  '/templates/:templateId',
  validateRequest({ params: adminCalendarTemplateParamsSchema, body: adminCalendarTemplateUpdateSchema }),
  asyncHandler(controller.updateTemplate),
);

router.delete(
  '/templates/:templateId',
  validateRequest({ params: adminCalendarTemplateParamsSchema }),
  asyncHandler(controller.removeTemplate),
);

router.post(
  '/events',
  validateRequest({ body: adminCalendarEventCreateSchema }),
  asyncHandler(controller.createEvent),
);

router.put(
  '/events/:eventId',
  validateRequest({ params: adminCalendarEventParamsSchema, body: adminCalendarEventUpdateSchema }),
  asyncHandler(controller.updateEvent),
);

router.delete(
  '/events/:eventId',
  validateRequest({ params: adminCalendarEventParamsSchema }),
  asyncHandler(controller.removeEvent),
);

export default router;
