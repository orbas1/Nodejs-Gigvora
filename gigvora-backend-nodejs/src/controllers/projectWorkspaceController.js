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
import { resolveRequestUserId } from '../utils/requestContext.js';
import { ensureManageAccess, ensureViewAccess, parseOwnerId } from '../utils/projectAccess.js';
import { Project } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requireNumber(value, label) {
  const parsed = parseNumber(value);
  if (parsed == null) {
    throw new ValidationError(`${label} must be a valid number.`);
  }
  return parsed;
}

function optionalNumber(value, label) {
  if (value == null || value === '') {
    return null;
  }
  return requireNumber(value, label);
}

function resolveActorId(req, payload = {}) {
  const candidate = payload.actorId ?? resolveRequestUserId(req);
  if (candidate == null || candidate === '') {
    return null;
  }
  return optionalNumber(candidate, 'actorId');
}

function requireOwnerId(req) {
  const ownerId = parseOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('A valid owner id is required for workspace access.');
  }
  return ownerId;
}

function requireProjectId(req) {
  return requireNumber(req.params?.projectId, 'projectId');
}

async function resolveProjectOwnerId(projectId) {
  const project = await Project.findByPk(projectId, { attributes: ['id', 'ownerId'] });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  const ownerId = parseNumber(project.ownerId);
  if (ownerId == null) {
    throw new ValidationError('Project owner could not be determined.');
  }
  return ownerId;
}

async function withProjectAccess(req, { requireManage = true } = {}) {
  const projectId = requireProjectId(req);
  const ownerId = await resolveProjectOwnerId(projectId);
  const access = requireManage ? ensureManageAccess(req, ownerId) : ensureViewAccess(req, ownerId);
  return { projectId, ownerId, access };
}

async function refreshWorkspace(ownerId, access, { includeDetails = true } = {}) {
  const snapshot = await getProjectWorkspaceOverview(ownerId, { includeDetails });
  return { ...snapshot, access };
}

async function respondWithWorkspace(res, ownerId, access, handler, { status = 200, key } = {}) {
  const result = await handler();
  const workspace = await refreshWorkspace(ownerId, access);
  const payload = { workspace };
  if (key && result !== undefined) {
    payload[key] = result;
  } else if (result !== undefined) {
    Object.assign(payload, result);
  }
  res.status(status).json(payload);
}

export async function show(req, res) {
  const { projectId, ownerId, access } = await withProjectAccess(req, { requireManage: false });
  const dashboard = await getWorkspaceDashboard(projectId);
  res.json({ ...dashboard, access });
}

export async function updateBrief(req, res) {
  const { projectId } = await withProjectAccess(req);
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await updateWorkspaceBrief(projectId, payload, { actorId });
  res.json(result);
}

export async function updateApproval(req, res) {
  const { projectId } = await withProjectAccess(req);
  const approvalId = requireNumber(req.params?.approvalId, 'approvalId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await updateWorkspaceApproval(projectId, approvalId, payload, { actorId });
  res.json(result);
}

export async function acknowledgeConversation(req, res) {
  const { projectId } = await withProjectAccess(req);
  const conversationId = requireNumber(req.params?.conversationId, 'conversationId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await acknowledgeWorkspaceConversation(projectId, conversationId, payload, { actorId });
  res.json(result);
}

export async function createConversationMessage(req, res) {
  const { projectId } = await withProjectAccess(req);
  const conversationId = requireNumber(req.params?.conversationId, 'conversationId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const message = await postWorkspaceConversationMessage(projectId, conversationId, payload, { actorId });
  res.status(201).json(message);
}

export async function saveBudget(req, res) {
  const { projectId } = await withProjectAccess(req);
  const budgetId = optionalNumber(req.params?.budgetId, 'budgetId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceBudget(projectId, budgetId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteBudget(req, res) {
  const { projectId } = await withProjectAccess(req);
  const budgetId = requireNumber(req.params?.budgetId, 'budgetId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceBudget(projectId, budgetId, { actorId });
  res.json(result);
}

export async function saveObject(req, res) {
  const { projectId } = await withProjectAccess(req);
  const objectId = optionalNumber(req.params?.objectId, 'objectId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceObject(projectId, objectId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteObject(req, res) {
  const { projectId } = await withProjectAccess(req);
  const objectId = requireNumber(req.params?.objectId, 'objectId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceObject(projectId, objectId, { actorId });
  res.json(result);
}

export async function saveTimelineEntry(req, res) {
  const { projectId } = await withProjectAccess(req);
  const entryId = optionalNumber(req.params?.entryId, 'entryId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceTimelineEntry(projectId, entryId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteTimelineEntry(req, res) {
  const { projectId } = await withProjectAccess(req);
  const entryId = requireNumber(req.params?.entryId, 'entryId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceTimelineEntry(projectId, entryId, { actorId });
  res.json(result);
}

export async function saveMeeting(req, res) {
  const { projectId } = await withProjectAccess(req);
  const meetingId = optionalNumber(req.params?.meetingId, 'meetingId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceMeeting(projectId, meetingId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteMeeting(req, res) {
  const { projectId } = await withProjectAccess(req);
  const meetingId = requireNumber(req.params?.meetingId, 'meetingId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceMeeting(projectId, meetingId, { actorId });
  res.json(result);
}

export async function saveRole(req, res) {
  const { projectId } = await withProjectAccess(req);
  const roleId = optionalNumber(req.params?.roleId, 'roleId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceRole(projectId, roleId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteRole(req, res) {
  const { projectId } = await withProjectAccess(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceRole(projectId, roleId, { actorId });
  res.json(result);
}

export async function saveSubmission(req, res) {
  const { projectId } = await withProjectAccess(req);
  const submissionId = optionalNumber(req.params?.submissionId, 'submissionId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceSubmission(projectId, submissionId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteSubmission(req, res) {
  const { projectId } = await withProjectAccess(req);
  const submissionId = requireNumber(req.params?.submissionId, 'submissionId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceSubmission(projectId, submissionId, { actorId });
  res.json(result);
}

export async function saveInvitation(req, res) {
  const { projectId } = await withProjectAccess(req);
  const inviteId = optionalNumber(req.params?.inviteId ?? req.params?.invitationId, 'inviteId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceInvite(projectId, inviteId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteInvitation(req, res) {
  const { projectId } = await withProjectAccess(req);
  const inviteId = requireNumber(req.params?.inviteId ?? req.params?.invitationId, 'inviteId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceInvite(projectId, inviteId, { actorId });
  res.json(result);
}

export async function saveHrRecord(req, res) {
  const { projectId } = await withProjectAccess(req);
  const recordId = optionalNumber(req.params?.recordId ?? req.params?.hrRecordId, 'recordId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceHrRecord(projectId, recordId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteHrRecord(req, res) {
  const { projectId } = await withProjectAccess(req);
  const recordId = requireNumber(req.params?.recordId ?? req.params?.hrRecordId, 'recordId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceHrRecord(projectId, recordId, { actorId });
  res.json(result);
}

export async function saveWorkspaceFile(req, res) {
  const { projectId } = await withProjectAccess(req);
  const fileId = optionalNumber(req.params?.fileId, 'fileId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await upsertWorkspaceFile(projectId, fileId, payload, { actorId });
  const status = req.method === 'POST' ? 201 : 200;
  res.status(status).json(result);
}

export async function deleteWorkspaceFile(req, res) {
  const { projectId } = await withProjectAccess(req);
  const fileId = requireNumber(req.params?.fileId, 'fileId');
  const payload = req.body ?? {};
  const actorId = resolveActorId(req, payload);
  const result = await removeWorkspaceFile(projectId, fileId, { actorId });
  res.json(result);
}

export async function overview(req, res) {
  const ownerId = requireOwnerId(req);
  const includeDetails = req.query?.includeDetails === 'false' ? false : true;
  const access = ensureViewAccess(req, ownerId);
  const snapshot = await getProjectWorkspaceOverview(ownerId, { includeDetails });
  res.json({ ...snapshot, access });
}

export async function storeProject(req, res) {
  const ownerId = requireOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createWorkspaceProject(ownerId, req.body ?? {}), {
    status: 201,
    key: 'project',
  });
}

export async function updateProject(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => updateProjectDetails(ownerId, projectId, req.body ?? {}), {
    key: 'project',
  });
}

export async function storeBudgetLine(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createBudgetLine(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'budgetLine',
  });
}

export async function patchBudgetLine(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const budgetLineId = requireNumber(req.params?.budgetLineId, 'budgetLineId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateBudgetLine(ownerId, projectId, budgetLineId, req.body ?? {}),
    { key: 'budgetLine' },
  );
}

export async function destroyBudgetLine(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const budgetLineId = requireNumber(req.params?.budgetLineId, 'budgetLineId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteBudgetLine(ownerId, projectId, budgetLineId));
}

export async function storeDeliverable(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createDeliverable(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'deliverable',
  });
}

export async function patchDeliverable(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const deliverableId = requireNumber(req.params?.deliverableId, 'deliverableId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateDeliverable(ownerId, projectId, deliverableId, req.body ?? {}),
    { key: 'deliverable' },
  );
}

export async function destroyDeliverable(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const deliverableId = requireNumber(req.params?.deliverableId, 'deliverableId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteDeliverable(ownerId, projectId, deliverableId));
}

export async function storeTask(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createTask(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'task',
  });
}

export async function patchTask(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => updateTask(ownerId, projectId, taskId, req.body ?? {}), {
    key: 'task',
  });
}

export async function destroyTask(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteTask(ownerId, projectId, taskId));
}

export async function storeTaskAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => assignTask(ownerId, projectId, taskId, req.body ?? {}),
    { status: 201, key: 'assignment' },
  );
}

export async function patchTaskAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const assignmentId = requireNumber(req.params?.assignmentId, 'assignmentId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateTaskAssignment(ownerId, projectId, taskId, assignmentId, req.body ?? {}),
    { key: 'assignment' },
  );
}

export async function destroyTaskAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const assignmentId = requireNumber(req.params?.assignmentId, 'assignmentId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => removeTaskAssignment(ownerId, projectId, taskId, assignmentId),
  );
}

export async function storeTaskDependency(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => createTaskDependency(ownerId, projectId, taskId, req.body ?? {}),
    { status: 201, key: 'dependency' },
  );
}

export async function destroyTaskDependency(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const taskId = requireNumber(req.params?.taskId, 'taskId');
  const dependencyId = requireNumber(req.params?.dependencyId, 'dependencyId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => removeTaskDependency(ownerId, projectId, taskId, dependencyId));
}

export async function storeChatMessage(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => postChatMessage(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'message',
  });
}

export async function patchChatMessage(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const messageId = requireNumber(req.params?.messageId, 'messageId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateChatMessage(ownerId, projectId, messageId, req.body ?? {}),
    { key: 'message' },
  );
}

export async function destroyChatMessage(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const messageId = requireNumber(req.params?.messageId, 'messageId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteChatMessage(ownerId, projectId, messageId));
}

export async function storeTimelineEntry(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createTimelineEntry(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'entry',
  });
}

export async function patchTimelineEntry(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const entryId = requireNumber(req.params?.entryId, 'entryId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateTimelineEntry(ownerId, projectId, entryId, req.body ?? {}),
    { key: 'entry' },
  );
}

export async function destroyTimelineEntry(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const entryId = requireNumber(req.params?.entryId, 'entryId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteTimelineEntry(ownerId, projectId, entryId));
}

export async function storeMeeting(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => scheduleMeeting(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'meeting',
  });
}

export async function patchMeeting(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const meetingId = requireNumber(req.params?.meetingId, 'meetingId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateMeeting(ownerId, projectId, meetingId, req.body ?? {}),
    { key: 'meeting' },
  );
}

export async function destroyMeeting(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const meetingId = requireNumber(req.params?.meetingId, 'meetingId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteMeeting(ownerId, projectId, meetingId));
}

export async function storeCalendarEvent(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createCalendarEvent(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'event',
  });
}

export async function patchCalendarEvent(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const eventId = requireNumber(req.params?.eventId, 'eventId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateCalendarEvent(ownerId, projectId, eventId, req.body ?? {}),
    { key: 'event' },
  );
}

export async function destroyCalendarEvent(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const eventId = requireNumber(req.params?.eventId, 'eventId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteCalendarEvent(ownerId, projectId, eventId));
}

export async function storeRoleDefinition(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createRoleDefinition(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'role',
  });
}

export async function patchRoleDefinition(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateRoleDefinition(ownerId, projectId, roleId, req.body ?? {}),
    { key: 'role' },
  );
}

export async function destroyRoleDefinition(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteRoleDefinition(ownerId, projectId, roleId));
}

export async function storeRoleAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => assignRole(ownerId, projectId, roleId, req.body ?? {}),
    { status: 201, key: 'assignment' },
  );
}

export async function patchRoleAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const assignmentId = requireNumber(req.params?.assignmentId, 'assignmentId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateRoleAssignment(ownerId, projectId, roleId, assignmentId, req.body ?? {}),
    { key: 'assignment' },
  );
}

export async function destroyRoleAssignment(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const roleId = requireNumber(req.params?.roleId, 'roleId');
  const assignmentId = requireNumber(req.params?.assignmentId, 'assignmentId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => removeRoleAssignment(ownerId, projectId, roleId, assignmentId),
  );
}

export async function storeSubmission(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createSubmission(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'submission',
  });
}

export async function patchSubmission(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const submissionId = requireNumber(req.params?.submissionId, 'submissionId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateSubmission(ownerId, projectId, submissionId, req.body ?? {}),
    { key: 'submission' },
  );
}

export async function destroySubmission(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const submissionId = requireNumber(req.params?.submissionId, 'submissionId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteSubmission(ownerId, projectId, submissionId));
}

export async function storeFile(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createFile(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'file',
  });
}

export async function patchFile(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const fileId = requireNumber(req.params?.fileId, 'fileId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateFile(ownerId, projectId, fileId, req.body ?? {}),
    { key: 'file' },
  );
}

export async function destroyFile(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const fileId = requireNumber(req.params?.fileId, 'fileId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteFile(ownerId, projectId, fileId));
}

export async function storeInvitation(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createInvitation(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'invitation',
  });
}

export async function patchInvitation(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const invitationId = requireNumber(req.params?.invitationId ?? req.params?.inviteId, 'invitationId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateInvitation(ownerId, projectId, invitationId, req.body ?? {}),
    { key: 'invitation' },
  );
}

export async function destroyInvitation(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const invitationId = requireNumber(req.params?.invitationId ?? req.params?.inviteId, 'invitationId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteInvitation(ownerId, projectId, invitationId));
}

export async function storeHrRecord(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => createHrRecord(ownerId, projectId, req.body ?? {}), {
    status: 201,
    key: 'hrRecord',
  });
}

export async function patchHrRecord(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const recordId = requireNumber(req.params?.hrRecordId ?? req.params?.recordId, 'hrRecordId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(
    res,
    ownerId,
    access,
    () => updateHrRecord(ownerId, projectId, recordId, req.body ?? {}),
    { key: 'hrRecord' },
  );
}

export async function destroyHrRecord(req, res) {
  const ownerId = requireOwnerId(req);
  const projectId = requireProjectId(req);
  const recordId = requireNumber(req.params?.hrRecordId ?? req.params?.recordId, 'hrRecordId');
  const access = ensureManageAccess(req, ownerId);
  await respondWithWorkspace(res, ownerId, access, () => deleteHrRecord(ownerId, projectId, recordId));
}

export const saveInvite = saveInvitation;
export const deleteInvite = deleteInvitation;

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
  saveInvitation,
  deleteInvitation,
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
