import { describe, expect, it, beforeEach } from '@jest/globals';
import {
  Profile,
  Connection,
  Application,
  ApplicationReview,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  Notification,
  Project,
  ProjectAssignmentEvent,
  Job,
  Gig,
} from '../src/models/index.js';
import userDashboardService from '../src/services/userDashboardService.js';
import { createUser } from './helpers/factories.js';

const now = () => new Date();

describe('userDashboardService', () => {
  let user;
  let reviewer;
  let job;
  let gig;
  let project;
  let launchpad;
  let interviewApplication;

  beforeEach(async () => {
    user = await createUser({ firstName: 'Avery', lastName: 'Stone', userType: 'user' });
    reviewer = await createUser({ firstName: 'Riley', lastName: 'Recruiter', userType: 'company' });
    const connectionPeer = await createUser({ firstName: 'Jordan', lastName: 'Mentor', userType: 'user' });

    await Profile.create({
      userId: user.id,
      headline: 'Product Designer & Job Seeker',
      bio: 'Designs data-informed experiences across product pods and launchpad cohorts.',
      skills: 'Product design,Design systems,UX research,Analytics storytelling',
      experience: 'Seven years of product design across marketplaces and launch programmes.',
      availabilityStatus: 'limited',
      availableHoursPerWeek: 28,
      availabilityUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      launchpadEligibility: { status: 'eligible', score: 89.5, cohorts: ['Emerging Leaders Fellowship'] },
      portfolioLinks: [
        { label: 'Case study – onboarding revamp', url: 'https://portfolio.avery.example.com/onboarding' },
      ],
      missionStatement: 'Ship inclusive hiring journeys with measurable impact.',
    });

    await Connection.create({ requesterId: user.id, addresseeId: connectionPeer.id, status: 'accepted' });

    job = await Job.create({
      title: 'Lead Product Designer',
      description: 'Own candidate experience and cross-functional design rituals.',
      location: 'Remote – UK/EU overlap',
    });

    gig = await Gig.create({
      title: 'Design Sprint Facilitator',
      description: 'Run discovery sprint for marketplace onboarding improvements.',
      budget: '$4,800',
      duration: '4 weeks',
    });

    project = await Project.create({
      title: 'Community Portal Revamp',
      description: 'Refactor the community experience with analytics instrumentation.',
      status: 'Planning',
    });

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    interviewApplication = await Application.create({
      applicantId: user.id,
      targetType: 'job',
      targetId: job.id,
      status: 'interview',
      submittedAt: fiveDaysAgo,
      updatedAt: yesterday,
      attachments: [
        {
          fileName: 'avery-stone-cv.pdf',
          storageKey: 'applications/avery-stone-cv.pdf',
          mimeType: 'application/pdf',
        },
      ],
      metadata: { interviewScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    });

    await ApplicationReview.create({
      applicationId: interviewApplication.id,
      reviewerId: reviewer.id,
      stage: 'interview',
      decision: 'advance',
      decidedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    await Application.create({
      applicantId: user.id,
      targetType: 'gig',
      targetId: gig.id,
      status: 'submitted',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      attachments: [],
    });

    launchpad = await ExperienceLaunchpad.create({
      title: 'Emerging Leaders Fellowship',
      description: 'Mentorship-driven programme for multidisciplinary talent.',
      track: 'Product Leadership',
      location: 'Hybrid – London',
      programType: 'cohort',
      status: 'active',
    });

    await ExperienceLaunchpadApplication.create({
      launchpadId: launchpad.id,
      applicantId: user.id,
      applicationId: interviewApplication.id,
      status: 'interview',
      qualificationScore: 88.5,
      interviewScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await Notification.create({
      userId: user.id,
      category: 'system',
      type: 'application_update',
      title: 'Interview confirmed',
      body: 'Recruiter Riley confirmed the interview slot for Lead Product Designer.',
      status: 'delivered',
      deliveredAt: now(),
      readAt: null,
    });

    await Notification.create({
      userId: user.id,
      category: 'system',
      type: 'digest',
      title: 'Weekly pipeline digest',
      body: 'Review follow-ups for two in-progress opportunities.',
      status: 'read',
      deliveredAt: now(),
      readAt: now(),
    });

    await ProjectAssignmentEvent.create({
      projectId: project.id,
      actorId: user.id,
      eventType: 'auto_assign_queue_generated',
      payload: { queueSize: 3, triggeredBy: 'manual_regeneration' },
      createdAt: yesterday,
      updatedAt: yesterday,
    });
  });

  it('aggregates pipeline, documents, launchpad, and task insights for a user', async () => {
    const dashboard = await userDashboardService.getUserDashboard(user.id, { bypassCache: true });

    expect(dashboard.summary.totalApplications).toBe(2);
    expect(dashboard.summary.activeApplications).toBe(2);
    expect(dashboard.summary.interviewsScheduled).toBe(1);
    expect(dashboard.summary.connections).toBe(1);

    expect(dashboard.pipeline.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'interview', count: 1 }),
        expect.objectContaining({ status: 'submitted', count: 1 }),
      ]),
    );

    expect(dashboard.documents.attachments).toHaveLength(1);
    expect(dashboard.documents.portfolioLinks[0]).toMatchObject({ label: expect.any(String), url: expect.any(String) });
    expect(dashboard.notifications.unreadCount).toBe(1);
    expect(dashboard.notifications.recent.length).toBe(2);
    expect(dashboard.launchpad.applications[0]).toMatchObject({ launchpadId: launchpad.id, status: 'interview' });
    expect(dashboard.projectActivity.recent[0].project.title).toBe('Community Portal Revamp');

    expect(dashboard.tasks.followUps.length).toBeGreaterThan(0);
    expect(dashboard.tasks.automations.length).toBeGreaterThan(0);

    expect(dashboard.interviews[0]).toMatchObject({
      applicationId: interviewApplication.id,
      targetName: 'Lead Product Designer',
      status: 'interview',
    });
  });
});
