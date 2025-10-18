import fetch from 'node-fetch';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WEATHER_CACHE_TTL = 60 * 10; // 10 minutes
const GEOCODE_CACHE_TTL = 60 * 60; // 1 hour

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
  return { label: 'Unknown conditions', icon: 'cloud' };
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
  return appCache.remember(cacheKey, GEOCODE_CACHE_TTL, async () => {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    try {
      const payload = await fetchJson(url.toString());
      const match = payload?.results?.[0];
      if (!match) {
        return null;
      }
      const latitude = Number(match.latitude);
      const longitude = Number(match.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }
      return {
        latitude,
        longitude,
        name: match.name ?? trimmed,
        country: match.country ?? null,
        timezone: match.timezone ?? null,
      };
    } catch (error) {
      console.warn('Failed to geocode location for weather', { query: trimmed, error: error.message });
      return null;
    }
  });
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
      resolvedLocationName = geocoded.name ?? locationName;
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const cacheKey = buildCacheKey('weather:current', {
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
  });

  return appCache.remember(cacheKey, WEATHER_CACHE_TTL, async () => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'UTC');

    try {
      const payload = await fetchJson(url.toString());
      const current = payload?.current_weather;
      if (!current) {
        return null;
      }

      const descriptor = mapWeatherDescriptor(current.weathercode);

      const temperatureC = Number.isFinite(Number(current.temperature))
        ? Number(Number(current.temperature).toFixed(1))
        : null;
      const windSpeedKph = Number.isFinite(Number(current.windspeed))
        ? Number(Number(current.windspeed).toFixed(1))
        : null;

      return {
        temperatureC,
        windSpeedKph,
        conditionCode: current.weathercode ?? null,
        conditionLabel: descriptor.label,
        icon: descriptor.icon,
        provider: 'open-meteo',
        observedAt: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
        locationName: resolvedLocationName,
      };
    } catch (error) {
      console.warn('Failed to load weather snapshot', { latitude: lat, longitude: lon, error: error.message });
      return null;
    }
  });
}

export default {
  getCurrentWeather,
  geocodeLocation,
};
