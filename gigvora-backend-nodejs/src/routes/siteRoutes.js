import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as siteController from '../controllers/siteController.js';
import validateRequest from '../middleware/validateRequest.js';
import { optionalNumber, optionalTrimmedString } from '../validation/primitives.js';

const router = Router();

const navigationChromeQuerySchema = z
  .object({
    includeFooter: optionalTrimmedString({ max: 5 })
      .refine((value) => value == null || ['true', 'false'].includes(value.toLowerCase()), {
        message: 'includeFooter must be true or false when provided.',
      })
      .transform((value) => value?.toLowerCase()),
  })
  .strip();

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

router.get('/settings', asyncHandler(siteController.settings));
router.get(
  '/navigation/chrome',
  validateRequest({ query: navigationChromeQuerySchema }),
  asyncHandler(siteController.navigationChrome),
);
router.get('/navigation', asyncHandler(siteController.navigation));
router.get('/pages', validateRequest({ query: sitePagesQuerySchema }), asyncHandler(siteController.index));
router.get(
  '/pages/:slug',
  validateRequest({ params: sitePageParamsSchema }),
  asyncHandler(siteController.show),
);

export default router;
