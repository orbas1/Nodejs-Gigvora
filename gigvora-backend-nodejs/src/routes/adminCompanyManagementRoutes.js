import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminCompanyManagementController.js';
import {
  adminCompanyListQuerySchema,
  adminCompanyCreateSchema,
  adminCompanyUpdateSchema,
} from '../validation/schemas/adminCompanyManagementSchemas.js';

const router = Router();

router.get('/', validateRequest({ query: adminCompanyListQuerySchema }), asyncHandler(controller.index));
router.post('/', validateRequest({ body: adminCompanyCreateSchema }), asyncHandler(controller.store));
router.get('/:companyId', asyncHandler(controller.show));
router.put('/:companyId', validateRequest({ body: adminCompanyUpdateSchema }), asyncHandler(controller.update));
router.delete('/:companyId', asyncHandler(controller.destroy));

export default router;

