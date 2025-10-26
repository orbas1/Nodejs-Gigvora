import { Router } from 'express';

import adRoutes from './adRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import adminModerationRoutes from './adminModerationRoutes.js';
import adminComplianceRoutes from './adminComplianceRoutes.js';
import adminPlatformRoutes from './adminPlatformRoutes.js';
import agencyRoutes from './agencyRoutes.js';
import agencyJobManagementRoutes from './agencyJobManagementRoutes.js';
import agencyBlogRoutes from './agencyBlogRoutes.js';
import agencyWalletRoutes from './agencyWalletRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import authRoutes from './authRoutes.js';
import autoAssignRoutes from './autoAssignRoutes.js';
import blogAdminRoutes from './blogAdminRoutes.js';
import blogRoutes from './blogRoutes.js';
import clientPortalRoutes from './clientPortalRoutes.js';
import collaborationRoutes from './collaborationRoutes.js';
import companyRoutes from './companyRoutes.js';
import creationStudioRoutes from './creationStudioRoutes.js';
import companyJobRoutes from './companyJobRoutes.js';
import companyLaunchpadRoutes from './companyLaunchpadRoutes.js';
import companyAdsRoutes from './companyAdsRoutes.js';
import companyOrdersRoutes from './companyOrdersRoutes.js';
import companyVolunteeringRoutes from './companyVolunteeringRoutes.js';
import companyIntegrationRoutes from './companyIntegrationRoutes.js';
import complianceRoutes from './complianceRoutes.js';
import connectionRoutes from './connectionRoutes.js';
import deliverableVaultRoutes from './deliverableVaultRoutes.js';
import discoveryRoutes from './discoveryRoutes.js';
import companyIdentityVerificationRoutes from './companyIdentityVerificationRoutes.js';
import feedRoutes from './feedRoutes.js';
import financeRoutes from './financeRoutes.js';
import freelancerRoutes from './freelancerRoutes.js';
import domainRoutes from './domainRoutes.js';
import groupRoutes from './groupRoutes.js';
import headhunterRoutes from './headhunterRoutes.js';
import interviewRoutes from './interviewRoutes.js';
import launchpadRoutes from './launchpadRoutes.js';
import learningHubRoutes from './learningHubRoutes.js';
import mentorshipRoutes from './mentorshipRoutes.js';
import messagingRoutes from './messagingRoutes.js';
import networkingRoutes from './networkingRoutes.js';
import pipelineRoutes from './pipelineRoutes.js';
import jobApplicationRoutes from './jobApplicationRoutes.js';
import projectGigManagementRoutes from './projectGigManagementRoutes.js';
import projectWorkspaceRoutes from './projectWorkspaceRoutes.js';
import projectRoutes from './projectRoutes.js';
import reputationRoutes from './reputationRoutes.js';
import searchRoutes from './searchRoutes.js';
import explorerRoutes from './explorerRoutes.js';
import trustRoutes from './trustRoutes.js';
import userRoutes from './userRoutes.js';
import userMentoringRoutes from './userMentoringRoutes.js';
import workspaceTemplateRoutes from './workspaceTemplateRoutes.js';
import workManagementRoutes from './workManagementRoutes.js';
import runtimeRoutes from './runtimeRoutes.js';
import docsRoutes from './docsRoutes.js';
import eventManagementRoutes from './eventManagementRoutes.js';
import supportRoutes from './supportRoutes.js';
import siteRoutes from './siteRoutes.js';
import communityEventsRoutes from './communityEventsRoutes.js';
import routeRegistryRoutes from './routeRegistryRoutes.js';
import formBlueprintRoutes from './formBlueprintRoutes.js';
import presenceRoutes from './presenceRoutes.js';
import onboardingRoutes from './onboardingRoutes.js';

const router = Router();

const routeDefinitions = [
  ['/ads', adRoutes],
  ['/admin/blog', blogAdminRoutes],
  ['/admin/moderation', adminModerationRoutes],
  ['/admin/compliance', adminComplianceRoutes],
  ['/admin/platform', adminPlatformRoutes],
  ['/admin', adminRoutes],
  ['/agency/job-management', agencyJobManagementRoutes],
  ['/agency/wallet', agencyWalletRoutes],
  ['/agency/blog', agencyBlogRoutes],
  ['/agency', agencyRoutes],
  ['/analytics', analyticsRoutes],
  ['/auth', authRoutes],
  ['/auto-assign', autoAssignRoutes],
  ['/blog', blogRoutes],
  ['/client-portals', clientPortalRoutes],
  ['/collaboration', collaborationRoutes],
  ['/presence', presenceRoutes],
  ['/onboarding', onboardingRoutes],
  ['/company/creation-studio', creationStudioRoutes],
  ['/company/id-verifications', companyIdentityVerificationRoutes],
  ['/company/integrations', companyIntegrationRoutes],
  ['/company/jobs', companyJobRoutes],
  ['/company/launchpad', companyLaunchpadRoutes],
  ['/company/ads', companyAdsRoutes],
  ['/company/orders', companyOrdersRoutes],
  ['/company/volunteering', companyVolunteeringRoutes],
  ['/company', companyRoutes],
  ['/community', communityEventsRoutes],
  ['/compliance', complianceRoutes],
  ['/connections', connectionRoutes],
  ['/creation-studio', creationStudioRoutes],
  ['/deliverable-vault', deliverableVaultRoutes],
  ['/discovery', discoveryRoutes],
  ['/domains', domainRoutes],
  ['/docs', docsRoutes],
  ['/feed', feedRoutes],
  ['/finance', financeRoutes],
  ['/freelancer', freelancerRoutes],
  ['/freelancers', freelancerRoutes],
  ['/forms/blueprints', formBlueprintRoutes],
  ['/groups', groupRoutes],
  ['/headhunter', headhunterRoutes],
  ['/interviews', interviewRoutes],
  ['/job-applications', jobApplicationRoutes],
  ['/launchpad', launchpadRoutes],
  ['/learning-hub', learningHubRoutes],
  ['/mentors', mentorshipRoutes],
  ['/messaging', messagingRoutes],
  ['/networking', networkingRoutes],
  ['/pipeline', pipelineRoutes],
  ['/projects/:projectId/work-management', workManagementRoutes],
  ['/projects', projectRoutes],
  ['/reputation', reputationRoutes],
  ['/runtime', runtimeRoutes],
  ['/explorer', explorerRoutes],
  ['/search', searchRoutes],
  ['/support', supportRoutes],
  ['/trust', trustRoutes],
  ['/route-registry', routeRegistryRoutes],
  ['/site', siteRoutes],
  ['/users/:userId/mentoring', userMentoringRoutes],
  ['/users/:userId/project-gig-management', projectGigManagementRoutes],
  ['/users/:userId/project-workspace', projectWorkspaceRoutes],
  ['/users/:userId/events', eventManagementRoutes],
  ['/users', userRoutes],
  ['/workspace-templates', workspaceTemplateRoutes],
];

routeDefinitions.forEach(([path, handler]) => {
  router.use(path, handler);
});

export default router;
