import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import { controlTowerOverview, showFreelancerInsights } from '../controllers/financeController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  financeOverviewQuerySchema,
  financeFreelancerParamsSchema,
} from '../validation/schemas/financeSchemas.js';

const router = Router();
const FINANCE_ROLES = ['admin', 'finance', 'company_admin', 'operations'];

router.use(authenticateRequest());
router.use(requireRoles(...FINANCE_ROLES));

router.get(
  '/control-tower/overview',
  validateRequest({ query: financeOverviewQuerySchema }),
  asyncHandler(controlTowerOverview),
);
router.get(
  '/freelancers/:freelancerId/insights',
  validateRequest({ params: financeFreelancerParamsSchema }),
  asyncHandler(showFreelancerInsights),
);

export default router;
