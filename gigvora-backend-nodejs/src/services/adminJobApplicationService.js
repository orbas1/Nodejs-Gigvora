import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  JobApplication,
  JobApplicationDocument,
  JobApplicationInterview,
  JobApplicationNote,
  JobApplicationStageHistory,
  JOB_APPLICATION_INTERVIEW_STATUSES,
  JOB_APPLICATION_INTERVIEW_TYPES,
  JOB_APPLICATION_PRIORITIES,
  JOB_APPLICATION_SOURCES,
  JOB_APPLICATION_STAGES,
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_VISIBILITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePagination({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const normalizedPage = Number.isFinite(Number(page)) ? Math.max(Number(page), 1) : 1;
  const normalizedSize = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number(pageSize), 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  return { page: normalizedPage, pageSize: normalizedSize };
}

function ensureEnum(value, allowed, field) {
  if (value == null) {
    return null;
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`Unsupported ${field} "${value}".`);
  }
  return value;
}

function normalizeStringArray(value, { maxItems = 20, maxLength = 80, fieldName = 'value' } = {}) {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array of strings.`);
  }
  return value
    .slice(0, maxItems)
    .map((entry, index) => {
      const stringified = entry == null ? '' : `${entry}`;
      const trimmed = stringified.trim();
      if (!trimmed) {
        return null;
      }
      if (trimmed.length > maxLength) {
        throw new ValidationError(`${fieldName} at index ${index} is too long.`);
      }
      return trimmed;
    })
    .filter(Boolean);
}

function coerceNumber(value, { min, max } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Invalid numeric value provided.');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}.`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be less than or equal to ${max}.`);
  }
  return numeric;
}

function coerceDate(value, fieldName = 'date') {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName} supplied.`);
  }
  return date;
}

function buildActorMetadata(actor = {}) {
  const actorId = actor?.id ?? null;
  const actorName = actor?.name && `${actor.name}`.trim().length ? `${actor.name}`.trim() : actorId ? `Admin #${actorId}` : 'Admin';
  return { actorId, actorName };
}

function mapCountRows(rows, keyName = 'status') {
  return rows.map((row) => {
    const plain = row.get({ plain: true });
    return {
      key: plain[keyName],
      count: Number.parseInt(plain.count ?? plain?.dataValues?.count ?? 0, 10) || 0,
    };
  });
}

function buildCountMap(rows, keyName = 'applicationId') {
  const map = new Map();
  rows.forEach((row) => {
    const plain = row.get({ plain: true });
    const key = plain[keyName];
    const countValue = Number.parseInt(plain.count ?? plain?.dataValues?.count ?? 0, 10) || 0;
    map.set(key, countValue);
  });
  return map;
}

function sanitizeRecruiters(rows) {
  return rows
    .map((row) => row.get({ plain: true }))
    .filter((row) => row.assignedRecruiterId != null)
    .map((row) => ({
      id: row.assignedRecruiterId,
      name:
        row.assignedRecruiterName && row.assignedRecruiterName.trim()
          ? row.assignedRecruiterName.trim()
          : `Admin #${row.assignedRecruiterId}`,
    }));
}

function sanitizeListRecord(instance, { noteCounts, interviewCounts, documentCounts }) {
  const base = instance.toPublicObject();
  return {
    ...base,
    noteCount: noteCounts.get(base.id) ?? 0,
    interviewCount: interviewCounts.get(base.id) ?? 0,
    documentCount: documentCounts.get(base.id) ?? 0,
  };
}

function sanitizeDetailRecord(instance) {
  const base = instance.toPublicObject();
  const assignedRecruiter = instance.assignedRecruiter
    ? {
        id: instance.assignedRecruiter.id,
        firstName: instance.assignedRecruiter.firstName,
        lastName: instance.assignedRecruiter.lastName,
        email: instance.assignedRecruiter.email,
      }
    : null;

  const notes = Array.isArray(instance.notes)
    ? instance.notes.map((note) =>
        typeof note.toPublicObject === 'function' ? note.toPublicObject() : note,
      )
    : [];
  const documents = Array.isArray(instance.documents)
    ? instance.documents.map((document) =>
        typeof document.toPublicObject === 'function' ? document.toPublicObject() : document,
      )
    : [];
  const interviews = Array.isArray(instance.interviews)
    ? instance.interviews.map((interview) =>
        typeof interview.toPublicObject === 'function' ? interview.toPublicObject() : interview,
      )
    : [];
  const stageHistory = Array.isArray(instance.stageHistory)
    ? instance.stageHistory.map((entry) =>
        typeof entry.toPublicObject === 'function' ? entry.toPublicObject() : entry,
      )
    : [];

  return {
    ...base,
    assignedRecruiter,
    notes,
    documents,
    interviews,
    stageHistory,
  };
}

async function fetchCountAggregations(applicationIds) {
  if (!applicationIds.length) {
    return {
      noteCounts: new Map(),
      interviewCounts: new Map(),
      documentCounts: new Map(),
    };
  }

  const [noteRows, interviewRows, documentRows] = await Promise.all([
    JobApplicationNote.findAll({
      attributes: ['applicationId', [fn('COUNT', col('id')), 'count']],
      where: { applicationId: { [Op.in]: applicationIds } },
      group: ['applicationId'],
    }),
    JobApplicationInterview.findAll({
      attributes: ['applicationId', [fn('COUNT', col('id')), 'count']],
      where: { applicationId: { [Op.in]: applicationIds } },
      group: ['applicationId'],
    }),
    JobApplicationDocument.findAll({
      attributes: ['applicationId', [fn('COUNT', col('id')), 'count']],
      where: { applicationId: { [Op.in]: applicationIds } },
      group: ['applicationId'],
    }),
  ]);

  return {
    noteCounts: buildCountMap(noteRows),
    interviewCounts: buildCountMap(interviewRows),
    documentCounts: buildCountMap(documentRows),
  };
}

async function findApplicationOrThrow(applicationId, options = {}) {
  const application = await JobApplication.findByPk(applicationId, options);
  if (!application) {
    throw new NotFoundError('Job application not found.');
  }
  return application;
}

async function recordStageTransition(
  application,
  { fromStage, toStage, fromStatus, toStatus, note, actor },
  transaction,
) {
  const { actorId, actorName } = buildActorMetadata(actor);
  await JobApplicationStageHistory.create(
    {
      applicationId: application.id,
      fromStage: fromStage ?? null,
      toStage: toStage ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: toStatus ?? null,
      note: note ?? null,
      changedById: actorId,
      changedByName: actorName,
      changedAt: new Date(),
    },
    { transaction },
  );
}

export async function listJobApplications(query = {}) {
  const { page, pageSize } = normalizePagination(query);
  const where = { isArchived: false };

  if (query.status) {
    where.status = ensureEnum(`${query.status}`.trim(), JOB_APPLICATION_STATUSES, 'status');
  }
  if (query.stage) {
    where.stage = ensureEnum(`${query.stage}`.trim(), JOB_APPLICATION_STAGES, 'stage');
  }
  if (query.priority) {
    where.priority = ensureEnum(`${query.priority}`.trim(), JOB_APPLICATION_PRIORITIES, 'priority');
  }
  if (query.source) {
    where.source = ensureEnum(`${query.source}`.trim(), JOB_APPLICATION_SOURCES, 'source');
  }
  if (query.assignedRecruiterId) {
    where.assignedRecruiterId = Number(query.assignedRecruiterId);
  }

  const searchTerm = query.search ? `${query.search}`.trim() : '';
  if (searchTerm) {
    where[Op.and] = where[Op.and] ?? [];
    where[Op.and].push({
      [Op.or]: [
        { candidateName: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
        { candidateEmail: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
        { jobTitle: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
        { jobId: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
        { assignedRecruiterName: { [Op.iLike ?? Op.like]: `%${searchTerm}%` } },
      ],
    });
  }

  const { rows, count } = await JobApplication.findAndCountAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const applicationIds = rows.map((row) => row.id);
  const [{ noteCounts, interviewCounts, documentCounts }, statusRows, stageRows, recruiterRows, upcomingInterviews] =
    await Promise.all([
      fetchCountAggregations(applicationIds),
      JobApplication.findAll({
        attributes: ['status', [fn('COUNT', col('status')), 'count']],
        where: { isArchived: false },
        group: ['status'],
      }),
      JobApplication.findAll({
        attributes: ['stage', [fn('COUNT', col('stage')), 'count']],
        where: { isArchived: false },
        group: ['stage'],
      }),
      JobApplication.findAll({
        attributes: ['assignedRecruiterId', 'assignedRecruiterName'],
        where: { isArchived: false, assignedRecruiterId: { [Op.ne]: null } },
        group: ['assignedRecruiterId', 'assignedRecruiterName'],
        order: [['assignedRecruiterName', 'ASC']],
      }),
      JobApplicationInterview.findAll({
        where: {
          status: 'scheduled',
          scheduledAt: { [Op.gte]: new Date(Date.now() - 1000 * 60 * 60) },
        },
        include: [
          {
            model: JobApplication,
            as: 'application',
            attributes: ['id', 'candidateName', 'jobTitle', 'stage', 'status'],
          },
        ],
        order: [['scheduledAt', 'ASC']],
        limit: 10,
      }),
    ]);

  const list = rows.map((row) => sanitizeListRecord(row, { noteCounts, interviewCounts, documentCounts }));

  const upcoming = upcomingInterviews.map((interview) => {
    const plain = interview.get({ plain: true });
    return {
      id: plain.id,
      applicationId: plain.applicationId,
      scheduledAt: plain.scheduledAt,
      type: plain.type,
      status: plain.status,
      interviewerName: plain.interviewerName,
      interviewerEmail: plain.interviewerEmail,
      notes: plain.notes,
      candidateName: plain.application?.candidateName ?? null,
      jobTitle: plain.application?.jobTitle ?? null,
    };
  });

  return {
    data: list,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize) || 1,
    },
    facets: {
      statuses: JOB_APPLICATION_STATUSES,
      stages: JOB_APPLICATION_STAGES,
      priorities: JOB_APPLICATION_PRIORITIES,
      sources: JOB_APPLICATION_SOURCES,
      visibilities: JOB_APPLICATION_VISIBILITIES,
      interviewTypes: JOB_APPLICATION_INTERVIEW_TYPES,
      interviewStatuses: JOB_APPLICATION_INTERVIEW_STATUSES,
      recruiters: sanitizeRecruiters(recruiterRows),
    },
    metrics: {
      statusSummary: mapCountRows(statusRows, 'status'),
      stageSummary: mapCountRows(stageRows, 'stage'),
      upcomingInterviews: upcoming,
    },
  };
}

export async function getJobApplication(applicationId) {
  const application = await JobApplication.findByPk(applicationId, {
    include: [
      {
        model: JobApplicationNote,
        as: 'notes',
        separate: true,
        order: [['createdAt', 'DESC']],
      },
      {
        model: JobApplicationDocument,
        as: 'documents',
        separate: true,
        order: [['createdAt', 'DESC']],
      },
      {
        model: JobApplicationInterview,
        as: 'interviews',
        separate: true,
        order: [['scheduledAt', 'ASC']],
      },
      {
        model: JobApplicationStageHistory,
        as: 'stageHistory',
        separate: true,
        order: [['changedAt', 'DESC']],
      },
      {
        association: 'assignedRecruiter',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!application) {
    throw new NotFoundError('Job application not found.');
  }

  return sanitizeDetailRecord(application);
}

export async function createJobApplication(payload, actor) {
  const {
    candidateName,
    candidateEmail,
    candidatePhone,
    resumeUrl,
    coverLetter,
    portfolioUrl,
    linkedinUrl,
    githubUrl,
    jobTitle,
    jobId,
    jobLocation,
    employmentType,
    salaryExpectation,
    currency,
    status,
    stage,
    priority,
    source,
    score,
    tags,
    skills,
    metadata,
    assignedRecruiterId,
    assignedRecruiterName,
    assignedTeam,
    availabilityDate,
  } = payload;

  if (!candidateName || !candidateEmail || !jobTitle) {
    throw new ValidationError('candidateName, candidateEmail, and jobTitle are required.');
  }

  const normalizedTags = normalizeStringArray(tags ?? null, { fieldName: 'tags' });
  const normalizedSkills = normalizeStringArray(skills ?? null, { fieldName: 'skills', maxItems: 40 });
  const normalizedScore = score == null ? null : coerceNumber(score, { min: 0, max: 100 });
  const normalizedSalary = coerceNumber(salaryExpectation, { min: 0 });
  const normalizedAvailability = coerceDate(availabilityDate, 'availabilityDate');
  const normalizedStatus = status ? ensureEnum(status, JOB_APPLICATION_STATUSES, 'status') : undefined;
  const normalizedStage = stage ? ensureEnum(stage, JOB_APPLICATION_STAGES, 'stage') : undefined;
  const normalizedPriority = priority ? ensureEnum(priority, JOB_APPLICATION_PRIORITIES, 'priority') : undefined;
  const normalizedSource = source ? ensureEnum(source, JOB_APPLICATION_SOURCES, 'source') : undefined;

  const actorMeta = buildActorMetadata(actor);

  const application = await sequelize.transaction(async (transaction) => {
    const created = await JobApplication.create(
      {
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl,
        coverLetter,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        jobTitle,
        jobId,
        jobLocation,
        employmentType,
        salaryExpectation: normalizedSalary,
        currency: currency ? `${currency}`.trim().toUpperCase() : 'USD',
        status: normalizedStatus ?? undefined,
        stage: normalizedStage ?? undefined,
        priority: normalizedPriority ?? undefined,
        source: normalizedSource ?? undefined,
        score: normalizedScore,
        tags: normalizedTags ?? undefined,
        skills: normalizedSkills ?? undefined,
        metadata: metadata ?? null,
        assignedRecruiterId: assignedRecruiterId ?? null,
        assignedRecruiterName: assignedRecruiterName ?? null,
        assignedTeam: assignedTeam ?? null,
        availabilityDate: normalizedAvailability,
        lastActivityAt: new Date(),
      },
      { transaction },
    );

    await recordStageTransition(
      created,
      {
        fromStage: null,
        toStage: created.stage,
        fromStatus: null,
        toStatus: created.status,
        note: 'Application created',
        actor: actorMeta,
      },
      transaction,
    );

    if (Array.isArray(payload.notes) && payload.notes.length) {
      const notes = payload.notes.slice(0, 25);
      for (const note of notes) {
        await JobApplicationNote.create(
          {
            applicationId: created.id,
            authorId: actorMeta.actorId,
            authorName: actorMeta.actorName,
            body: `${note.body}`.trim(),
            visibility: note.visibility ? ensureEnum(note.visibility, JOB_APPLICATION_VISIBILITIES, 'visibility') : 'internal',
          },
          { transaction },
        );
      }
    }

    if (Array.isArray(payload.documents) && payload.documents.length) {
      const documents = payload.documents.slice(0, 25);
      for (const document of documents) {
        await JobApplicationDocument.create(
          {
            applicationId: created.id,
            fileName: `${document.fileName}`.trim(),
            fileType: document.fileType ? `${document.fileType}`.trim() : null,
            fileUrl: `${document.fileUrl}`.trim(),
            sizeBytes:
              document.sizeBytes == null ? null : coerceNumber(document.sizeBytes, { min: 0, max: Number.MAX_SAFE_INTEGER }),
            uploadedById: actorMeta.actorId,
            uploadedByName: actorMeta.actorName,
            metadata: document.metadata ?? null,
          },
          { transaction },
        );
      }
    }

    if (Array.isArray(payload.interviews) && payload.interviews.length) {
      const interviews = payload.interviews.slice(0, 25);
      for (const interview of interviews) {
        await JobApplicationInterview.create(
          {
            applicationId: created.id,
            scheduledAt: coerceDate(interview.scheduledAt, 'scheduledAt'),
            durationMinutes:
              interview.durationMinutes == null
                ? null
                : coerceNumber(interview.durationMinutes, { min: 0, max: 1440 }),
            type: interview.type ? ensureEnum(interview.type, JOB_APPLICATION_INTERVIEW_TYPES, 'type') : 'video',
            status: interview.status
              ? ensureEnum(interview.status, JOB_APPLICATION_INTERVIEW_STATUSES, 'status')
              : 'scheduled',
            location: interview.location ? `${interview.location}`.trim() : null,
            meetingLink: interview.meetingLink ? `${interview.meetingLink}`.trim() : null,
            interviewerName: interview.interviewerName ? `${interview.interviewerName}`.trim() : null,
            interviewerEmail: interview.interviewerEmail ? `${interview.interviewerEmail}`.trim() : null,
            notes: interview.notes ?? null,
            createdById: actorMeta.actorId,
            createdByName: actorMeta.actorName,
          },
          { transaction },
        );
      }
    }

    return created;
  });

  return getJobApplication(application.id);
}

export async function updateJobApplication(applicationId, payload, actor) {
  const application = await findApplicationOrThrow(applicationId);

  const updates = {};
  let stageChanged = false;
  let statusChanged = false;
  const previousStage = application.stage;
  const previousStatus = application.status;

  if (payload.candidateName != null) {
    const name = `${payload.candidateName}`.trim();
    if (!name) {
      throw new ValidationError('candidateName cannot be empty.');
    }
    updates.candidateName = name;
  }
  if (payload.candidateEmail != null) {
    const email = `${payload.candidateEmail}`.trim();
    if (!email) {
      throw new ValidationError('candidateEmail cannot be empty.');
    }
    updates.candidateEmail = email;
  }
  if (payload.candidatePhone !== undefined) {
    updates.candidatePhone = payload.candidatePhone ? `${payload.candidatePhone}`.trim() : null;
  }
  if (payload.resumeUrl !== undefined) {
    updates.resumeUrl = payload.resumeUrl ? `${payload.resumeUrl}`.trim() : null;
  }
  if (payload.coverLetter !== undefined) {
    updates.coverLetter = payload.coverLetter ?? null;
  }
  if (payload.portfolioUrl !== undefined) {
    updates.portfolioUrl = payload.portfolioUrl ? `${payload.portfolioUrl}`.trim() : null;
  }
  if (payload.linkedinUrl !== undefined) {
    updates.linkedinUrl = payload.linkedinUrl ? `${payload.linkedinUrl}`.trim() : null;
  }
  if (payload.githubUrl !== undefined) {
    updates.githubUrl = payload.githubUrl ? `${payload.githubUrl}`.trim() : null;
  }
  if (payload.jobTitle != null) {
    const title = `${payload.jobTitle}`.trim();
    if (!title) {
      throw new ValidationError('jobTitle cannot be empty.');
    }
    updates.jobTitle = title;
  }
  if (payload.jobId !== undefined) {
    updates.jobId = payload.jobId ? `${payload.jobId}`.trim() : null;
  }
  if (payload.jobLocation !== undefined) {
    updates.jobLocation = payload.jobLocation ? `${payload.jobLocation}`.trim() : null;
  }
  if (payload.employmentType !== undefined) {
    updates.employmentType = payload.employmentType ? `${payload.employmentType}`.trim() : null;
  }
  if (payload.salaryExpectation !== undefined) {
    updates.salaryExpectation = coerceNumber(payload.salaryExpectation, { min: 0 });
  }
  if (payload.currency !== undefined) {
    updates.currency = payload.currency ? `${payload.currency}`.trim().toUpperCase() : 'USD';
  }
  if (payload.status !== undefined) {
    const normalizedStatus = ensureEnum(payload.status, JOB_APPLICATION_STATUSES, 'status');
    if (normalizedStatus !== application.status) {
      statusChanged = true;
    }
    updates.status = normalizedStatus;
  }
  if (payload.stage !== undefined) {
    const normalizedStage = ensureEnum(payload.stage, JOB_APPLICATION_STAGES, 'stage');
    if (normalizedStage !== application.stage) {
      stageChanged = true;
    }
    updates.stage = normalizedStage;
  }
  if (payload.priority !== undefined) {
    updates.priority = ensureEnum(payload.priority, JOB_APPLICATION_PRIORITIES, 'priority');
  }
  if (payload.source !== undefined) {
    updates.source = ensureEnum(payload.source, JOB_APPLICATION_SOURCES, 'source');
  }
  if (payload.score !== undefined) {
    updates.score = payload.score == null ? null : coerceNumber(payload.score, { min: 0, max: 100 });
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeStringArray(payload.tags ?? null, { fieldName: 'tags' });
  }
  if (payload.skills !== undefined) {
    updates.skills = normalizeStringArray(payload.skills ?? null, { fieldName: 'skills', maxItems: 40 });
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? null;
  }
  if (payload.assignedRecruiterId !== undefined) {
    updates.assignedRecruiterId = payload.assignedRecruiterId ?? null;
  }
  if (payload.assignedRecruiterName !== undefined) {
    updates.assignedRecruiterName = payload.assignedRecruiterName ? `${payload.assignedRecruiterName}`.trim() : null;
  }
  if (payload.assignedTeam !== undefined) {
    updates.assignedTeam = payload.assignedTeam ? `${payload.assignedTeam}`.trim() : null;
  }
  if (payload.availabilityDate !== undefined) {
    updates.availabilityDate = coerceDate(payload.availabilityDate, 'availabilityDate');
  }

  if (Object.keys(updates).length === 0) {
    return getJobApplication(applicationId);
  }

  const actorMeta = buildActorMetadata(actor);

  await sequelize.transaction(async (transaction) => {
    await application.update({ ...updates, lastActivityAt: new Date() }, { transaction });

    if (stageChanged || statusChanged) {
      await recordStageTransition(
        application,
        {
          fromStage: previousStage,
          toStage: updates.stage ?? application.stage,
          fromStatus: previousStatus,
          toStatus: updates.status ?? application.status,
          note: payload.transitionNote ?? null,
          actor: actorMeta,
        },
        transaction,
      );
    }
  });

  return getJobApplication(applicationId);
}

export async function deleteJobApplication(applicationId) {
  const deleted = await JobApplication.destroy({ where: { id: applicationId } });
  if (!deleted) {
    throw new NotFoundError('Job application not found.');
  }
}

export async function createJobApplicationNote(applicationId, payload, actor) {
  const application = await findApplicationOrThrow(applicationId);
  const body = payload?.body ? `${payload.body}`.trim() : '';
  if (!body) {
    throw new ValidationError('Note body is required.');
  }
  const visibility = payload?.visibility
    ? ensureEnum(payload.visibility, JOB_APPLICATION_VISIBILITIES, 'visibility')
    : 'internal';
  const actorMeta = buildActorMetadata(actor);

  const note = await JobApplicationNote.create({
    applicationId: application.id,
    authorId: actorMeta.actorId,
    authorName: actorMeta.actorName,
    body,
    visibility,
  });

  await application.update({ lastActivityAt: new Date() });

  return note.toPublicObject();
}

export async function updateJobApplicationNote(applicationId, noteId, payload) {
  await findApplicationOrThrow(applicationId);
  const note = await JobApplicationNote.findOne({ where: { id: noteId, applicationId } });
  if (!note) {
    throw new NotFoundError('Note not found.');
  }

  const updates = {};
  if (payload.body !== undefined) {
    const body = payload.body ? `${payload.body}`.trim() : '';
    if (!body) {
      throw new ValidationError('Note body cannot be empty.');
    }
    updates.body = body;
  }
  if (payload.visibility !== undefined) {
    updates.visibility = ensureEnum(payload.visibility, JOB_APPLICATION_VISIBILITIES, 'visibility');
  }

  if (Object.keys(updates).length === 0) {
    return note.toPublicObject();
  }

  await note.update(updates);
  return note.toPublicObject();
}

export async function deleteJobApplicationNote(applicationId, noteId) {
  await findApplicationOrThrow(applicationId);
  const deleted = await JobApplicationNote.destroy({ where: { id: noteId, applicationId } });
  if (!deleted) {
    throw new NotFoundError('Note not found.');
  }
}

export async function createJobApplicationInterview(applicationId, payload, actor) {
  const application = await findApplicationOrThrow(applicationId);
  const scheduledAt = coerceDate(payload?.scheduledAt, 'scheduledAt');
  if (!scheduledAt) {
    throw new ValidationError('scheduledAt is required.');
  }
  const type = ensureEnum(payload?.type ?? 'video', JOB_APPLICATION_INTERVIEW_TYPES, 'type');
  const status = ensureEnum(payload?.status ?? 'scheduled', JOB_APPLICATION_INTERVIEW_STATUSES, 'status');
  const actorMeta = buildActorMetadata(actor);

  const interview = await JobApplicationInterview.create({
    applicationId: application.id,
    scheduledAt,
    durationMinutes: payload?.durationMinutes ? coerceNumber(payload.durationMinutes, { min: 0 }) : null,
    type,
    status,
    location: payload?.location ? `${payload.location}`.trim() : null,
    meetingLink: payload?.meetingLink ? `${payload.meetingLink}`.trim() : null,
    interviewerName: payload?.interviewerName ? `${payload.interviewerName}`.trim() : null,
    interviewerEmail: payload?.interviewerEmail ? `${payload.interviewerEmail}`.trim() : null,
    notes: payload?.notes ?? null,
    createdById: actorMeta.actorId,
    createdByName: actorMeta.actorName,
  });

  await application.update({ lastActivityAt: new Date() });

  return interview.toPublicObject();
}

export async function updateJobApplicationInterview(applicationId, interviewId, payload) {
  await findApplicationOrThrow(applicationId);
  const interview = await JobApplicationInterview.findOne({ where: { id: interviewId, applicationId } });
  if (!interview) {
    throw new NotFoundError('Interview not found.');
  }

  const updates = {};
  if (payload.scheduledAt !== undefined) {
    updates.scheduledAt = coerceDate(payload.scheduledAt, 'scheduledAt');
  }
  if (payload.durationMinutes !== undefined) {
    updates.durationMinutes = payload.durationMinutes == null ? null : coerceNumber(payload.durationMinutes, { min: 0 });
  }
  if (payload.type !== undefined) {
    updates.type = ensureEnum(payload.type, JOB_APPLICATION_INTERVIEW_TYPES, 'type');
  }
  if (payload.status !== undefined) {
    updates.status = ensureEnum(payload.status, JOB_APPLICATION_INTERVIEW_STATUSES, 'status');
  }
  if (payload.location !== undefined) {
    updates.location = payload.location ? `${payload.location}`.trim() : null;
  }
  if (payload.meetingLink !== undefined) {
    updates.meetingLink = payload.meetingLink ? `${payload.meetingLink}`.trim() : null;
  }
  if (payload.interviewerName !== undefined) {
    updates.interviewerName = payload.interviewerName ? `${payload.interviewerName}`.trim() : null;
  }
  if (payload.interviewerEmail !== undefined) {
    updates.interviewerEmail = payload.interviewerEmail ? `${payload.interviewerEmail}`.trim() : null;
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return interview.toPublicObject();
  }

  await interview.update(updates);
  return interview.toPublicObject();
}

export async function deleteJobApplicationInterview(applicationId, interviewId) {
  await findApplicationOrThrow(applicationId);
  const deleted = await JobApplicationInterview.destroy({ where: { id: interviewId, applicationId } });
  if (!deleted) {
    throw new NotFoundError('Interview not found.');
  }
}

export async function createJobApplicationDocument(applicationId, payload, actor) {
  const application = await findApplicationOrThrow(applicationId);
  const fileName = payload?.fileName ? `${payload.fileName}`.trim() : '';
  const fileUrl = payload?.fileUrl ? `${payload.fileUrl}`.trim() : '';
  if (!fileName || !fileUrl) {
    throw new ValidationError('fileName and fileUrl are required.');
  }
  const actorMeta = buildActorMetadata(actor);

  const document = await JobApplicationDocument.create({
    applicationId: application.id,
    fileName,
    fileType: payload?.fileType ? `${payload.fileType}`.trim() : null,
    fileUrl,
    sizeBytes: payload?.sizeBytes ? coerceNumber(payload.sizeBytes, { min: 0 }) : null,
    uploadedById: actorMeta.actorId,
    uploadedByName: actorMeta.actorName,
    metadata: payload?.metadata ?? null,
  });

  await application.update({ lastActivityAt: new Date() });

  return document.toPublicObject();
}

export async function updateJobApplicationDocument(applicationId, documentId, payload) {
  await findApplicationOrThrow(applicationId);
  const document = await JobApplicationDocument.findOne({ where: { id: documentId, applicationId } });
  if (!document) {
    throw new NotFoundError('Document not found.');
  }

  const updates = {};
  if (payload.fileName !== undefined) {
    const name = payload.fileName ? `${payload.fileName}`.trim() : '';
    if (!name) {
      throw new ValidationError('fileName cannot be empty.');
    }
    updates.fileName = name;
  }
  if (payload.fileType !== undefined) {
    updates.fileType = payload.fileType ? `${payload.fileType}`.trim() : null;
  }
  if (payload.fileUrl !== undefined) {
    const url = payload.fileUrl ? `${payload.fileUrl}`.trim() : '';
    if (!url) {
      throw new ValidationError('fileUrl cannot be empty.');
    }
    updates.fileUrl = url;
  }
  if (payload.sizeBytes !== undefined) {
    updates.sizeBytes = payload.sizeBytes == null ? null : coerceNumber(payload.sizeBytes, { min: 0 });
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return document.toPublicObject();
  }

  await document.update(updates);
  return document.toPublicObject();
}

export async function deleteJobApplicationDocument(applicationId, documentId) {
  await findApplicationOrThrow(applicationId);
  const deleted = await JobApplicationDocument.destroy({ where: { id: documentId, applicationId } });
  if (!deleted) {
    throw new NotFoundError('Document not found.');
  }
}
