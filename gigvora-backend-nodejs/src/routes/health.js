import { Router } from 'express';
import { getLivenessReport, getReadinessReport } from '../services/healthService.js';

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

export default router;
