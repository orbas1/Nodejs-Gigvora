import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  Job,
  JobAdvert,
  JobFavorite,
  JobKeyword,
  JobAdvertHistory,
  JobCandidateResponse,
  JobCandidateNote,
  Application,
  InterviewSchedule,
  JobStage,
  User,
  Profile,
  APPLICATION_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_LOOKBACK_DAYS = 90;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 365;

const JOB_STATUS_OPTIONS = Object.freeze([
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]);

const REMOTE_TYPE_OPTIONS = Object.freeze([
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]);

const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' '),
}));

function clamp(value, { min, max, fallback }) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(Math.max(numeric, min), max);
}

function normaliseNumber(value, { fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function parseWorkspaceSelector({ workspaceId, workspaceSlug }) {
  if (workspaceId != null && `${workspaceId}`.trim().length) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    return { id: parsed };
  }
  if (workspaceSlug != null && `${workspaceSlug}`.trim().length) {
    return { slug: `${workspaceSlug}`.trim() };
  }
  throw new ValidationError('workspaceId or workspaceSlug is required.');
}

async function fetchWorkspace(selector) {
  const workspace = await ProviderWorkspace.findOne({
    where: {
      type: 'company',
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.slug ? { slug: selector.slug } : {}),
    },
    include: [
      {
        model: ProviderWorkspaceMember,
        as: 'members',
        required: false,
        attributes: ['id'],
      },
    ],
  });
  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }
  return workspace;
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((record) => record.get({ plain: true }));
}

function toPlain(record) {
  return record?.get ? record.get({ plain: true }) : record ?? null;
}

function buildKeywordMatches(keywords, applicationsForJob) {
  const keywordList = (keywords ?? []).map((entry) =>
    typeof entry === 'string'
      ? entry.trim().toLowerCase()
      : `${entry?.keyword ?? ''}`.trim().toLowerCase(),
  ).filter(Boolean);
  if (!keywordList.length) {
    return [];
  }
  const uniqueKeywords = Array.from(new Set(keywordList));
  const matches = [];
  applicationsForJob.forEach((application) => {
    const applicant = application.applicant ?? {};
    const profile = applicant.Profile ?? {};
    const searchable = [
      applicant.firstName,
      applicant.lastName,
      applicant.email,
      profile.headline,
      profile.bio,
      profile.skills,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!searchable) {
      return;
    }
    const matchedKeywords = uniqueKeywords.filter((keyword) => searchable.includes(keyword));
    if (!matchedKeywords.length) {
      return;
    }
    const score = Number((matchedKeywords.length / uniqueKeywords.length).toFixed(2));
    matches.push({
      applicationId: application.id,
      candidateId: applicant.id ?? null,
      candidateName: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
      matchedKeywords,
      score,
    });
  });
  return matches.sort((a, b) => b.score - a.score).slice(0, 10);
}

function buildKanbanColumns(applications, jobMap) {
  const columns = APPLICATION_STATUS_OPTIONS.map((option) => ({
    status: option.value,
    label: option.label,
    applications: [],
  }));
  const columnByStatus = new Map(columns.map((column) => [column.status, column]));
  applications.forEach((application) => {
    const column = columnByStatus.get(application.status) ?? columnByStatus.get('submitted');
    if (!column) {
      return;
    }
    const job = jobMap.get(application.targetId ?? application.jobId ?? null);
    const applicant = application.applicant ?? {};
    column.applications.push({
      id: application.id,
      jobId: application.targetId,
      jobTitle: job?.job?.title ?? job?.title ?? null,
      submittedAt: application.submittedAt ?? application.createdAt ?? null,
      status: application.status,
      candidateName: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
      candidateId: applicant.id ?? null,
    });
  });
  columns.forEach((column) => {
    column.applications.sort((a, b) => {
      const left = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const right = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return right - left;
    });
  });
  return columns;
}

function buildAtsMetrics(jobStages) {
  if (!jobStages.length) {
    return {
      totalStages: 0,
      instrumentedStages: 0,
      automationCoverage: 0,
      averageSlaHours: null,
      averageDurationHours: null,
    };
  }
  const instrumentedStages = jobStages.filter((stage) => Boolean(stage.guideUrl) || Boolean(stage.metadata?.playbookId)).length;
  const automationCoverage = Number(((instrumentedStages / jobStages.length) * 100).toFixed(1));
  const slaValues = jobStages
    .map((stage) => normaliseNumber(stage.slaHours))
    .filter((value) => Number.isFinite(value));
  const durationValues = jobStages
    .map((stage) => normaliseNumber(stage.averageDurationHours))
    .filter((value) => Number.isFinite(value));
  const averageSlaHours = slaValues.length
    ? Number((slaValues.reduce((total, value) => total + value, 0) / slaValues.length).toFixed(1))
    : null;
  const averageDurationHours = durationValues.length
    ? Number((durationValues.reduce((total, value) => total + value, 0) / durationValues.length).toFixed(1))
    : null;
  return {
    totalStages: jobStages.length,
    instrumentedStages,
    automationCoverage,
    averageSlaHours,
    averageDurationHours,
  };
}

function sanitizeJobPayload(payload = {}) {
  const {
    title,
    description,
    location,
    employmentType,
    geoLocation,
    status,
    openings,
    remoteType,
    currencyCode,
    compensationMin,
    compensationMax,
    hiringManagerId,
    publishedAt,
    expiresAt,
    department,
    workflow,
  } = payload;

  if (!title || !`${title}`.trim()) {
    throw new ValidationError('Title is required.');
  }
  if (!description || !`${description}`.trim()) {
    throw new ValidationError('Description is required.');
  }
  const resolvedStatus = status && JOB_STATUS_OPTIONS.find((option) => option.value === status) ? status : 'draft';
  const resolvedRemoteType = remoteType && REMOTE_TYPE_OPTIONS.find((option) => option.value === remoteType)
    ? remoteType
    : 'remote';
  const sanitized = {
    job: {
      title: `${title}`.trim(),
      description: `${description}`.trim(),
      location: location ? `${location}`.trim() : null,
      employmentType: employmentType ? `${employmentType}`.trim() : null,
      geoLocation: geoLocation ?? null,
    },
    advert: {
      status: resolvedStatus,
      openings: openings != null ? Math.max(1, Number.parseInt(openings, 10) || 1) : 1,
      remoteType: resolvedRemoteType,
      currencyCode: currencyCode ? `${currencyCode}`.trim().toUpperCase().slice(0, 3) : 'USD',
      compensationMin: compensationMin != null ? Number(compensationMin) : null,
      compensationMax: compensationMax != null ? Number(compensationMax) : null,
      hiringManagerId: hiringManagerId != null ? Number(hiringManagerId) : null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: {
        department: department ? `${department}`.trim() : null,
        workflow: workflow ?? null,
      },
    },
  };
  return sanitized;
}

async function findJobAdvert(jobId, workspaceId, { transaction } = {}) {
  const advert = await JobAdvert.findOne({
    where: { jobId, workspaceId },
    include: [{ model: Job, as: 'job' }],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!advert) {
    throw new NotFoundError('Job advert not found for workspace.');
  }
  return advert;
}

function sanitizeKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    throw new ValidationError('keywords must be an array.');
  }
  const unique = new Map();
  keywords
    .map((entry) => {
      if (typeof entry === 'string') {
        return { keyword: entry.trim(), weight: 1 };
      }
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      return {
        keyword: `${entry.keyword ?? ''}`.trim(),
        weight: entry.weight != null ? Number(entry.weight) : 1,
      };
    })
    .filter((entry) => entry && entry.keyword)
    .forEach((entry) => {
      const key = entry.keyword.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, { keyword: entry.keyword, weight: Number.isFinite(entry.weight) ? entry.weight : 1 });
      }
    });
  return Array.from(unique.values()).slice(0, 25);
}

function sanitizeNotePayload(payload = {}) {
  const { summary, stage, sentiment, nextSteps, attachments } = payload;
  if (!summary || !`${summary}`.trim()) {
    throw new ValidationError('Summary is required.');
  }
  const allowedSentiments = ['positive', 'neutral', 'concern'];
  const resolvedSentiment = allowedSentiments.includes(sentiment) ? sentiment : 'neutral';
  return {
    summary: `${summary}`.trim().slice(0, 255),
    stage: stage ? `${stage}`.trim().slice(0, 120) : null,
    sentiment: resolvedSentiment,
    nextSteps: nextSteps ? `${nextSteps}`.trim() : null,
    attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : null,
  };
}

function sanitizeResponsePayload(payload = {}) {
  const { channel, direction, message, respondentId, respondentName, sentAt, metadata } = payload;
  if (!message || !`${message}`.trim()) {
    throw new ValidationError('Message body is required.');
  }
  const resolvedDirection = direction === 'outbound' ? 'outbound' : 'inbound';
  return {
    channel: channel ? `${channel}`.trim().slice(0, 60) : 'message',
    direction: resolvedDirection,
    message: `${message}`.trim(),
    respondentId: respondentId != null ? Number(respondentId) : null,
    respondentName: respondentName ? `${respondentName}`.trim().slice(0, 255) : null,
    sentAt: sentAt ? new Date(sentAt) : new Date(),
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
  };
}

export async function getCompanyJobOperations({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const selector = parseWorkspaceSelector({ workspaceId, workspaceSlug });
  const lookback = clamp(lookbackDays, {
    min: MIN_LOOKBACK_DAYS,
    max: MAX_LOOKBACK_DAYS,
    fallback: DEFAULT_LOOKBACK_DAYS,
  });
  const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

  const workspace = await fetchWorkspace(selector);
  const availableWorkspaces = await listAvailableWorkspaces();

  const jobAdverts = await JobAdvert.findAll({
    where: { workspaceId: workspace.id },
    include: [
      { model: Job, as: 'job' },
      {
        model: JobKeyword,
        as: 'keywords',
        attributes: ['id', 'keyword', 'weight', 'createdAt'],
        order: [['weight', 'DESC']],
      },
      {
        model: JobFavorite,
        as: 'favorites',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const jobIds = jobAdverts.map((advert) => advert.jobId);

  const [applications, interviewSchedules, jobHistories, jobResponses, jobNotes, jobStages] = await Promise.all([
    jobIds.length
      ? Application.findAll({
          where: {
            targetType: 'job',
            targetId: { [Op.in]: jobIds },
          },
          include: [
            {
              model: User,
              as: 'applicant',
              attributes: ['id', 'firstName', 'lastName', 'email'],
              include: [{ model: Profile, as: 'Profile', attributes: ['id', 'headline', 'bio', 'skills'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [],
    jobIds.length
      ? InterviewSchedule.findAll({
          where: {
            workspaceId: workspace.id,
            scheduledAt: { [Op.gte]: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
          include: [
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['scheduledAt', 'ASC']],
        })
      : [],
    jobIds.length
      ? JobAdvertHistory.findAll({
          where: { workspaceId: workspace.id, jobId: { [Op.in]: jobIds } },
          include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['createdAt', 'DESC']],
          limit: 200,
        })
      : [],
    jobIds.length
      ? JobCandidateResponse.findAll({
          where: {
            workspaceId: workspace.id,
            jobId: { [Op.in]: jobIds },
            sentAt: { [Op.gte]: since },
          },
          include: [
            { model: User, as: 'respondent', attributes: ['id', 'firstName', 'lastName', 'email'] },
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['sentAt', 'DESC']],
        })
      : [],
    jobIds.length
      ? JobCandidateNote.findAll({
          where: { workspaceId: workspace.id, jobId: { [Op.in]: jobIds } },
          include: [
            { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [],
    JobStage.findAll({
      where: { workspaceId: workspace.id },
      order: [['jobId', 'ASC'], ['orderIndex', 'ASC']],
    }),
  ]);

  const jobMap = new Map(jobAdverts.map((advert) => [advert.jobId, toPlain(advert)]));
  const historyByJob = jobHistories.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());
  const responsesByJob = jobResponses.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());
  const notesByJob = jobNotes.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());

  const applicationsByJob = applications.reduce((acc, application) => {
    const plain = toPlain(application);
    const list = acc.get(plain.targetId) ?? [];
    list.push(plain);
    acc.set(plain.targetId, list);
    return acc;
  }, new Map());

  const interviewRecords = interviewSchedules.map((schedule) => {
    const plain = toPlain(schedule);
    const jobId = plain.application?.targetId ?? plain.application?.jobId ?? null;
    return { ...plain, jobId };
  });

  const interviewsByApplication = interviewRecords.reduce((acc, schedule) => {
    const list = acc.get(schedule.applicationId) ?? [];
    list.push(schedule);
    acc.set(schedule.applicationId, list);
    return acc;
  }, new Map());

  const notesByApplication = jobNotes.reduce((acc, note) => {
    const plain = toPlain(note);
    const list = acc.get(plain.applicationId) ?? [];
    list.push(plain);
    acc.set(plain.applicationId, list);
    return acc;
  }, new Map());

  const responsesByApplication = jobResponses.reduce((acc, response) => {
    const plain = toPlain(response);
    const list = acc.get(plain.applicationId) ?? [];
    list.push(plain);
    acc.set(plain.applicationId, list);
    return acc;
  }, new Map());

  const stageByJob = jobStages.reduce((acc, stage) => {
    const plain = toPlain(stage);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());

  const jobAdvertsPayload = jobAdverts.map((advert) => {
    const plain = toPlain(advert);
    const jobApplications = applicationsByJob.get(plain.jobId) ?? [];
    const jobHistory = historyByJob.get(plain.jobId) ?? [];
    const jobResponsesList = responsesByJob.get(plain.jobId) ?? [];
    const jobNotesList = notesByJob.get(plain.jobId) ?? [];
    const jobStagesList = stageByJob.get(plain.jobId) ?? [];
    const keywordMatches = buildKeywordMatches(plain.keywords, jobApplications);
    const applicationSummaries = jobApplications.map((application) => ({
      id: application.id,
      status: application.status,
      submittedAt: application.submittedAt ?? application.createdAt ?? null,
      candidateName:
        [application.applicant?.firstName, application.applicant?.lastName]
          .filter(Boolean)
          .join(' ') || application.applicant?.email,
      interviews: interviewsByApplication.get(application.id) ?? [],
      notes: notesByApplication.get(application.id) ?? [],
      responses: responsesByApplication.get(application.id) ?? [],
    }));
    return {
      ...plain,
      applicants: applicationSummaries,
      history: jobHistory,
      candidateResponses: jobResponsesList,
      candidateNotes: jobNotesList,
      stages: jobStagesList,
      keywordMatches,
    };
  });

  const summary = {
    totalJobs: jobAdvertsPayload.length,
    openJobs: jobAdvertsPayload.filter((advert) => advert.status === 'open').length,
    totalCandidates: applications.length,
    favourites: jobAdvertsPayload.reduce((total, advert) => total + (advert.favorites?.length ?? 0), 0),
    upcomingInterviews: interviewSchedules.filter((schedule) => !schedule.completedAt && new Date(schedule.scheduledAt) >= new Date()).length,
  };

  const candidateList = applications.map((application) => {
    const plain = toPlain(application);
    const applicant = plain.applicant ?? {};
    return {
      id: plain.id,
      jobId: plain.targetId,
      status: plain.status,
      submittedAt: plain.submittedAt ?? plain.createdAt ?? null,
      decisionAt: plain.decisionAt ?? null,
      candidate: {
        id: applicant.id ?? null,
        name: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
        email: applicant.email ?? null,
        headline: applicant.Profile?.headline ?? null,
      },
      notes: notesByApplication.get(plain.id) ?? [],
      interviews: interviewsByApplication.get(plain.id) ?? [],
      responses: responsesByApplication.get(plain.id) ?? [],
    };
  });

  const atsMetrics = buildAtsMetrics(jobStages.map((stage) => toPlain(stage)));

  const payload = {
    meta: {
      lookbackDays: lookback,
      selectedWorkspaceId: workspace.id,
      availableWorkspaces,
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    },
    summary,
    jobAdverts: jobAdvertsPayload,
    applications: candidateList,
    interviews: interviewRecords,
    responses: jobResponses.map((record) => toPlain(record)),
    notes: jobNotes.map((record) => toPlain(record)),
    kanban: buildKanbanColumns(candidateList, jobMap),
    ats: {
      stages: jobStages.map((record) => toPlain(record)),
      metrics: atsMetrics,
    },
    lookups: {
      jobStatuses: JOB_STATUS_OPTIONS,
      remoteTypes: REMOTE_TYPE_OPTIONS,
      applicationStatuses: APPLICATION_STATUS_OPTIONS,
    },
  };

  return payload;
}

export async function createJobPosting({ workspaceId, payload, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  const workspace = await fetchWorkspace({ id: workspaceId });
  const sanitized = sanitizeJobPayload(payload);
  return sequelize.transaction(async (transaction) => {
    const job = await Job.create(sanitized.job, { transaction });
    const advert = await JobAdvert.create(
      {
        ...sanitized.advert,
        jobId: job.id,
        workspaceId: workspace.id,
        metadata: {
          ...(sanitized.advert.metadata ?? {}),
          createdById: actorId ?? null,
        },
      },
      { transaction },
    );
    await JobAdvertHistory.create(
      {
        workspaceId: workspace.id,
        jobId: job.id,
        actorId: actorId ?? null,
        changeType: 'created',
        summary: 'Job advert created',
        payload: {
          status: advert.status,
          openings: advert.openings,
        },
      },
      { transaction },
    );
    return {
      job: toPlain(job),
      advert: toPlain(advert),
    };
  });
}

export async function updateJobPosting({ workspaceId, jobId, payload, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  if (!jobId) {
    throw new ValidationError('jobId is required.');
  }
  const sanitized = sanitizeJobPayload(payload);
  return sequelize.transaction(async (transaction) => {
    const advert = await findJobAdvert(jobId, workspaceId, { transaction });
    await advert.job.update(sanitized.job, { transaction });
    await advert.update(
      {
        ...sanitized.advert,
        metadata: {
          ...(advert.metadata ?? {}),
          ...(sanitized.advert.metadata ?? {}),
          updatedById: actorId ?? null,
        },
      },
      { transaction },
    );
    await JobAdvertHistory.create(
      {
        workspaceId,
        jobId,
        actorId: actorId ?? null,
        changeType: 'updated',
        summary: 'Job advert updated',
        payload: sanitized,
      },
      { transaction },
    );
    return {
      job: toPlain(advert.job),
      advert: toPlain(advert),
    };
  });
}

export async function updateJobKeywords({ workspaceId, jobId, keywords, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  if (!jobId) {
    throw new ValidationError('jobId is required.');
  }
  const sanitized = sanitizeKeywords(keywords);
  return sequelize.transaction(async (transaction) => {
    await findJobAdvert(jobId, workspaceId, { transaction });
    await JobKeyword.destroy({ where: { jobId }, transaction });
    if (sanitized.length) {
      await JobKeyword.bulkCreate(
        sanitized.map((entry) => ({ jobId, keyword: entry.keyword, weight: entry.weight })),
        { transaction },
      );
    }
    await JobAdvertHistory.create(
      {
        workspaceId,
        jobId,
        actorId: actorId ?? null,
        changeType: 'keywords_updated',
        summary: 'Job keywords updated',
        payload: { keywords: sanitized },
      },
      { transaction },
    );
    return sanitized;
  });
}

export async function createJobFavorite({ workspaceId, jobId, userId, notes, actorId }) {
  if (!workspaceId || !jobId) {
    throw new ValidationError('workspaceId and jobId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const [favorite] = await JobFavorite.findOrCreate({
    where: { workspaceId, jobId, userId: userId ?? null },
    defaults: {
      workspaceId,
      jobId,
      userId: userId ?? null,
      notes: notes ? `${notes}`.trim() : null,
      createdById: actorId ?? null,
    },
  });
  return toPlain(favorite);
}

export async function removeJobFavorite({ workspaceId, jobId, favoriteId }) {
  if (!workspaceId || !jobId || !favoriteId) {
    throw new ValidationError('workspaceId, jobId, and favoriteId are required.');
  }
  const favorite = await JobFavorite.findOne({
    where: { id: favoriteId, workspaceId, jobId },
  });
  if (!favorite) {
    throw new NotFoundError('Favorite not found.');
  }
  await favorite.destroy();
  return { success: true };
}

export async function createJobApplication({ workspaceId, jobId, applicantId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicantId) {
    throw new ValidationError('workspaceId, jobId, and applicantId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const application = await Application.create({
    applicantId,
    targetType: 'job',
    targetId: jobId,
    status: APPLICATION_STATUSES.includes(payload.status) ? payload.status : 'submitted',
    sourceChannel: payload.sourceChannel && `${payload.sourceChannel}`.trim().length ? `${payload.sourceChannel}`.trim() : 'web',
    coverLetter: payload.coverLetter ? `${payload.coverLetter}`.trim() : null,
    attachments: Array.isArray(payload.attachments) ? payload.attachments.slice(0, 10) : null,
    rateExpectation: payload.rateExpectation != null ? Number(payload.rateExpectation) : null,
    currencyCode: payload.currencyCode ? `${payload.currencyCode}`.trim().toUpperCase().slice(0, 3) : null,
    availabilityDate: payload.availabilityDate ? new Date(payload.availabilityDate) : null,
    submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      workspaceId,
      createdById: actorId ?? null,
    },
  });
  return toPlain(application);
}

export async function updateJobApplication({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const application = await Application.findOne({
    where: { id: applicationId, targetType: 'job', targetId: jobId },
  });
  if (!application) {
    throw new NotFoundError('Application not found.');
  }
  const updates = {};
  if (payload.status && APPLICATION_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.decisionAt) {
    updates.decisionAt = new Date(payload.decisionAt);
  }
  if (payload.coverLetter != null) {
    updates.coverLetter = `${payload.coverLetter}`.trim();
  }
  if (payload.rateExpectation != null) {
    updates.rateExpectation = Number(payload.rateExpectation);
  }
  if (payload.currencyCode != null) {
    updates.currencyCode = `${payload.currencyCode}`.trim().toUpperCase().slice(0, 3);
  }
  if (payload.availabilityDate) {
    updates.availabilityDate = new Date(payload.availabilityDate);
  }
  updates.metadata = {
    ...(application.metadata ?? {}),
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    updatedById: actorId ?? null,
  };
  await application.update(updates);
  await JobAdvertHistory.create({
    workspaceId,
    jobId,
    actorId: actorId ?? null,
    changeType: 'application_updated',
    summary: 'Application updated',
    payload: { applicationId, updates },
  });
  return toPlain(application);
}

export async function scheduleInterview({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const interview = await InterviewSchedule.create({
    workspaceId,
    applicationId,
    interviewStage: payload.interviewStage ? `${payload.interviewStage}`.trim().slice(0, 120) : 'Interview',
    scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : new Date(),
    durationMinutes: payload.durationMinutes != null ? Number(payload.durationMinutes) : null,
    rescheduleCount: payload.rescheduleCount != null ? Number(payload.rescheduleCount) : 0,
    interviewerRoster: Array.isArray(payload.interviewerRoster) ? payload.interviewerRoster.slice(0, 10) : null,
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      createdById: actorId ?? null,
      jobId,
    },
  });
  return toPlain(interview);
}

export async function updateInterview({ workspaceId, jobId, interviewId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !interviewId) {
    throw new ValidationError('workspaceId, jobId, and interviewId are required.');
  }
  const interview = await InterviewSchedule.findOne({
    where: { id: interviewId, workspaceId },
  });
  if (!interview) {
    throw new NotFoundError('Interview schedule not found.');
  }
  const updates = {};
  if (payload.interviewStage) {
    updates.interviewStage = `${payload.interviewStage}`.trim().slice(0, 120);
  }
  if (payload.scheduledAt) {
    updates.scheduledAt = new Date(payload.scheduledAt);
  }
  if (payload.completedAt) {
    updates.completedAt = new Date(payload.completedAt);
  }
  if (payload.durationMinutes != null) {
    updates.durationMinutes = Number(payload.durationMinutes);
  }
  if (payload.rescheduleCount != null) {
    updates.rescheduleCount = Number(payload.rescheduleCount);
  }
  if (payload.interviewerRoster) {
    updates.interviewerRoster = Array.isArray(payload.interviewerRoster) ? payload.interviewerRoster.slice(0, 10) : null;
  }
  updates.metadata = {
    ...(interview.metadata ?? {}),
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    updatedById: actorId ?? null,
  };
  await interview.update(updates);
  return toPlain(interview);
}

export async function recordCandidateResponse({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId) {
    throw new ValidationError('workspaceId and jobId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const sanitized = sanitizeResponsePayload(payload);
  const response = await JobCandidateResponse.create({
    workspaceId,
    jobId,
    applicationId: applicationId ?? null,
    respondentId: sanitized.respondentId ?? actorId ?? null,
    respondentName: sanitized.respondentName ?? null,
    channel: sanitized.channel,
    direction: sanitized.direction,
    message: sanitized.message,
    sentAt: sanitized.sentAt,
    metadata: sanitized.metadata,
  });
  return toPlain(response);
}

export async function addCandidateNote({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const sanitized = sanitizeNotePayload(payload);
  const note = await JobCandidateNote.create({
    workspaceId,
    jobId,
    applicationId,
    authorId: actorId ?? null,
    stage: sanitized.stage,
    sentiment: sanitized.sentiment,
    summary: sanitized.summary,
    nextSteps: sanitized.nextSteps,
    attachments: sanitized.attachments,
  });
  return toPlain(note);
}

export async function updateCandidateNote({ workspaceId, jobId, noteId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !noteId) {
    throw new ValidationError('workspaceId, jobId, and noteId are required.');
  }
  const note = await JobCandidateNote.findOne({
    where: { id: noteId, workspaceId, jobId },
  });
  if (!note) {
    throw new NotFoundError('Candidate note not found.');
  }
  const sanitized = sanitizeNotePayload(payload);
  await note.update({
    ...sanitized,
    authorId: note.authorId ?? actorId ?? null,
  });
  return toPlain(note);
}

export default {
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
};
