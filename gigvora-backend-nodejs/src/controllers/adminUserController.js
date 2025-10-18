import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateSecurity,
  updateStatus,
  updateRoles,
  removeRole,
  resetPassword,
  createNote,
  listNotes,
  getMetadata,
} from '../services/adminUserService.js';

function resolveActorId(req) {
  const candidate = req.user?.id ?? req.auth?.userId;
  if (candidate == null) {
    return null;
  }
  const numeric = Number.parseInt(`${candidate}`, 10);
  return Number.isFinite(numeric) ? numeric : candidate;
}

export async function index(req, res) {
  const payload = await listUsers(req.query ?? {});
  res.json(payload);
}

export async function show(req, res) {
  const payload = await getUser(req.params.id);
  res.json(payload);
}

export async function store(req, res) {
  const actorId = resolveActorId(req);
  const payload = await createUser(req.body ?? {}, { actorId });
  res.status(201).json(payload);
}

export async function patch(req, res) {
  const payload = await updateUser(req.params.id, req.body ?? {});
  res.json(payload);
}

export async function patchSecurity(req, res) {
  const payload = await updateSecurity(req.params.id, req.body ?? {});
  res.json(payload);
}

export async function patchStatus(req, res) {
  const actorId = resolveActorId(req);
  const payload = await updateStatus(req.params.id, { ...req.body, actorId });
  res.json(payload);
}

export async function putRoles(req, res) {
  const actorId = resolveActorId(req);
  const payload = await updateRoles(req.params.id, req.body?.roles ?? [], { actorId });
  res.json(payload);
}

export async function destroyRole(req, res) {
  const payload = await removeRole(req.params.id, req.params.role);
  res.json(payload);
}

export async function postResetPassword(req, res) {
  const payload = await resetPassword(req.params.id, req.body ?? {});
  res.json(payload);
}

export async function postNote(req, res) {
  const actorId = resolveActorId(req);
  const note = await createNote(req.params.id, req.body ?? {}, { actorId });
  res.status(201).json(note);
}

export async function listUserNotes(req, res) {
  const notes = await listNotes(req.params.id, req.query ?? {});
  res.json(notes);
}

export async function metadata(req, res) {
  const meta = await getMetadata();
  res.json(meta);
}

export default {
  index,
  show,
  store,
  patch,
  patchSecurity,
  patchStatus,
  putRoles,
  destroyRole,
  postResetPassword,
  postNote,
  listUserNotes,
  metadata,
};

