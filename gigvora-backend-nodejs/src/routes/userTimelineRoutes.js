import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as userTimelineController from '../controllers/userTimelineController.js';
import {
  userTimelineParamsSchema,
  userTimelineEntryParamsSchema,
  userTimelinePostParamsSchema,
  userTimelineSettingsSchema,
  userTimelineEntryCreateSchema,
  userTimelineEntryUpdateSchema,
  userTimelinePostCreateSchema,
  userTimelinePostUpdateSchema,
  userTimelinePostPublishSchema,
  userTimelinePostMetricsSchema,
} from '../validation/schemas/userTimelineSchemas.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  validateRequest({ params: userTimelineParamsSchema }),
  asyncHandler(userTimelineController.getTimelineWorkspace),
);
router.put(
  '/settings',
  validateRequest({ params: userTimelineParamsSchema, body: userTimelineSettingsSchema }),
  asyncHandler(userTimelineController.updateTimelineSettings),
);

router.post(
  '/entries',
  validateRequest({ params: userTimelineParamsSchema, body: userTimelineEntryCreateSchema }),
  asyncHandler(userTimelineController.createTimelineEntryController),
);
router.put(
  '/entries/:entryId',
  validateRequest({ params: userTimelineEntryParamsSchema, body: userTimelineEntryUpdateSchema }),
  asyncHandler(userTimelineController.updateTimelineEntryController),
);
router.delete(
  '/entries/:entryId',
  validateRequest({ params: userTimelineEntryParamsSchema }),
  asyncHandler(userTimelineController.deleteTimelineEntryController),
);

router.post(
  '/posts',
  validateRequest({ params: userTimelineParamsSchema, body: userTimelinePostCreateSchema }),
  asyncHandler(userTimelineController.createTimelinePostController),
);
router.put(
  '/posts/:postId',
  validateRequest({ params: userTimelinePostParamsSchema, body: userTimelinePostUpdateSchema }),
  asyncHandler(userTimelineController.updateTimelinePostController),
);
router.delete(
  '/posts/:postId',
  validateRequest({ params: userTimelinePostParamsSchema }),
  asyncHandler(userTimelineController.deleteTimelinePostController),
);
router.post(
  '/posts/:postId/publish',
  validateRequest({ params: userTimelinePostParamsSchema, body: userTimelinePostPublishSchema }),
  asyncHandler(userTimelineController.publishTimelinePostController),
);
router.post(
  '/posts/:postId/metrics',
  validateRequest({ params: userTimelinePostParamsSchema, body: userTimelinePostMetricsSchema }),
  asyncHandler(userTimelineController.recordTimelinePostMetrics),
);

export default router;
