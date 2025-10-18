import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';
import adminAdRoutes from './adminAdRoutes.js';
import adminAdSettingsRoutes from './adminAdSettingsRoutes.js';
import { requireAdmin } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminDashboardQuerySchema,
  affiliateSettingsBodySchema,
  gdprSettingsBodySchema,
  platformSettingsBodySchema,
  homepageSettingsBodySchema,
  seoSettingsBodySchema,
} from '../validation/schemas/adminSchemas.js';
import adminRuntimeRoutes from './adminRuntimeRoutes.js';
import adminConsentRoutes from './adminConsentRoutes.js';
import adminRbacRoutes from './adminRbacRoutes.js';
import adminPageSettingsRoutes from './adminPageSettingsRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import adminSiteManagementRoutes from './adminSiteManagementRoutes.js';
import adminAppearanceRoutes from './adminAppearanceRoutes.js';
import adminPolicyRoutes from './adminPolicyRoutes.js';
import adminApiRoutes from './adminApiRoutes.js';
import adminStorageRoutes from './adminStorageRoutes.js';
import adminEmailRoutes from './adminEmailRoutes.js';
import adminTwoFactorRoutes from './adminTwoFactorRoutes.js';
import adminDatabaseRoutes from './adminDatabaseRoutes.js';
import adminProfileRoutes from './adminProfileRoutes.js';

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
router.get('/homepage-settings', asyncHandler(adminController.fetchHomepageSettings));
router.put(
  '/homepage-settings',
  validateRequest({ body: homepageSettingsBodySchema }),
  asyncHandler(adminController.persistHomepageSettings),
);
router.get('/affiliate-settings', asyncHandler(adminController.fetchAffiliateSettings));
router.put(
  '/affiliate-settings',
  validateRequest({ body: affiliateSettingsBodySchema }),
  asyncHandler(adminController.persistAffiliateSettings),
);
router.get('/gdpr-settings', asyncHandler(adminController.fetchGdprSettings));
router.put(
  '/gdpr-settings',
  validateRequest({ body: gdprSettingsBodySchema }),
  asyncHandler(adminController.persistGdprSettings),
router.get('/seo-settings', asyncHandler(adminController.fetchSeoSettings));
router.put(
  '/seo-settings',
  validateRequest({ body: seoSettingsBodySchema }),
  asyncHandler(adminController.persistSeoSettings),
);

router.use('/ads/coupons', adminAdRoutes);
router.use('/ads/settings', adminAdSettingsRoutes);
router.use('/runtime', adminRuntimeRoutes);
router.use('/governance/consents', adminConsentRoutes);
router.use('/governance/rbac', adminRbacRoutes);
router.use('/page-settings', adminPageSettingsRoutes);
router.use('/users', adminUserRoutes);
router.use('/site-management', adminSiteManagementRoutes);
router.use('/appearance', adminAppearanceRoutes);
router.use('/governance/policies', adminPolicyRoutes);
router.use('/api', adminApiRoutes);
router.use('/storage', adminStorageRoutes);
router.use('/email', adminEmailRoutes);
router.use('/security/two-factor', adminTwoFactorRoutes);
router.use('/database-settings', adminDatabaseRoutes);
router.use('/profiles', adminProfileRoutes);

export default router;
