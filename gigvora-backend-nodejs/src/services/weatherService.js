import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours
const WEATHER_TIMEOUT_MS = Number.parseInt(process.env.WEATHER_TIMEOUT_MS ?? '5000', 10);

const WEATHER_CODE_DETAILS = {
  0: { label: 'Clear sky', icon: 'sun', category: 'clear' },
  1: { label: 'Mainly clear', icon: 'sun', category: 'clear' },
  2: { label: 'Partly cloudy', icon: 'cloud-sun', category: 'cloudy' },
  3: { label: 'Overcast', icon: 'cloud', category: 'cloudy' },
  45: { label: 'Fog', icon: 'fog', category: 'fog' },
  48: { label: 'Depositing rime fog', icon: 'fog', category: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle', category: 'drizzle' },
  53: { label: 'Moderate drizzle', icon: 'drizzle', category: 'drizzle' },
  55: { label: 'Dense drizzle', icon: 'drizzle', category: 'drizzle' },
  56: { label: 'Light freezing drizzle', icon: 'snow', category: 'drizzle' },
  57: { label: 'Dense freezing drizzle', icon: 'snow', category: 'drizzle' },
  61: { label: 'Slight rain', icon: 'rain', category: 'rain' },
  63: { label: 'Moderate rain', icon: 'rain', category: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain', category: 'rain' },
  66: { label: 'Light freezing rain', icon: 'snow', category: 'rain' },
  67: { label: 'Heavy freezing rain', icon: 'snow', category: 'rain' },
  71: { label: 'Slight snowfall', icon: 'snow', category: 'snow' },
  73: { label: 'Moderate snowfall', icon: 'snow', category: 'snow' },
  75: { label: 'Heavy snowfall', icon: 'snow', category: 'snow' },
  77: { label: 'Snow grains', icon: 'snow', category: 'snow' },
  80: { label: 'Slight rain showers', icon: 'rain', category: 'rain' },
  81: { label: 'Moderate rain showers', icon: 'rain', category: 'rain' },
  82: { label: 'Violent rain showers', icon: 'rain', category: 'rain' },
  85: { label: 'Slight snow showers', icon: 'snow', category: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow', category: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm', category: 'storm' },
  96: { label: 'Thunderstorm with hail', icon: 'storm', category: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'storm', category: 'storm' },
};

function normalizeNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function celsiusToFahrenheit(value) {
  if (value == null) {
    return null;
  }
  return Math.round(((Number(value) * 9) / 5 + 32) * 10) / 10;
}

function fahrenheitToCelsius(value) {
  if (value == null) {
    return null;
  }
  return Math.round(((Number(value) - 32) * 5) / 9 * 10) / 10;
}

function kilometresPerHourToMilesPerHour(value) {
  if (value == null) {
    return null;
  }
  return Math.round(Number(value) * 0.621371 * 10) / 10;
}

function milesPerHourToKilometresPerHour(value) {
  if (value == null) {
    return null;
  }
  return Math.round(Number(value) / 0.621371 * 10) / 10;
}

function describeWeather(code) {
  const numeric = normalizeNumber(code);
  if (numeric == null) {
    return { label: 'Conditions unavailable', icon: 'na', category: 'unknown' };
  }
  return WEATHER_CODE_DETAILS[numeric] ?? { label: 'Weather update', icon: 'na', category: 'unknown' };
}

async function fetchJson(url, { timeoutMs = WEATHER_TIMEOUT_MS, init } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...(init ?? {}),
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
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
      const params = new URLSearchParams({ name: trimmed, count: '1', language: 'en' });
      const payload = await fetchJson(`${GEOCODE_ENDPOINT}?${params.toString()}`);
      const result = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!result) {
        return null;
      }

      const latitude = normalizeNumber(result.latitude);
      const longitude = normalizeNumber(result.longitude);
      if (latitude == null || longitude == null) {
        return null;
      }

      const segments = [result.name, result.admin1, result.country_code]
        .map((value) => (value ? `${value}`.trim() : null))
        .filter(Boolean);

      return {
        name: result.name ?? trimmed,
        displayName: segments.length ? segments.join(', ') : result.name ?? trimmed,
        latitude,
        longitude,
        timezone: result.timezone ?? null,
        countryCode: result.country_code ?? null,
      };
    } catch (error) {
      logger.warn({ err: error, query: trimmed }, 'Failed to geocode location for weather snapshot');
      return null;
    }
  });
}

async function fetchWeatherFromApi({ latitude, longitude, units = 'metric' }) {
  const params = new URLSearchParams({
    latitude: `${latitude}`,
    longitude: `${longitude}`,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m',
    timezone: 'auto',
  });

  if (units === 'imperial') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
  } else {
    params.set('temperature_unit', 'celsius');
    params.set('wind_speed_unit', 'kmh');
  }

  const payload = await fetchJson(`${WEATHER_ENDPOINT}?${params.toString()}`);
  const current = payload?.current;
  const unitsMeta = payload?.current_units ?? {};
  if (!current) {
    return null;
  }

  return {
    provider: 'open-meteo',
    timezone: payload?.timezone ?? null,
    observedAt: current.time ?? null,
    weatherCode: normalizeNumber(current.weather_code ?? current.weathercode),
    temperatureValue: normalizeNumber(current.temperature_2m ?? current.temperature),
    apparentTemperatureValue: normalizeNumber(current.apparent_temperature ?? null),
    humidityValue: normalizeNumber(current.relative_humidity_2m ?? null),
    windSpeedValue: normalizeNumber(current.wind_speed_10m ?? current.windspeed),
    windDirectionValue: normalizeNumber(current.wind_direction_10m ?? current.winddirection),
    units: {
      temperature: unitsMeta.temperature_2m ?? (units === 'imperial' ? '°F' : '°C'),
      apparentTemperature: unitsMeta.apparent_temperature ?? (units === 'imperial' ? '°F' : '°C'),
      humidity: unitsMeta.relative_humidity_2m ?? '%',
      windSpeed: unitsMeta.wind_speed_10m ?? (units === 'imperial' ? 'mph' : 'km/h'),
    },
    raw: current,
  };
}

function mapSnapshotToResponse({
  payload,
  latitude,
  longitude,
  resolvedLabel,
  units,
}) {
  if (!payload) {
    return null;
  }

  const descriptor = describeWeather(payload.weatherCode);
  const tempUnit = payload.units.temperature?.toLowerCase() ?? '°c';
  const windUnit = payload.units.windSpeed?.toLowerCase() ?? 'km/h';

  const temperatureMetric =
    tempUnit.includes('f') && payload.temperatureValue != null
      ? fahrenheitToCelsius(payload.temperatureValue)
      : payload.temperatureValue;
  const temperatureImperial =
    tempUnit.includes('c') && payload.temperatureValue != null
      ? celsiusToFahrenheit(payload.temperatureValue)
      : payload.temperatureValue;

  const windSpeedMetric =
    windUnit.includes('mph') && payload.windSpeedValue != null
      ? milesPerHourToKilometresPerHour(payload.windSpeedValue)
      : payload.windSpeedValue;
  const windSpeedImperial =
    windUnit.includes('km') && payload.windSpeedValue != null
      ? kilometresPerHourToMilesPerHour(payload.windSpeedValue)
      : payload.windSpeedValue;

  return {
    provider: payload.provider,
    timezone: payload.timezone ?? null,
    observedAt: payload.observedAt ? new Date(payload.observedAt).toISOString() : new Date().toISOString(),
    conditionCode: payload.weatherCode,
    condition: descriptor.label,
    icon: descriptor.icon,
    category: descriptor.category,
    latitude: Number(latitude),
    longitude: Number(longitude),
    location: resolvedLabel ?? null,
    units,
    temperature: {
      value: payload.temperatureValue,
      unit: payload.units.temperature,
    },
    apparentTemperature: {
      value: payload.apparentTemperatureValue,
      unit: payload.units.apparentTemperature,
    },
    humidity: {
      value: payload.humidityValue,
      unit: payload.units.humidity,
    },
    windSpeed: {
      value: payload.windSpeedValue,
      unit: payload.units.windSpeed,
    },
    windDirection: payload.windDirectionValue,
    temperatureC: temperatureMetric,
    temperatureF: temperatureImperial,
    windSpeedKph: windSpeedMetric,
    windSpeedMph: windSpeedImperial,
    humidityPercentage: payload.humidityValue,
    raw: payload.raw,
  };
}

export async function getWeatherSnapshot({
  location,
  latitude,
  longitude,
  units = 'metric',
  forceRefresh = false,
} = {}) {
  const normalisedUnits = units === 'imperial' ? 'imperial' : 'metric';
  let resolvedLatitude = normalizeNumber(latitude);
  let resolvedLongitude = normalizeNumber(longitude);
  let resolvedLabel = location ?? null;
  let resolvedTimezone = null;

  if ((resolvedLatitude == null || resolvedLongitude == null) && location) {
    const geocoded = await geocodeLocation(location);
    if (!geocoded) {
      return null;
    }
    resolvedLatitude = geocoded.latitude;
    resolvedLongitude = geocoded.longitude;
    resolvedLabel = geocoded.displayName ?? geocoded.name ?? location;
    resolvedTimezone = geocoded.timezone ?? null;
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

  const payload = await appCache.remember(cacheKey, WEATHER_CACHE_TTL_SECONDS, async () => {
    try {
      return await fetchWeatherFromApi({ latitude: resolvedLatitude, longitude: resolvedLongitude, units: normalisedUnits });
    } catch (error) {
      logger.warn({ err: error, latitude: resolvedLatitude, longitude: resolvedLongitude }, 'Failed to load weather snapshot');
      return null;
    }
  });

  if (!payload) {
    return null;
  }

  const snapshot = mapSnapshotToResponse({
    payload,
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    resolvedLabel,
    units: normalisedUnits,
  });

  if (snapshot && resolvedTimezone && !snapshot.timezone) {
    snapshot.timezone = resolvedTimezone;
  }

  return snapshot;
}

export async function getCurrentWeather({ latitude, longitude, locationName, units = 'metric', forceRefresh = false } = {}) {
  const snapshot = await getWeatherSnapshot({
    latitude,
    longitude,
    location: locationName ?? null,
    units,
    forceRefresh,
  });
  if (!snapshot) {
    return null;
  }
  return {
    provider: snapshot.provider,
    observedAt: snapshot.observedAt,
    locationName: snapshot.location,
    conditionCode: snapshot.conditionCode,
    conditionLabel: snapshot.condition,
    icon: snapshot.icon,
    category: snapshot.category,
    temperatureC: snapshot.temperatureC,
    temperatureF: snapshot.temperatureF,
    windSpeedKph: snapshot.windSpeedKph,
    windSpeedMph: snapshot.windSpeedMph,
  };
}

export async function fetchCurrentWeather({ latitude, longitude }) {
  const lat = normalizeNumber(latitude);
  const lon = normalizeNumber(longitude);
  if (lat == null || lon == null) {
    throw new ValidationError('Latitude and longitude are required to fetch weather.');
  }

  const snapshot = await getWeatherSnapshot({ latitude: lat, longitude: lon, units: 'metric', forceRefresh: true });
  if (!snapshot) {
    return null;
  }
  return {
    provider: snapshot.provider,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    timezone: snapshot.timezone ?? null,
    observedAt: snapshot.observedAt,
    temperatureC: snapshot.temperatureC,
    temperatureF: snapshot.temperatureF,
    windSpeedKph: snapshot.windSpeedKph,
    windSpeedMph: snapshot.windSpeedMph,
    windDirection: snapshot.windDirection,
    weatherCode: snapshot.conditionCode,
    category: snapshot.category,
    description: snapshot.condition,
    raw: snapshot.raw,
  };
}

export async function fetchWeatherSummary({ latitude, longitude, timezone }) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return null;
  }

  const snapshot = await getWeatherSnapshot({ latitude, longitude, units: 'metric' });
  if (!snapshot) {
    return null;
  }

  return {
    provider: snapshot.provider,
    description: snapshot.condition,
    icon: snapshot.icon,
    temperature: snapshot.temperature.value,
    temperatureUnit: snapshot.temperature.unit,
    windSpeed: snapshot.windSpeed.value,
    windSpeedUnit: snapshot.windSpeed.unit,
    humidity: snapshot.humidity.value,
    humidityUnit: snapshot.humidity.unit ?? (snapshot.humidity.value != null ? '%' : null),
    observationTime: snapshot.observedAt,
    timezone: timezone ?? snapshot.timezone ?? null,
  };
}

export default {
  geocodeLocation,
  getWeatherSnapshot,
  getCurrentWeather,
  fetchCurrentWeather,
  fetchWeatherSummary,
};
