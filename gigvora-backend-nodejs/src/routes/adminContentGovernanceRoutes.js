import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import * as controller from '../controllers/adminContentGovernanceController.js';
import {
  contentQueueQuerySchema,
  submissionIdParamSchema,
  updateSubmissionBodySchema,
  assignSubmissionBodySchema,
  moderationActionBodySchema,
} from '../validation/schemas/adminContentGovernanceSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/queue', validateRequest({ query: contentQueueQuerySchema }), asyncHandler(controller.queue));
router.get(
  '/queue/:submissionId',
  validateRequest({ params: submissionIdParamSchema }),
  asyncHandler(controller.show),
);
router.patch(
  '/queue/:submissionId',
  validateRequest({ params: submissionIdParamSchema, body: updateSubmissionBodySchema }),
  asyncHandler(controller.update),
);
router.post(
  '/queue/:submissionId/assign',
  validateRequest({ params: submissionIdParamSchema, body: assignSubmissionBodySchema }),
  asyncHandler(controller.assign),
);
router.post(
  '/queue/:submissionId/actions',
  validateRequest({ params: submissionIdParamSchema, body: moderationActionBodySchema }),
  asyncHandler(controller.createAction),
);
router.get(
  '/queue/:submissionId/actions',
  validateRequest({ params: submissionIdParamSchema }),
  asyncHandler(controller.actions),
);

export default router;
