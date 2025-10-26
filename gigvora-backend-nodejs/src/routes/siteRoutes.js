import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as siteController from '../controllers/siteController.js';
import validateRequest from '../middleware/validateRequest.js';
import { optionalNumber, optionalTrimmedString } from '../validation/primitives.js';

const router = Router();

const trimmedRoleSchema = z.string().trim().min(1).max(255);

const siteNavigationQuerySchema = z
  .object({
    menuKey: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    format: optionalTrimmedString({ max: 12 })
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => value === undefined || value === 'flat' || value === 'tree', {
        message: 'format must be either "flat" or "tree".',
      }),
    roles: z.union([trimmedRoleSchema, z.array(trimmedRoleSchema)]).optional(),
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
  '/navigation',
  validateRequest({ query: siteNavigationQuerySchema }),
  asyncHandler(siteController.navigation),
);
router.get('/pages', validateRequest({ query: sitePagesQuerySchema }), asyncHandler(siteController.index));
router.get(
  '/pages/:slug',
  validateRequest({ params: sitePageParamsSchema }),
  asyncHandler(siteController.show),
);

export default router;
