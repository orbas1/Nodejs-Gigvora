import { apiClient } from './apiClient.js';

function requireFreelancerId(freelancerId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required for learning hub operations.');
  }
  return freelancerId;
}

export async function fetchFreelancerLearningHub({ freelancerId, includeEmpty, signal } = {}) {
  const id = requireFreelancerId(freelancerId);
  const params = {};
  if (includeEmpty != null) {
    params.includeEmpty = includeEmpty ? 'true' : 'false';
  }
  return apiClient.get(`/learning-hub/freelancers/${id}`, { params, signal });
}

export async function createLearningEnrollment({ freelancerId, courseId }, { signal } = {}) {
  const id = requireFreelancerId(freelancerId);
  if (!courseId) {
    throw new Error('courseId is required to create a learning enrollment.');
  }
  return apiClient.post(`/learning-hub/freelancers/${id}/enrollments`, { courseId }, { signal });
}

export async function updateLearningEnrollment(
  { freelancerId, enrollmentId, status, progress, notes },
  { signal } = {},
) {
  const id = requireFreelancerId(freelancerId);
  if (!enrollmentId) {
    throw new Error('enrollmentId is required to update a learning enrollment.');
  }
  return apiClient.patch(
    `/learning-hub/freelancers/${id}/enrollments/${enrollmentId}`,
    {
      status,
      progress,
      notes,
    },
    { signal },
  );
}

export async function scheduleLearningMentoringSession(
  {
    freelancerId,
    mentorId,
    serviceLineId,
    topic,
    agenda,
    scheduledAt,
    durationMinutes,
    meetingUrl,
  },
  { signal } = {},
) {
  const id = requireFreelancerId(freelancerId);
  if (!mentorId || !scheduledAt) {
    throw new Error('mentorId and scheduledAt are required to schedule a mentoring session.');
  }
  return apiClient.post(
    `/learning-hub/freelancers/${id}/mentoring-sessions`,
    {
      mentorId,
      serviceLineId,
      topic,
      agenda,
      scheduledAt,
      durationMinutes,
      meetingUrl,
    },
    { signal },
  );
}

export async function recordLearningDiagnostic(
  {
    freelancerId,
    serviceLineId,
    summary,
    strengths,
    gaps,
    recommendedActions,
    completedAt,
  },
  { signal } = {},
) {
  const id = requireFreelancerId(freelancerId);
  if (!serviceLineId) {
    throw new Error('serviceLineId is required to record a diagnostic.');
  }
  return apiClient.post(
    `/learning-hub/freelancers/${id}/diagnostics`,
    {
      serviceLineId,
      summary,
      strengths,
      gaps,
      recommendedActions,
      completedAt,
    },
    { signal },
  );
}

export async function acknowledgeCertification({ freelancerId, certificationId }, { signal } = {}) {
  const id = requireFreelancerId(freelancerId);
  if (!certificationId) {
    throw new Error('certificationId is required to acknowledge a certification.');
  }
  return apiClient.post(
    `/learning-hub/freelancers/${id}/certifications/${certificationId}/acknowledge`,
    {},
    { signal },
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
