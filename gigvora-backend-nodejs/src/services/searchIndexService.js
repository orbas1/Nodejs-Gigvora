import { MeiliSearch } from 'meilisearch';
import {
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
} from '../models/index.js';

const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_TASK_TIMEOUT_MS = 20000;

const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };

const opportunityIndexDefinitions = {
  job: {
    indexName: 'opportunities_jobs',
    primaryKey: 'id',
    model: Job,
    searchableAttributes: ['title', 'description', 'location', 'employmentType'],
    filterableAttributes: [
      'employmentType',
      'employmentCategory',
      'isRemote',
      'location',
      'createdAtDate',
      'updatedAtDate',
    ],
    sortableAttributes: ['freshnessScore', 'updatedAtTimestamp', 'createdAtTimestamp'],
    customRanking: ['desc(freshnessScore)', 'desc(updatedAtTimestamp)'],
    synonyms: {
      devops: ['dev ops', 'site reliability', 'sre'],
      ux: ['user experience', 'ui design', 'interaction design'],
      remote: ['distributed', 'work from home'],
      freelance: ['contract', 'contractor', 'independent'],
    },
    stopWords: ['and', 'the', 'with', 'for'],
    sortExpressions: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
  },
  gig: {
    indexName: 'opportunities_gigs',
    primaryKey: 'id',
    model: Gig,
    searchableAttributes: ['title', 'description', 'duration'],
    filterableAttributes: [
      'durationCategory',
      'budgetCurrency',
      'createdAtDate',
      'updatedAtDate',
    ],
    sortableAttributes: ['freshnessScore', 'budgetValue', 'updatedAtTimestamp'],
    customRanking: ['desc(freshnessScore)', 'desc(budgetValue)', 'desc(updatedAtTimestamp)'],
    synonyms: {
      sprint: ['short project', 'mini project'],
      redesign: ['revamp', 'refresh'],
      freelance: ['independent', 'contract'],
    },
    stopWords: ['and', 'or', 'the'],
    sortExpressions: ['freshnessScore:desc', 'budgetValue:desc', 'updatedAtTimestamp:desc'],
  },
  project: {
    indexName: 'opportunities_projects',
    primaryKey: 'id',
    model: Project,
    searchableAttributes: ['title', 'description', 'status'],
    filterableAttributes: ['status', 'createdAtDate', 'updatedAtDate'],
    sortableAttributes: ['freshnessScore', 'updatedAtTimestamp'],
    customRanking: ['desc(freshnessScore)', 'desc(updatedAtTimestamp)'],
    synonyms: {
      roadmap: ['plan', 'programme'],
      launch: ['go live', 'rollout'],
    },
    sortExpressions: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
  },
  launchpad: {
    indexName: 'opportunities_launchpads',
    primaryKey: 'id',
    model: ExperienceLaunchpad,
    searchableAttributes: ['title', 'description', 'track'],
    filterableAttributes: ['track', 'createdAtDate', 'updatedAtDate'],
    sortableAttributes: ['freshnessScore', 'updatedAtTimestamp'],
    customRanking: ['desc(freshnessScore)', 'desc(updatedAtTimestamp)'],
    synonyms: {
      fellowship: ['cohort', 'programme'],
      mentor: ['coach', 'advisor'],
      launchpad: ['accelerator', 'incubator'],
    },
    sortExpressions: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
  },
  volunteering: {
    indexName: 'opportunities_volunteering',
    primaryKey: 'id',
    model: Volunteering,
    searchableAttributes: ['title', 'description', 'organization'],
    filterableAttributes: ['organization', 'isRemote', 'createdAtDate', 'updatedAtDate'],
    sortableAttributes: ['freshnessScore', 'updatedAtTimestamp'],
    customRanking: ['desc(freshnessScore)', 'desc(updatedAtTimestamp)'],
    synonyms: {
      volunteer: ['pro bono', 'community'],
      nonprofit: ['charity', 'foundation'],
    },
    stopWords: ['and', 'the'],
    sortExpressions: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
  },
};

function resolveLogger(logger) {
  if (logger) {
    return logger;
  }
  if (process.env.NODE_ENV === 'test') {
    return silentLogger;
  }
  return console;
}

let cachedClient = null;

function createClient() {
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_API_KEY;

  if (!host || !apiKey) {
    return null;
  }

  return new MeiliSearch({
    host,
    apiKey,
    requestConfig: {
      headers: {
        'User-Agent': 'Gigvora-Backend/1.0 (SearchIndexService)',
      },
    },
  });
}

function resolveClient(options = {}) {
  if (options?.client) {
    return options.client;
  }

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient();
  return cachedClient;
}

function serialiseDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  return {
    iso: date.toISOString(),
    epoch: date.getTime(),
    day: date.toISOString().slice(0, 10),
  };
}

function computeFreshnessScore(dateInput) {
  const now = Date.now();
  const timestamp = new Date(dateInput ?? now).getTime();
  const ageHours = (now - timestamp) / (1000 * 60 * 60);
  // Cap the decay at 45 days to avoid starving evergreen programmes.
  const maxHours = 45 * 24;
  const remaining = Math.max(0, maxHours - ageHours);
  return Math.round(remaining * 10);
}

function normaliseEmploymentCategory(type) {
  if (!type) return null;
  const normalised = type.trim().toLowerCase();
  if (normalised.includes('full')) return 'full_time';
  if (normalised.includes('part')) return 'part_time';
  if (normalised.includes('intern')) return 'internship';
  if (normalised.includes('contract') || normalised.includes('freelance')) return 'contract';
  return normalised.replace(/\s+/g, '_');
}

function isRemoteRole(location, description) {
  if (!location && !description) return false;
  const haystack = `${location ?? ''} ${description ?? ''}`.toLowerCase();
  return /(remote|anywhere|distributed|work from home|hybrid)/.test(haystack);
}

function parseBudgetValue(budget) {
  if (!budget) return null;
  const numeric = Number.parseFloat(String(budget).replace(/[^0-9.]/g, ''));
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return null;
}

function determineDurationCategory(duration) {
  if (!duration) return null;
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) return 'short_term';
  if (/month|quarter/.test(text)) return 'medium_term';
  if (/year|long/.test(text)) return 'long_term';
  return 'unspecified';
}

function extractCurrencyCode(budget) {
  if (!budget) return null;
  if (/\$/u.test(budget)) return 'USD';
  if (/€/.test(budget)) return 'EUR';
  if (/£/.test(budget)) return 'GBP';
  return null;
}

function mapRecordToDocument(category, record) {
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const created = serialiseDate(plain.createdAt);
  const updated = serialiseDate(plain.updatedAt ?? plain.createdAt);
  const freshnessScore = computeFreshnessScore(updated.iso);

  const baseDocument = {
    id: plain.id,
    category,
    title: plain.title,
    description: plain.description,
    createdAt: created.iso,
    updatedAt: updated.iso,
    createdAtTimestamp: created.epoch,
    updatedAtTimestamp: updated.epoch,
    createdAtDate: created.day,
    updatedAtDate: updated.day,
    freshnessScore,
  };

  switch (category) {
    case 'job':
      return {
        ...baseDocument,
        location: plain.location ?? null,
        employmentType: plain.employmentType ?? null,
        employmentCategory: normaliseEmploymentCategory(plain.employmentType),
        isRemote: isRemoteRole(plain.location, plain.description),
      };
    case 'gig':
      return {
        ...baseDocument,
        budget: plain.budget ?? null,
        budgetValue: parseBudgetValue(plain.budget) ?? 0,
        budgetCurrency: extractCurrencyCode(plain.budget),
        duration: plain.duration ?? null,
        durationCategory: determineDurationCategory(plain.duration),
      };
    case 'project':
      return {
        ...baseDocument,
        status: plain.status ?? 'unknown',
      };
    case 'launchpad':
      return {
        ...baseDocument,
        track: plain.track ?? null,
      };
    case 'volunteering':
      return {
        ...baseDocument,
        organization: plain.organization ?? null,
        isRemote: isRemoteRole(null, plain.description),
      };
    default:
      throw new Error(`Unsupported opportunity category "${category}"`);
  }
}

async function waitForTask(client, taskOrUid, logger, context) {
  const taskUid =
    typeof taskOrUid === 'number'
      ? taskOrUid
      : taskOrUid?.taskUid ?? taskOrUid?.uid ?? taskOrUid?.taskID ?? null;

  if (!taskUid || typeof client.waitForTask !== 'function') {
    return;
  }

  try {
    await client.waitForTask(taskUid, { timeoutMs: DEFAULT_TASK_TIMEOUT_MS });
  } catch (error) {
    logger.warn?.('Meilisearch task monitoring exceeded timeout', {
      taskUid,
      context,
      error: error.message,
    });
  }
}

async function ensureIndex(client, definition, logger) {
  const { indexName, primaryKey } = definition;

  let index = null;

  try {
    index = await client.getIndex(indexName);
  } catch (error) {
    const errorCode = error?.errorCode ?? error?.code;
    if (errorCode !== 'index_not_found') {
      throw error;
    }
  }

  if (!index) {
    const task = await client.createIndex(indexName, { primaryKey });
    await waitForTask(client, task, logger, { indexName, action: 'createIndex' });
    index = await client.getIndex(indexName);
  }

  const settingsPayload = {};
  if (definition.searchableAttributes) settingsPayload.searchableAttributes = definition.searchableAttributes;
  if (definition.filterableAttributes) settingsPayload.filterableAttributes = definition.filterableAttributes;
  if (definition.sortableAttributes) settingsPayload.sortableAttributes = definition.sortableAttributes;
  if (definition.stopWords) settingsPayload.stopWords = definition.stopWords;
  if (definition.synonyms) settingsPayload.synonyms = definition.synonyms;
  if (definition.rankingRules) settingsPayload.rankingRules = definition.rankingRules;
  if (definition.customRanking) settingsPayload.customRanking = definition.customRanking;

  if (Object.keys(settingsPayload).length > 0) {
    const task = await index.updateSettings(settingsPayload);
    await waitForTask(client, task, logger, { indexName, action: 'updateSettings' });
  }

  return index;
}

async function ingestModel(definition, options) {
  const { category } = options;
  const { model } = definition;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const logger = options.logger;
  const index = options.index;
  let offset = 0;
  let processed = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const records = await model.findAll({
      limit: batchSize,
      offset,
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    if (!records.length) {
      break;
    }

    const documents = records.map((record) => mapRecordToDocument(category, record));
    const task = await index.addDocuments(documents, { primaryKey: definition.primaryKey });
    await waitForTask(options.client, task, logger, {
      indexName: definition.indexName,
      action: 'addDocuments',
    });

    processed += documents.length;
    offset += records.length;

    if (records.length < batchSize) {
      break;
    }
  }

  return processed;
}

export function isSearchConfigured() {
  const client = resolveClient();
  return Boolean(client);
}

export async function ensureOpportunityIndexes(options = {}) {
  const logger = resolveLogger(options.logger);
  const client = resolveClient(options);

  if (!client) {
    return { configured: false, indexes: [] };
  }

  const ensuredIndexes = [];

  for (const [category, definition] of Object.entries(opportunityIndexDefinitions)) {
    try {
      await ensureIndex(client, definition, logger);
      ensuredIndexes.push({ category, indexName: definition.indexName });
    } catch (error) {
      logger.error?.('Failed to provision Meilisearch index', {
        category,
        indexName: definition.indexName,
        error: error.message,
      });
      throw error;
    }
  }

  return { configured: true, indexes: ensuredIndexes };
}

export async function syncOpportunityIndexes(options = {}) {
  const logger = resolveLogger(options.logger);
  const client = resolveClient(options);

  if (!client) {
    logger.warn?.('Meilisearch not configured; skipping opportunity index sync.');
    return { configured: false, indexes: [] };
  }

  await ensureOpportunityIndexes({ client, logger });

  const results = [];

  for (const [category, definition] of Object.entries(opportunityIndexDefinitions)) {
    const index = client.index(definition.indexName);

    if (options.clearExisting) {
      const task = await index.deleteAllDocuments();
      await waitForTask(client, task, logger, {
        indexName: definition.indexName,
        action: 'deleteAllDocuments',
      });
    }

    const total = await ingestModel(definition, {
      category,
      client,
      index,
      batchSize: options.batchSize,
      logger,
    });

    results.push({
      category,
      indexName: definition.indexName,
      documentsIndexed: total,
    });
  }

  return { configured: true, indexes: results };
}

function buildSortExpressions(definition, options) {
  if (options?.sort?.length) {
    return options.sort;
  }

  if (definition.sortExpressions?.length) {
    return definition.sortExpressions;
  }

  return undefined;
}

export async function searchOpportunityIndex(category, params = {}, options = {}) {
  const definition = opportunityIndexDefinitions[category];
  if (!definition) {
    return null;
  }

  const client = resolveClient(options);
  if (!client) {
    return null;
  }

  const logger = resolveLogger(options.logger);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const query = params.query ?? '';
  const sort = buildSortExpressions(definition, options);

  try {
    const index = client.index(definition.indexName);
    const searchResponse = await index.search(query, {
      limit: pageSize,
      offset,
      sort,
    });

    const total = searchResponse.estimatedTotalHits ?? searchResponse.totalHits ?? 0;

    return {
      hits: searchResponse.hits ?? [],
      total,
      page,
      pageSize,
    };
  } catch (error) {
    logger.warn?.('Falling back to database search after Meilisearch failure', {
      category,
      error: error.message,
    });
    return null;
  }
}

export async function searchAcrossOpportunityIndexes(query, params = {}, options = {}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return null;
  }

  const client = resolveClient(options);
  if (!client) {
    return null;
  }

  const limit = params.limit ?? 5;
  const logger = resolveLogger(options.logger);
  const aggregated = {};

  for (const category of Object.keys(opportunityIndexDefinitions)) {
    const result = await searchOpportunityIndex(
      category,
      { query: trimmed, page: 1, pageSize: limit },
      { client, logger },
    );

    aggregated[category] = result?.hits ?? [];
  }

  return aggregated;
}

export async function bootstrapOpportunitySearch(options = {}) {
  const logger = resolveLogger(options.logger);
  const client = resolveClient(options);

  if (!client) {
    logger.info?.('Meilisearch environment variables missing; skipping search bootstrap.');
    return { configured: false };
  }

  await ensureOpportunityIndexes({ client, logger });

  if (process.env.MEILISEARCH_BOOTSTRAP_SYNC === 'true') {
    await syncOpportunityIndexes({ client, logger, batchSize: options.batchSize });
  }

  return { configured: true };
}

export function __resetSearchClient() {
  cachedClient = null;
}

export default {
  isSearchConfigured,
  ensureOpportunityIndexes,
  syncOpportunityIndexes,
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  bootstrapOpportunitySearch,
};
