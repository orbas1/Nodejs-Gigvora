import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { controlTowerOverview, showFreelancerInsights } from '../controllers/financeController.js';

const router = Router();

router.get('/control-tower/overview', asyncHandler(controlTowerOverview));
router.get('/freelancers/:freelancerId/insights', asyncHandler(showFreelancerInsights));

export default router;
