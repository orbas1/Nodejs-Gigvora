import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { communitySpotlight } from '../controllers/freelancerController.js';

const router = Router();

router.get('/:freelancerId/community-spotlight', asyncHandler(communitySpotlight));
import clientSuccessController from '../controllers/clientSuccessController.js';

const router = Router({ mergeParams: true });

router.get(
  '/:freelancerId/client-success/overview',
  asyncHandler(clientSuccessController.overview),
);

router.post(
  '/:freelancerId/client-success/playbooks',
  asyncHandler(clientSuccessController.storePlaybook),
);

router.put(
  '/:freelancerId/client-success/playbooks/:playbookId',
  asyncHandler(clientSuccessController.updatePlaybook),
);

router.post(
  '/:freelancerId/client-success/playbooks/:playbookId/enrollments',
  asyncHandler(clientSuccessController.enroll),
);

router.post(
  '/:freelancerId/client-success/gigs/:gigId/referrals',
  asyncHandler(clientSuccessController.storeReferral),
);

router.post(
  '/:freelancerId/client-success/gigs/:gigId/affiliate-links',
  asyncHandler(clientSuccessController.storeAffiliateLink),
);
import {
  orderPipeline,
  createOrder,
  updateOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createOrderEscrowCheckpoint,
  updateOrderEscrowCheckpoint,
} from '../controllers/freelancerController.js';

const router = Router();

router.get('/order-pipeline', orderPipeline);
router.post('/order-pipeline/orders', createOrder);
router.patch('/order-pipeline/orders/:orderId', updateOrder);
router.post('/order-pipeline/orders/:orderId/requirement-forms', createOrderRequirement);
router.patch('/order-pipeline/orders/:orderId/requirement-forms/:formId', updateOrderRequirement);
router.post('/order-pipeline/orders/:orderId/revisions', createOrderRevision);
router.patch('/order-pipeline/orders/:orderId/revisions/:revisionId', updateOrderRevision);
router.post('/order-pipeline/orders/:orderId/escrow-checkpoints', createOrderEscrowCheckpoint);
router.patch(
  '/order-pipeline/orders/:orderId/escrow-checkpoints/:checkpointId',
  updateOrderEscrowCheckpoint,
);

export default router;
import * as freelancerAgencyController from '../controllers/freelancerAgencyController.js';
import asyncHandler from '../utils/asyncHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as freelancerProfileController from '../controllers/freelancerProfileController.js';

const router = Router();

router.get(
  '/:freelancerId/agency-collaborations',
  asyncHandler(freelancerAgencyController.collaborationsOverview),
);

export default router;

  '/:userId/profile-hub',
  asyncHandler(freelancerProfileController.getProfileHub),
);
router.put(
  '/:userId/profile-hub',
  asyncHandler(freelancerProfileController.updateProfileHub),
);
router.put(
  '/:userId/expertise-areas',
  asyncHandler(freelancerProfileController.updateExpertiseAreas),
);
router.put(
  '/:userId/success-metrics',
  asyncHandler(freelancerProfileController.updateSuccessMetrics),
);
router.put(
  '/:userId/testimonials',
  asyncHandler(freelancerProfileController.updateTestimonials),
);
router.put(
  '/:userId/hero-banners',
  asyncHandler(freelancerProfileController.updateHeroBanners),
);
import freelancerController from '../controllers/freelancerController.js';

const router = Router();

router.get('/dashboard', asyncHandler(freelancerController.dashboard));

export default router;

router.post('/gigs', asyncHandler(freelancerController.createGig));
router.put('/gigs/:gigId', asyncHandler(freelancerController.updateGig));
router.post('/gigs/:gigId/publish', asyncHandler(freelancerController.publish));
router.get('/gigs/:gigId', asyncHandler(freelancerController.show));
import * as freelancerController from '../controllers/freelancerController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/:id/purchased-gigs', asyncHandler(freelancerController.getPurchasedGigWorkspace));

export default router;
