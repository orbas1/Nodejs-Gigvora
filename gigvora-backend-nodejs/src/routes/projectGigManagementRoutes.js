import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectGigManagementController from '../controllers/projectGigManagementController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(projectGigManagementController.overview));
router.post('/projects', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeProject));
router.patch('/projects/:projectId', requireProjectManagementRole, asyncHandler(projectGigManagementController.patchProject));
router.post(
  '/projects/:projectId/assets',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeAsset),
);
router.patch(
  '/projects/:projectId/assets/:assetId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchAsset),
);
router.delete(
  '/projects/:projectId/assets/:assetId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.destroyAsset),
);
router.patch(
  '/projects/:projectId/workspace',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchWorkspace),
);
router.post(
  '/projects/:projectId/milestones',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeMilestone),
);
router.patch(
  '/projects/:projectId/milestones/:milestoneId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchMilestone),
);
router.delete(
  '/projects/:projectId/milestones/:milestoneId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.destroyMilestone),
);
router.post(
  '/projects/:projectId/collaborators',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeCollaborator),
);
router.patch(
  '/projects/:projectId/collaborators/:collaboratorId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchCollaborator),
);
router.delete(
  '/projects/:projectId/collaborators/:collaboratorId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.destroyCollaborator),
);
router.post(
  '/projects/:projectId/archive',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.archiveProjectAction),
);
router.post(
  '/projects/:projectId/restore',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.restoreProjectAction),
);
router.post('/gig-orders', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeGigOrder));
router.patch(
  '/gig-orders/:orderId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchGigOrder),
);
router.post('/project-bids', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeBid));
router.patch('/project-bids/:bidId', requireProjectManagementRole, asyncHandler(projectGigManagementController.patchBid));
router.post('/invitations', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeInvitation));
router.patch(
  '/invitations/:invitationId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchInvitation),
);
router.put(
  '/auto-match/settings',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.upsertAutoMatchSettings),
);
router.post('/auto-match/matches', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeAutoMatch));
router.patch(
  '/auto-match/matches/:matchId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchAutoMatch),
);
router.post('/reviews', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeReview));
router.post(
  '/escrow/transactions',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeEscrowTransaction),
);
router.patch(
  '/escrow/settings',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchEscrowSettings),
router.get('/gig-orders/:orderId', asyncHandler(projectGigManagementController.showGigOrder));
router.post(
  '/gig-orders/:orderId/timeline',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeGigTimelineEvent),
);
router.post(
  '/gig-orders/:orderId/messages',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeGigMessage),
);
router.post(
  '/gig-orders/:orderId/escrow',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeGigEscrowCheckpoint),
);
router.patch(
  '/gig-orders/:orderId/escrow/:checkpointId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchGigEscrowCheckpoint),
router.patch(
  '/gig-orders/:orderId/timeline/:eventId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchGigTimelineEvent),
);
router.post(
  '/gig-orders/:orderId/submissions',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeGigSubmission),
);
router.patch(
  '/gig-orders/:orderId/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchGigSubmission),
);
router.post(
  '/gig-orders/:orderId/chat',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeGigChatMessage),
);
router.post(
  '/gig-orders/:orderId/chat/:messageId/acknowledge',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.acknowledgeGigMessage),
);

export default router;
