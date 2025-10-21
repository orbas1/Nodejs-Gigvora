import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import * as feedController from '../controllers/feedController.js';

const router = Router();
const FEED_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

router.use(authenticateRequest({ optional: true }));

router.get('/', asyncHandler(feedController.listFeed));
router.post('/', authenticateRequest(), requireRoles(...FEED_ROLES), asyncHandler(feedController.createPost));

export default router;
