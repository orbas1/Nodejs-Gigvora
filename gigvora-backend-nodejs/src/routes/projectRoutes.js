import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';
import projectOperationsController from '../controllers/projectOperationsController.js';
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
router.post(
  '/:projectId/workspace/conversations/:conversationId/messages',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.createConversationMessage),
);
router.post(
  '/:projectId/workspace/budgets',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveBudget),
);
router.put(
  '/:projectId/workspace/budgets/:budgetId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveBudget),
);
router.delete(
  '/:projectId/workspace/budgets/:budgetId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteBudget),
);
router.post(
  '/:projectId/workspace/objects',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveObject),
);
router.put(
  '/:projectId/workspace/objects/:objectId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveObject),
);
router.delete(
  '/:projectId/workspace/objects/:objectId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteObject),
);
router.post(
  '/:projectId/workspace/timeline',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveTimelineEntry),
);
router.put(
  '/:projectId/workspace/timeline/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveTimelineEntry),
);
router.delete(
  '/:projectId/workspace/timeline/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteTimelineEntry),
);
router.post(
  '/:projectId/workspace/meetings',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveMeeting),
);
router.put(
  '/:projectId/workspace/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveMeeting),
);
router.delete(
  '/:projectId/workspace/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteMeeting),
);
router.post(
  '/:projectId/workspace/roles',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveRole),
);
router.put(
  '/:projectId/workspace/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveRole),
);
router.delete(
  '/:projectId/workspace/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteRole),
);
router.post(
  '/:projectId/workspace/submissions',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveSubmission),
);
router.put(
  '/:projectId/workspace/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveSubmission),
);
router.delete(
  '/:projectId/workspace/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteSubmission),
);
router.post(
  '/:projectId/workspace/invites',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveInvite),
);
router.put(
  '/:projectId/workspace/invites/:inviteId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveInvite),
);
router.delete(
  '/:projectId/workspace/invites/:inviteId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteInvite),
);
router.post(
  '/:projectId/workspace/hr',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveHrRecord),
);
router.put(
  '/:projectId/workspace/hr/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveHrRecord),
);
router.delete(
  '/:projectId/workspace/hr/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteHrRecord),
);
router.post(
  '/:projectId/workspace/files',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveWorkspaceFile),
);
router.put(
  '/:projectId/workspace/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.saveWorkspaceFile),
);
router.delete(
  '/:projectId/workspace/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.deleteWorkspaceFile),
);

export default router;
