import {
  fetchSpeedNetworkingCatalog,
  listSpeedNetworkingSessions,
  getSpeedNetworkingSession,
  createSpeedNetworkingSession,
  updateSpeedNetworkingSession,
  deleteSpeedNetworkingSession,
  createSpeedNetworkingParticipant,
  updateSpeedNetworkingParticipant,
  deleteSpeedNetworkingParticipant,
} from '../services/adminSpeedNetworkingService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function buildServiceActor(req) {
  const actor = extractAdminActor(req);
  return { actor, serviceActor: { id: actor.actorId ?? null } };
}

export async function catalog(req, res) {
  const data = await fetchSpeedNetworkingCatalog();
  res.json(data);
}

export async function index(req, res) {
  const { query } = req;
  const result = await listSpeedNetworkingSessions({
    status: query.status,
    hostId: query.hostId,
    ownerId: query.ownerId,
    workspaceId: query.workspaceId,
    from: query.from,
    to: query.to,
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
  });
  res.json(result);
}

export async function show(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const session = await getSpeedNetworkingSession(sessionId);
  res.json(session);
}

export async function create(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const session = await createSpeedNetworkingSession(stampPayloadWithActor(req.body ?? {}, actor), serviceActor);
  logger.info({ actor: actor.reference, sessionId: session?.id }, 'Speed networking session created');
  res.status(201).json(session);
}

export async function update(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const { actor, serviceActor } = buildServiceActor(req);
  const session = await updateSpeedNetworkingSession(
    sessionId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    serviceActor,
  );
  logger.info({ actor: actor.reference, sessionId }, 'Speed networking session updated');
  res.json(session);
}

export async function destroy(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  await deleteSpeedNetworkingSession(sessionId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, sessionId }, 'Speed networking session deleted');
  res.status(204).send();
}

export async function storeParticipant(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const { actor, serviceActor } = buildServiceActor(req);
  const participant = await createSpeedNetworkingParticipant(
    sessionId,
    stampPayloadWithActor(req.body ?? {}, actor),
    serviceActor,
  );
  logger.info({ actor: actor.reference, sessionId, participantId: participant?.id }, 'Speed networking participant added');
  res.status(201).json(participant);
}

export async function updateParticipantHandler(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const participantId = coercePositiveInteger(req.params?.participantId, 'participantId');
  const { actor, serviceActor } = buildServiceActor(req);
  const participant = await updateSpeedNetworkingParticipant(
    sessionId,
    participantId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
    serviceActor,
  );
  logger.info({ actor: actor.reference, sessionId, participantId }, 'Speed networking participant updated');
  res.json(participant);
}

export async function destroyParticipant(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const participantId = coercePositiveInteger(req.params?.participantId, 'participantId');
  await deleteSpeedNetworkingParticipant(sessionId, participantId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, sessionId, participantId }, 'Speed networking participant removed');
  res.status(204).send();
}

export default {
  catalog,
  index,
  show,
  create,
  update,
  destroy,
  storeParticipant,
  updateParticipant: updateParticipantHandler,
  destroyParticipant,
};
