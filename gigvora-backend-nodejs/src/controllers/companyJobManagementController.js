import {
  getCompanyJobOperations,
  createJobPosting,
  updateJobPosting,
  updateJobKeywords,
  createJobFavorite,
  removeJobFavorite,
  createJobApplication,
  updateJobApplication,
  scheduleInterview,
  updateInterview,
  recordCandidateResponse,
  addCandidateNote,
  updateCandidateNote,
} from '../services/companyJobManagementService.js';

function parseNumber(value) {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function operations(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const result = await getCompanyJobOperations({
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  });
  res.json(result);
}

export async function createJob(req, res) {
  const actorId = req.user?.id ?? null;
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await createJobPosting({
    workspaceId: parseNumber(workspaceId),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateJob(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateJobPosting({
    workspaceId: parseNumber(workspaceId),
    jobId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function setKeywords(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, keywords } = req.body ?? {};
  const result = await updateJobKeywords({
    workspaceId: parseNumber(workspaceId),
    jobId,
    keywords,
    actorId,
  });
  res.json({ keywords: result });
}

export async function favoriteJob(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, userId, notes } = req.body ?? {};
  const result = await createJobFavorite({
    workspaceId: parseNumber(workspaceId),
    jobId,
    userId: parseNumber(userId),
    notes,
    actorId,
  });
  res.status(201).json(result);
}

export async function unfavoriteJob(req, res) {
  const jobId = parseNumber(req.params?.jobId);
  const favoriteId = parseNumber(req.params?.favoriteId);
  const workspaceId = parseNumber(req.query?.workspaceId ?? req.body?.workspaceId);
  const result = await removeJobFavorite({ workspaceId, jobId, favoriteId });
  res.json(result);
}

export async function createApplicationController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, applicantId, ...payload } = req.body ?? {};
  const result = await createJobApplication({
    workspaceId: parseNumber(workspaceId),
    jobId,
    applicantId: parseNumber(applicantId),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateApplicationController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const applicationId = parseNumber(req.params?.applicationId);
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateJobApplication({
    workspaceId: parseNumber(workspaceId),
    jobId,
    applicationId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function scheduleInterviewController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, applicationId, ...payload } = req.body ?? {};
  const result = await scheduleInterview({
    workspaceId: parseNumber(workspaceId),
    jobId,
    applicationId: parseNumber(applicationId),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateInterviewController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const interviewId = parseNumber(req.params?.interviewId);
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateInterview({
    workspaceId: parseNumber(workspaceId),
    jobId,
    interviewId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function recordResponseController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const { workspaceId, applicationId, ...payload } = req.body ?? {};
  const result = await recordCandidateResponse({
    workspaceId: parseNumber(workspaceId),
    jobId,
    applicationId: parseNumber(applicationId),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function addNoteController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const applicationId = parseNumber(req.params?.applicationId);
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await addCandidateNote({
    workspaceId: parseNumber(workspaceId),
    jobId,
    applicationId,
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateNoteController(req, res) {
  const actorId = req.user?.id ?? null;
  const jobId = parseNumber(req.params?.jobId);
  const noteId = parseNumber(req.params?.noteId);
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateCandidateNote({
    workspaceId: parseNumber(workspaceId),
    jobId,
    noteId,
    payload,
    actorId,
  });
  res.json(result);
}

export default {
  operations,
  createJob,
  updateJob,
  setKeywords,
  favoriteJob,
  unfavoriteJob,
  createApplicationController,
  updateApplicationController,
  scheduleInterviewController,
  updateInterviewController,
  recordResponseController,
  addNoteController,
  updateNoteController,
};
