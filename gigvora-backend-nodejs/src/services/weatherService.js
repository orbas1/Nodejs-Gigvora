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
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  fetchCurrentWeather,
};
