import {
  getWorkspaceDashboard,
  updateWorkspaceBrief,
  updateWorkspaceApproval,
  acknowledgeWorkspaceConversation,
  upsertWorkspaceBudget,
  removeWorkspaceBudget,
  upsertWorkspaceObject,
  removeWorkspaceObject,
  upsertWorkspaceTimelineEntry,
  removeWorkspaceTimelineEntry,
  upsertWorkspaceMeeting,
  removeWorkspaceMeeting,
  upsertWorkspaceRole,
  removeWorkspaceRole,
  upsertWorkspaceSubmission,
  removeWorkspaceSubmission,
  upsertWorkspaceInvite,
  removeWorkspaceInvite,
  upsertWorkspaceHrRecord,
  removeWorkspaceHrRecord,
  postWorkspaceConversationMessage,
  upsertWorkspaceFile,
  removeWorkspaceFile,
} from '../services/projectWorkspaceService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
  getProjectWorkspaceOverview,
  createWorkspaceProject,
  updateProjectDetails,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskAssignment,
  removeTaskAssignment,
  createTaskDependency,
  removeTaskDependency,
  postChatMessage,
  updateChatMessage,
  deleteChatMessage,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createRoleDefinition,
  updateRoleDefinition,
  deleteRoleDefinition,
  assignRole,
  updateRoleAssignment,
  removeRoleAssignment,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  createFile,
  updateFile,
  deleteFile,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  createHrRecord,
  updateHrRecord,
  deleteHrRecord,
} from '../services/projectWorkspaceService.js';
import { ensureManageAccess, ensureViewAccess, parseOwnerId } from '../utils/projectAccess.js';

async function withWorkspaceRefresh(ownerId, access, handler) {
  const result = await handler();
  const snapshot = await getProjectWorkspaceOverview(ownerId, { includeDetails: true });
  return { result, snapshot: { ...snapshot, access } };
}

export async function overview(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureViewAccess(req, ownerId);
  const snapshot = await getProjectWorkspaceOverview(ownerId, { includeDetails: true });
  res.json({ ...snapshot, access });
}

export async function updateBrief(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await updateWorkspaceBrief(parseNumber(projectId, projectId), payload, { actorId });
  res.json(result);
}

export async function updateApproval(req, res) {
  const { projectId, approvalId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await updateWorkspaceApproval(
    parseNumber(projectId, projectId),
    parseNumber(approvalId, approvalId),
    payload,
    { actorId },
export async function storeProject(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createWorkspaceProject(ownerId, req.body),
  );
  res.status(201).json({ project: result, workspace: snapshot });
}

export async function updateProject(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateProjectDetails(ownerId, projectId, req.body),
  );
  res.json({ project: result, workspace: snapshot });
}

export async function storeBudgetLine(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createBudgetLine(ownerId, projectId, req.body),
  );
  res.status(201).json({ budgetLine: result, workspace: snapshot });
}

export async function patchBudgetLine(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const budgetLineId = Number.parseInt(req.params?.budgetLineId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateBudgetLine(ownerId, projectId, budgetLineId, req.body),
  );
  res.json({ budgetLine: result, workspace: snapshot });
}

export async function destroyBudgetLine(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const budgetLineId = Number.parseInt(req.params?.budgetLineId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteBudgetLine(ownerId, projectId, budgetLineId),
  );
  res.json({ workspace: snapshot });
}

export async function storeDeliverable(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createDeliverable(ownerId, projectId, req.body),
  );
  res.status(201).json({ deliverable: result, workspace: snapshot });
}

export async function patchDeliverable(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const deliverableId = Number.parseInt(req.params?.deliverableId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateDeliverable(ownerId, projectId, deliverableId, req.body),
  );
  res.json({ deliverable: result, workspace: snapshot });
}

export async function destroyDeliverable(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const deliverableId = Number.parseInt(req.params?.deliverableId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteDeliverable(ownerId, projectId, deliverableId),
  );
  res.json({ workspace: snapshot });
}

export async function storeTask(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createTask(ownerId, projectId, req.body),
  );
  res.status(201).json({ task: result, workspace: snapshot });
}

export async function patchTask(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateTask(ownerId, projectId, taskId, req.body),
  );
  res.json({ task: result, workspace: snapshot });
}

export async function destroyTask(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteTask(ownerId, projectId, taskId),
  );
  res.json({ workspace: snapshot });
}

export async function storeTaskAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    assignTask(ownerId, projectId, taskId, req.body),
  );
  res.status(201).json({ assignment: result, workspace: snapshot });
}

export async function patchTaskAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const assignmentId = Number.parseInt(req.params?.assignmentId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateTaskAssignment(ownerId, projectId, taskId, assignmentId, req.body),
  );
  res.json({ assignment: result, workspace: snapshot });
}

export async function destroyTaskAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const assignmentId = Number.parseInt(req.params?.assignmentId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    removeTaskAssignment(ownerId, projectId, taskId, assignmentId),
  );
  res.json({ workspace: snapshot });
}

export async function storeTaskDependency(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createTaskDependency(ownerId, projectId, taskId, req.body),
  );
  res.status(201).json({ dependency: result, workspace: snapshot });
}

export async function destroyTaskDependency(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const taskId = Number.parseInt(req.params?.taskId, 10);
  const dependencyId = Number.parseInt(req.params?.dependencyId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    removeTaskDependency(ownerId, projectId, taskId, dependencyId),
  );
  res.json({ workspace: snapshot });
}

export async function storeChatMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    postChatMessage(ownerId, projectId, req.body),
  );
  res.status(201).json({ message: result, workspace: snapshot });
}

export async function patchChatMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const messageId = Number.parseInt(req.params?.messageId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateChatMessage(ownerId, projectId, messageId, req.body),
  );
  res.json({ message: result, workspace: snapshot });
}

export async function destroyChatMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const messageId = Number.parseInt(req.params?.messageId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteChatMessage(ownerId, projectId, messageId),
  );
  res.json({ workspace: snapshot });
}

export async function storeTimelineEntry(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createTimelineEntry(ownerId, projectId, req.body),
  );
  res.status(201).json({ entry: result, workspace: snapshot });
}

export async function patchTimelineEntry(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const entryId = Number.parseInt(req.params?.entryId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateTimelineEntry(ownerId, projectId, entryId, req.body),
  );
  res.json({ entry: result, workspace: snapshot });
}

export async function destroyTimelineEntry(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const entryId = Number.parseInt(req.params?.entryId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteTimelineEntry(ownerId, projectId, entryId),
  );
  res.json({ workspace: snapshot });
}

export async function storeMeeting(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    scheduleMeeting(ownerId, projectId, req.body),
  );
  res.status(201).json({ meeting: result, workspace: snapshot });
}

export async function patchMeeting(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const meetingId = Number.parseInt(req.params?.meetingId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateMeeting(ownerId, projectId, meetingId, req.body),
  );
  res.json({ meeting: result, workspace: snapshot });
}

export async function destroyMeeting(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const meetingId = Number.parseInt(req.params?.meetingId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteMeeting(ownerId, projectId, meetingId),
  );
  res.json({ workspace: snapshot });
}

export async function storeCalendarEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createCalendarEvent(ownerId, projectId, req.body),
  );
  res.status(201).json({ event: result, workspace: snapshot });
}

export async function patchCalendarEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const eventId = Number.parseInt(req.params?.eventId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateCalendarEvent(ownerId, projectId, eventId, req.body),
  );
  res.json({ event: result, workspace: snapshot });
}

export async function destroyCalendarEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const eventId = Number.parseInt(req.params?.eventId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteCalendarEvent(ownerId, projectId, eventId),
  );
  res.json({ workspace: snapshot });
}

export async function storeRoleDefinition(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createRoleDefinition(ownerId, projectId, req.body),
  );
  res.status(201).json({ role: result, workspace: snapshot });
}

export async function patchRoleDefinition(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const roleId = Number.parseInt(req.params?.roleId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateRoleDefinition(ownerId, projectId, roleId, req.body),
  );
  res.json({ role: result, workspace: snapshot });
}

export async function destroyRoleDefinition(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const roleId = Number.parseInt(req.params?.roleId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteRoleDefinition(ownerId, projectId, roleId),
  );
  res.json({ workspace: snapshot });
}

export async function storeRoleAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const roleId = Number.parseInt(req.params?.roleId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    assignRole(ownerId, projectId, roleId, req.body),
  );
  res.status(201).json({ assignment: result, workspace: snapshot });
}

export async function patchRoleAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const roleId = Number.parseInt(req.params?.roleId, 10);
  const assignmentId = Number.parseInt(req.params?.assignmentId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateRoleAssignment(ownerId, projectId, roleId, assignmentId, req.body),
  );
  res.json({ assignment: result, workspace: snapshot });
}

export async function destroyRoleAssignment(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const roleId = Number.parseInt(req.params?.roleId, 10);
  const assignmentId = Number.parseInt(req.params?.assignmentId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    removeRoleAssignment(ownerId, projectId, roleId, assignmentId),
  );
  res.json({ workspace: snapshot });
}

export async function storeSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createSubmission(ownerId, projectId, req.body),
  );
  res.status(201).json({ submission: result, workspace: snapshot });
}

export async function patchSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const submissionId = Number.parseInt(req.params?.submissionId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateSubmission(ownerId, projectId, submissionId, req.body),
  );
  res.json({ submission: result, workspace: snapshot });
}

export async function destroySubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const submissionId = Number.parseInt(req.params?.submissionId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteSubmission(ownerId, projectId, submissionId),
  );
  res.json({ workspace: snapshot });
}

export async function storeFile(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createFile(ownerId, projectId, req.body),
  );
  res.status(201).json({ file: result, workspace: snapshot });
}

export async function patchFile(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const fileId = Number.parseInt(req.params?.fileId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateFile(ownerId, projectId, fileId, req.body),
  );
  res.json({ file: result, workspace: snapshot });
}

export async function destroyFile(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const fileId = Number.parseInt(req.params?.fileId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteFile(ownerId, projectId, fileId),
  );
  res.json({ workspace: snapshot });
}

export async function storeInvitation(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createInvitation(ownerId, projectId, req.body),
  );
  res.status(201).json({ invitation: result, workspace: snapshot });
}

export async function patchInvitation(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const invitationId = Number.parseInt(req.params?.invitationId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateInvitation(ownerId, projectId, invitationId, req.body),
  );
  res.json({ invitation: result, workspace: snapshot });
}

export async function destroyInvitation(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const invitationId = Number.parseInt(req.params?.invitationId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteInvitation(ownerId, projectId, invitationId),
  );
  res.json({ workspace: snapshot });
}

export async function storeHrRecord(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    createHrRecord(ownerId, projectId, req.body),
  );
  res.status(201).json({ hrRecord: result, workspace: snapshot });
}

export async function patchHrRecord(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const hrRecordId = Number.parseInt(req.params?.hrRecordId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    updateHrRecord(ownerId, projectId, hrRecordId, req.body),
  );
  res.json({ hrRecord: result, workspace: snapshot });
}

export async function acknowledgeConversation(req, res) {
  const { projectId, conversationId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await acknowledgeWorkspaceConversation(
    parseNumber(projectId, projectId),
    parseNumber(conversationId, conversationId),
    payload,
    { actorId },
export async function destroyHrRecord(req, res) {
  const ownerId = parseOwnerId(req);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const hrRecordId = Number.parseInt(req.params?.hrRecordId, 10);
  const access = ensureManageAccess(req, ownerId);
  const { snapshot } = await withWorkspaceRefresh(ownerId, access, () =>
    deleteHrRecord(ownerId, projectId, hrRecordId),
  );
  res.json({ workspace: snapshot });
}

export async function saveBudget(req, res) {
  const { projectId, budgetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceBudget(
    parseNumber(projectId, projectId),
    budgetId != null ? parseNumber(budgetId, budgetId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteBudget(req, res) {
  const { projectId, budgetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceBudget(
    parseNumber(projectId, projectId),
    parseNumber(budgetId, budgetId),
    { actorId },
  );
  res.json(result);
}

export async function saveObject(req, res) {
  const { projectId, objectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceObject(
    parseNumber(projectId, projectId),
    objectId != null ? parseNumber(objectId, objectId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteObject(req, res) {
  const { projectId, objectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceObject(
    parseNumber(projectId, projectId),
    parseNumber(objectId, objectId),
    { actorId },
  );
  res.json(result);
}

export async function saveTimelineEntry(req, res) {
  const { projectId, entryId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceTimelineEntry(
    parseNumber(projectId, projectId),
    entryId != null ? parseNumber(entryId, entryId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteTimelineEntry(req, res) {
  const { projectId, entryId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceTimelineEntry(
    parseNumber(projectId, projectId),
    parseNumber(entryId, entryId),
    { actorId },
  );
  res.json(result);
}

export async function saveMeeting(req, res) {
  const { projectId, meetingId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceMeeting(
    parseNumber(projectId, projectId),
    meetingId != null ? parseNumber(meetingId, meetingId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteMeeting(req, res) {
  const { projectId, meetingId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceMeeting(
    parseNumber(projectId, projectId),
    parseNumber(meetingId, meetingId),
    { actorId },
  );
  res.json(result);
}

export async function saveRole(req, res) {
  const { projectId, roleId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceRole(
    parseNumber(projectId, projectId),
    roleId != null ? parseNumber(roleId, roleId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteRole(req, res) {
  const { projectId, roleId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceRole(
    parseNumber(projectId, projectId),
    parseNumber(roleId, roleId),
    { actorId },
  );
  res.json(result);
}

export async function saveSubmission(req, res) {
  const { projectId, submissionId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceSubmission(
    parseNumber(projectId, projectId),
    submissionId != null ? parseNumber(submissionId, submissionId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteSubmission(req, res) {
  const { projectId, submissionId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceSubmission(
    parseNumber(projectId, projectId),
    parseNumber(submissionId, submissionId),
    { actorId },
  );
  res.json(result);
}

export async function saveInvite(req, res) {
  const { projectId, inviteId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceInvite(
    parseNumber(projectId, projectId),
    inviteId != null ? parseNumber(inviteId, inviteId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteInvite(req, res) {
  const { projectId, inviteId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceInvite(
    parseNumber(projectId, projectId),
    parseNumber(inviteId, inviteId),
    { actorId },
  );
  res.json(result);
}

export async function saveHrRecord(req, res) {
  const { projectId, recordId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceHrRecord(
    parseNumber(projectId, projectId),
    recordId != null ? parseNumber(recordId, recordId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteHrRecord(req, res) {
  const { projectId, recordId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceHrRecord(
    parseNumber(projectId, projectId),
    parseNumber(recordId, recordId),
    { actorId },
  );
  res.json(result);
}

export async function createConversationMessage(req, res) {
  const { projectId, conversationId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const message = await postWorkspaceConversationMessage(
    parseNumber(projectId, projectId),
    parseNumber(conversationId, conversationId),
    payload,
    { actorId },
  );
  res.status(201).json(message);
}

export async function saveWorkspaceFile(req, res) {
  const { projectId, fileId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await upsertWorkspaceFile(
    parseNumber(projectId, projectId),
    fileId != null ? parseNumber(fileId, fileId) : null,
    payload,
    { actorId },
  );
  res.json(result);
}

export async function deleteWorkspaceFile(req, res) {
  const { projectId, fileId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? resolveRequestUserId(req));
  const result = await removeWorkspaceFile(
    parseNumber(projectId, projectId),
    parseNumber(fileId, fileId),
    { actorId },
  );
  res.json(result);
}

export default {
  show,
  updateBrief,
  updateApproval,
  acknowledgeConversation,
  saveBudget,
  deleteBudget,
  saveObject,
  deleteObject,
  saveTimelineEntry,
  deleteTimelineEntry,
  saveMeeting,
  deleteMeeting,
  saveRole,
  deleteRole,
  saveSubmission,
  deleteSubmission,
  saveInvite,
  deleteInvite,
  saveHrRecord,
  deleteHrRecord,
  createConversationMessage,
  saveWorkspaceFile,
  deleteWorkspaceFile,
  overview,
  storeProject,
  updateProject,
  storeBudgetLine,
  patchBudgetLine,
  destroyBudgetLine,
  storeDeliverable,
  patchDeliverable,
  destroyDeliverable,
  storeTask,
  patchTask,
  destroyTask,
  storeTaskAssignment,
  patchTaskAssignment,
  destroyTaskAssignment,
  storeTaskDependency,
  destroyTaskDependency,
  storeChatMessage,
  patchChatMessage,
  destroyChatMessage,
  storeTimelineEntry,
  patchTimelineEntry,
  destroyTimelineEntry,
  storeMeeting,
  patchMeeting,
  destroyMeeting,
  storeCalendarEvent,
  patchCalendarEvent,
  destroyCalendarEvent,
  storeRoleDefinition,
  patchRoleDefinition,
  destroyRoleDefinition,
  storeRoleAssignment,
  patchRoleAssignment,
  destroyRoleAssignment,
  storeSubmission,
  patchSubmission,
  destroySubmission,
  storeFile,
  patchFile,
  destroyFile,
  storeInvitation,
  patchInvitation,
  destroyInvitation,
  storeHrRecord,
  patchHrRecord,
  destroyHrRecord,
};
