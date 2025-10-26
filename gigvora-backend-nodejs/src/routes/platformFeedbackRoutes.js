import { Router } from 'express';
import { z } from 'zod';
import { authenticateRequest } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import { feedbackPulseEligibility, submitFeedbackPulse } from '../controllers/platformSignalsController.js';

const router = Router();

const eligibilityQuerySchema = z
  .object({
    promptId: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .optional(),
    sessionFingerprint: z
      .string()
      .trim()
      .min(4)
      .max(256)
      .optional(),
  })
  .strip();

const submitBodySchema = z
  .object({
    promptId: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .optional(),
    rating: z.string().trim().min(1).max(64),
    comment: z
      .string()
      .trim()
      .max(1000)
      .optional(),
    sessionFingerprint: z
      .string()
      .trim()
      .min(4)
      .max(256)
      .optional(),
  })
  .strip();

router.get(
  '/pulse/eligibility',
  authenticateRequest({ optional: true }),
  validateRequest({ query: eligibilityQuerySchema }),
  asyncHandler(feedbackPulseEligibility),
);

router.post(
  '/pulse',
  authenticateRequest({ optional: true }),
  validateRequest({ body: submitBodySchema }),
  asyncHandler(submitFeedbackPulse),
);

export default router;
