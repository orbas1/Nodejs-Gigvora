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
  const { sessionId } = req.params;
  const session = await getMentoringSession(sessionId);
  res.json(session);
}

export async function create(req, res) {
  const session = await createMentoringSession(req.body ?? {});
  res.status(201).json(session);
}

export async function update(req, res) {
  const { sessionId } = req.params;
  const session = await updateMentoringSession(sessionId, req.body ?? {});
  res.json(session);
}

export async function storeNote(req, res) {
  const { sessionId } = req.params;
  const note = await createSessionNote(sessionId, req.body ?? {});
  res.status(201).json(note);
}

export async function updateNoteHandler(req, res) {
  const { sessionId, noteId } = req.params;
  const note = await updateSessionNote(sessionId, noteId, req.body ?? {});
  res.json(note);
}

export async function destroyNote(req, res) {
  const { sessionId, noteId } = req.params;
  await deleteSessionNote(sessionId, noteId);
  res.status(204).send();
}

export async function storeAction(req, res) {
  const { sessionId } = req.params;
  const action = await createActionItem(sessionId, req.body ?? {});
  res.status(201).json(action);
}

export async function updateAction(req, res) {
  const { sessionId, actionId } = req.params;
  const action = await updateActionItem(sessionId, actionId, req.body ?? {});
  res.json(action);
}

export async function destroyAction(req, res) {
  const { sessionId, actionId } = req.params;
  await deleteActionItem(sessionId, actionId);
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
