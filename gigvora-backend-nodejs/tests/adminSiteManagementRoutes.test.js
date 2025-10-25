process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import './setupTestEnv.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: 10, roles: ['admin'], type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 11, roles: ['user'], type: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Admin site management routes', () => {
  it('restricts access to admins', async () => {
    const response = await request(app).get('/api/admin/site-management');
    expect(response.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/admin/site-management')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('allows admins to orchestrate settings, navigation, and pages', async () => {
    const overview = await request(app)
      .get('/api/admin/site-management')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overview.status).toBe(200);
    expect(overview.body.settings).toBeDefined();

    const saveSettings = await request(app)
      .put('/api/admin/site-management/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ siteName: 'Gigvora Preview Hub', supportEmail: 'preview@gigvora.test' });

    expect(saveSettings.status).toBe(200);
    expect(saveSettings.body.settings.siteName).toBe('Gigvora Preview Hub');

    const navCreate = await request(app)
      .post('/api/admin/site-management/navigation')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ menuKey: 'primary', label: 'Opportunities', url: '/opportunities' });

    expect(navCreate.status).toBe(201);
    const navId = navCreate.body.link.id;

    const navUpdate = await request(app)
      .put(`/api/admin/site-management/navigation/${navId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Featured pods', orderIndex: 2 });
    expect(navUpdate.status).toBe(200);
    expect(navUpdate.body.link.description).toBe('Featured pods');

    const pageCreate = await request(app)
      .post('/api/admin/site-management/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Trust centre',
        slug: 'trust-centre',
        status: 'published',
        summary: 'How Gigvora protects the network.',
        heroTitle: 'Security posture',
      });
    expect(pageCreate.status).toBe(201);
    const pageId = pageCreate.body.page.id;

    const pageUpdate = await request(app)
      .put(`/api/admin/site-management/pages/${pageId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'draft', heroSubtitle: 'Updated messaging' });
    expect(pageUpdate.status).toBe(200);
    expect(pageUpdate.body.page.status).toBe('draft');

    const navDelete = await request(app)
      .delete(`/api/admin/site-management/navigation/${navId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(navDelete.status).toBe(204);

    const pageDelete = await request(app)
      .delete(`/api/admin/site-management/pages/${pageId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pageDelete.status).toBe(204);
  });
});
