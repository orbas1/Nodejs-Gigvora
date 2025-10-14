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

export default router;
