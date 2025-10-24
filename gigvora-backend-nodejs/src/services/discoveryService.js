import { Op } from 'sequelize';
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
import { ApplicationError, ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import {
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  isRemoteRole,
} from './searchIndexService.js';
import {
  CATEGORY_FACETS,
  CATEGORY_SORTS,
  TAXONOMY_ENABLED_CATEGORIES,
  parseFiltersInput,
  normaliseViewport,
  buildFilterExpressions,
  applyStructuredFilters,
  resolveSortExpressions,
  normalisePage,
  normalisePageSize,
  normaliseLimit,
  normaliseTaxonomyFilterTokens,
} from './opportunityQueryNormaliser.js';
import { annotateWithScores } from './opportunityScoringService.js';

const DIALECT = sequelize.getDialect();
const SNAPSHOT_CACHE_TTL_SECONDS = 60;

const opportunityModels = {
  job: Job,
  gig: Gig,
  project: Project,
  launchpad: ExperienceLaunchpad,
  volunteering: Volunteering,
};

function coerceArray(value) {
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
}

function normaliseClientFilters(raw = {}) {
  const filters = {};

  const assign = (sourceKeys, targetKey) => {
    const values = sourceKeys.flatMap((key) => coerceArray(raw[key]));
    if (values.length) {
      filters[targetKey] = values;
    }
  };

  assign(['employmentType', 'employmentTypes'], 'employmentType');
  assign(['employmentCategory', 'employmentCategories'], 'employmentCategory');
  assign(['durationCategory', 'durationCategories'], 'durationCategory');
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

  return filters;
}

function toGeoDto(geoLocation, fallbackLocation = null) {
  if (!geoLocation) {
    return null;
  }

  const source = typeof geoLocation === 'string' ? { label: geoLocation } : geoLocation;
  const lat = Number.parseFloat(source.lat ?? source.latitude);
  const lng = Number.parseFloat(source.lng ?? source.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    city: source.city ?? source.town ?? source.locality ?? null,
    region: source.region ?? source.state ?? source.stateCode ?? null,
    country: source.country ?? source.countryCode ?? null,
    label:
      source.label ??
      source.name ??
      source.formatted ??
      source.displayName ??
      fallbackLocation ??
      null,
    isRemote: typeof source.isRemote === 'boolean' ? source.isRemote : null,
  };
}

function toOpportunityDto(record, category) {
  if (!record) {
    return null;
  }

  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const geo = toGeoDto(plain.geoLocation ?? plain.geo, plain.location);
  const taxonomies = extractTaxonomies(plain);
  const taxonomySlugs = Array.from(new Set(taxonomies.map((entry) => entry.slug).filter(Boolean)));
  const taxonomyTypes = Array.from(new Set(taxonomies.map((entry) => entry.type).filter(Boolean)));
  const taxonomyLabels = Array.from(new Set(taxonomies.map((entry) => entry.label).filter(Boolean)));

  const base = {
    id: plain.id,
    category,
    title: plain.title,
    description: plain.description,
    updatedAt: plain.updatedAt ?? plain.createdAt ?? new Date(),
    location: plain.location ?? null,
    geo,
    taxonomies,
    taxonomySlugs,
    taxonomyTypes,
    taxonomyLabels,
    aiSignals: plain.aiSignals ?? null,
  };

  switch (category) {
    case 'job':
      return {
        ...base,
        employmentType: plain.employmentType ?? null,
        employmentCategory: plain.employmentCategory ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'gig':
      return {
        ...base,
        budget: plain.budget ?? null,
        budgetCurrency: plain.budgetCurrency ?? null,
        duration: plain.duration ?? null,
        durationCategory: plain.durationCategory ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'project':
      return {
        ...base,
        status: plain.status ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
        autoAssignEnabled: plain.autoAssignEnabled == null ? null : Boolean(plain.autoAssignEnabled),
        autoAssignStatus: plain.autoAssignStatus ?? null,
        autoAssignLastQueueSize: plain.autoAssignLastQueueSize ?? null,
        autoAssignLastRunAt: plain.autoAssignLastRunAt ?? null,
        autoAssignSettings: plain.autoAssignSettings ?? null,
      };
    case 'launchpad':
      return {
        ...base,
        track: plain.track ?? null,
        isRemote: geo?.isRemote ?? false,
      };
    case 'volunteering':
      return {
        ...base,
        organization: plain.organization ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    default:
      throw new ValidationError(`Unsupported opportunity category "${category}".`);
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

function extractTaxonomies(record) {
  if (!record) {
    return [];
  }

  if (Array.isArray(record.taxonomies) && record.taxonomies.length) {
    const seen = new Set();
    return record.taxonomies
      .map((entry) => ({
        id: entry.id ?? null,
        slug: entry.slug ?? entry.Slug ?? null,
        label: entry.label ?? entry.Label ?? null,
        type: entry.type ?? entry.Type ?? null,
      }))
      .filter((entry) => {
        const key = entry.slug ? `${entry.slug}`.toLowerCase() : null;
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  const slugs = Array.isArray(record.taxonomySlugs) ? record.taxonomySlugs : [];
  const labels = Array.isArray(record.taxonomyLabels) ? record.taxonomyLabels : [];
  const types = Array.isArray(record.taxonomyTypes) ? record.taxonomyTypes : [];

  const fromLists = slugs
    .map((slug, index) => ({
      id: null,
      slug,
      label: labels[index] ?? null,
      type: types[index] ?? null,
    }))
    .filter((entry) => entry.slug);

  const assignments = Array.isArray(record.taxonomyAssignments) ? record.taxonomyAssignments : [];
  const fromAssignments = assignments
    .map((assignment) => {
      const taxonomy = assignment.taxonomy
        ? typeof assignment.taxonomy.get === 'function'
          ? assignment.taxonomy.get({ plain: true })
          : assignment.taxonomy
        : null;
      if (!taxonomy && assignment.slug) {
        return {
          id: assignment.taxonomyId ?? null,
          slug: assignment.slug,
          label: assignment.label ?? null,
          type: assignment.type ?? assignment.targetType ?? null,
        };
      }
      if (!taxonomy) {
        return null;
      }
      return {
        id: taxonomy.id ?? assignment.taxonomyId ?? null,
        slug: taxonomy.slug,
        label: taxonomy.label ?? null,
        type: taxonomy.type ?? null,
      };
    })
    .filter(Boolean);

  const combined = [...fromAssignments, ...fromLists];
  const deduped = [];
  const seen = new Set();

  combined.forEach((entry) => {
    const key = entry.slug ? `${entry.slug}`.toLowerCase() : null;
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(entry);
  });

  return deduped;
}

function buildLikeExpression(value) {
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

async function listOpportunities(category, { page, pageSize, query, filters, sort, includeFacets = false, viewport } = {}) {
  if (!opportunityModels[category]) {
    throw new ValidationError(`Unknown opportunity category "${category}".`);
  }

  const safePage = normalisePage(page);
  const safeSize = normalisePageSize(pageSize);
  const offset = (safePage - 1) * safeSize;

  const searchQuery = query?.trim() ?? '';

  const rawFilters = parseFiltersInput(filters);
  const normalisedFilters = normaliseClientFilters(rawFilters);
  const normalisedViewport = normaliseViewport(viewport);
  const filterExpressions = buildFilterExpressions(category, normalisedFilters, normalisedViewport);
  const sortExpressions = Array.isArray(sort) ? sort : resolveSortExpressions(category, sort);
  const facetFields = includeFacets ? CATEGORY_FACETS[category] : undefined;
  const taxonomyInclude = buildTaxonomyInclude(category, normalisedFilters);
  const includes = [];
  if (taxonomyInclude) {
    includes.push(taxonomyInclude);
  }

  const searchResult = await searchOpportunityIndex(
    category,
    {
      query: searchQuery,
      page: safePage,
      pageSize: safeSize,
      filters: filterExpressions,
      sort: sortExpressions,
      facets: facetFields,
    },
  );

  if (searchResult) {
    const totalPages = Math.max(1, Math.ceil(searchResult.total / safeSize));
    const items = annotateWithScores(
      searchResult.hits.map((hit) => toOpportunityDto(hit, category)),
      { query: searchQuery, filters: normalisedFilters, viewport: normalisedViewport, category },
    );

    return {
      items,
      total: searchResult.total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
      facets: searchResult.facetDistribution ?? null,
      metrics: {
        source: 'meilisearch',
        processingTimeMs: searchResult.processingTimeMs ?? null,
        query: searchResult.query ?? searchQuery,
      },
      appliedFilters: normalisedFilters,
      viewport: normalisedViewport,
    };
  }

  const where = buildSearchWhereClause(category, query);
  applyStructuredFilters(where, category, normalisedFilters);

  if (normalisedFilters.isRemote === true || normalisedFilters.isRemote === 'true' || normalisedFilters.isRemote === '1') {
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

  let rows;
  let count;
  try {
    ({ rows, count } = await opportunityModels[category].findAndCountAll({
      where,
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: safeSize,
      offset,
      subQuery: false,
      distinct: includes.length > 0,
      include: includes,
    }));
  } catch (error) {
    throw new ApplicationError(`Unable to list discovery opportunities: ${error.message}`, 500, {
      category,
      query,
      cause: error,
    });
  }

  const items = annotateWithScores(
    rows.map((row) => toOpportunityDto(row, category)),
    { query: searchQuery, filters: normalisedFilters, viewport: normalisedViewport, category },
  );

  return {
    items,
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.ceil(count / safeSize) || 1,
    facets: null,
    metrics: { source: 'database' },
    appliedFilters: normalisedFilters,
    viewport: normalisedViewport,
  };
}

export async function listJobs(options = {}) {
  return listOpportunities('job', options);
}

export async function listGigs(options = {}) {
  return listOpportunities('gig', options);
}

export async function listProjects(options = {}) {
  return listOpportunities('project', options);
}

export async function listLaunchpads(options = {}) {
  return listOpportunities('launchpad', options);
}

export async function listVolunteering(options = {}) {
  return listOpportunities('volunteering', options);
}

export async function getDiscoverySnapshot({ limit } = {}) {
  const safeLimit = normaliseLimit(limit);
  const cacheKey = buildCacheKey('discovery:snapshot', { limit: safeLimit });

  return appCache.remember(cacheKey, SNAPSHOT_CACHE_TTL_SECONDS, async () => {
    const [jobs, gigs, projects, launchpads, volunteering] = await Promise.all([
      listJobs({ page: 1, pageSize: safeLimit }),
      listGigs({ page: 1, pageSize: safeLimit }),
      listProjects({ page: 1, pageSize: safeLimit }),
      listLaunchpads({ page: 1, pageSize: safeLimit }),
      listVolunteering({ page: 1, pageSize: safeLimit }),
    ]);

    return {
      jobs: { total: jobs.total, items: jobs.items },
      gigs: { total: gigs.total, items: gigs.items },
      projects: { total: projects.total, items: projects.items },
      launchpads: { total: launchpads.total, items: launchpads.items },
      volunteering: { total: volunteering.total, items: volunteering.items },
    };
  });
}

export async function searchOpportunitiesAcrossCategories(query, { limit } = {}) {
  const safeLimit = normaliseLimit(limit);
  const trimmed = query?.trim();
  if (!trimmed) {
    return {
      jobs: [],
      gigs: [],
      projects: [],
      launchpads: [],
      volunteering: [],
    };
  }

  const searchHits = await searchAcrossOpportunityIndexes(trimmed, { limit: safeLimit });

  if (searchHits) {
    return {
      jobs: annotateWithScores(
        (searchHits.job ?? []).map((hit) => toOpportunityDto(hit, 'job')),
        { query: trimmed, filters: {}, category: 'job' },
      ),
      gigs: annotateWithScores(
        (searchHits.gig ?? []).map((hit) => toOpportunityDto(hit, 'gig')),
        { query: trimmed, filters: {}, category: 'gig' },
      ),
      projects: annotateWithScores(
        (searchHits.project ?? []).map((hit) => toOpportunityDto(hit, 'project')),
        { query: trimmed, filters: {}, category: 'project' },
      ),
      launchpads: annotateWithScores(
        (searchHits.launchpad ?? []).map((hit) => toOpportunityDto(hit, 'launchpad')),
        { query: trimmed, filters: {}, category: 'launchpad' },
      ),
      volunteering: annotateWithScores(
        (searchHits.volunteering ?? []).map((hit) => toOpportunityDto(hit, 'volunteering')),
        { query: trimmed, filters: {}, category: 'volunteering' },
      ),
    };
  }

  const [jobs, gigs, projects, launchpads, volunteering] = await Promise.all([
    listJobs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listGigs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listProjects({ page: 1, pageSize: safeLimit, query: trimmed }),
    listLaunchpads({ page: 1, pageSize: safeLimit, query: trimmed }),
    listVolunteering({ page: 1, pageSize: safeLimit, query: trimmed }),
  ]);

  return {
    jobs: jobs.items,
    gigs: gigs.items,
    projects: projects.items,
    launchpads: launchpads.items,
    volunteering: volunteering.items,
  };
}

export default {
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
  getDiscoverySnapshot,
  searchOpportunitiesAcrossCategories,
  toOpportunityDto,
};
