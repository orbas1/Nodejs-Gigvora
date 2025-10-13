import {
  normalizeLocationString,
  normalizeGeoLocation,
  normalizeLocationPayload,
  areGeoLocationsEqual,
  buildLocationDetails,
} from '../../src/utils/location.js';

describe('location utilities', () => {
  describe('normalizeLocationString', () => {
    it('trims input and limits length', () => {
      expect(normalizeLocationString('  New York  ')).toBe('New York');
      const long = 'x'.repeat(300);
      expect(normalizeLocationString(long)).toHaveLength(255);
    });

    it('returns null for empty values', () => {
      expect(normalizeLocationString('   ')).toBeNull();
      expect(normalizeLocationString(null)).toBeNull();
    });
  });

  describe('normalizeGeoLocation', () => {
    it('normalizes string values into label objects', () => {
      expect(normalizeGeoLocation('Seattle, WA')).toEqual({ label: 'Seattle, WA' });
    });

    it('coerces coordinate values and strips invalid data', () => {
      expect(
        normalizeGeoLocation({
          label: 'Austin, TX',
          city: 'Austin',
          region: 'Texas',
          country: 'US',
          postalCode: '73301',
          latitude: '30.2672',
          longitude: '-97.7431',
          timezone: 'America/Chicago',
          extra: 'ignored',
        }),
      ).toEqual({
        label: 'Austin, TX',
        city: 'Austin',
        region: 'Texas',
        country: 'US',
        postalCode: '73301',
        latitude: 30.2672,
        longitude: -97.7431,
        timezone: 'America/Chicago',
      });
    });
  });

  describe('normalizeLocationPayload', () => {
    it('derives a normalized payload from mixed inputs', () => {
      expect(
        normalizeLocationPayload({
          label: 'London, UK',
          geoLocation: { label: 'London', latitude: 51.5072, longitude: -0.1276 },
        }),
      ).toEqual({
        location: 'London, UK',
        geoLocation: { label: 'London', latitude: 51.5072, longitude: -0.1276 },
      });
    });

    it('uses geo label as fallback when no location string provided', () => {
      expect(
        normalizeLocationPayload({
          geoLocation: { label: 'Toronto, Canada', country: 'CA' },
        }),
      ).toEqual({
        location: 'Toronto, Canada',
        geoLocation: { label: 'Toronto, Canada', country: 'CA' },
      });
    });
  });

  describe('areGeoLocationsEqual', () => {
    it('treats semantically equivalent payloads as equal', () => {
      const first = { label: 'Berlin', latitude: 52.52, longitude: 13.405, raw: { provider: 'mapbox' } };
      const second = { latitude: 52.52, longitude: 13.405, label: 'Berlin', raw: { provider: 'mapbox' } };
      expect(areGeoLocationsEqual(first, second)).toBe(true);
      expect(areGeoLocationsEqual(first, { label: 'Munich' })).toBe(false);
    });
  });

  describe('buildLocationDetails', () => {
    it('builds a rich display payload with coordinates', () => {
      expect(
        buildLocationDetails('Chicago, IL', {
          label: 'Chicago, IL',
          city: 'Chicago',
          region: 'Illinois',
          country: 'US',
          postalCode: '60601',
          latitude: 41.8781,
          longitude: -87.6298,
          timezone: 'America/Chicago',
        }),
      ).toEqual({
        location: 'Chicago, IL',
        geoLocation: {
          label: 'Chicago, IL',
          city: 'Chicago',
          region: 'Illinois',
          country: 'US',
          postalCode: '60601',
          latitude: 41.8781,
          longitude: -87.6298,
          timezone: 'America/Chicago',
        },
        displayName: 'Chicago, IL',
        shortName: 'Chicago',
        timezone: 'America/Chicago',
        city: 'Chicago',
        region: 'Illinois',
        country: 'US',
        postalCode: '60601',
        coordinates: { latitude: 41.8781, longitude: -87.6298 },
      });
    });

    it('returns null when no information provided', () => {
      expect(buildLocationDetails(null, null)).toBeNull();
    });
  });
});
