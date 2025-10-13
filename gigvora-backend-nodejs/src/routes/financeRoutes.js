import { Router } from 'express';
import { controlTowerOverview } from '../controllers/financeController.js';

const router = Router();

router.get('/control-tower/overview', controlTowerOverview);
import asyncHandler from '../utils/asyncHandler.js';
import { showFreelancerInsights } from '../controllers/financeController.js';

const router = Router();

router.get('/freelancers/:freelancerId/insights', asyncHandler(showFreelancerInsights));

export default router;
