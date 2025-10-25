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
import { toOptionalPositiveInteger, toPositiveInteger } from '../utils/controllerUtils.js';

export async function operations(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const result = await getCompanyJobOperations({
    workspaceId: toOptionalPositiveInteger(workspaceId, { fieldName: 'workspaceId', required: false }),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: toOptionalPositiveInteger(lookbackDays, {
      fieldName: 'lookbackDays',
      required: false,
      allowZero: false,
    }),
  });
  res.json(result);
}

export async function createJob(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await createJobPosting({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateJob(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateJobPosting({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function setKeywords(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, keywords } = req.body ?? {};
  const result = await updateJobKeywords({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    keywords,
    actorId,
  });
  res.json({ keywords: result });
}

export async function favoriteJob(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, userId, notes } = req.body ?? {};
  const result = await createJobFavorite({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    userId: toOptionalPositiveInteger(userId, { fieldName: 'userId', required: false }),
    notes,
    actorId,
  });
  res.status(201).json(result);
}

export async function unfavoriteJob(req, res) {
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const favoriteId = toPositiveInteger(req.params?.favoriteId, { fieldName: 'favoriteId' });
  const workspaceId = toPositiveInteger(req.query?.workspaceId ?? req.body?.workspaceId, {
    fieldName: 'workspaceId',
  });
  const result = await removeJobFavorite({ workspaceId, jobId, favoriteId });
  res.json(result);
}

export async function createApplicationController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, applicantId, ...payload } = req.body ?? {};
  const result = await createJobApplication({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    applicantId: toPositiveInteger(applicantId, { fieldName: 'applicantId' }),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateApplicationController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const applicationId = toPositiveInteger(req.params?.applicationId, { fieldName: 'applicationId' });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateJobApplication({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    applicationId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function scheduleInterviewController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, applicationId, ...payload } = req.body ?? {};
  const result = await scheduleInterview({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    applicationId: toPositiveInteger(applicationId, { fieldName: 'applicationId' }),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateInterviewController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const interviewId = toPositiveInteger(req.params?.interviewId, { fieldName: 'interviewId' });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateInterview({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    interviewId,
    payload,
    actorId,
  });
  res.json(result);
}

export async function recordResponseController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const { workspaceId, applicationId, ...payload } = req.body ?? {};
  const result = await recordCandidateResponse({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    applicationId: toOptionalPositiveInteger(applicationId, { fieldName: 'applicationId', required: false }),
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function addNoteController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const applicationId = toPositiveInteger(req.params?.applicationId, { fieldName: 'applicationId' });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await addCandidateNote({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
    jobId,
    applicationId,
    payload,
    actorId,
  });
  res.status(201).json(result);
}

export async function updateNoteController(req, res) {
  const actorId = toOptionalPositiveInteger(req.user?.id, { fieldName: 'actorId', required: false });
  const jobId = toPositiveInteger(req.params?.jobId, { fieldName: 'jobId' });
  const noteId = toPositiveInteger(req.params?.noteId, { fieldName: 'noteId' });
  const { workspaceId, ...payload } = req.body ?? {};
  const result = await updateCandidateNote({
    workspaceId: toPositiveInteger(workspaceId, { fieldName: 'workspaceId' }),
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
