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
import asyncHandler from '../utils/asyncHandler.js';
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

const router = Router();

router.get('/dashboard', asyncHandler(dashboard));
router.get('/gigs/:gigId', asyncHandler(show));
router.post('/gigs', asyncHandler(createGig));
router.put('/gigs/:gigId', asyncHandler(updateGig));
router.post('/gigs/:gigId/publish', asyncHandler(publish));

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

router.get('/:userId/profile-hub', asyncHandler(getProfileHub));
router.put('/:userId/profile-hub', asyncHandler(updateProfileHub));
router.put('/:userId/expertise-areas', asyncHandler(updateExpertiseAreas));
router.put('/:userId/success-metrics', asyncHandler(updateSuccessMetrics));
router.put('/:userId/testimonials', asyncHandler(updateTestimonials));
router.put('/:userId/hero-banners', asyncHandler(updateHeroBanners));

router.get('/:id/purchased-gigs', asyncHandler(getPurchasedGigWorkspace));

export default router;
