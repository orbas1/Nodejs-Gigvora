import {
  VolunteeringPost,
  VolunteeringApplication,
  VolunteeringApplicationResponse,
  VolunteeringContract,
  VolunteeringContractSpend,
  VolunteeringInterview,
  VOLUNTEERING_POST_STATUSES,
  VOLUNTEERING_APPLICATION_STATUSES,
  VOLUNTEERING_RESPONSE_TYPES,
  VOLUNTEERING_INTERVIEW_STATUSES,
  VOLUNTEERING_CONTRACT_STATUSES,
  VOLUNTEERING_CONTRACT_TYPES,
} from '../models/volunteeringModels.js';
import {
  sequelize,
  VolunteerApplication,
  VolunteerResponse,
  VolunteerContract,
  VolunteerContractSpend,
  VolunteerContractReview,
  Volunteering,
  ProviderWorkspace,
  User,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'volunteering:management';
const DASHBOARD_CACHE_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const APPLICATION_ACTIVE_STATUSES = new Set([
  'draft',
  'submitted',
  'in_review',
  'interview',
  'offered',
  'accepted',
]);

const CONTRACT_OPEN_STATUSES = new Set(['draft', 'awaiting_signature', 'active', 'on_hold']);
const CONTRACT_FINISHED_STATUSES = new Set(['completed', 'cancelled']);

function normalizeStringArray(input) {
  if (input == null) {
    return null;
  }
  const values = Array.isArray(input) ? input : [input];
  const cleaned = values
    .map((value) => `${value}`.trim())
    .filter((value) => value.length > 0)
    .slice(0, 50);
  return cleaned.length ? cleaned : null;
}

function normalizeJson(input) {
  if (input == null) {
    return null;
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  if (typeof input === 'object') {
    return input;
  }
  return null;
}

function normalizeNumber(value, { min = null, max = null } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  let result = numeric;
  if (min != null && result < min) {
    result = min;
  }
  if (max != null && result > max) {
    result = max;
  }
  return result;
}

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function coerceDate(value, label) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label ?? 'date'} must be a valid date.`);
  }
  return date;
}

function coerceDecimal(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError(`${label ?? 'amount'} must be a positive number.`);
  }
  return Math.round(numeric * 100) / 100;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toPlain(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

async function resolveWorkspace({ workspaceId, workspaceSlug }) {
  const where = {};
  if (workspaceId != null) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer when provided.');
    }
    where.id = parsed;
  }
  if (workspaceSlug) {
    where.slug = `${workspaceSlug}`.trim();
  }
  if (!Object.keys(where).length) {
    throw new ValidationError('workspaceId or workspaceSlug is required.');
  }

  const workspace = await ProviderWorkspace.findOne({
    where,
    attributes: ['id', 'name', 'slug', 'type', 'status'],
  });
  if (!workspace) {
    throw new NotFoundError('Workspace not found.');
  }
  return workspace;
}

async function ensureWorkspaceForPost(post, workspace) {
  if (!post) {
    throw new NotFoundError('Volunteering post not found.');
  }
  if (workspace && post.workspaceId !== workspace.id) {
    throw new ValidationError('Volunteering post does not belong to the specified workspace.');
  }
}

function buildPostPayload(input = {}) {
  const payload = {};
  if (input.title != null) payload.title = `${input.title}`.trim();
  if (input.summary !== undefined) payload.summary = input.summary ? `${input.summary}`.trim().slice(0, 255) : null;
  if (input.description !== undefined) payload.description = input.description ?? null;
  if (input.status) {
    const normalised = `${input.status}`.trim().toLowerCase();
    if (!VOLUNTEERING_POST_STATUSES.includes(normalised)) {
      throw new ValidationError('status must be a valid volunteering post status.');
    }
    payload.status = normalised;
  }
  if (input.location !== undefined) payload.location = input.location ? `${input.location}`.trim() : null;
  if (input.remoteFriendly !== undefined) payload.remoteFriendly = Boolean(input.remoteFriendly);
  if (input.commitmentHours !== undefined) payload.commitmentHours = normalizeNumber(input.commitmentHours, { min: 0 });
  if (input.applicationUrl !== undefined) payload.applicationUrl = input.applicationUrl ? `${input.applicationUrl}`.trim() : null;
  if (input.contactEmail !== undefined) payload.contactEmail = input.contactEmail ? `${input.contactEmail}`.trim() : null;
  if (input.startDate !== undefined) payload.startDate = normalizeDate(input.startDate);
  if (input.endDate !== undefined) payload.endDate = normalizeDate(input.endDate);
  if (input.applicationDeadline !== undefined) payload.applicationDeadline = normalizeDate(input.applicationDeadline);
  if (input.tags !== undefined) payload.tags = normalizeStringArray(input.tags);
  if (input.skills !== undefined) payload.skills = normalizeStringArray(input.skills);
  if (input.benefits !== undefined) payload.benefits = normalizeJson(input.benefits) ?? normalizeStringArray(input.benefits);
  if (input.requirements !== undefined)
    payload.requirements = normalizeJson(input.requirements) ?? normalizeStringArray(input.requirements);
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function buildApplicationPayload(input = {}) {
  const payload = {};
  if (input.candidateName != null) payload.candidateName = `${input.candidateName}`.trim();
  if (input.candidateEmail !== undefined) payload.candidateEmail = input.candidateEmail ? `${input.candidateEmail}`.trim() : null;
  if (input.candidatePhone !== undefined) payload.candidatePhone = input.candidatePhone ? `${input.candidatePhone}`.trim() : null;
  if (input.resumeUrl !== undefined) payload.resumeUrl = input.resumeUrl ? `${input.resumeUrl}`.trim() : null;
  if (input.portfolioUrl !== undefined) payload.portfolioUrl = input.portfolioUrl ? `${input.portfolioUrl}`.trim() : null;
  if (input.coverLetter !== undefined) payload.coverLetter = input.coverLetter ?? null;
  if (input.status) {
    const normalised = `${input.status}`.trim().toLowerCase();
    if (!VOLUNTEERING_APPLICATION_STATUSES.includes(normalised)) {
      throw new ValidationError('status must be a valid volunteering application status.');
    }
    payload.status = normalised;
  }
  if (input.stage !== undefined) payload.stage = input.stage ? `${input.stage}`.trim() : null;
  if (input.submittedAt !== undefined) payload.submittedAt = normalizeDate(input.submittedAt) ?? new Date();
  if (input.reviewedAt !== undefined) payload.reviewedAt = normalizeDate(input.reviewedAt);
  if (input.assignedTo !== undefined) payload.assignedTo = input.assignedTo ? `${input.assignedTo}`.trim() : null;
  if (input.source !== undefined) payload.source = input.source ? `${input.source}`.trim() : null;
  if (input.notes !== undefined) payload.notes = input.notes ?? null;
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function buildResponsePayload(input = {}) {
  const payload = {};
  if (input.actorId !== undefined) payload.actorId = input.actorId == null ? null : Number(input.actorId) || null;
  if (input.actorName !== undefined) payload.actorName = input.actorName ? `${input.actorName}`.trim() : null;
  if (input.actorRole !== undefined) payload.actorRole = input.actorRole ? `${input.actorRole}`.trim() : null;
  if (input.responseType) {
    const normalised = `${input.responseType}`.trim().toLowerCase();
    if (!VOLUNTEERING_RESPONSE_TYPES.includes(normalised)) {
      throw new ValidationError('responseType must be a valid response type.');
    }
    payload.responseType = normalised;
  }
  if (input.visibility) {
    const normalised = `${input.visibility}`.trim().toLowerCase();
    if (!['internal', 'candidate'].includes(normalised)) {
      throw new ValidationError('visibility must be internal or candidate.');
    }
    payload.visibility = normalised;
  }
  if (input.message != null) {
    payload.message = `${input.message}`;
  }
  if (input.attachments !== undefined) payload.attachments = normalizeJson(input.attachments) ?? normalizeStringArray(input.attachments);
  if (input.sentAt !== undefined) payload.sentAt = normalizeDate(input.sentAt) ?? new Date();
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function buildInterviewPayload(input = {}) {
  const payload = {};
  if (input.scheduledAt !== undefined) {
    const scheduled = normalizeDate(input.scheduledAt);
    if (!scheduled) {
      throw new ValidationError('scheduledAt must be a valid date.');
    }
    payload.scheduledAt = scheduled;
  }
  if (input.durationMinutes !== undefined)
    payload.durationMinutes = normalizeNumber(input.durationMinutes, { min: 0, max: 1440 });
  if (input.interviewerName !== undefined)
    payload.interviewerName = input.interviewerName ? `${input.interviewerName}`.trim() : null;
  if (input.interviewerEmail !== undefined)
    payload.interviewerEmail = input.interviewerEmail ? `${input.interviewerEmail}`.trim() : null;
  if (input.location !== undefined) payload.location = input.location ? `${input.location}`.trim() : null;
  if (input.meetingUrl !== undefined) payload.meetingUrl = input.meetingUrl ? `${input.meetingUrl}`.trim() : null;
  if (input.status) {
    const normalised = `${input.status}`.trim().toLowerCase();
    if (!VOLUNTEERING_INTERVIEW_STATUSES.includes(normalised)) {
      throw new ValidationError('status must be a valid interview status.');
    }
    payload.status = normalised;
  }
  if (input.feedback !== undefined) payload.feedback = input.feedback ?? null;
  if (input.score !== undefined) payload.score = normalizeNumber(input.score, { min: 0, max: 10 });
  if (input.notes !== undefined) payload.notes = input.notes ?? null;
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function buildContractPayload(input = {}) {
  const payload = {};
  if (input.title != null) payload.title = `${input.title}`.trim();
  if (input.status) {
    const normalised = `${input.status}`.trim().toLowerCase();
    if (!VOLUNTEERING_CONTRACT_STATUSES.includes(normalised)) {
      throw new ValidationError('status must be a valid contract status.');
    }
    payload.status = normalised;
  }
  if (input.contractType) {
    const normalised = `${input.contractType}`.trim().toLowerCase();
    if (!VOLUNTEERING_CONTRACT_TYPES.includes(normalised)) {
      throw new ValidationError('contractType must be a valid volunteering contract type.');
    }
    payload.contractType = normalised;
  }
  if (input.startDate !== undefined) payload.startDate = normalizeDate(input.startDate);
  if (input.endDate !== undefined) payload.endDate = normalizeDate(input.endDate);
  if (input.hoursPerWeek !== undefined) payload.hoursPerWeek = normalizeNumber(input.hoursPerWeek, { min: 0, max: 168 });
  if (input.stipendAmount !== undefined) payload.stipendAmount = normalizeNumber(input.stipendAmount, { min: 0 });
  if (input.currency !== undefined) payload.currency = input.currency ? `${input.currency}`.trim().toUpperCase().slice(0, 6) : 'USD';
  if (input.deliverables !== undefined)
    payload.deliverables = normalizeJson(input.deliverables) ?? normalizeStringArray(input.deliverables);
  if (input.terms !== undefined) payload.terms = input.terms ?? null;
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function buildSpendPayload(input = {}) {
  const payload = {};
  if (input.amount !== undefined) payload.amount = normalizeNumber(input.amount, { min: 0 }) ?? 0;
  if (input.currency !== undefined) payload.currency = input.currency ? `${input.currency}`.trim().toUpperCase().slice(0, 6) : 'USD';
  if (input.category !== undefined) payload.category = input.category ? `${input.category}`.trim() : null;
  if (input.description !== undefined) payload.description = input.description ? `${input.description}`.trim() : null;
  if (input.spentAt !== undefined) payload.spentAt = normalizeDate(input.spentAt) ?? new Date();
  if (input.receiptUrl !== undefined) payload.receiptUrl = input.receiptUrl ? `${input.receiptUrl}`.trim() : null;
  if (input.metadata !== undefined) payload.metadata = normalizeJson(input.metadata);
  return payload;
}

function groupBy(items, keySelector) {
  const map = new Map();
  (items ?? []).forEach((item) => {
    const key = keySelector(item);
    if (key == null) {
      return;
    }
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  });
  return map;
}

function sumBy(items, valueSelector) {
  return (items ?? []).reduce((total, item) => total + (Number(valueSelector(item)) || 0), 0);
}

function computeSummary({ posts, applications, interviews, contracts, spendEntries, lookbackStart }) {
  const postStatusCounts = posts.reduce((acc, post) => {
    const status = post.status ?? 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const applicationStatusCounts = applications.reduce((acc, application) => {
    const status = application.status ?? 'submitted';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const stageCounts = applications.reduce((acc, application) => {
    const stage = application.stage ?? 'unspecified';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const upcomingInterviews = interviews.filter((interview) => {
    const scheduled = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
    return scheduled && scheduled >= now && interview.status !== 'completed';
  }).length;
  const completedInterviews = interviews.filter((interview) => interview.status === 'completed').length;

  const contractStatusCounts = contracts.reduce((acc, contract) => {
    const status = contract.status ?? 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const spendByCurrency = spendEntries.reduce((acc, entry) => {
    const currency = (entry.currency || 'USD').toUpperCase();
    acc[currency] = (acc[currency] || 0) + (Number(entry.amount) || 0);
    return acc;
  }, {});

  const lookbackApplications = lookbackStart
    ? applications.filter((application) => {
        const submitted = application.submittedAt ? new Date(application.submittedAt) : null;
        return submitted && submitted >= lookbackStart;
      })
    : applications;

  return {
    posts: {
      total: posts.length,
      open: postStatusCounts.open || 0,
      draft: postStatusCounts.draft || 0,
      paused: postStatusCounts.paused || 0,
      closed: postStatusCounts.closed || 0,
      archived: postStatusCounts.archived || 0,
    },
    applications: {
      total: applications.length,
      newInPeriod: lookbackApplications.length,
      statusCounts: applicationStatusCounts,
      stageCounts,
    },
    interviews: {
      total: interviews.length,
      upcoming: upcomingInterviews,
      completed: completedInterviews,
    },
    contracts: {
      total: contracts.length,
      draft: contractStatusCounts.draft || 0,
      active: contractStatusCounts.active || 0,
      completed: contractStatusCounts.completed || 0,
      cancelled: contractStatusCounts.cancelled || 0,
    },
    spend: {
      total: sumBy(spendEntries, (entry) => entry.amount),
      byCurrency: spendByCurrency,
    },
  };
}

function attachNestedData(posts, groupedApplications, groupedResponses, groupedInterviews, groupedContracts, groupedSpend) {
  return posts.map((post) => {
    const applications = groupedApplications.get(post.id) || [];
    const applicationPayload = applications.map((application) => {
      const responses = groupedResponses.get(application.id) || [];
      const interviews = groupedInterviews.get(application.id) || [];
      const contracts = (groupedContracts.get(application.id) || []).map((contract) => ({
        ...contract,
        spendEntries: groupedSpend.get(contract.id) || [],
      }));

      return {
        ...application,
        responses,
        interviews,
        contracts,
      };
    });

    return {
      ...post,
      applications: applicationPayload,
    };
  });
}

export async function getVolunteeringDashboard({ workspaceId, workspaceSlug, lookbackDays = 90 } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const lookbackDuration = Number(lookbackDays);
  const lookbackStart = Number.isFinite(lookbackDuration) && lookbackDuration > 0
    ? new Date(Date.now() - lookbackDuration * 24 * 60 * 60 * 1000)
    : null;

  const posts = (await VolunteeringPost.findAll({
    where: { workspaceId: workspace.id },
    order: [['createdAt', 'DESC']],
  })).map(toPlain);

  const postIds = posts.map((post) => post.id);
  const applications = postIds.length
    ? (await VolunteeringApplication.findAll({
        where: { workspaceId: workspace.id, postId: postIds },
        order: [['submittedAt', 'DESC']],
      })).map(toPlain)
    : [];
  const applicationIds = applications.map((application) => application.id);

  const responses = applicationIds.length
    ? (await VolunteeringApplicationResponse.findAll({
        where: { workspaceId: workspace.id, applicationId: applicationIds },
        order: [['sentAt', 'DESC']],
      })).map(toPlain)
    : [];

  const interviews = applicationIds.length
    ? (await VolunteeringInterview.findAll({
        where: { workspaceId: workspace.id, applicationId: applicationIds },
        order: [['scheduledAt', 'DESC']],
      })).map(toPlain)
    : [];

  const contracts = applicationIds.length
    ? (await VolunteeringContract.findAll({
        where: { workspaceId: workspace.id, applicationId: applicationIds },
        order: [['createdAt', 'DESC']],
      })).map(toPlain)
    : [];
  const contractIds = contracts.map((contract) => contract.id);

  const spendEntries = contractIds.length
    ? (await VolunteeringContractSpend.findAll({
        where: { workspaceId: workspace.id, contractId: contractIds },
        order: [['spentAt', 'DESC']],
      })).map(toPlain)
    : [];

  const groupedApplications = groupBy(applications, (application) => application.postId);
  const groupedResponses = groupBy(responses, (response) => response.applicationId);
  const groupedInterviews = groupBy(interviews, (interview) => interview.applicationId);
  const groupedContracts = groupBy(contracts, (contract) => contract.applicationId);
  const groupedSpend = groupBy(spendEntries, (entry) => entry.contractId);

  const summary = computeSummary({ posts, applications, interviews, contracts, spendEntries, lookbackStart });
  const postPayload = attachNestedData(posts, groupedApplications, groupedResponses, groupedInterviews, groupedContracts, groupedSpend);

  return {
    workspace: toPlain(workspace),
    lookbackDays: lookbackDuration || 90,
    summary,
    posts: postPayload,
    totals: {
      applications: applications.length,
      interviews: interviews.length,
      contracts: contracts.length,
      spend: summary.spend.total,
    },
    permissions: {
      canManagePosts: true,
      canManageApplications: true,
      canManageInterviews: true,
      canManageContracts: true,
    },
  };
}

async function findPostOrThrow(postId, workspace) {
  const post = await VolunteeringPost.findByPk(postId);
  await ensureWorkspaceForPost(post, workspace);
  return post;
}

async function reloadPost(post) {
  const reloaded = await VolunteeringPost.findByPk(post.id);
  return toPlain(reloaded);
}

export async function createVolunteeringPost({ workspaceId, workspaceSlug, actorId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('payload is required.');
  }
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const attributes = buildPostPayload(payload);
  if (!attributes.title) {
    throw new ValidationError('title is required.');
  }
  const post = await VolunteeringPost.create({
    ...attributes,
    workspaceId: workspace.id,
    createdById: actorId ?? null,
    updatedById: actorId ?? null,
  });
  return reloadPost(post);
}

export async function updateVolunteeringPost({ postId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const post = await findPostOrThrow(postId, workspace);
  const attributes = buildPostPayload(payload);
  if (Object.keys(attributes).length === 0) {
    return reloadPost(post);
  }
  attributes.updatedById = actorId ?? post.updatedById ?? null;
  await post.update(attributes);
  return reloadPost(post);
}

export async function deleteVolunteeringPost({ postId, workspaceId, workspaceSlug }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const post = await findPostOrThrow(postId, workspace);
  await post.destroy();
  return true;
}

async function loadApplication(applicationId) {
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  const plainApplication = toPlain(application);
  const [responses, interviews, contracts] = await Promise.all([
    VolunteeringApplicationResponse.findAll({
      where: { applicationId: application.id },
      order: [['sentAt', 'DESC']],
    }).then((items) => items.map(toPlain)),
    VolunteeringInterview.findAll({
      where: { applicationId: application.id },
      order: [['scheduledAt', 'DESC']],
    }).then((items) => items.map(toPlain)),
    VolunteeringContract.findAll({
      where: { applicationId: application.id },
      order: [['createdAt', 'DESC']],
    }).then((items) => items.map(toPlain)),
  ]);

  const contractIds = contracts.map((contract) => contract.id);
  const spendEntries = contractIds.length
    ? (await VolunteeringContractSpend.findAll({
        where: { contractId: contractIds },
        order: [['spentAt', 'DESC']],
      })).map(toPlain)
    : [];
  const groupedSpend = groupBy(spendEntries, (entry) => entry.contractId);

  return {
    ...plainApplication,
    responses,
    interviews,
    contracts: contracts.map((contract) => ({
      ...contract,
      spendEntries: groupedSpend.get(contract.id) || [],
    })),
  };
}

export async function createVolunteeringApplication({ postId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const post = await findPostOrThrow(postId, workspace);
  const attributes = buildApplicationPayload(payload);
  if (!attributes.candidateName) {
    throw new ValidationError('candidateName is required.');
  }
  const application = await VolunteeringApplication.create({
    ...attributes,
    postId: post.id,
    workspaceId: workspace.id,
    createdById: actorId ?? null,
    updatedById: actorId ?? null,
  });
  return loadApplication(application.id);
}

export async function updateVolunteeringApplication({ applicationId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildApplicationPayload(payload);
  if (Object.keys(attributes).length === 0) {
    return loadApplication(application.id);
  }
  attributes.updatedById = actorId ?? application.updatedById ?? null;
  await application.update(attributes);
  return loadApplication(application.id);
}

export async function deleteVolunteeringApplication({ applicationId, workspaceId, workspaceSlug }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  await application.destroy();
  return true;
}

export async function createVolunteeringResponse({ applicationId, workspaceId, workspaceSlug, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildResponsePayload(payload);
  if (!attributes.message) {
    throw new ValidationError('message is required.');
  }
  const response = await VolunteeringApplicationResponse.create({
    ...attributes,
    applicationId: application.id,
    workspaceId: workspace.id,
  });
  return loadApplication(application.id);
}

export async function updateVolunteeringResponse({ responseId, workspaceId, workspaceSlug, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const response = await VolunteeringApplicationResponse.findByPk(responseId);
  if (!response) {
    throw new NotFoundError('Application response not found.');
  }
  const application = await VolunteeringApplication.findByPk(response.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildResponsePayload(payload);
  if (Object.keys(attributes).length === 0) {
    return loadApplication(application.id);
  }
  await response.update(attributes);
  return loadApplication(application.id);
}

export async function deleteVolunteeringResponse({ responseId, workspaceId, workspaceSlug }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const response = await VolunteeringApplicationResponse.findByPk(responseId);
  if (!response) {
    throw new NotFoundError('Application response not found.');
  }
  const application = await VolunteeringApplication.findByPk(response.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  await response.destroy();
  return loadApplication(application.id);
}

export async function scheduleVolunteeringInterview({ applicationId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildInterviewPayload(payload);
  if (!attributes.scheduledAt) {
    throw new ValidationError('scheduledAt is required.');
  }
  const interview = await VolunteeringInterview.create({
    ...attributes,
    applicationId: application.id,
    workspaceId: workspace.id,
    createdById: actorId ?? null,
    updatedById: actorId ?? null,
  });
  return loadApplication(interview.applicationId);
}

export async function updateVolunteeringInterview({ interviewId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const interview = await VolunteeringInterview.findByPk(interviewId);
  if (!interview) {
    throw new NotFoundError('Volunteering interview not found.');
  }
  const application = await VolunteeringApplication.findByPk(interview.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildInterviewPayload(payload);
  if (Object.keys(attributes).length === 0) {
    return loadApplication(application.id);
  }
  attributes.updatedById = actorId ?? interview.updatedById ?? null;
  await interview.update(attributes);
  return loadApplication(application.id);
}

export async function deleteVolunteeringInterview({ interviewId, workspaceId, workspaceSlug }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const interview = await VolunteeringInterview.findByPk(interviewId);
  if (!interview) {
    throw new NotFoundError('Volunteering interview not found.');
  }
  const application = await VolunteeringApplication.findByPk(interview.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  await interview.destroy();
  return loadApplication(application.id);
}

export async function createVolunteeringContract({ applicationId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildContractPayload(payload);
  if (!attributes.title) {
    throw new ValidationError('title is required.');
  }
  const contract = await VolunteeringContract.create({
    ...attributes,
    applicationId: application.id,
    workspaceId: workspace.id,
    createdById: actorId ?? null,
    updatedById: actorId ?? null,
  });
  return loadApplication(contract.applicationId);
}

export async function updateVolunteeringContract({ contractId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const contract = await VolunteeringContract.findByPk(contractId);
  if (!contract) {
    throw new NotFoundError('Volunteering contract not found.');
  }
  const application = await VolunteeringApplication.findByPk(contract.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildContractPayload(payload);
  if (Object.keys(attributes).length === 0) {
    return loadApplication(application.id);
  }
  attributes.updatedById = actorId ?? contract.updatedById ?? null;
  await contract.update(attributes);
  return loadApplication(application.id);
}

export async function addVolunteeringSpend({ contractId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const contract = await VolunteeringContract.findByPk(contractId);
  if (!contract) {
    throw new NotFoundError('Volunteering contract not found.');
  }
  const application = await VolunteeringApplication.findByPk(contract.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildSpendPayload(payload);
  const spend = await VolunteeringContractSpend.create({
    ...attributes,
    contractId: contract.id,
    workspaceId: workspace.id,
    createdById: actorId ?? null,
    updatedById: actorId ?? null,
  });
  return loadApplication(contract.applicationId);
}

export async function updateVolunteeringSpend({ spendId, workspaceId, workspaceSlug, actorId, payload }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const spend = await VolunteeringContractSpend.findByPk(spendId);
  if (!spend) {
    throw new NotFoundError('Volunteering contract spend entry not found.');
  }
  const contract = await VolunteeringContract.findByPk(spend.contractId);
  if (!contract) {
    throw new NotFoundError('Volunteering contract not found.');
  }
  const application = await VolunteeringApplication.findByPk(contract.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  const attributes = buildSpendPayload(payload);
  if (Object.keys(attributes).length === 0) {
    return loadApplication(application.id);
  }
  attributes.updatedById = actorId ?? spend.updatedById ?? null;
  await spend.update(attributes);
  return loadApplication(application.id);
}

export async function deleteVolunteeringSpend({ spendId, workspaceId, workspaceSlug }) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const spend = await VolunteeringContractSpend.findByPk(spendId);
  if (!spend) {
    throw new NotFoundError('Volunteering contract spend entry not found.');
  }
  const contract = await VolunteeringContract.findByPk(spend.contractId);
  if (!contract) {
    throw new NotFoundError('Volunteering contract not found.');
  }
  const application = await VolunteeringApplication.findByPk(contract.applicationId);
  if (!application) {
    throw new NotFoundError('Volunteering application not found.');
  }
  await ensureWorkspaceForPost(await VolunteeringPost.findByPk(application.postId), workspace);
  await spend.destroy();
  return loadApplication(application.id);
}

function coerceHours(value, label = 'hours', { max = 168 } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > max) {
    throw new ValidationError(`${label} must be between 0 and ${max} hours.`);
  }
  return Math.round(numeric);
}

function toPlainUser(instance) {
  if (!instance) {
    return null;
  }
  const plain = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
  };
}

function hydrateResponse(instance) {
  const response = instance?.toPublicObject?.() ?? null;
  if (!response) {
    return null;
  }
  return {
    ...response,
    responder: toPlainUser(instance.get?.('responder') ?? instance.responder),
  };
}

function hydrateSpend(instance) {
  const spend = instance?.toPublicObject?.() ?? null;
  if (!spend) {
    return null;
  }
  return {
    ...spend,
    amount: spend.amount != null ? Number(spend.amount) : null,
    recordedBy: toPlainUser(instance.get?.('recordedBy') ?? instance.recordedBy),
  };
}

function hydrateReview(instance) {
  const review = instance?.toPublicObject?.() ?? null;
  if (!review) {
    return null;
  }
  return {
    ...review,
    reviewer: toPlainUser(instance.get?.('reviewer') ?? instance.reviewer),
  };
}

function hydrateContract(instance) {
  const contract = instance?.toPublicObject?.() ?? null;
  if (!contract) {
    return null;
  }
  const spendEntries = Array.isArray(instance?.spendEntries)
    ? instance.spendEntries.map(hydrateSpend).filter(Boolean)
    : [];
  const reviews = Array.isArray(instance?.reviews)
    ? instance.reviews.map(hydrateReview).filter(Boolean)
    : [];
  return {
    ...contract,
    spendEntries,
    reviews,
    owner: toPlainUser(instance.get?.('owner') ?? instance.owner),
  };
}

function hydrateApplication(instance) {
  const application = instance?.toPublicObject?.() ?? null;
  if (!application) {
    return null;
  }
  const roleInstance = instance.get?.('role') ?? instance.role;
  const responses = Array.isArray(instance?.responses)
    ? instance.responses.map(hydrateResponse).filter(Boolean)
    : [];
  const contract = hydrateContract(instance.get?.('contract') ?? instance.contract);

  return {
    ...application,
    role: roleInstance
      ? {
          id: roleInstance.id,
          title: roleInstance.title,
          organization: roleInstance.organization,
          location: roleInstance.location ?? null,
        }
      : null,
    responses,
    contract,
  };
}

function buildSummary(applications) {
  const totalApplications = applications.length;
  const openApplications = applications.filter((application) =>
    APPLICATION_ACTIVE_STATUSES.has(application.status),
  ).length;
  const outstandingRequests = applications.reduce((count, application) => {
    const requested = application.responses?.filter?.((response) => response.responseType === 'request_info') ?? [];
    return count + requested.length;
  }, 0);

  const contracts = applications
    .map((application) => (application.contract ? { contract: application.contract, application } : null))
    .filter(Boolean);

  const openContracts = [];
  const finishedContracts = [];
  const spendEntries = [];
  const totalsByCurrency = new Map();
  const allReviews = [];
  let ratingSum = 0;
  let ratingCount = 0;

  contracts.forEach(({ contract, application }) => {
    if (CONTRACT_OPEN_STATUSES.has(contract.status)) {
      openContracts.push({ ...contract, applicationId: application.id });
    }
    if (CONTRACT_FINISHED_STATUSES.has(contract.status)) {
      finishedContracts.push({ ...contract, applicationId: application.id });
    }

    if (Array.isArray(contract.spendEntries)) {
      contract.spendEntries.forEach((entry) => {
        spendEntries.push({ ...entry, contractId: contract.id, applicationId: application.id });
        const currency = entry.currencyCode ?? 'USD';
        const amount = Number(entry.amount ?? 0);
        if (!Number.isNaN(amount)) {
          totalsByCurrency.set(currency, Number((totalsByCurrency.get(currency) ?? 0) + amount));
        }
      });
    }

    if (Array.isArray(contract.reviews)) {
      contract.reviews.forEach((review) => {
        allReviews.push({ ...review, contractId: contract.id, applicationId: application.id });
        if (Number.isFinite(Number(review.rating))) {
          ratingSum += Number(review.rating);
          ratingCount += 1;
        }
      });
    }
  });

  const spendByCurrency = Object.fromEntries(
    Array.from(totalsByCurrency.entries()).map(([currency, amount]) => [currency, Number(amount.toFixed(2))]),
  );

  const averageRating = ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : null;

  return {
    summary: {
      totalApplications,
      openApplications,
      outstandingRequests,
      openContracts: openContracts.length,
      finishedContracts: finishedContracts.length,
      totalSpendEntries: spendEntries.length,
      spendByCurrency,
      averageReviewRating: averageRating,
    },
    openContracts,
    finishedContracts,
    spend: {
      entries: spendEntries,
      totalsByCurrency: spendByCurrency,
    },
    reviews: allReviews,
  };
}

async function loadManagementPayload(userId) {
  const applications = await VolunteerApplication.findAll({
    where: { userId },
    include: [
      { model: Volunteering, as: 'role' },
      {
        model: VolunteerResponse,
        as: 'responses',
        include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: VolunteerContract,
        as: 'contract',
        include: [
          { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: VolunteerContractSpend,
            as: 'spendEntries',
            include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
          {
            model: VolunteerContractReview,
            as: 'reviews',
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
        ],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      [{ model: VolunteerResponse, as: 'responses' }, 'respondedAt', 'DESC'],
      [{ model: VolunteerContract, as: 'contract' }, 'updatedAt', 'DESC'],
      [
        { model: VolunteerContract, as: 'contract' },
        { model: VolunteerContractSpend, as: 'spendEntries' },
        'incurredAt',
        'DESC',
      ],
      [
        { model: VolunteerContract, as: 'contract' },
        { model: VolunteerContractReview, as: 'reviews' },
        'createdAt',
        'DESC',
      ],
    ],
  });

  const hydratedApplications = applications.map(hydrateApplication).filter(Boolean);
  const summary = buildSummary(hydratedApplications);

  return {
    applications: hydratedApplications,
    ...summary,
  };
}

function invalidateCaches(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const managementKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });
  const dashboardKey = buildCacheKey(DASHBOARD_CACHE_NAMESPACE, { userId: normalizedUserId });
  appCache.delete(managementKey);
  appCache.delete(dashboardKey);
}

export async function getUserVolunteeringManagement(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (bypassCache) {
    return loadManagementPayload(normalizedUserId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => loadManagementPayload(normalizedUserId));
}

async function findApplicationOrThrow(userId, applicationId, transaction) {
  const application = await VolunteerApplication.findOne({
    where: { id: applicationId, userId },
    include: [
      { model: Volunteering, as: 'role' },
      {
        model: VolunteerResponse,
        as: 'responses',
        include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: VolunteerContract,
        as: 'contract',
        include: [
          { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: VolunteerContractSpend,
            as: 'spendEntries',
            include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
          {
            model: VolunteerContractReview,
            as: 'reviews',
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
        ],
      },
    ],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!application) {
    throw new NotFoundError('The requested volunteering application was not found.');
  }

  return application;
}

export async function createVolunteerApplication(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const {
    volunteeringRoleId,
    status = 'draft',
    motivation,
    availabilityStart,
    availabilityHoursPerWeek,
    submittedAt,
    decisionAt,
    notes,
    metadata,
  } = payload;

  if (!volunteeringRoleId) {
    throw new ValidationError('volunteeringRoleId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const role = await Volunteering.findByPk(volunteeringRoleId, { transaction });
    if (!role) {
      throw new ValidationError('Referenced volunteering role does not exist.');
    }

    const application = await VolunteerApplication.create(
      {
        userId: normalizedUserId,
        volunteeringRoleId,
        status,
        motivation: motivation ?? null,
        availabilityStart: coerceDate(availabilityStart, 'availabilityStart'),
        availabilityHoursPerWeek: coerceHours(availabilityHoursPerWeek, 'availabilityHoursPerWeek', { max: 168 }),
        submittedAt: coerceDate(submittedAt, 'submittedAt'),
        decisionAt: coerceDate(decisionAt, 'decisionAt'),
        notes: notes ?? null,
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await application.reload({
      include: [
        { model: Volunteering, as: 'role' },
        {
          model: VolunteerResponse,
          as: 'responses',
          include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateApplication(application);
  });
}

export async function updateVolunteerApplication(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { status, motivation, availabilityStart, availabilityHoursPerWeek, submittedAt, decisionAt, notes, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    await application.update(
      {
        status: status ?? application.status,
        motivation: motivation ?? application.motivation,
        availabilityStart:
          availabilityStart !== undefined ? coerceDate(availabilityStart, 'availabilityStart') : application.availabilityStart,
        availabilityHoursPerWeek:
          availabilityHoursPerWeek !== undefined
            ? coerceHours(availabilityHoursPerWeek, 'availabilityHoursPerWeek', { max: 168 })
            : application.availabilityHoursPerWeek,
        submittedAt: submittedAt !== undefined ? coerceDate(submittedAt, 'submittedAt') : application.submittedAt,
        decisionAt: decisionAt !== undefined ? coerceDate(decisionAt, 'decisionAt') : application.decisionAt,
        notes: notes !== undefined ? notes : application.notes,
        metadata: metadata !== undefined ? metadata : application.metadata,
      },
      { transaction },
    );

    await application.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateApplication(application);
  });
}

export async function createVolunteerResponse(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { responseType = 'message', message, requestedAction, respondedAt, metadata } = payload;

  if (!message || !message.trim()) {
    throw new ValidationError('message is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const response = await VolunteerResponse.create(
      {
        applicationId: application.id,
        responderId: normalizedUserId,
        responseType,
        message: message.trim(),
        requestedAction: requestedAction ?? null,
        respondedAt: coerceDate(respondedAt, 'respondedAt') ?? new Date(),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await response.reload({
      include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateResponse(response);
  });
}

export async function updateVolunteerResponse(userId, applicationId, responseId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { responseType, message, requestedAction, respondedAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const response = await VolunteerResponse.findOne({
      where: { id: responseId, applicationId },
      include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!response) {
      throw new NotFoundError('The requested volunteering response was not found.');
    }

    await response.update(
      {
        responseType: responseType ?? response.responseType,
        message: message !== undefined ? message : response.message,
        requestedAction: requestedAction !== undefined ? requestedAction : response.requestedAction,
        respondedAt: respondedAt !== undefined ? coerceDate(respondedAt, 'respondedAt') : response.respondedAt,
        metadata: metadata !== undefined ? metadata : response.metadata,
      },
      { transaction },
    );

    await response.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateResponse(response);
  });
}

export async function deleteVolunteerResponse(userId, applicationId, responseId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const response = await VolunteerResponse.findOne({
      where: { id: responseId, applicationId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!response) {
      throw new NotFoundError('The requested volunteering response was not found.');
    }
    await response.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export async function upsertVolunteerContract(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const {
    status = 'draft',
    startDate,
    endDate,
    commitmentHours,
    hourlyRate,
    currencyCode,
    totalValue,
    spendToDate,
    notes,
    metadata,
  } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const [contract] = await VolunteerContract.findOrCreate({
      where: { applicationId: application.id },
      defaults: {
        ownerId: normalizedUserId,
        status,
        startDate: coerceDate(startDate, 'startDate'),
        endDate: coerceDate(endDate, 'endDate'),
        commitmentHours: coerceHours(commitmentHours, 'commitmentHours', { max: 1000 }),
        hourlyRate: coerceDecimal(hourlyRate, 'hourlyRate'),
        currencyCode: currencyCode ?? null,
        totalValue: coerceDecimal(totalValue, 'totalValue'),
        spendToDate: coerceDecimal(spendToDate, 'spendToDate'),
        notes: notes ?? null,
        metadata: metadata ?? null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (contract.ownerId !== normalizedUserId) {
      await contract.update({ ownerId: normalizedUserId }, { transaction });
    }

    await contract.update(
      {
        status,
        startDate: startDate !== undefined ? coerceDate(startDate, 'startDate') : contract.startDate,
        endDate: endDate !== undefined ? coerceDate(endDate, 'endDate') : contract.endDate,
        commitmentHours:
          commitmentHours !== undefined
            ? coerceHours(commitmentHours, 'commitmentHours', { max: 1000 })
            : contract.commitmentHours,
        hourlyRate: hourlyRate !== undefined ? coerceDecimal(hourlyRate, 'hourlyRate') : contract.hourlyRate,
        currencyCode: currencyCode !== undefined ? (currencyCode ?? null) : contract.currencyCode,
        totalValue: totalValue !== undefined ? coerceDecimal(totalValue, 'totalValue') : contract.totalValue,
        spendToDate: spendToDate !== undefined ? coerceDecimal(spendToDate, 'spendToDate') : contract.spendToDate,
        notes: notes !== undefined ? notes : contract.notes,
        metadata: metadata !== undefined ? metadata : contract.metadata,
      },
      { transaction },
    );

    await contract.reload({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: VolunteerContractSpend,
          as: 'spendEntries',
          include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: VolunteerContractReview,
          as: 'reviews',
          include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateContract(contract);
  });
}

export async function recordVolunteerSpend(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { amount, currencyCode = 'USD', category = 'other', description, incurredAt, metadata } = payload;

  if (amount == null) {
    throw new ValidationError('amount is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const contract = await VolunteerContract.findOne({
      where: { applicationId: application.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) {
      throw new ValidationError('An active volunteering contract is required before recording spend.');
    }

    const spend = await VolunteerContractSpend.create(
      {
        contractId: contract.id,
        recordedById: normalizedUserId,
        amount: coerceDecimal(amount, 'amount'),
        currencyCode,
        category,
        description: description ?? null,
        incurredAt: coerceDate(incurredAt, 'incurredAt') ?? new Date(),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await spend.reload({
      include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateSpend(spend);
  });
}

export async function updateVolunteerSpend(userId, applicationId, spendId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { amount, currencyCode, category, description, incurredAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const spend = await VolunteerContractSpend.findOne({
      where: { id: spendId },
      include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!spend || spend.contractId == null) {
      throw new NotFoundError('The requested spend record was not found.');
    }
    const contract = await VolunteerContract.findOne({ where: { id: spend.contractId, applicationId: application.id }, transaction });
    if (!contract) {
      throw new NotFoundError('The requested spend record was not found.');
    }

    await spend.update(
      {
        amount: amount !== undefined ? coerceDecimal(amount, 'amount') : spend.amount,
        currencyCode: currencyCode !== undefined ? (currencyCode ?? null) : spend.currencyCode,
        category: category ?? spend.category,
        description: description !== undefined ? description : spend.description,
        incurredAt: incurredAt !== undefined ? coerceDate(incurredAt, 'incurredAt') : spend.incurredAt,
        metadata: metadata !== undefined ? metadata : spend.metadata,
      },
      { transaction },
    );

    await spend.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateSpend(spend);
  });
}

export async function deleteVolunteerSpend(userId, applicationId, spendId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const spend = await VolunteerContractSpend.findByPk(spendId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!spend) {
      throw new NotFoundError('The requested spend record was not found.');
    }
    await spend.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export async function createVolunteerReview(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { rating, headline, feedback, visibility = 'private', publishedAt, metadata } = payload;

  if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
    throw new ValidationError('rating must be an integer between 1 and 5.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const contract = await VolunteerContract.findOne({
      where: { applicationId: application.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) {
      throw new ValidationError('An active volunteering contract is required before leaving a review.');
    }

    const review = await VolunteerContractReview.create(
      {
        contractId: contract.id,
        reviewerId: normalizedUserId,
        rating,
        headline: headline ?? null,
        feedback: feedback ?? null,
        visibility,
        publishedAt: coerceDate(publishedAt, 'publishedAt'),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await review.reload({
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateReview(review);
  });
}

export async function updateVolunteerReview(userId, applicationId, reviewId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { rating, headline, feedback, visibility, publishedAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const review = await VolunteerContractReview.findOne({
      where: { id: reviewId },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!review) {
      throw new NotFoundError('The requested review was not found.');
    }

    const contract = await VolunteerContract.findOne({ where: { id: review.contractId, applicationId: application.id }, transaction });
    if (!contract) {
      throw new NotFoundError('The requested review was not found.');
    }

    await review.update(
      {
        rating: rating !== undefined ? Number(rating) : review.rating,
        headline: headline !== undefined ? headline : review.headline,
        feedback: feedback !== undefined ? feedback : review.feedback,
        visibility: visibility ?? review.visibility,
        publishedAt: publishedAt !== undefined ? coerceDate(publishedAt, 'publishedAt') : review.publishedAt,
        metadata: metadata !== undefined ? metadata : review.metadata,
      },
      { transaction },
    );

    await review.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateReview(review);
  });
}

export async function deleteVolunteerReview(userId, applicationId, reviewId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const review = await VolunteerContractReview.findByPk(reviewId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!review) {
      throw new NotFoundError('The requested review was not found.');
    }
    await review.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export default {
  getUserVolunteeringManagement,
  createVolunteerApplication,
  updateVolunteerApplication,
  createVolunteerResponse,
  updateVolunteerResponse,
  deleteVolunteerResponse,
  upsertVolunteerContract,
  recordVolunteerSpend,
  updateVolunteerSpend,
  deleteVolunteerSpend,
  createVolunteerReview,
  updateVolunteerReview,
  deleteVolunteerReview,
};
