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

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function evaluateCandidateReadiness(launchpad, { yearsExperience, skills, portfolioUrl, motivations }) {
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
  const matchedSkills = normalizedRequired.filter((skill) => evaluatedSkills.includes(skill));
  score += matchedSkills.length * 5;
  score -= missingSkills.length * 7;

  if (requiresPortfolio) {
    score += portfolioUrl ? 8 : -12;
  } else if (portfolioUrl) {
    score += 4;
  }

  if (typeof motivations === 'string' && motivations.trim().length > 0) {
    score += Math.min(10, Math.floor(motivations.trim().length / 80) * 4 + 3);
  }

  const normalizedScore = clampScore(score);
  let recommendedStatus = 'screening';
  if (!meetsExperience || missingSkills.length > 0) {
    recommendedStatus = 'waitlisted';
  }
  if (normalizedScore >= autoAdvanceScore && missingSkills.length === 0 && meetsExperience) {
    recommendedStatus = 'interview';
  }
  if (normalizedScore >= autoAcceptScore && missingSkills.length === 0 && meetsExperience) {
    recommendedStatus = 'accepted';
  }
  if (requiresPortfolio && !portfolioUrl) {
    recommendedStatus = 'waitlisted';
  }

  return {
    score: normalizedScore,
    recommendedStatus,
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
        hasPortfolio: Boolean(portfolioUrl),
        motivationLength: typeof motivations === 'string' ? motivations.trim().length : 0,
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
  }
}

function invalidateLaunchpadCaches(launchpadId) {
  appCache.flushByPrefix(APPLICATION_CACHE_PREFIX);
  if (launchpadId) {
    appCache.flushByPrefix(buildCacheKey('launchpad:dashboard', { launchpadId }));
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
    portfolioUrl,
    motivations,
    availabilityDate,
    applicationId,
  } = payload ?? {};

  if (!launchpadId) {
    throw new ValidationError('launchpadId is required.');
  }

  const skills = normaliseSkills(rawSkills);

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
      portfolioUrl,
      motivations,
    });

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
        eligibilitySnapshot: snapshot,
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

export async function getLaunchpadDashboard(launchpadId, { lookbackDays = 60 } = {}) {
  const whereClause = launchpadId ? { launchpadId } : {};
  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const cacheKey = buildCacheKey('launchpad:dashboard', { launchpadId: launchpadId ?? 'all', lookbackDays });

  return appCache.remember(cacheKey, 60, async () => {
    const [pipelineRows, placementRows, upcomingInterviews, employerBriefs, opportunityRows, launchpad] = await Promise.all([
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

    return {
      launchpad: launchpad ? launchpad.toPublicObject() : null,
      totals: {
        applications: totalApplications,
        placements: Object.values(placements).reduce((sum, value) => sum + value, 0),
        conversionRate,
      },
      pipeline,
      placements,
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
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  submitEmployerRequest,
  recordLaunchpadPlacement,
  linkLaunchpadOpportunity,
  getLaunchpadDashboard,
};
