import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WEATHER_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

const WEATHER_CODE_DESCRIPTORS = [
  { codes: [0], label: 'Clear sky', icon: 'sun' },
  { codes: [1, 2], label: 'Mostly clear', icon: 'sun-cloud' },
  { codes: [3], label: 'Overcast', icon: 'cloud' },
  { codes: [45, 48], label: 'Fog', icon: 'fog' },
  { codes: [51, 53, 55], label: 'Light drizzle', icon: 'rain-light' },
  { codes: [56, 57], label: 'Freezing drizzle', icon: 'rain-freezing' },
  { codes: [61, 63, 65], label: 'Rain', icon: 'rain' },
  { codes: [66, 67], label: 'Freezing rain', icon: 'rain-freezing' },
  { codes: [71, 73, 75], label: 'Snowfall', icon: 'snow' },
  { codes: [77], label: 'Snow grains', icon: 'snow' },
  { codes: [80, 81, 82], label: 'Rain showers', icon: 'rain-shower' },
  { codes: [85, 86], label: 'Snow showers', icon: 'snow' },
  { codes: [95], label: 'Thunderstorm', icon: 'thunder' },
  { codes: [96, 99], label: 'Severe thunderstorm', icon: 'thunder-hail' },
];

function mapWeatherDescriptor(code) {
  const numeric = Number.parseInt(code ?? 0, 10);
  const descriptor = WEATHER_CODE_DESCRIPTORS.find((entry) => entry.codes.includes(numeric));
  if (descriptor) {
    return descriptor;
  }
  if (numeric >= 51 && numeric <= 67) {
    return WEATHER_CODE_DESCRIPTORS.find((entry) => entry.label.startsWith('Rain')) ?? {
      label: 'Rain',
      icon: 'rain',
    };
  }
  if (numeric >= 71 && numeric <= 77) {
    return { label: 'Snow', icon: 'snow' };
  }
  if (numeric >= 80 && numeric <= 86) {
    return { label: 'Showers', icon: 'rain-shower' };
  }
  if (numeric >= 95 && numeric <= 99) {
    return { label: 'Thunderstorm', icon: 'thunder' };
  }
  return { label: 'Conditions unavailable', icon: 'cloud' };
}

async function fetchJson(url, { timeoutMs = 4000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodeLocation(query) {
  if (!query || typeof query !== 'string') {
    return null;
  }
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const cacheKey = buildCacheKey('weather:geocode', { query: trimmed.toLowerCase() });
  return appCache.remember(cacheKey, GEOCODE_CACHE_TTL_SECONDS, async () => {
    try {
      const params = new URLSearchParams({
        name: trimmed,
        count: '1',
        language: 'en',
        format: 'json',
      });
      const payload = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      const match = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!match) {
        return null;
      }

      const latitude = Number(match.latitude);
      const longitude = Number(match.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const segments = [match.name, match.admin1, match.country]
        .map((value) => (value ? String(value).trim() : null))
        .filter(Boolean);

      return {
        latitude,
        longitude,
        name: match.name ?? trimmed,
        displayName: segments.length ? segments.join(', ') : match.name ?? trimmed,
        timezone: match.timezone ?? null,
        country: match.country ?? null,
      };
    } catch (error) {
      logger.warn({ err: error, query: trimmed }, 'Failed to geocode location for weather snapshot');
      return null;
    }
  });
}

function normalizeCurrentWeather(payload, { latitude, longitude, locationName }) {
  const current = payload?.current_weather;
  if (!current) {
    return null;
  }

  const code = Number(current.weathercode);
  const descriptor = mapWeatherDescriptor(code);
  const observedAt = current.time ? new Date(current.time).toISOString() : null;

  return {
    latitude,
    longitude,
    locationName: locationName ?? null,
    temperatureCelsius: Number.isFinite(Number(current.temperature)) ? Number(current.temperature) : null,
    windSpeedKph: Number.isFinite(Number(current.windspeed)) ? Number(current.windspeed) : null,
    windDirection: Number.isFinite(Number(current.winddirection)) ? Number(current.winddirection) : null,
    weatherCode: Number.isFinite(code) ? code : null,
    weatherDescription: descriptor.label,
    weatherIcon: descriptor.icon,
    observedAt,
    raw: current,
  };
}

export async function getCurrentWeather({ latitude, longitude, locationName } = {}) {
  let lat = Number(latitude);
  let lon = Number(longitude);
  let resolvedLocationName = locationName ?? null;

  if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && locationName) {
    const geocoded = await geocodeLocation(locationName);
    if (geocoded) {
      lat = Number(geocoded.latitude);
      lon = Number(geocoded.longitude);
      resolvedLocationName = geocoded.displayName ?? geocoded.name ?? locationName;
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const cacheKey = buildCacheKey('weather:current', {
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
  });

  return appCache.remember(cacheKey, WEATHER_CACHE_TTL_SECONDS, async () => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'UTC');

    try {
      const payload = await fetchJson(url.toString());
      const normalized = normalizeCurrentWeather(payload, {
        latitude: lat,
        longitude: lon,
        locationName: resolvedLocationName,
      });
      if (!normalized) {
        return null;
      }
      return normalized;
    } catch (error) {
      logger.warn(
        { err: error, latitude: lat, longitude: lon, locationName: resolvedLocationName },
        'Failed to load current weather snapshot',
      );
      return null;
    }
  });
}

export default {
  geocodeLocation,
  getCurrentWeather,
};
