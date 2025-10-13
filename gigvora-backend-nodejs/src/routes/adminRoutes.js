import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/dashboard', asyncHandler(adminController.dashboard));

export default router;
