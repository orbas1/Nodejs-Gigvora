import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import autoAssignController from '../controllers/autoAssignController.js';

const router = Router();

router.post(
  '/projects/:projectId/enqueue',
  asyncHandler(autoAssignController.enqueueProjectAssignments),
);
router.get('/queue', asyncHandler(autoAssignController.listQueue));
router.patch('/queue/:entryId', asyncHandler(autoAssignController.updateQueueEntryStatus));
router.get('/projects/:projectId/queue', asyncHandler(autoAssignController.projectQueue));

export default router;
