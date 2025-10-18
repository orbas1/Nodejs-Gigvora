import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as appearanceController from '../controllers/appearanceController.js';
import {
  appearanceSummaryQuerySchema,
  appearanceThemeCreateSchema,
  appearanceThemeParamsSchema,
  appearanceThemeUpdateSchema,
  appearanceAssetCreateSchema,
  appearanceAssetParamsSchema,
  appearanceAssetUpdateSchema,
  appearanceLayoutCreateSchema,
  appearanceLayoutParamsSchema,
  appearanceLayoutUpdateSchema,
  appearanceLayoutPublishSchema,
} from '../validation/schemas/appearanceSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: appearanceSummaryQuerySchema }), asyncHandler(appearanceController.summary));

router.post(
  '/themes',
  validateRequest({ body: appearanceThemeCreateSchema }),
  asyncHandler(appearanceController.createThemeHandler),
);

router.put(
  '/themes/:themeId',
  validateRequest({ params: appearanceThemeParamsSchema, body: appearanceThemeUpdateSchema }),
  asyncHandler(appearanceController.updateThemeHandler),
);

router.post(
  '/themes/:themeId/activate',
  validateRequest({ params: appearanceThemeParamsSchema }),
  asyncHandler(appearanceController.setDefaultThemeHandler),
);

router.delete(
  '/themes/:themeId',
  validateRequest({ params: appearanceThemeParamsSchema }),
  asyncHandler(appearanceController.deleteThemeHandler),
);

router.post(
  '/assets',
  validateRequest({ body: appearanceAssetCreateSchema }),
  asyncHandler(appearanceController.createAssetHandler),
);

router.put(
  '/assets/:assetId',
  validateRequest({ params: appearanceAssetParamsSchema, body: appearanceAssetUpdateSchema }),
  asyncHandler(appearanceController.updateAssetHandler),
);

router.delete(
  '/assets/:assetId',
  validateRequest({ params: appearanceAssetParamsSchema }),
  asyncHandler(appearanceController.deleteAssetHandler),
);

router.post(
  '/layouts',
  validateRequest({ body: appearanceLayoutCreateSchema }),
  asyncHandler(appearanceController.createLayoutHandler),
);

router.put(
  '/layouts/:layoutId',
  validateRequest({ params: appearanceLayoutParamsSchema, body: appearanceLayoutUpdateSchema }),
  asyncHandler(appearanceController.updateLayoutHandler),
);

router.post(
  '/layouts/:layoutId/publish',
  validateRequest({ params: appearanceLayoutParamsSchema, body: appearanceLayoutPublishSchema }),
  asyncHandler(appearanceController.publishLayoutHandler),
);

router.delete(
  '/layouts/:layoutId',
  validateRequest({ params: appearanceLayoutParamsSchema }),
  asyncHandler(appearanceController.deleteLayoutHandler),
);

export default router;
