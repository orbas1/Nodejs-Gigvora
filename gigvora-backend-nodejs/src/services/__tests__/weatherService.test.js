import { jest } from '@jest/globals';
import { appCache } from '../../utils/cache.js';
import { ValidationError } from '../../utils/errors.js';

jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn(),
}));

const fetch = (await import('node-fetch')).default;
const {
  geocodeLocation,
  getWeatherSnapshot,
  getCurrentWeather,
  fetchCurrentWeather,
  fetchWeatherSummary,
} = await import('../weatherService.js');

function createResponse(payload) {
  return {
    ok: true,
    json: async () => payload,
  };
}

describe('weatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appCache.flushByPrefix('weather');
  });

  it('geocodes and caches locations', async () => {
    fetch.mockResolvedValueOnce(
      createResponse({
        results: [
          {
            name: 'London',
            admin1: 'England',
            country_code: 'GB',
            latitude: 51.5,
            longitude: -0.12,
            timezone: 'Europe/London',
          },
        ],
      }),
    );

    const first = await geocodeLocation('London');
    expect(first).toEqual(
      expect.objectContaining({
        name: 'London',
        displayName: 'London, England, GB',
        latitude: 51.5,
        longitude: -0.12,
        timezone: 'Europe/London',
      }),
    );

    const second = await geocodeLocation('London');
    expect(second).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('builds a rich weather snapshot for coordinates', async () => {
    fetch.mockResolvedValueOnce(
      createResponse({
        current: {
          time: '2024-05-18T12:00:00Z',
          weather_code: 61,
          temperature_2m: 12.5,
          apparent_temperature: 10.2,
          relative_humidity_2m: 78,
          wind_speed_10m: 14.3,
          wind_direction_10m: 220,
        },
        current_units: {
          temperature_2m: '°C',
          apparent_temperature: '°C',
          relative_humidity_2m: '%',
          wind_speed_10m: 'km/h',
        },
        timezone: 'Europe/London',
      }),
    );

    const snapshot = await getWeatherSnapshot({ latitude: 51.5, longitude: -0.12 });
    expect(snapshot).toMatchObject({
      provider: 'open-meteo',
      conditionCode: 61,
      condition: 'Slight rain',
      latitude: 51.5,
      longitude: -0.12,
      temperatureC: 12.5,
      windSpeedKph: 14.3,
      humidity: { value: 78, unit: '%' },
    });
    expect(snapshot.temperatureF).toBeCloseTo(54.5, 1);
    expect(snapshot.windSpeedMph).toBeCloseTo(8.9, 1);
  });

  it('returns simplified current weather including location lookup', async () => {
    fetch
      .mockResolvedValueOnce(
        createResponse({
          results: [
            {
              name: 'Paris',
              admin1: 'Île-de-France',
              country_code: 'FR',
              latitude: 48.8566,
              longitude: 2.3522,
              timezone: 'Europe/Paris',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          current: {
            time: '2024-05-18T14:00:00Z',
            weather_code: 0,
            temperature_2m: 18,
            apparent_temperature: 19,
            relative_humidity_2m: 40,
            wind_speed_10m: 10,
            wind_direction_10m: 180,
          },
          current_units: {
            temperature_2m: '°C',
            apparent_temperature: '°C',
            relative_humidity_2m: '%',
            wind_speed_10m: 'km/h',
          },
          timezone: 'Europe/Paris',
        }),
      );

    const weather = await getCurrentWeather({ locationName: 'Paris' });
    expect(weather).toEqual(
      expect.objectContaining({
        locationName: 'Paris, Île-de-France, FR',
        conditionCode: 0,
        conditionLabel: 'Clear sky',
        temperatureC: 18,
        temperatureF: 64.4,
      }),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when fetching current weather with invalid coordinates', async () => {
    await expect(fetchCurrentWeather({ latitude: null, longitude: 10 })).rejects.toBeInstanceOf(ValidationError);
  });

  it('fetches current weather snapshot for valid coordinates', async () => {
    fetch.mockResolvedValueOnce(
      createResponse({
        current: {
          time: '2024-05-18T12:00:00Z',
          weather_code: 95,
          temperature_2m: 22,
          apparent_temperature: 21,
          relative_humidity_2m: 60,
          wind_speed_10m: 30,
          wind_direction_10m: 200,
        },
        current_units: {
          temperature_2m: '°C',
          apparent_temperature: '°C',
          relative_humidity_2m: '%',
          wind_speed_10m: 'km/h',
        },
        timezone: 'Europe/Rome',
      }),
    );

    const snapshot = await fetchCurrentWeather({ latitude: 41.9, longitude: 12.5 });
    expect(snapshot).toMatchObject({
      category: 'storm',
      description: 'Thunderstorm',
      windDirection: 200,
      temperatureC: 22,
      windSpeedKph: 30,
    });
  });

  it('summarises weather data for dashboards', async () => {
    fetch.mockResolvedValueOnce(
      createResponse({
        current: {
          time: '2024-05-18T12:00:00Z',
          weather_code: 3,
          temperature_2m: 6,
          apparent_temperature: 4,
          relative_humidity_2m: 90,
          wind_speed_10m: 8,
          wind_direction_10m: 100,
        },
        current_units: {
          temperature_2m: '°C',
          apparent_temperature: '°C',
          relative_humidity_2m: '%',
          wind_speed_10m: 'km/h',
        },
        timezone: 'Europe/Berlin',
      }),
    );

    const summary = await fetchWeatherSummary({ latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' });
    expect(summary).toEqual(
      expect.objectContaining({
        provider: 'open-meteo',
        description: 'Overcast',
        icon: 'cloud',
        temperature: 6,
        windSpeed: 8,
        humidity: 90,
        observationTime: '2024-05-18T12:00:00.000Z',
        timezone: 'Europe/Berlin',
      }),
    );
  });
});
