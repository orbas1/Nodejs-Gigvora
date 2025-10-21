import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  dashboard,
  createLink,
  updateLink,
  removeLink,
  createPlacementEntry,
  updatePlacementEntry,
  removePlacementEntry,
} from '../controllers/companyLaunchpadController.js';
import {
  dashboardQuerySchema,
  createLinkBodySchema,
  updateLinkBodySchema,
  createPlacementBodySchema,
  updatePlacementBodySchema,
  linkIdParamsSchema,
  placementIdParamsSchema,
} from '../validation/schemas/companyLaunchpadSchemas.js';

const router = Router();

router.use(authenticateRequest());
router.use(requireRoles(['company', 'admin']));

router.get('/jobs', validateRequest({ query: dashboardQuerySchema }), asyncHandler(dashboard));
router.post('/jobs', validateRequest({ body: createLinkBodySchema }), asyncHandler(createLink));
router.put(
  '/jobs/:linkId',
  validateRequest({ params: linkIdParamsSchema, body: updateLinkBodySchema }),
  asyncHandler(updateLink),
);
router.delete(
  '/jobs/:linkId',
  validateRequest({ params: linkIdParamsSchema }),
  asyncHandler(removeLink),
);

router.post(
  '/jobs/:linkId/placements',
  validateRequest({ params: linkIdParamsSchema, body: createPlacementBodySchema }),
  asyncHandler(createPlacementEntry),
);

router.put(
  '/placements/:placementId',
  validateRequest({ params: placementIdParamsSchema, body: updatePlacementBodySchema }),
  asyncHandler(updatePlacementEntry),
);

router.delete(
  '/placements/:placementId',
  validateRequest({ params: placementIdParamsSchema }),
  asyncHandler(removePlacementEntry),
);

export default router;

