import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  ExperienceLaunchpadEmployerRequest,
  ExperienceLaunchpadPlacement,
  ExperienceLaunchpadOpportunityLink,
  Job,
  Gig,
  Project,
  Volunteering,
  User,
  Application,
  LAUNCHPAD_APPLICATION_STATUSES,
  LAUNCHPAD_PLACEMENT_STATUSES,
  LAUNCHPAD_TARGET_TYPES,
  LAUNCHPAD_OPPORTUNITY_SOURCES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const APPLICATION_CACHE_PREFIX = 'launchpad:applications:list';
const WORKFLOW_CACHE_PREFIX = 'launchpad:workflow';
const AUTO_ASSIGN_MATCH_THRESHOLD = 0.65;

const APPLICATION_STATUS_TRANSITIONS = {
  screening: new Set(['interview', 'waitlisted', 'rejected', 'withdrawn']),
  interview: new Set(['accepted', 'waitlisted', 'rejected', 'withdrawn', 'completed']),
  accepted: new Set(['completed', 'withdrawn']),
  waitlisted: new Set(['interview', 'accepted', 'rejected', 'withdrawn']),
  rejected: new Set(),
  withdrawn: new Set(),
  completed: new Set(),
};

function ensureLaunchpadExists(launchpad) {
  if (!launchpad) {
    throw new NotFoundError('Experience Launchpad programme not found.');
  }
}

function normaliseSkills(rawSkills) {
  if (!rawSkills) {
    return [];
  }

  if (Array.isArray(rawSkills)) {
    return [...new Set(rawSkills.map((skill) => `${skill}`.trim()).filter(Boolean))];
  }

  if (typeof rawSkills === 'string') {
    return [...new Set(rawSkills.split(',').map((skill) => skill.trim()).filter(Boolean))];
  }

  throw new ValidationError('skills must be provided as an array or comma-separated string.');
}

function normaliseSkillTokens(skills) {
  const entries = Array.isArray(skills) ? skills : [];
  const cleaned = entries
    .map((skill) => `${skill}`.trim())
    .filter(Boolean);
  const seen = new Set();
  const normalized = [];
  cleaned.forEach((skill) => {
    const lowered = skill.toLowerCase();
    if (seen.has(lowered)) {
      return;
    }
    seen.add(lowered);
    normalized.push({ label: skill, key: lowered });
  });
  return normalized;
}

function normaliseArrayParam(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [value];
}

function normaliseApplicationStatuses(rawStatuses) {
  const entries = normaliseArrayParam(rawStatuses);
  if (!entries.length) {
    return [];
  }
  const normalized = new Set();
  entries.forEach((entry) => {
    const lowered = `${entry}`.trim().toLowerCase();
    if (LAUNCHPAD_APPLICATION_STATUSES.includes(lowered)) {
      normalized.add(lowered);
    }
  });
  return [...normalized];
}

function computeMatchAgainstText(text, candidateSkills, learningGoals) {
  if (!text) {
    return { score: 0, matchedSkills: [], learningMatches: [] };
  }

  const haystack = text.toLowerCase();
  const matchedSkills = candidateSkills
    .filter((entry) => haystack.includes(entry.key))
    .map((entry) => entry.label);
  const learningMatches = learningGoals
    .filter((entry) => haystack.includes(entry.key))
    .map((entry) => entry.label);

  const denominator = new Set([
    ...candidateSkills.map((entry) => entry.key),
    ...learningGoals.map((entry) => entry.key),
  ]).size;

  if (!denominator) {
    return { score: 0, matchedSkills, learningMatches };
  }

  const weighted = matchedSkills.length + learningMatches.length * 0.6;
  const score = Math.min(1, Math.round((weighted / denominator) * 100) / 100);

  return { score, matchedSkills, learningMatches };
}

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function entryDateValue(value) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function evaluateCandidateReadiness(launchpad, { yearsExperience, skills, targetSkills, portfolioUrl, motivations }) {
  const criteria = launchpad.eligibilityCriteria ?? {};
  const minimumExperience = Number.isFinite(Number(criteria.minimumExperience))
    ? Number(criteria.minimumExperience)
    : 0;
  const requiredSkills = Array.isArray(criteria.requiredSkills)
    ? criteria.requiredSkills.map((skill) => `${skill}`.trim()).filter(Boolean)
    : [];
  const requiresPortfolio = Boolean(criteria.requiresPortfolio);
  const autoAdvanceScore = Number.isFinite(Number(criteria.autoAdvanceScore))
    ? Number(criteria.autoAdvanceScore)
    : 75;
  const autoAcceptScore = Number.isFinite(Number(criteria.autoAcceptScore))
    ? Number(criteria.autoAcceptScore)
    : 88;

  const evaluatedSkills = skills.map((skill) => skill.toLowerCase());
  const learningGoals = Array.isArray(targetSkills)
    ? targetSkills.map((skill) => `${skill}`.trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedRequired = requiredSkills.map((skill) => skill.toLowerCase());

  let score = 55;
  const years = Number.isFinite(Number(yearsExperience)) ? Number(yearsExperience) : 0;
  const meetsExperience = years >= minimumExperience;
  if (Number.isFinite(yearsExperience)) {
    score += Math.min(20, Math.max(0, years - minimumExperience) * 4);
  } else if (minimumExperience > 0) {
    score -= 10;
  }

  const missingSkills = normalizedRequired.filter((skill) => !evaluatedSkills.includes(skill));
  const learningAlignedMissing = missingSkills.filter((skill) => learningGoals.includes(skill));
  const matchedSkills = normalizedRequired.filter((skill) => evaluatedSkills.includes(skill));
  score += matchedSkills.length * 5;
  score -= missingSkills.length * 7;
  if (learningAlignedMissing.length) {
    score += learningAlignedMissing.length * 4;
  }

  if (requiresPortfolio) {
    score += portfolioUrl ? 8 : -12;
  } else if (portfolioUrl) {
    score += 4;
  }

  if (typeof motivations === 'string' && motivations.trim().length > 0) {
    score += Math.min(10, Math.floor(motivations.trim().length / 80) * 4 + 3);
  }

  const normalizedScore = clampScore(score);
  const flags = new Set();
  let recommendedStatus = 'screening';
  if (!meetsExperience || missingSkills.length > 0) {
    recommendedStatus = learningAlignedMissing.length === missingSkills.length ? 'screening' : 'waitlisted';
    if (!meetsExperience) {
      flags.add('below_experience_threshold');
    }
    if (missingSkills.length) {
      flags.add('missing_required_skills');
      if (learningAlignedMissing.length) {
        flags.add('learning_goals_cover_skill_gaps');
      }
    }
  } else {
    flags.add('meets_experience_threshold');
  }
  if (normalizedScore >= autoAdvanceScore && missingSkills.length === 0 && meetsExperience) {
    recommendedStatus = 'interview';
    flags.add('meets_auto_advance_threshold');
  }
  if (normalizedScore >= autoAcceptScore && missingSkills.length === 0 && meetsExperience) {
    recommendedStatus = 'accepted';
    flags.add('meets_auto_accept_threshold');
  }
  if (requiresPortfolio && !portfolioUrl) {
    recommendedStatus = 'waitlisted';
    flags.add('portfolio_required');
    flags.add('portfolio_missing');
  } else if (requiresPortfolio) {
    flags.add('portfolio_required');
  }
  if (!requiresPortfolio && portfolioUrl) {
    flags.add('portfolio_submitted');
  }
  if (matchedSkills.length === normalizedRequired.length && normalizedRequired.length > 0) {
    flags.add('all_required_skills_met');
  }
  if (typeof motivations === 'string' && motivations.trim().length > 200) {
    flags.add('motivations_detail_high');
  }

  return {
    score: normalizedScore,
    recommendedStatus,
    flags: Array.from(flags),
    snapshot: {
      criteria: {
        minimumExperience,
        requiredSkills,
        requiresPortfolio,
        autoAdvanceScore,
        autoAcceptScore,
      },
      evaluation: {
        meetsExperience,
        matchedSkills,
        missingSkills,
        learningAlignedMissing,
        hasPortfolio: Boolean(portfolioUrl),
        motivationLength: typeof motivations === 'string' ? motivations.trim().length : 0,
      },
      candidate: {
        yearsExperience: Number.isFinite(Number(yearsExperience)) ? Number(yearsExperience) : null,
        skills,
        targetSkills: Array.isArray(targetSkills) ? targetSkills : [],
      },
    },
  };
}

async function resolveApplicant(payload, trx) {
  if (payload.applicantId) {
    const applicant = await User.findByPk(payload.applicantId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!applicant) {
      throw new NotFoundError('Applicant account not found.');
    }
    return applicant;
  }

  const applicantEmailRaw = payload.applicantEmail ?? payload.contactEmail;
  if (!applicantEmailRaw) {
    throw new ValidationError('An applicantId or applicantEmail is required to join the Experience Launchpad.');
  }

  const applicantEmail = `${applicantEmailRaw}`.trim().toLowerCase();
  const existing = await User.findOne({
    where: { email: applicantEmail },
    transaction: trx,
    lock: trx.LOCK.UPDATE,
  });
  if (existing) {
    return existing;
  }

  const firstName = `${payload.applicantFirstName ?? payload.firstName ?? 'Launchpad'}`.trim() || 'Launchpad';
  const lastName = `${payload.applicantLastName ?? payload.lastName ?? 'Candidate'}`.trim() || 'Candidate';
  const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);

  return User.create(
    {
      firstName,
      lastName,
      email: applicantEmail,
      password: hashedPassword,
      userType: 'freelancer',
    },
    { transaction: trx },
  );
}

async function ensureTargetExists(targetType, targetId, trx) {
  if (targetType === 'job') {
    const job = await Job.findByPk(targetId, { transaction: trx });
    if (!job) {
      throw new NotFoundError('Linked job could not be found.');
    }
    return;
  }

  if (targetType === 'gig') {
    const gig = await Gig.findByPk(targetId, { transaction: trx });
    if (!gig) {
      throw new NotFoundError('Linked gig could not be found.');
    }
    return;
  }

  if (targetType === 'project') {
    const project = await Project.findByPk(targetId, { transaction: trx });
    if (!project) {
      throw new NotFoundError('Linked project could not be found.');
    }
    return;
  }

  if (targetType === 'volunteering') {
    const role = await Volunteering.findByPk(targetId, { transaction: trx });
    if (!role) {
      throw new NotFoundError('Linked volunteering role could not be found.');
    }
    return;
  }
}

function invalidateLaunchpadCaches(launchpadId) {
  appCache.flushByPrefix(APPLICATION_CACHE_PREFIX);
  if (launchpadId) {
    appCache.flushByPrefix(buildCacheKey('launchpad:dashboard', { launchpadId }));
    appCache.flushByPrefix(buildCacheKey(WORKFLOW_CACHE_PREFIX, { launchpadId }));
  }
}

export async function applyToLaunchpad(payload) {
  const {
    launchpadId,
    applicantId,
    applicantEmail,
    applicantFirstName,
    applicantLastName,
    yearsExperience,
    skills: rawSkills,
    targetSkills: rawTargetSkills,
    portfolioUrl,
    motivations,
    availabilityDate,
    applicationId,
  } = payload ?? {};

  if (!launchpadId) {
    throw new ValidationError('launchpadId is required.');
  }

  const skills = normaliseSkills(rawSkills);
  const targetSkills = normaliseSkills(rawTargetSkills);

  const result = await sequelize.transaction(async (trx) => {
    const launchpad = await ExperienceLaunchpad.findByPk(launchpadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    ensureLaunchpadExists(launchpad);
    if (launchpad.status === 'archived') {
      throw new ConflictError('This Experience Launchpad is archived and no longer accepting applications.');
    }

    if (applicationId) {
      const existingApplication = await Application.findByPk(applicationId, { transaction: trx });
      if (!existingApplication) {
        throw new ValidationError('Referenced application could not be found.');
      }
    }

    const applicant = await resolveApplicant(
      { applicantId, applicantEmail, applicantFirstName, applicantLastName },
      trx,
    );

    const duplicate = await ExperienceLaunchpadApplication.findOne({
      where: {
        launchpadId,
        applicantId: applicant.id,
        status: { [Op.notIn]: ['withdrawn', 'rejected', 'completed'] },
      },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (duplicate) {
      throw new ConflictError('Applicant already has an active Experience Launchpad submission.');
    }

    const { score, recommendedStatus, snapshot } = evaluateCandidateReadiness(launchpad, {
      yearsExperience,
      skills,
      targetSkills,
      portfolioUrl,
      motivations,
    });

    const enrichedSnapshot = {
      ...snapshot,
      candidate: {
        ...(snapshot.candidate ?? {}),
        skills,
        targetSkills,
      },
      recommendation: {
        recommendedStatus,
        generatedAt: new Date().toISOString(),
        qualificationScore: score,
      },
    };

    const created = await ExperienceLaunchpadApplication.create(
      {
        launchpadId,
        applicantId: applicant.id,
        applicationId: applicationId ?? null,
        status: recommendedStatus,
        qualificationScore: score,
        yearsExperience: Number.isFinite(Number(yearsExperience)) ? Number(yearsExperience) : null,
        skills,
        motivations: motivations ?? null,
        portfolioUrl: portfolioUrl ?? null,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        eligibilitySnapshot: enrichedSnapshot,
      },
      { transaction: trx },
    );

    invalidateLaunchpadCaches(launchpadId);

    const hydrated = await ExperienceLaunchpadApplication.findByPk(created.id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: ExperienceLaunchpad, as: 'launchpad' },
      ],
      transaction: trx,
    });

    return hydrated?.toPublicObject() ?? created.toPublicObject();
  });

  return result;
}

export async function updateLaunchpadApplicationStatus(applicationId, payload = {}) {
  if (!applicationId) {
    throw new ValidationError('applicationId is required.');
  }

  const { status, assignedMentor, interviewScheduledAt, decisionNotes } = payload;
  if (!status) {
    throw new ValidationError('status is required.');
  }
  if (!LAUNCHPAD_APPLICATION_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported status "${status}".`);
  }

  const updated = await sequelize.transaction(async (trx) => {
    const application = await ExperienceLaunchpadApplication.findByPk(applicationId, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!application) {
      throw new NotFoundError('Experience Launchpad application not found.');
    }

    if (application.status === status) {
      return application;
    }

    const allowedStatuses = APPLICATION_STATUS_TRANSITIONS[application.status] ?? new Set();
    if (!allowedStatuses.has(status)) {
      throw new ConflictError(`Cannot transition launchpad application from ${application.status} to ${status}.`);
    }

    application.status = status;
    if (assignedMentor !== undefined) {
      application.assignedMentor = assignedMentor || null;
    }
    if (interviewScheduledAt !== undefined) {
      application.interviewScheduledAt = interviewScheduledAt ? new Date(interviewScheduledAt) : null;
    }
    if (decisionNotes !== undefined) {
      application.decisionNotes = decisionNotes || null;
    }

    await application.save({ transaction: trx });

    invalidateLaunchpadCaches(application.launchpadId);

    const hydrated = await ExperienceLaunchpadApplication.findByPk(application.id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: ExperienceLaunchpad, as: 'launchpad' },
      ],
      transaction: trx,
    });

    return hydrated?.toPublicObject() ?? application.toPublicObject();
  });

  return updated;
}

export async function submitEmployerRequest(payload, { actorId } = {}) {
  const {
    launchpadId,
    organizationName,
    contactName,
    contactEmail,
    headcount,
    engagementTypes,
    targetStartDate,
    idealCandidateProfile,
    hiringNotes,
    slaCommitmentDays,
    metadata,
  } = payload ?? {};

  if (!launchpadId || !organizationName || !contactName || !contactEmail) {
    throw new ValidationError('launchpadId, organizationName, contactName, and contactEmail are required.');
  }

  const normalizedEngagementTypes = engagementTypes ? normaliseSkills(engagementTypes) : [];

  const created = await sequelize.transaction(async (trx) => {
    const launchpad = await ExperienceLaunchpad.findByPk(launchpadId, { transaction: trx });
    ensureLaunchpadExists(launchpad);

    const request = await ExperienceLaunchpadEmployerRequest.create(
      {
        launchpadId,
        organizationName,
        contactName,
        contactEmail: `${contactEmail}`.trim().toLowerCase(),
        headcount: Number.isFinite(Number(headcount)) ? Number(headcount) : null,
        engagementTypes: normalizedEngagementTypes,
        targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
        idealCandidateProfile: idealCandidateProfile ?? null,
        hiringNotes: hiringNotes ?? null,
        status: 'new',
        slaCommitmentDays: Number.isFinite(Number(slaCommitmentDays)) ? Number(slaCommitmentDays) : null,
        createdById: actorId ?? null,
        metadata: metadata ?? null,
      },
      { transaction: trx },
    );

    invalidateLaunchpadCaches(launchpadId);

    return request.toPublicObject();
  });

  return created;
}

export async function linkLaunchpadOpportunity(payload, { actorId } = {}) {
  const { launchpadId, targetType, targetId, source = 'manual', notes } = payload ?? {};
  if (!launchpadId || !targetType || !targetId) {
    throw new ValidationError('launchpadId, targetType, and targetId are required.');
  }
  if (!LAUNCHPAD_TARGET_TYPES.includes(targetType)) {
    throw new ValidationError(`targetType must be one of: ${LAUNCHPAD_TARGET_TYPES.join(', ')}.`);
  }
  if (!LAUNCHPAD_OPPORTUNITY_SOURCES.includes(source)) {
    throw new ValidationError(`source must be one of: ${LAUNCHPAD_OPPORTUNITY_SOURCES.join(', ')}.`);
  }

  const normalizedTargetId = Number(targetId);
  if (!Number.isFinite(normalizedTargetId)) {
    throw new ValidationError('targetId must be numeric.');
  }

  const record = await sequelize.transaction(async (trx) => {
    const launchpad = await ExperienceLaunchpad.findByPk(launchpadId, { transaction: trx });
    ensureLaunchpadExists(launchpad);

    await ensureTargetExists(targetType, normalizedTargetId, trx);

    const existing = await ExperienceLaunchpadOpportunityLink.findOne({
      where: { launchpadId, targetType, targetId: normalizedTargetId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (existing) {
      existing.source = source;
      existing.notes = notes ?? existing.notes;
      if (actorId) {
        existing.createdById = actorId;
      }
      await existing.save({ transaction: trx });
      invalidateLaunchpadCaches(launchpadId);
      return existing.toPublicObject();
    }

    const created = await ExperienceLaunchpadOpportunityLink.create(
      {
        launchpadId,
        targetType,
        targetId: normalizedTargetId,
        source,
        createdById: actorId ?? null,
        notes: notes ?? null,
      },
      { transaction: trx },
    );

    invalidateLaunchpadCaches(launchpadId);

    return created.toPublicObject();
  });

  return record;
}

export async function recordLaunchpadPlacement(payload, { actorId } = {}) {
  const {
    launchpadId,
    candidateId,
    employerRequestId,
    targetType = 'project',
    targetId,
    status = 'scheduled',
    placementDate,
    endDate,
    compensation,
    feedbackScore,
  } = payload ?? {};

  if (!launchpadId || !candidateId) {
    throw new ValidationError('launchpadId and candidateId are required.');
  }
  if (!LAUNCHPAD_PLACEMENT_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${LAUNCHPAD_PLACEMENT_STATUSES.join(', ')}.`);
  }
  if (targetType && !LAUNCHPAD_TARGET_TYPES.includes(targetType)) {
    throw new ValidationError(`targetType must be one of: ${LAUNCHPAD_TARGET_TYPES.join(', ')}.`);
  }

  const placement = await sequelize.transaction(async (trx) => {
    const candidate = await ExperienceLaunchpadApplication.findByPk(candidateId, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!candidate || candidate.launchpadId !== Number(launchpadId)) {
      throw new NotFoundError('Launchpad candidate not found for the specified programme.');
    }

    if (targetType && targetId != null) {
      await ensureTargetExists(targetType, targetId, trx);
    }

    if (employerRequestId) {
      const request = await ExperienceLaunchpadEmployerRequest.findByPk(employerRequestId, {
        transaction: trx,
      });
      if (!request) {
        throw new NotFoundError('Employer request not found for placement linkage.');
      }
    }

    const created = await ExperienceLaunchpadPlacement.create(
      {
        launchpadId,
        candidateId,
        employerRequestId: employerRequestId ?? null,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        status,
        placementDate: placementDate ? new Date(placementDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        compensation: compensation ?? null,
        feedbackScore: Number.isFinite(Number(feedbackScore)) ? Number(feedbackScore) : null,
      },
      { transaction: trx },
    );

    if (status === 'completed') {
      candidate.status = 'completed';
    } else if (status === 'scheduled' && candidate.status === 'interview') {
      candidate.status = 'accepted';
    }
    if (actorId) {
      candidate.decisionNotes = [candidate.decisionNotes, `Updated via placement by actor ${actorId}`]
        .filter(Boolean)
        .join(' — ');
    }
    await candidate.save({ transaction: trx });

    await ExperienceLaunchpadOpportunityLink.findOrCreate({
      where: { launchpadId, targetType, targetId: targetId ?? null },
      defaults: {
        launchpadId,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        source: 'placement',
        createdById: actorId ?? null,
        notes: 'Automatically generated from placement workflow.',
      },
      transaction: trx,
    });

    invalidateLaunchpadCaches(launchpadId);

    const hydrated = await ExperienceLaunchpadPlacement.findByPk(created.id, {
      include: [
        { model: ExperienceLaunchpadApplication, as: 'candidate' },
        { model: ExperienceLaunchpadEmployerRequest, as: 'employerRequest' },
      ],
      transaction: trx,
    });

    return hydrated?.toPublicObject() ?? created.toPublicObject();
  });

  return placement;
}

function summariseText(text, limit = 220) {
  if (!text) {
    return '';
  }
  const trimmed = text.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit).trim()}…`;
}

async function loadLinkedOpportunityMaps(links) {
  const grouped = links.reduce(
    (acc, link) => {
      const plain = typeof link.get === 'function' ? link.get({ plain: true }) : link;
      if (plain.targetType && Array.isArray(acc[plain.targetType])) {
        acc[plain.targetType].push(plain.targetId);
      }
      return acc;
    },
    { job: [], gig: [], project: [], volunteering: [] },
  );

  const [jobs, gigs, projects, volunteeringRoles] = await Promise.all([
    grouped.job.length
      ? Job.findAll({ where: { id: { [Op.in]: grouped.job } } })
      : [],
    grouped.gig.length
      ? Gig.findAll({ where: { id: { [Op.in]: grouped.gig } } })
      : [],
    grouped.project.length
      ? Project.findAll({ where: { id: { [Op.in]: grouped.project } } })
      : [],
    grouped.volunteering.length
      ? Volunteering.findAll({ where: { id: { [Op.in]: grouped.volunteering } } })
      : [],
  ]);

  const jobMap = new Map(jobs.map((record) => [record.id, record]));
  const gigMap = new Map(gigs.map((record) => [record.id, record]));
  const projectMap = new Map(projects.map((record) => [record.id, record]));
  const volunteeringMap = new Map(volunteeringRoles.map((record) => [record.id, record]));

  return { jobMap, gigMap, projectMap, volunteeringMap };
}

function buildOpportunitySummary(link, maps) {
  const plainLink = typeof link.get === 'function' ? link.get({ plain: true }) : link;
  let record = null;
  if (plainLink.targetType === 'job') {
    record = maps.jobMap.get(plainLink.targetId);
  } else if (plainLink.targetType === 'gig') {
    record = maps.gigMap.get(plainLink.targetId);
  } else if (plainLink.targetType === 'project') {
    record = maps.projectMap.get(plainLink.targetId);
  } else if (plainLink.targetType === 'volunteering') {
    record = maps.volunteeringMap.get(plainLink.targetId);
  }

  if (!record) {
    return null;
  }

  const plainRecord = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const description = plainRecord.description ?? plainRecord.summary ?? '';
  const organization = plainRecord.organization ? `${plainRecord.organization}`.trim() : '';
  const title = plainRecord.title ?? 'Untitled opportunity';
  const updatedAt = plainRecord.updatedAt ?? plainRecord.createdAt ?? plainLink.updatedAt ?? null;
  const headline = organization && plainLink.targetType === 'volunteering' ? `${title} · ${organization}` : title;
  const matchText = [title, organization, description].filter(Boolean).join(' ');

  return {
    id: plainLink.id,
    targetType: plainLink.targetType,
    targetId: plainLink.targetId,
    source: plainLink.source,
    notes: plainLink.notes ?? null,
    createdAt: plainLink.createdAt ?? null,
    updatedAt,
    title: headline,
    description,
    summary: summariseText(description || plainRecord.summary || ''),
    textForMatching: matchText.trim(),
  };
}

function buildCandidateProfile(application) {
  const plain = typeof application.get === 'function' ? application.get({ plain: true }) : application;
  const applicant = plain.applicant ?? {};
  const applicantName = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ').trim();
  const skills = Array.isArray(plain.skills) ? plain.skills : [];
  const normalizedSkills = normaliseSkillTokens(skills);
  const snapshotCandidate = plain.eligibilitySnapshot?.candidate ?? {};
  const targetSkills = Array.isArray(snapshotCandidate.targetSkills) ? snapshotCandidate.targetSkills : [];
  const learningGoals = normaliseSkillTokens(targetSkills);

  return {
    applicationId: plain.id,
    applicantId: plain.applicantId ?? applicant.id ?? null,
    applicantName: applicantName || `Application #${plain.id}`,
    status: plain.status,
    normalizedSkills,
    learningGoals,
    displaySkills: skills,
    displayLearningGoals: targetSkills,
  };
}

async function computeOpportunityMatches(links, applications) {
  if (!links.length || !applications.length) {
    return [];
  }

  const maps = await loadLinkedOpportunityMaps(links);
  const candidates = applications.map((application) => buildCandidateProfile(application));

  const matches = [];

  links.forEach((link) => {
    const opportunity = buildOpportunitySummary(link, maps);
    if (!opportunity || !opportunity.textForMatching) {
      return;
    }

    let topMatch = null;
    candidates.forEach((candidate) => {
      const { score, matchedSkills, learningMatches } = computeMatchAgainstText(
        opportunity.textForMatching,
        candidate.normalizedSkills,
        candidate.learningGoals,
      );

      if (score <= 0) {
        return;
      }

      if (!topMatch || score > topMatch.score) {
        topMatch = {
          candidate,
          score,
          matchedSkills,
          learningMatches,
        };
      }
    });

    if (topMatch) {
      matches.push({
        id: opportunity.id,
        targetType: opportunity.targetType,
        targetId: opportunity.targetId,
        source: opportunity.source,
        notes: opportunity.notes,
        opportunity: {
          title: opportunity.title,
          summary: opportunity.summary,
          updatedAt: opportunity.updatedAt,
        },
        bestCandidate: {
          applicationId: topMatch.candidate.applicationId,
          applicantId: topMatch.candidate.applicantId,
          name: topMatch.candidate.applicantName,
          status: topMatch.candidate.status,
          score: topMatch.score,
          matchedSkills: topMatch.matchedSkills,
          learningMatches: topMatch.learningMatches,
        },
        autoAssigned: topMatch.score >= AUTO_ASSIGN_MATCH_THRESHOLD,
      });
    }
  });

  matches.sort((a, b) => b.bestCandidate.score - a.bestCandidate.score);

  return matches;
}

export async function listLaunchpadApplications(filters = {}) {
  const {
    launchpadId,
    statuses,
    search,
    minScore,
    maxScore,
    page = 1,
    pageSize = 25,
    sort = 'score_desc',
    includeMatches = false,
  } = filters;

  if (!launchpadId) {
    throw new ValidationError('launchpadId is required to list applications.');
  }

  const normalizedPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const normalizedPageSize = Number.isFinite(Number(pageSize))
    ? Math.min(100, Math.max(1, Number(pageSize)))
    : 25;

  const offset = (normalizedPage - 1) * normalizedPageSize;
  const where = { launchpadId };

  const normalizedStatuses = normaliseApplicationStatuses(statuses);
  if (normalizedStatuses.length) {
    where.status = { [Op.in]: normalizedStatuses };
  }

  const scoreClause = {};
  if (Number.isFinite(Number(minScore))) {
    scoreClause[Op.gte] = Number(minScore);
  }
  if (Number.isFinite(Number(maxScore))) {
    scoreClause[Op.lte] = Number(maxScore);
  }
  if (Object.keys(scoreClause).length) {
    where.qualificationScore = scoreClause;
  }

  const andConditions = [];
  const searchTerm = typeof search === 'string' ? search.trim() : '';
  if (searchTerm) {
    const tokens = searchTerm
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const likeOperator = Op.iLike ?? Op.like;
    tokens.forEach((token) => {
      andConditions.push({
        [Op.or]: [
          { '$applicant.firstName$': { [likeOperator]: `%${token}%` } },
          { '$applicant.lastName$': { [likeOperator]: `%${token}%` } },
          { '$applicant.email$': { [likeOperator]: `%${token}%` } },
        ],
      });
    });
  }
  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  const order = [];
  if (sort === 'recent') {
    order.push(['updatedAt', 'DESC']);
  } else if (sort === 'score_asc') {
    order.push([sequelize.literal('"ExperienceLaunchpadApplication"."qualificationScore" IS NULL'), 'ASC']);
    order.push(['qualificationScore', 'ASC']);
    order.push(['createdAt', 'DESC']);
  } else {
    order.push([sequelize.literal('"ExperienceLaunchpadApplication"."qualificationScore" IS NULL'), 'ASC']);
    order.push(['qualificationScore', 'DESC']);
    order.push(['createdAt', 'DESC']);
  }

  const query = await ExperienceLaunchpadApplication.findAndCountAll({
    where,
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: ExperienceLaunchpadPlacement,
        as: 'placements',
        attributes: ['id', 'status', 'targetType', 'targetId', 'placementDate', 'endDate', 'createdAt'],
        separate: true,
        order: [['placementDate', 'DESC']],
        limit: 5,
      },
    ],
    order,
    limit: normalizedPageSize,
    offset,
    distinct: true,
  });

  const statusTotalsPromise = ExperienceLaunchpadApplication.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    where: { launchpadId },
    group: ['status'],
    raw: true,
  });

  let matches = [];
  if (includeMatches && query.rows.length) {
    const links = await ExperienceLaunchpadOpportunityLink.findAll({
      where: { launchpadId },
    });
    matches = await computeOpportunityMatches(links, query.rows);
  }

  const statusTotals = await statusTotalsPromise;

  const matchMap = new Map();
  matches.forEach((match) => {
    const candidate = match.bestCandidate;
    if (!candidate) {
      return;
    }
    const existing = matchMap.get(candidate.applicationId);
    if (!existing || (candidate.score ?? 0) > (existing.score ?? 0)) {
      matchMap.set(candidate.applicationId, {
        score: candidate.score,
        matchedSkills: candidate.matchedSkills ?? [],
        learningMatches: candidate.learningMatches ?? [],
        opportunity: {
          id: match.id,
          targetType: match.targetType,
          targetId: match.targetId,
          title: match.opportunity?.title ?? null,
          summary: match.opportunity?.summary ?? null,
          source: match.source ?? null,
          updatedAt: match.opportunity?.updatedAt ?? null,
        },
        autoAssigned: Boolean(match.autoAssigned),
      });
    }
  });

  const items = query.rows.map((application) => {
    const base = application.toPublicObject();
    const applicantRecord = application.applicant;
    const applicant = applicantRecord
      ? {
          id: applicantRecord.id,
          firstName: applicantRecord.firstName,
          lastName: applicantRecord.lastName,
          email: applicantRecord.email,
        }
      : null;

    const placements = Array.isArray(application.placements)
      ? application.placements.map((placement) => {
          const plain = typeof placement.get === 'function' ? placement.get({ plain: true }) : placement;
          return {
            id: plain.id,
            status: plain.status,
            targetType: plain.targetType,
            targetId: plain.targetId,
            placementDate: plain.placementDate,
            endDate: plain.endDate,
            createdAt: plain.createdAt,
          };
        })
      : [];

    const snapshot = base.eligibilitySnapshot ?? {};
    const snapshotCandidate = snapshot.candidate ?? {};
    const evaluation = snapshot.evaluation ?? {};
    const recommendation = snapshot.recommendation ?? null;

    const readiness = {
      score: base.qualificationScore == null ? null : Number(base.qualificationScore),
      meetsExperience: Boolean(evaluation.meetsExperience),
      matchedSkills: Array.isArray(evaluation.matchedSkills) ? evaluation.matchedSkills : [],
      missingSkills: Array.isArray(evaluation.missingSkills) ? evaluation.missingSkills : [],
      learningAlignedMissing: Array.isArray(evaluation.learningAlignedMissing)
        ? evaluation.learningAlignedMissing
        : [],
      targetSkills: Array.isArray(snapshotCandidate.targetSkills) ? snapshotCandidate.targetSkills : [],
      skills: Array.isArray(base.skills) ? base.skills : [],
      recommendedStatus: recommendation?.recommendedStatus ?? null,
      recommendationGeneratedAt: recommendation?.generatedAt ?? null,
    };

    const matchHighlight = matchMap.get(base.id) ?? null;

    return {
      ...base,
      applicant,
      placements,
      readiness,
      matchHighlight,
    };
  });

  const statusBreakdown = Object.fromEntries(
    LAUNCHPAD_APPLICATION_STATUSES.map((status) => [status, 0]),
  );
  statusTotals.forEach((row) => {
    statusBreakdown[row.status] = Number(row.count) || 0;
  });

  const totalItems = Number(query.count) || 0;
  const totalPages = Math.ceil(totalItems / normalizedPageSize) || 0;

  return {
    items,
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      total: totalItems,
      totalPages,
    },
    statusBreakdown,
  };
}

export async function getLaunchpadDashboard(launchpadId, { lookbackDays = 60 } = {}) {
  const whereClause = launchpadId ? { launchpadId } : {};
  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const cacheKey = buildCacheKey('launchpad:dashboard', { launchpadId: launchpadId ?? 'all', lookbackDays });

  return appCache.remember(cacheKey, 60, async () => {
    const [
      pipelineRows,
      placementRows,
      upcomingInterviews,
      employerBriefs,
      opportunityRows,
      launchpad,
      opportunityLinks,
      activeApplications,
      placementSamples,
    ] = await Promise.all([
      ExperienceLaunchpadApplication.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        where: whereClause,
        group: ['status'],
        raw: true,
      }),
      ExperienceLaunchpadPlacement.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        where: { ...whereClause, createdAt: { [Op.gte]: lookbackDate } },
        group: ['status'],
        raw: true,
      }),
      ExperienceLaunchpadApplication.findAll({
        where: {
          ...whereClause,
          status: 'interview',
          interviewScheduledAt: { [Op.gte]: now },
        },
        include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['interviewScheduledAt', 'ASC']],
        limit: 5,
      }),
      ExperienceLaunchpadEmployerRequest.findAll({
        where: {
          ...whereClause,
          status: { [Op.in]: ['new', 'needs_review', 'approved'] },
        },
        order: [['updatedAt', 'DESC']],
        limit: 5,
      }),
      ExperienceLaunchpadOpportunityLink.findAll({
        attributes: ['targetType', [fn('COUNT', col('id')), 'count']],
        where: whereClause,
        group: ['targetType'],
        raw: true,
      }),
      launchpadId ? ExperienceLaunchpad.findByPk(launchpadId) : null,
      launchpadId
        ? ExperienceLaunchpadOpportunityLink.findAll({
            where: { launchpadId },
            order: [['updatedAt', 'DESC']],
          })
        : [],
      launchpadId
        ? ExperienceLaunchpadApplication.findAll({
            where: {
              launchpadId,
              status: { [Op.in]: ['screening', 'interview', 'accepted', 'waitlisted'] },
            },
            include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName'] }],
          })
        : [],
      launchpadId
        ? ExperienceLaunchpadPlacement.findAll({
            attributes: ['placementDate', 'createdAt'],
            where: {
              launchpadId,
              placementDate: { [Op.ne]: null, [Op.gte]: lookbackDate },
            },
            order: [['placementDate', 'DESC']],
            limit: 25,
            raw: true,
          })
        : [],
    ]);

    const pipeline = Object.fromEntries(LAUNCHPAD_APPLICATION_STATUSES.map((status) => [status, 0]));
    pipelineRows.forEach((row) => {
      pipeline[row.status] = Number(row.count) || 0;
    });

    const placements = Object.fromEntries(LAUNCHPAD_PLACEMENT_STATUSES.map((status) => [status, 0]));
    placementRows.forEach((row) => {
      placements[row.status] = Number(row.count) || 0;
    });

    const totalApplications = Object.values(pipeline).reduce((sum, value) => sum + value, 0);
    const acceptedPool = (pipeline.accepted ?? 0) + (pipeline.completed ?? 0);
    const completedPlacements = placements.completed ?? 0;
    const conversionRate = acceptedPool > 0 ? Math.round((completedPlacements / acceptedPool) * 10000) / 100 : 0;

    const opportunities = Object.fromEntries(LAUNCHPAD_TARGET_TYPES.map((type) => [type, 0]));
    opportunityRows.forEach((row) => {
      opportunities[row.targetType] = Number(row.count) || 0;
    });

    const matches = launchpadId ? await computeOpportunityMatches(opportunityLinks, activeApplications) : [];
    const autoAssignmentsCount = matches.filter((match) => match.autoAssigned).length;

    const totalOpportunities = Object.values(opportunities).reduce((sum, value) => sum + value, 0);
    const volunteerTotals = ['volunteering', 'volunteer', 'community'].reduce(
      (sum, key) => sum + (Number(opportunities[key]) || 0),
      0,
    );
    const volunteerOpportunityShare =
      totalOpportunities > 0 ? Math.round((volunteerTotals / totalOpportunities) * 100) : 0;

    const interviewRate =
      totalApplications > 0 ? Math.round(((pipeline.interview ?? 0) / totalApplications) * 100) : 0;

    const placementVelocityDays = (() => {
      if (!placementSamples.length) {
        return null;
      }
      const durations = placementSamples
        .map((placement) => {
          const placementDate = placement.placementDate ? new Date(placement.placementDate) : null;
          const createdAt = placement.createdAt ? new Date(placement.createdAt) : null;
          if (!placementDate || Number.isNaN(placementDate.getTime())) {
            return null;
          }
          const end = placementDate.getTime();
          const start = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getTime() : end;
          const deltaDays = (end - start) / (1000 * 60 * 60 * 24);
          if (!Number.isFinite(deltaDays) || deltaDays < 0) {
            return null;
          }
          return deltaDays;
        })
        .filter((value) => Number.isFinite(value));
      if (!durations.length) {
        return null;
      }
      const total = durations.reduce((sum, value) => sum + value, 0);
      return Math.round((total / durations.length) * 10) / 10;
    })();

    return {
      launchpad: launchpad ? launchpad.toPublicObject() : null,
      totals: {
        applications: totalApplications,
        placements: Object.values(placements).reduce((sum, value) => sum + value, 0),
        conversionRate,
        autoAssignments: autoAssignmentsCount,
      },
      pipeline,
      placements,
      impactHighlights: {
        interviewRate,
        placementVelocityDays,
        volunteerOpportunityShare,
      },
      upcomingInterviews: upcomingInterviews.map((record) => ({
        ...record.toPublicObject(),
        applicant: record.applicant
          ? {
              id: record.applicant.id,
              firstName: record.applicant.firstName,
              lastName: record.applicant.lastName,
              email: record.applicant.email,
            }
          : null,
      })),
      employerBriefs: employerBriefs.map((brief) => brief.toPublicObject()),
      opportunities,
      matches,
      refreshedAt: new Date().toISOString(),
    };
  });
}

export async function getLaunchpadWorkflow(launchpadId, { lookbackDays = 45 } = {}) {
  if (!launchpadId) {
    throw new ValidationError('launchpadId is required to load the Experience Launchpad workflow.');
  }

  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const cacheKey = buildCacheKey(WORKFLOW_CACHE_PREFIX, { launchpadId, lookbackDays });

  return appCache.remember(cacheKey, 30, async () => {
    const [
      launchpad,
      applications,
      placements,
      employerBriefs,
      opportunityLinks,
    ] = await Promise.all([
      ExperienceLaunchpad.findByPk(launchpadId),
      ExperienceLaunchpadApplication.findAll({
        where: { launchpadId },
        include: [
          { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: ExperienceLaunchpadPlacement, as: 'placements' },
        ],
        order: [
          ['status', 'ASC'],
          ['qualificationScore', 'DESC'],
        ],
      }),
      ExperienceLaunchpadPlacement.findAll({
        where: {
          launchpadId,
          createdAt: { [Op.gte]: lookbackDate },
        },
        include: [
          {
            model: ExperienceLaunchpadApplication,
            as: 'candidate',
            include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
          { model: ExperienceLaunchpadEmployerRequest, as: 'employerRequest' },
        ],
        order: [['createdAt', 'DESC']],
      }),
      ExperienceLaunchpadEmployerRequest.findAll({
        where: { launchpadId },
        order: [['updatedAt', 'DESC']],
      }),
      ExperienceLaunchpadOpportunityLink.findAll({ where: { launchpadId } }),
    ]);

    ensureLaunchpadExists(launchpad);

    const applicationEntries = applications.map((application) => {
      const base = application.toPublicObject();
      const applicantRecord = application.applicant;
      const applicant = applicantRecord
        ? {
            id: applicantRecord.id,
            firstName: applicantRecord.firstName,
            lastName: applicantRecord.lastName,
            email: applicantRecord.email,
          }
        : null;

      const snapshot = base.eligibilitySnapshot ?? {};
      const snapshotCandidate = snapshot.candidate ?? {};
      const evaluation = snapshot.evaluation ?? {};
      const recommendation = snapshot.recommendation ?? {};

      const readiness = {
        score: base.qualificationScore == null ? null : Number(base.qualificationScore),
        meetsExperience: Boolean(evaluation.meetsExperience),
        matchedSkills: Array.isArray(evaluation.matchedSkills) ? evaluation.matchedSkills : [],
        missingSkills: Array.isArray(evaluation.missingSkills) ? evaluation.missingSkills : [],
        learningAlignedMissing: Array.isArray(evaluation.learningAlignedMissing)
          ? evaluation.learningAlignedMissing
          : [],
        targetSkills: Array.isArray(snapshotCandidate.targetSkills) ? snapshotCandidate.targetSkills : [],
        skills: Array.isArray(base.skills) ? base.skills : [],
        recommendedStatus: recommendation.recommendedStatus ?? null,
        recommendationGeneratedAt: recommendation.generatedAt ?? null,
      };

      const reasonParts = [];
      if ((readiness.missingSkills?.length ?? 0) > 0) {
        reasonParts.push(
          `${readiness.missingSkills.length} core skill gap${readiness.missingSkills.length === 1 ? '' : 's'}`,
        );
      }
      if ((readiness.learningAlignedMissing?.length ?? 0) > 0) {
        reasonParts.push('Learning aligned gaps present');
      }
      if (!reasonParts.length && readiness.recommendedStatus) {
        reasonParts.push(`Recommended: ${readiness.recommendedStatus}`);
      }

      return {
        ...base,
        applicant,
        readiness,
        queueReason: reasonParts.join(' • ') || 'Ready for review',
      };
    });

    const totalApplications = applicationEntries.length;
    const totalReadiness = applicationEntries.reduce(
      (sum, entry) => sum + (Number.isFinite(entry.readiness.score) ? entry.readiness.score : 0),
      0,
    );
    const autoInterviewRecommended = applicationEntries.filter((entry) =>
      ['interview', 'accepted'].includes(entry.readiness.recommendedStatus ?? ''),
    ).length;
    const upskillingCandidates = applicationEntries.filter(
      (entry) => (entry.readiness.learningAlignedMissing?.length ?? 0) > 0,
    ).length;
    const flaggedCandidates = applicationEntries.filter((entry) => entry.status === 'waitlisted').length;

    const readinessSummary = {
      totalApplications,
      averageReadinessScore:
        totalApplications > 0 ? Math.round((totalReadiness / totalApplications) * 10) / 10 : null,
      autoInterviewRecommended,
      upskillingCandidates,
      flaggedCandidates,
    };

    const intakeQueue = applicationEntries
      .filter((entry) => ['screening', 'waitlisted'].includes(entry.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const interviewQueue = applicationEntries
      .filter((entry) => entry.status === 'interview')
      .sort((a, b) => {
        const aTime = entryDateValue(a.interviewScheduledAt);
        const bTime = entryDateValue(b.interviewScheduledAt);
        return aTime - bTime || entryDateValue(a.updatedAt) - entryDateValue(b.updatedAt);
      });

    const acceptedQueue = applicationEntries
      .filter((entry) => entry.status === 'accepted')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const completedQueue = applicationEntries
      .filter((entry) => entry.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const interviewNeedsScheduling = interviewQueue.filter((entry) => !entry.interviewScheduledAt);
    const interviewUpcoming = interviewQueue
      .filter((entry) => entry.interviewScheduledAt)
      .sort((a, b) => entryDateValue(a.interviewScheduledAt) - entryDateValue(b.interviewScheduledAt));

    const placementEntries = placements.map((placement) => {
      const base = placement.toPublicObject();
      const candidateRecord = placement.candidate;
      const employerRecord = placement.employerRequest;

      const candidate = candidateRecord
        ? {
            id: candidateRecord.id,
            applicationId: candidateRecord.id,
            applicant: candidateRecord.applicant
              ? {
                  id: candidateRecord.applicant.id,
                  firstName: candidateRecord.applicant.firstName,
                  lastName: candidateRecord.applicant.lastName,
                  email: candidateRecord.applicant.email,
                }
              : null,
            status: candidateRecord.status,
          }
        : null;

      return {
        ...base,
        candidate,
        employerRequest: employerRecord ? employerRecord.toPublicObject() : null,
      };
    });

    const placementTotals = Object.fromEntries(LAUNCHPAD_PLACEMENT_STATUSES.map((status) => [status, 0]));
    placementEntries.forEach((entry) => {
      placementTotals[entry.status] = (placementTotals[entry.status] ?? 0) + 1;
    });

    const employerEntries = employerBriefs.map((brief) => brief.toPublicObject());
    const employerTotals = employerEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] ?? 0) + 1;
      return acc;
    }, {});

    const matches = await computeOpportunityMatches(opportunityLinks, applications);
    const automationHighlights = matches.slice(0, 8).map((match) => ({
      id: match.id,
      targetType: match.targetType,
      targetId: match.targetId,
      source: match.source,
      autoAssigned: match.autoAssigned,
      opportunity: match.opportunity,
      bestCandidate: match.bestCandidate,
    }));

    return {
      launchpad: launchpad.toPublicObject(),
      refreshedAt: new Date().toISOString(),
      readinessSummary,
      intake: {
        total: intakeQueue.length,
        pendingReview: intakeQueue.filter((entry) => entry.status === 'screening').length,
        queue: intakeQueue.slice(0, 25),
      },
      interviews: {
        total: interviewQueue.length,
        needsScheduling: interviewNeedsScheduling.length,
        upcoming: interviewUpcoming.slice(0, 12),
        queue: interviewQueue.slice(0, 25),
      },
      placements: {
        totals: placementTotals,
        active: placementEntries.filter((entry) => entry.status !== 'completed').slice(0, 20),
        completed: placementEntries.filter((entry) => entry.status === 'completed').slice(0, 10),
        readyCandidates: acceptedQueue.slice(0, 20),
        alumni: completedQueue.slice(0, 15),
      },
      employerBriefs: {
        totals: employerTotals,
        queue: employerEntries.slice(0, 20),
      },
      automation: {
        totalMatches: matches.length,
        autoAssignable: matches.filter((match) => match.autoAssigned).length,
        highlights: automationHighlights,
      },
    };
  });
}

export const __testing = {
  normaliseSkills,
  normaliseSkillTokens,
  normaliseArrayParam,
  normaliseApplicationStatuses,
  computeMatchAgainstText,
  clampScore,
  entryDateValue,
  evaluateCandidateReadiness,
  computeOpportunityMatches,
};

export default {
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  submitEmployerRequest,
  recordLaunchpadPlacement,
  linkLaunchpadOpportunity,
  listLaunchpadApplications,
  getLaunchpadDashboard,
  getLaunchpadWorkflow,
};
