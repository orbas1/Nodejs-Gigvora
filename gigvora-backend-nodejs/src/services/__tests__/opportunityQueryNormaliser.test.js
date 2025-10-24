import { Op } from 'sequelize';
import {
  parseFiltersInput,
  normaliseViewport,
  buildFilterExpressions,
  applyStructuredFilters,
  normalisePage,
  normalisePageSize,
  normaliseLimit,
} from '../opportunityQueryNormaliser.js';

describe('opportunityQueryNormaliser', () => {
  it('parses JSON filter input safely', () => {
    expect(parseFiltersInput('{"status":"active"}')).toEqual({ status: 'active' });
    expect(() => parseFiltersInput('{invalid json')).toThrow('Filters must be valid JSON.');
    expect(parseFiltersInput(undefined)).toEqual({});
  });

  it('normalises viewport payloads', () => {
    const viewport = normaliseViewport('{"boundingBox":{"north":52,"south":48,"east":2,"west":-1}}');
    expect(viewport).toEqual({ boundingBox: { north: 52, south: 48, east: 2, west: -1 } });
    expect(() => normaliseViewport('{"boundingBox":{"north":"north"}}')).toThrow('Viewport bounding box must include numeric north, south, east, and west values.');
  });

  it('builds category specific filter expressions', () => {
    const expression = buildFilterExpressions(
      'gig',
      {
        durationCategory: ['short_term'],
        budgetCurrency: ['usd'],
        location: ['Remote'],
        taxonomySlugs: ['design'],
      },
    );
    expect(expression).toContain('durationCategory');
    expect(expression).toContain('budgetCurrency');
    expect(expression).toContain('location');
    expect(expression).toContain('taxonomySlugs');
  });

  it('applies structured filters for database fallbacks', () => {
    const where = {};
    applyStructuredFilters(
      where,
      'gig',
      {
        durationCategory: ['short_term', 'fixed'],
        budgetCurrency: ['usd'],
        location: ['Remote'],
        geoCountry: ['NL'],
      },
    );

    const clauses = where[Op.and] ?? [];
    const durationClause = clauses.find((entry) => entry.durationCategory);
    expect(durationClause).toBeDefined();
    expect(durationClause.durationCategory[Op.in]).toEqual(['short_term', 'fixed']);

    expect(clauses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ budgetCurrency: expect.any(String) }),
        expect.objectContaining({ location: expect.any(String) }),
        expect.objectContaining({ geoCountry: expect.any(String) }),
      ]),
    );
  });

  it('normalises pagination arguments', () => {
    expect(normalisePage('0')).toBe(1);
    expect(normalisePageSize('200')).toBeLessThanOrEqual(50);
    expect(normaliseLimit('-5')).toBeGreaterThan(0);
  });
});
