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

    return {
      hits,
      estimatedTotalHits: docs.length,
      limit,
      offset,
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
      }),
      Job.create({
        title: 'Data Reliability Engineer',
        description: 'Own data pipelines and SRE automation.',
        location: 'London',
        employmentType: 'Contract',
      }),
      Gig.create({
        title: 'Marketing Site Revamp',
        description: 'Upgrade hero, testimonial, and discovery partials.',
        budget: '$6,500',
        duration: '6 weeks',
      }),
      Project.create({
        title: 'Experience Launchpad Rollout',
        description: 'Coordinate cross-team rollout for launchpad cohorts.',
        status: 'In Progress',
      }),
      ExperienceLaunchpad.create({
        title: 'Emerging Leaders Fellowship',
        description: 'Mentored leadership journey with analytics mastery.',
        track: 'Leadership',
      }),
      Volunteering.create({
        title: 'Community Mentor',
        organization: 'Gigvora Foundation',
        description: 'Provide weekly mentoring for launchpad cohorts remotely.',
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

  it('aggregates cross-category hits for global discovery search', async () => {
    const aggregated = await searchAcrossOpportunityIndexes('mentor', { limit: 3 }, { client, logger: noopLogger });

    expect(aggregated).not.toBeNull();
    expect(aggregated.launchpad).toHaveLength(1);
    expect(aggregated.volunteering[0].organization).toBe('Gigvora Foundation');
  });
});
