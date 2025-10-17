import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';
import projectOperationsController from '../controllers/projectOperationsController.js';
import projectWorkspaceManagementController from '../controllers/projectWorkspaceManagementController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createProjectBodySchema,
  updateProjectBodySchema,
  projectIdParamsSchema,
  projectEventsQuerySchema,
  projectAutoAssignBodySchema,
} from '../validation/schemas/projectSchemas.js';

const router = Router();

router.get('/blueprints', asyncHandler(projectBlueprintController.index));
router.post(
  '/',
  requireProjectManagementRole,
  validateRequest({ body: createProjectBodySchema }),
  asyncHandler(projectController.store),
);
router.get('/workspace/management', asyncHandler(projectWorkspaceManagementController.index));
router.put('/:projectId/blueprint', requireProjectManagementRole, asyncHandler(projectBlueprintController.upsert));
router.get('/:projectId/blueprint', asyncHandler(projectBlueprintController.show));
router.patch(
  '/:projectId/auto-assign',
  requireProjectManagementRole,
  validateRequest({ params: projectIdParamsSchema, body: projectAutoAssignBodySchema }),
  asyncHandler(projectController.toggleAutoAssign),
);
router.patch(
  '/:projectId',
  requireProjectManagementRole,
  validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }),
  asyncHandler(projectController.update),
);
router.get(
  '/:projectId',
  validateRequest({ params: projectIdParamsSchema }),
  asyncHandler(projectController.show),
);
router.get('/:projectId/workspace/management', asyncHandler(projectWorkspaceManagementController.show));
router.get(
  '/:projectId/events',
  validateRequest({ params: projectIdParamsSchema, query: projectEventsQuerySchema }),
  asyncHandler(projectController.events),
);
router.get('/:projectId/operations', asyncHandler(projectOperationsController.show));
router.put('/:projectId/operations', requireProjectManagementRole, asyncHandler(projectOperationsController.upsert));
router.post('/:projectId/operations/tasks', requireProjectManagementRole, asyncHandler(projectOperationsController.addTask));
router.patch(
  '/:projectId/operations/tasks/:taskId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateTask),
);
router.delete(
  '/:projectId/operations/tasks/:taskId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.removeTask),
);
router.post(
  '/:projectId/workspace/management/:entity',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceManagementController.create),
);
router.put(
  '/:projectId/workspace/management/:entity',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceManagementController.update),
);
router.put(
  '/:projectId/workspace/management/:entity/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceManagementController.update),
);
router.delete(
  '/:projectId/workspace/management/:entity/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceManagementController.destroy),
);
router.get('/:projectId/workspace', asyncHandler(projectWorkspaceController.show));
router.put('/:projectId/workspace/brief', requireProjectManagementRole, asyncHandler(projectWorkspaceController.updateBrief));
router.patch(
  '/:projectId/workspace/approvals/:approvalId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.updateApproval),
);
router.patch(
  '/:projectId/workspace/conversations/:conversationId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.acknowledgeConversation),
);

export default router;
