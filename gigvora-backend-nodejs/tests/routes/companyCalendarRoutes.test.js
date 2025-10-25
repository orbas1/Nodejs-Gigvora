process.env.NODE_ENV = 'test';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import crypto from 'node:crypto';
import request from 'supertest';
import { app } from '../../src/app.js';
import '../setupTestEnv.js';
import {
  RecruitingCalendarEvent,
  ProviderWorkspaceMember,
  ProviderWorkspace,
  User,
  sequelize,
} from '../../src/models/index.js';

function buildAuthHeaders(user, extraRoles = []) {
  const roles = ['company', ...extraRoles];
  return {
    'x-user-id': `${user.id}`,
    'x-roles': roles.join(','),
  };
}

describe('Company calendar routes', () => {
  let user;
  let workspace;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    try {
      user = await User.create({
        firstName: 'Test',
        lastName: 'Owner',
        email: `owner+${crypto.randomUUID()}@example.com`,
        password: 'Password123!',
        userType: 'company',
      });
    } catch (error) {
      console.error('Failed to create user fixture', error);
      throw error;
    }

    try {
      workspace = await ProviderWorkspace.create({
        ownerId: user.id,
        name: 'Acme Talent',
        slug: `acme-${crypto.randomUUID()}`,
        type: 'company',
        timezone: 'UTC',
        defaultCurrency: 'USD',
        intakeEmail: null,
        isActive: true,
      });
    } catch (error) {
      console.error('Failed to create workspace fixture', error);
      throw error;
    }

    await ProviderWorkspaceMember.create({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(),
    });
  });

  it('lists events grouped by type', async () => {
    await RecruitingCalendarEvent.bulkCreate([
      {
        workspaceId: workspace.id,
        title: 'Project kickoff',
        eventType: 'project',
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        metadata: { relatedEntityName: 'Build analytics stack' },
      },
      {
        workspaceId: workspace.id,
        title: 'Panel interview',
        eventType: 'interview',
        startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        metadata: { ownerName: 'Recruiting squad' },
      },
    ]);

    const response = await request(app)
      .get('/api/company/calendar/events')
      .set(buildAuthHeaders(user, ['company_admin']))
      .query({ workspaceId: workspace.id });

    expect(response.status).toBe(200);
    expect(response.body.workspace.id).toBe(workspace.id);
    expect(response.body.summary.totalEvents).toBe(2);
    expect(response.body.eventsByType.project).toHaveLength(1);
    expect(response.body.eventsByType.interview).toHaveLength(1);
  });

  it('creates a calendar event', async () => {
    const payload = {
      workspaceId: workspace.id,
      title: 'Mentorship sync',
      eventType: 'mentorship',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      location: 'Zoom',
      metadata: {
        ownerName: 'People team',
        participants: [
          { name: 'Coach', email: 'coach@example.com', role: 'mentor' },
          { name: 'New hire', email: 'newhire@example.com', role: 'mentee' },
        ],
      },
    };

    const response = await request(app)
      .post('/api/company/calendar/events')
      .set(buildAuthHeaders(user, ['company_admin']))
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(payload.title);
    expect(response.body.eventType).toBe('mentorship');
    expect(Array.isArray(response.body.metadata.participants)).toBe(true);

    const stored = await RecruitingCalendarEvent.findByPk(response.body.id);
    expect(stored).not.toBeNull();
    expect(stored.metadata.participants).toHaveLength(2);
  });

  it('updates an existing event', async () => {
    const record = await RecruitingCalendarEvent.create({
      workspaceId: workspace.id,
      title: 'Gig briefing',
      eventType: 'gig',
      startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
    });

    const response = await request(app)
      .patch(`/api/company/calendar/events/${record.id}`)
      .set(buildAuthHeaders(user, ['company_admin']))
      .send({
        title: 'Gig kickoff briefing',
        metadata: { relatedEntityName: 'Marketing sprint' },
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Gig kickoff briefing');
    expect(response.body.metadata.relatedEntityName).toBe('Marketing sprint');
  });

  it('enforces workspace membership', async () => {
    const outsider = await User.create({
      firstName: 'Outside',
      lastName: 'User',
      email: `outsider+${crypto.randomUUID()}@example.com`,
      password: 'Password123!',
      userType: 'company',
    });

    const response = await request(app)
      .get('/api/company/calendar/events')
      .set(buildAuthHeaders(outsider))
      .query({ workspaceId: workspace.id });

    expect(response.status).toBe(403);
  });

  it('prevents read-only members from mutating events', async () => {
    const viewer = await User.create({
      firstName: 'Viewer',
      lastName: 'Member',
      email: `viewer+${crypto.randomUUID()}@example.com`,
      password: 'Password123!',
      userType: 'company',
    });
    const viewerWorkspace = await ProviderWorkspace.create({
      ownerId: user.id,
      name: 'Viewer Org',
      slug: `viewer-${crypto.randomUUID()}`,
      type: 'company',
      timezone: 'UTC',
      defaultCurrency: 'USD',
      intakeEmail: null,
      isActive: true,
    });
    await ProviderWorkspaceMember.create({
      workspaceId: viewerWorkspace.id,
      userId: viewer.id,
      role: 'viewer',
      status: 'active',
    });

    const response = await request(app)
      .post('/api/company/calendar/events')
      .set(buildAuthHeaders(viewer))
      .send({
        workspaceId: viewerWorkspace.id,
        title: 'Volunteer drive',
        eventType: 'volunteering',
        startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(403);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
