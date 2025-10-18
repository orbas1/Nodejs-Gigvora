import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as storageController from '../controllers/adminStorageController.js';
import {
  storageLocationCreateSchema,
  storageLocationUpdateSchema,
  storageLifecycleCreateSchema,
  storageLifecycleUpdateSchema,
  storageUploadPresetCreateSchema,
  storageUploadPresetUpdateSchema,
  identifierParamSchema,
} from '../validation/schemas/adminStorageSchemas.js';

const router = Router();

router.get('/overview', asyncHandler(storageController.overview));

router.post(
  '/locations',
  validateRequest({ body: storageLocationCreateSchema }),
  asyncHandler(storageController.createLocation),
);

router.put(
  '/locations/:id',
  validateRequest({ params: identifierParamSchema, body: storageLocationUpdateSchema }),
  asyncHandler(storageController.updateLocation),
);

router.delete(
  '/locations/:id',
  validateRequest({ params: identifierParamSchema }),
  asyncHandler(storageController.deleteLocation),
);

router.post(
  '/lifecycle-rules',
  validateRequest({ body: storageLifecycleCreateSchema }),
  asyncHandler(storageController.createLifecycleRule),
);

router.put(
  '/lifecycle-rules/:id',
  validateRequest({ params: identifierParamSchema, body: storageLifecycleUpdateSchema }),
  asyncHandler(storageController.updateLifecycleRule),
);

router.delete(
  '/lifecycle-rules/:id',
  validateRequest({ params: identifierParamSchema }),
  asyncHandler(storageController.deleteLifecycleRule),
);

router.post(
  '/upload-presets',
  validateRequest({ body: storageUploadPresetCreateSchema }),
  asyncHandler(storageController.createUploadPreset),
);

router.put(
  '/upload-presets/:id',
  validateRequest({ params: identifierParamSchema, body: storageUploadPresetUpdateSchema }),
  asyncHandler(storageController.updateUploadPreset),
);

router.delete(
  '/upload-presets/:id',
  validateRequest({ params: identifierParamSchema }),
  asyncHandler(storageController.deleteUploadPreset),
);

export default router;
