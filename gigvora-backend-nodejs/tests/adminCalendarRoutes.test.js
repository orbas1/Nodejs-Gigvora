process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import './setupTestEnv.js';
import {
  AdminCalendarAccount,
  AdminCalendarTemplate,
  AdminCalendarEvent,
  AdminCalendarAvailabilityWindow,
} from '../src/models/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: 1, roles: ['admin'], type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 2, roles: ['user'], type: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

async function resetCalendarTables() {
  await AdminCalendarAccount.sync();
  await AdminCalendarTemplate.sync();
  await AdminCalendarEvent.sync();
  await AdminCalendarAvailabilityWindow.sync();
  await AdminCalendarAvailabilityWindow.destroy({ where: {} });
  await AdminCalendarEvent.destroy({ where: {} });
  await AdminCalendarTemplate.destroy({ where: {} });
  await AdminCalendarAccount.destroy({ where: {} });
}

describe('Admin calendar routes', () => {
  beforeEach(async () => {
    await resetCalendarTables();
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/admin/calendar');
    expect(response.status).toBe(401);
  });

  it('rejects non-admin roles', async () => {
    const response = await request(app)
      .get('/api/admin/calendar')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('allows admins to orchestrate calendar accounts, templates, and events', async () => {
    const initial = await request(app)
      .get('/api/admin/calendar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(initial.status).toBe(200);
    expect(initial.body).toHaveProperty('accounts');

    const accountResponse = await request(app)
      .post('/api/admin/calendar/accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        provider: 'google',
        accountEmail: 'ops@gigvora.com',
        displayName: 'Platform Ops',
        timezone: 'UTC',
      });
    expect(accountResponse.status).toBe(201);
    expect(accountResponse.body.provider).toBe('google');
    const accountId = accountResponse.body.id;
    expect(accountId).toBeDefined();

    const availabilityResponse = await request(app)
      .put(`/api/admin/calendar/accounts/${accountId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        timezone: 'Europe/London',
        windows: [
          { dayOfWeek: 1, startTimeMinutes: 540, endTimeMinutes: 1020 },
          { dayOfWeek: 3, startTimeMinutes: 600, endTimeMinutes: 990 },
        ],
      });
    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body.availability.windows).toHaveLength(2);

    const templateResponse = await request(app)
      .post('/api/admin/calendar/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Weekly governance sync',
        defaultEventType: 'governance',
        defaultVisibility: 'internal',
        reminderMinutes: [60, 15],
        defaultAllowedRoles: ['Admin', 'Operations'],
      });
    expect(templateResponse.status).toBe(201);
    expect(templateResponse.body.defaultEventType).toBe('governance');
    const templateId = templateResponse.body.id;

    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    const eventResponse = await request(app)
      .post('/api/admin/calendar/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Risk committee review',
        calendarAccountId: accountId,
        templateId,
        eventType: 'governance',
        visibility: 'internal',
        status: 'scheduled',
        startsAt,
        endsAt,
        invitees: [
          { name: 'Ada Lovelace', email: 'ada@gigvora.com' },
          { name: 'Operations Bot', email: 'opsbot@gigvora.com' },
        ],
      });
    expect(eventResponse.status).toBe(201);
    expect(eventResponse.body.title).toContain('Risk committee');
    expect(eventResponse.body.calendarAccount.id).toBe(accountId);
    const eventId = eventResponse.body.id;

    const updateEvent = await request(app)
      .put(`/api/admin/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published', allowedRoles: ['admin', 'trust'] });
    expect(updateEvent.status).toBe(200);
    expect(updateEvent.body.status).toBe('published');
    expect(updateEvent.body.allowedRoles).toContain('trust');

    const consoleResponse = await request(app)
      .get('/api/admin/calendar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(consoleResponse.status).toBe(200);
    expect(consoleResponse.body.accounts).toHaveLength(1);
    expect(consoleResponse.body.templates).toHaveLength(1);
    expect(consoleResponse.body.events.length).toBeGreaterThanOrEqual(1);
    expect(consoleResponse.body.metrics.events.published).toBeGreaterThanOrEqual(1);
    expect(consoleResponse.body.availability[String(accountId)].windows).toHaveLength(2);
  });
});
