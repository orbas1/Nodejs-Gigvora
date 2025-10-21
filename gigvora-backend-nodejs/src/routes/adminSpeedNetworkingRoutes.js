import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import adminSpeedNetworkingController from '../controllers/adminSpeedNetworkingController.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  speedNetworkingListQuerySchema,
  speedNetworkingCreateBodySchema,
  speedNetworkingUpdateBodySchema,
  speedNetworkingParticipantBodySchema,
  speedNetworkingParticipantUpdateBodySchema,
} from '../validation/schemas/speedNetworkingSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/catalog', asyncHandler(adminSpeedNetworkingController.catalog));

router.get(
  '/sessions',
  validateRequest({ query: speedNetworkingListQuerySchema }),
  asyncHandler(adminSpeedNetworkingController.index),
);

router.post(
  '/sessions',
  validateRequest({ body: speedNetworkingCreateBodySchema }),
  asyncHandler(adminSpeedNetworkingController.create),
);

router.get('/sessions/:sessionId', asyncHandler(adminSpeedNetworkingController.show));

router.patch(
  '/sessions/:sessionId',
  validateRequest({ body: speedNetworkingUpdateBodySchema }),
  asyncHandler(adminSpeedNetworkingController.update),
);

router.delete('/sessions/:sessionId', asyncHandler(adminSpeedNetworkingController.destroy));

router.post(
  '/sessions/:sessionId/participants',
  validateRequest({ body: speedNetworkingParticipantBodySchema }),
  asyncHandler(adminSpeedNetworkingController.storeParticipant),
);

router.patch(
  '/sessions/:sessionId/participants/:participantId',
  validateRequest({ body: speedNetworkingParticipantUpdateBodySchema }),
  asyncHandler(adminSpeedNetworkingController.updateParticipant),
);

router.delete(
  '/sessions/:sessionId/participants/:participantId',
  asyncHandler(adminSpeedNetworkingController.destroyParticipant),
);

export default router;
