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
import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const WEATHER_CODE_DESCRIPTIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

const WEATHER_CODE_CATEGORIES = {
  clear: new Set([0, 1]),
  cloudy: new Set([2, 3]),
  fog: new Set([45, 48]),
  drizzle: new Set([51, 53, 55, 56, 57]),
  rain: new Set([61, 63, 65, 66, 67, 80, 81, 82]),
  snow: new Set([71, 73, 75, 77, 85, 86]),
  storm: new Set([95, 96, 99]),
};

const WEATHER_TIMEOUT_MS = Number.parseInt(process.env.WEATHER_TIMEOUT_MS ?? '5000', 10);

function normalizeNumber(value) {
  if (value == null) {
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

function kilometresPerHourToMilesPerHour(value) {
  if (value == null) {
    return null;
  }
  return Math.round(Number(value) * 0.621371 * 10) / 10;
}

function resolveCategory(code) {
  const numericCode = Number(code);
  if (Number.isNaN(numericCode)) {
    return 'unknown';
  }
  if (WEATHER_CODE_CATEGORIES.clear.has(numericCode)) return 'clear';
  if (WEATHER_CODE_CATEGORIES.cloudy.has(numericCode)) return 'cloudy';
  if (WEATHER_CODE_CATEGORIES.fog.has(numericCode)) return 'fog';
  if (WEATHER_CODE_CATEGORIES.drizzle.has(numericCode)) return 'drizzle';
  if (WEATHER_CODE_CATEGORIES.rain.has(numericCode)) return 'rain';
  if (WEATHER_CODE_CATEGORIES.snow.has(numericCode)) return 'snow';
  if (WEATHER_CODE_CATEGORIES.storm.has(numericCode)) return 'storm';
  return 'unknown';
}

export async function fetchCurrentWeather({ latitude, longitude }) {
  const lat = normalizeNumber(latitude);
  const lon = normalizeNumber(longitude);

  if (lat == null || lon == null) {
    throw new ValidationError('Latitude and longitude are required to fetch weather.');
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('timezone', 'auto');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      const message = `Weather provider responded with status ${response.status}`;
      logger.warn({ message, status: response.status });
      throw new ValidationError('Unable to retrieve weather data at this time.');
    }

    const payload = await response.json();
    const current = payload?.current_weather ?? {};
    const temperatureC = normalizeNumber(current.temperature);
    const windSpeedKph = normalizeNumber(current.windspeed);
    const windDirection = normalizeNumber(current.winddirection);
    const weatherCode = normalizeNumber(current.weathercode);

    return {
      provider: 'open-meteo',
      latitude: lat,
      longitude: lon,
      timezone: payload?.timezone ?? null,
      observedAt: current.time ? new Date(current.time).toISOString() : null,
      temperatureC,
      temperatureF: celsiusToFahrenheit(temperatureC),
      windSpeedKph,
      windSpeedMph: kilometresPerHourToMilesPerHour(windSpeedKph),
      windDirection,
      weatherCode,
      category: resolveCategory(weatherCode),
      description: weatherCode != null ? WEATHER_CODE_DESCRIPTIONS[weatherCode] ?? 'Current conditions' : null,
      raw: current,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn({ message: 'Weather provider request timed out', latitude: lat, longitude: lon });
    } else if (error instanceof ValidationError) {
      throw error;
    } else {
      logger.warn({ message: 'Failed to load weather from provider', error: error.message, latitude: lat, longitude: lon });

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_CODE_LABELS = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Depositing rime fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Moderate drizzle', icon: 'drizzle' },
  55: { label: 'Dense drizzle', icon: 'drizzle' },
  56: { label: 'Light freezing drizzle', icon: 'snow' },
  57: { label: 'Dense freezing drizzle', icon: 'snow' },
  61: { label: 'Slight rain', icon: 'rain' },
  63: { label: 'Moderate rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Light freezing rain', icon: 'snow' },
  67: { label: 'Heavy freezing rain', icon: 'snow' },
  71: { label: 'Slight snow fall', icon: 'snow' },
  73: { label: 'Moderate snow fall', icon: 'snow' },
  75: { label: 'Heavy snow fall', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Slight rain showers', icon: 'rain' },
  81: { label: 'Moderate rain showers', icon: 'rain' },
  82: { label: 'Violent rain showers', icon: 'rain' },
  85: { label: 'Slight snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm with hail', icon: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'storm' },
};

function resolveLabel(code) {
  const numeric = Number(code);
  if (!Number.isFinite(numeric)) {
    return { label: 'Unknown', icon: 'na' };
  }
  return WEATHER_CODE_LABELS[numeric] ?? { label: 'Unknown', icon: 'na' };
}

export async function fetchWeatherSummary({ latitude, longitude, timezone }) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return null;
  }

  const params = new URLSearchParams({
    latitude: `${latitude}`,
    longitude: `${longitude}`,
    current_weather: 'true',
    hourly: 'relativehumidity_2m,weathercode',
    forecast_days: '1',
  });
  if (timezone) {
    params.append('timezone', timezone);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${WEATHER_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GigvoraDashboard/1.0 (+https://gigvora.example)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const currentWeather = payload.current_weather;
    if (!currentWeather) {
      return null;
    }

    let humidity = null;
    if (Array.isArray(payload?.hourly?.time) && Array.isArray(payload?.hourly?.relativehumidity_2m)) {
      const index = payload.hourly.time.findIndex((timestamp) => timestamp === currentWeather.time);
      if (index >= 0) {
        const value = payload.hourly.relativehumidity_2m[index];
        humidity = Number.isFinite(Number(value)) ? Number(value) : null;
      }
    }

    const { label, icon } = resolveLabel(currentWeather.weathercode);
    const temperature = Number.isFinite(Number(currentWeather.temperature))
      ? Number(currentWeather.temperature)
      : null;
    const windSpeed = Number.isFinite(Number(currentWeather.windspeed))
      ? Number(currentWeather.windspeed)
      : null;

    return {
      provider: 'open-meteo',
      description: label,
      icon,
      temperature,
      temperatureUnit: payload?.current_weather_units?.temperature ?? '°C',
      windSpeed,
      windSpeedUnit: payload?.current_weather_units?.windspeed ?? 'km/h',
      humidity,
      humidityUnit: humidity != null ? '%' : null,
      observationTime: currentWeather.time ?? null,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return null;
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  getWeatherSnapshot,
  fetchCurrentWeather,
  fetchWeatherSummary,
};
