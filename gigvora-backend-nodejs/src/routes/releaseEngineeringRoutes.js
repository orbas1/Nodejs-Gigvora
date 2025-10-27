import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRoles } from '../middleware/authentication.js';
import releaseEngineeringController from '../controllers/releaseEngineeringController.js';

const router = Router();

router.use(authenticate());
router.use(requireRoles('admin', 'platform_ops', 'support_ops'));

router.get('/suite', asyncHandler(releaseEngineeringController.getSuite));

export default router;
