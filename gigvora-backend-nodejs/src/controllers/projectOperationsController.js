import {
  getProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  removeProjectTask,
  createProjectBudget,
  updateProjectBudget,
  deleteProjectBudget,
  createProjectObject,
  updateProjectObject,
  deleteProjectObject,
  createProjectTimelineEvent,
  updateProjectTimelineEvent,
  deleteProjectTimelineEvent,
  createProjectMeeting,
  updateProjectMeeting,
  deleteProjectMeeting,
  createProjectCalendarEntry,
  updateProjectCalendarEntry,
  deleteProjectCalendarEntry,
  createProjectRole,
  updateProjectRole,
  deleteProjectRole,
  createProjectSubmission,
  updateProjectSubmission,
  deleteProjectSubmission,
  createProjectInvite,
  updateProjectInvite,
  deleteProjectInvite,
  createProjectHrRecord,
  updateProjectHrRecord,
  deleteProjectHrRecord,
  createProjectTimeLog,
  updateProjectTimeLog,
  deleteProjectTimeLog,
  createProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
  createProjectObjective,
  updateProjectObjective,
  deleteProjectObjective,
  createConversationMessage,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
} from '../services/projectOperationsService.js';
import {
  ensureProjectManagementAccess,
  sanitizeActorPayload,
  respondWithAccess,
  parseParamId,
  parsePositiveInteger,
} from '../utils/controllerAccess.js';

function parseProjectId(req) {
  return parseParamId(req, 'projectId', 'projectId');
}

function parseOptionalParam(req, name, label) {
  return parsePositiveInteger(req.params?.[name], label, { optional: true });
}

function parseRequiredParam(req, name, label) {
  const parsed = parsePositiveInteger(req.params?.[name], label);
  if (parsed == null) {
    throw new Error('Unreachable: parsePositiveInteger should throw on invalid input.');
  }
  return parsed;
}

function actorContext(req, access) {
  const { actorId, payload } = sanitizeActorPayload(req.body, access);
  return { actorId, payload };
}

function respond(res, data, access, options = {}) {
  respondWithAccess(res, data, access, options);
}

export async function show(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const operations = await getProjectOperations(projectId);
  respond(res, { projectId, operations }, access);
}

export async function upsert(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const operations = await updateProjectOperations(projectId, payload, { actorId });
  respond(res, { projectId, operations }, access, { performedBy: actorId });
}

export async function addTask(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const task = await addProjectTask(projectId, payload, { actorId });
  respond(res, { projectId, task }, access, { status: 201, performedBy: actorId });
}

export async function updateTask(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const taskId = parseRequiredParam(req, 'taskId', 'taskId');
  const { actorId, payload } = actorContext(req, access);
  const task = await updateProjectTask(projectId, taskId, payload, { actorId });
  respond(res, { projectId, taskId, task }, access, { performedBy: actorId });
}

export async function removeTask(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const taskId = parseRequiredParam(req, 'taskId', 'taskId');
  const { actorId } = actorContext(req, access);
  const result = await removeProjectTask(projectId, taskId, { actorId });
  respond(res, { projectId, taskId, result }, access, { performedBy: actorId });
}

export async function createBudget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const budget = await createProjectBudget(projectId, payload, { actorId });
  respond(res, { projectId, budget }, access, { status: 201, performedBy: actorId });
}

export async function updateBudget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const budgetId = parseRequiredParam(req, 'budgetId', 'budgetId');
  const { actorId, payload } = actorContext(req, access);
  const budget = await updateProjectBudget(projectId, budgetId, payload, { actorId });
  respond(res, { projectId, budgetId, budget }, access, { performedBy: actorId });
}

export async function deleteBudget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const budgetId = parseRequiredParam(req, 'budgetId', 'budgetId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectBudget(projectId, budgetId, { actorId });
  respond(res, { projectId, budgetId, result }, access, { performedBy: actorId });
}

export async function createObject(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const object = await createProjectObject(projectId, payload, { actorId });
  respond(res, { projectId, object }, access, { status: 201, performedBy: actorId });
}

export async function updateObject(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const objectId = parseRequiredParam(req, 'objectId', 'objectId');
  const { actorId, payload } = actorContext(req, access);
  const object = await updateProjectObject(projectId, objectId, payload, { actorId });
  respond(res, { projectId, objectId, object }, access, { performedBy: actorId });
}

export async function deleteObject(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const objectId = parseRequiredParam(req, 'objectId', 'objectId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectObject(projectId, objectId, { actorId });
  respond(res, { projectId, objectId, result }, access, { performedBy: actorId });
}

export async function createTimelineEvent(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const event = await createProjectTimelineEvent(projectId, payload, { actorId });
  respond(res, { projectId, event }, access, { status: 201, performedBy: actorId });
}

export async function updateTimelineEvent(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const eventId = parseRequiredParam(req, 'eventId', 'eventId');
  const { actorId, payload } = actorContext(req, access);
  const event = await updateProjectTimelineEvent(projectId, eventId, payload, { actorId });
  respond(res, { projectId, eventId, event }, access, { performedBy: actorId });
}

export async function deleteTimelineEvent(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const eventId = parseRequiredParam(req, 'eventId', 'eventId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectTimelineEvent(projectId, eventId, { actorId });
  respond(res, { projectId, eventId, result }, access, { performedBy: actorId });
}

export async function createMeeting(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const meeting = await createProjectMeeting(projectId, payload, { actorId });
  respond(res, { projectId, meeting }, access, { status: 201, performedBy: actorId });
}

export async function updateMeeting(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const meetingId = parseRequiredParam(req, 'meetingId', 'meetingId');
  const { actorId, payload } = actorContext(req, access);
  const meeting = await updateProjectMeeting(projectId, meetingId, payload, { actorId });
  respond(res, { projectId, meetingId, meeting }, access, { performedBy: actorId });
}

export async function deleteMeeting(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const meetingId = parseRequiredParam(req, 'meetingId', 'meetingId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectMeeting(projectId, meetingId, { actorId });
  respond(res, { projectId, meetingId, result }, access, { performedBy: actorId });
}

export async function createCalendarEntry(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const entry = await createProjectCalendarEntry(projectId, payload, { actorId });
  respond(res, { projectId, entry }, access, { status: 201, performedBy: actorId });
}

export async function updateCalendarEntry(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const entryId = parseRequiredParam(req, 'entryId', 'entryId');
  const { actorId, payload } = actorContext(req, access);
  const entry = await updateProjectCalendarEntry(projectId, entryId, payload, { actorId });
  respond(res, { projectId, entryId, entry }, access, { performedBy: actorId });
}

export async function deleteCalendarEntry(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const entryId = parseRequiredParam(req, 'entryId', 'entryId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectCalendarEntry(projectId, entryId, { actorId });
  respond(res, { projectId, entryId, result }, access, { performedBy: actorId });
}

export async function createRole(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const role = await createProjectRole(projectId, payload, { actorId });
  respond(res, { projectId, role }, access, { status: 201, performedBy: actorId });
}

export async function updateRole(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const roleId = parseRequiredParam(req, 'roleId', 'roleId');
  const { actorId, payload } = actorContext(req, access);
  const role = await updateProjectRole(projectId, roleId, payload, { actorId });
  respond(res, { projectId, roleId, role }, access, { performedBy: actorId });
}

export async function deleteRole(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const roleId = parseRequiredParam(req, 'roleId', 'roleId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectRole(projectId, roleId, { actorId });
  respond(res, { projectId, roleId, result }, access, { performedBy: actorId });
}

export async function createSubmission(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const submission = await createProjectSubmission(projectId, payload, { actorId });
  respond(res, { projectId, submission }, access, { status: 201, performedBy: actorId });
}

export async function updateSubmission(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const submissionId = parseRequiredParam(req, 'submissionId', 'submissionId');
  const { actorId, payload } = actorContext(req, access);
  const submission = await updateProjectSubmission(projectId, submissionId, payload, { actorId });
  respond(res, { projectId, submissionId, submission }, access, { performedBy: actorId });
}

export async function deleteSubmission(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const submissionId = parseRequiredParam(req, 'submissionId', 'submissionId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectSubmission(projectId, submissionId, { actorId });
  respond(res, { projectId, submissionId, result }, access, { performedBy: actorId });
}

export async function createInvite(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const invite = await createProjectInvite(projectId, payload, { actorId });
  respond(res, { projectId, invite }, access, { status: 201, performedBy: actorId });
}

export async function updateInvite(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const inviteId = parseRequiredParam(req, 'inviteId', 'inviteId');
  const { actorId, payload } = actorContext(req, access);
  const invite = await updateProjectInvite(projectId, inviteId, payload, { actorId });
  respond(res, { projectId, inviteId, invite }, access, { performedBy: actorId });
}

export async function deleteInvite(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const inviteId = parseRequiredParam(req, 'inviteId', 'inviteId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectInvite(projectId, inviteId, { actorId });
  respond(res, { projectId, inviteId, result }, access, { performedBy: actorId });
}

export async function createHrRecord(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const record = await createProjectHrRecord(projectId, payload, { actorId });
  respond(res, { projectId, record }, access, { status: 201, performedBy: actorId });
}

export async function updateHrRecord(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const recordId = parseRequiredParam(req, 'recordId', 'recordId');
  const { actorId, payload } = actorContext(req, access);
  const record = await updateProjectHrRecord(projectId, recordId, payload, { actorId });
  respond(res, { projectId, recordId, record }, access, { performedBy: actorId });
}

export async function deleteHrRecord(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const recordId = parseRequiredParam(req, 'recordId', 'recordId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectHrRecord(projectId, recordId, { actorId });
  respond(res, { projectId, recordId, result }, access, { performedBy: actorId });
}

export async function createTimeLog(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const log = await createProjectTimeLog(projectId, payload, { actorId });
  respond(res, { projectId, log }, access, { status: 201, performedBy: actorId });
}

export async function updateTimeLog(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const logId = parseRequiredParam(req, 'logId', 'logId');
  const { actorId, payload } = actorContext(req, access);
  const log = await updateProjectTimeLog(projectId, logId, payload, { actorId });
  respond(res, { projectId, logId, log }, access, { performedBy: actorId });
}

export async function deleteTimeLog(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const logId = parseRequiredParam(req, 'logId', 'logId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectTimeLog(projectId, logId, { actorId });
  respond(res, { projectId, logId, result }, access, { performedBy: actorId });
}

export async function createTarget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const target = await createProjectTarget(projectId, payload, { actorId });
  respond(res, { projectId, target }, access, { status: 201, performedBy: actorId });
}

export async function updateTarget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const targetId = parseRequiredParam(req, 'targetId', 'targetId');
  const { actorId, payload } = actorContext(req, access);
  const target = await updateProjectTarget(projectId, targetId, payload, { actorId });
  respond(res, { projectId, targetId, target }, access, { performedBy: actorId });
}

export async function deleteTarget(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const targetId = parseRequiredParam(req, 'targetId', 'targetId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectTarget(projectId, targetId, { actorId });
  respond(res, { projectId, targetId, result }, access, { performedBy: actorId });
}

export async function createObjective(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const objective = await createProjectObjective(projectId, payload, { actorId });
  respond(res, { projectId, objective }, access, { status: 201, performedBy: actorId });
}

export async function updateObjective(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const objectiveId = parseRequiredParam(req, 'objectiveId', 'objectiveId');
  const { actorId, payload } = actorContext(req, access);
  const objective = await updateProjectObjective(projectId, objectiveId, payload, { actorId });
  respond(res, { projectId, objectiveId, objective }, access, { performedBy: actorId });
}

export async function deleteObjective(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const objectiveId = parseRequiredParam(req, 'objectiveId', 'objectiveId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectObjective(projectId, objectiveId, { actorId });
  respond(res, { projectId, objectiveId, result }, access, { performedBy: actorId });
}

export async function postConversationMessage(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const conversationId = parseOptionalParam(req, 'conversationId', 'conversationId');
  const { actorId, payload } = actorContext(req, access);
  const message = await createConversationMessage(projectId, conversationId, payload, { actorId });
  respond(res, { projectId, conversationId, message }, access, { status: 201, performedBy: actorId });
}

export async function createFile(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const { actorId, payload } = actorContext(req, access);
  const file = await createProjectFile(projectId, payload, { actorId });
  respond(res, { projectId, file }, access, { status: 201, performedBy: actorId });
}

export async function updateFile(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const fileId = parseRequiredParam(req, 'fileId', 'fileId');
  const { actorId, payload } = actorContext(req, access);
  const file = await updateProjectFile(projectId, fileId, payload, { actorId });
  respond(res, { projectId, fileId, file }, access, { performedBy: actorId });
}

export async function deleteFile(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parseProjectId(req);
  const fileId = parseRequiredParam(req, 'fileId', 'fileId');
  const { actorId } = actorContext(req, access);
  const result = await deleteProjectFile(projectId, fileId, { actorId });
  respond(res, { projectId, fileId, result }, access, { performedBy: actorId });
}

export default {
  show,
  upsert,
  addTask,
  updateTask,
  removeTask,
  createBudget,
  updateBudget,
  deleteBudget,
  createObject,
  updateObject,
  deleteObject,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
  createRole,
  updateRole,
  deleteRole,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  createInvite,
  updateInvite,
  deleteInvite,
  createHrRecord,
  updateHrRecord,
  deleteHrRecord,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  createTarget,
  updateTarget,
  deleteTarget,
  createObjective,
  updateObjective,
  deleteObjective,
  postConversationMessage,
  createFile,
  updateFile,
  deleteFile,
};
