import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import complianceLockerController from '../controllers/complianceLockerController.js';
import identityVerificationController from '../controllers/identityVerificationController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  complianceLockerQuerySchema,
  createComplianceDocumentBodySchema,
  complianceDocumentParamsSchema,
  addComplianceDocumentVersionBodySchema,
  complianceReminderParamsSchema,
  acknowledgeReminderBodySchema,
  identityVerificationQuerySchema,
  identityVerificationBodySchema,
  identityVerificationSubmitBodySchema,
  identityVerificationReviewBodySchema,
  identityDocumentUploadSchema,
  identityDocumentQuerySchema,
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
router.get(
  '/identity',
  validateRequest({ query: identityVerificationQuerySchema }),
  asyncHandler(identityVerificationController.overview),
);
router.put(
  '/identity',
  validateRequest({ body: identityVerificationBodySchema }),
  asyncHandler(identityVerificationController.save),
);
router.post(
  '/identity/submit',
  validateRequest({ body: identityVerificationSubmitBodySchema }),
  asyncHandler(identityVerificationController.submit),
);
router.post(
  '/identity/review',
  validateRequest({ body: identityVerificationReviewBodySchema }),
  asyncHandler(identityVerificationController.review),
);
router.post(
  '/identity/documents',
  validateRequest({ body: identityDocumentUploadSchema }),
  asyncHandler(identityVerificationController.uploadDocument),
);
router.get(
  '/identity/documents',
  validateRequest({ query: identityDocumentQuerySchema }),
  asyncHandler(identityVerificationController.downloadDocument),
);

export default router;
