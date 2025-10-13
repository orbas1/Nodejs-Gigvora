import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';

const router = Router();

router.get('/dashboard', asyncHandler(agencyController.dashboard));

export default router;

