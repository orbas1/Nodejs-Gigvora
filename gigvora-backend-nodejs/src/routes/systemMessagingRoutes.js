import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import authenticate from '../middleware/authenticate.js';
import {
  statusToastQuerySchema,
  statusAcknowledgementParamsSchema,
  statusAcknowledgementBodySchema,
  feedbackPulseParamsSchema,
  feedbackPulseQuerySchema,
  feedbackPulseResponseBodySchema,
} from '../validation/schemas/systemMessagingSchemas.js';
import {
  fetchLatestSystemStatus,
  acknowledgeSystemStatus,
  showFeedbackPulse,
  createFeedbackPulseResponse,
} from '../controllers/systemMessagingController.js';

const router = Router();

router.get(
  '/status/latest',
  validateRequest({ query: statusToastQuerySchema }),
  asyncHandler(fetchLatestSystemStatus),
);

router.post(
  '/status/:eventKey/acknowledgements',
  authenticate(),
  validateRequest({ params: statusAcknowledgementParamsSchema, body: statusAcknowledgementBodySchema }),
  asyncHandler(acknowledgeSystemStatus),
);

router.get(
  '/feedback-pulses/:pulseKey',
  validateRequest({ params: feedbackPulseParamsSchema, query: feedbackPulseQuerySchema }),
  asyncHandler(showFeedbackPulse),
);

router.post(
  '/feedback-pulses/:pulseKey/responses',
  authenticate(),
  validateRequest({ params: feedbackPulseParamsSchema, body: feedbackPulseResponseBodySchema }),
  asyncHandler(createFeedbackPulseResponse),
);

export default router;
