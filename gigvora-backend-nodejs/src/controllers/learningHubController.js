import {
  getFreelancerLearningHub,
  enrollInCourse,
  updateEnrollmentProgress,
  scheduleMentoringSession,
  recordSkillDiagnostic,
  acknowledgeCertificationReminder,
} from '../services/learningHubService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }
  throw new ValidationError('Boolean parameters must be true or false.');
}

function parsePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function ensureFreelancerAccess(req, freelancerId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  if (actorId === freelancerId) {
    return;
  }

  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('learning.manage.any') ||
    permissions.has('mentor') ||
    permissions.has('coach')
  ) {
    return;
  }

  throw new AuthorizationError('You do not have permission to manage this learning hub.');
}

export async function overview(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req, freelancerId);
  const { includeEmpty } = req.query ?? {};
  const payload = await getFreelancerLearningHub(freelancerId, {
    includeServiceLinesWithoutCourses: parseBoolean(includeEmpty),
  });
  res.json(payload);
}

export async function createEnrollment(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req, freelancerId);
  const { courseId } = ensureObjectPayload(req.body, 'enrollment payload');
  const result = await enrollInCourse(freelancerId, parsePositiveInteger(courseId, 'courseId'));
  res.status(201).json(result);
}

export async function updateEnrollment(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  const enrollmentId = parsePositiveInteger(req.params.enrollmentId, 'enrollmentId');
  ensureFreelancerAccess(req, freelancerId);
  const { status, progress, notes } = ensureObjectPayload(req.body, 'enrollment update');
  const result = await updateEnrollmentProgress(freelancerId, enrollmentId, { status, progress, notes });
  res.json(result);
}

export async function createMentoringSession(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req, freelancerId);
  const { mentorId, serviceLineId, topic, agenda, scheduledAt, durationMinutes, meetingUrl } = ensureObjectPayload(
    req.body,
    'mentoring session',
  );
  const result = await scheduleMentoringSession(freelancerId, {
    mentorId: mentorId != null ? parsePositiveInteger(mentorId, 'mentorId') : null,
    serviceLineId: serviceLineId != null ? parsePositiveInteger(serviceLineId, 'serviceLineId') : null,
    topic,
    agenda,
    scheduledAt,
    durationMinutes,
    meetingUrl,
  });
  res.status(201).json(result);
}

export async function createDiagnostic(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req, freelancerId);
  const { serviceLineId, summary, strengths, gaps, recommendedActions, completedAt } = ensureObjectPayload(
    req.body,
    'skill diagnostic',
  );
  const diagnostic = await recordSkillDiagnostic(freelancerId, {
    serviceLineId: serviceLineId != null ? parsePositiveInteger(serviceLineId, 'serviceLineId') : null,
    summary,
    strengths,
    gaps,
    recommendedActions,
    completedAt,
  });
  res.status(201).json(diagnostic);
}

export async function acknowledgeReminder(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  const certificationId = parsePositiveInteger(req.params.certificationId, 'certificationId');
  ensureFreelancerAccess(req, freelancerId);
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
