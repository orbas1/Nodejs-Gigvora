import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
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
  taxDocumentsQuerySchema,
  taxDocumentParamsSchema,
  taxDocumentAcknowledgeBodySchema,
  taxDocumentUploadBodySchema,
  taxReminderParamsSchema,
  taxReminderSnoozeBodySchema,
  complianceAuditLogQuerySchema,
} from '../validation/schemas/complianceSchemas.js';
import taxDocumentController from '../controllers/taxDocumentController.js';
import complianceAuditLogController from '../controllers/complianceAuditLogController.js';

const router = Router();
const COMPLIANCE_ROLES = [
  'admin',
  'company_admin',
  'compliance_officer',
  'compliance_manager',
  'legal',
];

router.use(authenticateRequest());
router.use(requireRoles(...COMPLIANCE_ROLES));

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

router.get(
  '/tax-documents',
  validateRequest({ query: taxDocumentsQuerySchema }),
  asyncHandler(taxDocumentController.index),
);

router.post(
  '/tax-documents/:filingId/acknowledge',
  validateRequest({ params: taxDocumentParamsSchema, body: taxDocumentAcknowledgeBodySchema }),
  asyncHandler(taxDocumentController.acknowledge),
);

router.post(
  '/tax-documents/:filingId/upload',
  validateRequest({ params: taxDocumentParamsSchema, body: taxDocumentUploadBodySchema }),
  asyncHandler(taxDocumentController.upload),
);

router.get(
  '/tax-documents/:filingId/download',
  validateRequest({ params: taxDocumentParamsSchema }),
  asyncHandler(taxDocumentController.download),
);

router.post(
  '/tax-reminders/:reminderId/snooze',
  validateRequest({ params: taxReminderParamsSchema, body: taxReminderSnoozeBodySchema }),
  asyncHandler(taxDocumentController.snooze),
);

router.get(
  '/audit-logs',
  validateRequest({ query: complianceAuditLogQuerySchema }),
  asyncHandler(complianceAuditLogController.index),
);

export default router;
