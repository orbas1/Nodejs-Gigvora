import { Router } from 'express';
import * as reputationController from '../controllers/reputationController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/freelancers/:freelancerId',
  asyncHandler(reputationController.getFreelancerReputation),
);

router.post(
  '/freelancers/:freelancerId/testimonials',
  asyncHandler(reputationController.postTestimonial),
);

router.post(
  '/freelancers/:freelancerId/success-stories',
  asyncHandler(reputationController.postSuccessStory),
);

router.post('/freelancers/:freelancerId/metrics', asyncHandler(reputationController.postMetric));

router.post('/freelancers/:freelancerId/badges', asyncHandler(reputationController.postBadge));

router.post(
  '/freelancers/:freelancerId/widgets',
  asyncHandler(reputationController.postReviewWidget),
);

export default router;

