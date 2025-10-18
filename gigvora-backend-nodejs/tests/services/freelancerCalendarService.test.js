import { beforeEach, describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import { sequelize, User, FreelancerCalendarEvent } from '../../src/models/index.js';
import {
  listFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
} from '../../src/services/freelancerCalendarService.js';

function buildDateOffset(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('freelancerCalendarService', () => {
  let freelancer;

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    freelancer = await User.create({
      firstName: 'Taylor',
      lastName: 'Indigo',
      email: 'freelancer-calendar@example.com',
      password: 'secure-password',
      userType: 'freelancer',
    });
  });

  it('creates, retrieves, updates, and deletes calendar events', async () => {
    const startsAt = buildDateOffset(3);
    const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);

    const created = await createFreelancerCalendarEvent(
      freelancer.id,
      {
        title: 'Discovery session',
        eventType: 'project',
        status: 'confirmed',
        startsAt,
        endsAt,
        location: 'Zoom',
        relatedEntityType: 'project',
        relatedEntityName: 'Atlas Robotics revamp',
        reminderMinutesBefore: 30,
        notes: 'Bring updated brand audit.',
      },
      { actorId: freelancer.id },
    );

    expect(created.id).toBeDefined();
    expect(created.freelancerId).toBe(freelancer.id);
    expect(created.color).toBeDefined();
    expect(created.notes).toContain('brand audit');

    const listResponse = await listFreelancerCalendarEvents(freelancer.id, { lookaheadDays: 30 });
    expect(listResponse.events).toHaveLength(1);
    expect(listResponse.metrics.upcomingCount).toBe(1);
    expect(listResponse.metrics.typeCounts.project).toBe(1);

    const updated = await updateFreelancerCalendarEvent(
      created.id,
      {
        status: 'completed',
        notes: 'Session completed with action items.',
      },
      { freelancerId: freelancer.id, actorId: freelancer.id },
    );

    expect(updated.status).toBe('completed');
    expect(updated.notes).toContain('action items');

    await deleteFreelancerCalendarEvent(created.id, { freelancerId: freelancer.id, actorId: freelancer.id });

    const afterDelete = await listFreelancerCalendarEvents(freelancer.id, { lookaheadDays: 30 });
    expect(afterDelete.events).toHaveLength(0);
    expect(await FreelancerCalendarEvent.count()).toBe(0);
  });

  it('filters events by type and status and calculates metrics', async () => {
    const futureInterview = await createFreelancerCalendarEvent(
      freelancer.id,
      {
        title: 'Interview with Finley Capital',
        eventType: 'job_interview',
        status: 'confirmed',
        startsAt: buildDateOffset(5),
        location: 'Google Meet',
      },
      { actorId: freelancer.id },
    );

    await createFreelancerCalendarEvent(
      freelancer.id,
      {
        title: 'Mentorship retrospective',
        eventType: 'mentorship',
        status: 'completed',
        startsAt: buildDateOffset(-2),
        notes: 'Wrap-up from Q1 cohort.',
      },
      { actorId: freelancer.id },
    );

    await createFreelancerCalendarEvent(
      freelancer.id,
      {
        title: 'Volunteer clinic',
        eventType: 'volunteering',
        status: 'tentative',
        startsAt: buildDateOffset(-5),
      },
      { actorId: freelancer.id },
    );

    const filtered = await listFreelancerCalendarEvents(freelancer.id, {
      types: 'job_interview',
      lookbackDays: 10,
      lookaheadDays: 10,
    });

    expect(filtered.events).toHaveLength(1);
    expect(filtered.events[0].id).toBe(futureInterview.id);
    expect(filtered.metrics.typeCounts.job_interview).toBe(1);
    expect(filtered.metrics.overdueCount).toBe(1);
    expect(filtered.metrics.upcomingCount).toBe(1);
  });

  it('validates chronological integrity of events', async () => {
    await expect(
      createFreelancerCalendarEvent(
        freelancer.id,
        {
          title: 'Timeline review',
          eventType: 'project',
          startsAt: buildDateOffset(2),
          endsAt: buildDateOffset(1),
        },
        { actorId: freelancer.id },
      ),
    ).rejects.toThrow('endsAt must be greater than or equal to startsAt');
  });
});
