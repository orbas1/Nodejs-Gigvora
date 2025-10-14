import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import autoAssignController from '../controllers/autoAssignController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.post(
  '/projects/:projectId/enqueue',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(autoAssignController.enqueueProjectAssignments),
);
router.get(
  '/queue',
  requireRoles('freelancer', 'admin', 'agency', 'company'),
  asyncHandler(autoAssignController.listQueue),
);
router.patch(
  '/queue/:entryId',
  requireRoles('freelancer', 'admin', 'agency', 'company'),
  asyncHandler(autoAssignController.updateQueueEntryStatus),
);
router.get(
  '/projects/:projectId/queue',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(autoAssignController.projectQueue),
);

export default router;
