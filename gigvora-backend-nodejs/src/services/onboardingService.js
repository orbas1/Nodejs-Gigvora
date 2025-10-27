import { Op } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  OnboardingPersona,
  OnboardingJourney,
  OnboardingJourneyInvite,
  ONBOARDING_JOURNEY_STATUSES,
} from '../models/onboardingModels.js';
import { normaliseEmail, normaliseSlug } from '../utils/modelNormalizers.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

function coerceString(value, { max = 255, fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const result = String(value).trim();
  if (!result) {
    return fallback;
  }
  return result.slice(0, max);
}

function requireString(value, field, { max = 255 } = {}) {
  const result = coerceString(value, { max });
  if (!result) {
    throw new ValidationError(`${field} is required.`);
  }
  return result;
}

function sanitiseStringArray(value, { maxItems = 8, itemMax = 160 } = {}) {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set();
  value
    .map((entry) => coerceString(entry, { max: itemMax }))
    .filter(Boolean)
    .forEach((entry) => unique.add(entry));
  return Array.from(unique).slice(0, maxItems);
}

function sanitisePersonaOutput(persona) {
  return {
    id: persona.slug,
    title: persona.title,
    subtitle: persona.subtitle,
    headline: persona.headline,
    benefits: Array.isArray(persona.benefits) ? persona.benefits : [],
    metrics: Array.isArray(persona.metrics) ? persona.metrics : [],
    signatureMoments: Array.isArray(persona.signatureMoments) ? persona.signatureMoments : [],
    recommendedModules: Array.isArray(persona.recommendedModules) ? persona.recommendedModules : [],
    heroMedia: persona.heroMedia ?? {},
    metadata: persona.metadata ?? {},
  };
}

export async function listPersonas({ includeDeprecated = false } = {}) {
  const where = includeDeprecated
    ? {}
    : {
        status: 'active',
      };
  const personas = await OnboardingPersona.findAll({
    where,
    order: [
      ['sortOrder', 'ASC'],
      ['title', 'ASC'],
    ],
  });
  return personas.map(sanitisePersonaOutput);
}

function assertActor(actor) {
  if (!actor || !actor.id) {
    throw new ValidationError('Authenticated user required to start onboarding.');
  }
  return actor.id;
}

function sanitiseProfile(profile = {}) {
  return {
    companyName: requireString(profile.companyName, 'Company or brand name', { max: 180 }),
    role: requireString(profile.role, 'Role', { max: 120 }),
    timezone: requireString(profile.timezone, 'Timezone', { max: 80 }),
    headline: coerceString(profile.headline, { max: 255 }),
    northStar: coerceString(profile.northStar, { max: 1000 }),
  };
}

function sanitisePreferences(preferences = {}) {
  const digestCadence = coerceString(preferences.digestCadence, { max: 40, fallback: 'weekly' }) || 'weekly';
  const updatesEnabled = preferences.updates == null ? true : Boolean(preferences.updates);
  const focusSignals = sanitiseStringArray(preferences.focusSignals, { maxItems: 6, itemMax: 160 });
  const storyThemes = sanitiseStringArray(preferences.storyThemes, { maxItems: 6, itemMax: 160 });
  const enableAiDrafts = preferences.enableAiDrafts == null ? true : Boolean(preferences.enableAiDrafts);

  return {
    digestCadence,
    updatesEnabled,
    focusSignals,
    storyThemes,
    enableAiDrafts,
  };
}

function sanitiseInvites(invites = []) {
  if (!Array.isArray(invites)) {
    return [];
  }
  const map = new Map();
  for (const invite of invites) {
    const email = normaliseEmail(invite?.email);
    if (!email) {
      continue;
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError(`Invite email \"${invite.email}\" is invalid.`);
    }
    const role = coerceString(invite?.role, { max: 120 });
    if (!map.has(email)) {
      map.set(email, {
        email,
        role,
      });
    }
  }
  return Array.from(map.values()).slice(0, 20);
}

async function archiveActiveJourneys({ userId, transaction }) {
  await OnboardingJourney.update(
    { status: 'archived' },
    {
      where: {
        userId,
        status: {
          [Op.notIn]: ['archived', 'completed'],
        },
      },
      transaction,
    },
  );
}

function buildJourneyPayload({ persona, userId, profile, preferences, invites }) {
  const now = new Date();
  return {
    personaId: persona.id,
    personaKey: persona.slug,
    personaTitle: persona.title,
    userId,
    status: 'launching',
    profileCompanyName: profile.companyName,
    profileRole: profile.role,
    profileTimezone: profile.timezone,
    profileHeadline: profile.headline,
    profileNorthStar: profile.northStar,
    preferencesDigestCadence: preferences.digestCadence,
    preferencesUpdatesEnabled: preferences.updatesEnabled,
    preferencesEnableAiDrafts: preferences.enableAiDrafts,
    preferencesFocusSignals: preferences.focusSignals,
    preferencesStoryThemes: preferences.storyThemes,
    invitedCount: invites.length,
    launchedAt: now,
    metadata: {
      personaSnapshot: {
        subtitle: persona.subtitle,
        headline: persona.headline,
        benefits: persona.benefits,
        metrics: persona.metrics,
        signatureMoments: persona.signatureMoments,
        recommendedModules: persona.recommendedModules,
        heroMedia: persona.heroMedia,
      },
      personaMetadata: persona.metadata,
    },
  };
}

function sanitiseJourneyOutput(journey, persona, invites, preferences, profile) {
  return {
    id: journey.id,
    status: journey.status,
    persona: {
      id: persona.slug,
      title: persona.title,
      subtitle: persona.subtitle,
      headline: persona.headline,
      recommendedModules: Array.isArray(persona.recommendedModules) ? persona.recommendedModules : [],
      heroMedia: persona.heroMedia ?? {},
      metadata: persona.metadata ?? {},
    },
    profile,
    preferences: {
      digestCadence: preferences.digestCadence,
      updates: preferences.updatesEnabled,
      enableAiDrafts: preferences.enableAiDrafts,
      focusSignals: preferences.focusSignals,
      storyThemes: preferences.storyThemes,
    },
    invites: invites.map((invite) => ({
      email: invite.email,
      role: invite.role,
      status: invite.status,
      invitedAt: invite.invitedAt?.toISOString?.() ?? invite.invitedAt,
    })),
    invitedCount: invites.length,
    launchedAt: journey.launchedAt?.toISOString?.() ?? null,
    completedAt: journey.completedAt?.toISOString?.() ?? null,
  };
}

export async function startJourney({ actor, payload }) {
  const userId = assertActor(actor);
  const personaKey = normaliseSlug(
    payload?.personaKey ?? payload?.personaId ?? payload?.personaSlug,
    { fallback: null },
  );
  if (!personaKey) {
    throw new ValidationError('Persona selection is required.');
  }

  const persona = await OnboardingPersona.findOne({
    where: {
      slug: personaKey,
      status: 'active',
    },
  });
  if (!persona) {
    throw new NotFoundError('The selected persona is unavailable.');
  }

  const profile = sanitiseProfile(payload?.profile ?? {});
  const preferences = sanitisePreferences(payload?.preferences ?? {});
  const invites = sanitiseInvites(payload?.invites ?? []);
  if (!invites.length) {
    throw new ValidationError('Invite at least one collaborator to continue.');
  }

  const journeyPayload = buildJourneyPayload({ persona, userId, profile, preferences, invites });

  const result = await sequelize.transaction(async (transaction) => {
    await archiveActiveJourneys({ userId, transaction });

    const journey = await OnboardingJourney.create(journeyPayload, { transaction });

    const inviteRecords = await OnboardingJourneyInvite.bulkCreate(
      invites.map((invite) => ({
        journeyId: journey.id,
        email: invite.email,
        role: invite.role,
        status: 'pending',
        invitedAt: new Date(),
      })),
      { returning: true, transaction },
    );

    return { journey, inviteRecords };
  });

  logger.info(
    {
      event: 'onboarding.journey.started',
      userId,
      persona: persona.slug,
      invitedCount: result.inviteRecords.length,
      digestCadence: preferences.digestCadence,
    },
    'Onboarding journey started',
  );

  return sanitiseJourneyOutput(
    result.journey,
    persona,
    result.inviteRecords,
    preferences,
    profile,
  );
}

export default {
  listPersonas,
  startJourney,
  ONBOARDING_JOURNEY_STATUSES,
};
