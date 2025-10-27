import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  securityTelemetryQuerySchema,
  securityAlertActionBodySchema,
  threatSweepBodySchema,
} from '../validation/schemas/securityOperationsSchemas.js';
import {
  telemetry,
  acknowledgeAlert,
  suppressAlert,
  triggerThreatSweep,
} from '../controllers/securityOperationsController.js';

const router = Router();

router.use(
  authenticate({
    roles: ['admin', 'security', 'ops', 'trust', 'compliance'],
    allowAdminOverride: true,
  }),
);

router.get('/telemetry', validateRequest({ query: securityTelemetryQuerySchema }), asyncHandler(telemetry));
router.post(
  '/alerts/:alertId/acknowledge',
  validateRequest({ body: securityAlertActionBodySchema }),
  asyncHandler(acknowledgeAlert),
);
router.post(
  '/alerts/:alertId/suppress',
  validateRequest({ body: securityAlertActionBodySchema }),
  asyncHandler(suppressAlert),
);
router.post('/threat-sweep', validateRequest({ body: threatSweepBodySchema }), asyncHandler(triggerThreatSweep));

export default router;
