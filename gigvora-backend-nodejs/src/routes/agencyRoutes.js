import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyAdController from '../controllers/agencyAdController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

const requireAgencyAdsAccess = authenticate({ roles: ['agency', 'agency_admin'], allowAdminOverride: true });

router.get('/ads/reference-data', requireAgencyAdsAccess, asyncHandler(agencyAdController.referenceData));
router.get('/ads/campaigns', requireAgencyAdsAccess, asyncHandler(agencyAdController.list));
router.post('/ads/campaigns', requireAgencyAdsAccess, asyncHandler(agencyAdController.create));
router.get('/ads/campaigns/:campaignId', requireAgencyAdsAccess, asyncHandler(agencyAdController.detail));
router.put('/ads/campaigns/:campaignId', requireAgencyAdsAccess, asyncHandler(agencyAdController.update));
router.post(
  '/ads/campaigns/:campaignId/creatives',
  requireAgencyAdsAccess,
  asyncHandler(agencyAdController.createCreative),
);
router.put('/ads/creatives/:creativeId', requireAgencyAdsAccess, asyncHandler(agencyAdController.updateCreative));
router.post(
  '/ads/campaigns/:campaignId/placements',
  requireAgencyAdsAccess,
  asyncHandler(agencyAdController.createPlacement),
);
router.put(
  '/ads/placements/:placementId',
  requireAgencyAdsAccess,
  asyncHandler(agencyAdController.updatePlacement),
);

export default router;

