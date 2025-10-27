import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  mobileAppListQuerySchema,
  mobileAppCreateSchema,
  mobileAppUpdateSchema,
  mobileAppParamsSchema,
  mobileAppVersionParamsSchema,
  mobileAppVersionCreateSchema,
  mobileAppVersionUpdateSchema,
  mobileAppFeatureParamsSchema,
  mobileAppFeatureCreateSchema,
  mobileAppFeatureUpdateSchema,
} from '../validation/schemas/adminMobileAppSchemas.js';
import {
  indexMobileApps,
  postMobileApp,
  putMobileApp,
  postMobileAppVersion,
  putMobileAppVersion,
  postMobileAppFeature,
  putMobileAppFeature,
  destroyMobileAppFeature,
} from '../controllers/adminMobileAppController.js';

const router = Router();

router.use(requireAdmin);

router.get('/', validateRequest({ query: mobileAppListQuerySchema }), asyncHandler(indexMobileApps));
router.post('/', validateRequest({ body: mobileAppCreateSchema }), asyncHandler(postMobileApp));
router.put(
  '/:appId',
  validateRequest({ params: mobileAppParamsSchema, body: mobileAppUpdateSchema }),
  asyncHandler(putMobileApp),
);
router.post(
  '/:appId/versions',
  validateRequest({ params: mobileAppParamsSchema, body: mobileAppVersionCreateSchema }),
  asyncHandler(postMobileAppVersion),
);
router.put(
  '/:appId/versions/:versionId',
  validateRequest({ params: mobileAppVersionParamsSchema, body: mobileAppVersionUpdateSchema }),
  asyncHandler(putMobileAppVersion),
);
router.post(
  '/:appId/features',
  validateRequest({ params: mobileAppParamsSchema, body: mobileAppFeatureCreateSchema }),
  asyncHandler(postMobileAppFeature),
);
router.put(
  '/:appId/features/:featureId',
  validateRequest({ params: mobileAppFeatureParamsSchema, body: mobileAppFeatureUpdateSchema }),
  asyncHandler(putMobileAppFeature),
);
router.delete(
  '/:appId/features/:featureId',
  validateRequest({ params: mobileAppFeatureParamsSchema }),
  asyncHandler(destroyMobileAppFeature),
);

export default router;
