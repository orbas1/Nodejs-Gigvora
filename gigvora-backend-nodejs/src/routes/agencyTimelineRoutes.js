import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import agencyTimelineController from '../controllers/agencyTimelineController.js';
import {
  timelineDashboardQuerySchema,
  timelinePostsQuerySchema,
  timelinePostIdParamsSchema,
  createTimelinePostBodySchema,
  updateTimelinePostBodySchema,
  updateTimelinePostStatusBodySchema,
  timelinePostAnalyticsQuerySchema,
} from '../validation/schemas/agencyTimelineSchemas.js';

const router = Router();
const requireAgencyRole = [authenticate(), requireRoles('agency', 'agency_admin', 'admin')];

router.get(
  '/dashboard',
  ...requireAgencyRole,
  validateRequest({ query: timelineDashboardQuerySchema }),
  asyncHandler(agencyTimelineController.dashboard),
);

router.get(
  '/posts',
  ...requireAgencyRole,
  validateRequest({ query: timelinePostsQuerySchema }),
  asyncHandler(agencyTimelineController.index),
);

router.post(
  '/posts',
  ...requireAgencyRole,
  validateRequest({ body: createTimelinePostBodySchema }),
  asyncHandler(agencyTimelineController.create),
);

router.get(
  '/posts/:postId',
  ...requireAgencyRole,
  validateRequest({ params: timelinePostIdParamsSchema }),
  asyncHandler(agencyTimelineController.show),
);

router.put(
  '/posts/:postId',
  ...requireAgencyRole,
  validateRequest({ params: timelinePostIdParamsSchema, body: updateTimelinePostBodySchema }),
  asyncHandler(agencyTimelineController.update),
);

router.patch(
  '/posts/:postId/status',
  ...requireAgencyRole,
  validateRequest({ params: timelinePostIdParamsSchema, body: updateTimelinePostStatusBodySchema }),
  asyncHandler(agencyTimelineController.updateStatus),
);

router.delete(
  '/posts/:postId',
  ...requireAgencyRole,
  validateRequest({ params: timelinePostIdParamsSchema }),
  asyncHandler(agencyTimelineController.destroy),
);

router.get(
  '/posts/:postId/analytics',
  ...requireAgencyRole,
  validateRequest({ params: timelinePostIdParamsSchema, query: timelinePostAnalyticsQuerySchema }),
  asyncHandler(agencyTimelineController.analytics),
);

export default router;
