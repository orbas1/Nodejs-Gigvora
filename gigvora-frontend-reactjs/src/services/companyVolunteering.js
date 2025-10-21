import { apiClient } from './apiClient.js';
import {
  buildParams,
  buildRequestOptions,
  mergeWorkspace,
  optionalString,
  requireIdentifier,
  resolveSignal,
} from './serviceHelpers.js';

export async function fetchVolunteeringDashboard(
  { workspaceId, workspaceSlug, lookbackDays, signal } = {},
  options = {},
) {
  const params = buildParams({
    workspaceId: optionalString(workspaceId),
    workspaceSlug: optionalString(workspaceSlug),
    lookbackDays,
  });
  const requestOptions = buildRequestOptions({
    params,
    signal: resolveSignal(signal, options.signal),
  });
  return apiClient.get('/company/volunteering/dashboard', requestOptions);
}

export async function createVolunteeringPost({ workspaceId, workspaceSlug, ...payload } = {}, options = {}) {
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/volunteering/posts', body, requestOptions);
}

export async function updateVolunteeringPost(postId, { workspaceId, workspaceSlug, ...payload } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/posts/${postIdentifier}`, body, requestOptions);
}

export async function deleteVolunteeringPost(postId, { workspaceId, workspaceSlug } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/volunteering/posts/${postIdentifier}`, requestOptions);
}

export async function createVolunteeringApplication(
  postId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/volunteering/posts/${postIdentifier}/applications`, body, requestOptions);
}

export async function updateVolunteeringApplication(
  applicationId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const applicationIdentifier = requireIdentifier(applicationId, 'applicationId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/applications/${applicationIdentifier}`, body, requestOptions);
}

export async function deleteVolunteeringApplication(
  applicationId,
  { workspaceId, workspaceSlug } = {},
  options = {},
) {
  const applicationIdentifier = requireIdentifier(applicationId, 'applicationId');
  const body = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/volunteering/applications/${applicationIdentifier}`, requestOptions);
}

export async function createVolunteeringResponse(
  applicationId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const applicationIdentifier = requireIdentifier(applicationId, 'applicationId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/volunteering/applications/${applicationIdentifier}/responses`, body, requestOptions);
}

export async function updateVolunteeringResponse(
  responseId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const responseIdentifier = requireIdentifier(responseId, 'responseId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/responses/${responseIdentifier}`, body, requestOptions);
}

export async function deleteVolunteeringResponse(
  responseId,
  { workspaceId, workspaceSlug } = {},
  options = {},
) {
  const responseIdentifier = requireIdentifier(responseId, 'responseId');
  const body = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/volunteering/responses/${responseIdentifier}`, requestOptions);
}

export async function createVolunteeringInterview(
  applicationId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const applicationIdentifier = requireIdentifier(applicationId, 'applicationId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/volunteering/applications/${applicationIdentifier}/interviews`, body, requestOptions);
}

export async function updateVolunteeringInterview(
  interviewId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const interviewIdentifier = requireIdentifier(interviewId, 'interviewId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/interviews/${interviewIdentifier}`, body, requestOptions);
}

export async function deleteVolunteeringInterview(
  interviewId,
  { workspaceId, workspaceSlug } = {},
  options = {},
) {
  const interviewIdentifier = requireIdentifier(interviewId, 'interviewId');
  const body = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/volunteering/interviews/${interviewIdentifier}`, requestOptions);
}

export async function createVolunteeringContract(
  applicationId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const applicationIdentifier = requireIdentifier(applicationId, 'applicationId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/volunteering/applications/${applicationIdentifier}/contracts`, body, requestOptions);
}

export async function updateVolunteeringContract(
  contractId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const contractIdentifier = requireIdentifier(contractId, 'contractId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/contracts/${contractIdentifier}`, body, requestOptions);
}

export async function addVolunteeringSpend(
  contractId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const contractIdentifier = requireIdentifier(contractId, 'contractId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/volunteering/contracts/${contractIdentifier}/spend`, body, requestOptions);
}

export async function updateVolunteeringSpend(
  spendId,
  { workspaceId, workspaceSlug, ...payload } = {},
  options = {},
) {
  const spendIdentifier = requireIdentifier(spendId, 'spendId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/volunteering/spend/${spendIdentifier}`, body, requestOptions);
}

export async function deleteVolunteeringSpend(
  spendId,
  { workspaceId, workspaceSlug } = {},
  options = {},
) {
  const spendIdentifier = requireIdentifier(spendId, 'spendId');
  const body = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/volunteering/spend/${spendIdentifier}`, requestOptions);
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
