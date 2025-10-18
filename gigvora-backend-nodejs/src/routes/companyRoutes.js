import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyCalendarRoutes from './companyCalendarRoutes.js';
import authenticate from '../middleware/authenticate.js';
import companyInboxController from '../controllers/companyInboxController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));
router.get('/inbox/overview', asyncHandler(companyInboxController.overview));
router.get('/inbox/threads', asyncHandler(companyInboxController.listThreads));
router.get('/inbox/threads/:threadId', asyncHandler(companyInboxController.threadDetail));
router.post('/inbox/threads/:threadId/labels', asyncHandler(companyInboxController.updateThreadLabels));
router.get('/inbox/labels', asyncHandler(companyInboxController.listLabels));
router.post('/inbox/labels', asyncHandler(companyInboxController.createLabel));
router.patch('/inbox/labels/:labelId', asyncHandler(companyInboxController.updateLabel));
router.delete('/inbox/labels/:labelId', asyncHandler(companyInboxController.deleteLabel));
router.get('/inbox/members', asyncHandler(companyInboxController.members));
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

router.get(
  '/ai/auto-reply/overview',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.byokAutoReplyOverview),
);
router.put(
  '/ai/auto-reply/settings',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.updateByokAutoReplySettings),
);
router.get(
  '/ai/auto-reply/templates',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.listByokAutoReplyTemplates),
);
router.post(
  '/ai/auto-reply/templates',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.createByokAutoReplyTemplate),
);
router.put(
  '/ai/auto-reply/templates/:templateId',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.updateByokAutoReplyTemplate),
);
router.delete(
  '/ai/auto-reply/templates/:templateId',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.deleteByokAutoReplyTemplate),
);
router.post(
  '/ai/auto-reply/test',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.previewByokAutoReply),
);

router.use('/calendar', companyCalendarRoutes);

export default router;

