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

function parseNumber(value) {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function show(req, res) {
  const { projectId } = req.params;
  const operations = await getProjectOperations(projectId);
  res.json(operations);
}

export async function upsert(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const operations = await updateProjectOperations(projectId, payload, { actorId });
  res.json(operations);
}

export async function addTask(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const task = await addProjectTask(projectId, payload, { actorId });
  res.status(201).json(task);
}

export async function updateTask(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const task = await updateProjectTask(projectId, taskId, payload, { actorId });
  res.json(task);
}

export async function removeTask(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await removeProjectTask(projectId, taskId, { actorId });
  res.json(result);
}

export async function createBudget(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const budget = await createProjectBudget(projectId, payload, { actorId });
  res.status(201).json(budget);
}

export async function updateBudget(req, res) {
  const { projectId, budgetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const budget = await updateProjectBudget(projectId, budgetId, payload, { actorId });
  res.json(budget);
}

export async function deleteBudget(req, res) {
  const { projectId, budgetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectBudget(projectId, budgetId, { actorId });
  res.json(result);
}

export async function createObject(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const object = await createProjectObject(projectId, payload, { actorId });
  res.status(201).json(object);
}

export async function updateObject(req, res) {
  const { projectId, objectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const object = await updateProjectObject(projectId, objectId, payload, { actorId });
  res.json(object);
}

export async function deleteObject(req, res) {
  const { projectId, objectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectObject(projectId, objectId, { actorId });
  res.json(result);
}

export async function createTimelineEvent(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const event = await createProjectTimelineEvent(projectId, payload, { actorId });
  res.status(201).json(event);
}

export async function updateTimelineEvent(req, res) {
  const { projectId, eventId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const event = await updateProjectTimelineEvent(projectId, eventId, payload, { actorId });
  res.json(event);
}

export async function deleteTimelineEvent(req, res) {
  const { projectId, eventId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectTimelineEvent(projectId, eventId, { actorId });
  res.json(result);
}

export async function createMeeting(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const meeting = await createProjectMeeting(projectId, payload, { actorId });
  res.status(201).json(meeting);
}

export async function updateMeeting(req, res) {
  const { projectId, meetingId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const meeting = await updateProjectMeeting(projectId, meetingId, payload, { actorId });
  res.json(meeting);
}

export async function deleteMeeting(req, res) {
  const { projectId, meetingId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectMeeting(projectId, meetingId, { actorId });
  res.json(result);
}

export async function createCalendarEntry(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const entry = await createProjectCalendarEntry(projectId, payload, { actorId });
  res.status(201).json(entry);
}

export async function updateCalendarEntry(req, res) {
  const { projectId, entryId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const entry = await updateProjectCalendarEntry(projectId, entryId, payload, { actorId });
  res.json(entry);
}

export async function deleteCalendarEntry(req, res) {
  const { projectId, entryId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectCalendarEntry(projectId, entryId, { actorId });
  res.json(result);
}

export async function createRole(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const role = await createProjectRole(projectId, payload, { actorId });
  res.status(201).json(role);
}

export async function updateRole(req, res) {
  const { projectId, roleId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const role = await updateProjectRole(projectId, roleId, payload, { actorId });
  res.json(role);
}

export async function deleteRole(req, res) {
  const { projectId, roleId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectRole(projectId, roleId, { actorId });
  res.json(result);
}

export async function createSubmission(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const submission = await createProjectSubmission(projectId, payload, { actorId });
  res.status(201).json(submission);
}

export async function updateSubmission(req, res) {
  const { projectId, submissionId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const submission = await updateProjectSubmission(projectId, submissionId, payload, { actorId });
  res.json(submission);
}

export async function deleteSubmission(req, res) {
  const { projectId, submissionId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectSubmission(projectId, submissionId, { actorId });
  res.json(result);
}

export async function createInvite(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const invite = await createProjectInvite(projectId, payload, { actorId });
  res.status(201).json(invite);
}

export async function updateInvite(req, res) {
  const { projectId, inviteId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const invite = await updateProjectInvite(projectId, inviteId, payload, { actorId });
  res.json(invite);
}

export async function deleteInvite(req, res) {
  const { projectId, inviteId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectInvite(projectId, inviteId, { actorId });
  res.json(result);
}

export async function createHrRecord(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const record = await createProjectHrRecord(projectId, payload, { actorId });
  res.status(201).json(record);
}

export async function updateHrRecord(req, res) {
  const { projectId, recordId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const record = await updateProjectHrRecord(projectId, recordId, payload, { actorId });
  res.json(record);
}

export async function deleteHrRecord(req, res) {
  const { projectId, recordId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectHrRecord(projectId, recordId, { actorId });
  res.json(result);
}

export async function createTimeLog(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const log = await createProjectTimeLog(projectId, payload, { actorId });
  res.status(201).json(log);
}

export async function updateTimeLog(req, res) {
  const { projectId, logId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const log = await updateProjectTimeLog(projectId, logId, payload, { actorId });
  res.json(log);
}

export async function deleteTimeLog(req, res) {
  const { projectId, logId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectTimeLog(projectId, logId, { actorId });
  res.json(result);
}

export async function createTarget(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const target = await createProjectTarget(projectId, payload, { actorId });
  res.status(201).json(target);
}

export async function updateTarget(req, res) {
  const { projectId, targetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const target = await updateProjectTarget(projectId, targetId, payload, { actorId });
  res.json(target);
}

export async function deleteTarget(req, res) {
  const { projectId, targetId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectTarget(projectId, targetId, { actorId });
  res.json(result);
}

export async function createObjective(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const objective = await createProjectObjective(projectId, payload, { actorId });
  res.status(201).json(objective);
}

export async function updateObjective(req, res) {
  const { projectId, objectiveId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const objective = await updateProjectObjective(projectId, objectiveId, payload, { actorId });
  res.json(objective);
}

export async function deleteObjective(req, res) {
  const { projectId, objectiveId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectObjective(projectId, objectiveId, { actorId });
  res.json(result);
}

export async function postConversationMessage(req, res) {
  const { projectId, conversationId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const message = await createConversationMessage(projectId, conversationId, payload, { actorId });
  res.status(201).json(message);
}

export async function createFile(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const file = await createProjectFile(projectId, payload, { actorId });
  res.status(201).json(file);
}

export async function updateFile(req, res) {
  const { projectId, fileId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const file = await updateProjectFile(projectId, fileId, payload, { actorId });
  res.json(file);
}

export async function deleteFile(req, res) {
  const { projectId, fileId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await deleteProjectFile(projectId, fileId, { actorId });
  res.json(result);
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

