import {
  getStorageOverview,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  createLifecycleRule as createLifecycleRuleService,
  updateLifecycleRule as updateLifecycleRuleService,
  deleteLifecycleRule as deleteLifecycleRuleService,
  createUploadPreset as createUploadPresetService,
  updateUploadPreset as updateUploadPresetService,
  deleteUploadPreset as deleteUploadPresetService,
} from '../services/storageManagementService.js';

function buildContext(req) {
  const actor = {
    id: req.user?.id ?? null,
    email: req.user?.email ?? req.headers['x-user-email'] ?? null,
    name: req.user?.name ?? req.headers['x-user-name'] ?? null,
  };

  if (!actor.email) {
    actor.email = req.user?.username ?? null;
  }

  return { actor };
}

export async function overview(req, res) {
  const snapshot = await getStorageOverview();
  res.json(snapshot);
}

export async function createLocation(req, res) {
  const location = await createStorageLocation(req.body ?? {}, buildContext(req));
  res.status(201).json(location);
}

export async function updateLocation(req, res) {
  const { id } = req.params;
  const location = await updateStorageLocation(id, req.body ?? {}, buildContext(req));
  res.json(location);
}

export async function deleteLocation(req, res) {
  const { id } = req.params;
  await deleteStorageLocation(id, buildContext(req));
  res.status(204).end();
}

export async function createLifecycleRule(req, res) {
  const rule = await createLifecycleRuleService(req.body ?? {}, buildContext(req));
  res.status(201).json(rule);
}

export async function updateLifecycleRule(req, res) {
  const { id } = req.params;
  const rule = await updateLifecycleRuleService(id, req.body ?? {}, buildContext(req));
  res.json(rule);
}

export async function deleteLifecycleRule(req, res) {
  const { id } = req.params;
  await deleteLifecycleRuleService(id, buildContext(req));
  res.status(204).end();
}

export async function createUploadPreset(req, res) {
  const preset = await createUploadPresetService(req.body ?? {}, buildContext(req));
  res.status(201).json(preset);
}

export async function updateUploadPreset(req, res) {
  const { id } = req.params;
  const preset = await updateUploadPresetService(id, req.body ?? {}, buildContext(req));
  res.json(preset);
}

export async function deleteUploadPreset(req, res) {
  const { id } = req.params;
  await deleteUploadPresetService(id, buildContext(req));
  res.status(204).end();
}

export default {
  overview,
  createLocation,
  updateLocation,
  deleteLocation,
  createLifecycleRule,
  updateLifecycleRule,
  deleteLifecycleRule,
  createUploadPreset,
  updateUploadPreset,
  deleteUploadPreset,
};
