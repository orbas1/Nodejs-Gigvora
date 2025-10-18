import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import creationStudioController from '../controllers/creationStudioController.js';
import {
  creationStudioCreateSchema,
  creationStudioUpdateSchema,
  creationStudioItemParamsSchema,
  creationStudioPublishSchema,
  creationStudioListQuerySchema,
  creationStudioOverviewQuerySchema,
} from '../validation/schemas/creationStudioSchemas.js';

const router = Router();
const MANAGER_ROLES = ['admin', 'company', 'company_admin', 'workspace_admin'];

router.use(authenticate());

router.get(
  '/overview',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ query: creationStudioOverviewQuerySchema }),
  asyncHandler(creationStudioController.overview),
);

router.get(
  '/',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ query: creationStudioListQuerySchema }),
  asyncHandler(creationStudioController.index),
);

router.post(
  '/',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ body: creationStudioCreateSchema }),
  asyncHandler(creationStudioController.store),
);

router.put(
  '/:itemId',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ params: creationStudioItemParamsSchema, body: creationStudioUpdateSchema }),
  asyncHandler(creationStudioController.update),
);

router.post(
  '/:itemId/publish',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ params: creationStudioItemParamsSchema, body: creationStudioPublishSchema }),
  asyncHandler(creationStudioController.publish),
);

router.delete(
  '/:itemId',
  requireRoles(...MANAGER_ROLES),
  validateRequest({ params: creationStudioItemParamsSchema }),
  asyncHandler(creationStudioController.destroy),
);
import { index, show, create, update, publish } from '../controllers/creationStudioController.js';

const router = Router();

router.get('/items', asyncHandler(index));
router.get('/items/:itemId', asyncHandler(show));
router.post('/items', asyncHandler(create));
router.put('/items/:itemId', asyncHandler(update));
router.post('/items/:itemId/publish', asyncHandler(publish));

export default router;
