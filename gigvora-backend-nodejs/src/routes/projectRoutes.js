import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectController from '../controllers/projectController.js';
import projectBlueprintController from '../controllers/projectBlueprintController.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';
import projectOperationsController from '../controllers/projectOperationsController.js';
import projectWorkspaceManagementController from '../controllers/projectWorkspaceManagementController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';
import validateRequest from '../middleware/validateRequest.js';
import { authenticateRequest } from '../middleware/authentication.js';
import {
  createProjectBodySchema,
  updateProjectBodySchema,
  projectIdParamsSchema,
  projectEventsQuerySchema,
  projectAutoAssignBodySchema,
} from '../validation/schemas/projectSchemas.js';

const router = Router();

router.use(authenticateRequest());

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
router.post('/:projectId/operations/budgets', requireProjectManagementRole, asyncHandler(projectOperationsController.createBudget));
router.patch(
  '/:projectId/operations/budgets/:budgetId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateBudget),
);
router.delete(
  '/:projectId/operations/budgets/:budgetId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteBudget),
);
router.post('/:projectId/operations/objects', requireProjectManagementRole, asyncHandler(projectOperationsController.createObject));
router.patch(
  '/:projectId/operations/objects/:objectId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateObject),
);
router.delete(
  '/:projectId/operations/objects/:objectId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteObject),
);
router.post(
  '/:projectId/operations/timeline/events',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.createTimelineEvent),
);
router.patch(
  '/:projectId/operations/timeline/events/:eventId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateTimelineEvent),
);
router.delete(
  '/:projectId/operations/timeline/events/:eventId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteTimelineEvent),
);
router.post('/:projectId/operations/meetings', requireProjectManagementRole, asyncHandler(projectOperationsController.createMeeting));
router.patch(
  '/:projectId/operations/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateMeeting),
);
router.delete(
  '/:projectId/operations/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteMeeting),
);
router.post(
  '/:projectId/operations/calendar',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.createCalendarEntry),
);
router.patch(
  '/:projectId/operations/calendar/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateCalendarEntry),
);
router.delete(
  '/:projectId/operations/calendar/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteCalendarEntry),
);
router.post('/:projectId/operations/roles', requireProjectManagementRole, asyncHandler(projectOperationsController.createRole));
router.patch(
  '/:projectId/operations/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateRole),
);
router.delete(
  '/:projectId/operations/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteRole),
);
router.post(
  '/:projectId/operations/submissions',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.createSubmission),
);
router.patch(
  '/:projectId/operations/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateSubmission),
);
router.delete(
  '/:projectId/operations/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteSubmission),
);
router.post('/:projectId/operations/invites', requireProjectManagementRole, asyncHandler(projectOperationsController.createInvite));
router.patch(
  '/:projectId/operations/invites/:inviteId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateInvite),
);
router.delete(
  '/:projectId/operations/invites/:inviteId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteInvite),
);
router.post('/:projectId/operations/hr', requireProjectManagementRole, asyncHandler(projectOperationsController.createHrRecord));
router.patch(
  '/:projectId/operations/hr/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateHrRecord),
);
router.delete(
  '/:projectId/operations/hr/:recordId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteHrRecord),
);
router.post(
  '/:projectId/operations/time-logs',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.createTimeLog),
);
router.patch(
  '/:projectId/operations/time-logs/:logId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateTimeLog),
);
router.delete(
  '/:projectId/operations/time-logs/:logId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteTimeLog),
);
router.post('/:projectId/operations/targets', requireProjectManagementRole, asyncHandler(projectOperationsController.createTarget));
router.patch(
  '/:projectId/operations/targets/:targetId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateTarget),
);
router.delete(
  '/:projectId/operations/targets/:targetId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteTarget),
);
router.post(
  '/:projectId/operations/objectives',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.createObjective),
);
router.patch(
  '/:projectId/operations/objectives/:objectiveId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateObjective),
);
router.delete(
  '/:projectId/operations/objectives/:objectiveId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteObjective),
);
router.post(
  '/:projectId/operations/conversations/:conversationId/messages',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.postConversationMessage),
);
router.post('/:projectId/operations/files', requireProjectManagementRole, asyncHandler(projectOperationsController.createFile));
router.patch(
  '/:projectId/operations/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.updateFile),
);
router.delete(
  '/:projectId/operations/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectOperationsController.deleteFile),
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
