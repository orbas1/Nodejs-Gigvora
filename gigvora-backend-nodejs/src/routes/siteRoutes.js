import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as siteController from '../controllers/siteController.js';

const router = Router();

router.get('/settings', asyncHandler(siteController.settings));
router.get('/navigation', asyncHandler(siteController.navigation));
router.get('/pages', asyncHandler(siteController.index));
router.get('/pages/:slug', asyncHandler(siteController.show));

export default router;
