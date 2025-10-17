import {
  getMentoringOverview,
  listMentoringSessions,
  createMentoringSession,
  updateMentoringSession,
  deleteMentoringSession,
  listMentoringPurchases,
  createMentoringPurchase,
  updateMentoringPurchase,
  listMentorPreferences,
  createMentorPreference,
  updateMentorPreference,
  deleteMentorPreference,
  listSuggestedMentors,
} from '../services/agencyMentoringService.js';

function actorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? null,
    actorRoles: req.user?.roles ?? [],
  };
}

function withWorkspacePayload(req, payload = {}) {
  const workspaceId =
    req.body?.workspaceId ?? req.query?.workspaceId ?? req.params?.workspaceId ?? payload.workspaceId ?? null;
  const workspaceSlug =
    req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? req.params?.workspaceSlug ?? payload.workspaceSlug ?? null;
  return {
    ...payload,
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceSlug ? { workspaceSlug } : {}),
  };
}

export async function overview(req, res) {
  const data = await getMentoringOverview(req.query ?? {}, actorContext(req));
  res.json(data);
}

export async function sessionsList(req, res) {
  const data = await listMentoringSessions(req.query ?? {}, actorContext(req));
  res.json(data);
}

export async function sessionsCreate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await createMentoringSession(payload, actorContext(req));
  res.status(201).json(record);
}

export async function sessionsUpdate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await updateMentoringSession(req.params.sessionId, payload, actorContext(req));
  res.json(record);
}

export async function sessionsDelete(req, res) {
  const payload = withWorkspacePayload(req, req.query ?? {});
  const result = await deleteMentoringSession(req.params.sessionId, payload, actorContext(req));
  res.json(result);
}

export async function purchasesList(req, res) {
  const data = await listMentoringPurchases(req.query ?? {}, actorContext(req));
  res.json(data);
}

export async function purchasesCreate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await createMentoringPurchase(payload, actorContext(req));
  res.status(201).json(record);
}

export async function purchasesUpdate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await updateMentoringPurchase(req.params.purchaseId, payload, actorContext(req));
  res.json(record);
}

export async function favouritesList(req, res) {
  const data = await listMentorPreferences(req.query ?? {}, actorContext(req));
  res.json(data);
}

export async function favouritesCreate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await createMentorPreference(payload, actorContext(req));
  res.status(201).json(record);
}

export async function favouritesUpdate(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await updateMentorPreference(req.params.preferenceId, payload, actorContext(req));
  res.json(record);
}

export async function favouritesDelete(req, res) {
  const payload = withWorkspacePayload(req, req.query ?? {});
  const result = await deleteMentorPreference(req.params.preferenceId, payload, actorContext(req));
  res.json(result);
}

export async function suggestionsList(req, res) {
  const data = await listSuggestedMentors(req.query ?? {}, actorContext(req));
  res.json(data);
}

export default {
  overview,
  sessionsList,
  sessionsCreate,
  sessionsUpdate,
  sessionsDelete,
  purchasesList,
  purchasesCreate,
  purchasesUpdate,
  favouritesList,
  favouritesCreate,
  favouritesUpdate,
  favouritesDelete,
  suggestionsList,
};
