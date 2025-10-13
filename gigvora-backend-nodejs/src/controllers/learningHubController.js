import {
  getFreelancerLearningHub,
  enrollInCourse,
  updateEnrollmentProgress,
  scheduleMentoringSession,
  recordSkillDiagnostic,
  acknowledgeCertificationReminder,
} from '../services/learningHubService.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

export async function overview(req, res) {
  const { freelancerId } = req.params;
  const { includeEmpty } = req.query ?? {};
  const payload = await getFreelancerLearningHub(freelancerId, {
    includeServiceLinesWithoutCourses: parseBoolean(includeEmpty),
  });
  res.json(payload);
}

export async function createEnrollment(req, res) {
  const { freelancerId } = req.params;
  const { courseId } = req.body ?? {};
  const result = await enrollInCourse(freelancerId, courseId);
  res.status(201).json(result);
}

export async function updateEnrollment(req, res) {
  const { freelancerId, enrollmentId } = req.params;
  const { status, progress, notes } = req.body ?? {};
  const result = await updateEnrollmentProgress(freelancerId, enrollmentId, { status, progress, notes });
  res.json(result);
}

export async function createMentoringSession(req, res) {
  const { freelancerId } = req.params;
  const { mentorId, serviceLineId, topic, agenda, scheduledAt, durationMinutes, meetingUrl } = req.body ?? {};
  const result = await scheduleMentoringSession(freelancerId, {
    mentorId,
    serviceLineId,
    topic,
    agenda,
    scheduledAt,
    durationMinutes,
    meetingUrl,
  });
  res.status(201).json(result);
}

export async function createDiagnostic(req, res) {
  const { freelancerId } = req.params;
  const { serviceLineId, summary, strengths, gaps, recommendedActions, completedAt } = req.body ?? {};
  const diagnostic = await recordSkillDiagnostic(freelancerId, {
    serviceLineId,
    summary,
    strengths,
    gaps,
    recommendedActions,
    completedAt,
  });
  res.status(201).json(diagnostic);
}

export async function acknowledgeReminder(req, res) {
  const { freelancerId, certificationId } = req.params;
  const certification = await acknowledgeCertificationReminder(freelancerId, certificationId);
  res.json(certification);
}

export default {
  overview,
  createEnrollment,
  updateEnrollment,
  createMentoringSession,
  createDiagnostic,
  acknowledgeReminder,
};
