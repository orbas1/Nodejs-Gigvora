import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import interviewController from '../controllers/interviewController.js';

const router = Router();

router.get('/', asyncHandler(interviewController.index));
router.post('/', asyncHandler(interviewController.store));
router.get('/rooms/:roomId', asyncHandler(interviewController.show));
router.put('/rooms/:roomId', asyncHandler(interviewController.update));
router.post('/rooms/:roomId/participants', asyncHandler(interviewController.addParticipant));
router.patch('/rooms/:roomId/checklist/:itemId', asyncHandler(interviewController.updateChecklist));
router.patch('/workflows/:workspaceId/lanes/:laneId', asyncHandler(interviewController.updateLane));

export default router;
