import apiClient from './apiClient.js';

export async function createProject(payload) {
  return apiClient.post('/projects', payload);
}

export async function updateProject(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}`, payload);
}

export async function updateProjectAutoAssign(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}/auto-assign`, payload);
}

export async function fetchProject(projectId, { signal } = {}) {
  return apiClient.get(`/projects/${projectId}`, { signal });
}

export async function fetchProjectEvents(projectId, { limit } = {}) {
  return apiClient.get(`/projects/${projectId}/events`, { params: { limit } });
}

export async function listProjectBlueprints() {
  return apiClient.get('/projects/blueprints');
}

export async function fetchProjectBlueprint(projectId) {
  return apiClient.get(`/projects/${projectId}/blueprint`);
}

export async function upsertProjectBlueprint(projectId, payload) {
  return apiClient.put(`/projects/${projectId}/blueprint`, payload);
}

export async function fetchProjectWorkspace(projectId) {
  return apiClient.get(`/projects/${projectId}/workspace`);
}

export async function updateProjectWorkspaceBrief(projectId, payload) {
  return apiClient.put(`/projects/${projectId}/workspace/brief`, payload);
}

export async function updateProjectWorkspaceApproval(projectId, approvalId, payload) {
  return apiClient.patch(`/projects/${projectId}/workspace/approvals/${approvalId}`, payload);
}

export async function acknowledgeProjectWorkspaceConversation(projectId, conversationId, payload) {
  return apiClient.patch(`/projects/${projectId}/workspace/conversations/${conversationId}`, payload);
}

export function createProjectWorkspaceConversationMessage(projectId, conversationId, payload) {
  if (!projectId || !conversationId) {
    throw new Error('projectId and conversationId are required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/conversations/${conversationId}/messages`, payload);
}

export function createProjectWorkspaceBudget(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/budgets`, payload);
}

export function updateProjectWorkspaceBudget(projectId, budgetId, payload) {
  if (!projectId || !budgetId) {
    throw new Error('projectId and budgetId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/budgets/${budgetId}`, payload);
}

export function deleteProjectWorkspaceBudget(projectId, budgetId, payload) {
  if (!projectId || !budgetId) {
    throw new Error('projectId and budgetId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/budgets/${budgetId}`, { body: payload });
}

export function createProjectWorkspaceObject(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/objects`, payload);
}

export function updateProjectWorkspaceObject(projectId, objectId, payload) {
  if (!projectId || !objectId) {
    throw new Error('projectId and objectId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/objects/${objectId}`, payload);
}

export function deleteProjectWorkspaceObject(projectId, objectId, payload) {
  if (!projectId || !objectId) {
    throw new Error('projectId and objectId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/objects/${objectId}`, { body: payload });
}

export function createProjectWorkspaceTimelineEntry(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/timeline`, payload);
}

export function updateProjectWorkspaceTimelineEntry(projectId, entryId, payload) {
  if (!projectId || !entryId) {
    throw new Error('projectId and entryId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/timeline/${entryId}`, payload);
}

export function deleteProjectWorkspaceTimelineEntry(projectId, entryId, payload) {
  if (!projectId || !entryId) {
    throw new Error('projectId and entryId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/timeline/${entryId}`, { body: payload });
}

export function createProjectWorkspaceMeeting(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/meetings`, payload);
}

export function updateProjectWorkspaceMeeting(projectId, meetingId, payload) {
  if (!projectId || !meetingId) {
    throw new Error('projectId and meetingId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/meetings/${meetingId}`, payload);
}

export function deleteProjectWorkspaceMeeting(projectId, meetingId, payload) {
  if (!projectId || !meetingId) {
    throw new Error('projectId and meetingId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/meetings/${meetingId}`, { body: payload });
}

export function createProjectWorkspaceRole(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/roles`, payload);
}

export function updateProjectWorkspaceRole(projectId, roleId, payload) {
  if (!projectId || !roleId) {
    throw new Error('projectId and roleId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/roles/${roleId}`, payload);
}

export function deleteProjectWorkspaceRole(projectId, roleId, payload) {
  if (!projectId || !roleId) {
    throw new Error('projectId and roleId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/roles/${roleId}`, { body: payload });
}

export function createProjectWorkspaceSubmission(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/submissions`, payload);
}

export function updateProjectWorkspaceSubmission(projectId, submissionId, payload) {
  if (!projectId || !submissionId) {
    throw new Error('projectId and submissionId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/submissions/${submissionId}`, payload);
}

export function deleteProjectWorkspaceSubmission(projectId, submissionId, payload) {
  if (!projectId || !submissionId) {
    throw new Error('projectId and submissionId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/submissions/${submissionId}`, { body: payload });
}

export function createProjectWorkspaceInvite(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/invites`, payload);
}

export function updateProjectWorkspaceInvite(projectId, inviteId, payload) {
  if (!projectId || !inviteId) {
    throw new Error('projectId and inviteId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/invites/${inviteId}`, payload);
}

export function deleteProjectWorkspaceInvite(projectId, inviteId, payload) {
  if (!projectId || !inviteId) {
    throw new Error('projectId and inviteId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/invites/${inviteId}`, { body: payload });
}

export function createProjectWorkspaceHrRecord(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/hr`, payload);
}

export function updateProjectWorkspaceHrRecord(projectId, recordId, payload) {
  if (!projectId || !recordId) {
    throw new Error('projectId and recordId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/hr/${recordId}`, payload);
}

export function deleteProjectWorkspaceHrRecord(projectId, recordId, payload) {
  if (!projectId || !recordId) {
    throw new Error('projectId and recordId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/hr/${recordId}`, { body: payload });
}

export function createProjectWorkspaceFile(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/files`, payload);
}

export function updateProjectWorkspaceFile(projectId, fileId, payload) {
  if (!projectId || !fileId) {
    throw new Error('projectId and fileId are required');
  }
  return apiClient.put(`/projects/${projectId}/workspace/files/${fileId}`, payload);
}

export function deleteProjectWorkspaceFile(projectId, fileId, payload) {
  if (!projectId || !fileId) {
    throw new Error('projectId and fileId are required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/files/${fileId}`, { body: payload });
}

export default {
  createProject,
  updateProject,
  updateProjectAutoAssign,
  fetchProject,
  fetchProjectEvents,
  listProjectBlueprints,
  fetchProjectBlueprint,
  upsertProjectBlueprint,
  fetchProjectWorkspace,
  updateProjectWorkspaceBrief,
  updateProjectWorkspaceApproval,
  acknowledgeProjectWorkspaceConversation,
  createProjectWorkspaceConversationMessage,
  createProjectWorkspaceBudget,
  updateProjectWorkspaceBudget,
  deleteProjectWorkspaceBudget,
  createProjectWorkspaceObject,
  updateProjectWorkspaceObject,
  deleteProjectWorkspaceObject,
  createProjectWorkspaceTimelineEntry,
  updateProjectWorkspaceTimelineEntry,
  deleteProjectWorkspaceTimelineEntry,
  createProjectWorkspaceMeeting,
  updateProjectWorkspaceMeeting,
  deleteProjectWorkspaceMeeting,
  createProjectWorkspaceRole,
  updateProjectWorkspaceRole,
  deleteProjectWorkspaceRole,
  createProjectWorkspaceSubmission,
  updateProjectWorkspaceSubmission,
  deleteProjectWorkspaceSubmission,
  createProjectWorkspaceInvite,
  updateProjectWorkspaceInvite,
  deleteProjectWorkspaceInvite,
  createProjectWorkspaceHrRecord,
  updateProjectWorkspaceHrRecord,
  deleteProjectWorkspaceHrRecord,
  createProjectWorkspaceFile,
  updateProjectWorkspaceFile,
  deleteProjectWorkspaceFile,
};
