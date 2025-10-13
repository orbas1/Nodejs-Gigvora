import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import freelancerController from '../controllers/freelancerController.js';

const router = Router();

router.get('/dashboard', asyncHandler(freelancerController.dashboard));

export default router;

