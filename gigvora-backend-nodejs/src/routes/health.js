import { Router } from 'express';
import { getLivenessReport, getReadinessReport } from '../services/healthService.js';
import { collectMetrics, getMetricsContentType } from '../observability/metricsRegistry.js';

const router = Router();

router.get('/live', (req, res) => {
  const report = getLivenessReport();
  const statusCode = report.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(report);
});

router.get('/ready', async (req, res, next) => {
  try {
    const report = await getReadinessReport();
    res.status(report.httpStatus).json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const report = await getReadinessReport();
    res.status(report.httpStatus).json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await collectMetrics();
    res.setHeader('Content-Type', getMetricsContentType());
    res.send(metrics);
  } catch (error) {
    next(error);
  }
});

export default router;
