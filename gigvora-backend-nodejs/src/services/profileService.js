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

function sanitizeString(value, { maxLength = 255, allowNull = true, toLowerCase = false } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  const normalized = trimmed.slice(0, maxLength);
  return toLowerCase ? normalized.toLowerCase() : normalized;
}

function isValidEmail(email) {
  if (!email) {
    return true;
  }
  const emailRegex = /^(?:[A-Za-z0-9_'^&+{}=\-]+(?:\.[A-Za-z0-9_'^&+{}=\-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/u;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  if (!phone) {
    return true;
  }
  const phoneRegex = /^[+]?([0-9()[\]\-\s]{5,25})$/u;
  return phoneRegex.test(phone);
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch (error) {
    return false;
  }
}

function limitArray(items, max) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.slice(0, max);
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter((item) => {
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function sanitizeStringList(value, { maxLength = 120, maxItems = 30 } = {}) {
  const raw = coerceStringArray(value);
  const sanitized = raw
    .map((item) => sanitizeString(item, { maxLength, allowNull: false }))
    .filter(Boolean);
  return uniqueStrings(limitArray(sanitized, maxItems));
}

function parseDateOrNull(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function differenceInDays(date) {
  if (!date) {
    return null;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  return Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
}

function roundToTwo(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(2));
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

function sanitizeExperienceEntries(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  const entries = limitArray(raw, 25)
    .map((entry) => {
      const organization = sanitizeString(entry.organization ?? entry.company, { maxLength: 160 });
      const role = sanitizeString(entry.role ?? entry.title, { maxLength: 160 });
      const description = sanitizeString(entry.description ?? entry.summary, {
        maxLength: 1500,
        allowNull: true,
      });
      const startDate = parseDateOrNull(entry.startDate ?? entry.startedAt);
      const endDate = parseDateOrNull(entry.endDate ?? entry.finishedAt);
      const highlights = limitArray(coerceStringArray(entry.highlights ?? entry.achievements), 6).map((item) =>
        sanitizeString(item, { maxLength: 200, allowNull: false }),
      );

      if (!organization && !role) {
        return null;
      }

      return {
        organization: organization ?? null,
        role: role ?? null,
        startDate,
        endDate,
        description,
        highlights,
      };
    })
    .filter(Boolean);

  return entries;
}

function sanitizeQualifications(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  return limitArray(raw, 20)
    .map((qualification) => {
      const title = sanitizeString(qualification.title ?? qualification.name, { maxLength: 160 });
      const authority = sanitizeString(qualification.authority ?? qualification.issuer, { maxLength: 160 });
      const credentialId = sanitizeString(qualification.credentialId ?? qualification.id, {
        maxLength: 120,
      });
      const credentialUrl = sanitizeString(qualification.credentialUrl ?? qualification.url, {
        maxLength: 500,
      });
      const description = sanitizeString(qualification.description, { maxLength: 1000 });
      const year = sanitizeString(qualification.year ?? qualification.awarded ?? qualification.completedAt, {
        maxLength: 10,
      });

      return {
        title,
        authority,
        credentialId,
        credentialUrl,
        description,
        year,
      };
    })
    .filter((item) => item.title || item.authority || item.credentialId || item.credentialUrl);
}

function sanitizePortfolioLinks(value) {
  const links = limitArray(coerceLinkArray(value), 15)
    .map((entry) => ({
      label: sanitizeString(entry.label, { maxLength: 120 }),
      url: sanitizeString(entry.url, { maxLength: 500 }),
      description: sanitizeString(entry.description, { maxLength: 240 }),
    }))
    .filter((entry) => entry.label || entry.url);

  links.forEach((entry) => {
    if (entry.url && !isValidUrl(entry.url)) {
      throw ensureHttpStatus(new ValidationError(`Invalid portfolio URL: ${entry.url}`));
    }
  });

  return links;
}

function sanitizeCollaborationRoster(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  return limitArray(raw, 15)
    .map((entry) => {
      const name = sanitizeString(entry.name ?? entry.person, { maxLength: 160 });
      if (!name) {
        return null;
      }
      return {
        name,
        role: sanitizeString(entry.role ?? entry.title, { maxLength: 160 }),
        avatarSeed: sanitizeString(entry.avatarSeed ?? entry.avatar ?? name, { maxLength: 255 }),
        contact: sanitizeString(entry.contact, { maxLength: 255 }),
      };
    })
    .filter(Boolean);
}

function sanitizeImpactHighlights(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  return limitArray(raw, 10)
    .map((entry) => {
      const title = sanitizeString(entry.title, { maxLength: 160 });
      const valueText = sanitizeString(entry.value ?? entry.metric, { maxLength: 160 });
      const description = sanitizeString(entry.description ?? entry.summary, { maxLength: 400 });
      if (!title && !valueText) {
        return null;
      }
      return {
        title,
        value: valueText,
        description,
      };
    })
    .filter(Boolean);
}

function sanitizePipelineInsights(value) {
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  return limitArray(raw, 12)
    .map((entry) => {
      const project = sanitizeString(entry.project ?? entry.title, { maxLength: 160 });
      const payout = sanitizeString(entry.payout ?? entry.value, { maxLength: 120 });
      const countdown = sanitizeString(entry.countdown ?? entry.timeRemaining, { maxLength: 120 });
      const status = sanitizeString(entry.status, { maxLength: 120 });
      const seed = sanitizeString(entry.seed ?? project, { maxLength: 160 });
      if (!project && !payout) {
        return null;
      }
      return {
        project,
        payout,
        countdown,
        status,
        seed,
      };
    })
    .filter(Boolean);
}

function normalizeReferences(value) {
  if (value == null) {
    return [];
  }
  const raw = Array.isArray(value) ? value : coerceObjectArray(value);
  const entries = limitArray(raw, 20).map((entry) => {
    const id = entry.id ? Number(entry.id) : null;
    const name = sanitizeString(entry.name ?? entry.referenceName, { maxLength: 160, allowNull: false });
    if (!name) {
      throw ensureHttpStatus(new ValidationError('Each reference must include a name.'));
    }
    const relationship = sanitizeString(entry.relationship, { maxLength: 160 });
    const company = sanitizeString(entry.company, { maxLength: 160 });
    const email = sanitizeString(entry.email, { maxLength: 255 });
    const phone = sanitizeString(entry.phone, { maxLength: 60 });
    const endorsement = sanitizeString(entry.endorsement ?? entry.note, { maxLength: 2000 });
    const isVerified = Boolean(entry.isVerified ?? entry.verified);
    const weight = entry.weight == null ? null : Number(entry.weight);
    const lastInteractedAt = parseDateOrNull(entry.lastInteractedAt ?? entry.interactedAt);

    if (email && !isValidEmail(email)) {
      throw ensureHttpStatus(new ValidationError(`Reference email is invalid for ${name}.`));
    }
    if (phone && !isValidPhone(phone)) {
      throw ensureHttpStatus(new ValidationError(`Reference phone is invalid for ${name}.`));
    }
    if (weight != null && (!Number.isFinite(weight) || weight < 0 || weight > 1)) {
      throw ensureHttpStatus(new ValidationError('Reference weight must be between 0 and 1.'));
    }

    if (id != null && (!Number.isInteger(id) || id <= 0)) {
      throw ensureHttpStatus(new ValidationError('Reference id must be a positive integer when provided.'));
    }

    return {
      id,
      referenceName: name,
      relationship,
      company,
      email,
      phone,
      endorsement,
      isVerified,
      weight: weight == null ? null : Number(weight.toFixed(2)),
      lastInteractedAt,
    };
  });

  return entries;
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
  preferredEngagements,
  statusFlags,
  volunteerBadges,
  collaborationRoster,
  impactHighlights,
  pipelineInsights,
}) {
  const checkpoints = [
    Boolean(profile.headline?.trim()),
    Boolean(profile.bio?.trim()),
    Boolean(profile.missionStatement?.trim()),
    Boolean(profile.education?.trim()),
    skills.length > 0,
    experience.length > 0,
    qualifications.length > 0,
    references.length > 0,
    portfolioLinks.length > 0,
    preferredEngagements.length > 0,
    statusFlags.length > 0,
    volunteerBadges.length > 0,
    collaborationRoster.length > 0,
    impactHighlights.length > 0,
    pipelineInsights.length > 0,
    Boolean(profile.location?.trim()),
    availability.status != null && availability.status !== 'limited',
    availability.hoursPerWeek != null && availability.hoursPerWeek > 0,
  ];
  const total = checkpoints.length;
  if (!total) {
    return 0;
  }
  const completed = checkpoints.filter(Boolean).length;
  return (completed / total) * 100;
}

function calculateTrustScore({
  profile,
  references,
  metrics,
  availability,
  volunteerBadges,
  statusFlags,
  impactHighlights,
  pipelineInsights,
}) {
  const breakdown = [];
  const normalizedCompletion = Math.min(Math.max(metrics.profileCompletion ?? 0, 0), 100);
  const completionContribution = roundToTwo(normalizedCompletion * 0.4);
  breakdown.push({
    key: 'profile_completion',
    label: 'Profile completeness',
    weight: 0.4,
    rawScore: normalizedCompletion,
    contribution: completionContribution,
    description: 'Completed sections across profile, skills, qualifications, and case studies.',
  });

  const verifiedReferences = references.filter((reference) => reference.verified).length;
  const referencesContribution = roundToTwo(
    Math.min(18, verifiedReferences * 6 + Math.max(references.length - verifiedReferences, 0) * 2),
  );
  breakdown.push({
    key: 'references',
    label: 'Verified references',
    weight: 0.18,
    rawScore: references.length,
    contribution: referencesContribution,
    description: 'Employer testimonials and endorsements with verification weighting.',
  });

  const likesCount = Math.max(metrics.likesCount ?? 0, 0);
  const followersCount = Math.max(metrics.followersCount ?? 0, 0);
  const connectionsCount = Math.max(metrics.connectionsCount ?? 0, 0);
  const engagementBase =
    Math.log10(followersCount + 1) * 6 +
    Math.log10(likesCount + 1) * 4 +
    Math.log10(connectionsCount + 1) * 5;
  const engagementContribution = roundToTwo(Math.min(14, engagementBase));
  breakdown.push({
    key: 'engagement',
    label: 'Network engagement',
    weight: 0.14,
    rawScore: { likesCount, followersCount, connectionsCount },
    contribution: engagementContribution,
    description: 'Signals from likes, followers, and accepted connections.',
  });

  const volunteerScoreBase =
    volunteerBadges.length * 3 +
    (statusFlags.includes('mentor') ? 2 : 0) +
    (statusFlags.includes('launchpad_alumni') ? 1 : 0) +
    (statusFlags.includes('verified') ? 2 : 0);
  const volunteerContribution = roundToTwo(Math.min(8, volunteerScoreBase));
  breakdown.push({
    key: 'community',
    label: 'Community leadership',
    weight: 0.08,
    rawScore: { volunteerBadges, statusFlags },
    contribution: volunteerContribution,
    description: 'Volunteer commitments, mentorship roles, and verified programme status.',
  });

  const lastUpdatedSource =
    availability.lastUpdatedAt ?? profile.availabilityUpdatedAt ?? profile.updatedAt ?? null;
  const daysSinceAvailability = differenceInDays(lastUpdatedSource);
  let recencyContribution = 4;
  if (daysSinceAvailability != null) {
    if (daysSinceAvailability <= 30) {
      recencyContribution = 8;
    } else if (daysSinceAvailability <= 60) {
      recencyContribution = 6;
    } else if (daysSinceAvailability <= 90) {
      recencyContribution = 4;
    } else if (daysSinceAvailability <= 180) {
      recencyContribution = 2;
    } else {
      recencyContribution = 0;
    }
  }
  if (availability.status === 'unavailable' || availability.status === 'on_leave') {
    recencyContribution = Math.max(0, recencyContribution - 2);
  }
  recencyContribution = roundToTwo(recencyContribution);
  breakdown.push({
    key: 'availability',
    label: 'Availability freshness',
    weight: 0.08,
    rawScore: { status: availability.status, daysSinceAvailability },
    contribution: recencyContribution,
    description: 'How recently availability was updated and current booking posture.',
  });

  let deliveryContributionBase = 0;
  if (impactHighlights.length > 0) {
    deliveryContributionBase += 3 + Math.min(impactHighlights.length - 1, 2);
  }
  if (pipelineInsights.length > 0) {
    deliveryContributionBase += 3;
  }
  const deliveryContribution = roundToTwo(Math.min(6, deliveryContributionBase));
  breakdown.push({
    key: 'delivery',
    label: 'Delivery evidence',
    weight: 0.06,
    rawScore: { impactHighlights: impactHighlights.length, pipelineInsights: pipelineInsights.length },
    contribution: deliveryContribution,
    description: 'Impact metrics and active pipeline visibility demonstrating reliability.',
  });

  const baselineContribution = roundToTwo(6);
  breakdown.push({
    key: 'baseline',
    label: 'Identity & compliance baseline',
    weight: 0.06,
    rawScore: 1,
    contribution: baselineContribution,
    description: 'Verified identity, compliance posture, and foundational safeguards.',
  });

  const score = breakdown.reduce((total, item) => total + item.contribution, 0);
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = clampedScore >= 85 ? 'platinum' : clampedScore >= 70 ? 'gold' : clampedScore >= 55 ? 'silver' : 'emerging';

  let recommendedReviewAt = null;
  if (lastUpdatedSource) {
    const baseDate = new Date(lastUpdatedSource);
    if (!Number.isNaN(baseDate.getTime())) {
      const target = new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000);
      recommendedReviewAt = target.toISOString();
    }
  }

  return {
    score: roundToTwo(clampedScore),
    breakdown,
    level,
    recommendedReviewAt,
  };
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

  const likesCount = profile.likesCount ?? 0;
  const followersCount = profile.followersCount ?? 0;

  const profileCompletionValue = calculateProfileCompletion({
    profile,
    skills,
    experience,
    qualifications,
    references,
    portfolioLinks,
    availability,
    preferredEngagements,
    statusFlags,
    volunteerBadges,
    collaborationRoster,
    impactHighlights,
    pipelineInsights,
  });

  const profileCompletion = safeNumber(profileCompletionValue, 1);

  const metrics = {
    likesCount,
    followersCount,
    connectionsCount,
    profileCompletion,
  };

  const trustInsights = calculateTrustScore({
    profile,
    references,
    metrics: { ...metrics },
    availability,
    volunteerBadges,
    statusFlags,
    impactHighlights,
    pipelineInsights,
  });

  metrics.trustScore = trustInsights.score;
  metrics.trustScoreBreakdown = trustInsights.breakdown;
  metrics.trustScoreLevel = trustInsights.level;
  metrics.trustScoreRecommendedReviewAt = trustInsights.recommendedReviewAt;
  metrics.trustScoreLastCalculatedAt = new Date().toISOString();
  availability.recommendedReviewAt = trustInsights.recommendedReviewAt;

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

const AVAILABILITY_FIELD_KEYS = new Set([
  'availabilityStatus',
  'availableHoursPerWeek',
  'openToRemote',
  'availabilityNotes',
  'timezone',
  'focusAreas',
  'areasOfFocus',
]);

function normalizeProfileUpdatePayload(input = {}) {
  if (input == null || typeof input !== 'object') {
    throw ensureHttpStatus(new ValidationError('Update payload must be an object.'));
  }

  const availabilityPayload = {};
  let hasAvailabilityChanges = false;
  Object.entries(input).forEach(([key, value]) => {
    if (AVAILABILITY_FIELD_KEYS.has(key)) {
      availabilityPayload[key] = value;
      hasAvailabilityChanges = true;
    }
  });

  const availabilityUpdates = hasAvailabilityChanges ? normalizeAvailabilityPayload(availabilityPayload) : {};

  const profileUpdates = {};

  if (Object.prototype.hasOwnProperty.call(input, 'headline')) {
    profileUpdates.headline = sanitizeString(input.headline, { maxLength: 255 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'bio')) {
    profileUpdates.bio = sanitizeString(input.bio, { maxLength: 5000 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'missionStatement')) {
    profileUpdates.missionStatement = sanitizeString(input.missionStatement, { maxLength: 2000 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'education')) {
    profileUpdates.education = sanitizeString(input.education, { maxLength: 2000 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'location')) {
    profileUpdates.location = sanitizeString(input.location, { maxLength: 255 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'timezone')) {
    profileUpdates.timezone = sanitizeString(input.timezone, { maxLength: 120 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'avatarSeed')) {
    profileUpdates.avatarSeed = sanitizeString(input.avatarSeed, { maxLength: 255 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'skills')) {
    const normalizedSkills = sanitizeStringList(input.skills, { maxItems: 50, maxLength: 160 });
    profileUpdates.skills = normalizedSkills.length > 0 ? JSON.stringify(normalizedSkills) : null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'areasOfFocus') || Object.prototype.hasOwnProperty.call(input, 'focusAreas')) {
    profileUpdates.areasOfFocus = sanitizeStringList(input.areasOfFocus ?? input.focusAreas, {
      maxItems: 20,
      maxLength: 160,
    });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'preferredEngagements')) {
    profileUpdates.preferredEngagements = sanitizeStringList(input.preferredEngagements, {
      maxItems: 20,
      maxLength: 160,
    });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'statusFlags')) {
    profileUpdates.statusFlags = sanitizeStringList(input.statusFlags, { maxItems: 30, maxLength: 160 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'volunteerBadges')) {
    profileUpdates.volunteerBadges = sanitizeStringList(input.volunteerBadges, { maxItems: 30, maxLength: 160 });
  }

  if (Object.prototype.hasOwnProperty.call(input, 'experience') || Object.prototype.hasOwnProperty.call(input, 'experienceEntries')) {
    profileUpdates.experienceEntries = sanitizeExperienceEntries(input.experience ?? input.experienceEntries);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'qualifications')) {
    profileUpdates.qualifications = sanitizeQualifications(input.qualifications);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'collaborationRoster')) {
    profileUpdates.collaborationRoster = sanitizeCollaborationRoster(input.collaborationRoster);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'impactHighlights')) {
    profileUpdates.impactHighlights = sanitizeImpactHighlights(input.impactHighlights);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'pipelineInsights')) {
    profileUpdates.pipelineInsights = sanitizePipelineInsights(input.pipelineInsights);
  }

  const references = Object.prototype.hasOwnProperty.call(input, 'references')
    ? normalizeReferences(input.references)
    : null;

  return { profileUpdates, availabilityUpdates, references };
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

async function applyReferenceUpdates(profile, references, { transaction }) {
  if (!Array.isArray(references)) {
    return;
  }

  const existing = Array.isArray(profile.references) ? profile.references : [];
  const existingById = new Map(existing.map((reference) => [reference.id, reference]));
  const retainedIds = new Set();

  await Promise.all(
    references.map(async (reference) => {
      const payload = {
        referenceName: reference.referenceName,
        relationship: reference.relationship ?? null,
        company: reference.company ?? null,
        email: reference.email ?? null,
        phone: reference.phone ?? null,
        endorsement: reference.endorsement ?? null,
        isVerified: Boolean(reference.isVerified),
        weight: reference.weight == null ? null : Number(reference.weight),
        lastInteractedAt: reference.lastInteractedAt ?? null,
      };

      if (reference.id && existingById.has(reference.id)) {
        const record = existingById.get(reference.id);
        await record.update(payload, { transaction });
        retainedIds.add(reference.id);
      } else {
        await ProfileReference.create({ profileId: profile.id, ...payload }, { transaction });
      }
    }),
  );

  await Promise.all(
    existing
      .filter((reference) => reference.id && !retainedIds.has(reference.id))
      .map((reference) => reference.destroy({ transaction })),
  );
}

export async function updateProfile(userId, payload = {}) {
  const numericId = normalizeUserId(userId);
  const { profileUpdates, availabilityUpdates, references } = normalizeProfileUpdatePayload(payload);

  const hasProfileUpdates = Object.keys(profileUpdates).length > 0;
  const hasAvailabilityUpdates = Object.keys(availabilityUpdates).length > 0;
  const hasReferenceUpdates = references !== null;

  if (!hasProfileUpdates && !hasAvailabilityUpdates && !hasReferenceUpdates) {
    return getProfileOverview(numericId, { bypassCache: true });
  }

  const key = cacheKeyForUser(numericId);
  let overview = null;

  await sequelize.transaction(async (transaction) => {
    const context = await loadProfileContext(numericId, { transaction, lock: true });
    const profile = context.user.Profile;

    const updates = { ...profileUpdates, ...availabilityUpdates };
    if (Object.keys(updates).length > 0) {
      await profile.update(updates, { transaction });
    }

    if (hasReferenceUpdates) {
      await applyReferenceUpdates(profile, references, { transaction });
    }

    await profile.reload({ include: [{ model: ProfileReference, as: 'references' }], transaction });

    overview = buildProfilePayload({ ...context, user: context.user });
    await profile.update(
      {
        profileCompletion: overview.metrics.profileCompletion,
        trustScore: overview.metrics.trustScore,
        availabilityUpdatedAt: Object.prototype.hasOwnProperty.call(availabilityUpdates, 'availabilityUpdatedAt')
          ? availabilityUpdates.availabilityUpdatedAt
          : profile.availabilityUpdatedAt,
      },
      { transaction },
    );
  });

  appCache.delete(key);
  appCache.set(key, overview, PROFILE_CACHE_TTL_SECONDS);
  return overview;
}

export async function updateProfileAvailability(userId, payload = {}) {
  return updateProfile(userId, payload);
}

export default {
  getProfileOverview,
  updateProfile,
  updateProfileAvailability,
};
