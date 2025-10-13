import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectGigManagementController from '../controllers/projectGigManagementController.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(projectGigManagementController.overview));
router.post('/projects', asyncHandler(projectGigManagementController.storeProject));
router.post('/projects/:projectId/assets', asyncHandler(projectGigManagementController.storeAsset));
router.patch('/projects/:projectId/workspace', asyncHandler(projectGigManagementController.patchWorkspace));
router.post('/gig-orders', asyncHandler(projectGigManagementController.storeGigOrder));
router.patch('/gig-orders/:orderId', asyncHandler(projectGigManagementController.patchGigOrder));

export default router;
