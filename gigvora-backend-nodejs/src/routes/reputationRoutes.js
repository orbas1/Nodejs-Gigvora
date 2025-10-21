import { Router } from 'express';
import { z } from 'zod';
import * as reputationController from '../controllers/reputationController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

const reputationActorRoles = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin', 'partner'];
const requireReputationActor = authenticate({ roles: reputationActorRoles, allowAdminOverride: true });

const freelancerParamsSchema = z
  .object({
    freelancerId: z.coerce.number().int().positive({ message: 'freelancerId must be a positive integer.' }),
  })
  .strip();

const freelancerReviewParamsSchema = freelancerParamsSchema
  .extend({
    reviewId: z.coerce.number().int().positive({ message: 'reviewId must be a positive integer.' }),
  })
  .strip();

router.get(
  '/freelancers/:freelancerId',
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.getFreelancerReputation),
);

router.post(
  '/freelancers/:freelancerId/testimonials',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postTestimonial),
);

router.post(
  '/freelancers/:freelancerId/success-stories',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postSuccessStory),
);

router.post(
  '/freelancers/:freelancerId/metrics',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postMetric),
);

router.post(
  '/freelancers/:freelancerId/badges',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postBadge),
);

router.post(
  '/freelancers/:freelancerId/widgets',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postReviewWidget),
);

router.get(
  '/freelancers/:freelancerId/reviews',
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.getFreelancerReviews),
);

router.post(
  '/freelancers/:freelancerId/reviews',
  requireReputationActor,
  validateRequest({ params: freelancerParamsSchema }),
  asyncHandler(reputationController.postFreelancerReview),
);

router.put(
  '/freelancers/:freelancerId/reviews/:reviewId',
  requireReputationActor,
  validateRequest({ params: freelancerReviewParamsSchema }),
  asyncHandler(reputationController.putFreelancerReview),
);

router.delete(
  '/freelancers/:freelancerId/reviews/:reviewId',
  requireReputationActor,
  validateRequest({ params: freelancerReviewParamsSchema }),
  asyncHandler(reputationController.removeFreelancerReview),
);

export default router;

