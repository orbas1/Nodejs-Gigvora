import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import { AuthorizationError, NotFoundError, ValidationError } from '../../src/utils/errors.js';

const calendarModelMock = {
  FreelancerCalendarEvent: {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
  FREELANCER_CALENDAR_EVENT_TYPES: ['project', 'gig', 'mentorship', 'job_interview', 'other'],
  FREELANCER_CALENDAR_EVENT_STATUSES: ['confirmed', 'tentative', 'in_progress', 'completed', 'cancelled'],
  FREELANCER_CALENDAR_RELATED_TYPES: ['project', 'gig', 'job', 'mentorship', 'volunteering'],
};

Object.keys(global.__mockSequelizeModels).forEach((key) => delete global.__mockSequelizeModels[key]);
Object.assign(global.__mockSequelizeModels, calendarModelMock);

const {
  listFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
} = await import('../../src/services/freelancerCalendarService.js');

function resetCalendarMocks() {
  Object.values(calendarModelMock.FreelancerCalendarEvent).forEach((maybeFn) => {
    if (typeof maybeFn?.mockReset === 'function') {
      maybeFn.mockReset();
    }
  });
}

describe('freelancerCalendarService', () => {
  beforeEach(() => {
    resetCalendarMocks();
    jest.useRealTimers();
  });

  describe('listFreelancerCalendarEvents', () => {
    it('validates identifiers and query constraints before fetching', async () => {
      await expect(listFreelancerCalendarEvents('abc')).rejects.toThrow(ValidationError);
      await expect(listFreelancerCalendarEvents(3, { limit: 'bad' })).rejects.toThrow('positive integer');
      await expect(
        listFreelancerCalendarEvents(3, { startDate: '2024-06-01', endDate: '2024-05-01' }),
      ).rejects.toThrow('startDate must be before endDate');
    });

    it('filters calendar events and computes engagement metrics', async () => {
      const now = new Date('2024-05-01T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const events = [
        {
          id: 1,
          title: 'Client kickoff',
          eventType: 'project',
          status: 'confirmed',
          startsAt: '2024-05-02T09:00:00.000Z',
        },
        {
          id: 2,
          title: 'Website audit',
          eventType: 'gig',
          status: 'completed',
          startsAt: '2024-04-20T10:00:00.000Z',
        },
        {
          id: 3,
          title: 'Mentorship sync',
          eventType: 'mentorship',
          status: 'in_progress',
          startsAt: '2024-04-18T13:30:00.000Z',
        },
        {
          id: 4,
          title: 'Status update',
          eventType: 'project',
          status: 'confirmed',
          startsAt: null,
        },
      ];

      calendarModelMock.FreelancerCalendarEvent.findAll.mockResolvedValue(
        events.map((event) => ({
          toPublicObject: () => ({ ...event }),
        })),
      );

      const result = await listFreelancerCalendarEvents('42', {
        startDate: '2024-04-01T00:00:00Z',
        endDate: '2024-06-01T00:00:00Z',
        types: ['project', 'gig'],
        statuses: ['confirmed', 'completed'],
        limit: 20,
      });

      expect(calendarModelMock.FreelancerCalendarEvent.findAll).toHaveBeenCalledTimes(1);
      const [{ where, order, limit }] = calendarModelMock.FreelancerCalendarEvent.findAll.mock.calls[0];
      expect(where.freelancerId).toBe(42);
      expect(where.startsAt[Op.between][0]).toEqual(new Date('2024-04-01T00:00:00.000Z'));
      expect(where.startsAt[Op.between][1]).toEqual(new Date('2024-06-01T00:00:00.000Z'));
      expect(where.eventType[Op.in]).toEqual(['project', 'gig']);
      expect(where.status[Op.in]).toEqual(['confirmed', 'completed']);
      expect(order).toEqual([
        ['startsAt', 'ASC'],
        ['createdAt', 'ASC'],
      ]);
      expect(limit).toBe(20);

      expect(result.events).toHaveLength(4);
      expect(result.metrics).toEqual({
        total: 4,
        upcomingCount: 1,
        pastCount: 2,
        overdueCount: 1,
        typeCounts: { project: 2, gig: 1, mentorship: 1 },
        statusCounts: { confirmed: 2, completed: 1, in_progress: 1 },
        nextEvent: events[0],
        range: {
          start: new Date('2024-04-01T00:00:00.000Z').toISOString(),
          end: new Date('2024-06-01T00:00:00.000Z').toISOString(),
        },
      });
      expect(typeof result.generatedAt).toBe('string');
    });
  });

  describe('createFreelancerCalendarEvent', () => {
    it('enforces actor ownership when creating events', async () => {
      await expect(
        createFreelancerCalendarEvent(5, { title: 'Kickoff', startsAt: new Date().toISOString() }, { actorId: 8 }),
      ).rejects.toThrow(AuthorizationError);
      expect(calendarModelMock.FreelancerCalendarEvent.create).not.toHaveBeenCalled();
    });

    it('persists sanitized payloads with defaults applied', async () => {
      const createdEvent = {
        toPublicObject: () => ({ id: 11, title: 'Kickoff', eventType: 'gig', color: '#7c3aed' }),
      };
      calendarModelMock.FreelancerCalendarEvent.create.mockResolvedValue(createdEvent);

      const payload = {
        title: '  Kickoff  ',
        eventType: 'gig',
        status: 'confirmed',
        startsAt: '2024-05-04T15:00:00.000Z',
        endsAt: '2024-05-04T16:00:00.000Z',
        reminderMinutesBefore: '15',
        notes: 'Prepare discovery brief',
      };

      const result = await createFreelancerCalendarEvent(5, payload, { actorId: 5 });

      expect(calendarModelMock.FreelancerCalendarEvent.create).toHaveBeenCalledTimes(1);
      const [creationPayload] = calendarModelMock.FreelancerCalendarEvent.create.mock.calls[0];
      expect(creationPayload).toMatchObject({
        freelancerId: 5,
        createdById: 5,
        updatedById: 5,
        color: '#7c3aed',
        source: 'manual',
        reminderMinutesBefore: 15,
      });
      expect(result).toEqual({ id: 11, title: 'Kickoff', eventType: 'gig', color: '#7c3aed' });
    });
  });

  describe('updateFreelancerCalendarEvent', () => {
    it('requires the event to exist before allowing updates', async () => {
      calendarModelMock.FreelancerCalendarEvent.findOne.mockResolvedValue(null);
      await expect(updateFreelancerCalendarEvent(3, { title: 'Missing' })).rejects.toThrow(NotFoundError);
    });

    it('applies partial updates while enforcing actor access', async () => {
      const persisted = {
        id: 12,
        freelancerId: 9,
        title: 'Discovery call',
        eventType: 'project',
        status: 'confirmed',
        notes: 'Existing notes',
        startsAt: '2024-05-05T09:00:00.000Z',
        color: '#2563eb',
        toPublicObject() {
          return {
            id: this.id,
            freelancerId: this.freelancerId,
            title: this.title,
            eventType: this.eventType,
            status: this.status,
            notes: this.notes,
            startsAt: this.startsAt,
            color: this.color,
          };
        },
        update: jest.fn(function update(patch) {
          Object.assign(this, patch);
          return this;
        }),
      };

      calendarModelMock.FreelancerCalendarEvent.findOne.mockResolvedValue(persisted);

      const result = await updateFreelancerCalendarEvent(
        12,
        { status: 'cancelled', notes: 'Rescheduled', actorId: 9 },
        { freelancerId: 9, actorId: 9 },
      );

      expect(persisted.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled', notes: 'Rescheduled', updatedById: 9 }),
      );
      expect(result.status).toBe('cancelled');
      expect(result.notes).toBe('Rescheduled');
    });

    it('rejects updates when the actor is not the owner', async () => {
      const persisted = {
        freelancerId: 2,
        toPublicObject: () => ({ id: 99, freelancerId: 2, eventType: 'gig', status: 'confirmed' }),
      };
      calendarModelMock.FreelancerCalendarEvent.findOne.mockResolvedValue(persisted);

      await expect(
        updateFreelancerCalendarEvent(99, { status: 'cancelled' }, { actorId: 5 }),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteFreelancerCalendarEvent', () => {
    it('deletes calendar events owned by the freelancer', async () => {
      const destroy = jest.fn().mockResolvedValue(true);
      const record = {
        id: 22,
        freelancerId: 6,
        toPublicObject: () => ({ id: 22 }),
        destroy,
      };
      calendarModelMock.FreelancerCalendarEvent.findOne.mockResolvedValue(record);

      const result = await deleteFreelancerCalendarEvent(22, { freelancerId: 6, actorId: 6 });

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('throws when the event cannot be found', async () => {
      calendarModelMock.FreelancerCalendarEvent.findOne.mockResolvedValue(null);
      await expect(deleteFreelancerCalendarEvent(77, { freelancerId: 7, actorId: 7 })).rejects.toThrow(NotFoundError);
    });
  });
});
