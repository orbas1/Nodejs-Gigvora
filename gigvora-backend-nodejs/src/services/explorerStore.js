import { randomUUID } from 'node:crypto';
import { Op, literal } from 'sequelize';
import { ExplorerRecord } from '../models/index.js';
import { getExplorerCollections, inferExplorerCategoryFromCollection } from '../utils/explorerCollections.js';

const SUPPORTED_COLLECTIONS = getExplorerCollections();
const DIALECT = ExplorerRecord?.sequelize?.getDialect?.() ?? 'postgres';
const LIKE_OPERATOR = ['postgres', 'postgresql'].includes(DIALECT) ? Op.iLike : Op.like;
const JSON_CONTAINS_SUPPORTED = ['postgres', 'postgresql'].includes(DIALECT);

function assertCollection(collection) {
  if (!SUPPORTED_COLLECTIONS.includes(collection)) {
    const error = new Error(`Unsupported explorer collection: ${collection}`);
    error.status = 404;
    throw error;
  }
}

function coerceBoolean(value) {
  if (value === '' || value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!normalised) {
    return undefined;
  }
  if (['true', '1', 'yes', 'y'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalised)) {
    return false;
  }
  return undefined;
}

function normaliseArray(value) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((entry) => (entry == null ? null : `${entry}`.trim()))
          .filter((entry) => entry && entry.length),
      ),
    );
  }
  if (typeof value === 'string' && value.trim().length) {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((token) => token.trim())
          .filter((token) => token.length),
      ),
    );
  }
  return [];
}

function normaliseCurrencyArray(value) {
  return normaliseArray(value).map((entry) => entry.toUpperCase());
}

function resolveUpdatedAfter(updatedWithin) {
  if (!updatedWithin) {
    return null;
  }

  const map = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };

  const windowMs = map[`${updatedWithin}`.toLowerCase()];
  if (!windowMs) {
    return null;
  }

  return new Date(Date.now() - windowMs);
}

function buildDurationConditions(durationCategories) {
  if (!durationCategories?.length) {
    return [];
  }

  const conditions = [];
  const includeShortTerm = durationCategories.includes('short_term');
  const includeMediumTerm = durationCategories.includes('medium_term');
  const includeLongTerm = durationCategories.includes('long_term');

  if (includeShortTerm) {
    conditions.push({ duration: { [LIKE_OPERATOR]: '%day%' } });
    conditions.push({ duration: { [LIKE_OPERATOR]: '%week%' } });
  }
  if (includeMediumTerm) {
    conditions.push({ duration: { [LIKE_OPERATOR]: '%month%' } });
    conditions.push({ duration: { [LIKE_OPERATOR]: '%quarter%' } });
  }
  if (includeLongTerm) {
    conditions.push({ duration: { [LIKE_OPERATOR]: '%year%' } });
    conditions.push({ duration: { [LIKE_OPERATOR]: '%permanent%' } });
    conditions.push({ duration: { [LIKE_OPERATOR]: '%retainer%' } });
  }

  return conditions;
}

function buildWhere(collection, query, filters = {}) {
  const where = { collection };
  const andConditions = [];

  if (query && query.trim().length) {
    const pattern = `%${query.trim().replace(/\s+/g, '%')}%`;
    andConditions.push({
      [Op.or]: [
        { title: { [LIKE_OPERATOR]: pattern } },
        { summary: { [LIKE_OPERATOR]: pattern } },
        { description: { [LIKE_OPERATOR]: pattern } },
        { organization: { [LIKE_OPERATOR]: pattern } },
        { location: { [LIKE_OPERATOR]: pattern } },
      ],
    });
  }

  const statuses = normaliseArray(filters.statuses);
  if (statuses.length) {
    andConditions.push({ status: { [Op.in]: statuses } });
  }

  const employmentTypes = normaliseArray(filters.employmentTypes);
  if (employmentTypes.length) {
    andConditions.push({ employmentType: { [Op.in]: employmentTypes } });
  }

  const isRemote = coerceBoolean(filters.isRemote);
  if (isRemote !== undefined) {
    andConditions.push({ isRemote });
  }

  const locationFilters = [
    ...normaliseArray(filters.locations),
    ...normaliseArray(filters.countries),
    ...normaliseArray(filters.regions),
    ...normaliseArray(filters.cities),
  ];
  if (locationFilters.length) {
    andConditions.push({
      [Op.or]: locationFilters.map((value) => ({ location: { [LIKE_OPERATOR]: `%${value}%` } })),
    });
  }

  const skillFilters = normaliseArray(filters.skills);
  if (skillFilters.length) {
    if (JSON_CONTAINS_SUPPORTED) {
      andConditions.push({ skills: { [Op.contains]: skillFilters } });
    } else {
      andConditions.push({
        [Op.or]: skillFilters.map((value) => ({ skills: { [LIKE_OPERATOR]: `%${value}%` } })),
      });
    }
  }

  const tagFilters = normaliseArray(filters.tags);
  if (tagFilters.length) {
    if (JSON_CONTAINS_SUPPORTED) {
      andConditions.push({ tags: { [Op.contains]: tagFilters } });
    } else {
      andConditions.push({
        [Op.or]: tagFilters.map((value) => ({ tags: { [LIKE_OPERATOR]: `%${value}%` } })),
      });
    }
  }

  const organizationFilters = normaliseArray(filters.organizations);
  if (organizationFilters.length) {
    andConditions.push({ organization: { [Op.in]: organizationFilters } });
  }

  const trackFilters = normaliseArray(filters.tracks);
  if (trackFilters.length) {
    andConditions.push({ track: { [Op.in]: trackFilters } });
  }

  const currencyFilters = normaliseCurrencyArray(filters.budgetCurrencies);
  if (currencyFilters.length) {
    andConditions.push({ priceCurrency: { [Op.in]: currencyFilters } });
  }

  const employmentCategories = normaliseArray(filters.employmentCategories);
  if (employmentCategories.length) {
    andConditions.push({
      [Op.or]: [
        { employmentType: { [Op.in]: employmentCategories } },
        { category: { [Op.in]: employmentCategories } },
        { track: { [Op.in]: employmentCategories } },
      ],
    });
  }

  const durationCategories = buildDurationConditions(normaliseArray(filters.durationCategories));
  if (durationCategories.length) {
    andConditions.push({ [Op.or]: durationCategories });
  }

  const updatedAfter = resolveUpdatedAfter(filters.updatedWithin);
  if (updatedAfter) {
    andConditions.push({ updatedAt: { [Op.gte]: updatedAfter } });
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  return where;
}

function resolveOrder(sort) {
  switch (sort) {
    case 'newest':
      return [['createdAt', 'DESC']];
    case 'alphabetical':
      return [['title', 'ASC']];
    case 'budget':
      return [['priceAmount', 'DESC']];
    case 'price_low_high':
      return [['priceAmount', 'ASC']];
    case 'rating':
      return [['rating', 'DESC']];
    case 'availability':
      return [[literal(`CASE WHEN "ExplorerRecord"."status" = 'available' THEN 0 ELSE 1 END`), 'ASC'], ['updatedAt', 'DESC']];
    case 'status':
      return [['status', 'ASC']];
    default:
      return [['updatedAt', 'DESC']];
  }
}

function extractRecordAttributes(payload = {}) {
  const attributes = {};
  const assign = (key, value) => {
    attributes[key] = value;
  };

  if ('title' in payload) assign('title', payload.title);
  if ('summary' in payload) assign('summary', payload.summary);
  if ('description' in payload) assign('description', payload.description);
  if ('longDescription' in payload) assign('longDescription', payload.longDescription ?? null);
  if ('status' in payload) assign('status', payload.status);
  if ('organization' in payload) assign('organization', payload.organization ?? null);
  if ('location' in payload) assign('location', payload.location ?? null);
  if ('employmentType' in payload) assign('employmentType', payload.employmentType ?? null);
  if ('duration' in payload) assign('duration', payload.duration ?? null);
  if ('experienceLevel' in payload) assign('experienceLevel', payload.experienceLevel ?? null);
  if ('availability' in payload) assign('availability', payload.availability ?? null);
  if ('track' in payload) assign('track', payload.track ?? null);
  if ('isRemote' in payload) assign('isRemote', Boolean(payload.isRemote));
  if ('skills' in payload) assign('skills', Array.isArray(payload.skills) ? payload.skills : []);
  if ('tags' in payload) assign('tags', Array.isArray(payload.tags) ? payload.tags : []);
  if ('heroImage' in payload) assign('heroImage', payload.heroImage ?? null);
  if ('gallery' in payload) assign('gallery', Array.isArray(payload.gallery) ? payload.gallery : []);
  if ('videoUrl' in payload) assign('videoUrl', payload.videoUrl ?? null);
  if ('detailUrl' in payload) assign('detailUrl', payload.detailUrl ?? null);
  if ('applicationUrl' in payload) assign('applicationUrl', payload.applicationUrl ?? null);
  if ('rating' in payload) assign('rating', payload.rating == null ? null : Number(payload.rating));
  if ('reviewCount' in payload)
    assign('reviewCount', payload.reviewCount == null ? null : Number.parseInt(payload.reviewCount, 10));
  if ('metadata' in payload) assign('metadata', payload.metadata ?? null);

  if ('price' in payload) {
    const price = payload.price;
    if (price) {
      assign('priceAmount', price.amount == null ? null : Number(price.amount));
      assign('priceCurrency', price.currency ?? null);
      assign('priceUnit', price.unit ?? null);
    } else {
      assign('priceAmount', null);
      assign('priceCurrency', null);
      assign('priceUnit', null);
    }
  }

  if ('owner' in payload) {
    const owner = payload.owner;
    if (owner) {
      assign('ownerName', owner.name ?? null);
      assign('ownerRole', owner.role ?? null);
      assign('ownerAvatar', owner.avatar ?? null);
    } else {
      assign('ownerName', null);
      assign('ownerRole', null);
      assign('ownerAvatar', null);
    }
  }

  if ('geo' in payload) {
    const geo = payload.geo;
    if (geo) {
      assign('geoLat', geo.lat == null ? null : Number(geo.lat));
      assign('geoLng', geo.lng == null ? null : Number(geo.lng));
    } else {
      assign('geoLat', null);
      assign('geoLng', null);
    }
  }

  return attributes;
}

function inferCategoryFromCollection(collection) {
  return inferExplorerCategoryFromCollection(collection);
}

export async function listRecords(collection, options = {}) {
  assertCollection(collection);
  const {
    query = '',
    filters = {},
    sort = 'default',
    page = 1,
    pageSize = 20,
  } = options;

  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.max(Math.min(Number.parseInt(pageSize, 10) || 20, 100), 1);
  const where = buildWhere(collection, query, filters);
  const order = resolveOrder(sort);
  const offset = (safePage - 1) * safePageSize;

  const { rows, count } = await ExplorerRecord.findAndCountAll({
    where,
    order,
    limit: safePageSize,
    offset,
  });

  const facetRows = await ExplorerRecord.findAll({
    where,
    attributes: [
      'id',
      'status',
      'employmentType',
      'duration',
      'location',
      'organization',
      'track',
      'skills',
      'tags',
      'updatedAt',
    ],
    order: [['updatedAt', 'DESC']],
    limit: 5000,
  });

  return {
    items: rows.map((row) => row.toPublicObject()),
    total: count,
    facetSource: facetRows.map((row) => row.toPublicObject()),
  };
}

export async function getRecord(collection, id) {
  assertCollection(collection);
  if (!id) {
    return null;
  }
  const record = await ExplorerRecord.findOne({ where: { id, collection } });
  return record ? record.toPublicObject() : null;
}

export async function createRecord(collection, payload = {}) {
  assertCollection(collection);
  const attributes = extractRecordAttributes(payload);
  const record = await ExplorerRecord.create({
    id: payload.id || randomUUID(),
    collection,
    category: payload.category || inferCategoryFromCollection(collection),
    ...attributes,
  });
  return record.toPublicObject();
}

export async function updateRecord(collection, id, payload = {}) {
  assertCollection(collection);
  if (!id) {
    return null;
  }
  const record = await ExplorerRecord.findOne({ where: { id, collection } });
  if (!record) {
    return null;
  }
  const attributes = extractRecordAttributes(payload);
  record.set(attributes);
  await record.save();
  return record.toPublicObject();
}

export async function deleteRecord(collection, id) {
  assertCollection(collection);
  if (!id) {
    return false;
  }
  const deleted = await ExplorerRecord.destroy({ where: { id, collection } });
  return deleted > 0;
}

export default {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
};
