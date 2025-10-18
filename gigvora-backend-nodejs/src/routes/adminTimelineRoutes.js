import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as adminTimelineController from '../controllers/adminTimelineController.js';
import {
  timelineListQuerySchema,
  createTimelineBodySchema,
  updateTimelineBodySchema,
  timelineEventBodySchema,
  timelineEventUpdateBodySchema,
  timelineReorderBodySchema,
} from '../validation/schemas/adminTimelineSchemas.js';

const router = Router();

const timelineIdParamSchema = z
  .object({ timelineId: z.coerce.number().int().positive({ message: 'timelineId must be a positive integer.' }) })
  .strip();

const timelineEventParamSchema = z
  .object({
    timelineId: z.coerce.number().int().positive({ message: 'timelineId must be a positive integer.' }),
    eventId: z.coerce.number().int().positive({ message: 'eventId must be a positive integer.' }),
  })
  .strip();

router.get('/', validateRequest({ query: timelineListQuerySchema }), asyncHandler(adminTimelineController.index));

router.post('/', validateRequest({ body: createTimelineBodySchema }), asyncHandler(adminTimelineController.store));

router.get(
  '/:timelineId',
  validateRequest({ params: timelineIdParamSchema }),
  asyncHandler(adminTimelineController.show),
);

router.put(
  '/:timelineId',
  validateRequest({ params: timelineIdParamSchema, body: updateTimelineBodySchema }),
  asyncHandler(adminTimelineController.update),
);

router.delete(
  '/:timelineId',
  validateRequest({ params: timelineIdParamSchema }),
  asyncHandler(adminTimelineController.destroy),
);

router.post(
  '/:timelineId/events',
  validateRequest({ params: timelineIdParamSchema, body: timelineEventBodySchema }),
  asyncHandler(adminTimelineController.storeEvent),
);

router.put(
  '/:timelineId/events/:eventId',
  validateRequest({ params: timelineEventParamSchema, body: timelineEventUpdateBodySchema }),
  asyncHandler(adminTimelineController.updateEvent),
);

router.delete(
  '/:timelineId/events/:eventId',
  validateRequest({ params: timelineEventParamSchema }),
  asyncHandler(adminTimelineController.destroyEvent),
);

router.post(
  '/:timelineId/events/reorder',
  validateRequest({ params: timelineIdParamSchema, body: timelineReorderBodySchema }),
  asyncHandler(adminTimelineController.reorderEvents),
);

export default router;
