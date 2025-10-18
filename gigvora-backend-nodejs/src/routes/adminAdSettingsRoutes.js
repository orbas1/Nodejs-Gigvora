import { Router } from 'express';

import * as adminAdSettingsController from '../controllers/adminAdSettingsController.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  adminAdsSurfaceBodySchema,
  adminAdsCampaignBodySchema,
  adminAdsCampaignCreateSchema,
  adminAdsCreativeBodySchema,
  adminAdsCreativeCreateSchema,
  adminAdsPlacementBodySchema,
  adminAdsPlacementCreateSchema,
} from '../validation/schemas/adminAdSettingsSchemas.js';

const router = Router();

router.get('/', asyncHandler(adminAdSettingsController.snapshot));
router.put(
  '/surfaces/:surface',
  validateRequest({ body: adminAdsSurfaceBodySchema }),
  asyncHandler(adminAdSettingsController.saveSurface),
);
router.post(
  '/campaigns',
  validateRequest({ body: adminAdsCampaignCreateSchema }),
  asyncHandler(adminAdSettingsController.storeCampaign),
);
router.put(
  '/campaigns/:campaignId',
  validateRequest({ body: adminAdsCampaignBodySchema }),
  asyncHandler(adminAdSettingsController.updateCampaignRecord),
);
router.delete('/campaigns/:campaignId', asyncHandler(adminAdSettingsController.destroyCampaign));
router.post(
  '/creatives',
  validateRequest({ body: adminAdsCreativeCreateSchema }),
  asyncHandler(adminAdSettingsController.storeCreative),
);
router.put(
  '/creatives/:creativeId',
  validateRequest({ body: adminAdsCreativeBodySchema }),
  asyncHandler(adminAdSettingsController.updateCreativeRecord),
);
router.delete('/creatives/:creativeId', asyncHandler(adminAdSettingsController.destroyCreative));
router.post(
  '/placements',
  validateRequest({ body: adminAdsPlacementCreateSchema }),
  asyncHandler(adminAdSettingsController.storePlacement),
);
router.put(
  '/placements/:placementId',
  validateRequest({ body: adminAdsPlacementBodySchema }),
  asyncHandler(adminAdSettingsController.updatePlacementRecord),
);
router.delete('/placements/:placementId', asyncHandler(adminAdSettingsController.destroyPlacement));

export default router;
