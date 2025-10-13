import { describe, it, expect } from '@jest/globals';
import {
  getFreelancerLearningHub,
  enrollInCourse,
  updateEnrollmentProgress,
  scheduleMentoringSession,
  recordSkillDiagnostic,
  acknowledgeCertificationReminder,
} from '../src/services/learningHubService.js';
import {
  ServiceLine,
  LearningCourse,
  LearningCourseModule,
  PeerMentoringSession,
  SkillGapDiagnostic,
  FreelancerCertification,
  AiServiceRecommendation,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

describe('learningHubService', () => {
  it('aggregates learning hub data with enrollments, mentoring, diagnostics, certifications, and recommendations', async () => {
    const freelancer = await createUser({ userType: 'freelancer', firstName: 'Riley', lastName: 'Morgan' });
    const mentor = await createUser({ userType: 'freelancer', firstName: 'Jordan', lastName: 'Mentor' });

    const designLine = await ServiceLine.create({ name: 'Design Ops', slug: 'design-ops' });
    const automationLine = await ServiceLine.create({ name: 'Revenue Automation', slug: 'revenue-automation' });

    const designCourse = await LearningCourse.create({
      serviceLineId: designLine.id,
      title: 'Designing Conversion Systems',
      difficulty: 'advanced',
      format: 'cohort',
      durationHours: 12,
      tags: ['brand', 'motion'],
    });
    const automationCourse = await LearningCourse.create({
      serviceLineId: automationLine.id,
      title: 'Lifecycle Automation Architecture',
      difficulty: 'intermediate',
      format: 'mentor-led',
      durationHours: 10,
      tags: ['revops'],
    });

    await LearningCourseModule.bulkCreate([
      {
        courseId: designCourse.id,
        title: 'Customer research synthesis',
        moduleType: 'workshop',
        durationMinutes: 45,
        sequence: 1,
      },
      {
        courseId: automationCourse.id,
        title: 'CRM data harmonisation',
        moduleType: 'lab',
        durationMinutes: 60,
        sequence: 1,
      },
    ]);

    const { enrollment: designEnrollment } = await enrollInCourse(freelancer.id, designCourse.id);
    const { enrollment: automationEnrollment } = await enrollInCourse(freelancer.id, automationCourse.id);

    await updateEnrollmentProgress(freelancer.id, designEnrollment.id, { progress: 40 });
    await updateEnrollmentProgress(freelancer.id, automationEnrollment.id, { progress: 100 });

    const mentoringSession = await scheduleMentoringSession(freelancer.id, {
      mentorId: mentor.id,
      serviceLineId: designLine.id,
      topic: 'Motion systems review',
      agenda: 'Review portfolio and plan sprint retro',
      scheduledAt: futureDate(3).toISOString(),
      durationMinutes: 45,
      meetingUrl: 'https://meet.example.com/session',
    });

    expect(mentoringSession.status).toBe('scheduled');

    const diagnostic = await recordSkillDiagnostic(freelancer.id, {
      serviceLineId: designLine.id,
      summary: 'Strength in storytelling, needs experimentation frameworks',
      strengths: ['storytelling', 'visual systems'],
      gaps: ['experimentation'],
      recommendedActions: ['Complete experimentation lab'],
      completedAt: futureDate(-1).toISOString(),
    });

    expect(diagnostic.summary).toContain('Strength');

    const certification = await FreelancerCertification.create({
      userId: freelancer.id,
      serviceLineId: designLine.id,
      name: 'HubSpot Solutions Partner',
      issuingOrganization: 'HubSpot',
      issueDate: futureDate(-120),
      expirationDate: futureDate(18),
      status: 'active',
    });

    const acknowledgedCertification = await acknowledgeCertificationReminder(freelancer.id, certification.id);
    expect(acknowledgedCertification.reminderSentAt).toBeTruthy();

    await AiServiceRecommendation.create({
      userId: freelancer.id,
      serviceLineId: automationLine.id,
      title: 'Launch RevOps experiment package',
      description: 'Clients searching for automation sprints near your profile speciality.',
      confidenceScore: 82,
      generatedAt: futureDate(-2),
    });

    const overview = await getFreelancerLearningHub(freelancer.id, { includeServiceLinesWithoutCourses: true });

    expect(overview.freelancerId).toBe(freelancer.id);
    expect(overview.summary.totalCourses).toBe(2);
    expect(overview.summary.inProgressCourses).toBe(1);
    expect(overview.summary.completedCourses).toBe(1);
    expect(overview.summary.mentoringSessionsScheduled).toBe(1);
    expect(overview.summary.certificationCount).toBe(1);
    expect(overview.summary.upcomingRenewals).toBeGreaterThanOrEqual(1);
    expect(overview.summary.nextRenewal?.name).toBe('HubSpot Solutions Partner');

    const designLineOverview = overview.serviceLines.find((line) => line.id === designLine.id);
    expect(designLineOverview?.courses).toHaveLength(1);
    expect(designLineOverview?.mentoringSessions).toHaveLength(1);
    expect(designLineOverview?.diagnostics).toHaveLength(1);
    expect(designLineOverview?.certifications).toHaveLength(1);

    const automationLineOverview = overview.serviceLines.find((line) => line.id === automationLine.id);
    expect(automationLineOverview?.courses).toHaveLength(1);
    expect(automationLineOverview?.recommendations).toHaveLength(1);

    // includeServiceLinesWithoutCourses should still list service lines even if we remove activity later
    const sessionRecord = await PeerMentoringSession.findByPk(mentoringSession.id);
    await sessionRecord.update({ status: 'completed' });
    const diagnosticRecord = await SkillGapDiagnostic.findByPk(diagnostic.id);
    await diagnosticRecord.update({ recommendedActions: ['Document learnings'] });

    const refreshedOverview = await getFreelancerLearningHub(freelancer.id, { includeServiceLinesWithoutCourses: true });
    expect(refreshedOverview.serviceLines.some((line) => line.id === automationLine.id)).toBe(true);
    expect(refreshedOverview.recommendations).toHaveLength(1);
  });
});
