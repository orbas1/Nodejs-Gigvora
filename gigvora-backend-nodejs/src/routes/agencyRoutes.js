import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyAdController from '../controllers/agencyAdController.js';
import agencyCalendarController from '../controllers/agencyCalendarController.js';
import creationStudioRoutes from './agencyCreationRoutes.js';
import agencyMentoringController from '../controllers/agencyMentoringController.js';
import agencyProjectManagementController from '../controllers/agencyProjectManagementController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  agencyProfileQuerySchema,
  listFollowersQuerySchema,
  updateAgencyProfileSchema,
  updateAgencyAvatarSchema,
  followerParamsSchema,
  updateFollowerBodySchema,
  connectionParamsSchema,
  requestConnectionBodySchema,
  respondConnectionBodySchema,
} from '../validation/schemas/agencySchemas.js';
  createProjectBodySchema,
  updateProjectBodySchema,
  autoMatchSettingsBodySchema,
  autoMatchFreelancerBodySchema,
  autoMatchFreelancerUpdateBodySchema,
  projectIdParamsSchema,
  autoMatchFreelancerParamsSchema,
} from '../validation/schemas/agencyProjectManagementSchemas.js';
import agencyTimelineRoutes from './agencyTimelineRoutes.js';
import agencyEscrowController from '../controllers/agencyEscrowController.js';
import agencyIntegrationController from '../controllers/agencyIntegrationController.js';
import agencyAiController from '../controllers/agencyAiController.js';
import agencyWorkforceController from '../controllers/agencyWorkforceController.js';
import agencyClientKanbanController from '../controllers/agencyClientKanbanController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  availabilityIdParamsSchema,
  createAvailabilityBodySchema,
  createCapacitySnapshotBodySchema,
  createGigDelegationBodySchema,
  createMemberBodySchema,
  createPayDelegationBodySchema,
  createProjectDelegationBodySchema,
  listAvailabilityQuerySchema,
  listCapacitySnapshotsQuerySchema,
  listGigDelegationsQuerySchema,
  listMembersQuerySchema,
  listPayDelegationsQuerySchema,
  listProjectDelegationsQuerySchema,
  memberIdParamsSchema,
  payDelegationIdParamsSchema,
  projectDelegationIdParamsSchema,
  gigDelegationIdParamsSchema,
  capacitySnapshotIdParamsSchema,
  updateAvailabilityBodySchema,
  updateCapacitySnapshotBodySchema,
  updateGigDelegationBodySchema,
  updateMemberBodySchema,
  updatePayDelegationBodySchema,
  updateProjectDelegationBodySchema,
  workforceDashboardQuerySchema,
} from '../validation/schemas/agencyWorkforceSchemas.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/dashboard/overview',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.overview),
);

router.put(
  '/dashboard/overview',
  authenticate(),
  requireRoles('agency_admin', 'admin'),
  asyncHandler(agencyController.updateOverview),
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: agencyProfileQuerySchema }),
  asyncHandler(agencyController.getProfile),
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
router.get(
  '/calendar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.index),
);

router.get(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.show),
);

router.post(
  '/calendar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.store),
);

router.put(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.update),
);

router.delete(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.destroy),
router.use('/creation-studio', creationStudioRoutes);
router.get(
  '/mentoring/overview',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.overview),
);

router.get(
  '/mentoring/sessions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsList),
);

router.post(
  '/mentoring/sessions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsCreate),
);

router.patch(
  '/mentoring/sessions/:sessionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsUpdate),
);

router.delete(
  '/mentoring/sessions/:sessionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.sessionsDelete),
);

router.get(
  '/mentoring/purchases',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesList),
);

router.post(
  '/mentoring/purchases',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesCreate),
);

router.patch(
  '/mentoring/purchases/:purchaseId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.purchasesUpdate),
);

router.get(
  '/mentoring/favourites',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesList),
);

router.post(
  '/mentoring/favourites',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesCreate),
);

router.patch(
  '/mentoring/favourites/:preferenceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesUpdate),
);

router.delete(
  '/mentoring/favourites/:preferenceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.favouritesDelete),
);

router.get(
  '/mentoring/suggestions',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyMentoringController.suggestionsList),
  '/project-management',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyProjectManagementController.getProjectManagement),
);

router.post(
  '/project-management/projects',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.createProject),
);

router.put(
  '/project-management/projects/:projectId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.updateProject),
);

router.put(
  '/project-management/projects/:projectId/automatch-settings',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: autoMatchSettingsBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchSettings),
);

router.post(
  '/project-management/projects/:projectId/automatch/freelancers',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: autoMatchFreelancerBodySchema }),
  asyncHandler(agencyProjectManagementController.addOrUpdateAutoMatchFreelancer),
);

router.put(
  '/project-management/projects/:projectId/automatch/freelancers/:freelancerEntryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: autoMatchFreelancerParamsSchema, body: autoMatchFreelancerUpdateBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchFreelancer),
router.use('/timeline', agencyTimelineRoutes);
router.use(authenticate(), requireRoles('agency', 'agency_admin', 'admin'));

router.get('/escrow/overview', asyncHandler(agencyEscrowController.fetchOverview));
router.get('/escrow/accounts', asyncHandler(agencyEscrowController.fetchAccounts));
router.post('/escrow/accounts', asyncHandler(agencyEscrowController.createAccount));
router.patch('/escrow/accounts/:accountId', asyncHandler(agencyEscrowController.updateAccount));

router.get('/escrow/transactions', asyncHandler(agencyEscrowController.fetchTransactions));
router.post('/escrow/transactions', asyncHandler(agencyEscrowController.createTransaction));
router.patch('/escrow/transactions/:transactionId', asyncHandler(agencyEscrowController.updateTransaction));
router.post('/escrow/transactions/:transactionId/release', asyncHandler(agencyEscrowController.releaseTransaction));
router.post('/escrow/transactions/:transactionId/refund', asyncHandler(agencyEscrowController.refundTransaction));

router.patch('/escrow/settings', asyncHandler(agencyEscrowController.updateSettings));
router.get(
  '/integrations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.index),
);

router.post(
  '/integrations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.create),
);

router.patch(
  '/integrations/:integrationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.update),
);

router.post(
  '/integrations/:integrationId/secrets',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.rotateCredential),
);

router.post(
  '/integrations/:integrationId/webhooks',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.createWebhookEndpoint),
);

router.patch(
  '/integrations/:integrationId/webhooks/:webhookId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.updateWebhookEndpoint),
);

router.delete(
  '/integrations/:integrationId/webhooks/:webhookId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.deleteWebhookEndpoint),
);

router.post(
  '/integrations/:integrationId/test',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.testConnection),
  '/ai-control',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyAiController.fetchControlPanel),
);

router.put(
  '/ai-control',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyAiController.updateControlPanel),
);

router.post(
  '/ai-control/templates',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyAiController.createTemplate),
);

router.put(
  '/ai-control/templates/:templateId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyAiController.updateTemplate),
);

router.delete(
  '/ai-control/templates/:templateId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyAiController.destroyTemplate),
  '/workforce/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: workforceDashboardQuerySchema }),
  asyncHandler(agencyWorkforceController.dashboard),
);

router.get(
  '/workforce/members',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listMembersQuerySchema }),
  asyncHandler(agencyWorkforceController.indexMembers),
);

router.post(
  '/workforce/members',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createMemberBodySchema }),
  asyncHandler(agencyWorkforceController.storeMember),
);

router.put(
  '/workforce/members/:memberId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: memberIdParamsSchema, body: updateMemberBodySchema }),
  asyncHandler(agencyWorkforceController.updateMember),
);

router.delete(
  '/workforce/members/:memberId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: memberIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyMember),
);

router.get(
  '/workforce/pay-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listPayDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexPayDelegations),
);

router.post(
  '/workforce/pay-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createPayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storePayDelegation),
);

router.put(
  '/workforce/pay-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: payDelegationIdParamsSchema, body: updatePayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updatePayDelegationRecord),
);

router.delete(
  '/workforce/pay-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: payDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyPayDelegation),
);

router.get(
  '/workforce/project-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listProjectDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexProjectDelegations),
);

router.post(
  '/workforce/project-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeProjectDelegation),
);

router.put(
  '/workforce/project-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectDelegationIdParamsSchema, body: updateProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateProjectDelegationRecord),
);

router.delete(
  '/workforce/project-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyProjectDelegation),
);

router.get(
  '/workforce/gig-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listGigDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexGigDelegations),
);

router.post(
  '/workforce/gig-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeGigDelegation),
);

router.put(
  '/workforce/gig-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: gigDelegationIdParamsSchema, body: updateGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateGigDelegationRecord),
);

router.delete(
  '/workforce/gig-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: gigDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyGigDelegation),
);

router.get(
  '/workforce/capacity-snapshots',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listCapacitySnapshotsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexCapacitySnapshots),
);

router.post(
  '/workforce/capacity-snapshots',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.storeCapacitySnapshot),
);

router.put(
  '/workforce/capacity-snapshots/:snapshotId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: capacitySnapshotIdParamsSchema, body: updateCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.updateCapacitySnapshotRecord),
);

router.delete(
  '/workforce/capacity-snapshots/:snapshotId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: capacitySnapshotIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyCapacitySnapshot),
);

router.get(
  '/workforce/availability',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listAvailabilityQuerySchema }),
  asyncHandler(agencyWorkforceController.indexAvailabilityEntries),
);

router.post(
  '/workforce/availability',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.storeAvailabilityEntry),
);

router.put(
  '/workforce/availability/:entryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: availabilityIdParamsSchema, body: updateAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.updateAvailabilityEntryRecord),
);

router.delete(
  '/workforce/availability/:entryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: availabilityIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyAvailabilityEntry),
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.profile),
);

router.put(
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: updateAgencyProfileSchema }),
  asyncHandler(agencyController.updateProfile),
);

router.put(
  '/profile/avatar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: updateAgencyAvatarSchema }),
  asyncHandler(agencyController.updateAvatar),
);

router.get(
  '/profile/followers',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listFollowersQuerySchema }),
  asyncHandler(agencyController.listFollowers),
);

router.patch(
  '/profile/followers/:followerId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: followerParamsSchema, body: updateFollowerBodySchema }),
  asyncHandler(agencyController.updateFollower),
);

router.delete(
  '/profile/followers/:followerId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: followerParamsSchema }),
  asyncHandler(agencyController.removeFollower),
);

router.get(
  '/profile/connections',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.listConnections),
);

router.post(
  '/profile/connections',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: requestConnectionBodySchema }),
  asyncHandler(agencyController.requestConnection),
);

router.post(
  '/profile/connections/:connectionId/respond',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: connectionParamsSchema, body: respondConnectionBodySchema }),
  asyncHandler(agencyController.respondToConnection),
);

router.delete(
  '/profile/connections/:connectionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: connectionParamsSchema }),
  asyncHandler(agencyController.removeConnection),
  asyncHandler(agencyController.updateProfile),
);

router.post(
  '/profile/media',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createMedia),
);

router.put(
  '/profile/media/:mediaId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateMedia),
);

router.delete(
  '/profile/media/:mediaId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteMedia),
);

router.post(
  '/profile/skills',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createSkill),
);

router.put(
  '/profile/skills/:skillId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateSkill),
);

router.delete(
  '/profile/skills/:skillId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteSkill),
);

router.post(
  '/profile/credentials',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createCredential),
);

router.put(
  '/profile/credentials/:credentialId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateCredential),
);

router.delete(
  '/profile/credentials/:credentialId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteCredential),
);

router.post(
  '/profile/experiences',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createExperience),
);

router.put(
  '/profile/experiences/:experienceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateExperience),
);

router.delete(
  '/profile/experiences/:experienceId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteExperience),
);

router.post(
  '/profile/workforce',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.createWorkforceSegment),
);

router.put(
  '/profile/workforce/:segmentId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.updateWorkforceSegment),
);

router.delete(
  '/profile/workforce/:segmentId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.deleteWorkforceSegment),
  '/client-kanban',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.index),
);

router.post(
  '/client-kanban/columns',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeColumn),
);

router.patch(
  '/client-kanban/columns/:columnId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateColumnController),
);

router.delete(
  '/client-kanban/columns/:columnId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyColumn),
);

router.post(
  '/client-kanban/cards',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeCard),
);

router.patch(
  '/client-kanban/cards/:cardId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateCardController),
);

router.post(
  '/client-kanban/cards/:cardId/move',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.moveCardController),
);

router.delete(
  '/client-kanban/cards/:cardId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyCard),
);

router.post(
  '/client-kanban/cards/:cardId/checklist',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeChecklistItem),
);

router.patch(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateChecklistItemController),
);

router.delete(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyChecklistItem),
);

router.post(
  '/client-kanban/clients',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeClient),
);

router.patch(
  '/client-kanban/clients/:clientId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateClientController),
);

export default router;

