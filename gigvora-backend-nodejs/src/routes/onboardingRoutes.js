import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';
import * as onboardingController from '../controllers/onboardingController.js';

const router = Router();

router.get('/personas', authenticateRequest({ optional: true }), asyncHandler(onboardingController.listPersonas));
router.post('/journeys', authenticateRequest(), asyncHandler(onboardingController.startJourney));

export default router;
