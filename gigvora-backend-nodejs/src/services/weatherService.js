import logger from '../utils/logger.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WEATHER_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

function describeWeatherCode(code) {
  const numeric = Number(code);
  if (Number.isNaN(numeric)) {
    return 'Conditions unavailable';
  }

  if (numeric === 0) return 'Clear skies';
  if (numeric === 1) return 'Mainly clear';
  if (numeric === 2) return 'Partly cloudy';
  if (numeric === 3) return 'Overcast';
  if ([45, 48].includes(numeric)) return 'Foggy';
  if ([51, 53, 55].includes(numeric)) return 'Drizzle';
  if ([56, 57].includes(numeric)) return 'Freezing drizzle';
  if ([61, 63, 65].includes(numeric)) return 'Rain';
  if ([66, 67].includes(numeric)) return 'Freezing rain';
  if ([71, 73, 75].includes(numeric)) return 'Snowfall';
  if ([77].includes(numeric)) return 'Snow grains';
  if ([80, 81, 82].includes(numeric)) return 'Showers';
  if ([85, 86].includes(numeric)) return 'Snow showers';
  if ([95].includes(numeric)) return 'Thunderstorm';
  if ([96, 99].includes(numeric)) return 'Thunderstorm with hail';
  return 'Weather update';
}

async function geocodeLocation(query) {
  if (!query) {
    return null;
  }

  const cacheKey = buildCacheKey('weather:geocode', { query });
  return appCache.remember(cacheKey, GEOCODE_CACHE_TTL_SECONDS, async () => {
    try {
      const params = new URLSearchParams({ name: query, count: '1', language: 'en' });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Geocoding API responded with status ${response.status}`);
      }
      const payload = await response.json();
      const result = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!result) {
        return null;
      }

      const segments = [result.name, result.admin1, result.country_code]
        .map((value) => (value ? `${value}`.trim() : null))
        .filter(Boolean);

      return {
        name: result.name ?? query,
        displayName: segments.length ? segments.join(', ') : result.name ?? query,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone ?? null,
        countryCode: result.country_code ?? null,
      };
    } catch (error) {
      logger.warn({ err: error, query }, 'Failed to geocode location for weather snapshot');
      return null;
    }
  });
}

async function fetchWeatherFromApi({ latitude, longitude, units = 'metric' }) {
  const params = new URLSearchParams({
    latitude: `${latitude}`,
    longitude: `${longitude}`,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    timezone: 'auto',
  });

  if (units === 'imperial') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
  } else {
    params.set('temperature_unit', 'celsius');
    params.set('wind_speed_unit', 'kmh');
  }

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather API responded with status ${response.status}`);
  }

  const payload = await response.json();
  const current = payload?.current;
  const unitsMeta = payload?.current_units ?? {};
  if (!current) {
    return null;
  }

  return {
    provider: 'open-meteo',
    conditionCode: current.weather_code ?? null,
    condition: describeWeatherCode(current.weather_code),
    observedAt: current.time ?? null,
    temperature: {
      value: current.temperature_2m ?? null,
      unit: unitsMeta.temperature_2m ?? (units === 'imperial' ? '°F' : '°C'),
    },
    apparentTemperature: {
      value: current.apparent_temperature ?? null,
      unit: unitsMeta.apparent_temperature ?? (units === 'imperial' ? '°F' : '°C'),
    },
    humidity: {
      value: current.relative_humidity_2m ?? null,
      unit: unitsMeta.relative_humidity_2m ?? '%',
    },
    windSpeed: {
      value: current.wind_speed_10m ?? null,
      unit: unitsMeta.wind_speed_10m ?? (units === 'imperial' ? 'mph' : 'km/h'),
    },
    units,
    updatedAt: new Date().toISOString(),
  };
}

export async function getWeatherSnapshot({
  location,
  latitude,
  longitude,
  units = 'metric',
  forceRefresh = false,
} = {}) {
  try {
    const normalisedUnits = units === 'imperial' ? 'imperial' : 'metric';
    let resolvedLatitude = latitude;
    let resolvedLongitude = longitude;
    let resolvedLabel = null;

    if ((resolvedLatitude == null || resolvedLongitude == null) && location) {
      const geocoded = await geocodeLocation(location);
      if (!geocoded) {
        return null;
      }
      resolvedLatitude = geocoded.latitude;
      resolvedLongitude = geocoded.longitude;
      resolvedLabel = geocoded.displayName ?? geocoded.name ?? location;
    }

    if (resolvedLatitude == null || resolvedLongitude == null) {
      return null;
    }

    const cacheKey = buildCacheKey('weather:snapshot', {
      latitude: Number(resolvedLatitude).toFixed(3),
      longitude: Number(resolvedLongitude).toFixed(3),
      units: normalisedUnits,
    });

    if (forceRefresh) {
      appCache.delete(cacheKey);
    }

    const snapshot = await appCache.remember(cacheKey, WEATHER_CACHE_TTL_SECONDS, async () => {
      const data = await fetchWeatherFromApi({
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        units: normalisedUnits,
      });
      return data ?? null;
    });

    if (!snapshot) {
      return null;
    }

    return {
      ...snapshot,
      latitude: Number(resolvedLatitude),
      longitude: Number(resolvedLongitude),
      location: snapshot.location ?? resolvedLabel ?? location ?? null,
      units: normalisedUnits,
    };
  } catch (error) {
    logger.warn({ err: error, location, latitude, longitude }, 'Failed to load weather snapshot');
    return null;
  }
}

export default {
  getWeatherSnapshot,
};
