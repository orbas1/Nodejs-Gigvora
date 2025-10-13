import {
  sequelize,
  ServiceLine,
  LearningCourse,
  LearningCourseModule,
  LearningCourseEnrollment,
  PeerMentoringSession,
  SkillGapDiagnostic,
  FreelancerCertification,
  AiServiceRecommendation,
  User,
  LEARNING_ENROLLMENT_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function assertFreelancerId(freelancerId) {
  const id = Number(freelancerId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  return id;
}

function sanitizeCourse(course, freelancerId) {
  const plain = course.get({ plain: true });
  const enrollment = Array.isArray(plain.enrollments) ? plain.enrollments.find((entry) => entry.userId === freelancerId) : null;
  return {
    id: plain.id,
    serviceLineId: plain.serviceLineId,
    title: plain.title,
    summary: plain.summary,
    difficulty: plain.difficulty,
    format: plain.format,
    durationHours: plain.durationHours == null ? null : Number(plain.durationHours),
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    metadata: plain.metadata ?? null,
    modules: Array.isArray(plain.modules)
      ? [...plain.modules]
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
          .map((module) => ({
            id: module.id,
            title: module.title,
            moduleType: module.moduleType,
            durationMinutes: module.durationMinutes == null ? null : Number(module.durationMinutes),
            sequence: module.sequence,
            resources: module.resources ?? null,
          }))
      : [],
    enrollment: enrollment
      ? {
          id: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          status: enrollment.status,
          progress: enrollment.progress == null ? 0 : Number(enrollment.progress),
          lastAccessedAt: enrollment.lastAccessedAt,
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt,
          notes: enrollment.notes ?? null,
        }
      : null,
  };
}

function sanitizeMentoringSession(session) {
  const plain = session.get({ plain: true });
  const mentor = plain.mentor
    ? {
        id: plain.mentor.id,
        firstName: plain.mentor.firstName,
        lastName: plain.mentor.lastName,
        email: plain.mentor.email,
      }
    : null;
  return {
    id: plain.id,
    serviceLineId: plain.serviceLineId,
    mentorId: plain.mentorId,
    menteeId: plain.menteeId,
    topic: plain.topic,
    agenda: plain.agenda,
    scheduledAt: plain.scheduledAt,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    status: plain.status,
    meetingUrl: plain.meetingUrl,
    recordingUrl: plain.recordingUrl,
    notes: plain.notes ?? null,
    mentor,
  };
}

function sanitizeDiagnostic(diagnostic) {
  const plain = diagnostic.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    serviceLineId: plain.serviceLineId,
    summary: plain.summary,
    strengths: Array.isArray(plain.strengths) ? plain.strengths : plain.strengths ?? [],
    gaps: Array.isArray(plain.gaps) ? plain.gaps : plain.gaps ?? [],
    recommendedActions: Array.isArray(plain.recommendedActions)
      ? plain.recommendedActions
      : plain.recommendedActions ?? [],
    completedAt: plain.completedAt,
  };
}

function sanitizeCertification(certification) {
  const plain = certification.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    serviceLineId: plain.serviceLineId,
    name: plain.name,
    issuingOrganization: plain.issuingOrganization,
    credentialId: plain.credentialId,
    credentialUrl: plain.credentialUrl,
    issueDate: plain.issueDate,
    expirationDate: plain.expirationDate,
    status: plain.status,
    reminderSentAt: plain.reminderSentAt,
    attachments: plain.attachments ?? null,
  };
}

function sanitizeRecommendation(recommendation) {
  const plain = recommendation.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    serviceLineId: plain.serviceLineId,
    title: plain.title,
    description: plain.description,
    confidenceScore: plain.confidenceScore == null ? null : Number(plain.confidenceScore),
    sourceSignals: plain.sourceSignals ?? null,
    generatedAt: plain.generatedAt,
  };
}

function computeRenewalInsights(certifications) {
  const now = new Date();
  const upcoming = certifications
    .filter((cert) => cert.expirationDate)
    .map((cert) => ({
      ...cert,
      expirationDateObj: cert.expirationDate ? new Date(cert.expirationDate) : null,
    }))
    .filter((cert) => cert.expirationDateObj && cert.expirationDateObj.getTime() >= now.getTime())
    .map((cert) => ({
      ...cert,
      daysUntilExpiration: Math.round((cert.expirationDateObj.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    }))
    .filter((cert) => cert.daysUntilExpiration <= 60)
    .sort((a, b) => a.expirationDateObj - b.expirationDateObj);

  return {
    upcomingRenewals: upcoming,
    nextRenewal: upcoming.length ? upcoming[0] : null,
  };
}

function computeEnrollmentStats(enrollments = []) {
  const totals = enrollments.reduce(
    (acc, enrollment) => {
      if (!enrollment) {
        return acc;
      }
      acc.total += 1;
      if (enrollment.status === 'completed') {
        acc.completed += 1;
      } else if (enrollment.status === 'in_progress') {
        acc.inProgress += 1;
      } else if (enrollment.status === 'not_started') {
        acc.notStarted += 1;
      } else if (enrollment.status === 'archived') {
        acc.archived += 1;
      }
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0, notStarted: 0, archived: 0 },
  );

  return {
    ...totals,
    completionRate: totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0,
  };
}

export async function getFreelancerLearningHub(freelancerId, { includeServiceLinesWithoutCourses = false } = {}) {
  const userId = assertFreelancerId(freelancerId);

  const [serviceLines, courses, mentoringSessions, diagnostics, certifications, recommendations] = await Promise.all([
    ServiceLine.findAll({ order: [['name', 'ASC']] }),
    LearningCourse.findAll({
      include: [
        { model: LearningCourseModule, as: 'modules' },
        {
          model: LearningCourseEnrollment,
          as: 'enrollments',
          required: false,
          where: { userId },
        },
      ],
      order: [['title', 'ASC']],
    }),
    PeerMentoringSession.findAll({
      where: { menteeId: userId },
      include: [
        { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['scheduledAt', 'ASC']],
    }),
    SkillGapDiagnostic.findAll({
      where: { userId },
      include: [{ model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] }],
      order: [['completedAt', 'DESC']],
    }),
    FreelancerCertification.findAll({
      where: { userId },
      include: [{ model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] }],
      order: [[sequelize.literal(`COALESCE("FreelancerCertification"."expirationDate", '9999-12-31')`), 'ASC']],
    }),
    AiServiceRecommendation.findAll({
      where: { userId },
      include: [{ model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] }],
      order: [['generatedAt', 'DESC']],
      limit: 20,
    }),
  ]);

  const courseMap = courses.reduce((acc, course) => {
    const key = course.serviceLineId || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {});

  const mentoringMap = mentoringSessions.reduce((acc, session) => {
    const key = session.serviceLineId || session.serviceLine?.id || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(session);
    return acc;
  }, {});

  const diagnosticMap = diagnostics.reduce((acc, diagnostic) => {
    const key = diagnostic.serviceLineId || diagnostic.serviceLine?.id || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(diagnostic);
    return acc;
  }, {});

  const certificationMap = certifications.reduce((acc, certification) => {
    const key = certification.serviceLineId || certification.serviceLine?.id || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(certification);
    return acc;
  }, {});

  const recommendationMap = recommendations.reduce((acc, recommendation) => {
    const key = recommendation.serviceLineId || recommendation.serviceLine?.id || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(recommendation);
    return acc;
  }, {});

  const aggregatedServiceLines = serviceLines
    .map((line) => {
      const lineCourses = courseMap[line.id] ?? [];
      const lineEnrollments = lineCourses.flatMap((course) => course.enrollments ?? []);
      const lineStats = computeEnrollmentStats(lineEnrollments);

      return {
        id: line.id,
        name: line.name,
        slug: line.slug,
        description: line.description,
        stats: {
          ...lineStats,
          mentoringScheduled: (mentoringMap[line.id] ?? []).filter((session) => session.status === 'scheduled').length,
          diagnosticsCompleted: (diagnosticMap[line.id] ?? []).length,
          certifications: (certificationMap[line.id] ?? []).length,
        },
        courses: lineCourses.map((course) => sanitizeCourse(course, userId)),
        mentoringSessions: (mentoringMap[line.id] ?? []).map((session) => sanitizeMentoringSession(session)),
        diagnostics: (diagnosticMap[line.id] ?? []).map((diagnostic) => sanitizeDiagnostic(diagnostic)),
        certifications: (certificationMap[line.id] ?? []).map((cert) => sanitizeCertification(cert)),
        recommendations: (recommendationMap[line.id] ?? []).map((rec) => sanitizeRecommendation(rec)),
      };
    })
    .filter((line) =>
      includeServiceLinesWithoutCourses ||
      line.courses.length ||
      line.mentoringSessions.length ||
      line.diagnostics.length ||
      line.certifications.length ||
      line.recommendations.length,
    );

  const orphanKey = 'unassigned';
  if (
    courseMap[orphanKey] ||
    mentoringMap[orphanKey] ||
    diagnosticMap[orphanKey] ||
    certificationMap[orphanKey] ||
    recommendationMap[orphanKey]
  ) {
    aggregatedServiceLines.push({
      id: null,
      name: 'General',
      slug: 'general',
      description: 'Cross-disciplinary learning and certifications not tied to a specific service line.',
      stats: computeEnrollmentStats(courseMap[orphanKey]?.flatMap((course) => course.enrollments ?? []) ?? []),
      courses: (courseMap[orphanKey] ?? []).map((course) => sanitizeCourse(course, userId)),
      mentoringSessions: (mentoringMap[orphanKey] ?? []).map((session) => sanitizeMentoringSession(session)),
      diagnostics: (diagnosticMap[orphanKey] ?? []).map((diagnostic) => sanitizeDiagnostic(diagnostic)),
      certifications: (certificationMap[orphanKey] ?? []).map((cert) => sanitizeCertification(cert)),
      recommendations: (recommendationMap[orphanKey] ?? []).map((rec) => sanitizeRecommendation(rec)),
    });
  }

  const flattenedEnrollments = courses.flatMap((course) => course.enrollments ?? []);
  const enrollmentStats = computeEnrollmentStats(flattenedEnrollments);
  const sanitizedCertifications = certifications.map((cert) => sanitizeCertification(cert));
  const { upcomingRenewals, nextRenewal } = computeRenewalInsights(sanitizedCertifications);

  return {
    freelancerId: userId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalCourses: enrollmentStats.total,
      inProgressCourses: enrollmentStats.inProgress,
      completedCourses: enrollmentStats.completed,
      completionRate: enrollmentStats.completionRate,
      mentoringSessionsScheduled: mentoringSessions.filter((session) => session.status === 'scheduled').length,
      activeDiagnostics: diagnostics.length,
      certificationCount: certifications.length,
      upcomingRenewals: upcomingRenewals.length,
      nextRenewal,
    },
    serviceLines: aggregatedServiceLines,
    certifications: sanitizedCertifications,
    recommendations: recommendations.map((rec) => sanitizeRecommendation(rec)),
  };
}

export async function enrollInCourse(freelancerId, courseId) {
  const userId = assertFreelancerId(freelancerId);
  const course = await LearningCourse.findByPk(courseId);
  if (!course) {
    throw new NotFoundError('Course not found.');
  }

  const [enrollment, created] = await LearningCourseEnrollment.findOrCreate({
    where: { userId, courseId: course.id },
    defaults: {
      status: 'in_progress',
      progress: 0,
      startedAt: new Date(),
    },
  });

  if (!created) {
    await enrollment.update({
      status: enrollment.status === 'archived' ? 'in_progress' : enrollment.status,
      startedAt: enrollment.startedAt ?? new Date(),
    });
  }

  const refreshedCourse = await LearningCourse.findByPk(course.id, {
    include: [
      { model: LearningCourseModule, as: 'modules' },
      {
        model: LearningCourseEnrollment,
        as: 'enrollments',
        required: false,
        where: { userId },
      },
    ],
  });

  const sanitized = sanitizeCourse(refreshedCourse, userId);
  return {
    enrollment: sanitized.enrollment,
    course: sanitized,
  };
}

export async function updateEnrollmentProgress(freelancerId, enrollmentId, { status, progress, notes }) {
  const userId = assertFreelancerId(freelancerId);
  const enrollment = await LearningCourseEnrollment.findByPk(enrollmentId, {
    include: [{ model: LearningCourse, as: 'course', include: [{ model: LearningCourseModule, as: 'modules' }] }],
  });

  if (!enrollment || enrollment.userId !== userId) {
    throw new NotFoundError('Enrollment not found for freelancer.');
  }

  const updates = {};
  if (status && LEARNING_ENROLLMENT_STATUSES.includes(status)) {
    updates.status = status;
  }
  if (progress != null) {
    const normalizedProgress = Math.min(100, Math.max(0, Number(progress)));
    if (!Number.isNaN(normalizedProgress)) {
      updates.progress = normalizedProgress;
      if (normalizedProgress > 0 && !enrollment.startedAt) {
        updates.startedAt = new Date();
      }
      if (normalizedProgress >= 100) {
        updates.status = 'completed';
        updates.completedAt = new Date();
      }
    }
  }
  if (notes !== undefined) {
    updates.notes = notes;
  }

  await enrollment.update(updates);

  const refreshedCourse = await LearningCourse.findByPk(enrollment.courseId, {
    include: [
      { model: LearningCourseModule, as: 'modules' },
      {
        model: LearningCourseEnrollment,
        as: 'enrollments',
        required: false,
        where: { userId },
      },
    ],
  });

  const sanitized = sanitizeCourse(refreshedCourse, userId);
  return {
    enrollment: sanitized.enrollment,
    course: sanitized,
  };
}

export async function scheduleMentoringSession(
  freelancerId,
  { mentorId, serviceLineId, topic, agenda, scheduledAt, durationMinutes, meetingUrl },
) {
  const userId = assertFreelancerId(freelancerId);
  if (!mentorId) {
    throw new ValidationError('mentorId is required.');
  }
  if (!topic) {
    throw new ValidationError('topic is required.');
  }
  if (!scheduledAt) {
    throw new ValidationError('scheduledAt is required.');
  }

  const payload = {
    mentorId,
    menteeId: userId,
    serviceLineId: serviceLineId ?? null,
    topic,
    agenda: agenda ?? null,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes == null ? null : Number(durationMinutes),
    status: 'scheduled',
    meetingUrl: meetingUrl ?? null,
  };

  const session = await PeerMentoringSession.create(payload);
  const refreshed = await PeerMentoringSession.findByPk(session.id, {
    include: [
      { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] },
    ],
  });

  return sanitizeMentoringSession(refreshed);
}

export async function recordSkillDiagnostic(
  freelancerId,
  { serviceLineId, summary, strengths, gaps, recommendedActions, completedAt },
) {
  const userId = assertFreelancerId(freelancerId);

  const diagnostic = await SkillGapDiagnostic.create({
    userId,
    serviceLineId: serviceLineId ?? null,
    summary: summary ?? null,
    strengths: strengths ?? null,
    gaps: gaps ?? null,
    recommendedActions: recommendedActions ?? null,
    completedAt: completedAt ? new Date(completedAt) : new Date(),
  });

  return sanitizeDiagnostic(diagnostic);
}

export async function acknowledgeCertificationReminder(freelancerId, certificationId) {
  const userId = assertFreelancerId(freelancerId);
  const certification = await FreelancerCertification.findByPk(certificationId);
  if (!certification || certification.userId !== userId) {
    throw new NotFoundError('Certification not found for freelancer.');
  }

  await certification.update({ reminderSentAt: new Date() });
  return sanitizeCertification(certification);
}

export default {
  getFreelancerLearningHub,
  enrollInCourse,
  updateEnrollmentProgress,
  scheduleMentoringSession,
  recordSkillDiagnostic,
  acknowledgeCertificationReminder,
};
