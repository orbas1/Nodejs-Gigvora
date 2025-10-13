import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as freelancerProfileController from '../controllers/freelancerProfileController.js';

const router = Router();

router.get(
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
router.post('/gigs', asyncHandler(freelancerController.createGig));
router.put('/gigs/:gigId', asyncHandler(freelancerController.updateGig));
router.post('/gigs/:gigId/publish', asyncHandler(freelancerController.publish));
router.get('/gigs/:gigId', asyncHandler(freelancerController.show));
import * as freelancerController from '../controllers/freelancerController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/:id/purchased-gigs', asyncHandler(freelancerController.getPurchasedGigWorkspace));

export default router;
