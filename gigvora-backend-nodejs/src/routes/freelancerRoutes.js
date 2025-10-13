import { Router } from 'express';
import * as freelancerController from '../controllers/freelancerController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/:id/purchased-gigs', asyncHandler(freelancerController.getPurchasedGigWorkspace));

export default router;
