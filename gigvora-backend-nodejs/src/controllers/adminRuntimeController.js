import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  getAnnouncement,
} from '../services/runtimeMaintenanceService.js';

function resolveActor(req) {
  if (!req?.user) {
    return null;
  }
  const { id, type } = req.user;
  if (id == null && !type) {
    return null;
  }
  return { id, type };
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
  const actor = resolveActor(req);
  const record = await createAnnouncement(req.body ?? {}, { actor });
  res.status(201).json(record);
}

export async function updateMaintenance(req, res) {
  const actor = resolveActor(req);
  const { announcementId } = req.params ?? {};
  const record = await updateAnnouncement(announcementId, req.body ?? {}, { actor });
  res.json(record);
}

export async function changeMaintenanceStatus(req, res) {
  const actor = resolveActor(req);
  const { announcementId } = req.params ?? {};
  const { status } = req.body ?? {};
  const record = await updateAnnouncementStatus(announcementId, status, { actor });
  res.json(record);
}

export async function fetchMaintenance(req, res) {
  const { announcementId } = req.params ?? {};
  const record = await getAnnouncement(announcementId);
  res.json(record);
}

export default {
  listMaintenance,
  createMaintenance,
  updateMaintenance,
  changeMaintenanceStatus,
  fetchMaintenance,
};
