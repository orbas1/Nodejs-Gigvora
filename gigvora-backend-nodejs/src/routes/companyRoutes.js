import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import companyCalendarRoutes from './companyCalendarRoutes.js';
import companyController from '../controllers/companyController.js';
import companyEscrowController from '../controllers/companyEscrowController.js';
import companyInboxController from '../controllers/companyInboxController.js';
import companyPageController from '../controllers/companyPageController.js';
import companyProfileController from '../controllers/companyProfileController.js';
import {
  companyEscrowOverviewQuerySchema,
  companyEscrowAccountCreateSchema,
  companyEscrowAccountUpdateSchema,
  companyEscrowTransactionCreateSchema,
  companyEscrowAccountParamsSchema,
  companyEscrowTransactionParamsSchema,
  companyEscrowTransactionActionBodySchema,
  companyEscrowAutomationUpdateSchema,
} from '../validation/schemas/companyEscrowSchemas.js';

const router = Router();
const COMPANY_ROLES = ['company', 'company_admin', 'workspace_admin', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...COMPANY_ROLES));

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
router.put('/dashboard/overview', asyncHandler(companyController.updateDashboardOverview));

router.get('/dashboard/pages', asyncHandler(companyPageController.index));

router.post('/dashboard/pages', asyncHandler(companyPageController.create));

router.get('/dashboard/pages/:pageId', asyncHandler(companyPageController.show));

router.put('/dashboard/pages/:pageId', asyncHandler(companyPageController.update));

router.put('/dashboard/pages/:pageId/sections', asyncHandler(companyPageController.updateSections));

router.put(
  '/dashboard/pages/:pageId/collaborators',
  asyncHandler(companyPageController.updateCollaborators),
);

router.post('/dashboard/pages/:pageId/publish', asyncHandler(companyPageController.publish));

router.post('/dashboard/pages/:pageId/archive', asyncHandler(companyPageController.archive));

router.delete('/dashboard/pages/:pageId', asyncHandler(companyPageController.destroy));

router.get('/ai/auto-reply/overview', asyncHandler(companyController.byokAutoReplyOverview));
router.put(
  '/ai/auto-reply/settings',
  asyncHandler(companyController.updateByokAutoReplySettings),
);
router.get(
  '/ai/auto-reply/templates',
  asyncHandler(companyController.listByokAutoReplyTemplates),
);
router.post('/ai/auto-reply/templates', asyncHandler(companyController.createByokAutoReplyTemplate));
router.put(
  '/ai/auto-reply/templates/:templateId',
  asyncHandler(companyController.updateByokAutoReplyTemplate),
);
router.delete(
  '/ai/auto-reply/templates/:templateId',
  asyncHandler(companyController.deleteByokAutoReplyTemplate),
);
router.post(
  '/ai/auto-reply/test',
  asyncHandler(companyController.previewByokAutoReply),
);

router.use('/calendar', companyCalendarRoutes);

router.get('/profile/workspace', asyncHandler(companyProfileController.getWorkspace));
router.put('/profile', asyncHandler(companyProfileController.updateProfile));
router.patch('/profile/avatar', asyncHandler(companyProfileController.updateAvatar));

router.get('/profile/followers', asyncHandler(companyProfileController.listFollowers));
router.post('/profile/followers', asyncHandler(companyProfileController.addFollower));
router.patch('/profile/followers/:followerId', asyncHandler(companyProfileController.updateFollower));
router.delete('/profile/followers/:followerId', asyncHandler(companyProfileController.removeFollower));

router.get('/profile/connections', asyncHandler(companyProfileController.listConnections));
router.post('/profile/connections', asyncHandler(companyProfileController.createConnection));
router.patch('/profile/connections/:connectionId', asyncHandler(companyProfileController.updateConnection));
router.delete('/profile/connections/:connectionId', asyncHandler(companyProfileController.removeConnection));

router.get(
  '/escrow/overview',
  validateRequest({ query: companyEscrowOverviewQuerySchema }),
  asyncHandler(companyEscrowController.overview),
);

router.post(
  '/escrow/accounts',
  validateRequest({ body: companyEscrowAccountCreateSchema }),
  asyncHandler(companyEscrowController.createAccount),
);

router.patch(
  '/escrow/accounts/:accountId',
  validateRequest({
    params: companyEscrowAccountParamsSchema,
    body: companyEscrowAccountUpdateSchema,
  }),
  asyncHandler(companyEscrowController.updateAccount),
);

router.post(
  '/escrow/transactions',
  validateRequest({ body: companyEscrowTransactionCreateSchema }),
  asyncHandler(companyEscrowController.createTransaction),
);

router.post(
  '/escrow/transactions/:transactionId/release',
  validateRequest({
    params: companyEscrowTransactionParamsSchema,
    body: companyEscrowTransactionActionBodySchema,
  }),
  asyncHandler(companyEscrowController.releaseTransaction),
);

router.post(
  '/escrow/transactions/:transactionId/refund',
  validateRequest({
    params: companyEscrowTransactionParamsSchema,
    body: companyEscrowTransactionActionBodySchema,
  }),
  asyncHandler(companyEscrowController.refundTransaction),
);

router.patch(
  '/escrow/automation',
  validateRequest({ body: companyEscrowAutomationUpdateSchema }),
  asyncHandler(companyEscrowController.updateAutomation),
);

export default router;

