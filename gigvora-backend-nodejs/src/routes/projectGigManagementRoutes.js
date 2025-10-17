import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectGigManagementController from '../controllers/projectGigManagementController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(projectGigManagementController.overview));
router.post('/projects', requireProjectManagementRole, asyncHandler(projectGigManagementController.storeProject));
router.post(
  '/projects/:projectId/assets',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.storeAsset),
);
router.patch(
  '/projects/:projectId/workspace',
  requireProjectManagementRole,
  asyncHandler(projectGigManagementController.patchWorkspace),
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
);

export default router;
