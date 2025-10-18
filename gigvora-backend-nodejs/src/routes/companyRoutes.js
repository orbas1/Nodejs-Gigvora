import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));
router.get('/dashboard/timeline', asyncHandler(companyController.timeline));
router.post('/dashboard/timeline/events', asyncHandler(companyController.storeTimelineEvent));
router.patch('/dashboard/timeline/events/:eventId', asyncHandler(companyController.updateTimelineEvent));
router.delete('/dashboard/timeline/events/:eventId', asyncHandler(companyController.destroyTimelineEvent));
router.post('/dashboard/timeline/posts', asyncHandler(companyController.storeTimelinePost));
router.patch('/dashboard/timeline/posts/:postId', asyncHandler(companyController.updateTimelinePost));
router.post('/dashboard/timeline/posts/:postId/status', asyncHandler(companyController.changeTimelinePostStatus));
router.delete('/dashboard/timeline/posts/:postId', asyncHandler(companyController.destroyTimelinePost));
router.post('/dashboard/timeline/posts/:postId/metrics', asyncHandler(companyController.recordTimelineMetrics));
router.put(
  '/dashboard/overview',
  authenticate(),
  requireMembership(['company', 'company_admin', 'workspace_admin'], { allowAdmin: true }),
  asyncHandler(companyController.updateDashboardOverview),
);

export default router;

