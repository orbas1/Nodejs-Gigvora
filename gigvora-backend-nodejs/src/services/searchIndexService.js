import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  OpportunityTaxonomyAssignment,
  OpportunityTaxonomy,
} from '../models/index.js';
import {
  applyStructuredFilters,
  normalisePage,
  normalisePageSize,
  normaliseLimit,
  normaliseTaxonomyFilterTokens,
} from './opportunityQueryNormaliser.js';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PROCESSING_TIME_MS = 2;

const opportunityModels = {
  job: Job,
  gig: Gig,
  project: Project,
  launchpad: ExperienceLaunchpad,
  volunteering: Volunteering,
};

const DIALECT = sequelize.getDialect();

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

export function isRemoteRole(location, description) {
  if (!location && !description) return false;
  const haystack = `${location ?? ''} ${description ?? ''}`.toLowerCase();
  return /(remote|anywhere|distributed|work from home|hybrid)/.test(haystack);
}

export function parseBudgetValue(budget) {
  if (!budget) return null;
  const numeric = Number.parseFloat(String(budget).replace(/[^0-9.]/g, ''));
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return null;
}

export function determineDurationCategory(duration) {
  if (!duration) return null;
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) return 'short_term';
  if (/month|quarter/.test(text)) return 'medium_term';
  if (/year|long/.test(text)) return 'long_term';
  return 'unspecified';
}

export function extractCurrencyCode(budget) {
  if (!budget) return null;
  if (/\$/u.test(budget)) return 'USD';
  if (/€/.test(budget)) return 'EUR';
  if (/£/.test(budget)) return 'GBP';
  return null;
}

function normaliseGeoLocation(geoLocation, fallbackLocation = null) {
  if (!geoLocation) {
    return null;
  }

  const candidate = typeof geoLocation === 'string' ? { label: geoLocation } : geoLocation;
  const lat = Number.parseFloat(candidate.lat ?? candidate.latitude);
  const lng = Number.parseFloat(candidate.lng ?? candidate.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    city: candidate.city ?? candidate.town ?? candidate.locality ?? null,
    region: candidate.region ?? candidate.state ?? candidate.stateCode ?? null,
    country: candidate.country ?? candidate.countryCode ?? null,
    label:
      candidate.label ??
      candidate.name ??
      candidate.formatted ??
      candidate.displayName ??
      fallbackLocation ??
      null,
    isRemote: typeof candidate.isRemote === 'boolean' ? candidate.isRemote : null,
  };
}

const TAXONOMY_ENABLED_CATEGORIES = new Set(['job', 'gig', 'launchpad', 'volunteering']);

function collectTaxonomies(record) {
  const combined = [];

  const assignments = Array.isArray(record.taxonomyAssignments) ? record.taxonomyAssignments : [];
  assignments.forEach((assignment) => {
    const plainAssignment =
      assignment && typeof assignment.get === 'function' ? assignment.get({ plain: true }) : assignment;
    if (!plainAssignment) {
      return;
    }
    const taxonomy = plainAssignment.taxonomy
      ? typeof plainAssignment.taxonomy.get === 'function'
        ? plainAssignment.taxonomy.get({ plain: true })
        : plainAssignment.taxonomy
      : null;
    if (!taxonomy) {
      return;
    }
    combined.push({
      id: taxonomy.id ?? plainAssignment.taxonomyId ?? null,
      slug: taxonomy.slug,
      label: taxonomy.label ?? null,
      type: taxonomy.type ?? null,
    });
  });

  const fromLists = Array.isArray(record.taxonomies)
    ? record.taxonomies
        .map((entry) => ({
          id: entry.id ?? null,
          slug: entry.slug ?? null,
          label: entry.label ?? null,
          type: entry.type ?? null,
        }))
        .filter((entry) => entry.slug)
    : [];

  const slugs = Array.isArray(record.taxonomySlugs) ? record.taxonomySlugs : [];
  const labels = Array.isArray(record.taxonomyLabels) ? record.taxonomyLabels : [];
  const types = Array.isArray(record.taxonomyTypes) ? record.taxonomyTypes : [];

  slugs.forEach((slug, index) => {
    combined.push({
      id: null,
      slug,
      label: labels[index] ?? null,
      type: types[index] ?? null,
    });
  });

  const seen = new Set();
  return combined.filter((entry) => {
    const key = entry.slug ? `${entry.slug}`.toLowerCase() : null;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mapRecordToDocument(category, record) {
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const created = serialiseDate(plain.createdAt);
  const updated = serialiseDate(plain.updatedAt ?? plain.createdAt);
  const freshnessScore = computeFreshnessScore(updated.iso);
  const geo = normaliseGeoLocation(plain.geoLocation ?? plain.geo, plain.location);
  const taxonomyInfo = collectTaxonomies(plain);

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
    location: plain.location ?? null,
    geoCity: geo?.city ?? null,
    geoRegion: geo?.region ?? null,
    geoCountry: geo?.country ?? null,
    geoLabel: geo?.label ?? plain.location ?? null,
    taxonomies: taxonomyInfo,
    taxonomySlugs: taxonomyInfo.map((entry) => entry.slug),
    taxonomyLabels: taxonomyInfo.map((entry) => entry.label),
    taxonomyTypes: taxonomyInfo.map((entry) => entry.type),
  };

  if (geo) {
    baseDocument._geo = { lat: geo.lat, lng: geo.lng };
  }

  switch (category) {
    case 'job':
      return {
        ...baseDocument,
        employmentType: plain.employmentType ?? null,
        employmentCategory: normaliseEmploymentCategory(plain.employmentType),
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'gig':
      return {
        ...baseDocument,
        budget: plain.budget ?? null,
        budgetValue: parseBudgetValue(plain.budget) ?? 0,
        budgetCurrency: extractCurrencyCode(plain.budget),
        duration: plain.duration ?? null,
        durationCategory: determineDurationCategory(plain.duration),
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'project':
      return {
        ...baseDocument,
        status: plain.status ?? 'unknown',
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'launchpad':
      return {
        ...baseDocument,
        track: plain.track ?? null,
        isRemote: geo?.isRemote ?? false,
      };
    case 'volunteering':
      return {
        ...baseDocument,
        organization: plain.organization ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    default:
      throw new Error(`Unsupported opportunity category "${category}"`);
  }
}

function buildTaxonomyInclude(category, filters = {}) {
  if (!TAXONOMY_ENABLED_CATEGORIES.has(category)) {
    return null;
  }

  const slugTokens = normaliseTaxonomyFilterTokens(filters.taxonomySlugs ?? []);
  const typeTokens = normaliseTaxonomyFilterTokens(filters.taxonomyTypes ?? []);

  const include = {
    model: OpportunityTaxonomyAssignment,
    as: 'taxonomyAssignments',
    required: false,
    attributes: ['id', 'taxonomyId', 'targetType', 'targetId', 'weight', 'source'],
    include: [
      {
        model: OpportunityTaxonomy,
        as: 'taxonomy',
        attributes: ['id', 'slug', 'label', 'type'],
        required: false,
      },
    ],
  };

  if (slugTokens.length || typeTokens.length) {
    include.required = true;
    include.include[0].required = true;
    const taxonomyWhere = {};
    if (slugTokens.length) {
      taxonomyWhere.slug = { [Op.in]: slugTokens };
    }
    if (typeTokens.length) {
      taxonomyWhere.type = { [Op.in]: typeTokens };
    }
    include.include[0].where = taxonomyWhere;
  }

  return include;
}

function buildLikeExpression(value) {
  if (!value) {
    return null;
  }

  if (DIALECT === 'postgres' || DIALECT === 'postgresql') {
    return { [Op.iLike]: `%${value}%` };
  }

  return { [Op.like]: `%${value}%` };
}

function buildSearchWhereClause(category, query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return {};
  }

  const likeExpression = buildLikeExpression(trimmed);
  const baseClause = [{ title: likeExpression }];
  if (category === 'job' || category === 'gig' || category === 'project') {
    baseClause.push({ description: likeExpression });
  }

  return {
    [Op.or]: baseClause,
  };
}

function sanitiseSortExpressions(category, sortExpressions = []) {
  if (!Array.isArray(sortExpressions) || !sortExpressions.length) {
    return [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ];
  }

  const normalised = [];

  sortExpressions.forEach((expression) => {
    if (typeof expression !== 'string' || !expression.trim()) {
      return;
    }
    const [fieldRaw, directionRaw] = expression.split(':');
    const field = fieldRaw?.trim();
    if (!field) {
      return;
    }
    const direction = directionRaw?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    switch (field) {
      case 'freshnessScore':
      case 'updatedAtTimestamp':
        normalised.push(['updatedAt', direction]);
        break;
      case 'createdAtTimestamp':
        normalised.push(['createdAt', direction]);
        break;
      case 'title':
        normalised.push(['title', direction]);
        break;
      case 'status':
        if (category === 'project') {
          normalised.push(['status', direction]);
        }
        break;
      case 'track':
        if (category === 'launchpad') {
          normalised.push(['track', direction]);
        }
        break;
      case 'employmentType':
        if (category === 'job') {
          normalised.push(['employmentType', direction]);
        }
        break;
      case 'durationCategory':
        if (category === 'gig') {
          normalised.push(['durationCategory', direction]);
        }
        break;
      default:
        break;
    }
  });

  if (!normalised.length) {
    normalised.push(['updatedAt', 'DESC'], ['id', 'DESC']);
  }

  return normalised;
}

function normaliseClientFilters(raw = {}) {
  const filters = {};

  const coerceArray = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry == null ? '' : `${entry}`.trim()))
        .filter((entry) => entry.length > 0);
    }
    if (value == null || value === '') {
      return [];
    }
    const trimmed = `${value}`.trim();
    return trimmed ? [trimmed] : [];
  };

  const assign = (sourceKeys, targetKey) => {
    const values = sourceKeys.flatMap((key) => coerceArray(raw[key]));
    if (values.length) {
      filters[targetKey] = values;
    }
  };

  assign(['employmentType', 'employmentTypes'], 'employmentType');
  assign(['employmentCategory', 'employmentCategories'], 'employmentCategory');
  assign(['durationCategory', 'durationCategories', 'deliverySpeed', 'deliverySpeeds'], 'durationCategory');
  assign(['budgetCurrency', 'budgetCurrencies'], 'budgetCurrency');
  assign(['status', 'statuses'], 'status');
  assign(['track', 'tracks'], 'track');
  assign(['organization', 'organizations'], 'organization');
  assign(['location', 'locations'], 'location');
  assign(['geoCountry', 'countries'], 'geoCountry');
  assign(['geoRegion', 'regions'], 'geoRegion');
  assign(['geoCity', 'cities'], 'geoCity');
  assign(['taxonomySlugs'], 'taxonomySlugs');
  assign(['taxonomyTypes'], 'taxonomyTypes');

  if (raw.isRemote !== undefined) {
    filters.isRemote = raw.isRemote === true || raw.isRemote === 'true' || raw.isRemote === '1';
  }

  if (raw.updatedWithin) {
    filters.updatedWithin = `${raw.updatedWithin}`;
  }

  const parseBudgetNumber = (value) => {
    if (value == null || value === '') {
      return null;
    }
    const numeric = Number.parseFloat(`${value}`.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return Math.max(0, Math.round(numeric));
  };

  const minBudget = parseBudgetNumber(raw.budgetValueMin ?? raw.budgetMin);
  if (minBudget != null) {
    filters.budgetValueMin = minBudget;
  }

  const maxBudget = parseBudgetNumber(raw.budgetValueMax ?? raw.budgetMax);
  if (maxBudget != null) {
    filters.budgetValueMax = maxBudget;
  }

  if (Array.isArray(filters.durationCategory) && filters.durationCategory.length) {
    const uniqueDurations = Array.from(
      new Set(
        filters.durationCategory
          .map((value) => `${value}`.trim())
          .filter((value) => value.length > 0),
      ),
    );
    filters.durationCategory = uniqueDurations;
    if (!filters.durationCategory.length) {
      delete filters.durationCategory;
    }
  }

  return filters;
}

function resolveLogger(logger) {
  if (logger) {
    return logger;
  }
  return console;
}

async function computeFacetDistribution(category, model, where, filters, facets = []) {
  if (!Array.isArray(facets) || !facets.length) {
    return null;
  }

  const distribution = {};

  const tasks = facets.map(async (facet) => {
    switch (facet) {
      case 'taxonomySlugs':
      case 'taxonomyTypes':
        // Taxonomy facets require specialised aggregation; skip in internal engine for now.
        break;
      default: {
        const attribute = col(facet);
        try {
          const rows = await model.findAll({
            where,
            attributes: [[attribute, 'value'], [fn('COUNT', col('id')), 'count']],
            group: [facet],
            raw: true,
          });
          if (rows.length) {
            const entries = rows.map((row) => [row.value ?? 'null', Number(row.count) ?? 0]);
            distribution[facet] = Object.fromEntries(entries);
          }
        } catch (error) {
          // ignore facets that cannot be grouped
        }
        break;
      }
    }
  });

  await Promise.all(tasks);

  return Object.keys(distribution).length ? distribution : null;
}

export function isSearchConfigured() {
  return true;
}

export async function ensureOpportunityIndexes() {
  return { configured: true, indexes: [] };
}

export async function syncOpportunityIndexes() {
  return { configured: true, indexes: [] };
}

export async function searchOpportunityIndex(category, params = {}, options = {}) {
  const model = opportunityModels[category];
  if (!model) {
    return null;
  }

  const logger = resolveLogger(options.logger);
  const page = normalisePage(params.page ?? 1);
  const pageSize = normalisePageSize(params.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const query = params.query?.trim() ?? '';

  const rawFilters = typeof params.filters === 'object' ? params.filters : {};
  const filters = normaliseClientFilters(rawFilters);
  const where = buildSearchWhereClause(category, query);
  applyStructuredFilters(where, category, filters);

  if (category === 'gig') {
    const minBudget = Number(filters.budgetValueMin);
    const maxBudget = Number(filters.budgetValueMax);
    if (Number.isFinite(minBudget) || Number.isFinite(maxBudget)) {
      if (!where[Op.and]) {
        where[Op.and] = [];
      }
        const numericType = DIALECT === 'postgres' ? 'numeric' : 'decimal';
        const sanitizedBudget = fn('REGEXP_REPLACE', col('Gig.budget'), '[^0-9.]', '');
        const castBudget = sequelize.cast(fn('NULLIF', sanitizedBudget, ''), numericType);
      if (Number.isFinite(minBudget)) {
        where[Op.and].push(
          sequelize.where(castBudget, {
            [Op.gte]: Math.max(0, Math.round(minBudget)),
          }),
        );
      }
      if (Number.isFinite(maxBudget)) {
        where[Op.and].push(
          sequelize.where(castBudget, {
            [Op.lte]: Math.max(0, Math.round(maxBudget)),
          }),
        );
      }
    }
  }

  if (filters.isRemote === true) {
    const remoteLike = buildLikeExpression('remote');
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    where[Op.and].push({
      [Op.or]: [
        { location: remoteLike },
        { description: remoteLike },
      ],
    });
  }

  const includes = [];
  const taxonomyInclude = buildTaxonomyInclude(category, filters);
  if (taxonomyInclude) {
    includes.push(taxonomyInclude);
  }

  const order = sanitiseSortExpressions(category, params.sort);

  const startedAt = Date.now();
  let rows;
  let count;
  try {
    ({ rows, count } = await model.findAndCountAll({
      where,
      order,
      limit: pageSize,
      offset,
      subQuery: false,
      distinct: includes.length > 0,
      include: includes,
    }));
  } catch (error) {
    logger.error?.({ err: error, category, query, filters }, 'Failed to execute opportunity search');
    throw error;
  }

  const hits = rows.map((row) => mapRecordToDocument(category, row));
  const total = typeof count === 'number' ? count : Array.isArray(count) ? count.length : rows.length;
  const processingTimeMs = Math.max(DEFAULT_PROCESSING_TIME_MS, Date.now() - startedAt);

  let facetDistribution = null;
  if (params.facets?.length) {
    facetDistribution = await computeFacetDistribution(category, model, where, filters, params.facets);
  }

  return {
    hits,
    total,
    page,
    pageSize,
    processingTimeMs,
    facetDistribution,
    query,
  };
}

export async function searchAcrossOpportunityIndexes(query, params = {}, options = {}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return null;
  }

  const limit = normaliseLimit(params.limit ?? 5);
  const categories = {};

  for (const category of Object.keys(opportunityModels)) {
    const result = await searchOpportunityIndex(
      category,
      { query: trimmed, page: 1, pageSize: limit },
      options,
    );
    categories[category] = {
      hits: result?.hits ?? [],
      total: result?.total ?? (result?.hits?.length ?? 0),
      processingTimeMs: result?.processingTimeMs ?? null,
      query: result?.query ?? trimmed,
    };
  }

  return {
    query: trimmed,
    limit,
    categories,
  };
}

export async function bootstrapOpportunitySearch(options = {}) {
  const logger = resolveLogger(options.logger);
  try {
    await ensureOpportunityIndexes();
    logger.info?.('Opportunity search engine initialised');
    return { configured: true };
  } catch (error) {
    logger.error?.({ err: error }, 'Failed to bootstrap opportunity search');
    throw error;
  }
}

export function __resetSearchClient() {}

export default {
  isSearchConfigured,
  ensureOpportunityIndexes,
  syncOpportunityIndexes,
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  bootstrapOpportunitySearch,
  isRemoteRole,
  parseBudgetValue,
  extractCurrencyCode,
  determineDurationCategory,
  __resetSearchClient,
};
