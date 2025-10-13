import {
  getWorkspaceDashboard,
  updateWorkspaceBrief,
  updateWorkspaceApproval,
  acknowledgeWorkspaceConversation,
} from '../services/projectWorkspaceService.js';

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
  const actorId = parseNumber(payload.actorId);
  const result = await updateWorkspaceBrief(parseNumber(projectId, projectId), payload, { actorId });
  res.json(result);
}

export async function updateApproval(req, res) {
  const { projectId, approvalId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
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
  const actorId = parseNumber(payload.actorId);
  const result = await acknowledgeWorkspaceConversation(
    parseNumber(projectId, projectId),
    parseNumber(conversationId, conversationId),
    payload,
    { actorId },
  );
  res.json(result);
}

export default {
  show,
  updateBrief,
  updateApproval,
  acknowledgeConversation,
};
