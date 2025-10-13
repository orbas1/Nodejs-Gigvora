import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { communitySpotlight } from '../controllers/freelancerController.js';

const router = Router();

router.get('/:freelancerId/community-spotlight', asyncHandler(communitySpotlight));

export default router;
