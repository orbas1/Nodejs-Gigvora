import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import freelancerController from '../controllers/freelancerController.js';

const router = Router();

router.get('/dashboard', asyncHandler(freelancerController.dashboard));
router.post('/gigs', asyncHandler(freelancerController.createGig));
router.put('/gigs/:gigId', asyncHandler(freelancerController.updateGig));
router.post('/gigs/:gigId/publish', asyncHandler(freelancerController.publish));
router.get('/gigs/:gigId', asyncHandler(freelancerController.show));

export default router;
