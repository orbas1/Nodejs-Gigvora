import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModulePath = new URL('../../models/index.js', import.meta.url).pathname;

const FREELANCER_CALENDAR_EVENT_TYPES = [
  'project',
  'gig',
  'job_interview',
  'mentorship',
  'volunteering',
  'client_meeting',
  'other',
];

const FREELANCER_CALENDAR_EVENT_STATUSES = ['tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const FREELANCER_CALENDAR_RELATED_TYPES = ['project', 'gig', 'job', 'mentorship', 'volunteering', 'client', 'community', 'other'];

describe('freelancerCalendarService', () => {
  let models;
  let createFreelancerCalendarEvent;
  let exportFreelancerCalendarEventInvite;

  beforeEach(async () => {
    jest.resetModules();
    models = {
      FreelancerCalendarEvent: {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
      },
    };

    jest.unstable_mockModule(modelsModulePath, () => ({
      FreelancerCalendarEvent: models.FreelancerCalendarEvent,
      FREELANCER_CALENDAR_EVENT_TYPES,
      FREELANCER_CALENDAR_EVENT_STATUSES,
      FREELANCER_CALENDAR_RELATED_TYPES,
    }));

    const service = await import('../freelancerCalendarService.js');
    createFreelancerCalendarEvent = service.createFreelancerCalendarEvent;
    exportFreelancerCalendarEventInvite = service.exportFreelancerCalendarEventInvite;
  });

  it('exports ICS invites with Gigvora metadata', async () => {
    const eventRecord = {
      toPublicObject: () => ({
        id: 42,
        freelancerId: 101,
        title: 'Client kickoff',
        eventType: 'client_meeting',
        status: 'confirmed',
        startsAt: '2024-05-20T15:00:00.000Z',
        endsAt: '2024-05-20T16:00:00.000Z',
        location: 'Zoom',
        meetingUrl: 'https://meet.gigvora.com/client-kickoff',
        reminderMinutesBefore: 30,
        metadata: { project: 'Atlas Revamp' },
        createdAt: '2024-05-18T10:00:00.000Z',
        updatedAt: '2024-05-19T09:00:00.000Z',
      }),
    };
    models.FreelancerCalendarEvent.findOne.mockResolvedValue(eventRecord);

    const result = await exportFreelancerCalendarEventInvite(42, { freelancerId: 101, actorId: 101 });

    expect(models.FreelancerCalendarEvent.findOne).toHaveBeenCalledWith({ where: { id: 42, freelancerId: 101 } });
    expect(result.filename).toBe('client-kickoff-42.ics');
    expect(result.ics).toContain('BEGIN:VCALENDAR');
    expect(result.ics).toContain('SUMMARY:Client kickoff');
    expect(result.ics).toContain('X-GIGVORA-FREELANCER-ID:101');
    expect(result.ics).toContain('STATUS:CONFIRMED');
  });

  it('creates planner events with actor context and default colour tokens', async () => {
    const storedEvent = {
      toPublicObject: () => ({
        id: 55,
        freelancerId: 101,
        title: 'Strategy deep dive',
        eventType: 'project',
        status: 'confirmed',
        startsAt: '2024-05-22T13:00:00.000Z',
        endsAt: '2024-05-22T15:00:00.000Z',
        color: '#2563eb',
      }),
    };
    models.FreelancerCalendarEvent.create.mockResolvedValue(storedEvent);

    const payload = {
      title: 'Strategy deep dive',
      eventType: 'project',
      status: 'confirmed',
      startsAt: '2024-05-22T13:00:00.000Z',
      endsAt: '2024-05-22T15:00:00.000Z',
      reminderMinutesBefore: 30,
      notes: 'Prepare metrics.',
    };

    const result = await createFreelancerCalendarEvent(101, payload, { actorId: 101 });

    expect(models.FreelancerCalendarEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        freelancerId: 101,
        title: 'Strategy deep dive',
        eventType: 'project',
        status: 'confirmed',
        createdById: 101,
        updatedById: 101,
        color: '#2563eb',
      }),
    );
    expect(result).toEqual(storedEvent.toPublicObject());
  });
});
