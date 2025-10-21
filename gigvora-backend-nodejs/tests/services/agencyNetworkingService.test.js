import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const ProviderWorkspace = { findOne: jest.fn() };
const ProviderWorkspaceMember = { findOne: jest.fn(), findAll: jest.fn(), count: jest.fn() };
const NetworkingSession = { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() };
const NetworkingSessionSignup = { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() };
const NetworkingSessionOrder = { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() };
const NetworkingConnection = { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() };
const NetworkingSessionOrderPrototype = { update: jest.fn(), reload: jest.fn() };
const User = { findAll: jest.fn(), findByPk: jest.fn() };

await jest.unstable_mockModule(modelsModulePath, () => ({
  ProviderWorkspace,
  ProviderWorkspaceMember,
  NetworkingSession,
  NetworkingSessionSignup,
  NetworkingSessionOrder,
  NetworkingConnection,
  User,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyNetworkingService.js');

const {
  getOverview,
  createBooking,
  updatePurchase,
  createConnection,
} = await import(serviceModulePath);

const { ValidationError } = await import('../../src/utils/errors.js');

const baseWorkspace = {
  id: 202,
  name: 'Summit Agency',
  slug: 'summit-agency',
  type: 'agency',
  ownerId: 9,
  defaultCurrency: 'USD',
};

function createRow(plain) {
  return {
    ...plain,
    get: jest.fn((arg = {}) => {
      if (typeof arg === 'string') {
        return plain[arg];
      }
      const { plain: usePlain } = arg;
      return usePlain ? { ...plain } : { ...plain };
    }),
  };
}

function createMutableRecord(initialPlain) {
  const state = { ...initialPlain };
  const record = {
    update: jest.fn(async (updates = {}) => {
      Object.assign(state, updates);
    }),
    reload: jest.fn(async () => createRow(state)),
    get: jest.fn(({ plain } = {}) => (plain ? { ...state } : { ...state })),
  };
  return record;
}

function resetMocks() {
  ProviderWorkspace.findOne.mockReset().mockResolvedValue(baseWorkspace);
  ProviderWorkspaceMember.findOne.mockReset();
  ProviderWorkspaceMember.findAll.mockReset().mockResolvedValue([]);
  ProviderWorkspaceMember.count.mockReset().mockResolvedValue(1);
  NetworkingSession.findAll.mockReset();
  NetworkingSession.findOne.mockReset();
  NetworkingSession.findByPk.mockReset();
  NetworkingSessionSignup.findAll.mockReset();
  NetworkingSessionSignup.findByPk.mockReset();
  NetworkingSessionSignup.create.mockReset();
  NetworkingSessionOrder.findAll.mockReset();
  NetworkingSessionOrder.findByPk.mockReset();
  NetworkingSessionOrder.create.mockReset();
  NetworkingConnection.findAll.mockReset();
  NetworkingConnection.findByPk.mockReset();
  NetworkingConnection.create.mockReset();
  User.findAll.mockReset();
  User.findByPk.mockReset();
}

describe('agencyNetworkingService', () => {
  const actor = { actorId: baseWorkspace.ownerId, actorRoles: ['admin'] };

  beforeEach(() => {
    resetMocks();
  });

  it('builds a workspace overview with bookings, purchases, and connections', async () => {
    const sessionStart = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const sessionPlain = {
      id: 5001,
      title: 'Growth Roundtable',
      slug: 'growth-roundtable',
      startTime: sessionStart,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      accessType: 'hosted',
      priceCents: 9900,
      currency: 'USD',
      companyId: baseWorkspace.id,
    };

    const bookingRow = createRow({
      id: 8801,
      sessionId: sessionPlain.id,
      participantId: 77,
      participantEmail: 'attendee@example.com',
      participantName: 'Jordan Fields',
      status: 'confirmed',
      seatNumber: 3,
      joinUrl: 'https://meet.gigvora.test/join/8801',
      checkedInAt: '2024-05-01T14:55:00.000Z',
      completedAt: '2024-05-01T15:45:00.000Z',
      connectionsSaved: 5,
      followUpsScheduled: 2,
      satisfactionScore: 4.6,
      metadata: { userNotes: 'Prefers follow up call' },
      session: sessionPlain,
      createdAt: '2024-04-28T10:00:00.000Z',
      updatedAt: '2024-04-28T10:00:00.000Z',
    });

    const orderRow = createRow({
      id: 9901,
      sessionId: sessionPlain.id,
      purchaserId: actor.actorId,
      purchaserEmail: 'ops@summitagency.test',
      purchaserName: 'Avery Summit',
      status: 'paid',
      amountCents: 12900,
      currency: 'USD',
      purchasedAt: '2024-04-25T12:00:00.000Z',
      reference: 'ORDER-9901',
      metadata: { userNotes: 'Bulk purchase' },
      session: sessionPlain,
      createdAt: '2024-04-25T12:00:00.000Z',
      updatedAt: '2024-04-25T12:00:00.000Z',
    });

    const connectionRow = createRow({
      id: 4201,
      ownerId: actor.actorId,
      connectionUserId: 88,
      sessionId: sessionPlain.id,
      connectionName: 'Taylor Mentor',
      connectionEmail: 'taylor@mentor.test',
      followStatus: 'engaged',
      connectedAt: '2024-05-01T16:00:00.000Z',
      lastContactedAt: '2024-05-03T10:00:00.000Z',
      notes: 'Interested in partnership',
      tags: ['partnership'],
      metadata: { workspaceId: baseWorkspace.id },
      session: sessionPlain,
      owner: { id: actor.actorId, firstName: 'Avery', lastName: 'Summit', email: 'ops@summitagency.test' },
      contact: { id: 88, firstName: 'Taylor', lastName: 'Mentor', email: 'taylor@mentor.test' },
      createdAt: '2024-05-01T16:00:00.000Z',
      updatedAt: '2024-05-03T10:00:00.000Z',
    });

    ProviderWorkspaceMember.findAll.mockResolvedValue([{ userId: baseWorkspace.ownerId }]);
    NetworkingSessionSignup.findAll.mockResolvedValue([bookingRow]);
    NetworkingSessionOrder.findAll.mockResolvedValue([orderRow]);
    NetworkingConnection.findAll.mockResolvedValue([connectionRow]);

    const overview = await getOverview({ workspaceId: baseWorkspace.id }, actor);

    expect(overview.workspace.slug).toBe('summit-agency');
    expect(overview.summary.sessionsBooked).toBe(1);
    expect(overview.summary.upcomingSessions).toBeGreaterThanOrEqual(1);
    expect(overview.bookings.total).toBe(1);
    expect(overview.purchases.total).toBe(1);
    expect(overview.purchases.totalSpendCents).toBe(12900);
    expect(overview.connections.list[0]).toMatchObject({ connectionName: 'Taylor Mentor', followStatus: 'engaged' });
  });

  it('creates bookings with enriched metadata and participant details', async () => {
    const sessionPlain = { id: 2001, companyId: baseWorkspace.id, currency: 'USD' };
    NetworkingSession.findOne.mockResolvedValue(sessionPlain);
    User.findByPk.mockResolvedValue({ id: 77, firstName: 'Jordan', lastName: 'Fields', email: 'attendee@example.com' });

    NetworkingSessionSignup.create.mockImplementation(async (payload) => {
      expect(payload.sessionId).toBe(sessionPlain.id);
      expect(payload.metadata.createdByWorkspaceId).toBe(baseWorkspace.id);
      expect(payload.metadata.createdByUserId).toBe(actor.actorId);
      return { id: 8802 };
    });

    const createdBooking = createRow({
      id: 8802,
      sessionId: sessionPlain.id,
      participantId: 77,
      participantEmail: 'attendee@example.com',
      participantName: 'Jordan Fields',
      status: 'registered',
      seatNumber: 5,
      metadata: { userNotes: 'Prefers SMS reminder' },
      session: sessionPlain,
      createdAt: '2024-04-29T10:00:00.000Z',
      updatedAt: '2024-04-29T10:00:00.000Z',
    });

    NetworkingSessionSignup.findByPk.mockResolvedValue(createdBooking);

    const booking = await createBooking(
      {
        workspaceId: baseWorkspace.id,
        sessionId: sessionPlain.id,
        participantId: 77,
        participantEmail: 'attendee@example.com',
        status: 'registered',
        seatNumber: 5,
        checkedInAt: '2024-05-01T14:55:00.000Z',
        userNotes: 'Prefers SMS reminder',
      },
      actor,
    );

    expect(booking.participantName).toBe('Jordan Fields');
    expect(booking.session.id).toBe(sessionPlain.id);
    expect(booking.userNotes).toBe('Prefers SMS reminder');
  });

  it('updates purchases with normalized currency and notes', async () => {
    const sessionPlain = { id: 2001, companyId: baseWorkspace.id };
    const orderState = {
      id: 9902,
      sessionId: sessionPlain.id,
      purchaserId: actor.actorId,
      purchaserEmail: 'ops@summitagency.test',
      purchaserName: 'Avery Summit',
      status: 'pending',
      amountCents: 10000,
      currency: 'USD',
      purchasedAt: '2024-04-20T12:00:00.000Z',
      reference: 'ORDER-9902',
      metadata: { userNotes: null },
      session: sessionPlain,
      createdAt: '2024-04-20T12:00:00.000Z',
      updatedAt: '2024-04-20T12:00:00.000Z',
    };

    const orderRecord = createMutableRecord(orderState);
    orderRecord.session = sessionPlain;
    NetworkingSessionOrder.findByPk.mockResolvedValue(orderRecord);

    const updated = await updatePurchase(
      orderState.id,
      { status: 'paid', amount: 150.5, currency: 'eur', notes: 'Paid via wire transfer' },
      { ...actor, workspaceId: baseWorkspace.id },
    );

    expect(orderRecord.update).toHaveBeenCalledWith({
      status: 'paid',
      amountCents: 15050,
      currency: 'EUR',
      metadata: { userNotes: 'Paid via wire transfer' },
    });
    expect(updated.amountCents).toBe(15050);
    expect(updated.currency).toBe('EUR');
  });

  it('validates connection creation and hydrates contact metadata', async () => {
    await expect(createConnection({ workspaceId: baseWorkspace.id }, actor)).rejects.toBeInstanceOf(ValidationError);

    NetworkingSession.findOne.mockResolvedValue({ id: 5001, companyId: baseWorkspace.id });

    NetworkingConnection.create.mockImplementation(async (payload) => {
      expect(payload.ownerId).toBe(actor.actorId);
      expect(payload.followStatus).toBe('connected');
      expect(payload.tags).toEqual(['operations', 'growth']);
      expect(payload.metadata.workspaceId).toBe(baseWorkspace.id);
      return { id: 4202 };
    });

    const connectionRow = createRow({
      id: 4202,
      ownerId: actor.actorId,
      sessionId: 5001,
      connectionName: 'Taylor Mentor',
      connectionEmail: 'taylor@mentor.test',
      followStatus: 'connected',
      connectedAt: '2024-05-01T16:00:00.000Z',
      lastContactedAt: '2024-05-03T10:00:00.000Z',
      metadata: { workspaceId: baseWorkspace.id },
      tags: ['operations', 'growth'],
      session: { id: 5001, companyId: baseWorkspace.id },
      owner: { id: actor.actorId, firstName: 'Avery', lastName: 'Summit', email: 'ops@summitagency.test' },
      contact: { id: 88, firstName: 'Taylor', lastName: 'Mentor', email: 'taylor@mentor.test' },
    });

    NetworkingConnection.findByPk.mockResolvedValue(connectionRow);

    const connection = await createConnection(
      {
        workspaceId: baseWorkspace.id,
        sessionId: 5001,
        connectionName: 'Taylor Mentor',
        connectionEmail: 'taylor@mentor.test',
        followStatus: 'connected',
        tags: ['operations', 'growth'],
      },
      actor,
    );

    expect(connection.connectionName).toBe('Taylor Mentor');
    expect(connection.owner?.email).toBe('ops@summitagency.test');
    expect(connection.tags).toContain('growth');
  });
});

