import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';
import projectOperationsController from '../controllers/projectOperationsController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';

const router = Router();

router.get('/blueprints', asyncHandler(projectBlueprintController.index));
router.post('/', requireProjectManagementRole, asyncHandler(projectController.store));
router.put('/:projectId/blueprint', requireProjectManagementRole, asyncHandler(projectBlueprintController.upsert));
router.get('/:projectId/blueprint', asyncHandler(projectBlueprintController.show));
router.patch('/:projectId/auto-assign', requireProjectManagementRole, asyncHandler(projectController.toggleAutoAssign));
router.patch('/:projectId', requireProjectManagementRole, asyncHandler(projectController.update));
router.get('/:projectId', asyncHandler(projectController.show));
router.get('/:projectId/events', asyncHandler(projectController.events));
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
