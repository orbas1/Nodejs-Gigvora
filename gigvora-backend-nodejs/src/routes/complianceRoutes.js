import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import complianceLockerController from '../controllers/complianceLockerController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  complianceLockerQuerySchema,
  createComplianceDocumentBodySchema,
  complianceDocumentParamsSchema,
  addComplianceDocumentVersionBodySchema,
  complianceReminderParamsSchema,
  acknowledgeReminderBodySchema,
} from '../validation/schemas/complianceSchemas.js';

const router = Router();

router.get(
  '/locker',
  validateRequest({ query: complianceLockerQuerySchema }),
  asyncHandler(complianceLockerController.overview),
);
router.post(
  '/documents',
  validateRequest({ body: createComplianceDocumentBodySchema }),
  asyncHandler(complianceLockerController.storeDocument),
);
router.post(
  '/documents/:documentId/versions',
  validateRequest({ params: complianceDocumentParamsSchema, body: addComplianceDocumentVersionBodySchema }),
  asyncHandler(complianceLockerController.addVersion),
);
router.patch(
  '/reminders/:reminderId',
  validateRequest({ params: complianceReminderParamsSchema, body: acknowledgeReminderBodySchema }),
  asyncHandler(complianceLockerController.acknowledgeReminder),
);

export default router;
