import { Router } from 'express';
import * as freelancerAgencyController from '../controllers/freelancerAgencyController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/:freelancerId/agency-collaborations',
  asyncHandler(freelancerAgencyController.collaborationsOverview),
);

export default router;

