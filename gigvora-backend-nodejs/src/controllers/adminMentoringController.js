import {
  fetchMentoringCatalog,
  listMentoringSessions,
  getMentoringSession,
  createMentoringSession,
  updateMentoringSession,
  createSessionNote,
  updateSessionNote,
  deleteSessionNote,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '../services/adminMentoringService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

export async function catalog(req, res) {
  const data = await fetchMentoringCatalog();
  res.json({
    ...data,
    generatedAt: new Date().toISOString(),
  });
}

export async function index(req, res) {
  const { query } = req;
  const result = await listMentoringSessions({
    status: query.status,
    mentorId: query.mentorId,
    menteeId: query.menteeId,
    serviceLineId: query.serviceLineId,
    ownerId: query.ownerId,
    from: query.from,
    to: query.to,
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  res.json(result);
}

export async function show(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const session = await getMentoringSession(sessionId);
  res.json(session);
}

export async function create(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, {
    metadataKey: 'metadata',
  });
  const session = await createMentoringSession(payload);
  logger.info({ actor: actor.reference, sessionId: session?.id }, 'Admin mentoring session created');
  res.status(201).json(session);
}

export async function update(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const actor = extractAdminActor(req);
  const session = await updateMentoringSession(
    sessionId,
    stampPayloadWithActor(req.body ?? {}, actor, { metadataKey: 'metadata' }),
  );
  logger.info({ actor: actor.reference, sessionId }, 'Admin mentoring session updated');
  res.json(session);
}

export async function storeNote(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const actor = extractAdminActor(req);
  const payload = {
    ...req.body,
    authorId: req.body?.authorId ?? actor.actorId,
  };
  const note = await createSessionNote(sessionId, payload);
  logger.info({ actor: actor.reference, sessionId, noteId: note?.id }, 'Admin mentoring note created');
  res.status(201).json(note);
}

export async function updateNoteHandler(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  const note = await updateSessionNote(sessionId, noteId, req.body ?? {});
  res.json(note);
}

export async function destroyNote(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  await deleteSessionNote(sessionId, noteId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, sessionId, noteId }, 'Admin mentoring note deleted');
  res.status(204).send();
}

export async function storeAction(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const actor = extractAdminActor(req);
  const payload = {
    ...req.body,
    createdById: req.body?.createdById ?? actor.actorId,
  };
  const action = await createActionItem(sessionId, payload);
  logger.info({ actor: actor.reference, sessionId, actionId: action?.id }, 'Admin mentoring action created');
  res.status(201).json(action);
}

export async function updateAction(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const actionId = coercePositiveInteger(req.params?.actionId, 'actionId');
  const action = await updateActionItem(sessionId, actionId, req.body ?? {});
  res.json(action);
}

export async function destroyAction(req, res) {
  const sessionId = coercePositiveInteger(req.params?.sessionId, 'sessionId');
  const actionId = coercePositiveInteger(req.params?.actionId, 'actionId');
  await deleteActionItem(sessionId, actionId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, sessionId, actionId }, 'Admin mentoring action deleted');
  res.status(204).send();
}

export default {
  catalog,
  index,
  show,
  create,
  update,
  storeNote,
  updateNote: updateNoteHandler,
  destroyNote,
  storeAction,
  updateAction,
  destroyAction,
};
