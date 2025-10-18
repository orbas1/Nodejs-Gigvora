import { Router } from 'express';
import * as adminDatabaseController from '../controllers/adminDatabaseController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  databaseConnectionListQuerySchema,
  databaseConnectionCreateSchema,
  databaseConnectionUpdateSchema,
  databaseConnectionIdParamSchema,
  databaseConnectionDetailQuerySchema,
  databaseConnectionTestSchema,
} from '../validation/schemas/adminSchemas.js';

const router = Router();

router.get(
  '/',
  validateRequest({ query: databaseConnectionListQuerySchema }),
  asyncHandler(adminDatabaseController.index),
);

router.post(
  '/',
  validateRequest({ body: databaseConnectionCreateSchema }),
  asyncHandler(adminDatabaseController.store),
);

router.post(
  '/test-connection',
  validateRequest({ body: databaseConnectionTestSchema }),
  asyncHandler(adminDatabaseController.test),
);

router.get(
  '/:connectionId',
  validateRequest({ params: databaseConnectionIdParamSchema, query: databaseConnectionDetailQuerySchema }),
  asyncHandler(adminDatabaseController.show),
);

router.put(
  '/:connectionId',
  validateRequest({ params: databaseConnectionIdParamSchema, body: databaseConnectionUpdateSchema }),
  asyncHandler(adminDatabaseController.update),
);

router.delete(
  '/:connectionId',
  validateRequest({ params: databaseConnectionIdParamSchema }),
  asyncHandler(adminDatabaseController.destroy),
);

export default router;
