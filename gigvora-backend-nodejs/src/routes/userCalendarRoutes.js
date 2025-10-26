import { Router } from 'express';
import * as calendarController from '../controllers/calendarController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  calendarEventBodySchema,
  calendarEventUpdateBodySchema,
  calendarEventsQuerySchema,
  calendarEventParamsSchema,
  calendarOverviewQuerySchema,
  focusSessionBodySchema,
  focusSessionUpdateBodySchema,
  focusSessionParamsSchema,
  focusSessionsQuerySchema,
  calendarSettingsBodySchema,
} from '../validation/schemas/calendarSchemas.js';

const router = Router({ mergeParams: true });

router.get(
  '/overview',
  validateRequest({ query: calendarOverviewQuerySchema }),
  asyncHandler(calendarController.getOverview),
);

router.get(
  '/events',
  validateRequest({ query: calendarEventsQuerySchema }),
  asyncHandler(calendarController.listEvents),
);

router.post(
  '/events',
  validateRequest({ body: calendarEventBodySchema }),
  asyncHandler(calendarController.createEvent),
);

router.put(
  '/events/:eventId',
  validateRequest({ params: calendarEventParamsSchema, body: calendarEventUpdateBodySchema }),
  asyncHandler(calendarController.updateEvent),
);

router.delete(
  '/events/:eventId',
  validateRequest({ params: calendarEventParamsSchema }),
  asyncHandler(calendarController.deleteEvent),
);

router.get(
  '/events/:eventId/ics',
  validateRequest({ params: calendarEventParamsSchema }),
  asyncHandler(calendarController.downloadEventInvite),
);

router.get(
  '/events/export.ics',
  validateRequest({ query: calendarEventsQuerySchema }),
  asyncHandler(calendarController.downloadEventsFeed),
);

router.get(
  '/focus-sessions',
  validateRequest({ query: focusSessionsQuerySchema }),
  asyncHandler(calendarController.listFocusSessions),
);

router.post(
  '/focus-sessions',
  validateRequest({ body: focusSessionBodySchema }),
  asyncHandler(calendarController.createFocusSession),
);

router.put(
  '/focus-sessions/:focusSessionId',
  validateRequest({ params: focusSessionParamsSchema, body: focusSessionUpdateBodySchema }),
  asyncHandler(calendarController.updateFocusSession),
);

router.delete(
  '/focus-sessions/:focusSessionId',
  validateRequest({ params: focusSessionParamsSchema }),
  asyncHandler(calendarController.deleteFocusSession),
);

router.get('/settings', asyncHandler(calendarController.getSettings));
router.put(
  '/settings',
  validateRequest({ body: calendarSettingsBodySchema }),
  asyncHandler(calendarController.updateSettings),
);

router.get('/sync', asyncHandler(calendarController.getSyncStatus));
router.post('/sync/refresh', asyncHandler(calendarController.triggerSync));

export default router;
