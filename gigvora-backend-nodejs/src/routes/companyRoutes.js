import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));
router.put(
  '/dashboard/overview',
  authenticate(),
  requireMembership(['company', 'company_admin', 'workspace_admin'], { allowAdmin: true }),
  asyncHandler(companyController.updateDashboardOverview),
);

export default router;

