import request from 'supertest';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

let app;
let resetMetricsForTesting;

beforeAll(async () => {
  ({ default: app } = await import('../../src/app.js'));
  ({ resetMetricsForTesting } = await import('../../src/observability/metricsRegistry.js'));
});

beforeEach(() => {
  if (typeof resetMetricsForTesting === 'function') {
    resetMetricsForTesting();
  }
});

describe('GET /health/metrics', () => {
  it('exposes Prometheus metrics and tracks scrape counts', async () => {
    const firstResponse = await request(app).get('/health/metrics');
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers['content-type']).toContain('text/plain');
    expect(firstResponse.text).toContain('gigvora_metrics_scrapes_total 1');

    const secondResponse = await request(app).get('/health/metrics');
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.text).toContain('gigvora_metrics_scrapes_total 2');
    expect(secondResponse.text).toContain('gigvora_metrics_seconds_since_last_scrape 0');
  });
});
