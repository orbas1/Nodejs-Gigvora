import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import launchpadController from '../controllers/launchpadController.js';

const router = Router();

router.post('/applications', asyncHandler(launchpadController.createApplication));
router.patch(
  '/applications/:applicationId/status',
  asyncHandler(launchpadController.updateApplication),
);
router.post('/employers', asyncHandler(launchpadController.createEmployerRequest));
router.post('/placements', asyncHandler(launchpadController.createPlacement));
router.post('/opportunities', asyncHandler(launchpadController.createOpportunityLink));
router.get('/dashboard', asyncHandler(launchpadController.dashboard));

export default router;
