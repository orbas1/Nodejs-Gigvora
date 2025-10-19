import { Router } from 'express';
import { getLivenessReport, getReadinessReport } from '../services/healthService.js';
import { collectMetrics, getMetricsContentType } from '../observability/metricsRegistry.js';
import metricsAuth from '../middleware/metricsAuth.js';

const router = Router();

router.get('/live', (req, res) => {
  const report = getLivenessReport();
  const statusCode = report.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(report);
});

router.get('/ready', async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const perPage = Number.parseInt(req.query.perPage ?? '10', 10);
    const dependency = typeof req.query.dependency === 'string' ? req.query.dependency : null;
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';
    const report = await getReadinessReport({
      page: Number.isNaN(page) ? 1 : page,
      perPage: Number.isNaN(perPage) ? 10 : perPage,
      dependency,
      forceRefresh,
    });
    res.status(report.httpStatus).json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const report = getLivenessReport();
    res.status(200).json({ ...report, deprecated: true, message: 'Use /health/live or /health/ready' });
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', metricsAuth(), async (req, res, next) => {
  try {
    const metrics = await collectMetrics();
    res.setHeader('Content-Type', getMetricsContentType());
    res.send(metrics);
  } catch (error) {
    next(error);
  }
});

export default router;
