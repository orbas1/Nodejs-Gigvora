import {
  ExperienceLaunchpad,
  ExperienceLaunchpadOpportunityLink,
  ExperienceLaunchpadPlacement,
  Job,
  JobAdvert,
  User,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const { Op } = sequelize;

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function ensurePositiveInteger(value, field) {
  if (value == null) {
    throw new ValidationError(`${field} is required.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive integer.`);
  }
  return parsed;
}

async function ensureLaunchpadExists(launchpadId, options = {}) {
  if (!launchpadId) {
    throw new ValidationError('launchpadId is required.');
  }
  const launchpad = await ExperienceLaunchpad.findByPk(launchpadId, options);
  if (!launchpad) {
    throw new NotFoundError('Experience Launchpad programme not found.');
  }
  return launchpad;
}

async function ensureJobExists(jobId, options = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required.');
  }
  const job = await Job.findByPk(jobId, options);
  if (!job) {
    throw new NotFoundError('Job not found.');
  }
  return job;
}

function normalizeCompensation(compensation) {
  if (!compensation || typeof compensation !== 'object') {
    return null;
  }
  const amount = compensation.amount == null ? null : Number(compensation.amount);
  const currency = compensation.currency ?? compensation.currencyCode ?? null;
  const cadence = compensation.cadence ?? compensation.frequency ?? null;
  const structure = compensation.structure ?? compensation.type ?? null;

  const normalized = {};
  if (amount != null && Number.isFinite(amount)) {
    normalized.amount = amount;
  }
  if (currency) {
    normalized.currency = currency;
  }
  if (cadence) {
    normalized.cadence = cadence;
  }
  if (structure) {
    normalized.structure = structure;
  }
  if (compensation.notes) {
    normalized.notes = compensation.notes;
  }
  return Object.keys(normalized).length ? normalized : null;
}

function sanitizeLink(link, { job, advert, launchpad, placements }) {
  const plainLink = toPlain(link);
  const jobData = job ? toPlain(job) : null;
  const advertData = advert ? toPlain(advert) : null;
  const launchpadData = launchpad ? launchpad.toPublicObject?.() ?? toPlain(launchpad) : null;
  const placementList = placements.map((placement) => toPlain(placement));

  const activePlacements = placementList.filter((placement) => placement.status !== 'completed' && placement.status !== 'cancelled');
  const completedPlacements = placementList.filter((placement) => placement.status === 'completed');
  const averageFeedback = placementList.length
    ? placementList.reduce((total, placement) => total + (placement.feedbackScore ?? 0), 0) / placementList.length
    : null;
  const averageDurationMs = completedPlacements.length
    ? completedPlacements.reduce((total, placement) => {
        const start = placement.placementDate ? new Date(placement.placementDate).getTime() : null;
        const end = placement.endDate ? new Date(placement.endDate).getTime() : null;
        if (start == null || end == null || Number.isNaN(start) || Number.isNaN(end)) {
          return total;
        }
        return total + Math.max(end - start, 0);
      }, 0) / completedPlacements.length
    : null;

  return {
    ...plainLink,
    launchpad: launchpadData,
    job: jobData
      ? {
          id: jobData.id,
          title: jobData.title,
          location: jobData.location,
          employmentType: jobData.employmentType,
          geoLocation: jobData.geoLocation ?? null,
        }
      : null,
    advert: advertData
      ? {
          id: advertData.id,
          jobId: advertData.jobId,
          workspaceId: advertData.workspaceId,
          status: advertData.status,
          openings: advertData.openings,
          remoteType: advertData.remoteType,
          currencyCode: advertData.currencyCode,
          compensationMin: advertData.compensationMin == null ? null : Number(advertData.compensationMin),
          compensationMax: advertData.compensationMax == null ? null : Number(advertData.compensationMax),
          publishedAt: advertData.publishedAt,
        }
      : null,
    metrics: {
      placements: placementList.length,
      activePlacements: activePlacements.length,
      completedPlacements: completedPlacements.length,
      averageFeedbackScore: averageFeedback == null ? null : Number(averageFeedback.toFixed(2)),
      averagePlacementDurationDays:
        averageDurationMs == null ? null : Number((averageDurationMs / (1000 * 60 * 60 * 24)).toFixed(1)),
    },
    placements: placementList,
  };
}

export async function getLaunchpadJobDashboard({ workspaceId, launchpadId, lookbackDays = 90 } = {}) {
  const linkWhere = { targetType: 'job' };
  if (launchpadId) {
    linkWhere.launchpadId = launchpadId;
  }

  const links = await ExperienceLaunchpadOpportunityLink.findAll({
    where: linkWhere,
    include: [{ model: ExperienceLaunchpad, as: 'launchpad' }],
    order: [['createdAt', 'DESC']],
  });

  if (!links.length) {
    const launchpads = await ExperienceLaunchpad.findAll({
      attributes: ['id', 'title', 'track', 'status'],
      order: [['title', 'ASC']],
    });

    return {
      summary: {
        totalLinks: 0,
        totalPlacements: 0,
        activePlacements: 0,
        launchpads: launchpads.length,
      },
      totals: {
        completedPlacements: 0,
        averageFeedbackScore: null,
      },
      links: [],
      placements: [],
      lookups: {
        launchpads: launchpads.map((item) => item.toPublicObject?.() ?? item.get({ plain: true })),
        jobs: [],
      },
    };
  }

  const launchpadOptions = new Map();
  links.forEach((link) => {
    if (link.launchpad) {
      launchpadOptions.set(link.launchpad.id, link.launchpad);
    }
  });

  const jobIds = Array.from(new Set(links.map((link) => link.targetId).filter(Boolean)));

  const [jobs, adverts, placementRecords] = await Promise.all([
    jobIds.length
      ? Job.findAll({ where: { id: { [Op.in]: jobIds } }, order: [['title', 'ASC']] })
      : Promise.resolve([]),
    jobIds.length
      ? JobAdvert.findAll({
          where: {
            jobId: { [Op.in]: jobIds },
            ...(workspaceId ? { workspaceId } : {}),
          },
        })
      : Promise.resolve([]),
    jobIds.length
      ? ExperienceLaunchpadPlacement.findAll({
          where: {
            targetType: 'job',
            targetId: { [Op.in]: jobIds },
            ...(launchpadId ? { launchpadId } : {}),
          },
          include: [{ model: User, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        })
      : Promise.resolve([]),
  ]);

  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const advertMap = new Map(adverts.map((advert) => [advert.jobId, advert]));

  const placementMap = new Map();
  placementRecords.forEach((placement) => {
    const key = `${placement.launchpadId}:${placement.targetId}`;
    if (!placementMap.has(key)) {
      placementMap.set(key, []);
    }
    placementMap.get(key).push(placement);
  });

  const filteredLinks = links.filter((link) => {
    if (!workspaceId) {
      return true;
    }
    const advert = advertMap.get(link.targetId);
    return advert ? advert.workspaceId === Number(workspaceId) : false;
  });

  const linkPayloads = filteredLinks.map((link) => {
    const key = `${link.launchpadId}:${link.targetId}`;
    return sanitizeLink(link, {
      job: jobMap.get(link.targetId),
      advert: advertMap.get(link.targetId),
      launchpad: link.launchpad,
      placements: placementMap.get(key) ?? [],
    });
  });

  const allPlacements = linkPayloads.flatMap((link) => link.placements ?? []);
  const activePlacements = allPlacements.filter((placement) => placement.status !== 'completed' && placement.status !== 'cancelled');
  const completedPlacements = allPlacements.filter((placement) => placement.status === 'completed');
  const averageFeedback = completedPlacements.length
    ? completedPlacements.reduce((total, placement) => total + (placement.feedbackScore ?? 0), 0) /
      completedPlacements.length
    : null;

  const jobOptions = jobs
    .filter((job) => {
      if (!workspaceId) {
        return true;
      }
      const advert = advertMap.get(job.id);
      return advert ? advert.workspaceId === Number(workspaceId) : false;
    })
    .map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
    }));

  return {
    summary: {
      totalLinks: linkPayloads.length,
      totalPlacements: allPlacements.length,
      activePlacements: activePlacements.length,
      launchpads: launchpadOptions.size,
    },
    totals: {
      completedPlacements: completedPlacements.length,
      averageFeedbackScore: averageFeedback == null ? null : Number(averageFeedback.toFixed(2)),
    },
    links: linkPayloads,
    placements: allPlacements,
    lookups: {
      launchpads: Array.from(launchpadOptions.values()).map((launchpad) =>
        launchpad.toPublicObject?.() ?? launchpad.get({ plain: true }),
      ),
      jobs: jobOptions,
    },
  };
}

export async function linkJobToLaunchpad({
  launchpadId,
  jobId,
  source = 'manual',
  notes,
  createdById,
}) {
  const resolvedLaunchpadId = ensurePositiveInteger(launchpadId, 'launchpadId');
  const resolvedJobId = ensurePositiveInteger(jobId, 'jobId');
  await Promise.all([
    ensureLaunchpadExists(resolvedLaunchpadId),
    ensureJobExists(resolvedJobId),
  ]);

  const link = await ExperienceLaunchpadOpportunityLink.create({
    launchpadId: resolvedLaunchpadId,
    targetType: 'job',
    targetId: resolvedJobId,
    source,
    createdById: createdById ?? null,
    notes: notes ? notes.trim() : null,
  });

  return sanitizeLink(link, {
    job: await Job.findByPk(resolvedJobId),
    advert: await JobAdvert.findOne({ where: { jobId: resolvedJobId } }),
    launchpad: await ExperienceLaunchpad.findByPk(resolvedLaunchpadId),
    placements: [],
  });
}

export async function updateLaunchpadJobLink(linkId, { notes }) {
  const resolvedLinkId = ensurePositiveInteger(linkId, 'linkId');
  const link = await ExperienceLaunchpadOpportunityLink.findByPk(resolvedLinkId, {
    include: [{ model: ExperienceLaunchpad, as: 'launchpad' }],
  });
  if (!link) {
    throw new NotFoundError('Launchpad job link not found.');
  }

  link.notes = notes == null ? null : `${notes}`.trim();
  await link.save();

  const job = await Job.findByPk(link.targetId);
  const advert = await JobAdvert.findOne({ where: { jobId: link.targetId } });
  const placements = await ExperienceLaunchpadPlacement.findAll({
    where: { launchpadId: link.launchpadId, targetType: 'job', targetId: link.targetId },
    include: [{ model: User, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  return sanitizeLink(link, {
    job,
    advert,
    launchpad: link.launchpad,
    placements,
  });
}

export async function removeLaunchpadJobLink(linkId) {
  const resolvedLinkId = ensurePositiveInteger(linkId, 'linkId');
  const link = await ExperienceLaunchpadOpportunityLink.findByPk(resolvedLinkId);
  if (!link) {
    throw new NotFoundError('Launchpad job link not found.');
  }
  await ExperienceLaunchpadPlacement.destroy({
    where: {
      launchpadId: link.launchpadId,
      targetType: 'job',
      targetId: link.targetId,
    },
  });
  await link.destroy();
  return { success: true };
}

export async function createLaunchpadPlacement(linkId, payload) {
  const resolvedLinkId = ensurePositiveInteger(linkId, 'linkId');
  const link = await ExperienceLaunchpadOpportunityLink.findByPk(resolvedLinkId);
  if (!link) {
    throw new NotFoundError('Launchpad job link not found.');
  }

  const candidateId = ensurePositiveInteger(payload.candidateId, 'candidateId');
  const status = payload.status ?? 'scheduled';

  const placement = await ExperienceLaunchpadPlacement.create({
    launchpadId: link.launchpadId,
    candidateId,
    employerRequestId: payload.employerRequestId ?? null,
    targetType: 'job',
    targetId: link.targetId,
    status,
    placementDate: payload.placementDate ?? null,
    endDate: payload.endDate ?? null,
    compensation: normalizeCompensation(payload.compensation),
    feedbackScore: payload.feedbackScore ?? null,
  });

  return toPlain(placement);
}

export async function updateLaunchpadPlacement(placementId, payload) {
  const resolvedPlacementId = ensurePositiveInteger(placementId, 'placementId');
  const placement = await ExperienceLaunchpadPlacement.findByPk(resolvedPlacementId);
  if (!placement) {
    throw new NotFoundError('Launchpad placement not found.');
  }

  if (payload.status) {
    placement.status = payload.status;
  }
  if (payload.placementDate !== undefined) {
    placement.placementDate = payload.placementDate;
  }
  if (payload.endDate !== undefined) {
    placement.endDate = payload.endDate;
  }
  if (payload.compensation !== undefined) {
    placement.compensation = normalizeCompensation(payload.compensation);
  }
  if (payload.feedbackScore !== undefined) {
    const score = Number(payload.feedbackScore);
    placement.feedbackScore = Number.isFinite(score) ? score : null;
  }

  await placement.save();
  return toPlain(placement);
}

export async function removeLaunchpadPlacement(placementId) {
  const resolvedPlacementId = ensurePositiveInteger(placementId, 'placementId');
  const placement = await ExperienceLaunchpadPlacement.findByPk(resolvedPlacementId);
  if (!placement) {
    throw new NotFoundError('Launchpad placement not found.');
  }
  await placement.destroy();
  return { success: true };
}

export default {
  getLaunchpadJobDashboard,
  linkJobToLaunchpad,
  updateLaunchpadJobLink,
  removeLaunchpadJobLink,
  createLaunchpadPlacement,
  updateLaunchpadPlacement,
  removeLaunchpadPlacement,
};

