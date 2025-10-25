import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/routeRegistryController.js';
import validateRequest from '../middleware/validateRequest.js';
import { optionalTrimmedString } from '../validation/primitives.js';

const router = Router();

const routeIdParamsSchema = z
  .object({
    routeId: optionalTrimmedString({ max: 180 })
      .refine((value) => value != null, { message: 'routeId is required.' })
      .transform((value) => value ?? undefined),
  })
  .transform((value) => ({ routeId: value.routeId }))
  .strip();

router.get('/', asyncHandler(controller.index));
router.post('/sync', asyncHandler(controller.sync));
router.get('/:routeId', validateRequest({ params: routeIdParamsSchema }), asyncHandler(controller.show));

export default router;
