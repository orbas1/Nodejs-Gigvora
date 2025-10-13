import { apiClient } from './apiClient.js';

export async function fetchFreelancerLearningHub({ freelancerId, includeEmpty, signal } = {}) {
  const id = freelancerId ?? 2;
  const params = {};
  if (includeEmpty != null) {
    params.includeEmpty = includeEmpty ? 'true' : 'false';
  }
  return apiClient.get(`/learning-hub/freelancers/${id}`, { params, signal });
}

export async function createLearningEnrollment({ freelancerId, courseId }) {
  if (!courseId) {
    throw new Error('courseId is required');
  }
  return apiClient.post(`/learning-hub/freelancers/${freelancerId}/enrollments`, { courseId });
}

export async function updateLearningEnrollment({ freelancerId, enrollmentId, status, progress, notes }) {
  return apiClient.patch(`/learning-hub/freelancers/${freelancerId}/enrollments/${enrollmentId}`, {
    status,
    progress,
    notes,
  });
}

export async function scheduleLearningMentoringSession({
  freelancerId,
  mentorId,
  serviceLineId,
  topic,
  agenda,
  scheduledAt,
  durationMinutes,
  meetingUrl,
}) {
  return apiClient.post(`/learning-hub/freelancers/${freelancerId}/mentoring-sessions`, {
    mentorId,
    serviceLineId,
    topic,
    agenda,
    scheduledAt,
    durationMinutes,
    meetingUrl,
  });
}

export async function recordLearningDiagnostic({
  freelancerId,
  serviceLineId,
  summary,
  strengths,
  gaps,
  recommendedActions,
  completedAt,
}) {
  return apiClient.post(`/learning-hub/freelancers/${freelancerId}/diagnostics`, {
    serviceLineId,
    summary,
    strengths,
    gaps,
    recommendedActions,
    completedAt,
  });
}

export async function acknowledgeCertification({ freelancerId, certificationId }) {
  return apiClient.post(
    `/learning-hub/freelancers/${freelancerId}/certifications/${certificationId}/acknowledge`,
  );
}

export default {
  fetchFreelancerLearningHub,
  createLearningEnrollment,
  updateLearningEnrollment,
  scheduleLearningMentoringSession,
  recordLearningDiagnostic,
  acknowledgeCertification,
};
