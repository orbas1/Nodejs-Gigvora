import { Router } from 'express';
import * as adController from '../controllers/adController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';

const router = Router();

router.use(authenticateRequest({ allowHeaderOverride: false }));
router.use(requireRoles('admin'));

router.get('/dashboard', asyncHandler(adController.dashboard));
router.get('/placements', asyncHandler(adController.placements));

export default router;
