import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import legalPolicyController from '../controllers/legalPolicyController.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  legalDocumentQuerySchema,
  legalDocumentSlugParamSchema,
  legalDocumentIdParamSchema,
  legalDocumentVersionParamSchema,
  createLegalDocumentBodySchema,
  updateLegalDocumentBodySchema,
  createLegalDocumentVersionBodySchema,
  updateLegalDocumentVersionBodySchema,
  publishLegalDocumentVersionBodySchema,
  archiveLegalDocumentVersionBodySchema,
  legalDocumentDetailQuerySchema,
} from '../validation/schemas/legalPolicySchemas.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/',
  validateRequest({ query: legalDocumentQuerySchema }),
  asyncHandler(legalPolicyController.index),
);

router.get(
  '/:slug',
  validateRequest({ params: legalDocumentSlugParamSchema, query: legalDocumentDetailQuerySchema }),
  asyncHandler(legalPolicyController.show),
);

router.post(
  '/',
  validateRequest({ body: createLegalDocumentBodySchema }),
  asyncHandler(legalPolicyController.store),
);

router.patch(
  '/:documentId',
  validateRequest({ params: legalDocumentIdParamSchema, body: updateLegalDocumentBodySchema }),
  asyncHandler(legalPolicyController.update),
);

router.post(
  '/:documentId/versions',
  validateRequest({ params: legalDocumentIdParamSchema, body: createLegalDocumentVersionBodySchema }),
  asyncHandler(legalPolicyController.createVersion),
);

router.patch(
  '/:documentId/versions/:versionId',
  validateRequest({ params: legalDocumentVersionParamSchema, body: updateLegalDocumentVersionBodySchema }),
  asyncHandler(legalPolicyController.updateVersion),
);

router.post(
  '/:documentId/versions/:versionId/publish',
  validateRequest({ params: legalDocumentVersionParamSchema, body: publishLegalDocumentVersionBodySchema }),
  asyncHandler(legalPolicyController.publishVersion),
);

router.post(
  '/:documentId/versions/:versionId/activate',
  validateRequest({ params: legalDocumentVersionParamSchema }),
  asyncHandler(legalPolicyController.activateVersion),
);

router.post(
  '/:documentId/versions/:versionId/archive',
  validateRequest({ params: legalDocumentVersionParamSchema, body: archiveLegalDocumentVersionBodySchema }),
  asyncHandler(legalPolicyController.archiveVersion),
);

export default router;
