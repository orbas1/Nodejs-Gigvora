import { Router } from 'express';
import * as adController from '../controllers/adController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/dashboard', asyncHandler(adController.dashboard));
router.get('/placements', asyncHandler(adController.placements));

export default router;
