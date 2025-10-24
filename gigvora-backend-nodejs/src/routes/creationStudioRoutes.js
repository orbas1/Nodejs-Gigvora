import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import creationStudioController from '../controllers/creationStudioController.js';
import {
  creationStudioCreateSchema,
  creationStudioUpdateSchema,
  creationStudioItemParamsSchema,
  creationStudioPublishSchema,
  creationStudioListQuerySchema,
  creationStudioOverviewQuerySchema,
  creationStudioCollaboratorQuerySchema,
  creationStudioCollaboratorBodySchema,
  creationStudioCollaboratorParamsSchema,
  creationStudioCollaboratorUpdateSchema,
} from '../validation/schemas/creationStudioSchemas.js';

const router = Router();
const MANAGER_ROLES = ['admin', 'company', 'company_admin', 'workspace_admin'];

router.use(authenticateRequest());
router.use(requireRoles(...MANAGER_ROLES));

router.get(
  '/overview',
  validateRequest({ query: creationStudioOverviewQuerySchema }),
  asyncHandler(creationStudioController.overview),
);

router.get(
  '/',
  validateRequest({ query: creationStudioListQuerySchema }),
  asyncHandler(creationStudioController.index),
);

router.post(
  '/',
  validateRequest({ body: creationStudioCreateSchema }),
  asyncHandler(creationStudioController.store),
);

router.put(
  '/:itemId',
  validateRequest({ params: creationStudioItemParamsSchema, body: creationStudioUpdateSchema }),
  asyncHandler(creationStudioController.update),
);

router.post(
  '/:itemId/publish',
  validateRequest({ params: creationStudioItemParamsSchema, body: creationStudioPublishSchema }),
  asyncHandler(creationStudioController.publish),
);

router.delete(
  '/:itemId',
  validateRequest({ params: creationStudioItemParamsSchema }),
  asyncHandler(creationStudioController.destroy),
);

router.get(
  '/collaborators',
  validateRequest({ query: creationStudioCollaboratorQuerySchema }),
  asyncHandler(creationStudioController.listCollaboratorsHandler),
);

router.post(
  '/collaborators',
  validateRequest({ body: creationStudioCollaboratorBodySchema }),
  asyncHandler(creationStudioController.inviteCollaboratorHandler),
);

router.patch(
  '/collaborators/:collaboratorId',
  validateRequest({ params: creationStudioCollaboratorParamsSchema, body: creationStudioCollaboratorUpdateSchema }),
  asyncHandler(creationStudioController.updateCollaboratorHandler),
);

export default router;
