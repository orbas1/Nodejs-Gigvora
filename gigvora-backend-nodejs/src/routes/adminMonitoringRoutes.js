import { Router } from 'express';

import * as controller from '../controllers/adminMonitoringController.js';
import validateRequest from '../middleware/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  insightsOverviewQuerySchema,
  metricsExplorerQuerySchema,
  metricsExplorerViewBodySchema,
  metricsExplorerViewParamsSchema,
  auditTrailQuerySchema,
  auditTrailExportQuerySchema,
} from '../validation/schemas/adminMonitoringSchemas.js';

const router = Router();

router.get(
  '/insights-overview',
  validateRequest({ query: insightsOverviewQuerySchema }),
  asyncHandler(controller.insights),
);

router.get(
  '/metrics-explorer',
  validateRequest({ query: metricsExplorerQuerySchema }),
  asyncHandler(controller.metrics),
);

router.get('/metrics-explorer/views', asyncHandler(controller.views));
router.post(
  '/metrics-explorer/views',
  validateRequest({ body: metricsExplorerViewBodySchema }),
  asyncHandler(controller.createView),
);
router.delete(
  '/metrics-explorer/views/:viewId',
  validateRequest({ params: metricsExplorerViewParamsSchema }),
  asyncHandler(controller.removeView),
);

router.get(
  '/audit-trail',
  validateRequest({ query: auditTrailQuerySchema }),
  asyncHandler(controller.auditTrail),
);
router.get(
  '/audit-trail/export',
  validateRequest({ query: auditTrailExportQuerySchema }),
  asyncHandler(controller.exportAudit),
);

export default router;
