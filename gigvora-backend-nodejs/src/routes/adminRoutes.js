import { Router } from 'express';

import * as adminController from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  adminDashboardQuerySchema,
  adminOverviewUpdateSchema,
  affiliateSettingsBodySchema,
  gdprSettingsBodySchema,
  homepageSettingsBodySchema,
  platformSettingsAuditQuerySchema,
  platformSettingsBodySchema,
  platformSettingsWatcherBodySchema,
  platformSettingsWatcherParamsSchema,
  platformSettingsWatcherQuerySchema,
  platformSettingsWatcherUpdateSchema,
  seoConsoleGenerateSitemapBodySchema,
  seoConsoleListJobsQuerySchema,
  seoConsoleSubmitJobBodySchema,
  seoConsoleSubmitJobParamsSchema,
  seoConsoleSchemaTemplatesQuerySchema,
  seoSettingsBodySchema,
  systemSettingsBodySchema,
} from '../validation/schemas/adminSchemas.js';

import adminAdRoutes from './adminAdRoutes.js';
import adminAdSettingsRoutes from './adminAdSettingsRoutes.js';
import adminAgencyManagementRoutes from './adminAgencyManagementRoutes.js';
import adminApiRoutes from './adminApiRoutes.js';
import adminAppearanceRoutes from './adminAppearanceRoutes.js';
import adminCalendarRoutes from './adminCalendarRoutes.js';
import adminCompanyManagementRoutes from './adminCompanyManagementRoutes.js';
import adminConsentRoutes from './adminConsentRoutes.js';
import adminContentGovernanceRoutes from './adminContentGovernanceRoutes.js';
import adminDatabaseRoutes from './adminDatabaseRoutes.js';
import adminEmailRoutes from './adminEmailRoutes.js';
import adminEscrowRoutes from './adminEscrowRoutes.js';
import adminFinanceRoutes from './adminFinanceRoutes.js';
import adminIdentityVerificationRoutes from './adminIdentityVerificationRoutes.js';
import adminJobApplicationRoutes from './adminJobApplicationRoutes.js';
import adminJobPostRoutes from './adminJobPostRoutes.js';
import adminMentoringRoutes from './adminMentoringRoutes.js';
import adminMessagingRoutes from './adminMessagingRoutes.js';
import adminPageSettingsRoutes from './adminPageSettingsRoutes.js';
import adminPolicyRoutes from './adminPolicyRoutes.js';
import adminGovernanceController from '../controllers/adminGovernanceController.js';
import { governanceOverviewQuerySchema } from '../validation/schemas/adminGovernanceSchemas.js';
import adminProfileRoutes from './adminProfileRoutes.js';
import adminProjectManagementRoutes from './adminProjectManagementRoutes.js';
import adminMonitoringRoutes from './adminMonitoringRoutes.js';
import adminRbacRoutes from './adminRbacRoutes.js';
import adminRuntimeRoutes from './adminRuntimeRoutes.js';
import adminSiteManagementRoutes from './adminSiteManagementRoutes.js';
import adminSpeedNetworkingRoutes from './adminSpeedNetworkingRoutes.js';
import adminStorageRoutes from './adminStorageRoutes.js';
import adminTimelineRoutes from './adminTimelineRoutes.js';
import adminTwoFactorRoutes from './adminTwoFactorRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import adminVolunteeringRoutes from './adminVolunteeringRoutes.js';
import adminWalletRoutes from './adminWalletRoutes.js';

const adminRoutes = Router();

adminRoutes.use(requireAdmin);

adminRoutes.get(
  '/dashboard',
  validateRequest({ query: adminDashboardQuerySchema }),
  asyncHandler(adminController.dashboard),
);
adminRoutes.put(
  '/dashboard/overview',
  validateRequest({ body: adminOverviewUpdateSchema }),
  asyncHandler(adminController.persistAdminOverview),
);
adminRoutes.get('/runtime/health', asyncHandler(adminController.runtimeHealth));
adminRoutes.get('/platform-settings', asyncHandler(adminController.fetchPlatformSettings));
adminRoutes.get(
  '/platform-settings/audit-events',
  validateRequest({ query: platformSettingsAuditQuerySchema }),
  asyncHandler(adminController.listPlatformSettingsAuditTrail),
);
adminRoutes.get(
  '/platform-settings/watchers',
  validateRequest({ query: platformSettingsWatcherQuerySchema }),
  asyncHandler(adminController.listPlatformSettingsWatchersController),
);
adminRoutes.post(
  '/platform-settings/watchers',
  validateRequest({ body: platformSettingsWatcherBodySchema }),
  asyncHandler(adminController.createPlatformSettingsWatcherController),
);
adminRoutes.patch(
  '/platform-settings/watchers/:watcherId',
  validateRequest({
    params: platformSettingsWatcherParamsSchema,
    body: platformSettingsWatcherUpdateSchema,
  }),
  asyncHandler(adminController.updatePlatformSettingsWatcherController),
);
adminRoutes.delete(
  '/platform-settings/watchers/:watcherId',
  validateRequest({ params: platformSettingsWatcherParamsSchema }),
  asyncHandler(adminController.removePlatformSettingsWatcher),
);
adminRoutes.put(
  '/platform-settings',
  validateRequest({ body: platformSettingsBodySchema }),
  asyncHandler(adminController.persistPlatformSettings),
);
adminRoutes.get('/homepage-settings', asyncHandler(adminController.fetchHomepageSettings));
adminRoutes.put(
  '/homepage-settings',
  validateRequest({ body: homepageSettingsBodySchema }),
  asyncHandler(adminController.persistHomepageSettings),
);
adminRoutes.get('/affiliate-settings', asyncHandler(adminController.fetchAffiliateSettings));
adminRoutes.put(
  '/affiliate-settings',
  validateRequest({ body: affiliateSettingsBodySchema }),
  asyncHandler(adminController.persistAffiliateSettings),
);
adminRoutes.get('/system-settings', asyncHandler(adminController.fetchSystemSettings));
adminRoutes.put(
  '/system-settings',
  validateRequest({ body: systemSettingsBodySchema }),
  asyncHandler(adminController.persistSystemSettings),
);
adminRoutes.get('/gdpr-settings', asyncHandler(adminController.fetchGdprSettings));
adminRoutes.put(
  '/gdpr-settings',
  validateRequest({ body: gdprSettingsBodySchema }),
  asyncHandler(adminController.persistGdprSettings),
);
adminRoutes.get('/seo-settings', asyncHandler(adminController.fetchSeoSettings));
adminRoutes.put(
  '/seo-settings',
  validateRequest({ body: seoSettingsBodySchema }),
  asyncHandler(adminController.persistSeoSettings),
);
adminRoutes.get(
  '/seo/console/snapshot',
  asyncHandler(adminController.fetchSeoConsoleSnapshotController),
);
adminRoutes.post(
  '/seo/console/sitemap',
  validateRequest({ body: seoConsoleGenerateSitemapBodySchema }),
  asyncHandler(adminController.generateSeoConsoleSitemap),
);
adminRoutes.get(
  '/seo/console/sitemap/jobs',
  validateRequest({ query: seoConsoleListJobsQuerySchema }),
  asyncHandler(adminController.listSeoConsoleSitemapJobs),
);
adminRoutes.post(
  '/seo/console/sitemap/jobs/:jobId/submit',
  validateRequest({
    params: seoConsoleSubmitJobParamsSchema,
    body: seoConsoleSubmitJobBodySchema,
  }),
  asyncHandler(adminController.submitSeoConsoleSitemapJob),
);
adminRoutes.get(
  '/seo/console/schema-templates',
  validateRequest({ query: seoConsoleSchemaTemplatesQuerySchema }),
  asyncHandler(adminController.listSeoConsoleSchemaTemplates),
);
adminRoutes.get('/seo/console/meta-templates', asyncHandler(adminController.listSeoConsoleMetaTemplates));

adminRoutes.use('/ads/coupons', adminAdRoutes);
adminRoutes.use('/ads/settings', adminAdSettingsRoutes);
adminRoutes.use('/runtime', adminRuntimeRoutes);
adminRoutes.get(
  '/governance/overview',
  validateRequest({ query: governanceOverviewQuerySchema }),
  asyncHandler(adminGovernanceController.overview),
);
adminRoutes.use('/governance/consents', adminConsentRoutes);
adminRoutes.use('/governance/content', adminContentGovernanceRoutes);
adminRoutes.use('/governance/rbac', adminRbacRoutes);
adminRoutes.use('/finance', adminFinanceRoutes);
adminRoutes.use('/volunteering', adminVolunteeringRoutes);
adminRoutes.use('/mentoring', adminMentoringRoutes);
adminRoutes.use('/speed-networking', adminSpeedNetworkingRoutes);
adminRoutes.use('/project-management', adminProjectManagementRoutes);
adminRoutes.use('/messaging', adminMessagingRoutes);
adminRoutes.use('/monitoring', adminMonitoringRoutes);
adminRoutes.use('/jobs', adminJobPostRoutes);
adminRoutes.use('/job-applications', adminJobApplicationRoutes);
adminRoutes.use('/calendar', adminCalendarRoutes);
adminRoutes.use('/verification/identity', adminIdentityVerificationRoutes);
adminRoutes.use('/timelines', adminTimelineRoutes);
adminRoutes.use('/wallets', adminWalletRoutes);
adminRoutes.use('/finance/escrow', adminEscrowRoutes);
adminRoutes.use('/page-settings', adminPageSettingsRoutes);
adminRoutes.use('/users', adminUserRoutes);
adminRoutes.use('/site-management', adminSiteManagementRoutes);
adminRoutes.use('/appearance', adminAppearanceRoutes);
adminRoutes.use('/governance/policies', adminPolicyRoutes);
adminRoutes.use('/api', adminApiRoutes);
adminRoutes.use('/storage', adminStorageRoutes);
adminRoutes.use('/email', adminEmailRoutes);
adminRoutes.use('/security/two-factor', adminTwoFactorRoutes);
adminRoutes.use('/database-settings', adminDatabaseRoutes);
adminRoutes.use('/profiles', adminProfileRoutes);
adminRoutes.use('/agencies', adminAgencyManagementRoutes);
adminRoutes.use('/companies', adminCompanyManagementRoutes);

export { adminRoutes };
