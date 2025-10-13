import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/platform-settings', asyncHandler(adminController.fetchPlatformSettings));
router.put('/platform-settings', asyncHandler(adminController.persistPlatformSettings));

export default router;
