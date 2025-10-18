import { apiClient } from './apiClient.js';

function buildWorkspacePayload({ workspaceId, workspaceSlug }) {
  const payload = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    payload.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.trim().length > 0) {
    payload.workspaceSlug = workspaceSlug;
  }
  return payload;
}

export async function fetchVolunteeringDashboard({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = buildWorkspacePayload({ workspaceId, workspaceSlug });
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/volunteering/dashboard', { params, signal });
}

export async function createVolunteeringPost({ workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post('/company/volunteering/posts', body);
}

export async function updateVolunteeringPost(postId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/posts/${postId}`, body);
}

export async function deleteVolunteeringPost(postId, { workspaceId, workspaceSlug }) {
  const body = buildWorkspacePayload({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/volunteering/posts/${postId}`, { body });
}

export async function createVolunteeringApplication(postId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post(`/company/volunteering/posts/${postId}/applications`, body);
}

export async function updateVolunteeringApplication(applicationId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/applications/${applicationId}`, body);
}

export async function deleteVolunteeringApplication(applicationId, { workspaceId, workspaceSlug }) {
  const body = buildWorkspacePayload({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/volunteering/applications/${applicationId}`, { body });
}

export async function createVolunteeringResponse(applicationId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post(`/company/volunteering/applications/${applicationId}/responses`, body);
}

export async function updateVolunteeringResponse(responseId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/responses/${responseId}`, body);
}

export async function deleteVolunteeringResponse(responseId, { workspaceId, workspaceSlug }) {
  const body = buildWorkspacePayload({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/volunteering/responses/${responseId}`, { body });
}

export async function createVolunteeringInterview(applicationId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post(`/company/volunteering/applications/${applicationId}/interviews`, body);
}

export async function updateVolunteeringInterview(interviewId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/interviews/${interviewId}`, body);
}

export async function deleteVolunteeringInterview(interviewId, { workspaceId, workspaceSlug }) {
  const body = buildWorkspacePayload({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/volunteering/interviews/${interviewId}`, { body });
}

export async function createVolunteeringContract(applicationId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post(`/company/volunteering/applications/${applicationId}/contracts`, body);
}

export async function updateVolunteeringContract(contractId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/contracts/${contractId}`, body);
}

export async function addVolunteeringSpend(contractId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.post(`/company/volunteering/contracts/${contractId}/spend`, body);
}

export async function updateVolunteeringSpend(spendId, { workspaceId, workspaceSlug, ...payload }) {
  const body = { ...payload, ...buildWorkspacePayload({ workspaceId, workspaceSlug }) };
  return apiClient.put(`/company/volunteering/spend/${spendId}`, body);
}

export async function deleteVolunteeringSpend(spendId, { workspaceId, workspaceSlug }) {
  const body = buildWorkspacePayload({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/volunteering/spend/${spendId}`, { body });
}

export default {
  fetchVolunteeringDashboard,
  createVolunteeringPost,
  updateVolunteeringPost,
  deleteVolunteeringPost,
  createVolunteeringApplication,
  updateVolunteeringApplication,
  deleteVolunteeringApplication,
  createVolunteeringResponse,
  updateVolunteeringResponse,
  deleteVolunteeringResponse,
  createVolunteeringInterview,
  updateVolunteeringInterview,
  deleteVolunteeringInterview,
  createVolunteeringContract,
  updateVolunteeringContract,
  addVolunteeringSpend,
  updateVolunteeringSpend,
  deleteVolunteeringSpend,
};
