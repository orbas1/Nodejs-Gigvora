import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.get('/overview', authenticate, asyncHandler(dashboardController.overview));

export default router;
