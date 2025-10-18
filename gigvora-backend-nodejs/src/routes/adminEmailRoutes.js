import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as adminEmailController from '../controllers/adminEmailController.js';
import {
  adminEmailSmtpBodySchema,
  adminEmailTemplateCreateSchema,
  adminEmailTemplateUpdateSchema,
  adminEmailTestBodySchema,
} from '../validation/schemas/adminSchemas.js';
import { optionalTrimmedString } from '../validation/primitives.js';

const router = Router();

const emailTemplatesQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 160 }),
    category: optionalTrimmedString({ max: 80 }),
  })
  .strip();

router.get('/', asyncHandler(adminEmailController.overview));
router.put(
  '/smtp',
  validateRequest({ body: adminEmailSmtpBodySchema }),
  asyncHandler(adminEmailController.persistSmtpConfig),
);
router.post(
  '/smtp/test',
  validateRequest({ body: adminEmailTestBodySchema }),
  asyncHandler(adminEmailController.triggerTestEmail),
);

router.get(
  '/templates',
  validateRequest({ query: emailTemplatesQuerySchema }),
  asyncHandler(adminEmailController.templates),
);
router.post(
  '/templates',
  validateRequest({ body: adminEmailTemplateCreateSchema }),
  asyncHandler(adminEmailController.createTemplate),
);
router.put(
  '/templates/:templateId',
  validateRequest({ body: adminEmailTemplateUpdateSchema }),
  asyncHandler(adminEmailController.updateTemplate),
);
router.delete('/templates/:templateId', asyncHandler(adminEmailController.removeTemplate));

export default router;
