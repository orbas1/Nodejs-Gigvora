import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';

const {
  __setModelStubs,
  sequelize: modelSequelize,
  CollaborationHuddle,
  CollaborationHuddleParticipant,
  CollaborationHuddleTemplate,
  CollaborationRoom,
  CollaborationSpace,
  User,
  UserPresenceStatus,
  UserPresenceEvent,
} = await import(modelsModuleSpecifier);

const {
  getHuddleContext,
  createHuddle,
  scheduleHuddle,
} = await import('../huddleService.js');

describe('huddleService', () => {
  let huddleStub;
  let participantStub;
  let templateStub;
  let roomStub;
  let userStub;
  let presenceStatusStub;
  let presenceEventStub;
  let transaction;

  beforeEach(() => {
    transaction = { LOCK: { UPDATE: 'UPDATE' } };
    modelSequelize.transaction = jest.fn(async (handler) => handler(transaction));

    huddleStub = {
      findAll: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    participantStub = {
      count: jest.fn(),
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
    };
    templateStub = { findAll: jest.fn() };
    roomStub = { findAll: jest.fn() };
    userStub = { findAll: jest.fn() };
    presenceStatusStub = { findOrCreate: jest.fn() };
    presenceEventStub = { bulkCreate: jest.fn() };

    __setModelStubs({
      CollaborationHuddle: huddleStub,
      CollaborationHuddleParticipant: participantStub,
      CollaborationHuddleTemplate: templateStub,
      CollaborationRoom: roomStub,
      CollaborationSpace: {},
      User: userStub,
      UserPresenceStatus: presenceStatusStub,
      UserPresenceEvent: presenceEventStub,
    });

    CollaborationHuddle.findAll = huddleStub.findAll.bind(huddleStub);
    CollaborationHuddle.create = huddleStub.create.bind(huddleStub);
    CollaborationHuddle.count = huddleStub.count.bind(huddleStub);
    CollaborationHuddle.findOne = huddleStub.findOne.bind(huddleStub);
    CollaborationHuddle.update = huddleStub.update.bind(huddleStub);
    CollaborationHuddleParticipant.count = participantStub.count.bind(participantStub);
    CollaborationHuddleParticipant.bulkCreate = participantStub.bulkCreate.bind(participantStub);
    CollaborationHuddleParticipant.findAll = participantStub.findAll.bind(participantStub);
    CollaborationHuddleTemplate.findAll = templateStub.findAll.bind(templateStub);
    CollaborationRoom.findAll = roomStub.findAll.bind(roomStub);
    User.findAll = userStub.findAll.bind(userStub);
    UserPresenceStatus.findOrCreate = presenceStatusStub.findOrCreate.bind(presenceStatusStub);
    UserPresenceEvent.bulkCreate = presenceEventStub.bulkCreate.bind(presenceEventStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides context with upcoming huddles, recordings, templates, rooms, and stats', async () => {
    const upcoming = [
      {
        toPublicObject: () => ({ id: 10, title: 'Launch readiness' }),
        participants: [{}, {}],
      },
    ];
    const recordings = [
      { toPublicObject: () => ({ id: 8, title: 'Retrospective' }) },
    ];
    const templates = [
      { toPublicObject: () => ({ id: 3, title: 'Executive Sync' }) },
    ];
    const rooms = [
      { toPublicObject: () => ({ id: 5, name: 'Green room' }) },
    ];

    huddleStub.findAll
      .mockResolvedValueOnce(upcoming)
      .mockResolvedValueOnce(recordings);
    templateStub.findAll.mockResolvedValue(templates);
    roomStub.findAll.mockResolvedValue(rooms);
    huddleStub.count.mockResolvedValue(4);
    participantStub.count.mockResolvedValue(12);

    const context = await getHuddleContext({ workspaceId: 2, projectId: 7 });

    expect(context.filters).toEqual({ workspaceId: 2, projectId: 7 });
    expect(context.upcoming).toEqual([
      expect.objectContaining({ id: 10, participantCount: 2 }),
    ]);
    expect(context.recentRecordings).toEqual([{ id: 8, title: 'Retrospective' }]);
    expect(context.templates).toEqual([{ id: 3, title: 'Executive Sync' }]);
    expect(context.focusRooms).toEqual([{ id: 5, name: 'Green room' }]);
    expect(context.stats).toEqual({ totalHuddles: 4, totalParticipants: 12, averageParticipants: 3 });
  });

  it('creates huddles, invites attendees, and records presence events', async () => {
    const created = {
      id: 91,
      toPublicObject: () => ({ id: 91, title: 'Operations sync' }),
    };
    huddleStub.create.mockResolvedValue(created);
    participantStub.bulkCreate.mockResolvedValue([]);
    presenceStatusStub.findOrCreate.mockResolvedValue([{}, false]);

    const result = await createHuddle(
      {
        workspaceId: 4,
        projectId: 9,
        followUpRoomId: 15,
        attendeeIds: [101, 102],
        agenda: '1. Updates\n2. Next steps',
        title: 'Ops weekly',
        notes: 'Align on escalations',
      },
      { actorId: 77 },
    );

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(huddleStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 4,
        projectId: 9,
        followUpRoomId: 15,
        title: 'Ops weekly',
        agenda: '1. Updates\n2. Next steps',
        notes: 'Align on escalations',
      }),
      { transaction },
    );
    expect(participantStub.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({ huddleId: 91, userId: 101, responseStatus: 'invited' }),
        expect.objectContaining({ huddleId: 91, userId: 102, responseStatus: 'invited' }),
      ],
      expect.objectContaining({ transaction, ignoreDuplicates: true }),
    );
    expect(presenceEventStub.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: 77, eventType: 'huddle' }),
      ]),
      expect.objectContaining({ transaction }),
    );
    expect(presenceStatusStub.findOrCreate).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ id: 91, title: 'Operations sync' });
  });

  it('schedules huddles and logs timeline events for members', async () => {
    const huddleRecord = {
      id: 501,
      title: 'Growth plan review',
      scheduledStart: null,
      scheduledDurationMinutes: null,
      status: 'draft',
      save: jest.fn(),
      toPublicObject: () => ({ id: 501, title: 'Growth plan review', status: 'scheduled' }),
    };
    huddleStub.findOne.mockResolvedValue(huddleRecord);
    participantStub.findAll.mockResolvedValue([
      { userId: 101 },
      { userId: 102 },
    ]);

    const response = await scheduleHuddle(
      501,
      { startsAt: '2024-05-21T09:00:00.000Z', durationMinutes: 40 },
      { actorId: 77 },
    );

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(huddleRecord.save).toHaveBeenCalled();
    expect(huddleRecord.scheduledStart).toBeInstanceOf(Date);
    expect(huddleRecord.scheduledDurationMinutes).toBe(40);
    expect(huddleRecord.status).toBe('scheduled');
    expect(presenceEventStub.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: 77, metadata: expect.objectContaining({ huddleId: 501 }) }),
        expect.objectContaining({ userId: 101 }),
        expect.objectContaining({ userId: 102 }),
      ]),
      expect.objectContaining({ transaction }),
    );
    expect(response).toEqual({ id: 501, title: 'Growth plan review', status: 'scheduled' });
  });
});
