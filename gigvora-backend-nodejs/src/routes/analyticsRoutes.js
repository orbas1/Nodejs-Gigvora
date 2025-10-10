import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/events', asyncHandler(analyticsController.recordEvent));
router.get('/events', asyncHandler(analyticsController.getEvents));

export default router;
