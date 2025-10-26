import { Router } from 'express';

import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import * as communityEventsController from '../controllers/communityEventsController.js';

const router = Router();

router.use(authenticateRequest({ optional: true }));

router.get('/events', asyncHandler(communityEventsController.calendar));
router.get('/events/:eventId', asyncHandler(communityEventsController.show));
router.get('/volunteers', asyncHandler(communityEventsController.volunteers));

export default router;
