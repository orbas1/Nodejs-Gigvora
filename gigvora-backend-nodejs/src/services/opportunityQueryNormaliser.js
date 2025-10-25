import { Op } from 'sequelize';
import { ValidationError } from '../utils/errors.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const TAXONOMY_ENABLED_CATEGORIES = new Set(['job', 'gig', 'launchpad', 'volunteering']);

export const CATEGORY_FACETS = {
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

export const CATEGORY_SORTS = {
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

export function parseFiltersInput(filters) {
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

export function computeUpdatedWithinDate(token) {
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

export function normaliseViewport(viewport) {
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

export function buildGeoBoundingBoxExpression(viewport) {
  if (!viewport?.boundingBox) {
    return null;
  }
  const { north, south, east, west } = viewport.boundingBox;
  return `_geoBoundingBox(${north}, ${east}, ${south}, ${west})`;
}

export function resolveSortExpressions(category, sortKey) {
  const map = CATEGORY_SORTS[category] ?? {};
  if (sortKey) {
    const candidate = map[sortKey];
    if (candidate?.length) {
      return candidate;
    }
  }
  return map.default ?? undefined;
}

export function normaliseTaxonomyFilterTokens(values = []) {
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

export function buildFilterExpressions(category, filters = {}, viewport = null) {
  const groups = [];

  const ensureArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (value == null || value === '') {
      return [];
    }
    return [value];
  };

  Object.entries(filters).forEach(([key, rawValue]) => {
    if (rawValue == null || rawValue === '' || (Array.isArray(rawValue) && rawValue.length === 0)) {
      return;
    }

    switch (key) {
      case 'employmentType':
        if (category === 'job') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'employmentCategory':
        if (category === 'job') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'durationCategory':
        if (category === 'gig') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'budgetCurrency':
        if (category === 'gig') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'budgetMinAmount': {
        const value = Number(rawValue);
        if (!Number.isNaN(value)) {
          groups.push(`budgetMaxAmount >= ${value}`);
        }
        break;
      }
      case 'budgetMaxAmount': {
        const value = Number(rawValue);
        if (!Number.isNaN(value)) {
          groups.push(`budgetMinAmount <= ${value}`);
        }
        break;
      }
      case 'status':
        if (category === 'project') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'track':
        if (category === 'launchpad') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'organization':
        if (category === 'volunteering') {
          const group = buildEqualityGroup(key, ensureArray(rawValue));
          if (group) groups.push(group);
        }
        break;
      case 'location':
      case 'geoCountry':
      case 'geoRegion':
      case 'geoCity': {
        const group = buildEqualityGroup(key, ensureArray(rawValue));
        if (group) groups.push(group);
        break;
      }
      case 'isRemote': {
        if (rawValue === true || rawValue === 'true' || rawValue === '1') {
          groups.push('isRemote = true');
        } else if (rawValue === false || rawValue === 'false' || rawValue === '0') {
          groups.push('isRemote = false');
        }
        break;
      }
      case 'updatedWithin': {
        const expression = computeUpdatedWithinExpression(rawValue);
        if (expression) {
          groups.push(expression);
        }
        break;
      }
      case 'taxonomySlugs': {
        const tokens = normaliseTaxonomyFilterTokens(rawValue);
        if (tokens.length) {
          const slugGroups = buildEqualityGroup('taxonomySlugs', tokens);
          if (slugGroups) {
            groups.push(slugGroups);
          }
        }
        break;
      }
      case 'taxonomyTypes': {
        const tokens = normaliseTaxonomyFilterTokens(rawValue);
        if (tokens.length) {
          const typeGroups = buildEqualityGroup('taxonomyTypes', tokens);
          if (typeGroups) {
            groups.push(typeGroups);
          }
        }
        break;
      }
      case 'deliverySpeed': {
        const group = buildEqualityGroup('deliverySpeed', ensureArray(rawValue));
        if (group) {
          groups.push(group);
        }
        break;
      }
      default:
        break;
    }
  });

  const geoExpression = buildGeoBoundingBoxExpression(viewport);
  if (geoExpression) {
    groups.push(geoExpression);
  }

  if (!groups.length) {
    return undefined;
  }

  return groups
    .map((group) => {
      if (Array.isArray(group)) {
        return `(${group.join(' OR ')})`;
      }
      return group;
    })
    .join(' AND ');
}

export function applyStructuredFilters(where, category, filters = {}) {
  const normaliseList = (value) => {
    if (Array.isArray(value)) {
      return value.map((entry) => `${entry}`.trim()).filter(Boolean);
    }
    if (value == null || value === '') {
      return [];
    }
    return [`${value}`.trim()].filter(Boolean);
  };

  const pushEquality = (field, value, { allowArray = true } = {}) => {
    const list = allowArray ? normaliseList(value) : normaliseList(value).slice(0, 1);
    if (!list.length) {
      return;
    }
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    if (list.length === 1) {
      where[Op.and].push({ [field]: list[0] });
    } else {
      where[Op.and].push({ [field]: { [Op.in]: list } });
    }
  };

  const pushRange = (field, operator, value) => {
    if (value == null || Number.isNaN(Number(value))) {
      return;
    }
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    where[Op.and].push({ [field]: { [operator]: Number(value) } });
  };

  if (category === 'job') {
    pushEquality('employmentType', filters.employmentType);
    pushEquality('employmentCategory', filters.employmentCategory);
  }

  if (category === 'gig') {
    pushEquality('durationCategory', filters.durationCategory);
    pushEquality('budgetCurrency', filters.budgetCurrency);
    pushEquality('deliverySpeed', filters.deliverySpeed);
    if (filters.budgetMinAmount != null) {
      pushRange('budgetMaxAmount', Op.gte, filters.budgetMinAmount);
    }
    if (filters.budgetMaxAmount != null) {
      pushRange('budgetMinAmount', Op.lte, filters.budgetMaxAmount);
    }
  }

  if (category === 'project') {
    pushEquality('status', filters.status);
  }

  if (category === 'launchpad') {
    pushEquality('track', filters.track);
  }

  if (category === 'volunteering') {
    pushEquality('organization', filters.organization);
  }

  pushEquality('location', filters.location);
  pushEquality('geoCountry', filters.geoCountry);
  pushEquality('geoRegion', filters.geoRegion);
  pushEquality('geoCity', filters.geoCity);

  const updatedThreshold = computeUpdatedWithinDate(filters.updatedWithin);
  if (updatedThreshold) {
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    where[Op.and].push({ updatedAt: { [Op.gte]: updatedThreshold } });
  }
}

export function normalisePage(page) {
  const parsed = Number.parseInt(page ?? '1', 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function normalisePageSize(pageSize) {
  const parsed = Number.parseInt(pageSize ?? `${DEFAULT_PAGE_SIZE}`, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE);
}

export function normaliseLimit(limit) {
  const parsed = Number.parseInt(limit ?? `${DEFAULT_PAGE_SIZE}`, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export default {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CATEGORY_FACETS,
  CATEGORY_SORTS,
  TAXONOMY_ENABLED_CATEGORIES,
  parseFiltersInput,
  normaliseViewport,
  buildGeoBoundingBoxExpression,
  resolveSortExpressions,
  buildFilterExpressions,
  applyStructuredFilters,
  normalisePage,
  normalisePageSize,
  normaliseLimit,
  normaliseTaxonomyFilterTokens,
};
