import * as adminProfileService from '../services/adminProfileService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function buildServiceActor(req) {
  const actor = extractAdminActor(req);
  return {
    actor,
    serviceActor: {
      id: actor.actorId ?? null,
      email: actor.actorEmail ?? null,
      name: actor.actorName ?? actor.descriptor ?? null,
    },
  };
}

export async function listProfiles(req, res) {
  const payload = await adminProfileService.listProfiles(req.query ?? {});
  res.json(payload);
}

export async function getProfile(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const payload = await adminProfileService.getProfile(profileId);
  res.json(payload);
}

export async function createProfile(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.createProfile(
    stampPayloadWithActor(req.body ?? {}, actor, { metadataKey: 'metadata' }),
    serviceActor,
  );
  logger.info({ actor: actor.reference, profileId: payload?.id }, 'Admin profile created');
  res.status(201).json(payload);
}

export async function updateProfile(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.updateProfile(
    profileId,
    stampPayloadWithActor(req.body ?? {}, actor, { metadataKey: 'metadata', setUpdatedBy: true }),
    serviceActor,
  );
  logger.info({ actor: actor.reference, profileId }, 'Admin profile updated');
  res.json(payload);
}

export async function createReference(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.createReference(profileId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, profileId, referenceId: payload?.id }, 'Admin profile reference created');
  res.status(201).json(payload);
}

export async function updateReference(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const referenceId = coercePositiveInteger(req.params?.referenceId, 'referenceId');
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.updateReference(
    profileId,
    referenceId,
    req.body ?? {},
    serviceActor,
  );
  logger.info({ actor: actor.reference, profileId, referenceId }, 'Admin profile reference updated');
  res.json(payload);
}

export async function deleteReference(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const referenceId = coercePositiveInteger(req.params?.referenceId, 'referenceId');
  await adminProfileService.deleteReference(profileId, referenceId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, profileId, referenceId }, 'Admin profile reference deleted');
  res.status(204).send();
}

export async function createNote(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.createNote(profileId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, profileId, noteId: payload?.id }, 'Admin profile note created');
  res.status(201).json(payload);
}

export async function updateNote(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  const { actor, serviceActor } = buildServiceActor(req);
  const payload = await adminProfileService.updateNote(profileId, noteId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, profileId, noteId }, 'Admin profile note updated');
  res.json(payload);
}

export async function deleteNote(req, res) {
  const profileId = coercePositiveInteger(req.params?.profileId, 'profileId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  await adminProfileService.deleteNote(profileId, noteId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, profileId, noteId }, 'Admin profile note deleted');
  res.status(204).send();
}

export default {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  createReference,
  updateReference,
  deleteReference,
  createNote,
  updateNote,
  deleteNote,
};
