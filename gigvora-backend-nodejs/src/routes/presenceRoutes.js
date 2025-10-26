import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import * as presenceController from '../controllers/presenceController.js';

const router = Router();

router.get('/', authenticateRequest({ optional: true }), asyncHandler(presenceController.index));
router.get('/:userId', authenticateRequest({ optional: true }), asyncHandler(presenceController.show));
router.post('/:userId/status', authenticateRequest(), asyncHandler(presenceController.updateStatus));
router.post('/:userId/focus', authenticateRequest(), asyncHandler(presenceController.startFocus));
router.post('/:userId/focus/end', authenticateRequest(), asyncHandler(presenceController.endFocus));
router.post('/:userId/availability', authenticateRequest(), asyncHandler(presenceController.scheduleAvailability));
router.post('/:userId/calendar/refresh', authenticateRequest(), asyncHandler(presenceController.refreshCalendar));

export default router;
