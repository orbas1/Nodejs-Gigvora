import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminMaintenanceQuerySchema,
  createMaintenanceBodySchema,
  updateMaintenanceBodySchema,
  maintenanceStatusBodySchema,
  maintenanceIdentifierParamsSchema,
} from '../validation/schemas/runtimeSchemas.js';
import {
  listMaintenance,
  createMaintenance,
  updateMaintenance,
  changeMaintenanceStatus,
  fetchMaintenance,
} from '../controllers/adminRuntimeController.js';

const router = Router();

router.get(
  '/maintenance',
  validateRequest({ query: adminMaintenanceQuerySchema }),
  asyncHandler(listMaintenance),
);

router.post(
  '/maintenance',
  validateRequest({ body: createMaintenanceBodySchema }),
  asyncHandler(createMaintenance),
);

router.get(
  '/maintenance/:announcementId',
  validateRequest({ params: maintenanceIdentifierParamsSchema }),
  asyncHandler(fetchMaintenance),
);

router.put(
  '/maintenance/:announcementId',
  validateRequest({
    params: maintenanceIdentifierParamsSchema,
    body: updateMaintenanceBodySchema,
  }),
  asyncHandler(updateMaintenance),
);

router.patch(
  '/maintenance/:announcementId/status',
  validateRequest({
    params: maintenanceIdentifierParamsSchema,
    body: maintenanceStatusBodySchema,
  }),
  asyncHandler(changeMaintenanceStatus),
);

export default router;
