import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import {
  controlTowerOverview,
  showFreelancerInsights,
  handleReleaseAction,
  handleDisputeAction,
  handleComplianceAction,
} from '../controllers/financeController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  financeOverviewQuerySchema,
  financeFreelancerParamsSchema,
  financeReleaseActionParamsSchema,
  financeReleaseActionBodySchema,
  financeDisputeActionParamsSchema,
  financeDisputeActionBodySchema,
  financeComplianceActionParamsSchema,
  financeComplianceActionBodySchema,
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
router.post(
  '/releases/:releaseId/actions',
  validateRequest({
    params: financeReleaseActionParamsSchema,
    body: financeReleaseActionBodySchema,
  }),
  asyncHandler(handleReleaseAction),
);
router.post(
  '/disputes/:disputeId/actions',
  validateRequest({
    params: financeDisputeActionParamsSchema,
    body: financeDisputeActionBodySchema,
  }),
  asyncHandler(handleDisputeAction),
);
router.post(
  '/compliance/:obligationId/actions',
  validateRequest({
    params: financeComplianceActionParamsSchema,
    body: financeComplianceActionBodySchema,
  }),
  asyncHandler(handleComplianceAction),
);

export default router;
