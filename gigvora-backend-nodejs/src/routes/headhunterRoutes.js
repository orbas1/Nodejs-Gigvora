import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import { dashboard } from '../controllers/headhunterController.js';

const router = Router();
const HEADHUNTER_ROLES = ['headhunter', 'agency', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...HEADHUNTER_ROLES));

router.get('/dashboard', asyncHandler(dashboard));

export default router;
