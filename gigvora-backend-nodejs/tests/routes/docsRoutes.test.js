process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import { app } from '../../src/app.js';
import '../setupTestEnv.js';

describe('docs routes', () => {
  it('serves the runtime security OpenAPI document with caching headers', async () => {
    const firstResponse = await request(app).get('/api/docs/runtime-security');
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body).toHaveProperty('openapi', '3.0.3');
    expect(firstResponse.body).toHaveProperty('info.version');
    expect(firstResponse.headers).toHaveProperty('etag');

    const etag = firstResponse.headers.etag;
    const secondResponse = await request(app).get('/api/docs/runtime-security').set('If-None-Match', etag);
    expect(secondResponse.status).toBe(304);
    expect(secondResponse.body).toEqual({});
  });
});
