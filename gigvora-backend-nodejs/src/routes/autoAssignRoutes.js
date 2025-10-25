import { Router } from 'express';

import {
  enqueueProjectAssignments,
  listQueue,
  projectMetrics,
  projectQueue,
  streamProjectQueue,
  updateQueueEntryStatus,
} from '../controllers/autoAssignController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post(
  '/projects/:projectId/enqueue',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(enqueueProjectAssignments),
);
router.get(
  '/projects/metrics',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(projectMetrics),
);
router.get(
  '/projects/:projectId/queue/stream',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(streamProjectQueue),
);
router.get(
  '/queue',
  requireRoles('freelancer', 'admin', 'agency', 'company'),
  asyncHandler(listQueue),
);
router.patch(
  '/queue/:entryId',
  requireRoles('freelancer', 'admin', 'agency', 'company'),
  asyncHandler(updateQueueEntryStatus),
);
router.get(
  '/projects/:projectId/queue',
  requireRoles('company', 'agency', 'admin'),
  asyncHandler(projectQueue),
);

// eslint-disable-next-line import/no-default-export
export default router;
