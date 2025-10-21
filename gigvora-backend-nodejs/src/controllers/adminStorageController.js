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
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor } from '../utils/adminRequestContext.js';

function buildContext(req) {
  const actor = extractAdminActor(req);
  return {
    actor,
    serviceContext: {
      actor: {
        id: actor.actorId ?? null,
        email: actor.actorEmail ?? null,
        name: actor.actorName ?? actor.descriptor ?? null,
      },
    },
  };
}

export async function overview(req, res) {
  const snapshot = await getStorageOverview();
  res.json(snapshot);
}

export async function createLocation(req, res) {
  const { actor, serviceContext } = buildContext(req);
  const location = await createStorageLocation(
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
    serviceContext,
  );
  logger.info({ actor: actor.reference, locationId: location?.id }, 'Storage location created');
  res.status(201).json(location);
}

export async function updateLocation(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  const location = await updateStorageLocation(id, stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }), serviceContext);
  logger.info({ actor: actor.reference, locationId: id }, 'Storage location updated');
  res.json(location);
}

export async function deleteLocation(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  await deleteStorageLocation(id, serviceContext);
  logger.info({ actor: actor.reference, locationId: id }, 'Storage location deleted');
  res.status(204).end();
}

export async function createLifecycleRule(req, res) {
  const { actor, serviceContext } = buildContext(req);
  const rule = await createLifecycleRuleService(
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
    serviceContext,
  );
  logger.info({ actor: actor.reference, lifecycleRuleId: rule?.id }, 'Storage lifecycle rule created');
  res.status(201).json(rule);
}

export async function updateLifecycleRule(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  const rule = await updateLifecycleRuleService(
    id,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    serviceContext,
  );
  logger.info({ actor: actor.reference, lifecycleRuleId: id }, 'Storage lifecycle rule updated');
  res.json(rule);
}

export async function deleteLifecycleRule(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  await deleteLifecycleRuleService(id, serviceContext);
  logger.info({ actor: actor.reference, lifecycleRuleId: id }, 'Storage lifecycle rule deleted');
  res.status(204).end();
}

export async function createUploadPreset(req, res) {
  const { actor, serviceContext } = buildContext(req);
  const preset = await createUploadPresetService(
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
    serviceContext,
  );
  logger.info({ actor: actor.reference, presetId: preset?.id }, 'Storage upload preset created');
  res.status(201).json(preset);
}

export async function updateUploadPreset(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  const preset = await updateUploadPresetService(
    id,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    serviceContext,
  );
  logger.info({ actor: actor.reference, presetId: id }, 'Storage upload preset updated');
  res.json(preset);
}

export async function deleteUploadPreset(req, res) {
  const { id } = req.params;
  const { actor, serviceContext } = buildContext(req);
  await deleteUploadPresetService(id, serviceContext);
  logger.info({ actor: actor.reference, presetId: id }, 'Storage upload preset deleted');
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
