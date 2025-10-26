import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import formBlueprintController from '../controllers/formBlueprintController.js';
import {
  formBlueprintListQuerySchema,
  formBlueprintKeyParamsSchema,
  formBlueprintValidateBodySchema,
} from '../validation/schemas/formBlueprintSchemas.js';

const router = Router();
const formBlueprintShowQuerySchema = formBlueprintListQuerySchema.pick({
  includeSteps: true,
  includeFields: true,
  status: true,
});

router.get(
  '/',
  validateRequest({ query: formBlueprintListQuerySchema }),
  asyncHandler(formBlueprintController.index),
);

router.get(
  '/:key',
  validateRequest({ params: formBlueprintKeyParamsSchema, query: formBlueprintShowQuerySchema }),
  asyncHandler(formBlueprintController.show),
);

router.post(
  '/:key/validate',
  validateRequest({ params: formBlueprintKeyParamsSchema, body: formBlueprintValidateBodySchema }),
  asyncHandler(formBlueprintController.validateField),
);

export default router;
