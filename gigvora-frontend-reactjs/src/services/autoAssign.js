import apiClient from './apiClient.js';

export async function fetchFreelancerQueue({ freelancerId, page, pageSize, statuses } = {}) {
  return apiClient.get('/auto-assign/queue', {
    params: {
      freelancerId,
      page,
      pageSize,
      statuses: Array.isArray(statuses) ? statuses.join(',') : statuses,
    },
  });
}

export async function enqueueProjectAssignments(projectId, payload) {
  return apiClient.post(`/auto-assign/projects/${projectId}/enqueue`, payload);
}

export async function updateQueueEntry(entryId, payload) {
  return apiClient.patch(`/auto-assign/queue/${entryId}`, payload);
}

export default {
  fetchFreelancerQueue,
  enqueueProjectAssignments,
  updateQueueEntry,
};
