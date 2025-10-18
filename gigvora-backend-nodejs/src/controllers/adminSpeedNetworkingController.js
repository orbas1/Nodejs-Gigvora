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
  const session = await getSpeedNetworkingSession(req.params.sessionId);
  res.json(session);
}

export async function create(req, res) {
  const session = await createSpeedNetworkingSession(req.body ?? {}, req.user ?? {});
  res.status(201).json(session);
}

export async function update(req, res) {
  const session = await updateSpeedNetworkingSession(req.params.sessionId, req.body ?? {}, req.user ?? {});
  res.json(session);
}

export async function destroy(req, res) {
  await deleteSpeedNetworkingSession(req.params.sessionId);
  res.status(204).send();
}

export async function storeParticipant(req, res) {
  const participant = await createSpeedNetworkingParticipant(req.params.sessionId, req.body ?? {}, req.user ?? {});
  res.status(201).json(participant);
}

export async function updateParticipantHandler(req, res) {
  const participant = await updateSpeedNetworkingParticipant(
    req.params.sessionId,
    req.params.participantId,
    req.body ?? {},
    req.user ?? {},
  );
  res.json(participant);
}

export async function destroyParticipant(req, res) {
  await deleteSpeedNetworkingParticipant(req.params.sessionId, req.params.participantId);
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
