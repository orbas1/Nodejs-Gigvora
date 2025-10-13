import apiClient from './apiClient.js';

export async function fetchFreelancerQueue({ freelancerId, page, pageSize, statuses, signal } = {}) {
  return apiClient.get('/auto-assign/queue', {
    params: {
      freelancerId,
      page,
      pageSize,
      statuses: Array.isArray(statuses) ? statuses.join(',') : statuses,
    },
    signal,
  });
}

export async function enqueueProjectAssignments(projectId, payload, { signal } = {}) {
  return apiClient.post(`/auto-assign/projects/${projectId}/enqueue`, payload, { signal });
}

export async function updateQueueEntry(entryId, payload, { signal } = {}) {
  return apiClient.patch(`/auto-assign/queue/${entryId}`, payload, { signal });
}

export async function fetchProjectQueue(projectId, { targetType, signal } = {}) {
  return apiClient.get(`/auto-assign/projects/${projectId}/queue`, {
    params: { targetType },
    signal,
  });
}

export default {
  fetchFreelancerQueue,
  enqueueProjectAssignments,
  updateQueueEntry,
  fetchProjectQueue,
};
