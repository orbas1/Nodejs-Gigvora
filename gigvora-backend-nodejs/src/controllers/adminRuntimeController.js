import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  getAnnouncement,
} from '../services/runtimeMaintenanceService.js';
import {
  getMaintenanceDashboardSnapshot,
  listMaintenanceWindows,
  createMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  sendMaintenanceBroadcast,
} from '../services/maintenanceControlCentreService.js';
import { getCalendarStubEnvironment } from '../services/calendarStubEnvironmentService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function buildServiceContext(req) {
  const actor = extractAdminActor(req);
  return {
    actor,
    context: {
      actor: {
        id: actor.actorId ?? null,
        email: actor.actorEmail ?? null,
        type: actor.roles[0] ?? 'admin',
        name: actor.actorName ?? actor.descriptor ?? null,
      },
    },
  };
}

export async function listMaintenance(req, res) {
  const { status, audience, channel, includeResolved, limit, offset, search } = req.query ?? {};
  const result = await listAnnouncements({
    status,
    audience,
    channel,
    includeResolved,
    limit,
    offset,
    search,
  });
  res.json(result);
}

export async function createMaintenance(req, res) {
  const { actor, context } = buildServiceContext(req);
  const record = await createAnnouncement(stampPayloadWithActor(req.body ?? {}, actor), context);
  logger.info({ actor: actor.reference, announcementId: record?.id }, 'Runtime maintenance created');
  res.status(201).json(record);
}

export async function updateMaintenance(req, res) {
  const { actor, context } = buildServiceContext(req);
  const announcementId = coercePositiveInteger(req.params?.announcementId, 'announcementId');
  const record = await updateAnnouncement(
    announcementId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    context,
  );
  logger.info({ actor: actor.reference, announcementId }, 'Runtime maintenance updated');
  res.json(record);
}

export async function changeMaintenanceStatus(req, res) {
  const { actor, context } = buildServiceContext(req);
  const announcementId = coercePositiveInteger(req.params?.announcementId, 'announcementId');
  const { status } = req.body ?? {};
  const record = await updateAnnouncementStatus(announcementId, status, context);
  logger.info({ actor: actor.reference, announcementId, status }, 'Runtime maintenance status changed');
  res.json(record);
}

export async function fetchMaintenance(req, res) {
  const announcementId = coercePositiveInteger(req.params?.announcementId, 'announcementId');
  const record = await getAnnouncement(announcementId);
  res.json(record);
}

export async function maintenanceDashboard(req, res) {
  const dashboard = await getMaintenanceDashboardSnapshot();
  res.json(dashboard);
}

export async function listMaintenanceWindowsController(req, res) {
  const windows = await listMaintenanceWindows();
  res.json({ windows });
}

export async function createMaintenanceWindowController(req, res) {
  const { actor } = buildServiceContext(req);
  const window = await createMaintenanceWindow(req.body ?? {}, { actor });
  res.status(201).json(window);
}

export async function updateMaintenanceWindowController(req, res) {
  const { actor } = buildServiceContext(req);
  const { windowId } = req.params ?? {};
  const window = await updateMaintenanceWindow(windowId, req.body ?? {}, { actor });
  res.json(window);
}

export async function deleteMaintenanceWindowController(req, res) {
  const { windowId } = req.params ?? {};
  await deleteMaintenanceWindow(windowId);
  res.status(204).send();
}

export async function sendMaintenanceNotification(req, res) {
  const { actor } = buildServiceContext(req);
  const result = await sendMaintenanceBroadcast(req.body ?? {}, { actor });
  res.status(202).json(result);
}

export async function fetchCalendarStubEnvironmentController(req, res) {
  const environment = await getCalendarStubEnvironment();
  res.json(environment);
}

export default {
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
};
