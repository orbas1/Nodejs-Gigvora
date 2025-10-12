import { Op } from 'sequelize';
import {
  sequelize,
  User,
  Profile,
  CompanyProfile,
  AgencyProfile,
  FreelancerProfile,
  Connection,
  ProfileReference,
  PROFILE_AVAILABILITY_STATUSES,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const PROFILE_CACHE_NAMESPACE = 'profile:overview';
const PROFILE_CACHE_TTL_SECONDS = 120;
const HOURS_PER_WEEK_MAX = 168;

function ensureHttpStatus(error) {
  if (error && error.statusCode && !error.status) {
    error.status = error.statusCode;
  }
  return error;
}

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw ensureHttpStatus(new ValidationError('userId must be a positive integer.'));
  }
  return numeric;
}

function coerceStringArray(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? '' : `${item}`.trim()))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return coerceStringArray(parsed);
      }
    } catch (error) {
      // fall through to delimiter split
    }
    return trimmed
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function coerceObjectArray(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ ...item }));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      return coerceObjectArray(parsed);
    } catch (error) {
      return [];
    }
  }
  if (typeof value === 'object') {
    return [{ ...value }];
  }
  return [];
}

function coerceLinkArray(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  return raw
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        const url = entry.trim();
        if (!url) return null;
        return { label: url, url };
      }
      const label = entry.label ?? entry.title ?? entry.name ?? entry.url ?? null;
      const url = entry.url ?? null;
      if (!label && !url) {
        return null;
      }
      return {
        label: label ? `${label}`.trim() : url,
        url: url ? `${url}`.trim() : null,
        description: entry.description ? `${entry.description}`.trim() : undefined,
      };
    })
    .filter((entry) => entry && (entry.label || entry.url));
}

function coerceLaunchpadEligibility(value) {
  if (!value) {
    return { status: 'unknown', score: null, cohorts: [] };
  }
  let payload = value;
  if (typeof value === 'string') {
    try {
      payload = JSON.parse(value);
    } catch (error) {
      return { status: 'unknown', score: null, cohorts: [] };
    }
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    return { status: 'unknown', score: null, cohorts: [] };
  }
  const cohorts = coerceStringArray(payload.cohorts ?? payload.cohort);
  const score = payload.score == null ? null : Number(payload.score);
  return {
    status: payload.status ?? 'unknown',
    score: Number.isFinite(score) ? Number(score.toFixed(2)) : null,
    cohorts,
    track: payload.track ?? null,
    lastEvaluatedAt: payload.lastEvaluatedAt ?? null,
    notes: payload.notes ?? null,
  };
}

function safeNumber(value, fractionDigits = 2) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (fractionDigits == null) {
    return numeric;
  }
  return Number(numeric.toFixed(fractionDigits));
}

function calculateProfileCompletion({
  profile,
  skills,
  experience,
  qualifications,
  references,
  portfolioLinks,
  availability,
}) {
  const checkpoints = [
    Boolean(profile.headline?.trim()),
    Boolean(profile.bio?.trim()),
    Boolean(profile.missionStatement?.trim()),
    skills.length > 0,
    experience.length > 0,
    qualifications.length > 0,
    references.length > 0,
    portfolioLinks.length > 0,
    Boolean(profile.location?.trim()),
    availability.status != null && availability.status !== 'limited',
  ];
  const total = checkpoints.length;
  if (!total) {
    return 0;
  }
  const completed = checkpoints.filter(Boolean).length;
  return (completed / total) * 100;
}

function buildProfilePayload({ user, groups, connectionsCount }) {
  const plainUser = user.get({ plain: true });
  const profile = plainUser.Profile;
  if (!profile) {
    throw ensureHttpStatus(new NotFoundError('Profile not found for user.'));
  }

  const references = coerceObjectArray(profile.references).map((reference) => ({
    id: reference.id ?? null,
    name: reference.referenceName ?? reference.name ?? null,
    relationship: reference.relationship ?? null,
    company: reference.company ?? null,
    email: reference.email ?? null,
    phone: reference.phone ?? null,
    endorsement: reference.endorsement ?? null,
    verified: Boolean(reference.isVerified),
    weight: reference.weight == null ? null : Number(reference.weight),
    lastInteractedAt: reference.lastInteractedAt ?? null,
  }));

  const skills = coerceStringArray(profile.skills);
  const areasOfFocus = coerceStringArray(profile.areasOfFocus);
  const qualifications = coerceObjectArray(profile.qualifications).map((qualification) => ({
    title: qualification.title ?? qualification.name ?? null,
    authority: qualification.authority ?? qualification.issuer ?? null,
    year: qualification.year ?? qualification.awarded ?? null,
    credentialId: qualification.credentialId ?? qualification.id ?? null,
    credentialUrl: qualification.credentialUrl ?? qualification.url ?? null,
    description: qualification.description ?? null,
  }));
  const experience = coerceObjectArray(profile.experienceEntries).map((entry) => ({
    organization: entry.organization ?? entry.company ?? null,
    role: entry.role ?? entry.title ?? null,
    startDate: entry.startDate ?? null,
    endDate: entry.endDate ?? null,
    description: entry.description ?? entry.summary ?? null,
    highlights: coerceStringArray(entry.highlights ?? entry.achievements),
  }));
  const statusFlags = coerceStringArray(profile.statusFlags);
  const volunteerBadges = coerceStringArray(profile.volunteerBadges);
  const portfolioLinks = coerceLinkArray(profile.portfolioLinks);
  const preferredEngagements = coerceStringArray(profile.preferredEngagements);
  const collaborationRoster = coerceObjectArray(profile.collaborationRoster).map((collaborator) => ({
    name: collaborator.name ?? collaborator.person ?? null,
    role: collaborator.role ?? collaborator.title ?? null,
    avatarSeed: collaborator.avatarSeed ?? collaborator.name ?? null,
    contact: collaborator.contact ?? null,
  }));
  const impactHighlights = coerceObjectArray(profile.impactHighlights).map((highlight) => ({
    title: highlight.title ?? null,
    value: highlight.value ?? highlight.metric ?? null,
    description: highlight.description ?? highlight.summary ?? null,
  }));
  const pipelineInsights = coerceObjectArray(profile.pipelineInsights).map((insight) => ({
    project: insight.project ?? insight.title ?? null,
    payout: insight.payout ?? insight.value ?? null,
    countdown: insight.countdown ?? insight.timeRemaining ?? null,
    status: insight.status ?? null,
    seed: insight.seed ?? insight.project ?? insight.title ?? null,
  }));

  const availability = {
    status: profile.availabilityStatus ?? 'limited',
    hoursPerWeek: profile.availableHoursPerWeek == null ? null : Number(profile.availableHoursPerWeek),
    openToRemote: Boolean(profile.openToRemote ?? true),
    notes: profile.availabilityNotes ?? null,
    timezone: profile.timezone ?? null,
    focusAreas: areasOfFocus,
    lastUpdatedAt: profile.availabilityUpdatedAt ?? profile.updatedAt ?? null,
  };

  const metrics = {
    trustScore: safeNumber(profile.trustScore),
    likesCount: profile.likesCount ?? 0,
    followersCount: profile.followersCount ?? 0,
    connectionsCount,
    profileCompletion: safeNumber(
      calculateProfileCompletion({
        profile,
        skills,
        experience,
        qualifications,
        references,
        portfolioLinks,
        availability,
      }),
      1,
    ),
  };

  const sanitizedGroups = (groups ?? []).map((group) => {
    const plainGroup = group.get ? group.get({ plain: true }) : group;
    const membership = plainGroup.GroupMembership ?? group.GroupMembership ?? {};
    return {
      id: plainGroup.id,
      name: plainGroup.name,
      role: membership.role ?? null,
    };
  });

  const launchpadEligibility = coerceLaunchpadEligibility(profile.launchpadEligibility);

  const companyProfile = plainUser.CompanyProfile
    ? {
        companyName: plainUser.CompanyProfile.companyName,
        description: plainUser.CompanyProfile.description,
        website: plainUser.CompanyProfile.website,
      }
    : null;
  const agencyProfile = plainUser.AgencyProfile
    ? {
        agencyName: plainUser.AgencyProfile.agencyName,
        focusArea: plainUser.AgencyProfile.focusArea,
        website: plainUser.AgencyProfile.website,
      }
    : null;
  const freelancerProfile = plainUser.FreelancerProfile
    ? {
        title: plainUser.FreelancerProfile.title,
        hourlyRate:
          plainUser.FreelancerProfile.hourlyRate == null
            ? null
            : Number(plainUser.FreelancerProfile.hourlyRate),
        availability: plainUser.FreelancerProfile.availability ?? null,
      }
    : null;

  return {
    id: plainUser.id,
    userId: plainUser.id,
    firstName: plainUser.firstName,
    lastName: plainUser.lastName,
    name: `${plainUser.firstName} ${plainUser.lastName}`.trim(),
    email: plainUser.email,
    userType: plainUser.userType,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    missionStatement: profile.missionStatement ?? null,
    education: profile.education ?? null,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    avatarSeed: profile.avatarSeed ?? plainUser.email ?? `${plainUser.firstName}-${plainUser.lastName}`,
    skills,
    areasOfFocus,
    qualifications,
    experience,
    statusFlags,
    volunteerBadges,
    references,
    portfolioLinks,
    preferredEngagements,
    collaborationRoster,
    impactHighlights,
    pipelineInsights,
    autoAssignInsights: pipelineInsights,
    launchpadEligibility,
    availability,
    metrics,
    groups: sanitizedGroups,
    followersCount: metrics.followersCount,
    likesCount: metrics.likesCount,
    connectionsCount: metrics.connectionsCount,
    trustScore: metrics.trustScore,
    companyProfile,
    agencyProfile,
    freelancerProfile,
  };
}

async function loadProfileContext(userId, { transaction, lock } = {}) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Profile,
        include: [{ model: ProfileReference, as: 'references' }],
      },
      CompanyProfile,
      AgencyProfile,
      FreelancerProfile,
    ],
    transaction,
    lock: lock ? transaction.LOCK.UPDATE : undefined,
  });

  if (!user) {
    throw ensureHttpStatus(new NotFoundError('User not found.'));
  }
  if (!user.Profile) {
    throw ensureHttpStatus(new NotFoundError('Profile not found for user.'));
  }

  const groups = await user.getGroups({ joinTableAttributes: ['role'], transaction });
  const connectionsCount = await Connection.count({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    transaction,
  });

  return { user, groups, connectionsCount };
}

function cacheKeyForUser(userId) {
  return buildCacheKey(PROFILE_CACHE_NAMESPACE, { userId });
}

export async function getProfileOverview(userId, { bypassCache = false } = {}) {
  const numericId = normalizeUserId(userId);
  const key = cacheKeyForUser(numericId);
  if (!bypassCache) {
    const cached = appCache.get(key);
    if (cached) {
      return cached;
    }
  }

  const context = await loadProfileContext(numericId);
  const payload = buildProfilePayload(context);
  appCache.set(key, payload, PROFILE_CACHE_TTL_SECONDS);
  return payload;
}

function normalizeAvailabilityPayload(input) {
  if (input == null || typeof input !== 'object') {
    throw ensureHttpStatus(new ValidationError('Update payload must be an object.'));
  }
  const updates = {};
  let touchedAvailability = false;

  if (Object.prototype.hasOwnProperty.call(input, 'availabilityStatus')) {
    const status = `${input.availabilityStatus}`.trim().toLowerCase();
    if (!PROFILE_AVAILABILITY_STATUSES.includes(status)) {
      throw ensureHttpStatus(
        new ValidationError(
          `availabilityStatus must be one of: ${PROFILE_AVAILABILITY_STATUSES.join(', ')}.`,
        ),
      );
    }
    updates.availabilityStatus = status;
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'availableHoursPerWeek')) {
    const hours = Number(input.availableHoursPerWeek);
    if (!Number.isFinite(hours) || hours < 0 || hours > HOURS_PER_WEEK_MAX) {
      throw ensureHttpStatus(
        new ValidationError('availableHoursPerWeek must be between 0 and 168 hours.'),
      );
    }
    updates.availableHoursPerWeek = Math.round(hours);
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'openToRemote')) {
    const remoteValue = input.openToRemote;
    if (typeof remoteValue === 'boolean') {
      updates.openToRemote = remoteValue;
    } else if (remoteValue === 'true' || remoteValue === 'false') {
      updates.openToRemote = remoteValue === 'true';
    } else {
      throw ensureHttpStatus(new ValidationError('openToRemote must be a boolean value.'));
    }
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'availabilityNotes')) {
    const notes = input.availabilityNotes == null ? null : `${input.availabilityNotes}`.trim();
    if (notes && notes.length > 1000) {
      throw ensureHttpStatus(new ValidationError('availabilityNotes must be 1000 characters or fewer.'));
    }
    updates.availabilityNotes = notes && notes.length > 0 ? notes : null;
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'timezone')) {
    const timezone = input.timezone == null ? null : `${input.timezone}`.trim();
    updates.timezone = timezone && timezone.length > 0 ? timezone : null;
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'focusAreas') || Object.prototype.hasOwnProperty.call(input, 'areasOfFocus')) {
    const focusAreas = coerceStringArray(input.focusAreas ?? input.areasOfFocus);
    updates.areasOfFocus = focusAreas.length > 0 ? focusAreas : [];
    touchedAvailability = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'preferredEngagements')) {
    const engagements = coerceStringArray(input.preferredEngagements);
    updates.preferredEngagements = engagements.length > 0 ? engagements : [];
  }

  if (Object.prototype.hasOwnProperty.call(input, 'location')) {
    const location = input.location == null ? null : `${input.location}`.trim();
    updates.location = location && location.length > 0 ? location : null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'missionStatement')) {
    const mission = input.missionStatement == null ? null : `${input.missionStatement}`.trim();
    updates.missionStatement = mission && mission.length > 0 ? mission : null;
  }

  if (touchedAvailability) {
    updates.availabilityUpdatedAt = new Date();
  }

  return updates;
}

export async function updateProfileAvailability(userId, payload = {}) {
  const numericId = normalizeUserId(userId);
  const updates = normalizeAvailabilityPayload(payload);
  if (!Object.keys(updates).length) {
    return getProfileOverview(numericId, { bypassCache: true });
  }

  const key = cacheKeyForUser(numericId);
  let overview = null;
  await sequelize.transaction(async (transaction) => {
    const context = await loadProfileContext(numericId, { transaction, lock: true });
    const profile = context.user.Profile;
    await profile.update(updates, { transaction });

    // Reload references to ensure derived metrics use the latest data.
    await profile.reload({ include: [{ model: ProfileReference, as: 'references' }], transaction });

    overview = buildProfilePayload({ ...context, user: context.user });
    await profile.update({ profileCompletion: overview.metrics.profileCompletion }, { transaction });
  });

  appCache.delete(key);
  appCache.set(key, overview, PROFILE_CACHE_TTL_SECONDS);
  return overview;
}

export default {
  getProfileOverview,
  updateProfileAvailability,
};
