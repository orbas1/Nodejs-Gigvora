import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import projectWorkspaceController from '../controllers/projectWorkspaceController.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(projectWorkspaceController.overview));

router.post('/projects', requireProjectManagementRole, asyncHandler(projectWorkspaceController.storeProject));
router.patch(
  '/projects/:projectId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.updateProject),
);

router.post(
  '/projects/:projectId/budget-lines',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeBudgetLine),
);
router.patch(
  '/projects/:projectId/budget-lines/:budgetLineId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchBudgetLine),
);
router.delete(
  '/projects/:projectId/budget-lines/:budgetLineId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyBudgetLine),
);

router.post(
  '/projects/:projectId/deliverables',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeDeliverable),
);
router.patch(
  '/projects/:projectId/deliverables/:deliverableId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchDeliverable),
);
router.delete(
  '/projects/:projectId/deliverables/:deliverableId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyDeliverable),
);

router.post(
  '/projects/:projectId/tasks',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeTask),
);
router.patch(
  '/projects/:projectId/tasks/:taskId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchTask),
);
router.delete(
  '/projects/:projectId/tasks/:taskId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyTask),
);

router.post(
  '/projects/:projectId/tasks/:taskId/assignments',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeTaskAssignment),
);
router.patch(
  '/projects/:projectId/tasks/:taskId/assignments/:assignmentId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchTaskAssignment),
);
router.delete(
  '/projects/:projectId/tasks/:taskId/assignments/:assignmentId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyTaskAssignment),
);

router.post(
  '/projects/:projectId/tasks/:taskId/dependencies',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeTaskDependency),
);
router.delete(
  '/projects/:projectId/tasks/:taskId/dependencies/:dependencyId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyTaskDependency),
);

router.post(
  '/projects/:projectId/chat/messages',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeChatMessage),
);
router.patch(
  '/projects/:projectId/chat/messages/:messageId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchChatMessage),
);
router.delete(
  '/projects/:projectId/chat/messages/:messageId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyChatMessage),
);

router.post(
  '/projects/:projectId/timeline',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeTimelineEntry),
);
router.patch(
  '/projects/:projectId/timeline/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchTimelineEntry),
);
router.delete(
  '/projects/:projectId/timeline/:entryId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyTimelineEntry),
);

router.post(
  '/projects/:projectId/meetings',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeMeeting),
);
router.patch(
  '/projects/:projectId/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchMeeting),
);
router.delete(
  '/projects/:projectId/meetings/:meetingId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyMeeting),
);

router.post(
  '/projects/:projectId/calendar-events',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeCalendarEvent),
);
router.patch(
  '/projects/:projectId/calendar-events/:eventId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchCalendarEvent),
);
router.delete(
  '/projects/:projectId/calendar-events/:eventId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyCalendarEvent),
);

router.post(
  '/projects/:projectId/roles',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeRoleDefinition),
);
router.patch(
  '/projects/:projectId/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchRoleDefinition),
);
router.delete(
  '/projects/:projectId/roles/:roleId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyRoleDefinition),
);

router.post(
  '/projects/:projectId/roles/:roleId/assignments',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeRoleAssignment),
);
router.patch(
  '/projects/:projectId/roles/:roleId/assignments/:assignmentId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchRoleAssignment),
);
router.delete(
  '/projects/:projectId/roles/:roleId/assignments/:assignmentId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyRoleAssignment),
);

router.post(
  '/projects/:projectId/submissions',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeSubmission),
);
router.patch(
  '/projects/:projectId/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchSubmission),
);
router.delete(
  '/projects/:projectId/submissions/:submissionId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroySubmission),
);

router.post(
  '/projects/:projectId/files',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeFile),
);
router.patch(
  '/projects/:projectId/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchFile),
);
router.delete(
  '/projects/:projectId/files/:fileId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyFile),
);

router.post(
  '/projects/:projectId/invitations',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeInvitation),
);
router.patch(
  '/projects/:projectId/invitations/:invitationId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchInvitation),
);
router.delete(
  '/projects/:projectId/invitations/:invitationId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyInvitation),
);

router.post(
  '/projects/:projectId/hr-records',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.storeHrRecord),
);
router.patch(
  '/projects/:projectId/hr-records/:hrRecordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.patchHrRecord),
);
router.delete(
  '/projects/:projectId/hr-records/:hrRecordId',
  requireProjectManagementRole,
  asyncHandler(projectWorkspaceController.destroyHrRecord),
);

export default router;
