import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import * as controller from '../controllers/adminComplianceManagementController.js';
import {
  adminComplianceFrameworkParamsSchema,
  adminComplianceFrameworkBodySchema,
  adminComplianceFrameworkUpdateSchema,
  adminComplianceAuditParamsSchema,
  adminComplianceAuditBodySchema,
  adminComplianceAuditUpdateSchema,
  adminComplianceObligationParamsSchema,
  adminComplianceObligationBodySchema,
  adminComplianceObligationUpdateSchema,
  adminComplianceEvidenceBodySchema,
} from '../validation/schemas/adminComplianceSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(controller.overview));

router.post(
  '/frameworks',
  validateRequest({ body: adminComplianceFrameworkBodySchema }),
  asyncHandler(controller.storeFramework),
);
router.put(
  '/frameworks/:frameworkId',
  validateRequest({ params: adminComplianceFrameworkParamsSchema, body: adminComplianceFrameworkUpdateSchema }),
  asyncHandler(controller.updateFramework),
);
router.delete(
  '/frameworks/:frameworkId',
  validateRequest({ params: adminComplianceFrameworkParamsSchema }),
  asyncHandler(controller.destroyFramework),
);

router.post(
  '/audits',
  validateRequest({ body: adminComplianceAuditBodySchema }),
  asyncHandler(controller.storeAudit),
);
router.put(
  '/audits/:auditId',
  validateRequest({ params: adminComplianceAuditParamsSchema, body: adminComplianceAuditUpdateSchema }),
  asyncHandler(controller.updateAudit),
);
router.delete(
  '/audits/:auditId',
  validateRequest({ params: adminComplianceAuditParamsSchema }),
  asyncHandler(controller.destroyAudit),
);

router.post(
  '/obligations',
  validateRequest({ body: adminComplianceObligationBodySchema }),
  asyncHandler(controller.storeObligation),
);
router.put(
  '/obligations/:obligationId',
  validateRequest({ params: adminComplianceObligationParamsSchema, body: adminComplianceObligationUpdateSchema }),
  asyncHandler(controller.updateObligation),
);
router.delete(
  '/obligations/:obligationId',
  validateRequest({ params: adminComplianceObligationParamsSchema }),
  asyncHandler(controller.destroyObligation),
);

router.post(
  '/obligations/:obligationId/evidence',
  validateRequest({ params: adminComplianceObligationParamsSchema, body: adminComplianceEvidenceBodySchema }),
  asyncHandler(controller.storeEvidence),
);

export default router;
