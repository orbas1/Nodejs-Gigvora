import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { showFreelancerInsights } from '../controllers/financeController.js';

const router = Router();

router.get('/freelancers/:freelancerId/insights', asyncHandler(showFreelancerInsights));

export default router;
