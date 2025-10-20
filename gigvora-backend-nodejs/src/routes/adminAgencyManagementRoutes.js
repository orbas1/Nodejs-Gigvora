import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminAgencyManagementController.js';
import {
  adminAgencyListQuerySchema,
  adminAgencyCreateSchema,
  adminAgencyUpdateSchema,
} from '../validation/schemas/adminAgencyManagementSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: adminAgencyListQuerySchema }), asyncHandler(controller.index));
router.post('/', validateRequest({ body: adminAgencyCreateSchema }), asyncHandler(controller.store));
router.get('/:agencyId', asyncHandler(controller.show));
router.put('/:agencyId', validateRequest({ body: adminAgencyUpdateSchema }), asyncHandler(controller.update));
router.delete('/:agencyId', asyncHandler(controller.destroy));

export default router;

