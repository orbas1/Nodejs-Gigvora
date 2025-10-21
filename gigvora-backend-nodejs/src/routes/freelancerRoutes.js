import { Router } from 'express';

import {
  enroll as enrollClient,
  overview as clientSuccessOverview,
  storeAffiliateLink,
  storePlaybook,
  storeReferral,
  updatePlaybook,
} from '../controllers/clientSuccessController.js';
import { collaborationsOverview } from '../controllers/freelancerAgencyController.js';
import {
  communitySpotlight,
  createGig,
  createOrder,
  createOrderEscrowCheckpoint,
  createOrderRequirement,
  createOrderRevision,
  dashboard,
  getPurchasedGigWorkspace,
  orderPipeline,
  publish,
  show,
  updateGig,
  updateOrder,
  updateOrderEscrowCheckpoint,
  updateOrderRequirement,
  updateOrderRevision,
} from '../controllers/freelancerController.js';
import {
  getProfileHub,
  updateExpertiseAreas,
  updateHeroBanners,
  updateProfileHub,
  updateSuccessMetrics,
  updateTestimonials,
} from '../controllers/freelancerProfileController.js';
import {
  appendDisputeEvent as appendEscrowDisputeEvent,
  createAccount as createEscrowAccount,
  createTransaction as createEscrowTransaction,
  openDispute as openEscrowDispute,
  overview as escrowOverview,
  refundTransaction as refundEscrowTransaction,
  releaseTransaction as releaseEscrowTransaction,
  updateAccount as updateEscrowAccount,
} from '../controllers/freelancerEscrowController.js';
  overview as autoMatchOverview,
  matches as autoMatchMatches,
  updatePreferences as autoMatchUpdatePreferences,
  respond as autoMatchRespond,
} from '../controllers/freelancerAutoMatchController.js';
  listPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createPortfolioAsset,
  updatePortfolioAsset,
  deletePortfolioAsset,
  updatePortfolioSettings,
} from '../controllers/freelancerPortfolioController.js';
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/freelancerCalendarController.js';
  listDisputes,
  createDispute,
  showDispute,
  appendEvent,
} from '../controllers/freelancerDisputeController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  freelancerDashboardParamsSchema,
  freelancerDashboardOverviewUpdateSchema,
} from '../validation/schemas/freelancerSchemas.js';
import {
  showOverview as showFreelancerDashboardOverview,
  updateOverview as updateFreelancerDashboardOverview,
} from '../controllers/freelancerDashboardOverviewController.js';
import { authenticateRequest } from '../middleware/authentication.js';
import freelancerNetworkingController from '../controllers/freelancerNetworkingController.js';
import {
  getTimelineWorkspace,
  updateTimelineSettings,
  createTimelineEntry as createTimelineEntryController,
  updateTimelineEntry as updateTimelineEntryController,
  deleteTimelineEntry as deleteTimelineEntryController,
  createTimelinePost as createTimelinePostController,
  updateTimelinePost as updateTimelinePostController,
  deleteTimelinePost as deleteTimelinePostController,
  publishTimelinePost as publishTimelinePostController,
  recordTimelinePostMetrics,
} from '../controllers/freelancerTimelineController.js';

import volunteeringController from '../controllers/volunteeringController.js';

const router = Router();

router.get('/dashboard', asyncHandler(dashboard));
router.get('/gigs/:gigId', asyncHandler(show));
router.post('/gigs', asyncHandler(createGig));
router.put('/gigs/:gigId', asyncHandler(updateGig));
router.post('/gigs/:gigId/publish', asyncHandler(publish));

router.get(
  '/:freelancerId/dashboard-overview',
  validateRequest({ params: freelancerDashboardParamsSchema }),
  asyncHandler(showFreelancerDashboardOverview),
);
router.put(
  '/:freelancerId/dashboard-overview',
  validateRequest({
    params: freelancerDashboardParamsSchema,
    body: freelancerDashboardOverviewUpdateSchema,
  }),
  asyncHandler(updateFreelancerDashboardOverview),
);

router.get('/order-pipeline', asyncHandler(orderPipeline));
router.post('/order-pipeline/orders', asyncHandler(createOrder));
router.patch('/order-pipeline/orders/:orderId', asyncHandler(updateOrder));
router.post('/order-pipeline/orders/:orderId/requirement-forms', asyncHandler(createOrderRequirement));
router.patch(
  '/order-pipeline/orders/:orderId/requirement-forms/:formId',
  asyncHandler(updateOrderRequirement),
);
router.post('/order-pipeline/orders/:orderId/revisions', asyncHandler(createOrderRevision));
router.patch(
  '/order-pipeline/orders/:orderId/revisions/:revisionId',
  asyncHandler(updateOrderRevision),
);
router.post(
  '/order-pipeline/orders/:orderId/escrow-checkpoints',
  asyncHandler(createOrderEscrowCheckpoint),
);
router.patch(
  '/order-pipeline/orders/:orderId/escrow-checkpoints/:checkpointId',
  asyncHandler(updateOrderEscrowCheckpoint),
);

router.get('/:freelancerId/escrow/overview', asyncHandler(escrowOverview));
router.post('/:freelancerId/escrow/accounts', asyncHandler(createEscrowAccount));
router.patch('/:freelancerId/escrow/accounts/:accountId', asyncHandler(updateEscrowAccount));
router.post('/:freelancerId/escrow/transactions', asyncHandler(createEscrowTransaction));
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/release',
  asyncHandler(releaseEscrowTransaction),
);
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/refund',
  asyncHandler(refundEscrowTransaction),
);
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/disputes',
  asyncHandler(openEscrowDispute),
);
router.post(
  '/:freelancerId/escrow/disputes/:disputeId/events',
  asyncHandler(appendEscrowDisputeEvent),
router.get('/:freelancerId/auto-match/overview', asyncHandler(autoMatchOverview));
router.get('/:freelancerId/auto-match/matches', asyncHandler(autoMatchMatches));
router.patch('/:freelancerId/auto-match/preferences', asyncHandler(autoMatchUpdatePreferences));
router.post(
  '/:freelancerId/auto-match/matches/:entryId/decision',
  asyncHandler(autoMatchRespond),
router.get('/:freelancerId/calendar/events', asyncHandler(listCalendarEvents));
router.post('/:freelancerId/calendar/events', asyncHandler(createCalendarEvent));
router.put('/:freelancerId/calendar/events/:eventId', asyncHandler(updateCalendarEvent));
router.delete('/:freelancerId/calendar/events/:eventId', asyncHandler(deleteCalendarEvent));
router.get(
  '/:freelancerId/networking/dashboard',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.dashboard),
);
router.post(
  '/:freelancerId/networking/sessions/:sessionId/book',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.book),
);
router.patch(
  '/:freelancerId/networking/signups/:signupId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.updateSignup),
);
router.delete(
  '/:freelancerId/networking/signups/:signupId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.cancelSignup),
);
router.get(
  '/:freelancerId/networking/connections',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.listConnections),
);
router.post(
  '/:freelancerId/networking/connections',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.createConnection),
);
router.patch(
  '/:freelancerId/networking/connections/:connectionId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.updateConnection),
);
router.delete(
  '/:freelancerId/networking/connections/:connectionId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.deleteConnection),
);
router.get(
  '/:freelancerId/networking/metrics',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.metrics),
);
router.get(
  '/:freelancerId/networking/orders',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.listOrders),
);
router.post(
  '/:freelancerId/networking/orders',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.createOrder),
);
router.patch(
  '/:freelancerId/networking/orders/:orderId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.updateOrder),
);
router.delete(
  '/:freelancerId/networking/orders/:orderId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.deleteOrder),
);
router.get(
  '/:freelancerId/networking/settings',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.getSettings),
);
router.patch(
  '/:freelancerId/networking/settings',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.patchSettings),
);
router.patch(
  '/:freelancerId/networking/preferences',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.patchPreferences),
);
router.get(
  '/:freelancerId/networking/ads',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.listAds),
);
router.post(
  '/:freelancerId/networking/ads',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.createAd),
);
router.patch(
  '/:freelancerId/networking/ads/:campaignId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.updateAd),
);
router.delete(
  '/:freelancerId/networking/ads/:campaignId',
  authenticateRequest(),
  asyncHandler(freelancerNetworkingController.deleteAd),
);
router.get('/:freelancerId/volunteering', asyncHandler(volunteeringController.workspace));
router.post('/:freelancerId/volunteering/applications', asyncHandler(volunteeringController.storeApplication));
router.put('/:freelancerId/volunteering/applications/:applicationId', asyncHandler(volunteeringController.patchApplication));
router.delete('/:freelancerId/volunteering/applications/:applicationId', asyncHandler(volunteeringController.destroyApplication));
router.post('/:freelancerId/volunteering/applications/:applicationId/responses', asyncHandler(volunteeringController.storeResponse));
router.put('/:freelancerId/volunteering/responses/:responseId', asyncHandler(volunteeringController.patchResponse));
router.delete('/:freelancerId/volunteering/responses/:responseId', asyncHandler(volunteeringController.destroyResponse));
router.post('/:freelancerId/volunteering/contracts', asyncHandler(volunteeringController.storeContract));
router.put('/:freelancerId/volunteering/contracts/:contractId', asyncHandler(volunteeringController.patchContract));
router.delete('/:freelancerId/volunteering/contracts/:contractId', asyncHandler(volunteeringController.destroyContract));
router.post('/:freelancerId/volunteering/contracts/:contractId/spend', asyncHandler(volunteeringController.storeSpend));
router.put('/:freelancerId/volunteering/spend/:spendId', asyncHandler(volunteeringController.patchSpend));
router.delete('/:freelancerId/volunteering/spend/:spendId', asyncHandler(volunteeringController.destroySpend));
router.get('/:freelancerId/timeline', asyncHandler(getTimelineWorkspace));
router.put('/:freelancerId/timeline/settings', asyncHandler(updateTimelineSettings));
router.post('/:freelancerId/timeline/entries', asyncHandler(createTimelineEntryController));
router.put('/:freelancerId/timeline/entries/:entryId', asyncHandler(updateTimelineEntryController));
router.delete('/:freelancerId/timeline/entries/:entryId', asyncHandler(deleteTimelineEntryController));
router.post('/:freelancerId/timeline/posts', asyncHandler(createTimelinePostController));
router.put('/:freelancerId/timeline/posts/:postId', asyncHandler(updateTimelinePostController));
router.delete('/:freelancerId/timeline/posts/:postId', asyncHandler(deleteTimelinePostController));
router.post(
  '/:freelancerId/timeline/posts/:postId/publish',
  asyncHandler(publishTimelinePostController),
);
router.post(
  '/:freelancerId/timeline/posts/:postId/metrics',
  asyncHandler(recordTimelinePostMetrics),
);

router.get('/:freelancerId/community-spotlight', asyncHandler(communitySpotlight));
router.get('/:freelancerId/client-success/overview', asyncHandler(clientSuccessOverview));
router.post('/:freelancerId/client-success/playbooks', asyncHandler(storePlaybook));
router.put(
  '/:freelancerId/client-success/playbooks/:playbookId',
  asyncHandler(updatePlaybook),
);
router.post(
  '/:freelancerId/client-success/playbooks/:playbookId/enrollments',
  asyncHandler(enrollClient),
);
router.post(
  '/:freelancerId/client-success/gigs/:gigId/referrals',
  asyncHandler(storeReferral),
);
router.post(
  '/:freelancerId/client-success/gigs/:gigId/affiliate-links',
  asyncHandler(storeAffiliateLink),
);

router.get(
  '/:freelancerId/agency-collaborations',
  asyncHandler(collaborationsOverview),
);

router.get('/:freelancerId/disputes', asyncHandler(listDisputes));
router.post('/:freelancerId/disputes', asyncHandler(createDispute));
router.get('/:freelancerId/disputes/:disputeId', asyncHandler(showDispute));
router.post('/:freelancerId/disputes/:disputeId/events', asyncHandler(appendEvent));

router.get('/:userId/profile-hub', asyncHandler(getProfileHub));
router.put('/:userId/profile-hub', asyncHandler(updateProfileHub));
router.put('/:userId/expertise-areas', asyncHandler(updateExpertiseAreas));
router.put('/:userId/success-metrics', asyncHandler(updateSuccessMetrics));
router.put('/:userId/testimonials', asyncHandler(updateTestimonials));
router.put('/:userId/hero-banners', asyncHandler(updateHeroBanners));

router.get('/:id/purchased-gigs', asyncHandler(getPurchasedGigWorkspace));

router.get('/:userId/portfolio', asyncHandler(listPortfolio));
router.post('/:userId/portfolio', asyncHandler(createPortfolioItem));
router.put('/:userId/portfolio/:portfolioId', asyncHandler(updatePortfolioItem));
router.delete('/:userId/portfolio/:portfolioId', asyncHandler(deletePortfolioItem));
router.post('/:userId/portfolio/:portfolioId/assets', asyncHandler(createPortfolioAsset));
router.put('/:userId/portfolio/:portfolioId/assets/:assetId', asyncHandler(updatePortfolioAsset));
router.delete('/:userId/portfolio/:portfolioId/assets/:assetId', asyncHandler(deletePortfolioAsset));
router.put('/:userId/portfolio-settings', asyncHandler(updatePortfolioSettings));

export default router;
