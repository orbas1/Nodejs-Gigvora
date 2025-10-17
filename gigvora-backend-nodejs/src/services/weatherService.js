import fetch from 'node-fetch';

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
  fetchWeatherSummary,
};
