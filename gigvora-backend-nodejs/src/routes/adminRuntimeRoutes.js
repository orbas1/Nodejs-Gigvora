import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminMaintenanceQuerySchema,
  createMaintenanceBodySchema,
  updateMaintenanceBodySchema,
  maintenanceStatusBodySchema,
  maintenanceIdentifierParamsSchema,
  maintenanceWindowBodySchema,
  maintenanceWindowUpdateSchema,
  maintenanceWindowParamsSchema,
  maintenanceNotificationBodySchema,
  liveServiceTelemetryQuerySchema,
} from '../validation/schemas/runtimeSchemas.js';
import {
  listMaintenance,
  createMaintenance,
  updateMaintenance,
  changeMaintenanceStatus,
  fetchMaintenance,
  maintenanceDashboard,
  listMaintenanceWindowsController,
  createMaintenanceWindowController,
  updateMaintenanceWindowController,
  deleteMaintenanceWindowController,
  sendMaintenanceNotification,
  fetchCalendarStubEnvironmentController,
} from '../controllers/adminRuntimeController.js';
import { getLiveServiceTelemetry } from '../controllers/liveServiceTelemetryController.js';
import { requireAdmin } from '../middleware/authenticate.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/maintenance',
  validateRequest({ query: adminMaintenanceQuerySchema }),
  asyncHandler(listMaintenance),
);

router.get('/maintenance/dashboard', asyncHandler(maintenanceDashboard));

router.get('/maintenance/integration/calendar-stub', asyncHandler(fetchCalendarStubEnvironmentController));

router.get('/maintenance/windows', asyncHandler(listMaintenanceWindowsController));

router.post(
  '/maintenance/windows',
  validateRequest({ body: maintenanceWindowBodySchema }),
  asyncHandler(createMaintenanceWindowController),
);

router.put(
  '/maintenance/windows/:windowId',
  validateRequest({ params: maintenanceWindowParamsSchema, body: maintenanceWindowUpdateSchema }),
  asyncHandler(updateMaintenanceWindowController),
);

router.delete(
  '/maintenance/windows/:windowId',
  validateRequest({ params: maintenanceWindowParamsSchema }),
  asyncHandler(deleteMaintenanceWindowController),
);

router.post(
  '/maintenance/notifications',
  validateRequest({ body: maintenanceNotificationBodySchema }),
  asyncHandler(sendMaintenanceNotification),
);

router.get(
  '/telemetry/live-services',
  validateRequest({ query: liveServiceTelemetryQuerySchema }),
  asyncHandler(getLiveServiceTelemetry),
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
