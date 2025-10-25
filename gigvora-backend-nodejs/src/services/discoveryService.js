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

const DIALECT = sequelize.getDialect();
const SNAPSHOT_CACHE_TTL_SECONDS = 60;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const PACKAGE_TIERS = ['basic', 'standard', 'premium'];

const opportunityModels = {
  job: Job,
  gig: Gig,
  project: Project,
  launchpad: ExperienceLaunchpad,
  volunteering: Volunteering,
};

const TAXONOMY_ENABLED_CATEGORIES = new Set(['job', 'gig', 'launchpad', 'volunteering']);

const CATEGORY_FACETS = {
  job: [
    'employmentType',
    'employmentCategory',
    'location',
    'geoCountry',
    'geoRegion',
    'geoCity',
    'isRemote',
    'updatedAtDate',
    'taxonomySlugs',
    'taxonomyTypes',
  ],
  gig: [
    'durationCategory',
    'budgetCurrency',
    'location',
    'geoCountry',
    'geoRegion',
    'geoCity',
    'updatedAtDate',
    'taxonomySlugs',
    'taxonomyTypes',
  ],
  project: ['status', 'location', 'geoCountry', 'geoRegion', 'geoCity', 'updatedAtDate'],
  launchpad: [
    'track',
    'location',
    'geoCountry',
    'geoRegion',
    'geoCity',
    'updatedAtDate',
    'taxonomySlugs',
    'taxonomyTypes',
  ],
  volunteering: [
    'organization',
    'isRemote',
    'location',
    'geoCountry',
    'geoRegion',
    'geoCity',
    'updatedAtDate',
    'taxonomySlugs',
    'taxonomyTypes',
  ],
};

const CATEGORY_SORTS = {
  job: {
    default: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
    newest: ['updatedAtTimestamp:desc'],
    alphabetical: ['title:asc'],
  },
  gig: {
    default: ['freshnessScore:desc', 'budgetValue:desc', 'updatedAtTimestamp:desc'],
    budget: ['budgetValue:desc', 'freshnessScore:desc'],
    newest: ['updatedAtTimestamp:desc'],
  },
  project: {
    default: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
    status: ['status:asc', 'freshnessScore:desc'],
    alphabetical: ['title:asc'],
  },
  launchpad: {
    default: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
    alphabetical: ['title:asc'],
  },
  volunteering: {
    default: ['freshnessScore:desc', 'updatedAtTimestamp:desc'],
    alphabetical: ['title:asc'],
  },
};

function parseFiltersInput(filters) {
  if (!filters) {
    return {};
  }

  if (typeof filters === 'string') {
    try {
      const parsed = JSON.parse(filters);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      throw new ValidationError('Filters must be valid JSON.', { cause: error });
    }
  }

  if (typeof filters === 'object') {
    return filters;
  }

  return {};
}

function escapeFilterValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/"/g, '\\"');
}

function buildEqualityGroup(field, values) {
  const sanitised = Array.from(new Set(values.map((value) => `${value}`.trim()).filter(Boolean))).map((value) =>
    `${field} = "${escapeFilterValue(value)}"`,
  );
  if (!sanitised.length) {
    return null;
  }
  if (sanitised.length === 1) {
    return sanitised[0];
  }
  return sanitised;
}

function computeUpdatedWithinExpression(token) {
  const now = new Date();
  let threshold;

  switch (token) {
    case '24h':
      threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      threshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }

  const isoDay = threshold.toISOString().slice(0, 10);
  return `updatedAtDate >= "${isoDay}"`;
}

function computeUpdatedWithinDate(token) {
  const now = new Date();
  switch (token) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function normaliseViewport(viewport) {
  if (!viewport) {
    return null;
  }

  let raw = viewport;
  if (typeof viewport === 'string') {
    try {
      raw = JSON.parse(viewport);
    } catch (error) {
      throw new ValidationError('Viewport must be valid JSON.', { cause: error });
    }
  }

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const box = raw.boundingBox ?? raw;
  const { north, south, east, west } = box;
  if (
    [north, south, east, west].some(
      (value) => typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value),
    )
  ) {
    throw new ValidationError('Viewport bounding box must include numeric north, south, east, and west values.');
  }

  return {
    boundingBox: {
      north,
      south,
      east,
      west,
    },
  };
}

function buildGeoBoundingBoxExpression(viewport) {
  if (!viewport?.boundingBox) {
    return null;
  }
  const { north, south, east, west } = viewport.boundingBox;
  return `_geoBoundingBox(${north}, ${east}, ${south}, ${west})`;
}

function resolveSortExpressions(category, sortKey) {
  const map = CATEGORY_SORTS[category] ?? {};
  if (sortKey) {
    const candidate = map[sortKey];
    if (candidate?.length) {
      return candidate;
    }
  }
  return map.default ?? undefined;
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

function normaliseTaxonomyFilterTokens(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .flatMap((value) => `${value}`.split(',').map((part) => part.trim().toLowerCase()))
        .filter(Boolean),
    ),
  );
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

function normaliseDeliveryCategory(label, leadTime) {
  const text = (label ?? '').toLowerCase();
  if (text.includes('express') || text.includes('rush') || text.includes('48') || text.includes('72')) {
    return 'express';
  }
  if (text.includes('week') || text.includes('standard')) {
    return 'standard';
  }
  if (text.includes('month') || text.includes('retainer') || text.includes('ongoing')) {
    return 'extended';
  }
  if (Number.isFinite(Number(leadTime))) {
    const days = Number(leadTime);
    if (days <= 5) return 'express';
    if (days <= 14) return 'standard';
    return 'extended';
  }
  return text.length ? text.replace(/\s+/g, '_') : 'standard';
}

function buildGigTrustBadges({ trustSignals = [], identityVerified, ratingAverage, ratingCount, completedOrders, escrowReady }) {
  const badges = new Set();
  trustSignals
    .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
    .filter(Boolean)
    .forEach((entry) => badges.add(entry));

  if (identityVerified) {
    badges.add('ID verified');
  }
  if (ratingAverage != null && Number.isFinite(ratingAverage) && ratingAverage > 0) {
    const formatted = ratingAverage.toFixed(1);
    badges.add(`Rated ${formatted}/5`);
  }
  if (ratingCount != null && ratingCount > 0) {
    badges.add(`${ratingCount}+ reviews`);
  }
  if (completedOrders != null && completedOrders > 0) {
    badges.add(`${completedOrders}+ deliveries`);
  }
  if (escrowReady) {
    badges.add('Escrow ready');
  }

  return Array.from(badges);
}

function buildFilterExpressions(category, filters = {}, viewport) {
  const expressions = [];

  if (filters.isRemote === true) {
    expressions.push('isRemote = true');
  } else if (filters.isRemote === false) {
    expressions.push('isRemote = false');
  }

  if (filters.employmentTypes?.length && category === 'job') {
    const group = buildEqualityGroup('employmentType', filters.employmentTypes);
    if (group) expressions.push(group);
  }

  if (filters.employmentCategories?.length && category === 'job') {
    const group = buildEqualityGroup('employmentCategory', filters.employmentCategories);
    if (group) expressions.push(group);
  }

  if (filters.durationCategories?.length && category === 'gig') {
    const group = buildEqualityGroup('durationCategory', filters.durationCategories);
    if (group) expressions.push(group);
  }

  if (filters.deliverySpeed && category === 'gig') {
    const value = `${filters.deliverySpeed}`.trim();
    if (value.length) {
      expressions.push(`deliverySpeedCategory = "${value}"`);
    }
  }

  if (filters.trustSignals?.verifiedOnly === true && category === 'gig') {
    expressions.push('identityVerified = true');
  }

  if (filters.trustSignals?.escrowReady === true && category === 'gig') {
    expressions.push('escrowReady = true');
  }

  if (filters.budget && category === 'gig') {
    const min = Number.parseFloat(filters.budget.min);
    const max = Number.parseFloat(filters.budget.max);
    if (Number.isFinite(min)) {
      expressions.push(`budgetValue >= ${min}`);
    }
    if (Number.isFinite(max)) {
      expressions.push(`budgetValue <= ${max}`);
    }
  }

  if (filters.budgetCurrencies?.length && category === 'gig') {
    const group = buildEqualityGroup('budgetCurrency', filters.budgetCurrencies);
    if (group) expressions.push(group);
  }

  if (filters.statuses?.length && category === 'project') {
    const group = buildEqualityGroup('status', filters.statuses);
    if (group) expressions.push(group);
  }

  if (filters.tracks?.length && category === 'launchpad') {
    const group = buildEqualityGroup('track', filters.tracks);
    if (group) expressions.push(group);
  }

  if (filters.organizations?.length && category === 'volunteering') {
    const group = buildEqualityGroup('organization', filters.organizations);
    if (group) expressions.push(group);
  }

  if (filters.taxonomySlugs?.length && TAXONOMY_ENABLED_CATEGORIES.has(category)) {
    const group = buildEqualityGroup('taxonomySlugs', filters.taxonomySlugs);
    if (group) expressions.push(group);
  }

  if (filters.taxonomyTypes?.length && TAXONOMY_ENABLED_CATEGORIES.has(category)) {
    const group = buildEqualityGroup('taxonomyTypes', filters.taxonomyTypes);
    if (group) expressions.push(group);
  }

  if (filters.locations?.length) {
    const group = buildEqualityGroup('location', filters.locations);
    if (group) expressions.push(group);
  }

  if (filters.countries?.length) {
    const group = buildEqualityGroup('geoCountry', filters.countries);
    if (group) expressions.push(group);
  }

  if (filters.regions?.length) {
    const group = buildEqualityGroup('geoRegion', filters.regions);
    if (group) expressions.push(group);
  }

  if (filters.cities?.length) {
    const group = buildEqualityGroup('geoCity', filters.cities);
    if (group) expressions.push(group);
  }

  if (filters.updatedWithin) {
    const freshnessExpression = computeUpdatedWithinExpression(filters.updatedWithin);
    if (freshnessExpression) expressions.push(freshnessExpression);
  }

  const geoExpression = buildGeoBoundingBoxExpression(viewport);
  if (geoExpression) {
    expressions.push(geoExpression);
  }

  return expressions.length ? expressions : undefined;
}

function applyStructuredFilters(where, category, filters = {}) {
  const andConditions = [];

  if (filters.locations?.length) {
    andConditions.push({ location: { [Op.in]: filters.locations.map((value) => value.trim()).filter(Boolean) } });
  }

  if (filters.employmentTypes?.length && category === 'job') {
    andConditions.push({ employmentType: { [Op.in]: filters.employmentTypes.map((value) => value.trim()).filter(Boolean) } });
  }

  if (filters.deliverySpeed && category === 'gig') {
    const trimmed = `${filters.deliverySpeed}`.trim();
    if (trimmed.length) {
      andConditions.push({ deliverySpeedCategory: trimmed });
    }
  }

  if (filters.trustSignals?.verifiedOnly === true && category === 'gig') {
    andConditions.push({ identityVerified: true });
  }

  if (filters.trustSignals?.escrowReady === true && category === 'gig') {
    andConditions.push({ escrowReady: true });
  }

  if (filters.budget && category === 'gig') {
    const min = Number.parseFloat(filters.budget.min);
    const max = Number.parseFloat(filters.budget.max);
    if (Number.isFinite(min)) {
      andConditions.push({ budgetAmount: { [Op.gte]: min } });
    }
    if (Number.isFinite(max)) {
      andConditions.push({ budgetAmount: { [Op.lte]: max } });
    }
  }

  if (filters.statuses?.length && category === 'project') {
    andConditions.push({ status: { [Op.in]: filters.statuses.map((value) => value.trim()).filter(Boolean) } });
  }

  if (filters.tracks?.length && category === 'launchpad') {
    andConditions.push({ track: { [Op.in]: filters.tracks.map((value) => value.trim()).filter(Boolean) } });
  }

  if (filters.organizations?.length && category === 'volunteering') {
    andConditions.push({ organization: { [Op.in]: filters.organizations.map((value) => value.trim()).filter(Boolean) } });
  }

  if (filters.isRemote === true) {
    const remoteLike = buildLikeExpression('remote');
    andConditions.push({
      [Op.or]: [
        { location: remoteLike },
        { description: remoteLike },
      ],
    });
  }

  const updatedThreshold = computeUpdatedWithinDate(filters.updatedWithin);
  if (updatedThreshold) {
    andConditions.push({ updatedAt: { [Op.gte]: updatedThreshold } });
  }

  if (andConditions.length) {
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    where[Op.and].push(...andConditions);
  }
}

function normalisePage(page) {
  const parsed = Number.parseInt(page ?? '1', 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function normalisePageSize(pageSize) {
  const parsed = Number.parseInt(pageSize ?? `${DEFAULT_PAGE_SIZE}`, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE);
}

function normaliseLimit(limit) {
  const parsed = Number.parseInt(limit ?? `${DEFAULT_PAGE_SIZE}`, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function toOpportunityDto(record, category) {
  if (!record) {
    return null;
  }

  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const geo = toGeoDto(plain.geoLocation, plain.location);
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
  };

  switch (category) {
    case 'job':
      return {
        ...base,
        employmentType: plain.employmentType ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'gig':
      {
        const packages = Array.isArray(record.packages)
          ? record.packages.map((pkg) => (pkg.toPublicObject?.() ?? pkg))
          : [];
        const addOns = Array.isArray(record.addons)
          ? record.addons.map((addon) => (addon.toPublicObject?.() ?? addon))
          : Array.isArray(record.addOns)
          ? record.addOns.map((addon) => (addon.toPublicObject?.() ?? addon))
          : [];
        const snapshot = Array.isArray(record.performanceSnapshots)
          ? record.performanceSnapshots[0]
          : null;
        const normalizedSnapshot = snapshot
          ? snapshot.toPublicObject?.() ?? snapshot.get?.({ plain: true }) ?? snapshot
          : null;
        const ratingAverage =
          plain.ratingAverage != null
            ? Number(plain.ratingAverage)
            : normalizedSnapshot?.reviewScore != null
            ? Number(normalizedSnapshot.reviewScore)
            : null;
        const ratingCount = plain.ratingCount ?? 0;
        const completedOrders = plain.completedOrderCount ?? null;
        const trustSignals = Array.isArray(plain.trustSignals)
          ? plain.trustSignals
          : plain.trustSignals && typeof plain.trustSignals === 'object'
          ? Object.values(plain.trustSignals)
          : [];
        const trustBadges = buildGigTrustBadges({
          trustSignals,
          identityVerified: plain.identityVerified,
          ratingAverage,
          ratingCount,
          completedOrders,
          escrowReady: plain.escrowReady,
        });
        const startingPrice = packages.reduce((accumulator, pkg) => {
          if (pkg?.priceAmount == null) {
            return accumulator;
          }
          const amount = Number(pkg.priceAmount);
          if (!Number.isFinite(amount)) {
            return accumulator;
          }
          if (!accumulator || amount < accumulator.amount) {
            return { amount, currency: pkg.priceCurrency ?? 'USD' };
          }
          return accumulator;
        }, null);
        let startingPriceFormatted = null;
        if (startingPrice) {
          try {
            startingPriceFormatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: startingPrice.currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(startingPrice.amount);
          } catch (error) {
            startingPriceFormatted = `${startingPrice.amount}`;
          }
        }
        const availableTiers = Array.from(
          new Set(
            packages
              .map((pkg) => (pkg.tier ?? pkg.key ?? pkg.packageKey ?? '')?.toString().toLowerCase())
              .filter((tier) => tier && PACKAGE_TIERS.includes(tier)),
          ),
        );

        return {
          ...base,
          budget: plain.budget ?? null,
          budgetAmount: plain.budgetAmount == null ? null : Number(plain.budgetAmount),
          budgetCurrency: plain.budgetCurrency ?? null,
          duration: plain.duration ?? null,
          workModel: plain.workModel ?? null,
          engagementModel: plain.engagementModel ?? null,
          deliverySpeed: plain.deliverySpeedLabel ?? null,
          deliverySpeedCategory:
            plain.deliverySpeedCategory ??
            normaliseDeliveryCategory(plain.deliverySpeedLabel, plain.deliveryLeadTimeDays),
          deliveryLeadTimeDays:
            plain.deliveryLeadTimeDays == null ? null : Number(plain.deliveryLeadTimeDays),
          isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
          conversationId: plain.conversationId ?? null,
          rating: ratingAverage,
          reviewCount: ratingCount,
          completedOrders,
          identityVerified: Boolean(plain.identityVerified),
          escrowReady: Boolean(plain.escrowReady),
          trustSignals,
          trustBadges,
          packages,
          addOns,
          startingPrice: startingPrice
            ? {
                amount: startingPrice.amount,
                currency: startingPrice.currency,
                formatted: startingPriceFormatted,
              }
            : null,
          availableTiers,
          customRequestEnabled: plain.customRequestEnabled !== false,
          customRequestInstructions: plain.customRequestInstructions ?? null,
          metadata: plain.metadata ?? null,
          owner:
            record.owner && typeof record.owner.get === 'function'
              ? record.owner.get({ plain: true })
              : record.owner ?? null,
          savedCount: plain.savedCount ?? 0,
          searchBoost: plain.searchBoost ?? 0,
          performance:
            normalizedSnapshot && typeof normalizedSnapshot === 'object'
              ? {
                  reviewScore:
                    normalizedSnapshot.reviewScore == null
                      ? null
                      : Number(normalizedSnapshot.reviewScore),
                  bookingsLast30Days: normalizedSnapshot.bookingsLast30Days ?? null,
                  conversionRate:
                    normalizedSnapshot.conversionRate == null
                      ? null
                      : Number(normalizedSnapshot.conversionRate),
                  averageOrderValue:
                    normalizedSnapshot.averageOrderValue == null
                      ? null
                      : Number(normalizedSnapshot.averageOrderValue),
                  completionRate:
                    normalizedSnapshot.completionRate == null
                      ? null
                      : Number(normalizedSnapshot.completionRate),
                }
              : null,
        };
      }
    case 'project':
      return {
        ...base,
        status: plain.status ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
        autoAssignEnabled: Boolean(plain.autoAssignEnabled),
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

  const parsedFilters = parseFiltersInput(filters);
  const normalisedViewport = normaliseViewport(viewport);
  const filterExpressions = buildFilterExpressions(category, parsedFilters, normalisedViewport);
  const sortExpressions = Array.isArray(sort) ? sort : resolveSortExpressions(category, sort);
  const facetFields = includeFacets ? CATEGORY_FACETS[category] : undefined;
  const taxonomyInclude = buildTaxonomyInclude(category, parsedFilters);
  const includes = [];
  if (taxonomyInclude) {
    includes.push(taxonomyInclude);
  }
  if (category === 'gig') {
    includes.push(
      {
        association: 'packages',
        attributes: [
          'id',
          'gigId',
          'packageKey',
          'tier',
          'name',
          'description',
          'priceAmount',
          'priceCurrency',
          'deliveryDays',
          'revisionLimit',
          'highlights',
          'deliverables',
          'recommendedFor',
          'isPopular',
          'position',
        ],
        separate: false,
        order: [['position', 'ASC']],
      },
      {
        association: 'addons',
        attributes: [
          'id',
          'gigId',
          'addOnKey',
          'name',
          'description',
          'priceAmount',
          'priceCurrency',
          'isActive',
          'position',
        ],
        separate: false,
        order: [['position', 'ASC']],
      },
      {
        association: 'performanceSnapshots',
        attributes: [
          'id',
          'gigId',
          'snapshotDate',
          'periodLabel',
          'conversionRate',
          'averageOrderValue',
          'completionRate',
          'upsellTakeRate',
          'reviewScore',
          'bookingsLast30Days',
        ],
        limit: 1,
        order: [['snapshotDate', 'DESC']],
        separate: false,
      },
      {
        association: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    );
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
    return {
      items: searchResult.hits.map((hit) => toOpportunityDto(hit, category)),
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
      appliedFilters: parsedFilters,
      viewport: normalisedViewport,
    };
  }

  const where = buildSearchWhereClause(category, query);
  applyStructuredFilters(where, category, parsedFilters);

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

  return {
    items: rows.map((row) => toOpportunityDto(row, category)),
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.ceil(count / safeSize) || 1,
    facets: null,
    metrics: { source: 'database' },
    appliedFilters: parsedFilters,
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
      jobs: (searchHits.job ?? []).map((hit) => toOpportunityDto(hit, 'job')),
      gigs: (searchHits.gig ?? []).map((hit) => toOpportunityDto(hit, 'gig')),
      projects: (searchHits.project ?? []).map((hit) => toOpportunityDto(hit, 'project')),
      launchpads: (searchHits.launchpad ?? []).map((hit) => toOpportunityDto(hit, 'launchpad')),
      volunteering: (searchHits.volunteering ?? []).map((hit) =>
        toOpportunityDto(hit, 'volunteering'),
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
