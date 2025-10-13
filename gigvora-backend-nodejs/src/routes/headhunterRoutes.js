import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { dashboard } from '../controllers/headhunterController.js';

const router = Router();

router.get('/dashboard', asyncHandler(dashboard));

export default router;
