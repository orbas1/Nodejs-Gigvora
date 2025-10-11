import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import '../tests/setupTestEnv.js';
import {
  syncOpportunityIndexes,
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  __resetSearchClient,
} from '../src/services/searchIndexService.js';
import {
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
} from '../src/models/index.js';

class FakeIndex {
  constructor(name) {
    this.name = name;
    this.settings = {};
    this.documents = new Map();
    this.taskCounter = 0;
  }

  updateSettings(payload) {
    this.settings = { ...this.settings, ...payload };
    this.taskCounter += 1;
    return { taskUid: `${this.name}-settings-${this.taskCounter}` };
  }

  addDocuments(documents) {
    documents.forEach((doc) => {
      this.documents.set(doc.id, { ...doc });
    });
    this.taskCounter += 1;
    return { taskUid: `${this.name}-add-${this.taskCounter}` };
  }

  deleteAllDocuments() {
    this.documents.clear();
    this.taskCounter += 1;
    return { taskUid: `${this.name}-clear-${this.taskCounter}` };
  }

  search(query, options = {}) {
    const q = (query ?? '').toLowerCase();
    let docs = Array.from(this.documents.values());

    if (q) {
      docs = docs.filter((doc) => {
        return [doc.title, doc.description, doc.organization, doc.track]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q));
      });
    }

    const filters = Array.isArray(options.filter) ? options.filter : options.filter ? [options.filter] : [];
    if (filters.length) {
      const matchesExpression = (doc, expression) => {
        if (Array.isArray(expression)) {
          return expression.some((inner) => matchesExpression(doc, inner));
        }
        if (typeof expression !== 'string') {
          return true;
        }
        if (expression.startsWith('_geoBoundingBox')) {
          const numbers = expression.match(/-?\d+\.?\d*/g) || [];
          if (numbers.length !== 4) {
            return true;
          }
          const [north, east, south, west] = numbers.map(Number.parseFloat);
          const geo = doc._geo;
          if (!geo) {
            return false;
          }
          return geo.lat <= north && geo.lat >= south && geo.lng <= east && geo.lng >= west;
        }
        if (expression.includes(' IN ')) {
          const [field, values] = expression.split(' IN ');
          const matches = values.match(/"([^"]+)"/g) || [];
          const allowed = matches.map((value) => value.replace(/"/g, ''));
          return allowed.includes(`${doc[field.trim()] ?? ''}`);
        }
        if (expression.includes('>=')) {
          const [field, value] = expression.split('>=');
          const trimmedValue = value.replace(/"/g, '').trim();
          const docValue = `${doc[field.trim()] ?? ''}`;
          return docValue >= trimmedValue;
        }
        if (expression.includes('=')) {
          const [field, value] = expression.split('=');
          const trimmed = value.replace(/"/g, '').trim();
          return `${doc[field.trim()] ?? ''}` === trimmed;
        }
        return true;
      };

      docs = docs.filter((doc) => filters.every((expression) => matchesExpression(doc, expression)));
    }

    const sort = options.sort ?? [];
    if (sort.length) {
      docs.sort((a, b) => {
        for (const expression of sort) {
          const [field, direction = 'desc'] = expression.split(':');
          const order = direction.toLowerCase() === 'asc' ? 1 : -1;
          const aValue = a[field];
          const bValue = b[field];

          if (aValue === bValue || aValue === undefined || bValue === undefined) {
            continue;
          }

          if (Number.isFinite(aValue) && Number.isFinite(bValue)) {
            if (aValue !== bValue) {
              return (aValue - bValue) * order;
            }
          } else if (aValue > bValue) {
            return order;
          } else if (aValue < bValue) {
            return -order;
          }
        }
        return 0;
      });
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? docs.length;
    const hits = docs.slice(offset, offset + limit);

    let facetDistribution = null;
    if (Array.isArray(options.facets) && options.facets.length) {
      facetDistribution = {};
      for (const facet of options.facets) {
        const counts = new Map();
        for (const doc of docs) {
          const value = doc[facet];
          if (value === undefined || value === null) {
            continue;
          }
          const key = Array.isArray(value) ? value.join('|') : value;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        facetDistribution[facet] = Object.fromEntries(counts.entries());
      }
    }

    return {
      hits,
      estimatedTotalHits: docs.length,
      limit,
      offset,
      facetDistribution,
      processingTimeMs: 1,
    };
  }
}

class FakeMeiliClient {
  constructor() {
    this.indices = new Map();
    this.taskCounter = 0;
  }

  index(name) {
    if (!this.indices.has(name)) {
      this.indices.set(name, new FakeIndex(name));
    }
    return this.indices.get(name);
  }

  async getIndex(name) {
    if (!this.indices.has(name)) {
      const error = new Error('Index not found');
      error.errorCode = 'index_not_found';
      throw error;
    }
    return this.indices.get(name);
  }

  async createIndex(name) {
    if (!this.indices.has(name)) {
      this.indices.set(name, new FakeIndex(name));
    }
    this.taskCounter += 1;
    return { taskUid: `create-${name}-${this.taskCounter}` };
  }

  async waitForTask(taskUid) {
    return { taskUid, status: 'succeeded' };
  }
}

const noopLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('searchIndexService', () => {
  let client;

  beforeEach(async () => {
    client = new FakeMeiliClient();
    __resetSearchClient();

    await Promise.all([
      Job.create({
        title: 'Remote Product Designer',
        description: 'Design accessible experiences and support discovery analytics.',
        location: 'Remote - EU',
        employmentType: 'Full-time',
        geoLocation: { lat: 52.52, lng: 13.405, country: 'DE', city: 'Berlin', isRemote: true },
      }),
      Job.create({
        title: 'Data Reliability Engineer',
        description: 'Own data pipelines and SRE automation.',
        location: 'London',
        employmentType: 'Contract',
        geoLocation: { lat: 51.5072, lng: -0.1276, country: 'GB', city: 'London' },
      }),
      Gig.create({
        title: 'Marketing Site Revamp',
        description: 'Upgrade hero, testimonial, and discovery partials.',
        budget: '$6,500',
        duration: '6 weeks',
        location: 'Berlin',
        geoLocation: { lat: 52.52, lng: 13.405, country: 'DE', city: 'Berlin' },
      }),
      Project.create({
        title: 'Experience Launchpad Rollout',
        description: 'Coordinate cross-team rollout for launchpad cohorts.',
        status: 'In Progress',
        location: 'London',
        geoLocation: { lat: 51.5072, lng: -0.1276, country: 'GB', city: 'London' },
      }),
      ExperienceLaunchpad.create({
        title: 'Emerging Leaders Fellowship',
        description: 'Mentored leadership journey with analytics mastery.',
        track: 'Leadership',
        location: 'London',
        geoLocation: { lat: 51.5072, lng: -0.1276, country: 'GB', city: 'London' },
      }),
      Volunteering.create({
        title: 'Community Mentor',
        organization: 'Gigvora Foundation',
        description: 'Provide weekly mentoring for launchpad cohorts remotely.',
        location: 'Hybrid - Berlin',
        geoLocation: { lat: 52.52, lng: 13.405, country: 'DE', city: 'Berlin', isRemote: true },
      }),
    ]);

    await syncOpportunityIndexes({ client, logger: noopLogger, batchSize: 2 });
  });

  afterEach(() => {
    __resetSearchClient();
  });

  it('indexes opportunities with derived metadata for each category', () => {
    const jobIndex = client.index('opportunities_jobs');
    const jobDocs = Array.from(jobIndex.documents.values());
    expect(jobDocs).toHaveLength(2);
    expect(jobDocs[0]).toHaveProperty('employmentCategory');
    expect(jobDocs.some((doc) => doc.isRemote === true)).toBe(true);

    const gigIndex = client.index('opportunities_gigs');
    const gigDoc = Array.from(gigIndex.documents.values())[0];
    expect(gigDoc.budgetValue).toBeGreaterThan(0);
    expect(gigDoc.durationCategory).toBe('short_term');
  });

  it('returns sorted search results from Meilisearch-backed indexes', async () => {
    const result = await searchOpportunityIndex(
      'job',
      { query: 'designer', page: 1, pageSize: 5 },
      { client, logger: noopLogger },
    );

    expect(result).not.toBeNull();
    expect(result.total).toBe(1);
    expect(result.hits[0].title).toContain('Remote Product Designer');
    expect(result.hits[0].isRemote).toBe(true);
  });

  it('supports filter expressions, facets, and returns metadata', async () => {
    const result = await searchOpportunityIndex(
      'job',
      {
        query: '',
        page: 1,
        pageSize: 10,
        filters: ['employmentType = "Full-time"', 'isRemote = true'],
        facets: ['employmentType', 'isRemote', 'geoCountry'],
      },
      { client, logger: noopLogger },
    );

    expect(result.total).toBe(1);
    expect(result.facetDistribution).toBeTruthy();
    expect(result.facetDistribution.employmentType['Full-time']).toBe(1);
    expect(result.processingTimeMs).toBe(1);
  });

  it('filters opportunities within a bounding box', async () => {
    const result = await searchOpportunityIndex(
      'gig',
      {
        query: '',
        page: 1,
        pageSize: 10,
        filters: ['_geoBoundingBox(53.0, 14.0, 52.0, 13.0)'],
      },
      { client, logger: noopLogger },
    );

    expect(result.total).toBe(1);
    expect(result.hits[0].title).toContain('Marketing Site Revamp');
  });

  it('aggregates cross-category hits for global discovery search', async () => {
    const aggregated = await searchAcrossOpportunityIndexes('mentor', { limit: 3 }, { client, logger: noopLogger });

    expect(aggregated).not.toBeNull();
    expect(aggregated.launchpad).toHaveLength(1);
    expect(aggregated.volunteering[0].organization).toBe('Gigvora Foundation');
  });
});
