import * as identityVerificationService from '../services/adminIdentityVerificationService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function buildActorContext(req) {
  const actor = extractAdminActor(req);
  return {
    actor,
    serviceContext: {
      actorId: actor.actorId,
      actorRole: actor.roles[0] ?? 'admin',
    },
  };
}

export async function overview(req, res) {
  const payload = await identityVerificationService.getIdentityVerificationOverview(req.query ?? {});
  res.json(payload);
}

export async function index(req, res) {
  const result = await identityVerificationService.listIdentityVerifications(req.query ?? {});
  res.json(result);
}

export async function show(req, res) {
  const verificationId = coercePositiveInteger(req.params?.verificationId, 'verificationId');
  const record = await identityVerificationService.getIdentityVerificationById(verificationId);
  res.json(record);
}

export async function store(req, res) {
  const { actor, serviceContext } = buildActorContext(req);
  const record = await identityVerificationService.createIdentityVerification(req.body ?? {}, serviceContext);
  logger.info({ actor: actor.reference, verificationId: record?.id }, 'Admin identity verification created');
  res.status(201).json(record);
}

export async function update(req, res) {
  const verificationId = coercePositiveInteger(req.params?.verificationId, 'verificationId');
  const { actor, serviceContext } = buildActorContext(req);
  const record = await identityVerificationService.updateIdentityVerification(
    verificationId,
    req.body ?? {},
    serviceContext,
  );
  logger.info({ actor: actor.reference, verificationId }, 'Admin identity verification updated');
  res.json(record);
}

export async function createEvent(req, res) {
  const verificationId = coercePositiveInteger(req.params?.verificationId, 'verificationId');
  const { actor, serviceContext } = buildActorContext(req);
  const event = await identityVerificationService.createIdentityVerificationEvent(
    verificationId,
    req.body ?? {},
    serviceContext,
  );
  logger.info({ actor: actor.reference, verificationId, eventId: event?.id }, 'Admin identity verification event created');
  res.status(201).json(event);
}

export async function fetchSettings(req, res) {
  const settings = await identityVerificationService.getIdentityVerificationSettings();
  res.json(settings);
}

export async function updateSettings(req, res) {
  const settings = await identityVerificationService.updateIdentityVerificationSettings(req.body ?? {});
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin identity verification settings updated');
  res.json(settings);
}

export default {
  overview,
  index,
  show,
  store,
  update,
  createEvent,
  fetchSettings,
  updateSettings,
};
