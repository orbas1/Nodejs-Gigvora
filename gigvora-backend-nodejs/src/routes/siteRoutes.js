import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as siteController from '../controllers/siteController.js';
import validateRequest from '../middleware/validateRequest.js';
import { optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../validation/primitives.js';

const router = Router();

const sitePagesQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 50, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

const sitePageParamsSchema = z
  .object({
    slug: optionalTrimmedString({ max: 180 })
      .refine((value) => value != null, { message: 'slug is required.' })
      .transform((value) => value ?? undefined),
  })
  .transform((value) => ({ slug: value.slug }))
  .strip();

const feedbackResponses = ['yes', 'partially', 'no'];

const sitePageFeedbackBodySchema = z
  .object({
    rating: requiredTrimmedString({ max: 20, toLowerCase: true }).refine(
      (value) => feedbackResponses.includes(value),
      { message: `rating must be one of ${feedbackResponses.join(', ')}.` },
    ),
    message: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
  })
  .strip();

router.get('/settings', asyncHandler(siteController.settings));
router.get('/navigation', asyncHandler(siteController.navigation));
router.get('/pages', validateRequest({ query: sitePagesQuerySchema }), asyncHandler(siteController.index));
router.get(
  '/pages/:slug',
  validateRequest({ params: sitePageParamsSchema }),
  asyncHandler(siteController.show),
);
router.post(
  '/pages/:slug/feedback',
  validateRequest({ params: sitePageParamsSchema, body: sitePageFeedbackBodySchema }),
  asyncHandler(siteController.feedback),
);

export default router;
