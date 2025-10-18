import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as controller from '../controllers/adminProjectManagementController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  projectPortfolioQuerySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  projectWorkspaceBodySchema,
  projectIdParamsSchema,
  projectMilestoneParamsSchema,
  projectCollaboratorParamsSchema,
  projectIntegrationParamsSchema,
  projectAssetParamsSchema,
  milestoneCreateBodySchema,
  milestoneUpdateBodySchema,
  collaboratorCreateBodySchema,
  collaboratorUpdateBodySchema,
  integrationCreateBodySchema,
  integrationUpdateBodySchema,
  assetCreateBodySchema,
  retrospectiveCreateBodySchema,
} from '../validation/schemas/adminProjectManagementSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: projectPortfolioQuerySchema }), asyncHandler(controller.overview));
router.get('/summary', asyncHandler(controller.summary));
router.post('/', validateRequest({ body: createProjectBodySchema }), asyncHandler(controller.store));

router.get(
  '/projects/:projectId',
  validateRequest({ params: projectIdParamsSchema }),
  asyncHandler(controller.show),
);

router.put(
  '/projects/:projectId',
  validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }),
  asyncHandler(controller.update),
);

router.patch(
  '/projects/:projectId/workspace',
  validateRequest({ params: projectIdParamsSchema, body: projectWorkspaceBodySchema }),
  asyncHandler(controller.updateWorkspace),
);

router.post(
  '/projects/:projectId/milestones',
  validateRequest({ params: projectIdParamsSchema, body: milestoneCreateBodySchema }),
  asyncHandler(controller.storeMilestone),
);

router.put(
  '/projects/:projectId/milestones/:milestoneId',
  validateRequest({ params: projectMilestoneParamsSchema, body: milestoneUpdateBodySchema }),
  asyncHandler(controller.updateMilestone),
);

router.delete(
  '/projects/:projectId/milestones/:milestoneId',
  validateRequest({ params: projectMilestoneParamsSchema }),
  asyncHandler(controller.destroyMilestone),
);

router.post(
  '/projects/:projectId/collaborators',
  validateRequest({ params: projectIdParamsSchema, body: collaboratorCreateBodySchema }),
  asyncHandler(controller.storeCollaborator),
);

router.put(
  '/projects/:projectId/collaborators/:collaboratorId',
  validateRequest({ params: projectCollaboratorParamsSchema, body: collaboratorUpdateBodySchema }),
  asyncHandler(controller.updateCollaborator),
);

router.delete(
  '/projects/:projectId/collaborators/:collaboratorId',
  validateRequest({ params: projectCollaboratorParamsSchema }),
  asyncHandler(controller.destroyCollaborator),
);

router.post(
  '/projects/:projectId/integrations',
  validateRequest({ params: projectIdParamsSchema, body: integrationCreateBodySchema }),
  asyncHandler(controller.storeIntegration),
);

router.put(
  '/projects/:projectId/integrations/:integrationId',
  validateRequest({ params: projectIntegrationParamsSchema, body: integrationUpdateBodySchema }),
  asyncHandler(controller.updateIntegration),
);

router.delete(
  '/projects/:projectId/integrations/:integrationId',
  validateRequest({ params: projectIntegrationParamsSchema }),
  asyncHandler(controller.destroyIntegration),
);

router.post(
  '/projects/:projectId/assets',
  validateRequest({ params: projectIdParamsSchema, body: assetCreateBodySchema }),
  asyncHandler(controller.storeAsset),
);

router.delete(
  '/projects/:projectId/assets/:assetId',
  validateRequest({ params: projectAssetParamsSchema }),
  asyncHandler(controller.destroyAsset),
);

router.post(
  '/projects/:projectId/retrospectives',
  validateRequest({ params: projectIdParamsSchema, body: retrospectiveCreateBodySchema }),
  asyncHandler(controller.storeRetrospective),
);

export default router;
