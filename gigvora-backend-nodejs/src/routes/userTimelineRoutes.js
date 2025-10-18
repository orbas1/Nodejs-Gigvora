import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as userTimelineController from '../controllers/userTimelineController.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(userTimelineController.getTimelineWorkspace));
router.put('/settings', asyncHandler(userTimelineController.updateTimelineSettings));

router.post('/entries', asyncHandler(userTimelineController.createTimelineEntryController));
router.put('/entries/:entryId', asyncHandler(userTimelineController.updateTimelineEntryController));
router.delete('/entries/:entryId', asyncHandler(userTimelineController.deleteTimelineEntryController));

router.post('/posts', asyncHandler(userTimelineController.createTimelinePostController));
router.put('/posts/:postId', asyncHandler(userTimelineController.updateTimelinePostController));
router.delete('/posts/:postId', asyncHandler(userTimelineController.deleteTimelinePostController));
router.post('/posts/:postId/publish', asyncHandler(userTimelineController.publishTimelinePostController));
router.post('/posts/:postId/metrics', asyncHandler(userTimelineController.recordTimelinePostMetrics));

export default router;
