import { Op } from 'sequelize';
import {
  AgencyJob,
  AgencyJobApplication,
  AgencyInterview,
  AgencyJobFavorite,
  AgencyApplicationResponse,
  AGENCY_JOB_STATUSES,
  AGENCY_EMPLOYMENT_TYPES,
  AGENCY_JOB_SENIORITIES,
  AGENCY_JOB_APPLICATION_STATUSES,
  AGENCY_JOB_INTERVIEW_STATUSES,
  AGENCY_INTERVIEW_MODES,
  AGENCY_APPLICATION_RESPONSE_TYPES,
  AGENCY_APPLICATION_RESPONSE_VISIBILITIES,
  buildJobSearchPredicate,
} from '../models/agencyJobModels.js';
import sequelizeClient from '../models/sequelizeClient.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeWorkspaceId(workspaceId) {
  if (workspaceId == null) {
    return null;
  }
  const value = `${workspaceId}`.trim();
  return value.length ? value : null;
}

function ensureWorkspaceId(workspaceId) {
  const normalized = normalizeWorkspaceId(workspaceId);
  if (!normalized) {
    throw new ValidationError('workspaceId is required');
  }
  return normalized;
}

function parsePagination({ page = 1, pageSize = 20 } = {}) {
  const safePage = Number.parseInt(page, 10);
  const safePageSize = Number.parseInt(pageSize, 10);
  const resolvedPage = Number.isFinite(safePage) && safePage > 0 ? safePage : 1;
  const resolvedPageSize = Number.isFinite(safePageSize) && safePageSize > 0 ? Math.min(safePageSize, 100) : 20;
  const offset = (resolvedPage - 1) * resolvedPageSize;
  return { page: resolvedPage, pageSize: resolvedPageSize, offset, limit: resolvedPageSize };
}

function toPlain(modelInstance) {
  return modelInstance ? modelInstance.get({ plain: true }) : null;
}

export async function listJobs({ workspaceId, status, search, page, pageSize } = {}) {
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const pagination = parsePagination({ page, pageSize });
  const where = { workspaceId: normalizedWorkspaceId };

  if (status && AGENCY_JOB_STATUSES.includes(status)) {
    where.status = status;
  }

  const searchPredicate = buildJobSearchPredicate(search);
  if (searchPredicate) {
    where[Op.and] = where[Op.and] ? [...where[Op.and], searchPredicate] : [searchPredicate];
  }

  const { rows, count } = await AgencyJob.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['updatedAt', 'DESC']],
    distinct: true,
    include: [
      { model: AgencyJobFavorite, as: 'favorites', attributes: ['memberId'] },
      { model: AgencyJobApplication, as: 'applications', attributes: ['id', 'status'] },
    ],
  });

  const jobs = rows.map((row) => {
    const job = toPlain(row);
    const favoriteMemberIds = Array.isArray(job.favorites) ? job.favorites.map((favorite) => favorite.memberId) : [];
    const applicationCounts = (job.applications ?? []).reduce(
      (accumulator, application) => {
        const normalizedStatus = application.status ?? 'new';
        accumulator.total += 1;
        accumulator.byStatus[normalizedStatus] = (accumulator.byStatus[normalizedStatus] ?? 0) + 1;
        return accumulator;
      },
      { total: 0, byStatus: {} },
    );

    return {
      ...job,
      favoriteMemberIds,
      applicationSummary: applicationCounts,
    };
  });

  const totals = jobs.reduce(
    (accumulator, job) => {
      accumulator.totalApplications += job.applicationSummary.total;
      if (job.status === 'open') {
        accumulator.openJobs += 1;
      }
      accumulator.favoriteJobs += job.favoriteMemberIds.length ? 1 : 0;
      return accumulator;
    },
    { openJobs: 0, favoriteJobs: 0, totalApplications: 0 },
  );

  return {
    data: jobs,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pagination.pageSize) || 1,
    },
    metrics: {
      totalJobs: count,
      openJobs: totals.openJobs,
      favoriteJobs: totals.favoriteJobs,
      totalApplications: totals.totalApplications,
    },
  };
}

export async function getJob(jobId, { workspaceId } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const job = await AgencyJob.findOne({
    where: { id: jobId, workspaceId: normalizedWorkspaceId },
    include: [
      { model: AgencyJobFavorite, as: 'favorites' },
      {
        model: AgencyJobApplication,
        as: 'applications',
        include: [
          { model: AgencyInterview, as: 'interviews' },
          { model: AgencyApplicationResponse, as: 'responses' },
        ],
      },
    ],
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  return toPlain(job);
}

function normalizeJobPayload(payload = {}) {
  const data = { ...payload };
  if (data.status && !AGENCY_JOB_STATUSES.includes(data.status)) {
    throw new ValidationError('Invalid job status provided');
  }
  if (data.employmentType && !AGENCY_EMPLOYMENT_TYPES.includes(data.employmentType)) {
    throw new ValidationError('Invalid employment type provided');
  }
  if (data.seniority && !AGENCY_JOB_SENIORITIES.includes(data.seniority)) {
    throw new ValidationError('Invalid seniority level provided');
  }
  return data;
}

export async function createJob(payload = {}, { workspaceId, actorId } = {}) {
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const data = normalizeJobPayload({ ...payload, workspaceId: normalizedWorkspaceId });
  if (!data.title) {
    throw new ValidationError('Job title is required');
  }

  const now = new Date();
  const job = await AgencyJob.create({
    ...data,
    workspaceId: normalizedWorkspaceId,
    createdBy: actorId ?? data.createdBy ?? null,
    updatedBy: actorId ?? data.updatedBy ?? null,
    publishedAt: data.status === 'open' && !data.publishedAt ? now : data.publishedAt ?? null,
  });
  return getJob(job.id, { workspaceId: normalizedWorkspaceId });
}

export async function updateJob(jobId, payload = {}, { workspaceId, actorId } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const data = normalizeJobPayload({ ...payload });
  const job = await AgencyJob.findOne({ where: { id: jobId, workspaceId: normalizedWorkspaceId } });
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (data.status && data.status === 'open' && !job.publishedAt) {
    job.publishedAt = new Date();
  }
  if (actorId != null) {
    job.updatedBy = actorId;
  }
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'workspaceId') {
      job[key] = value;
    }
  });
  await job.save();
  return getJob(jobId, { workspaceId: normalizedWorkspaceId });
}

export async function toggleFavorite(jobId, { workspaceId, memberId, pinnedNote, actorId } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const resolvedMemberId = memberId ?? actorId;
  if (resolvedMemberId == null) {
    throw new ValidationError('memberId is required to favorite a job');
  }

  const job = await AgencyJob.findOne({ where: { id: jobId, workspaceId: normalizedWorkspaceId } });
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const [favorite, created] = await AgencyJobFavorite.findOrCreate({
    where: { jobId, workspaceId: normalizedWorkspaceId, memberId: resolvedMemberId },
    defaults: {
      jobId,
      workspaceId: normalizedWorkspaceId,
      memberId: resolvedMemberId,
      pinnedNote: pinnedNote ?? null,
      createdBy: actorId ?? resolvedMemberId,
    },
  });

  if (!created) {
    favorite.pinnedNote = pinnedNote ?? favorite.pinnedNote ?? null;
    if (actorId != null) {
      favorite.createdBy = actorId;
    }
    await favorite.save();
  }

  return favorite.get({ plain: true });
}

export async function removeFavorite(jobId, { workspaceId, memberId } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  if (memberId == null) {
    throw new ValidationError('memberId is required');
  }

  const deleted = await AgencyJobFavorite.destroy({
    where: { jobId, workspaceId: normalizedWorkspaceId, memberId },
  });

  if (!deleted) {
    throw new NotFoundError('Favorite not found');
  }

  return { jobId, memberId };
}

function normalizeApplicationPayload(payload = {}) {
  const data = { ...payload };
  if (!data.candidateName) {
    throw new ValidationError('candidateName is required');
  }
  if (data.status && !AGENCY_JOB_APPLICATION_STATUSES.includes(data.status)) {
    throw new ValidationError('Invalid application status');
  }
  return data;
}

export async function listApplications(jobId, { workspaceId, status } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const where = { jobId, workspaceId: normalizedWorkspaceId };
  if (status && AGENCY_JOB_APPLICATION_STATUSES.includes(status)) {
    where.status = status;
  }

  const applications = await AgencyJobApplication.findAll({
    where,
    order: [['appliedAt', 'DESC']],
    include: [
      { model: AgencyInterview, as: 'interviews' },
      { model: AgencyApplicationResponse, as: 'responses' },
    ],
  });

  return applications.map(toPlain);
}

export async function createApplication(jobId, payload = {}, { workspaceId, actorId } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const job = await AgencyJob.findOne({ where: { id: jobId, workspaceId: normalizedWorkspaceId } });
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const data = normalizeApplicationPayload(payload);
  const application = await AgencyJobApplication.create({
    ...data,
    jobId,
    workspaceId: normalizedWorkspaceId,
    createdBy: actorId ?? data.createdBy ?? null,
    updatedBy: actorId ?? data.updatedBy ?? null,
  });
  return getApplication(application.id, { workspaceId: normalizedWorkspaceId });
}

export async function getApplication(applicationId, { workspaceId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const application = await AgencyJobApplication.findOne({
    where: { id: applicationId, workspaceId: normalizedWorkspaceId },
    include: [
      { model: AgencyInterview, as: 'interviews' },
      { model: AgencyApplicationResponse, as: 'responses' },
      { model: AgencyJob, as: 'job' },
    ],
  });
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  return toPlain(application);
}

export async function updateApplication(applicationId, payload = {}, { workspaceId, actorId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const application = await AgencyJobApplication.findOne({
    where: { id: applicationId, workspaceId: normalizedWorkspaceId },
  });
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  const data = normalizeApplicationPayload({
    candidateName: application.candidateName,
    ...payload,
  });

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'workspaceId') {
      application[key] = value;
    }
  });
  if (actorId != null) {
    application.updatedBy = actorId;
  }
  await application.save();
  return getApplication(applicationId, { workspaceId: normalizedWorkspaceId });
}

function normalizeInterviewPayload(payload = {}) {
  const data = { ...payload };
  if (!data.scheduledAt) {
    throw new ValidationError('scheduledAt is required');
  }
  if (data.mode && !AGENCY_INTERVIEW_MODES.includes(data.mode)) {
    throw new ValidationError('Invalid interview mode');
  }
  if (data.status && !AGENCY_JOB_INTERVIEW_STATUSES.includes(data.status)) {
    throw new ValidationError('Invalid interview status');
  }
  return data;
}

export async function listInterviews(applicationId, { workspaceId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const interviews = await AgencyInterview.findAll({
    where: { applicationId, workspaceId: normalizedWorkspaceId },
    order: [['scheduledAt', 'ASC']],
  });
  return interviews.map(toPlain);
}

export async function createInterview(applicationId, payload = {}, { workspaceId, actorId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const application = await AgencyJobApplication.findOne({
    where: { id: applicationId, workspaceId: normalizedWorkspaceId },
  });
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  const data = normalizeInterviewPayload(payload);
  const interview = await AgencyInterview.create({
    ...data,
    applicationId,
    workspaceId: normalizedWorkspaceId,
    createdBy: actorId ?? data.createdBy ?? null,
    updatedBy: actorId ?? data.updatedBy ?? null,
  });
  return interview.get({ plain: true });
}

export async function updateInterview(interviewId, payload = {}, { workspaceId, actorId } = {}) {
  if (!interviewId) {
    throw new ValidationError('interviewId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const interview = await AgencyInterview.findOne({
    where: { id: interviewId, workspaceId: normalizedWorkspaceId },
  });
  if (!interview) {
    throw new NotFoundError('Interview not found');
  }

  const data = normalizeInterviewPayload({
    scheduledAt: interview.scheduledAt,
    ...payload,
  });

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'workspaceId') {
      interview[key] = value;
    }
  });
  if (actorId != null) {
    interview.updatedBy = actorId;
  }
  await interview.save();
  return interview.get({ plain: true });
}

function normalizeResponsePayload(payload = {}) {
  const data = { ...payload };
  if (!data.body) {
    throw new ValidationError('body is required');
  }
  if (data.responseType && !AGENCY_APPLICATION_RESPONSE_TYPES.includes(data.responseType)) {
    throw new ValidationError('Invalid response type');
  }
  if (data.visibility && !AGENCY_APPLICATION_RESPONSE_VISIBILITIES.includes(data.visibility)) {
    throw new ValidationError('Invalid response visibility');
  }
  return data;
}

export async function listResponses(applicationId, { workspaceId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);
  const responses = await AgencyApplicationResponse.findAll({
    where: { applicationId, workspaceId: normalizedWorkspaceId },
    order: [['createdAt', 'DESC']],
  });
  return responses.map(toPlain);
}

export async function createResponse(applicationId, payload = {}, { workspaceId, actorId } = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required');
  }
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId ?? payload.workspaceId);
  const application = await AgencyJobApplication.findOne({
    where: { id: applicationId, workspaceId: normalizedWorkspaceId },
  });
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  const data = normalizeResponsePayload(payload);
  const response = await AgencyApplicationResponse.create({
    ...data,
    applicationId,
    workspaceId: normalizedWorkspaceId,
    authorId: actorId ?? data.authorId ?? null,
    createdBy: actorId ?? data.authorId ?? null,
  });
  return response.get({ plain: true });
}

export async function getJobManagementSnapshot({ workspaceId } = {}) {
  const normalizedWorkspaceId = ensureWorkspaceId(workspaceId);

  const [jobsSummary, interviewSummary] = await Promise.all([
    AgencyJob.findAll({
      where: { workspaceId: normalizedWorkspaceId },
      attributes: [
        'status',
        [sequelizeClient.fn('COUNT', sequelizeClient.col('AgencyJob.id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    }),
    AgencyInterview.findAll({
      where: { workspaceId: normalizedWorkspaceId },
      attributes: [
        'status',
        [sequelizeClient.fn('COUNT', sequelizeClient.col('AgencyInterview.id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    }),
  ]);

  const jobStatusCounts = Object.fromEntries(
    jobsSummary.map((item) => [item.status ?? 'unknown', Number.parseInt(item.count, 10) || 0]),
  );
  const interviewStatusCounts = Object.fromEntries(
    interviewSummary.map((item) => [item.status ?? 'planned', Number.parseInt(item.count, 10) || 0]),
  );

  return {
    jobStatusCounts,
    interviewStatusCounts,
  };
}

export function getJobManagementMetadata() {
  return {
    jobStatuses: AGENCY_JOB_STATUSES,
    employmentTypes: AGENCY_EMPLOYMENT_TYPES,
    seniorities: AGENCY_JOB_SENIORITIES,
    applicationStatuses: AGENCY_JOB_APPLICATION_STATUSES,
    interviewStatuses: AGENCY_JOB_INTERVIEW_STATUSES,
    interviewModes: AGENCY_INTERVIEW_MODES,
    responseTypes: AGENCY_APPLICATION_RESPONSE_TYPES,
    responseVisibilities: AGENCY_APPLICATION_RESPONSE_VISIBILITIES,
  };
}

export default {
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
  getJobManagementSnapshot,
  getJobManagementMetadata,
};
