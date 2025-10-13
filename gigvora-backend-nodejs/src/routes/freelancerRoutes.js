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

export default router;
