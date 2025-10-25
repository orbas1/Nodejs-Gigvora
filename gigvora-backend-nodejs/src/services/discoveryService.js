import { Op } from 'sequelize';
import {
  sequelize,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  MentorProfile,
  OpportunityTaxonomyAssignment,
  OpportunityTaxonomy,
  MENTOR_AVAILABILITY_STATUSES,
  MENTOR_PRICE_TIERS,
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

const PRICE_TIER_LABELS = {
  tier_entry: 'Up to £150/session',
  tier_growth: '£150-£300/session',
  tier_scale: '£300+/session',
};

const AVAILABILITY_LABELS = {
  open: 'Open slots',
  waitlist: 'Waitlist',
  booked_out: 'Booked out',
};

const CURRENCY_SYMBOLS = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  CAD: '$',
  AUD: '$',
  SGD: '$',
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

function resolveCurrencySymbol(currency) {
  if (!currency) {
    return null;
  }
  const trimmed = `${currency}`.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (CURRENCY_SYMBOLS[upper]) {
    return CURRENCY_SYMBOLS[upper];
  }
  return upper.length === 3 ? upper : trimmed;
}

function normaliseMentorFilters(raw = {}) {
  const filters = {
    discipline: [],
    priceTier: [],
    availability: [],
  };

  const pushValues = (key, value, { toLowerCase = false } = {}) => {
    const entries = coerceArray(value)
      .map((entry) => {
        const trimmed = entry.trim();
        return toLowerCase ? trimmed.toLowerCase() : trimmed;
      })
      .filter(Boolean);
    if (!entries.length) {
      return;
    }
    const existing = new Set(filters[key]);
    entries.forEach((entry) => existing.add(entry));
    filters[key] = Array.from(existing);
  };

  pushValues('discipline', raw.discipline ?? raw.disciplines ?? raw.focus ?? raw.focusAreas);
  pushValues('priceTier', raw.priceTier ?? raw.priceTiers ?? raw.pricing ?? raw.priceTierIds, {
    toLowerCase: true,
  });
  pushValues(
    'availability',
    raw.availability ?? raw.availabilityStatus ?? raw.availabilityStatuses,
    { toLowerCase: true },
  );

  filters.priceTier = filters.priceTier.filter((value) => MENTOR_PRICE_TIERS.includes(value));
  filters.availability = filters.availability.filter((value) =>
    MENTOR_AVAILABILITY_STATUSES.includes(value),
  );

  return filters;
}

function toMentorDto(record) {
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;

  const expertise = Array.isArray(plain.expertise)
    ? plain.expertise.filter((entry) => entry != null && `${entry}`.trim().length)
    : [];
  const testimonials = Array.isArray(plain.testimonials)
    ? plain.testimonials.filter(Boolean)
    : [];
  const rawPackages = Array.isArray(plain.packages) ? plain.packages.filter(Boolean) : [];

  const sessionAmount = Number(plain.sessionFeeAmount);
  const hasSessionFee = Number.isFinite(sessionAmount);
  const sessionCurrencySymbol = resolveCurrencySymbol(plain.sessionFeeCurrency);
  const sessionFee = hasSessionFee
    ? {
        amount: sessionAmount,
        currency: sessionCurrencySymbol ?? '£',
        unit: plain.sessionFeeUnit ?? 'session',
      }
    : null;

  const packages = rawPackages
    .map((pack) => {
      if (!pack || typeof pack !== 'object') {
        return null;
      }
      const name = pack.name ?? null;
      if (!name) {
        return null;
      }
      const price = pack.price != null ? Number(pack.price) : null;
      const currency = resolveCurrencySymbol(pack.currency) ?? sessionCurrencySymbol ?? null;
      return {
        name,
        description: pack.description ?? null,
        currency: currency ?? pack.currency ?? null,
        price,
      };
    })
    .filter(Boolean);

  const responseTimeHours = plain.responseTimeHours != null ? Number(plain.responseTimeHours) : null;
  const resolvedResponseTime =
    Number.isFinite(responseTimeHours) && responseTimeHours >= 0
      ? new Date(Date.now() + responseTimeHours * 60 * 60 * 1000).toISOString()
      : null;

  return {
    id: plain.id,
    slug: plain.slug ?? null,
    name: plain.name ?? null,
    title: plain.name ?? null,
    headline: plain.headline ?? null,
    description: plain.bio ?? null,
    bio: plain.bio ?? null,
    region: plain.region ?? null,
    discipline: plain.discipline ?? null,
    expertise,
    sessionFee: sessionFee ?? undefined,
    priceTier: plain.priceTier ?? null,
    availabilityStatus: plain.availabilityStatus ?? 'open',
    availabilityNotes: plain.availabilityNotes ?? null,
    responseTimeHours: Number.isFinite(responseTimeHours) ? responseTimeHours : null,
    responseTime: resolvedResponseTime,
    reviews: Number.isFinite(Number(plain.reviewCount)) ? Number(plain.reviewCount) : 0,
    rating: plain.rating != null ? Number(plain.rating) : null,
    isVerified: Boolean(plain.verificationBadge),
    verificationLabel: plain.verificationBadge ?? null,
    testimonialHighlight: plain.testimonialHighlight ?? null,
    testimonialHighlightAuthor: plain.testimonialHighlightAuthor ?? null,
    testimonials,
    packages,
    avatarUrl: plain.avatarUrl ?? null,
    promoted: Boolean(plain.promoted),
    rankingScore: Number.isFinite(Number(plain.rankingScore)) ? Number(plain.rankingScore) : 0,
    lastActiveAt: plain.lastActiveAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    createdAt: plain.createdAt ?? null,
    category: 'mentor',
  };
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

  if (category === 'gig') {
    const minBudget = Number(normalisedFilters.budgetValueMin);
    const maxBudget = Number(normalisedFilters.budgetValueMax);
    if (Number.isFinite(minBudget) || Number.isFinite(maxBudget)) {
      if (!where[Op.and]) {
        where[Op.and] = [];
      }
      const numericType = DIALECT === 'postgres' ? 'numeric' : 'decimal';
      const sanitizedBudget = sequelize.fn('REGEXP_REPLACE', sequelize.col('Gig.budget'), '[^0-9.]', '');
      const castBudget = sequelize.cast(sequelize.fn('NULLIF', sanitizedBudget, ''), numericType);
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

export async function listMentors(options = {}) {
  const safePage = normalisePage(options.page);
  const safeSize = normalisePageSize(options.pageSize);
  const offset = (safePage - 1) * safeSize;

  const query = options.query?.trim() ?? '';
  const likeExpression = query ? buildLikeExpression(query) : null;
  const searchClause = likeExpression
    ? {
        [Op.or]: [
          { name: likeExpression },
          { headline: likeExpression },
          { discipline: likeExpression },
          { region: likeExpression },
          { bio: likeExpression },
          { searchVector: buildLikeExpression(query.toLowerCase()) },
        ],
      }
    : null;

  const rawFilters = parseFiltersInput(options.filters);
  const normalisedFilters = normaliseMentorFilters(rawFilters);

  const filterConditions = {
    discipline: normalisedFilters.discipline.length
      ? { discipline: { [Op.in]: normalisedFilters.discipline } }
      : null,
    priceTier: normalisedFilters.priceTier.length
      ? { priceTier: { [Op.in]: normalisedFilters.priceTier } }
      : null,
    availability: normalisedFilters.availability.length
      ? { availabilityStatus: { [Op.in]: normalisedFilters.availability } }
      : null,
  };

  const buildWhere = (excludeKey = null) => {
    const conditions = [];
    if (searchClause) {
      conditions.push(searchClause);
    }
    Object.entries(filterConditions).forEach(([key, condition]) => {
      if (condition && key !== excludeKey) {
        conditions.push(condition);
      }
    });
    if (!conditions.length) {
      return {};
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return { [Op.and]: conditions };
  };

  const sortKey = typeof options.sort === 'string' ? options.sort.trim().toLowerCase() : null;
  const order = [
    ['promoted', 'DESC'],
    ['rankingScore', 'DESC'],
    ['reviewCount', 'DESC'],
    ['updatedAt', 'DESC'],
  ];

  if (sortKey === 'alphabetical') {
    order.unshift(['name', 'ASC']);
  } else if (sortKey === 'price_asc') {
    order.unshift(['sessionFeeAmount', 'ASC']);
  } else if (sortKey === 'price_desc') {
    order.unshift(['sessionFeeAmount', 'DESC']);
  }

  let rows;
  let count;
  try {
    ({ rows, count } = await MentorProfile.findAndCountAll({
      where: buildWhere(),
      order,
      limit: safeSize,
      offset,
    }));
  } catch (error) {
    throw new ApplicationError(`Unable to list mentors: ${error.message}`, 500, {
      cause: error,
      query,
      filters: rawFilters,
    });
  }

  const annotated = annotateWithScores(
    rows.map((row) => toMentorDto(row)),
    { query, filters: rawFilters, category: 'mentor' },
  );

  let facets = null;
  if (options.includeFacets) {
    const [disciplineRows, priceRows, availabilityRows] = await Promise.all([
      MentorProfile.findAll({
        attributes: [
          'discipline',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('discipline'),
        group: ['discipline'],
        order: [['discipline', 'ASC']],
        raw: true,
      }),
      MentorProfile.findAll({
        attributes: [
          'priceTier',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('priceTier'),
        group: ['priceTier'],
        raw: true,
      }),
      MentorProfile.findAll({
        attributes: [
          'availabilityStatus',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('availability'),
        group: ['availabilityStatus'],
        raw: true,
      }),
    ]);

    const formatFacet = (rows, field, labels = {}) =>
      rows
        .filter((row) => row[field])
        .map((row) => ({
          value: row[field],
          label: labels[row[field]] ?? row[field],
          count: Number(row.count ?? 0),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    facets = {
      discipline: formatFacet(disciplineRows, 'discipline'),
      priceTier: formatFacet(priceRows, 'priceTier', PRICE_TIER_LABELS),
      availability: formatFacet(availabilityRows, 'availabilityStatus', AVAILABILITY_LABELS),
    };
  }

  const totalPages = Math.ceil(count / safeSize) || 1;
  const hasMore = offset + rows.length < count;

  return {
    items: annotated,
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages,
    facets,
    metrics: { source: 'database' },
    appliedFilters: normalisedFilters,
    meta: {
      total: count,
      page: safePage,
      pageSize: safeSize,
      totalPages,
      hasMore,
    },
  };
}

export async function getDiscoverySnapshot({ limit } = {}) {
  const safeLimit = normaliseLimit(limit);
  const cacheKey = buildCacheKey('discovery:snapshot', { limit: safeLimit });

  return appCache.remember(cacheKey, SNAPSHOT_CACHE_TTL_SECONDS, async () => {
    const [jobs, gigs, projects, launchpads, volunteering, mentors] = await Promise.all([
      listJobs({ page: 1, pageSize: safeLimit }),
      listGigs({ page: 1, pageSize: safeLimit }),
      listProjects({ page: 1, pageSize: safeLimit }),
      listLaunchpads({ page: 1, pageSize: safeLimit }),
      listVolunteering({ page: 1, pageSize: safeLimit }),
      listMentors({ page: 1, pageSize: safeLimit }),
    ]);

    return {
      jobs: { total: jobs.total, items: jobs.items },
      gigs: { total: gigs.total, items: gigs.items },
      projects: { total: projects.total, items: projects.items },
      launchpads: { total: launchpads.total, items: launchpads.items },
      volunteering: { total: volunteering.total, items: volunteering.items },
      mentors: { total: mentors.total, items: mentors.items },
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
      mentors: [],
    };
  }

  const searchHits = await searchAcrossOpportunityIndexes(trimmed, { limit: safeLimit });

  if (searchHits) {
    const mentors = await listMentors({ page: 1, pageSize: safeLimit, query: trimmed });
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
      mentors: mentors.items,
    };
  }

  const [jobs, gigs, projects, launchpads, volunteering, mentors] = await Promise.all([
    listJobs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listGigs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listProjects({ page: 1, pageSize: safeLimit, query: trimmed }),
    listLaunchpads({ page: 1, pageSize: safeLimit, query: trimmed }),
    listVolunteering({ page: 1, pageSize: safeLimit, query: trimmed }),
    listMentors({ page: 1, pageSize: safeLimit, query: trimmed }),
  ]);

  return {
    jobs: jobs.items,
    gigs: gigs.items,
    projects: projects.items,
    launchpads: launchpads.items,
    volunteering: volunteering.items,
    mentors: mentors.items,
  };
}

export default {
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
  listMentors,
  getDiscoverySnapshot,
  searchOpportunitiesAcrossCategories,
  toOpportunityDto,
};
