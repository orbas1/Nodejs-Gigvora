import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyProjectManagementController from '../controllers/agencyProjectManagementController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createProjectBodySchema,
  updateProjectBodySchema,
  autoMatchSettingsBodySchema,
  autoMatchFreelancerBodySchema,
  autoMatchFreelancerUpdateBodySchema,
  projectIdParamsSchema,
  autoMatchFreelancerParamsSchema,
} from '../validation/schemas/agencyProjectManagementSchemas.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/project-management',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyProjectManagementController.getProjectManagement),
);

router.post(
  '/project-management/projects',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.createProject),
);

router.put(
  '/project-management/projects/:projectId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }),
  asyncHandler(agencyProjectManagementController.updateProject),
);

router.put(
  '/project-management/projects/:projectId/automatch-settings',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: autoMatchSettingsBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchSettings),
);

router.post(
  '/project-management/projects/:projectId/automatch/freelancers',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectIdParamsSchema, body: autoMatchFreelancerBodySchema }),
  asyncHandler(agencyProjectManagementController.addOrUpdateAutoMatchFreelancer),
);

router.put(
  '/project-management/projects/:projectId/automatch/freelancers/:freelancerEntryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: autoMatchFreelancerParamsSchema, body: autoMatchFreelancerUpdateBodySchema }),
  asyncHandler(agencyProjectManagementController.updateAutoMatchFreelancer),
);

export default router;

