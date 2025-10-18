import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createProviderBodySchema,
  updateProviderBodySchema,
  createClientBodySchema,
  updateClientBodySchema,
  createClientKeyBodySchema,
  auditEventsQuerySchema,
  walletAccountsQuerySchema,
  recordUsageBodySchema,
} from '../validation/schemas/adminApiSchemas.js';
import * as adminApiController from '../controllers/adminApiController.js';

const router = Router();

router.get('/registry', asyncHandler(adminApiController.registry));

router.post(
  '/providers',
  validateRequest({ body: createProviderBodySchema }),
  asyncHandler(adminApiController.createProviderHandler),
);

router.put(
  '/providers/:providerId',
  validateRequest({ body: updateProviderBodySchema }),
  asyncHandler(adminApiController.updateProviderHandler),
);

router.post(
  '/clients',
  validateRequest({ body: createClientBodySchema }),
  asyncHandler(adminApiController.createClientHandler),
);

router.put(
  '/clients/:clientId',
  validateRequest({ body: updateClientBodySchema }),
  asyncHandler(adminApiController.updateClientHandler),
);

router.post(
  '/clients/:clientId/keys',
  validateRequest({ body: createClientKeyBodySchema }),
  asyncHandler(adminApiController.createClientKeyHandler),
);

router.delete(
  '/clients/:clientId/keys/:keyId',
  asyncHandler(adminApiController.revokeClientKeyHandler),
);

router.post('/clients/:clientId/webhook/rotate', asyncHandler(adminApiController.rotateWebhookHandler));

router.get(
  '/clients/:clientId/audit-events',
  validateRequest({ query: auditEventsQuerySchema }),
  asyncHandler(adminApiController.listAuditEventsHandler),
);

router.get(
  '/wallet-accounts',
  validateRequest({ query: walletAccountsQuerySchema }),
  asyncHandler(adminApiController.listWalletAccountsHandler),
);

router.post(
  '/clients/:clientId/usage',
  validateRequest({ body: recordUsageBodySchema }),
  asyncHandler(adminApiController.recordUsageHandler),
);

export default router;
