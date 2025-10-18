import { Op } from 'sequelize';
import {
  Application,
  ApplicationReview,
  Job,
  User,
  JobApplicationFavourite,
  JobApplicationInterview,
  JobApplicationResponse,
  JOB_APPLICATION_FAVOURITE_PRIORITIES,
  JOB_APPLICATION_RESPONSE_CHANNELS,
  JOB_APPLICATION_RESPONSE_DIRECTIONS,
  JOB_APPLICATION_RESPONSE_STATUSES,
  JOB_INTERVIEW_STATUSES,
  JOB_INTERVIEW_TYPES,
  APPLICATION_STATUSES,
} from '../models/index.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const TERMINAL_STATUSES = new Set(['withdrawn', 'rejected', 'hired']);
const OFFER_STATUSES = new Set(['offered', 'hired']);

function normalisePositiveInteger(value, fieldName) {
  if (value == null) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function normaliseOptionalPositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('Expected a positive integer value.');
  }
  return parsed;
}

function coerceDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date value supplied.');
  }
  return date;
}

function coerceNumber(value, { allowNull = true } = {}) {
  if (value == null || value === '') {
    return allowNull ? null : 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError('Invalid numeric value supplied.');
  }
  return parsed;
}

function sanitiseTags(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? null : `${item}`.trim()))
      .filter((item) => item && item.length <= 64);
  }
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 64);
}

function toCurrencyCode(value) {
  if (!value) return null;
  const trimmed = `${value}`.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    throw new ValidationError('currencyCode must be an ISO 4217 currency code.');
  }
  return trimmed;
}

function ensureStatus(value) {
  if (!value) {
    return 'submitted';
  }
  const normalised = `${value}`.toLowerCase();
  if (!APPLICATION_STATUSES.includes(normalised)) {
    throw new ValidationError('Invalid application status supplied.');
  }
  return normalised;
}

function ensureInterviewType(value) {
  if (!value) {
    return 'phone';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_INTERVIEW_TYPES.includes(normalised)) {
    throw new ValidationError('Invalid interview type supplied.');
  }
  return normalised;
}

function ensureInterviewStatus(value) {
  if (!value) {
    return 'scheduled';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_INTERVIEW_STATUSES.includes(normalised)) {
    throw new ValidationError('Invalid interview status supplied.');
  }
  return normalised;
}

function ensureFavouritePriority(value) {
  if (!value) {
    return 'watching';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_APPLICATION_FAVOURITE_PRIORITIES.includes(normalised)) {
    throw new ValidationError('Invalid favourite priority supplied.');
  }
  return normalised;
}

function ensureResponseDirection(value) {
  if (!value) {
    return 'incoming';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_APPLICATION_RESPONSE_DIRECTIONS.includes(normalised)) {
    throw new ValidationError('Invalid response direction supplied.');
  }
  return normalised;
}

function ensureResponseChannel(value) {
  if (!value) {
    return 'email';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_APPLICATION_RESPONSE_CHANNELS.includes(normalised)) {
    throw new ValidationError('Invalid response channel supplied.');
  }
  return normalised;
}

function ensureResponseStatus(value) {
  if (!value) {
    return 'pending';
  }
  const normalised = `${value}`.toLowerCase();
  if (!JOB_APPLICATION_RESPONSE_STATUSES.includes(normalised)) {
    throw new ValidationError('Invalid response status supplied.');
  }
  return normalised;
}

function hydrateMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return { ...metadata };
}

function extractApplicationDetail(application) {
  const base = application.toPublicObject();
  const metadata = hydrateMetadata(base.metadata);
  const jobInstance = application.get?.('jobTarget') ?? null;
  const job = jobInstance?.toPublicObject?.() ?? null;
  const tags = sanitiseTags(metadata.tags ?? metadata.tagList ?? []);
  const salaryMin = metadata.salary?.min ?? metadata.salaryMin ?? base.rateExpectation ?? null;
  const salaryMax = metadata.salary?.max ?? metadata.salaryMax ?? null;
  const currencyCode = metadata.salary?.currency ?? metadata.currencyCode ?? base.currencyCode ?? null;
  const source = metadata.source ?? base.sourceChannel ?? null;

  return {
    id: base.id,
    applicantId: base.applicantId,
    status: base.status,
    statusLabel: base.status.replace(/_/g, ' '),
    submittedAt: base.submittedAt ?? base.createdAt,
    updatedAt: base.updatedAt,
    coverLetter: base.coverLetter ?? null,
    sourceChannel: base.sourceChannel,
    isArchived: base.isArchived,
    metadata,
    target: job
      ? {
          id: job.id,
          title: job.title,
          location: job.location ?? metadata.location ?? null,
          employer: job.companyName ?? metadata.companyName ?? null,
        }
      : null,
    detail: {
      title: metadata.jobTitle ?? job?.title ?? 'Opportunity',
      companyName: metadata.companyName ?? job?.companyName ?? null,
      location: metadata.location ?? job?.location ?? null,
      jobUrl: metadata.jobUrl ?? null,
      salary: {
        min: salaryMin == null ? null : Number(salaryMin),
        max: salaryMax == null ? null : Number(salaryMax),
        currency: currencyCode ?? null,
      },
      availabilityDate: base.availabilityDate ?? null,
      tags,
      notes: metadata.notes ?? null,
      source,
      jobRecordCreatedByUser: Boolean(metadata.jobRecordCreatedByUser),
      jobRecordId: metadata.jobRecordId ?? base.targetId ?? null,
    },
    reviews: Array.isArray(application.reviews)
      ? application.reviews.map((review) => {
          const plain = review.toPublicObject();
          const reviewer = review.get?.('reviewer') ?? null;
          return {
            ...plain,
            reviewer: reviewer?.toPublicObject?.() ?? reviewer?.get?.({ plain: true }) ?? null,
          };
        })
      : [],
  };
}

function serialiseFavourite(favourite) {
  return favourite.toPublicObject();
}

function serialiseInterview(interview) {
  return interview.toPublicObject();
}

function serialiseResponse(response) {
  return response.toPublicObject();
}

function computeSummary(applications, interviews, favourites, responses) {
  const totals = {
    totalApplications: applications.length,
    activeApplications: applications.filter((app) => !TERMINAL_STATUSES.has(app.status)).length,
    interviewsScheduled: interviews.filter((interview) => interview.status === 'scheduled').length,
    interviewsCompleted: interviews.filter((interview) => interview.status === 'completed').length,
    offersInPlay: applications.filter((app) => OFFER_STATUSES.has(app.status)).length,
    favourites: favourites.length,
    pendingResponses: responses.filter(
      (response) =>
        response.direction === 'incoming' &&
        (response.status === 'pending' || response.status === 'needs_follow_up'),
    ).length,
  };

  const turnaroundDurations = responses
    .filter((response) => response.sentAt && response.followUpRequiredAt)
    .map((response) => {
      const sent = new Date(response.sentAt).getTime();
      const due = new Date(response.followUpRequiredAt).getTime();
      return due - sent;
    })
    .filter((duration) => Number.isFinite(duration) && duration > 0);

  totals.averageResponseTurnaroundHours = turnaroundDurations.length
    ? Number((turnaroundDurations.reduce((sum, value) => sum + value, 0) / turnaroundDurations.length / 3600000).toFixed(2))
    : null;

  const latestUpdate = applications.reduce((latest, app) => {
    const updatedAt = app.updatedAt ? new Date(app.updatedAt).getTime() : null;
    return updatedAt && (!latest || updatedAt > latest) ? updatedAt : latest;
  }, null);

  totals.lastUpdatedAt = latestUpdate ? new Date(latestUpdate).toISOString() : null;

  return totals;
}

function buildStatusBreakdown(applications) {
  const counts = new Map();
  applications.forEach((application) => {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([status, count]) => ({
    status,
    label: status.replace(/_/g, ' '),
    count,
  }));
}

function buildRecommendedActions(summary) {
  const actions = [];
  if (summary.pendingResponses > 0) {
    actions.push({
      title: 'Follow up on pending employer responses',
      description: `You have ${summary.pendingResponses} response${summary.pendingResponses > 1 ? 's' : ''} awaiting action. Draft replies or schedule reminders to keep momentum.`,
      severity: 'high',
    });
  }
  if (summary.interviewsScheduled > 0 && summary.interviewsScheduled > summary.interviewsCompleted) {
    actions.push({
      title: 'Review upcoming interview prep tasks',
      description: 'Confirm run sheets, interviewer research, and logistics for scheduled interviews to avoid last-minute surprises.',
      severity: 'medium',
    });
  }
  if (summary.favourites > summary.totalApplications) {
    actions.push({
      title: 'Promote saved roles into the active pipeline',
      description: 'Move promising favourites into active applications to maintain a healthy top-of-funnel.',
      severity: 'low',
    });
  }
  return actions;
}

async function ensureCanActOnApplication(ownerId, application, actorId) {
  if (!application) {
    throw new NotFoundError('Application not found.');
  }
  if (application.applicantId !== ownerId) {
    throw new AuthorizationError('You can only manage your own job applications.');
  }
  if (actorId && actorId !== ownerId) {
    throw new AuthorizationError('You do not have permission to modify this job application.');
  }
}

async function loadApplicationForOwner(ownerId, applicationId) {
  const application = await Application.findByPk(applicationId, {
    include: [
      {
        model: ApplicationReview,
        as: 'reviews',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      { model: Job, as: 'jobTarget' },
    ],
  });
  if (!application) {
    throw new NotFoundError('Application not found.');
  }
  if (application.applicantId !== ownerId) {
    throw new AuthorizationError('You can only access your own job applications.');
  }
  return application;
}

async function ensureJobRecord(jobId, { title, description, location }) {
  if (jobId) {
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new ValidationError('Provided job target does not exist.');
    }
    return job;
  }
  const fallbackDescription = description?.trim() || `User submitted opportunity for ${title ?? 'role'}`;
  return Job.create({
    title,
    description: fallbackDescription,
    location: location ?? null,
  });
}

function mergeMetadata(existingMetadata, updates) {
  const metadata = hydrateMetadata(existingMetadata);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    metadata[key] = value;
  });
  return metadata;
}

export async function getJobApplicationWorkspace(ownerId, { actorId = null, limit = 40 } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  if (actorId && Number(actorId) !== userId) {
    throw new AuthorizationError('You can only view your own job application workspace.');
  }

  const applications = await Application.findAll({
    where: { applicantId: userId, isArchived: false },
    include: [
      {
        model: ApplicationReview,
        as: 'reviews',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      { model: Job, as: 'jobTarget' },
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: Math.min(Math.max(limit, 1), 80),
  });

  const applicationIds = applications.map((application) => application.id);

  const [favourites, interviews, responses] = await Promise.all([
    JobApplicationFavourite.findAll({
      where: { userId },
      order: [
        ['priority', 'ASC'],
        ['savedAt', 'DESC'],
      ],
    }),
    applicationIds.length
      ? JobApplicationInterview.findAll({
          where: { userId, applicationId: { [Op.in]: applicationIds } },
          order: [
            ['scheduledAt', 'ASC'],
            ['id', 'ASC'],
          ],
        })
      : [],
    applicationIds.length
      ? JobApplicationResponse.findAll({
          where: { userId, applicationId: { [Op.in]: applicationIds } },
          order: [
            ['sentAt', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        })
      : [],
  ]);

  const applicationPayload = applications.map((application) => extractApplicationDetail(application));
  const favouritePayload = favourites.map((favourite) => serialiseFavourite(favourite));
  const interviewPayload = interviews.map((interview) => serialiseInterview(interview));
  const responsePayload = responses.map((response) => serialiseResponse(response));

  const summary = computeSummary(applicationPayload, interviewPayload, favouritePayload, responsePayload);
  const statusBreakdown = buildStatusBreakdown(applicationPayload);
  const recommendedActions = buildRecommendedActions(summary);

  return {
    summary,
    statusBreakdown,
    applications: applicationPayload,
    favourites: favouritePayload,
    interviews: interviewPayload,
    responses: responsePayload,
    recommendedActions,
    formOptions: {
      statuses: APPLICATION_STATUSES,
      interviewTypes: JOB_INTERVIEW_TYPES,
      interviewStatuses: JOB_INTERVIEW_STATUSES,
      favouritePriorities: JOB_APPLICATION_FAVOURITE_PRIORITIES,
      responseDirections: JOB_APPLICATION_RESPONSE_DIRECTIONS,
      responseChannels: JOB_APPLICATION_RESPONSE_CHANNELS,
      responseStatuses: JOB_APPLICATION_RESPONSE_STATUSES,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function createJobApplication(ownerId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You can only create job applications for your own workspace.');
  }

  const jobTitle = `${payload.jobTitle ?? ''}`.trim();
  if (!jobTitle) {
    throw new ValidationError('jobTitle is required.');
  }
  const companyName = payload.companyName ? `${payload.companyName}`.trim() : null;
  const jobLocation = payload.location ? `${payload.location}`.trim() : null;
  const description = payload.jobDescription ? `${payload.jobDescription}`.trim() : null;

  const jobRecord = await ensureJobRecord(normaliseOptionalPositiveInteger(payload.jobId ?? payload.targetId), {
    title: jobTitle,
    description,
    location: jobLocation,
  });

  const submittedAt = payload.submittedAt ? coerceDate(payload.submittedAt) : new Date();
  const status = ensureStatus(payload.status);
  const sourceChannel = payload.sourceChannel ? `${payload.sourceChannel}`.trim().toLowerCase() : 'web';
  const salaryMin = coerceNumber(payload.salaryMin ?? payload.salary?.min ?? null);
  const salaryMax = coerceNumber(payload.salaryMax ?? payload.salary?.max ?? null);
  const currencyCode = payload.currencyCode
    ? toCurrencyCode(payload.currencyCode)
    : payload.salary?.currency
    ? toCurrencyCode(payload.salary.currency)
    : null;

  const metadata = mergeMetadata(payload.metadata, {
    jobTitle,
    companyName,
    location: jobLocation,
    jobUrl: payload.jobUrl ? `${payload.jobUrl}`.trim() : null,
    salary: {
      min: salaryMin,
      max: salaryMax,
      currency: currencyCode,
    },
    notes: payload.notes ? `${payload.notes}`.trim() : null,
    source: payload.source ?? sourceChannel,
    tags: sanitiseTags(payload.tags),
    jobRecordCreatedByUser: !payload.jobId && !payload.targetId,
    jobRecordId: jobRecord.id,
  });

  const application = await Application.create({
    applicantId: userId,
    targetType: 'job',
    targetId: jobRecord.id,
    status,
    sourceChannel,
    coverLetter: payload.coverLetter ?? null,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : null,
    rateExpectation: payload.rateExpectation ? coerceNumber(payload.rateExpectation) : null,
    currencyCode,
    availabilityDate: payload.availabilityDate ? coerceDate(payload.availabilityDate) : null,
    submittedAt,
    metadata,
  });

  const reloaded = await loadApplicationForOwner(userId, application.id);
  return extractApplicationDetail(reloaded);
}

export async function updateJobApplication(ownerId, applicationId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const application = await loadApplicationForOwner(userId, normalisePositiveInteger(applicationId, 'applicationId'));
  await ensureCanActOnApplication(userId, application, actorId ?? userId);

  if (payload.status) {
    application.status = ensureStatus(payload.status);
  }
  if (payload.sourceChannel) {
    application.sourceChannel = `${payload.sourceChannel}`.trim().toLowerCase();
  }
  if (payload.coverLetter !== undefined) {
    application.coverLetter = payload.coverLetter ?? null;
  }
  if (payload.rateExpectation !== undefined) {
    application.rateExpectation = payload.rateExpectation == null ? null : coerceNumber(payload.rateExpectation);
  }
  if (payload.currencyCode !== undefined) {
    application.currencyCode = payload.currencyCode ? toCurrencyCode(payload.currencyCode) : null;
  }
  if (payload.availabilityDate !== undefined) {
    application.availabilityDate = payload.availabilityDate ? coerceDate(payload.availabilityDate) : null;
  }
  if (payload.submittedAt) {
    application.submittedAt = coerceDate(payload.submittedAt);
  }

  const existingMetadata = hydrateMetadata(application.metadata);
  const updatedMetadata = mergeMetadata(existingMetadata, {
    jobTitle:
      payload.jobTitle !== undefined
        ? ((`${payload.jobTitle}`.trim() || existingMetadata.jobTitle) ?? null)
        : undefined,
    companyName: payload.companyName !== undefined ? `${payload.companyName}`.trim() || null : undefined,
    location: payload.location !== undefined ? `${payload.location}`.trim() || null : undefined,
    jobUrl: payload.jobUrl !== undefined ? `${payload.jobUrl}`.trim() || null : undefined,
    salary: payload.salary || existingMetadata.salary,
    salaryMin: payload.salaryMin !== undefined ? coerceNumber(payload.salaryMin) : existingMetadata.salaryMin,
    salaryMax: payload.salaryMax !== undefined ? coerceNumber(payload.salaryMax) : existingMetadata.salaryMax,
    currencyCode:
      payload.currencyCode !== undefined
        ? payload.currencyCode
          ? toCurrencyCode(payload.currencyCode)
          : null
        : existingMetadata.currencyCode,
    notes: payload.notes !== undefined ? `${payload.notes ?? ''}`.trim() || null : undefined,
    source: payload.source !== undefined ? `${payload.source ?? ''}`.trim() || null : existingMetadata.source,
    tags: payload.tags !== undefined ? sanitiseTags(payload.tags) : existingMetadata.tags,
  });
  application.metadata = updatedMetadata;

  const jobRecordId = updatedMetadata.jobRecordId ?? application.targetId;
  if (jobRecordId && updatedMetadata.jobRecordCreatedByUser) {
    const job = await Job.findByPk(jobRecordId);
    if (job) {
      if (payload.jobTitle) {
        job.title = `${payload.jobTitle}`.trim();
      }
      if (payload.location !== undefined) {
        job.location = payload.location ? `${payload.location}`.trim() : null;
      }
      if (payload.jobDescription) {
        job.description = `${payload.jobDescription}`.trim();
      }
      await job.save();
    }
  }

  await application.save();
  const reloaded = await loadApplicationForOwner(userId, application.id);
  return extractApplicationDetail(reloaded);
}

export async function archiveJobApplication(ownerId, applicationId, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const application = await loadApplicationForOwner(userId, normalisePositiveInteger(applicationId, 'applicationId'));
  await ensureCanActOnApplication(userId, application, actorId ?? userId);

  application.isArchived = true;
  if (!TERMINAL_STATUSES.has(application.status)) {
    application.status = 'withdrawn';
  }
  await application.save();
  return { success: true };
}

export async function createJobApplicationInterview(ownerId, applicationId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const application = await loadApplicationForOwner(userId, normalisePositiveInteger(applicationId, 'applicationId'));
  await ensureCanActOnApplication(userId, application, actorId ?? userId);

  const interview = await JobApplicationInterview.create({
    userId,
    applicationId: application.id,
    scheduledAt: coerceDate(payload.scheduledAt || new Date()),
    timezone: payload.timezone ? `${payload.timezone}`.trim() : null,
    type: ensureInterviewType(payload.type),
    status: ensureInterviewStatus(payload.status),
    interviewerName: payload.interviewerName ? `${payload.interviewerName}`.trim() : null,
    interviewerEmail: payload.interviewerEmail ? `${payload.interviewerEmail}`.trim() : null,
    location: payload.location ? `${payload.location}`.trim() : null,
    meetingUrl: payload.meetingUrl ? `${payload.meetingUrl}`.trim() : null,
    durationMinutes: payload.durationMinutes == null ? null : coerceNumber(payload.durationMinutes),
    feedbackScore: payload.feedbackScore == null ? null : coerceNumber(payload.feedbackScore),
    notes: payload.notes ? `${payload.notes}`.trim() : null,
    metadata: payload.metadata ?? null,
  });

  return serialiseInterview(interview);
}

export async function updateJobApplicationInterview(ownerId, applicationId, interviewId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const resolvedApplicationId = normalisePositiveInteger(applicationId, 'applicationId');
  await loadApplicationForOwner(userId, resolvedApplicationId);
  const interview = await JobApplicationInterview.findOne({
    where: {
      id: normalisePositiveInteger(interviewId, 'interviewId'),
      userId,
      applicationId: resolvedApplicationId,
    },
  });
  if (!interview) {
    throw new NotFoundError('Interview not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this interview.');
  }

  if (payload.scheduledAt !== undefined) {
    interview.scheduledAt = coerceDate(payload.scheduledAt);
  }
  if (payload.timezone !== undefined) {
    interview.timezone = payload.timezone ? `${payload.timezone}`.trim() : null;
  }
  if (payload.type !== undefined) {
    interview.type = ensureInterviewType(payload.type);
  }
  if (payload.status !== undefined) {
    interview.status = ensureInterviewStatus(payload.status);
  }
  if (payload.interviewerName !== undefined) {
    interview.interviewerName = payload.interviewerName ? `${payload.interviewerName}`.trim() : null;
  }
  if (payload.interviewerEmail !== undefined) {
    interview.interviewerEmail = payload.interviewerEmail ? `${payload.interviewerEmail}`.trim() : null;
  }
  if (payload.location !== undefined) {
    interview.location = payload.location ? `${payload.location}`.trim() : null;
  }
  if (payload.meetingUrl !== undefined) {
    interview.meetingUrl = payload.meetingUrl ? `${payload.meetingUrl}`.trim() : null;
  }
  if (payload.durationMinutes !== undefined) {
    interview.durationMinutes = payload.durationMinutes == null ? null : coerceNumber(payload.durationMinutes);
  }
  if (payload.feedbackScore !== undefined) {
    interview.feedbackScore = payload.feedbackScore == null ? null : coerceNumber(payload.feedbackScore);
  }
  if (payload.notes !== undefined) {
    interview.notes = payload.notes ? `${payload.notes}`.trim() : null;
  }
  if (payload.metadata !== undefined) {
    interview.metadata = payload.metadata ?? null;
  }

  await interview.save();
  return serialiseInterview(interview);
}

export async function deleteJobApplicationInterview(ownerId, applicationId, interviewId, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const resolvedApplicationId = normalisePositiveInteger(applicationId, 'applicationId');
  await loadApplicationForOwner(userId, resolvedApplicationId);
  const interview = await JobApplicationInterview.findOne({
    where: {
      id: normalisePositiveInteger(interviewId, 'interviewId'),
      userId,
      applicationId: resolvedApplicationId,
    },
  });
  if (!interview) {
    throw new NotFoundError('Interview not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this interview.');
  }
  await interview.destroy();
  return { success: true };
}

export async function createJobApplicationFavourite(ownerId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You can only create favourites for your own workspace.');
  }
  const title = `${payload.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('title is required.');
  }

  const favourite = await JobApplicationFavourite.create({
    userId,
    jobId: normaliseOptionalPositiveInteger(payload.jobId),
    title,
    companyName: payload.companyName ? `${payload.companyName}`.trim() : null,
    location: payload.location ? `${payload.location}`.trim() : null,
    priority: ensureFavouritePriority(payload.priority),
    tags: sanitiseTags(payload.tags),
    salaryMin: payload.salaryMin == null ? null : coerceNumber(payload.salaryMin),
    salaryMax: payload.salaryMax == null ? null : coerceNumber(payload.salaryMax),
    currencyCode: payload.currencyCode ? toCurrencyCode(payload.currencyCode) : null,
    sourceUrl: payload.sourceUrl ? `${payload.sourceUrl}`.trim() : null,
    notes: payload.notes ? `${payload.notes}`.trim() : null,
    savedAt: payload.savedAt ? coerceDate(payload.savedAt) : new Date(),
    metadata: payload.metadata ?? null,
  });
  return serialiseFavourite(favourite);
}

export async function updateJobApplicationFavourite(ownerId, favouriteId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const favourite = await JobApplicationFavourite.findOne({
    where: { id: normalisePositiveInteger(favouriteId, 'favouriteId'), userId },
  });
  if (!favourite) {
    throw new NotFoundError('Favourite job not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this favourite.');
  }

  if (payload.title !== undefined) {
    favourite.title = `${payload.title}`.trim();
  }
  if (payload.companyName !== undefined) {
    favourite.companyName = payload.companyName ? `${payload.companyName}`.trim() : null;
  }
  if (payload.location !== undefined) {
    favourite.location = payload.location ? `${payload.location}`.trim() : null;
  }
  if (payload.priority !== undefined) {
    favourite.priority = ensureFavouritePriority(payload.priority);
  }
  if (payload.tags !== undefined) {
    favourite.tags = sanitiseTags(payload.tags);
  }
  if (payload.salaryMin !== undefined) {
    favourite.salaryMin = payload.salaryMin == null ? null : coerceNumber(payload.salaryMin);
  }
  if (payload.salaryMax !== undefined) {
    favourite.salaryMax = payload.salaryMax == null ? null : coerceNumber(payload.salaryMax);
  }
  if (payload.currencyCode !== undefined) {
    favourite.currencyCode = payload.currencyCode ? toCurrencyCode(payload.currencyCode) : null;
  }
  if (payload.sourceUrl !== undefined) {
    favourite.sourceUrl = payload.sourceUrl ? `${payload.sourceUrl}`.trim() : null;
  }
  if (payload.notes !== undefined) {
    favourite.notes = payload.notes ? `${payload.notes}`.trim() : null;
  }
  if (payload.savedAt !== undefined) {
    favourite.savedAt = payload.savedAt ? coerceDate(payload.savedAt) : new Date();
  }
  if (payload.jobId !== undefined) {
    favourite.jobId = payload.jobId ? normalisePositiveInteger(payload.jobId, 'jobId') : null;
  }
  if (payload.metadata !== undefined) {
    favourite.metadata = payload.metadata ?? null;
  }

  await favourite.save();
  return serialiseFavourite(favourite);
}

export async function deleteJobApplicationFavourite(ownerId, favouriteId, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const favourite = await JobApplicationFavourite.findOne({
    where: { id: normalisePositiveInteger(favouriteId, 'favouriteId'), userId },
  });
  if (!favourite) {
    throw new NotFoundError('Favourite job not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this favourite.');
  }
  await favourite.destroy();
  return { success: true };
}

export async function createJobApplicationResponse(ownerId, applicationId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const resolvedApplicationId = normalisePositiveInteger(applicationId, 'applicationId');
  await loadApplicationForOwner(userId, resolvedApplicationId);
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to create responses for this application.');
  }

  const response = await JobApplicationResponse.create({
    userId,
    applicationId: resolvedApplicationId,
    direction: ensureResponseDirection(payload.direction),
    channel: ensureResponseChannel(payload.channel),
    status: ensureResponseStatus(payload.status),
    subject: payload.subject ? `${payload.subject}`.trim() : null,
    body: payload.body ? `${payload.body}`.trim() : null,
    sentAt: payload.sentAt ? coerceDate(payload.sentAt) : new Date(),
    followUpRequiredAt: payload.followUpRequiredAt ? coerceDate(payload.followUpRequiredAt) : null,
    metadata: payload.metadata ?? null,
  });
  return serialiseResponse(response);
}

export async function updateJobApplicationResponse(ownerId, applicationId, responseId, payload = {}, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const resolvedApplicationId = normalisePositiveInteger(applicationId, 'applicationId');
  await loadApplicationForOwner(userId, resolvedApplicationId);
  const response = await JobApplicationResponse.findOne({
    where: {
      id: normalisePositiveInteger(responseId, 'responseId'),
      userId,
      applicationId: resolvedApplicationId,
    },
  });
  if (!response) {
    throw new NotFoundError('Response not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this response.');
  }

  if (payload.direction !== undefined) {
    response.direction = ensureResponseDirection(payload.direction);
  }
  if (payload.channel !== undefined) {
    response.channel = ensureResponseChannel(payload.channel);
  }
  if (payload.status !== undefined) {
    response.status = ensureResponseStatus(payload.status);
  }
  if (payload.subject !== undefined) {
    response.subject = payload.subject ? `${payload.subject}`.trim() : null;
  }
  if (payload.body !== undefined) {
    response.body = payload.body ? `${payload.body}`.trim() : null;
  }
  if (payload.sentAt !== undefined) {
    response.sentAt = payload.sentAt ? coerceDate(payload.sentAt) : null;
  }
  if (payload.followUpRequiredAt !== undefined) {
    response.followUpRequiredAt = payload.followUpRequiredAt ? coerceDate(payload.followUpRequiredAt) : null;
  }
  if (payload.metadata !== undefined) {
    response.metadata = payload.metadata ?? null;
  }

  await response.save();
  return serialiseResponse(response);
}

export async function deleteJobApplicationResponse(ownerId, applicationId, responseId, { actorId = null } = {}) {
  const userId = normalisePositiveInteger(ownerId, 'ownerId');
  const resolvedApplicationId = normalisePositiveInteger(applicationId, 'applicationId');
  await loadApplicationForOwner(userId, resolvedApplicationId);
  const response = await JobApplicationResponse.findOne({
    where: {
      id: normalisePositiveInteger(responseId, 'responseId'),
      userId,
      applicationId: resolvedApplicationId,
    },
  });
  if (!response) {
    throw new NotFoundError('Response not found.');
  }
  if (actorId && actorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this response.');
  }
  await response.destroy();
  return { success: true };
}

export default {
  getJobApplicationWorkspace,
  createJobApplication,
  updateJobApplication,
  archiveJobApplication,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationFavourite,
  updateJobApplicationFavourite,
  deleteJobApplicationFavourite,
  createJobApplicationResponse,
  updateJobApplicationResponse,
  deleteJobApplicationResponse,
};
