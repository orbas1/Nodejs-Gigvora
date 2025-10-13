import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import workManagementController from '../controllers/workManagementController.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(workManagementController.overview));
router.post('/sprints', asyncHandler(workManagementController.storeSprint));
router.post('/sprints/:sprintId/tasks', asyncHandler(workManagementController.storeTask));
router.post('/tasks', asyncHandler(workManagementController.storeTask));
router.patch('/tasks/:taskId', asyncHandler(workManagementController.updateTask));
router.post('/tasks/:taskId/time-entries', asyncHandler(workManagementController.logTime));
router.post('/risks', asyncHandler(workManagementController.storeRisk));
router.patch('/risks/:riskId', asyncHandler(workManagementController.modifyRisk));
router.post('/change-requests', asyncHandler(workManagementController.storeChangeRequest));
router.patch(
  '/change-requests/:changeRequestId/approve',
  asyncHandler(workManagementController.approveChange),
);

export default router;
