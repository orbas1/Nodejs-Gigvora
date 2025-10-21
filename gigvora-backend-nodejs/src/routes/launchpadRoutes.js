import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import launchpadController from '../controllers/launchpadController.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  launchpadApplicationsQuerySchema,
  createLaunchpadApplicationBodySchema,
  launchpadApplicationParamsSchema,
  updateLaunchpadApplicationBodySchema,
  launchpadEmployerRequestBodySchema,
  launchpadPlacementBodySchema,
  launchpadOpportunityLinkBodySchema,
  launchpadDashboardQuerySchema,
  launchpadWorkflowQuerySchema,
} from '../validation/schemas/launchpadSchemas.js';

const router = Router();

const LAUNCHPAD_ACCESS_ROLES = [
  'admin',
  'agency',
  'agency_admin',
  'company',
  'company_admin',
  'mentor',
  'headhunter',
  'partner',
];

router.use(
  authenticate({
    roles: LAUNCHPAD_ACCESS_ROLES,
    allowAdminOverride: true,
  }),
);

router.get(
  '/applications',
  validateRequest({ query: launchpadApplicationsQuerySchema }),
  asyncHandler(launchpadController.listApplications),
);
router.post(
  '/applications',
  validateRequest({ body: createLaunchpadApplicationBodySchema }),
  asyncHandler(launchpadController.createApplication),
);
router.patch(
  '/applications/:applicationId/status',
  validateRequest({
    params: launchpadApplicationParamsSchema,
    body: updateLaunchpadApplicationBodySchema,
  }),
  asyncHandler(launchpadController.updateApplication),
);
router.post(
  '/employers',
  validateRequest({ body: launchpadEmployerRequestBodySchema }),
  asyncHandler(launchpadController.createEmployerRequest),
);
router.post(
  '/placements',
  validateRequest({ body: launchpadPlacementBodySchema }),
  asyncHandler(launchpadController.createPlacement),
);
router.post(
  '/opportunities',
  validateRequest({ body: launchpadOpportunityLinkBodySchema }),
  asyncHandler(launchpadController.createOpportunityLink),
);
router.get(
  '/dashboard',
  validateRequest({ query: launchpadDashboardQuerySchema }),
  asyncHandler(launchpadController.dashboard),
);
router.get(
  '/workflow',
  validateRequest({ query: launchpadWorkflowQuerySchema }),
  asyncHandler(launchpadController.workflow),
);

export default router;
