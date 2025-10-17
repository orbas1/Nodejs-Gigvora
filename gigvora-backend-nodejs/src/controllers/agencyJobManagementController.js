import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  toggleFavorite,
  removeFavorite,
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  listInterviews,
  createInterview,
  updateInterview,
  listResponses,
  createResponse,
  getJobManagementMetadata,
  getJobManagementSnapshot,
} from '../services/agencyJobManagementService.js';

function resolveWorkspaceId(req) {
  return req.query?.workspaceId ?? req.body?.workspaceId ?? req.params?.workspaceId ?? null;
}

export async function metadata(req, res) {
  const data = getJobManagementMetadata();
  res.json({ data });
}

export async function summary(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const snapshot = await getJobManagementSnapshot({ workspaceId });
  res.json({ data: snapshot });
}

export async function index(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { status, search, page, pageSize } = req.query ?? {};
  const result = await listJobs({ workspaceId, status, search, page, pageSize });
  res.json(result);
}

export async function show(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { jobId } = req.params;
  const job = await getJob(jobId, { workspaceId });
  res.json({ data: job });
}

export async function store(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const job = await createJob({ ...req.body, workspaceId }, { workspaceId, actorId });
  res.status(201).json({ data: job });
}

export async function update(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { jobId } = req.params;
  const job = await updateJob(jobId, req.body ?? {}, { workspaceId, actorId });
  res.json({ data: job });
}

export async function favorite(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { jobId } = req.params;
  const { memberId, pinnedNote } = req.body ?? {};
  const favoriteJob = await toggleFavorite(jobId, { workspaceId, memberId, pinnedNote, actorId });
  res.status(201).json({ data: favoriteJob });
}

export async function unfavorite(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { jobId } = req.params;
  const memberInput = req.params?.memberId ?? req.query?.memberId ?? req.body?.memberId ?? null;
  let resolvedMemberId = null;
  if (memberInput === 'me' && req.user?.id != null) {
    resolvedMemberId = req.user.id;
  } else if (memberInput != null) {
    const parsedMemberId = Number.parseInt(memberInput, 10);
    resolvedMemberId = Number.isFinite(parsedMemberId) ? parsedMemberId : null;
  }
  const favorite = await removeFavorite(jobId, { workspaceId, memberId: resolvedMemberId });
  res.json({ data: favorite });
}

export async function applicationIndex(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { jobId } = req.params;
  const { status } = req.query ?? {};
  const applications = await listApplications(jobId, { workspaceId, status });
  res.json({ data: applications });
}

export async function applicationStore(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { jobId } = req.params;
  const application = await createApplication(jobId, req.body ?? {}, { workspaceId, actorId });
  res.status(201).json({ data: application });
}

export async function applicationShow(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { applicationId } = req.params;
  const application = await getApplication(applicationId, { workspaceId });
  res.json({ data: application });
}

export async function applicationUpdate(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { applicationId } = req.params;
  const application = await updateApplication(applicationId, req.body ?? {}, { workspaceId, actorId });
  res.json({ data: application });
}

export async function interviewIndex(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { applicationId } = req.params;
  const interviews = await listInterviews(applicationId, { workspaceId });
  res.json({ data: interviews });
}

export async function interviewStore(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { applicationId } = req.params;
  const interview = await createInterview(applicationId, req.body ?? {}, { workspaceId, actorId });
  res.status(201).json({ data: interview });
}

export async function interviewUpdate(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { interviewId } = req.params;
  const interview = await updateInterview(interviewId, req.body ?? {}, { workspaceId, actorId });
  res.json({ data: interview });
}

export async function responseIndex(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const { applicationId } = req.params;
  const responses = await listResponses(applicationId, { workspaceId });
  res.json({ data: responses });
}

export async function responseStore(req, res) {
  const workspaceId = resolveWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const { applicationId } = req.params;
  const response = await createResponse(applicationId, req.body ?? {}, { workspaceId, actorId });
  res.status(201).json({ data: response });
}

export default {
  metadata,
  summary,
  index,
  show,
  store,
  update,
  favorite,
  unfavorite,
  applicationIndex,
  applicationStore,
  applicationShow,
  applicationUpdate,
  interviewIndex,
  interviewStore,
  interviewUpdate,
  responseIndex,
  responseStore,
};
