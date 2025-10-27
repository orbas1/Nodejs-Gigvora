import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyAdController from '../controllers/agencyAdController.js';
import agencyCalendarController from '../controllers/agencyCalendarController.js';
import agencyMentoringController from '../controllers/agencyMentoringController.js';
import agencyProjectManagementController from '../controllers/agencyProjectManagementController.js';
import agencyEscrowController from '../controllers/agencyEscrowController.js';
import agencyIntegrationController from '../controllers/agencyIntegrationController.js';
import agencyAiController from '../controllers/agencyAiController.js';
import agencyWorkforceController from '../controllers/agencyWorkforceController.js';
import agencyClientKanbanController from '../controllers/agencyClientKanbanController.js';
import creationStudioRoutes from './agencyCreationRoutes.js';
import agencyNetworkingRoutes from './agencyNetworkingRoutes.js';
import agencyTimelineRoutes from './agencyTimelineRoutes.js';
import agencyJobManagementRoutes from './agencyJobManagementRoutes.js';
import agencyWalletRoutes from './agencyWalletRoutes.js';
import agencyBlogRoutes from './agencyBlogRoutes.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  agencyProfileQuerySchema,
  listFollowersQuerySchema,
  followerParamsSchema,
  updateFollowerBodySchema,
  connectionParamsSchema,
  requestConnectionBodySchema,
  respondConnectionBodySchema,
} from '../validation/schemas/agencySchemas.js';
import {
  createProjectBodySchema,
  updateProjectBodySchema,
  autoMatchSettingsBodySchema,
  autoMatchFreelancerBodySchema,
  autoMatchFreelancerUpdateBodySchema,
  projectIdParamsSchema,
  autoMatchFreelancerParamsSchema,
} from '../validation/schemas/agencyProjectManagementSchemas.js';
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

const requireAgencyMember = [authenticate(), requireRoles('agency', 'agency_admin', 'admin')];
const requireAgencyAdmin = [authenticate(), requireRoles('agency_admin', 'admin')];
const requireAgencyAdsAccess = authenticate({ roles: ['agency', 'agency_admin'], allowAdminOverride: true });

router.get('/dashboard', ...requireAgencyMember, asyncHandler(agencyController.dashboard));
router.get('/dashboard/overview', ...requireAgencyMember, asyncHandler(agencyController.overview));
router.put('/dashboard/overview', ...requireAgencyAdmin, asyncHandler(agencyController.updateOverview));

router.get(
  '/profile',
  ...requireAgencyMember,
  validateRequest({ query: agencyProfileQuerySchema }),
  asyncHandler(agencyController.getProfile),
);
router.put('/profile', ...requireAgencyMember, asyncHandler(agencyController.updateProfile));
router.put('/profile/avatar', ...requireAgencyMember, asyncHandler(agencyController.updateAvatar));
router.get('/profile/manage', ...requireAgencyMember, asyncHandler(agencyController.profile));

router.get(
  '/profile/followers',
  ...requireAgencyMember,
  validateRequest({ query: listFollowersQuerySchema }),
  asyncHandler(agencyController.listFollowers),
);
router.patch(
  '/profile/followers/:followerId',
  ...requireAgencyMember,
  validateRequest({ params: followerParamsSchema, body: updateFollowerBodySchema }),
  asyncHandler(agencyController.updateFollower),
);
router.delete(
  '/profile/followers/:followerId',
  ...requireAgencyMember,
  validateRequest({ params: followerParamsSchema }),
  asyncHandler(agencyController.removeFollower),
);

router.get('/profile/connections', ...requireAgencyMember, asyncHandler(agencyController.listConnections));
router.post(
  '/profile/connections',
  ...requireAgencyMember,
  validateRequest({ body: requestConnectionBodySchema }),
  asyncHandler(agencyController.requestConnection),
);
router.post(
  '/profile/connections/:connectionId/respond',
  ...requireAgencyMember,
  validateRequest({ params: connectionParamsSchema, body: respondConnectionBodySchema }),
  asyncHandler(agencyController.respondToConnection),
);
router.delete(
  '/profile/connections/:connectionId',
  ...requireAgencyMember,
  validateRequest({ params: connectionParamsSchema }),
  asyncHandler(agencyController.removeConnection),
);

router.post('/profile/media', ...requireAgencyMember, asyncHandler(agencyController.createMedia));
router.put('/profile/media/:mediaId', ...requireAgencyMember, asyncHandler(agencyController.updateMedia));
router.delete('/profile/media/:mediaId', ...requireAgencyMember, asyncHandler(agencyController.deleteMedia));

router.post('/profile/skills', ...requireAgencyMember, asyncHandler(agencyController.createSkill));
router.put('/profile/skills/:skillId', ...requireAgencyMember, asyncHandler(agencyController.updateSkill));
router.delete('/profile/skills/:skillId', ...requireAgencyMember, asyncHandler(agencyController.deleteSkill));

router.post('/profile/credentials', ...requireAgencyMember, asyncHandler(agencyController.createCredential));
router.put('/profile/credentials/:credentialId', ...requireAgencyMember, asyncHandler(agencyController.updateCredential));
router.delete('/profile/credentials/:credentialId', ...requireAgencyMember, asyncHandler(agencyController.deleteCredential));

router.post('/profile/experiences', ...requireAgencyMember, asyncHandler(agencyController.createExperience));
router.put('/profile/experiences/:experienceId', ...requireAgencyMember, asyncHandler(agencyController.updateExperience));
router.delete('/profile/experiences/:experienceId', ...requireAgencyMember, asyncHandler(agencyController.deleteExperience));

router.post('/profile/workforce', ...requireAgencyMember, asyncHandler(agencyController.createWorkforceSegment));
router.put('/profile/workforce/:segmentId', ...requireAgencyMember, asyncHandler(agencyController.updateWorkforceSegment));
router.delete('/profile/workforce/:segmentId', ...requireAgencyMember, asyncHandler(agencyController.deleteWorkforceSegment));

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
router.put('/ads/placements/:placementId', requireAgencyAdsAccess, asyncHandler(agencyAdController.updatePlacement));

router.get('/calendar', ...requireAgencyMember, asyncHandler(agencyCalendarController.index));
router.get('/calendar/:eventId', ...requireAgencyMember, asyncHandler(agencyCalendarController.show));
router.post('/calendar', ...requireAgencyMember, asyncHandler(agencyCalendarController.store));
router.put('/calendar/:eventId', ...requireAgencyMember, asyncHandler(agencyCalendarController.update));
router.delete('/calendar/:eventId', ...requireAgencyMember, asyncHandler(agencyCalendarController.destroy));

router.use('/creation-studio', creationStudioRoutes);
router.use('/networking', ...requireAgencyMember, agencyNetworkingRoutes);
router.use('/timeline', agencyTimelineRoutes);
router.use('/job-management', agencyJobManagementRoutes);
router.use('/wallet', agencyWalletRoutes);
router.use('/blog', agencyBlogRoutes);

router.get('/mentoring/overview', ...requireAgencyMember, asyncHandler(agencyMentoringController.overview));
router.get('/mentoring/sessions', ...requireAgencyMember, asyncHandler(agencyMentoringController.sessionsList));
router.post('/mentoring/sessions', ...requireAgencyMember, asyncHandler(agencyMentoringController.sessionsCreate));
router.patch('/mentoring/sessions/:sessionId', ...requireAgencyMember, asyncHandler(agencyMentoringController.sessionsUpdate));
router.delete('/mentoring/sessions/:sessionId', ...requireAgencyMember, asyncHandler(agencyMentoringController.sessionsDelete));
router.get('/mentoring/purchases', ...requireAgencyMember, asyncHandler(agencyMentoringController.purchasesList));
router.post('/mentoring/purchases', ...requireAgencyMember, asyncHandler(agencyMentoringController.purchasesCreate));
router.patch('/mentoring/purchases/:purchaseId', ...requireAgencyMember, asyncHandler(agencyMentoringController.purchasesUpdate));
router.get('/mentoring/favourites', ...requireAgencyMember, asyncHandler(agencyMentoringController.favouritesList));
router.post('/mentoring/favourites', ...requireAgencyMember, asyncHandler(agencyMentoringController.favouritesCreate));
router.patch(
  '/mentoring/favourites/:preferenceId',
  ...requireAgencyMember,
  asyncHandler(agencyMentoringController.favouritesUpdate),
);
router.delete(
  '/mentoring/favourites/:preferenceId',
  ...requireAgencyMember,
  asyncHandler(agencyMentoringController.favouritesDelete),
);
router.get('/mentoring/suggestions', ...requireAgencyMember, asyncHandler(agencyMentoringController.suggestionsList));

router.get(
  '/project-management',
  ...requireAgencyMember,
  asyncHandler(agencyProjectManagementController.getProjectManagement),
);
router.post(
  '/project-management/projects',
  ...requireAgencyMember,
  validateRequest({ body: createProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.createProject),
);
router.put(
  '/project-management/projects/:projectId',
  ...requireAgencyMember,
  validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.updateProject),
);
router.put(
  '/project-management/projects/:projectId/automatch-settings',
  ...requireAgencyMember,
  validateRequest({ params: projectIdParamsSchema, body: autoMatchSettingsBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchSettings),
);
router.post(
  '/project-management/projects/:projectId/automatch/freelancers',
  ...requireAgencyMember,
  validateRequest({ params: projectIdParamsSchema, body: autoMatchFreelancerBodySchema }),
  asyncHandler(agencyProjectManagementController.addOrUpdateAutoMatchFreelancer),
);
router.put(
  '/project-management/projects/:projectId/automatch/freelancers/:freelancerEntryId',
  ...requireAgencyMember,
  validateRequest({ params: autoMatchFreelancerParamsSchema, body: autoMatchFreelancerUpdateBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchFreelancer),
);

const escrowRouter = Router();
escrowRouter.use(...requireAgencyMember);
escrowRouter.get('/overview', asyncHandler(agencyEscrowController.fetchOverview));
escrowRouter.get('/accounts', asyncHandler(agencyEscrowController.fetchAccounts));
escrowRouter.post('/accounts', asyncHandler(agencyEscrowController.createAccount));
escrowRouter.patch('/accounts/:accountId', asyncHandler(agencyEscrowController.updateAccount));
escrowRouter.get('/transactions', asyncHandler(agencyEscrowController.fetchTransactions));
escrowRouter.post('/transactions', asyncHandler(agencyEscrowController.createTransaction));
escrowRouter.patch('/transactions/:transactionId', asyncHandler(agencyEscrowController.updateTransaction));
escrowRouter.post('/transactions/:transactionId/release', asyncHandler(agencyEscrowController.releaseTransaction));
escrowRouter.post('/transactions/:transactionId/refund', asyncHandler(agencyEscrowController.refundTransaction));
escrowRouter.patch('/settings', asyncHandler(agencyEscrowController.updateSettings));
router.use('/escrow', escrowRouter);

router.get('/integrations', ...requireAgencyMember, asyncHandler(agencyIntegrationController.index));
router.post('/integrations', ...requireAgencyMember, asyncHandler(agencyIntegrationController.create));
router.patch(
  '/integrations/:integrationId',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.update),
);
router.post(
  '/integrations/:integrationId/secrets',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.rotateCredential),
);
router.post(
  '/integrations/:integrationId/webhooks',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.createWebhookEndpoint),
);
router.patch(
  '/integrations/:integrationId/webhooks/:webhookId',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.updateWebhookEndpoint),
);
router.delete(
  '/integrations/:integrationId/webhooks/:webhookId',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.deleteWebhookEndpoint),
);
router.post(
  '/integrations/:integrationId/test',
  ...requireAgencyMember,
  asyncHandler(agencyIntegrationController.testConnection),
);

const aiRouter = Router();
aiRouter.use(...requireAgencyMember);
aiRouter.get('/', asyncHandler(agencyAiController.fetchControlPanel));
aiRouter.put('/', asyncHandler(agencyAiController.updateControlPanel));
aiRouter.post('/templates', asyncHandler(agencyAiController.createTemplate));
aiRouter.put('/templates/:templateId', asyncHandler(agencyAiController.updateTemplate));
aiRouter.delete('/templates/:templateId', asyncHandler(agencyAiController.destroyTemplate));
router.use('/ai-control', aiRouter);

const workforceRouter = Router();
workforceRouter.use(...requireAgencyMember);
workforceRouter.get(
  '/dashboard',
  validateRequest({ query: workforceDashboardQuerySchema }),
  asyncHandler(agencyWorkforceController.dashboard),
);
workforceRouter.get(
  '/members',
  validateRequest({ query: listMembersQuerySchema }),
  asyncHandler(agencyWorkforceController.indexMembers),
);
workforceRouter.post(
  '/members',
  validateRequest({ body: createMemberBodySchema }),
  asyncHandler(agencyWorkforceController.storeMember),
);
workforceRouter.put(
  '/members/:memberId',
  validateRequest({ params: memberIdParamsSchema, body: updateMemberBodySchema }),
  asyncHandler(agencyWorkforceController.updateMember),
);
workforceRouter.delete(
  '/members/:memberId',
  validateRequest({ params: memberIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyMember),
);
workforceRouter.get(
  '/pay-delegations',
  validateRequest({ query: listPayDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexPayDelegations),
);
workforceRouter.post(
  '/pay-delegations',
  validateRequest({ body: createPayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storePayDelegation),
);
workforceRouter.put(
  '/pay-delegations/:delegationId',
  validateRequest({ params: payDelegationIdParamsSchema, body: updatePayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updatePayDelegationRecord),
);
workforceRouter.delete(
  '/pay-delegations/:delegationId',
  validateRequest({ params: payDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyPayDelegation),
);
workforceRouter.get(
  '/project-delegations',
  validateRequest({ query: listProjectDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexProjectDelegations),
);
workforceRouter.post(
  '/project-delegations',
  validateRequest({ body: createProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeProjectDelegation),
);
workforceRouter.put(
  '/project-delegations/:delegationId',
  validateRequest({ params: projectDelegationIdParamsSchema, body: updateProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateProjectDelegationRecord),
);
workforceRouter.delete(
  '/project-delegations/:delegationId',
  validateRequest({ params: projectDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyProjectDelegation),
);
workforceRouter.get(
  '/gig-delegations',
  validateRequest({ query: listGigDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexGigDelegations),
);
workforceRouter.post(
  '/gig-delegations',
  validateRequest({ body: createGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeGigDelegation),
);
workforceRouter.put(
  '/gig-delegations/:delegationId',
  validateRequest({ params: gigDelegationIdParamsSchema, body: updateGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateGigDelegationRecord),
);
workforceRouter.delete(
  '/gig-delegations/:delegationId',
  validateRequest({ params: gigDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyGigDelegation),
);
workforceRouter.get(
  '/capacity-snapshots',
  validateRequest({ query: listCapacitySnapshotsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexCapacitySnapshots),
);
workforceRouter.post(
  '/capacity-snapshots',
  validateRequest({ body: createCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.storeCapacitySnapshot),
);
workforceRouter.put(
  '/capacity-snapshots/:snapshotId',
  validateRequest({ params: capacitySnapshotIdParamsSchema, body: updateCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.updateCapacitySnapshot),
);
workforceRouter.delete(
  '/capacity-snapshots/:snapshotId',
  validateRequest({ params: capacitySnapshotIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyCapacitySnapshot),
);
workforceRouter.get(
  '/availability',
  validateRequest({ query: listAvailabilityQuerySchema }),
  asyncHandler(agencyWorkforceController.indexAvailability),
);
workforceRouter.post(
  '/availability',
  validateRequest({ body: createAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.storeAvailability),
);
workforceRouter.put(
  '/availability/:availabilityId',
  validateRequest({ params: availabilityIdParamsSchema, body: updateAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.updateAvailability),
);
workforceRouter.delete(
  '/availability/:availabilityId',
  validateRequest({ params: availabilityIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyAvailability),
);
router.use('/workforce', workforceRouter);

router.get('/client-kanban', ...requireAgencyMember, asyncHandler(agencyClientKanbanController.index));
router.post('/client-kanban/columns', ...requireAgencyMember, asyncHandler(agencyClientKanbanController.storeColumn));
router.patch(
  '/client-kanban/columns/:columnId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.updateColumnController),
);
router.delete(
  '/client-kanban/columns/:columnId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.destroyColumn),
);
router.post('/client-kanban/cards', ...requireAgencyMember, asyncHandler(agencyClientKanbanController.storeCard));
router.patch(
  '/client-kanban/cards/:cardId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.updateCardController),
);
router.post(
  '/client-kanban/cards/:cardId/move',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.moveCardController),
);
router.delete(
  '/client-kanban/cards/:cardId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.destroyCard),
);
router.post(
  '/client-kanban/cards/:cardId/checklist',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.storeChecklistItem),
);
router.patch(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.updateChecklistItemController),
);
router.delete(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.destroyChecklistItem),
);
router.post('/client-kanban/clients', ...requireAgencyMember, asyncHandler(agencyClientKanbanController.storeClient));
router.patch(
  '/client-kanban/clients/:clientId',
  ...requireAgencyMember,
  asyncHandler(agencyClientKanbanController.updateClientController),
);

export default router;

