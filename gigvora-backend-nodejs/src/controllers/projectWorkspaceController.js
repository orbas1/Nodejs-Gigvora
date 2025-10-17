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

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function show(req, res) {
  const { projectId } = req.params;
  const result = await getWorkspaceDashboard(parseNumber(projectId, projectId));
  res.json(result);
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
  );
  res.json(result);
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
  );
  res.json(result);
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
};
