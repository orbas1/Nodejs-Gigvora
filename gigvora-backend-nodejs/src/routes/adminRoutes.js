import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';
import adminAdRoutes from './adminAdRoutes.js';
import { requireAdmin } from '../middleware/authenticate.js';

const router = Router();

router.use(requireAdmin);

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/platform-settings', asyncHandler(adminController.fetchPlatformSettings));
router.put('/platform-settings', asyncHandler(adminController.persistPlatformSettings));

router.use('/ads/coupons', adminAdRoutes);

export default router;
