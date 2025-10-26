import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import * as freelancerController from '../controllers/freelancerController.js';
import * as freelancerProfileController from '../controllers/freelancerProfileController.js';
import * as freelancerEscrowController from '../controllers/freelancerEscrowController.js';
import * as freelancerAutoMatchController from '../controllers/freelancerAutoMatchController.js';
import * as freelancerPortfolioController from '../controllers/freelancerPortfolioController.js';
import * as freelancerCalendarController from '../controllers/freelancerCalendarController.js';
import * as freelancerDisputeController from '../controllers/freelancerDisputeController.js';
import * as freelancerOperationsController from '../controllers/freelancerOperationsController.js';
import freelancerNetworkingController from '../controllers/freelancerNetworkingController.js';
import freelancerTimelineController from '../controllers/freelancerTimelineController.js';
import volunteeringController from '../controllers/volunteeringController.js';
import * as clientSuccessController from '../controllers/clientSuccessController.js';
import { collaborationsOverview } from '../controllers/freelancerAgencyController.js';
import {
  showOverview as showFreelancerDashboardOverview,
  updateOverview as updateFreelancerDashboardOverview,
} from '../controllers/freelancerDashboardOverviewController.js';
import {
  freelancerDashboardParamsSchema,
  freelancerDashboardOverviewUpdateSchema,
} from '../validation/schemas/freelancerSchemas.js';
import {
  operationsParamsSchema,
  operationsMembershipParamsSchema,
  operationsMembershipRequestSchema,
  operationsMembershipUpdateSchema,
  operationsNoticeParamsSchema,
  operationsSyncBodySchema,
} from '../validation/schemas/freelancerOperationsSchemas.js';

const router = Router();
const ACTOR_ROLES = ['freelancer', 'agency', 'company', 'mentor', 'operations', 'admin'];
const NETWORK_ROLES = ['freelancer', 'agency', 'company', 'mentor', 'admin'];
const DISPUTE_ROLES = ['freelancer', 'agency', 'company', 'admin'];

const requireActor = [authenticateRequest(), requireRoles(...ACTOR_ROLES)];
const requireNetwork = [authenticateRequest(), requireRoles(...NETWORK_ROLES)];
const requireDisputeAccess = [authenticateRequest(), requireRoles(...DISPUTE_ROLES)];

router.get('/dashboard', ...requireActor, asyncHandler(freelancerController.dashboard));
router.get('/gigs/:gigId', authenticateRequest({ optional: true }), asyncHandler(freelancerController.show));
router.post('/gigs', ...requireActor, asyncHandler(freelancerController.createGig));
router.put('/gigs/:gigId', ...requireActor, asyncHandler(freelancerController.updateGig));
router.post('/gigs/:gigId/publish', ...requireActor, asyncHandler(freelancerController.publish));

router.get(
  '/:freelancerId/dashboard-overview',
  ...requireActor,
  validateRequest({ params: freelancerDashboardParamsSchema }),
  asyncHandler(showFreelancerDashboardOverview),
);
router.put(
  '/:freelancerId/dashboard-overview',
  ...requireActor,
  validateRequest({
    params: freelancerDashboardParamsSchema,
    body: freelancerDashboardOverviewUpdateSchema,
  }),
  asyncHandler(updateFreelancerDashboardOverview),
);

router.get(
  '/:freelancerId/operations/hq',
  ...requireActor,
  validateRequest({ params: operationsParamsSchema }),
  asyncHandler(freelancerOperationsController.operationsHq),
);
router.post(
  '/:freelancerId/operations/hq/sync',
  ...requireActor,
  validateRequest({ params: operationsParamsSchema, body: operationsSyncBodySchema }),
  asyncHandler(freelancerOperationsController.syncOperations),
);
router.post(
  '/:freelancerId/operations/memberships/:membershipId/requests',
  ...requireActor,
  validateRequest({
    params: operationsMembershipParamsSchema,
    body: operationsMembershipRequestSchema,
  }),
  asyncHandler(freelancerOperationsController.requestMembership),
);
router.put(
  '/:freelancerId/operations/memberships/:membershipId',
  ...requireActor,
  validateRequest({
    params: operationsMembershipParamsSchema,
    body: operationsMembershipUpdateSchema,
  }),
  asyncHandler(freelancerOperationsController.updateMembership),
);
router.post(
  '/:freelancerId/operations/notices/:noticeId/acknowledge',
  ...requireActor,
  validateRequest({ params: operationsNoticeParamsSchema }),
  asyncHandler(freelancerOperationsController.acknowledgeNotice),
);

router.get('/order-pipeline', ...requireActor, asyncHandler(freelancerController.orderPipeline));
router.post('/order-pipeline/orders', ...requireActor, asyncHandler(freelancerController.createOrder));
router.patch('/order-pipeline/orders/:orderId', ...requireActor, asyncHandler(freelancerController.updateOrder));
router.post(
  '/order-pipeline/orders/:orderId/requirement-forms',
  ...requireActor,
  asyncHandler(freelancerController.createOrderRequirement),
);
router.patch(
  '/order-pipeline/orders/:orderId/requirement-forms/:formId',
  ...requireActor,
  asyncHandler(freelancerController.updateOrderRequirement),
);
router.post(
  '/order-pipeline/orders/:orderId/revisions',
  ...requireActor,
  asyncHandler(freelancerController.createOrderRevision),
);
router.patch(
  '/order-pipeline/orders/:orderId/revisions/:revisionId',
  ...requireActor,
  asyncHandler(freelancerController.updateOrderRevision),
);
router.post(
  '/order-pipeline/orders/:orderId/escrow-checkpoints',
  ...requireActor,
  asyncHandler(freelancerController.createOrderEscrowCheckpoint),
);
router.patch(
  '/order-pipeline/orders/:orderId/escrow-checkpoints/:checkpointId',
  ...requireActor,
  asyncHandler(freelancerController.updateOrderEscrowCheckpoint),
);

router.get(
  '/:freelancerId/escrow/overview',
  ...requireActor,
  asyncHandler(freelancerEscrowController.overview),
);
router.post(
  '/:freelancerId/escrow/accounts',
  ...requireActor,
  asyncHandler(freelancerEscrowController.createAccount),
);
router.patch(
  '/:freelancerId/escrow/accounts/:accountId',
  ...requireActor,
  asyncHandler(freelancerEscrowController.updateAccount),
);
router.post(
  '/:freelancerId/escrow/transactions',
  ...requireActor,
  asyncHandler(freelancerEscrowController.createTransaction),
);
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/release',
  ...requireActor,
  asyncHandler(freelancerEscrowController.releaseTransaction),
);
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/refund',
  ...requireActor,
  asyncHandler(freelancerEscrowController.refundTransaction),
);
router.post(
  '/:freelancerId/escrow/transactions/:transactionId/disputes',
  ...requireActor,
  asyncHandler(freelancerEscrowController.openDispute),
);
router.post(
  '/:freelancerId/escrow/disputes/:disputeId/events',
  ...requireActor,
  asyncHandler(freelancerEscrowController.appendDisputeEvent),
);

router.get('/:freelancerId/auto-match/overview', ...requireActor, asyncHandler(freelancerAutoMatchController.overview));
router.get('/:freelancerId/auto-match/matches', ...requireActor, asyncHandler(freelancerAutoMatchController.matches));
router.patch(
  '/:freelancerId/auto-match/preferences',
  ...requireActor,
  asyncHandler(freelancerAutoMatchController.updatePreferences),
);
router.post(
  '/:freelancerId/auto-match/matches/:entryId/decision',
  ...requireActor,
  asyncHandler(freelancerAutoMatchController.respond),
);

router.get(
  '/:freelancerId/calendar/events',
  ...requireActor,
  asyncHandler(freelancerCalendarController.listCalendarEvents),
);
router.post(
  '/:freelancerId/calendar/events',
  ...requireActor,
  asyncHandler(freelancerCalendarController.createCalendarEvent),
);
router.put(
  '/:freelancerId/calendar/events/:eventId',
  ...requireActor,
  asyncHandler(freelancerCalendarController.updateCalendarEvent),
);
router.delete(
  '/:freelancerId/calendar/events/:eventId',
  ...requireActor,
  asyncHandler(freelancerCalendarController.deleteCalendarEvent),
);
router.get(
  '/:freelancerId/calendar/events/:eventId/ics',
  ...requireActor,
  asyncHandler(freelancerCalendarController.downloadCalendarEventInvite),
);

router.get('/:freelancerId/networking/dashboard', ...requireNetwork, asyncHandler(freelancerNetworkingController.dashboard));
router.post(
  '/:freelancerId/networking/sessions/:sessionId/book',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.book),
);
router.patch(
  '/:freelancerId/networking/signups/:signupId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.updateSignup),
);
router.delete(
  '/:freelancerId/networking/signups/:signupId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.cancelSignup),
);
router.get(
  '/:freelancerId/networking/connections',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.listConnections),
);
router.post(
  '/:freelancerId/networking/connections',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.createConnection),
);
router.patch(
  '/:freelancerId/networking/connections/:connectionId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.updateConnection),
);
router.delete(
  '/:freelancerId/networking/connections/:connectionId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.deleteConnection),
);
router.get(
  '/:freelancerId/networking/metrics',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.metrics),
);
router.get(
  '/:freelancerId/networking/orders',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.listOrders),
);
router.post(
  '/:freelancerId/networking/orders',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.createOrder),
);
router.patch(
  '/:freelancerId/networking/orders/:orderId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.updateOrder),
);
router.delete(
  '/:freelancerId/networking/orders/:orderId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.deleteOrder),
);
router.get(
  '/:freelancerId/networking/settings',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.getSettings),
);
router.patch(
  '/:freelancerId/networking/settings',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.patchSettings),
);
router.patch(
  '/:freelancerId/networking/preferences',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.patchPreferences),
);
router.get('/:freelancerId/networking/ads', ...requireNetwork, asyncHandler(freelancerNetworkingController.listAds));
router.post('/:freelancerId/networking/ads', ...requireNetwork, asyncHandler(freelancerNetworkingController.createAd));
router.patch(
  '/:freelancerId/networking/ads/:campaignId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.updateAd),
);
router.delete(
  '/:freelancerId/networking/ads/:campaignId',
  ...requireNetwork,
  asyncHandler(freelancerNetworkingController.deleteAd),
);

router.get('/:freelancerId/volunteering', ...requireActor, asyncHandler(volunteeringController.workspace));
router.post(
  '/:freelancerId/volunteering/applications',
  ...requireActor,
  asyncHandler(volunteeringController.storeApplication),
);
router.put(
  '/:freelancerId/volunteering/applications/:applicationId',
  ...requireActor,
  asyncHandler(volunteeringController.patchApplication),
);
router.delete(
  '/:freelancerId/volunteering/applications/:applicationId',
  ...requireActor,
  asyncHandler(volunteeringController.destroyApplication),
);
router.post(
  '/:freelancerId/volunteering/applications/:applicationId/responses',
  ...requireActor,
  asyncHandler(volunteeringController.storeResponse),
);
router.put(
  '/:freelancerId/volunteering/responses/:responseId',
  ...requireActor,
  asyncHandler(volunteeringController.patchResponse),
);
router.delete(
  '/:freelancerId/volunteering/responses/:responseId',
  ...requireActor,
  asyncHandler(volunteeringController.destroyResponse),
);
router.post(
  '/:freelancerId/volunteering/contracts',
  ...requireActor,
  asyncHandler(volunteeringController.storeContract),
);
router.put(
  '/:freelancerId/volunteering/contracts/:contractId',
  ...requireActor,
  asyncHandler(volunteeringController.patchContract),
);
router.delete(
  '/:freelancerId/volunteering/contracts/:contractId',
  ...requireActor,
  asyncHandler(volunteeringController.destroyContract),
);
router.post(
  '/:freelancerId/volunteering/contracts/:contractId/spend',
  ...requireActor,
  asyncHandler(volunteeringController.storeSpend),
);
router.put(
  '/:freelancerId/volunteering/spend/:spendId',
  ...requireActor,
  asyncHandler(volunteeringController.patchSpend),
);
router.delete(
  '/:freelancerId/volunteering/spend/:spendId',
  ...requireActor,
  asyncHandler(volunteeringController.destroySpend),
);

router.get('/:freelancerId/timeline', ...requireActor, asyncHandler(freelancerTimelineController.getTimelineWorkspace));
router.put(
  '/:freelancerId/timeline/settings',
  ...requireActor,
  asyncHandler(freelancerTimelineController.updateTimelineSettings),
);
router.post(
  '/:freelancerId/timeline/entries',
  ...requireActor,
  asyncHandler(freelancerTimelineController.createTimelineEntry),
);
router.put(
  '/:freelancerId/timeline/entries/:entryId',
  ...requireActor,
  asyncHandler(freelancerTimelineController.updateTimelineEntry),
);
router.delete(
  '/:freelancerId/timeline/entries/:entryId',
  ...requireActor,
  asyncHandler(freelancerTimelineController.deleteTimelineEntry),
);
router.post(
  '/:freelancerId/timeline/posts',
  ...requireActor,
  asyncHandler(freelancerTimelineController.createTimelinePost),
);
router.put(
  '/:freelancerId/timeline/posts/:postId',
  ...requireActor,
  asyncHandler(freelancerTimelineController.updateTimelinePost),
);
router.delete(
  '/:freelancerId/timeline/posts/:postId',
  ...requireActor,
  asyncHandler(freelancerTimelineController.deleteTimelinePost),
);
router.post(
  '/:freelancerId/timeline/posts/:postId/publish',
  ...requireActor,
  asyncHandler(freelancerTimelineController.publishTimelinePost),
);
router.post(
  '/:freelancerId/timeline/posts/:postId/metrics',
  ...requireActor,
  asyncHandler(freelancerTimelineController.recordTimelinePostMetrics),
);

router.get('/:freelancerId/community-spotlight', authenticateRequest({ optional: true }), asyncHandler(freelancerController.communitySpotlight));
router.get(
  '/:freelancerId/client-success/overview',
  ...requireActor,
  asyncHandler(clientSuccessController.overview),
);
router.post(
  '/:freelancerId/client-success/playbooks',
  ...requireActor,
  asyncHandler(clientSuccessController.storePlaybook),
);
router.put(
  '/:freelancerId/client-success/playbooks/:playbookId',
  ...requireActor,
  asyncHandler(clientSuccessController.updatePlaybook),
);
router.post(
  '/:freelancerId/client-success/playbooks/:playbookId/enrollments',
  ...requireActor,
  asyncHandler(clientSuccessController.enroll),
);
router.post(
  '/:freelancerId/client-success/gigs/:gigId/referrals',
  ...requireActor,
  asyncHandler(clientSuccessController.storeReferral),
);
router.post(
  '/:freelancerId/client-success/gigs/:gigId/affiliate-links',
  ...requireActor,
  asyncHandler(clientSuccessController.storeAffiliateLink),
);

router.get('/:freelancerId/agency-collaborations', ...requireActor, asyncHandler(collaborationsOverview));

router.get('/:freelancerId/disputes', ...requireDisputeAccess, asyncHandler(freelancerDisputeController.listDisputes));
router.post('/:freelancerId/disputes', ...requireDisputeAccess, asyncHandler(freelancerDisputeController.createDispute));
router.get(
  '/:freelancerId/disputes/:disputeId',
  ...requireDisputeAccess,
  asyncHandler(freelancerDisputeController.showDispute),
);
router.post(
  '/:freelancerId/disputes/:disputeId/events',
  ...requireDisputeAccess,
  asyncHandler(freelancerDisputeController.appendEvent),
);

router.get('/:userId/profile-hub', ...requireActor, asyncHandler(freelancerProfileController.getProfileHub));
router.put('/:userId/profile-hub', ...requireActor, asyncHandler(freelancerProfileController.updateProfileHub));
router.put('/:userId/expertise-areas', ...requireActor, asyncHandler(freelancerProfileController.updateExpertiseAreas));
router.put('/:userId/success-metrics', ...requireActor, asyncHandler(freelancerProfileController.updateSuccessMetrics));
router.put('/:userId/testimonials', ...requireActor, asyncHandler(freelancerProfileController.updateTestimonials));
router.put('/:userId/hero-banners', ...requireActor, asyncHandler(freelancerProfileController.updateHeroBanners));

router.get('/:id/purchased-gigs', ...requireActor, asyncHandler(freelancerController.getPurchasedGigWorkspace));

router.get('/:userId/portfolio', authenticateRequest({ optional: true }), asyncHandler(freelancerPortfolioController.listPortfolio));
router.post('/:userId/portfolio', ...requireActor, asyncHandler(freelancerPortfolioController.createPortfolioItem));
router.put(
  '/:userId/portfolio/:portfolioId',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.updatePortfolioItem),
);
router.delete(
  '/:userId/portfolio/:portfolioId',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.deletePortfolioItem),
);
router.post(
  '/:userId/portfolio/:portfolioId/assets',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.createPortfolioAsset),
);
router.put(
  '/:userId/portfolio/:portfolioId/assets/:assetId',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.updatePortfolioAsset),
);
router.delete(
  '/:userId/portfolio/:portfolioId/assets/:assetId',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.deletePortfolioAsset),
);
router.put(
  '/:userId/portfolio-settings',
  ...requireActor,
  asyncHandler(freelancerPortfolioController.updatePortfolioSettings),
);

export default router;
