import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';
import adminAdRoutes from './adminAdRoutes.js';
import { requireAdmin } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminDashboardQuerySchema,
  affiliateSettingsBodySchema,
  platformSettingsBodySchema,
} from '../validation/schemas/adminSchemas.js';
import adminRuntimeRoutes from './adminRuntimeRoutes.js';
import adminConsentRoutes from './adminConsentRoutes.js';
import adminRbacRoutes from './adminRbacRoutes.js';
import adminStorageRoutes from './adminStorageRoutes.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/dashboard',
  validateRequest({ query: adminDashboardQuerySchema }),
  asyncHandler(adminController.dashboard),
);
router.get('/runtime/health', asyncHandler(adminController.runtimeHealth));
router.get('/platform-settings', asyncHandler(adminController.fetchPlatformSettings));
router.put(
  '/platform-settings',
  validateRequest({ body: platformSettingsBodySchema }),
  asyncHandler(adminController.persistPlatformSettings),
);
router.get('/affiliate-settings', asyncHandler(adminController.fetchAffiliateSettings));
router.put(
  '/affiliate-settings',
  validateRequest({ body: affiliateSettingsBodySchema }),
  asyncHandler(adminController.persistAffiliateSettings),
);

router.use('/ads/coupons', adminAdRoutes);
router.use('/runtime', adminRuntimeRoutes);
router.use('/governance/consents', adminConsentRoutes);
router.use('/governance/rbac', adminRbacRoutes);
router.use('/storage', adminStorageRoutes);

export default router;
