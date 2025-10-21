import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  workspace,
  createCampaignHandler,
  updateCampaignHandler,
  deleteCampaignHandler,
  createCreativeHandler,
  updateCreativeHandler,
  deleteCreativeHandler,
  createPlacementHandler,
  updatePlacementHandler,
  deletePlacementHandler,
  togglePlacementHandler,
} from '../controllers/companyAdsController.js';
import {
  workspaceQuerySchema,
  createCampaignBodySchema,
  updateCampaignBodySchema,
  createCreativeBodySchema,
  updateCreativeBodySchema,
  createPlacementBodySchema,
  updatePlacementBodySchema,
  campaignIdParamsSchema,
  creativeIdParamsSchema,
  placementIdParamsSchema,
} from '../validation/schemas/companyAdsSchemas.js';

const router = Router();

router.use(authenticateRequest());
router.use(requireRoles(['company', 'admin']));

router.get('/workspace', validateRequest({ query: workspaceQuerySchema }), asyncHandler(workspace));
router.post('/campaigns', validateRequest({ body: createCampaignBodySchema }), asyncHandler(createCampaignHandler));
router.put(
  '/campaigns/:campaignId',
  validateRequest({ params: campaignIdParamsSchema, body: updateCampaignBodySchema }),
  asyncHandler(updateCampaignHandler),
);
router.delete(
  '/campaigns/:campaignId',
  validateRequest({ params: campaignIdParamsSchema }),
  asyncHandler(deleteCampaignHandler),
);

router.post(
  '/campaigns/:campaignId/creatives',
  validateRequest({ params: campaignIdParamsSchema, body: createCreativeBodySchema }),
  asyncHandler(createCreativeHandler),
);
router.put(
  '/creatives/:creativeId',
  validateRequest({ params: creativeIdParamsSchema, body: updateCreativeBodySchema }),
  asyncHandler(updateCreativeHandler),
);
router.delete(
  '/creatives/:creativeId',
  validateRequest({ params: creativeIdParamsSchema }),
  asyncHandler(deleteCreativeHandler),
);

router.post(
  '/creatives/:creativeId/placements',
  validateRequest({ params: creativeIdParamsSchema, body: createPlacementBodySchema }),
  asyncHandler(createPlacementHandler),
);
router.put(
  '/placements/:placementId',
  validateRequest({ params: placementIdParamsSchema, body: updatePlacementBodySchema }),
  asyncHandler(updatePlacementHandler),
);
router.delete(
  '/placements/:placementId',
  validateRequest({ params: placementIdParamsSchema }),
  asyncHandler(deletePlacementHandler),
);
router.post(
  '/placements/:placementId/toggle',
  validateRequest({ params: placementIdParamsSchema }),
  asyncHandler(togglePlacementHandler),
);

export default router;
