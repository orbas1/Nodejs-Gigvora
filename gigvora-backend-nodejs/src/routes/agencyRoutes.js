import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyIntegrationController from '../controllers/agencyIntegrationController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/integrations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.index),
);

router.post(
  '/integrations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.create),
);

router.patch(
  '/integrations/:integrationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.update),
);

router.post(
  '/integrations/:integrationId/secrets',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.rotateCredential),
);

router.post(
  '/integrations/:integrationId/webhooks',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.createWebhookEndpoint),
);

router.patch(
  '/integrations/:integrationId/webhooks/:webhookId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.updateWebhookEndpoint),
);

router.delete(
  '/integrations/:integrationId/webhooks/:webhookId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.deleteWebhookEndpoint),
);

router.post(
  '/integrations/:integrationId/test',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyIntegrationController.testConnection),
);

export default router;

