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
import { ProviderWorkspace } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

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
  if (min != null && numeric < min) {
    return min;
  }
  if (max != null && numeric > max) {
    return max;
  }
  return numeric;
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

export default {
  getVolunteeringDashboard,
  createVolunteeringPost,
  updateVolunteeringPost,
  deleteVolunteeringPost,
  createVolunteeringApplication,
  updateVolunteeringApplication,
  deleteVolunteeringApplication,
  createVolunteeringResponse,
  updateVolunteeringResponse,
  deleteVolunteeringResponse,
  scheduleVolunteeringInterview,
  updateVolunteeringInterview,
  deleteVolunteeringInterview,
  createVolunteeringContract,
  updateVolunteeringContract,
  addVolunteeringSpend,
  updateVolunteeringSpend,
  deleteVolunteeringSpend,
};
