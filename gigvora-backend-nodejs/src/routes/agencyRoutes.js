import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

export default router;

