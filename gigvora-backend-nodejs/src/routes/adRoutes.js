import { Router } from 'express';
import * as adController from '../controllers/adController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { requireUserType } from '../middleware/authorization.js';

const router = Router();

router.use(requireUserType(['admin']));

router.get('/dashboard', asyncHandler(adController.dashboard));
router.get('/placements', asyncHandler(adController.placements));

export default router;
