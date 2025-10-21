import crypto from 'crypto';
import fetch from 'node-fetch';
import {
  User,
  Profile,
  FreelancerProfile,
  FreelancerDashboardOverview,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:freelancer:overview';
const CACHE_TTL_SECONDS = 60;
const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const WEATHER_CODE_DESCRIPTIONS = new Map([
  [0, { label: 'Clear sky', icon: 'sun' }],
  [1, { label: 'Mainly clear', icon: 'sun-small-cloud' }],
  [2, { label: 'Partly cloudy', icon: 'sun-cloud' }],
  [3, { label: 'Overcast', icon: 'cloud' }],
  [45, { label: 'Foggy', icon: 'fog' }],
  [48, { label: 'Depositing rime fog', icon: 'fog' }],
  [51, { label: 'Light drizzle', icon: 'drizzle' }],
  [53, { label: 'Moderate drizzle', icon: 'drizzle' }],
  [55, { label: 'Heavy drizzle', icon: 'drizzle' }],
  [56, { label: 'Light freezing drizzle', icon: 'drizzle' }],
  [57, { label: 'Freezing drizzle', icon: 'drizzle' }],
  [61, { label: 'Light rain', icon: 'rain' }],
  [63, { label: 'Rain', icon: 'rain' }],
  [65, { label: 'Heavy rain', icon: 'rain' }],
  [66, { label: 'Freezing rain', icon: 'sleet' }],
  [67, { label: 'Heavy freezing rain', icon: 'sleet' }],
  [71, { label: 'Light snow', icon: 'snow' }],
  [73, { label: 'Snow', icon: 'snow' }],
  [75, { label: 'Heavy snow', icon: 'snow' }],
  [77, { label: 'Snow grains', icon: 'snow' }],
  [80, { label: 'Rain showers', icon: 'rain' }],
  [81, { label: 'Heavy rain showers', icon: 'rain' }],
  [82, { label: 'Violent rain showers', icon: 'rain' }],
  [85, { label: 'Snow showers', icon: 'snow' }],
  [86, { label: 'Heavy snow showers', icon: 'snow' }],
  [95, { label: 'Thunderstorm', icon: 'storm' }],
  [96, { label: 'Thunderstorm with hail', icon: 'storm' }],
  [99, { label: 'Severe thunderstorm', icon: 'storm' }],
]);

function normalizeFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

function toNumber(value, fallback = null) {
  if (value == null) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function createIdentifier() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
}

function sanitizeTone(value, fallback = 'slate') {
  const allowed = new Set(['slate', 'blue', 'emerald', 'amber', 'rose', 'violet']);
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  return allowed.has(normalised) ? normalised : fallback;
}

function sanitizeWorkstreams(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const label = typeof item.label === 'string' && item.label.trim().length
        ? item.label.trim()
        : `Workstream ${index + 1}`;
      const status = typeof item.status === 'string' ? item.status.trim() : '';
      const dueDateLabel = typeof item.dueDateLabel === 'string' ? item.dueDateLabel.trim() : null;
      const tone = sanitizeTone(item.tone, status.toLowerCase().includes('due') ? 'amber' : 'blue');
      return {
        id: typeof item.id === 'string' && item.id.trim().length ? item.id.trim() : createIdentifier(),
        label,
        status,
        dueDateLabel,
        tone,
        link: typeof item.link === 'string' && item.link.trim().length ? item.link.trim() : null,
      };
    })
    .filter(Boolean);
}

function sanitizeSchedule(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const label = typeof item.label === 'string' && item.label.trim().length
        ? item.label.trim()
        : `Event ${index + 1}`;
      const type = typeof item.type === 'string' && item.type.trim().length ? item.type.trim() : 'Session';
      const tone = sanitizeTone(item.tone, type.toLowerCase().includes('call') ? 'blue' : 'slate');
      return {
        id: typeof item.id === 'string' && item.id.trim().length ? item.id.trim() : createIdentifier(),
        label,
        type,
        tone,
        startsAt: typeof item.startsAt === 'string' && item.startsAt.trim().length ? item.startsAt.trim() : null,
        link: typeof item.link === 'string' && item.link.trim().length ? item.link.trim() : null,
      };
    })
    .filter(Boolean);
}

function sanitizeRelationshipHealth(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      retentionScore: null,
      retentionNotes: null,
      retentionStatus: null,
      advocacyInProgress: null,
      advocacyNotes: null,
    };
  }

  return {
    retentionScore: toNumber(payload.retentionScore, null),
    retentionNotes:
      typeof payload.retentionNotes === 'string' && payload.retentionNotes.trim().length
        ? payload.retentionNotes.trim()
        : null,
    retentionStatus:
      typeof payload.retentionStatus === 'string' && payload.retentionStatus.trim().length
        ? payload.retentionStatus.trim()
        : null,
    advocacyInProgress: toNumber(payload.advocacyInProgress, null),
    advocacyNotes:
      typeof payload.advocacyNotes === 'string' && payload.advocacyNotes.trim().length
        ? payload.advocacyNotes.trim()
        : null,
  };
}

function describeWeather(code) {
  if (!Number.isFinite(code)) {
    return { label: 'Unavailable', icon: 'unknown' };
  }
  return WEATHER_CODE_DESCRIPTIONS.get(Number(code)) ?? { label: 'Conditions unavailable', icon: 'unknown' };
}

function convertTemperature(valueCelsius, units = 'metric') {
  if (!Number.isFinite(valueCelsius)) {
    return null;
  }
  if (units === 'imperial') {
    return (valueCelsius * 9) / 5 + 32;
  }
  return valueCelsius;
}

async function fetchWeatherSnapshot({ latitude, longitude, units }) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('timezone', 'auto');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  let response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`Weather API responded with status ${response.status}`);
  }

  const body = await response.json();
  const temperature = Number(body?.current?.temperature_2m ?? body?.current_weather?.temperature ?? null);
  const weatherCode = Number(body?.current?.weather_code ?? body?.current_weather?.weathercode ?? null);
  const timezone = typeof body?.timezone === 'string' ? body.timezone : null;

  return {
    provider: 'open-meteo',
    fetchedAt: new Date().toISOString(),
    temperatureCelsius: Number.isFinite(temperature) ? temperature : null,
    weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
    timezone,
    raw: body,
    units,
  };
}

function formatWeatherSnapshot(snapshot, { locationName, units }) {
  if (!snapshot) {
    return null;
  }
  const descriptor = describeWeather(snapshot.weatherCode);
  const resolvedUnits = units === 'imperial' ? 'imperial' : 'metric';
  const value = convertTemperature(snapshot.temperatureCelsius, resolvedUnits);
  return {
    provider: snapshot.provider ?? 'open-meteo',
    fetchedAt: snapshot.fetchedAt ?? null,
    locationName: locationName ?? null,
    temperature: value != null ? Number(value.toFixed(1)) : null,
    units: resolvedUnits,
    condition: descriptor.label,
    icon: descriptor.icon,
    timezone: snapshot.timezone ?? null,
  };
}

async function maybeRefreshWeather(record) {
  if (!record) {
    return { weather: null, record };
  }

  const latitude = toNumber(record.weatherLatitude, null);
  const longitude = toNumber(record.weatherLongitude, null);
  if (latitude == null || longitude == null) {
    return { weather: formatWeatherSnapshot(record.weatherSnapshot, { locationName: record.weatherLocation, units: record.weatherUnits }), record };
  }

  const lastChecked = record.weatherLastCheckedAt ? new Date(record.weatherLastCheckedAt) : null;
  const hasSnapshot = record.weatherSnapshot != null;
  const snapshot = hasSnapshot ? record.weatherSnapshot : null;
  const now = Date.now();
  const shouldRefresh =
    !snapshot ||
    !lastChecked ||
    Number.isNaN(lastChecked.getTime()) ||
    now - lastChecked.getTime() > WEATHER_REFRESH_INTERVAL_MS;

  if (!shouldRefresh) {
    return {
      weather: formatWeatherSnapshot(snapshot, { locationName: record.weatherLocation, units: record.weatherUnits }),
      record,
    };
  }

  try {
    const fetched = await fetchWeatherSnapshot({ latitude, longitude, units: record.weatherUnits });
    record.weatherSnapshot = fetched;
    record.weatherLastCheckedAt = new Date();
    await record.save({ fields: ['weatherSnapshot', 'weatherLastCheckedAt'] });
    return {
      weather: formatWeatherSnapshot(fetched, { locationName: record.weatherLocation, units: record.weatherUnits }),
      record,
    };
  } catch (error) {
    logger.warn({ err: error, latitude, longitude }, 'Failed to refresh weather snapshot for freelancer overview');
    return {
      weather: formatWeatherSnapshot(snapshot, { locationName: record.weatherLocation, units: record.weatherUnits }),
      record,
    };
  }
}

function resolveDisplayName(user) {
  const parts = [user?.firstName, user?.lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  if (user?.email) {
    return user.email;
  }
  return 'Gigvora Freelancer';
}

function fallbackAvatar(name) {
  const base = encodeURIComponent(name ?? 'freelancer');
  return `https://avatar.vercel.sh/${base}.svg?text=${encodeURIComponent(name?.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2) || 'GF')}`;
}

async function loadFreelancerContext(freelancerId) {
  const user = await User.findByPk(freelancerId, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
    include: [
      {
        model: Profile,
        required: false,
      },
      {
        model: FreelancerProfile,
        required: false,
      },
      {
        model: FreelancerDashboardOverview,
        as: 'freelancerDashboardOverview',
        required: false,
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('Freelancer not found.', { freelancerId });
  }

  if (user.userType && user.userType !== 'freelancer') {
    throw new ValidationError('Dashboard overview is only available for freelancer accounts.');
  }

  return user;
}

function resolveTimezone({ overview, profile, freelancerProfile }) {
  return (
    overview?.metadata?.timezone ??
    overview?.metadata?.timeZone ??
    profile?.timezone ??
    freelancerProfile?.geoLocation?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function buildOverviewPayload({ user, overviewRecord, weather }) {
  const profile = user.Profile ?? user.profile ?? null;
  const freelancerProfile = user.FreelancerProfile ?? user.freelancerProfile ?? null;
  const overview = overviewRecord ? overviewRecord.get({ plain: true }) : {};

  const name = resolveDisplayName(user);
  const headline = overview.headline ?? profile?.headline ?? freelancerProfile?.title ?? null;
  const summary = overview.summary ?? profile?.missionStatement ?? null;
  const avatarUrl = overview.avatarUrl ?? fallbackAvatar(name);

  const followerCount = overview.followerCount ?? profile?.followersCount ?? 0;
  const followerGoal = overview.followerGoal ?? 0;
  const trustScore = overview.trustScore ?? profile?.trustScore ?? null;
  const trustScoreChange = overview.trustScoreChange ?? null;
  const rating = overview.rating ?? null;
  const ratingCount = overview.ratingCount ?? null;

  const workstreams = sanitizeWorkstreams(overview.workstreams);
  const relationshipHealth = sanitizeRelationshipHealth(overview.relationshipHealth);
  const upcomingSchedule = sanitizeSchedule(overview.upcomingSchedule);

  const timezone = resolveTimezone({ overview, profile, freelancerProfile });
  const now = new Date();
  const formattedDate = (() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: timezone,
      }).format(now);
    } catch (error) {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(now);
    }
  })();

  const weatherSettings = {
    locationName: overview.weatherLocation ?? null,
    latitude: overview.weatherLatitude != null ? Number(overview.weatherLatitude) : null,
    longitude: overview.weatherLongitude != null ? Number(overview.weatherLongitude) : null,
    units: overview.weatherUnits ?? 'metric',
  };

  const weatherPayload = weather
    ? { ...weather, settings: weatherSettings }
    : weatherSettings.locationName || weatherSettings.latitude != null
    ? { ...weatherSettings, provider: null, fetchedAt: null, condition: null, icon: 'unknown', temperature: null }
    : null;

  return {
    profile: {
      id: user.id,
      name,
      headline,
      summary,
      avatarUrl,
      followerCount,
      followerGoal,
      trustScore: trustScore != null ? Number(trustScore) : null,
      trustScoreChange: trustScoreChange != null ? Number(trustScoreChange) : null,
      rating: rating != null ? Number(rating) : null,
      ratingCount,
      location: overview.weatherLocation ?? profile?.location ?? freelancerProfile?.location ?? null,
    },
    metrics: {
      followerCount,
      followerGoal,
      trustScore: trustScore != null ? Number(trustScore) : null,
      trustScoreChange: trustScoreChange != null ? Number(trustScoreChange) : null,
      rating: rating != null ? Number(rating) : null,
      ratingCount,
    },
    workstreams,
    relationshipHealth,
    upcomingSchedule,
    weather: weatherPayload,
    weatherSettings,
    currentDate: {
      iso: now.toISOString(),
      formatted: formattedDate,
      timezone,
    },
    metadata: {
      generatedAt: now.toISOString(),
    },
  };
}

export async function getFreelancerDashboardOverview(freelancerId, { bypassCache = false } = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  const resolver = async () => {
    const user = await loadFreelancerContext(normalizedId);
    const overviewRecord = user.freelancerDashboardOverview ?? null;
    const { weather } = await maybeRefreshWeather(overviewRecord);
    return buildOverviewPayload({ user, overviewRecord, weather });
  };

  if (bypassCache) {
    return resolver();
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, resolver);
}

function mergeMetadata(existingMetadata, updates) {
  const base = existingMetadata && typeof existingMetadata === 'object' ? { ...existingMetadata } : {};
  if (!updates || typeof updates !== 'object') {
    return base;
  }
  return { ...base, ...updates };
}

export async function updateFreelancerDashboardOverview(freelancerId, payload = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);

  const user = await loadFreelancerContext(normalizedId);
  const profile = user.Profile ?? user.profile ?? null;

  const [record] = await FreelancerDashboardOverview.findOrCreate({
    where: { freelancerId: normalizedId },
    defaults: { freelancerId: normalizedId },
  });

  const updates = { ...payload };

  if (updates.headline !== undefined) {
    record.headline = updates.headline ?? null;
    if (profile) {
      profile.headline = updates.headline ?? profile.headline ?? null;
    }
  }

  if (updates.summary !== undefined) {
    record.summary = updates.summary ?? null;
    if (profile) {
      profile.missionStatement = updates.summary ?? profile.missionStatement ?? null;
    }
  }

  if (updates.avatarUrl !== undefined) {
    record.avatarUrl = updates.avatarUrl && updates.avatarUrl.length ? updates.avatarUrl : null;
  }

  if (updates.followerCount !== undefined) {
    record.followerCount = Number.parseInt(updates.followerCount, 10) || 0;
    if (profile) {
      profile.followersCount = record.followerCount;
    }
  }

  if (updates.followerGoal !== undefined) {
    record.followerGoal = Number.parseInt(updates.followerGoal, 10) || 0;
  }

  if (updates.trustScore !== undefined) {
    record.trustScore = updates.trustScore == null ? null : Number(updates.trustScore);
    if (profile) {
      profile.trustScore = record.trustScore;
    }
  }

  if (updates.trustScoreChange !== undefined) {
    record.trustScoreChange = updates.trustScoreChange == null ? null : Number(updates.trustScoreChange);
  }

  if (updates.rating !== undefined) {
    record.rating = updates.rating == null ? null : Number(updates.rating);
  }

  if (updates.ratingCount !== undefined) {
    record.ratingCount = Number.parseInt(updates.ratingCount, 10) || 0;
  }

  if (updates.workstreams !== undefined) {
    record.workstreams = sanitizeWorkstreams(updates.workstreams);
  }

  if (updates.relationshipHealth !== undefined) {
    record.relationshipHealth = sanitizeRelationshipHealth(updates.relationshipHealth);
  }

  if (updates.upcomingSchedule !== undefined) {
    record.upcomingSchedule = sanitizeSchedule(updates.upcomingSchedule);
  }

  if (updates.weather !== undefined) {
    const weather = updates.weather ?? {};
    record.weatherLocation =
      typeof weather.locationName === 'string' && weather.locationName.trim().length
        ? weather.locationName.trim()
        : null;
    record.weatherLatitude =
      weather.latitude == null || weather.latitude === '' ? null : Number(weather.latitude);
    record.weatherLongitude =
      weather.longitude == null || weather.longitude === '' ? null : Number(weather.longitude);
    if (weather.units && ['metric', 'imperial'].includes(weather.units)) {
      record.weatherUnits = weather.units;
    }
    record.weatherSnapshot = null;
    record.weatherLastCheckedAt = null;
  }

  if (updates.timezone !== undefined) {
    record.metadata = mergeMetadata(record.metadata, { timezone: updates.timezone });
  }

  await record.save();
  if (profile) {
    await profile.save();
  }

  appCache.flushByPrefix(`${CACHE_NAMESPACE}:`);

  return getFreelancerDashboardOverview(normalizedId, { bypassCache: true });
}

export default {
  getFreelancerDashboardOverview,
  updateFreelancerDashboardOverview,
};
