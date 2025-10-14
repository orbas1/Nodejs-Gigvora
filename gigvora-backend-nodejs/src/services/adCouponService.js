import { Op } from 'sequelize';
import {
  AdCoupon,
  AdPlacement,
  AdPlacementCoupon,
  AdCreative,
  sequelize,
} from '../models/index.js';
import { AD_COUPON_STATUSES, AD_COUPON_DISCOUNT_TYPES } from '../models/constants/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normaliseSurfaceList(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => `${value}`.split(',').map((part) => part.trim()))
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return `${input}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normaliseCode(value, { required = true } = {}) {
  if (value == null || `${value}`.trim().length === 0) {
    if (required) {
      throw new ValidationError('Coupon code is required.');
    }
    return undefined;
  }
  const sanitized = `${value}`
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 60);
  if (!sanitized) {
    throw new ValidationError('Coupon code must include alphanumeric characters.');
  }
  return sanitized;
}

function normaliseName(value, { required = true } = {}) {
  if (value == null || `${value}`.trim().length === 0) {
    if (required) {
      throw new ValidationError('Coupon name is required.');
    }
    return undefined;
  }
  return `${value}`.trim().slice(0, 160);
}

function parseDate(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date value.');
  }
  return date;
}

function normaliseDiscountType(value, fallback) {
  const resolved = `${value ?? fallback ?? 'percentage'}`.trim().toLowerCase();
  if (!AD_COUPON_DISCOUNT_TYPES.includes(resolved)) {
    throw new ValidationError(
      `discountType must be one of: ${AD_COUPON_DISCOUNT_TYPES.join(', ')}.`,
    );
  }
  return resolved;
}

function normaliseDiscountValue(type, value, { required = true } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError('discountValue is required.');
    }
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('discountValue must be numeric.');
  }
  if (type === 'percentage') {
    if (numeric <= 0 || numeric > 100) {
      throw new ValidationError('Percentage discounts must be between 0 and 100.');
    }
    return Number(numeric.toFixed(2));
  }
  if (numeric <= 0) {
    throw new ValidationError('Fixed amount discounts must be greater than zero.');
  }
  return Number(numeric.toFixed(2));
}

function normaliseStatus(value, fallback) {
  if (value == null || value === '') {
    return fallback ?? 'draft';
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!AD_COUPON_STATUSES.includes(normalized)) {
    throw new ValidationError(`Unsupported coupon status: ${value}`);
  }
  return normalized;
}

function normaliseInteger(value, { min = 0, allowNull = true } = {}) {
  if (value == null || value === '') {
    return allowNull ? null : min;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value expected.');
  }
  const rounded = Math.round(numeric);
  if (rounded < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}.`);
  }
  return rounded;
}

function normaliseSurfaceTargets(input) {
  if (input == null) {
    return [];
  }
  const list = Array.isArray(input) ? input : `${input}`.split(',');
  return list
    .map((value) => `${value}`.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalisePlacementLinks(placements) {
  if (placements == null) {
    return undefined;
  }
  if (!Array.isArray(placements)) {
    throw new ValidationError('placements must be provided as an array.');
  }
  const normalized = placements
    .map((entry, index) => {
      if (entry == null) {
        return null;
      }
      const placementId = Number(entry.placementId ?? entry.id ?? entry);
      if (!Number.isInteger(placementId) || placementId <= 0) {
        throw new ValidationError('Each placement must include a valid placementId.');
      }
      const priority =
        entry.priority == null ? index : normaliseInteger(entry.priority, { min: 0, allowNull: false });
      const metadata = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : null;
      return { placementId, priority, metadata };
    })
    .filter(Boolean);
  const seen = new Set();
  normalized.forEach((item) => {
    if (seen.has(item.placementId)) {
      throw new ValidationError('Duplicate placement assignments are not allowed.');
    }
    seen.add(item.placementId);
  });
  return normalized.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.placementId - b.placementId;
  });
}

function serializePlacement(placement, now) {
  const plain = placement.get ? placement.get({ plain: true }) : placement;
  const link = plain.AdPlacementCoupon ?? plain.couponLink ?? {};
  const creativePlain = plain.creative
    ? plain.creative.get
      ? plain.creative.get({ plain: true })
      : plain.creative
    : null;
  const startTs = plain.startAt ? new Date(plain.startAt).getTime() : null;
  const endTs = plain.endAt ? new Date(plain.endAt).getTime() : null;
  const nowTs = now.getTime();
  const isActive =
    (startTs == null || startTs <= nowTs) && (endTs == null || endTs >= nowTs) && plain.status === 'active';

  return {
    id: plain.id,
    surface: plain.surface,
    position: plain.position,
    status: plain.status,
    priority: Number(link.priority ?? 0),
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    isActive,
    creative: creativePlain
      ? {
          id: creativePlain.id,
          name: creativePlain.name,
          headline: creativePlain.headline ?? null,
          subheadline: creativePlain.subheadline ?? null,
          callToAction: creativePlain.callToAction ?? null,
        }
      : null,
  };
}

function buildCouponInclude(includePlacements) {
  if (!includePlacements) {
    return [];
  }
  return [
    {
      model: AdPlacement,
      as: 'placements',
      include: [{ model: AdCreative, as: 'creative' }],
      through: { attributes: ['priority'] },
    },
  ];
}

function serializeCouponInstance(instance, { includePlacements = false, now = new Date() } = {}) {
  const couponPayload = instance.toPublicObject({ now });
  if (includePlacements) {
    const placements = Array.isArray(instance.placements) ? instance.placements : [];
    couponPayload.placements = placements
      .map((placement) => serializePlacement(placement, now))
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.id - b.id;
      });
  }
  return couponPayload;
}

function filterBySurfaces(coupons, surfaces) {
  if (!surfaces.length) {
    return coupons;
  }
  const surfaceSet = new Set(surfaces);
  return coupons.filter((coupon) => {
    const targets = Array.isArray(coupon.surfaceTargets) ? coupon.surfaceTargets : [];
    if (targets.some((surface) => surfaceSet.has(surface))) {
      return true;
    }
    if (Array.isArray(coupon.placements)) {
      return coupon.placements.some((placement) => surfaceSet.has(placement.surface));
    }
    return false;
  });
}

function filterByLifecycle(coupons, lifecycleStates) {
  if (!lifecycleStates.size) {
    return coupons;
  }
  return coupons.filter((coupon) => lifecycleStates.has(coupon.lifecycleStatus));
}

function prepareLifecycleFilters(statuses) {
  const lifecycleStates = new Set();
  statuses.forEach((status) => {
    if (AD_COUPON_STATUSES.includes(status)) {
      lifecycleStates.add(status);
    }
  });
  return lifecycleStates;
}

function sanitizeCouponPayload(payload = {}, { partial = false, existing } = {}) {
  const base = existing ? existing.get({ plain: true }) : {};
  const fields = {};

  if (!partial || payload.code !== undefined) {
    const code = normaliseCode(payload.code ?? base.code, { required: !partial });
    if (code !== undefined) {
      fields.code = code;
    }
  }

  if (!partial || payload.name !== undefined) {
    const name = normaliseName(payload.name ?? base.name, { required: !partial });
    if (name !== undefined) {
      fields.name = name;
    }
  }

  if (!partial || payload.description !== undefined) {
    const description = payload.description == null ? null : `${payload.description}`.trim();
    fields.description = description?.length ? description : null;
  }

  if (!partial || payload.discountType !== undefined || payload.discountValue !== undefined) {
    const resolvedType = normaliseDiscountType(payload.discountType ?? base.discountType, base.discountType);
    const resolvedValue = normaliseDiscountValue(resolvedType, payload.discountValue ?? base.discountValue, {
      required: !partial && base.discountValue == null,
    });
    if (resolvedType) {
      fields.discountType = resolvedType;
    }
    if (resolvedValue !== undefined) {
      fields.discountValue = resolvedValue;
    }
  }

  if (!partial || payload.status !== undefined) {
    const status = normaliseStatus(payload.status ?? base.status, base.status);
    if (status) {
      fields.status = status;
    }
  }

  let startAt = base.startAt ? new Date(base.startAt) : null;
  let endAt = base.endAt ? new Date(base.endAt) : null;

  if (!partial || payload.startAt !== undefined) {
    startAt = parseDate(payload.startAt ?? base.startAt);
    fields.startAt = startAt;
  }

  if (!partial || payload.endAt !== undefined) {
    endAt = parseDate(payload.endAt ?? base.endAt);
    fields.endAt = endAt;
  }

  if (fields.startAt && fields.endAt && fields.startAt.getTime() > fields.endAt.getTime()) {
    throw new ValidationError('endAt must be after startAt.');
  }

  if (!partial || payload.maxRedemptions !== undefined) {
    fields.maxRedemptions = normaliseInteger(payload.maxRedemptions ?? base.maxRedemptions, {
      allowNull: true,
      min: 1,
    });
  }

  if (!partial || payload.perUserLimit !== undefined) {
    fields.perUserLimit = normaliseInteger(payload.perUserLimit ?? base.perUserLimit, {
      allowNull: true,
      min: 1,
    });
  }

  if (!partial || payload.surfaceTargets !== undefined) {
    fields.surfaceTargets = normaliseSurfaceTargets(payload.surfaceTargets ?? base.surfaceTargets);
  }

  if (!partial || payload.metadata !== undefined) {
    fields.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  }

  if (!partial || payload.termsUrl !== undefined) {
    fields.termsUrl = payload.termsUrl ? `${payload.termsUrl}`.trim() : null;
  }

  const placementLinks = normalisePlacementLinks(payload.placements ?? payload.placementLinks);

  return { fields, placementLinks };
}

async function syncCouponPlacements(couponId, placementLinks = [], { transaction } = {}) {
  if (placementLinks === undefined) {
    return;
  }
  const placementIds = placementLinks.map((link) => link.placementId);
  if (!placementIds.length) {
    await AdPlacementCoupon.destroy({ where: { couponId }, transaction });
    return;
  }
  const placements = await AdPlacement.findAll({
    where: { id: { [Op.in]: placementIds } },
    transaction,
  });
  if (placements.length !== placementIds.length) {
    throw new NotFoundError('One or more placement identifiers are invalid.');
  }

  await AdPlacementCoupon.destroy({
    where: {
      couponId,
      placementId: { [Op.notIn]: placementIds },
    },
    transaction,
  });

  await Promise.all(
    placementLinks.map((link, index) =>
      AdPlacementCoupon.upsert(
        {
          couponId,
          placementId: link.placementId,
          priority: link.priority ?? index,
          metadata: link.metadata ?? null,
        },
        { transaction },
      ),
    ),
  );
}

export async function listCoupons({
  status,
  surfaces,
  includePlacements = true,
  now = new Date(),
} = {}) {
  const where = {};
  const statusList = Array.isArray(status)
    ? status
    : status
    ? `${status}`
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const lifecycleFilter = prepareLifecycleFilters(statusList);
  const statusFilters = statusList.filter((value) => AD_COUPON_STATUSES.includes(value));
  if (statusFilters.length) {
    where.status = { [Op.in]: statusFilters };
  }

  const include = buildCouponInclude(includePlacements);

  const coupons = await AdCoupon.findAll({
    where,
    include,
    order: [['updatedAt', 'DESC']],
  });

  let serialised = coupons.map((coupon) => serializeCouponInstance(coupon, { includePlacements, now }));
  if (lifecycleFilter.size) {
    serialised = filterByLifecycle(serialised, lifecycleFilter);
  }
  const surfaceFilters = normaliseSurfaceList(surfaces);
  if (surfaceFilters.length) {
    serialised = filterBySurfaces(serialised, surfaceFilters);
  }
  return serialised;
}

export async function createCoupon(payload = {}, { actorId } = {}) {
  const { fields, placementLinks } = sanitizeCouponPayload(payload, { partial: false });
  return sequelize.transaction(async (transaction) => {
    const coupon = await AdCoupon.create(
      {
        ...fields,
        createdById: actorId ?? null,
        updatedById: actorId ?? null,
      },
      { transaction },
    );

    await syncCouponPlacements(coupon.id, placementLinks, { transaction });

    await coupon.reload({ include: buildCouponInclude(true), transaction });
    return serializeCouponInstance(coupon, { includePlacements: true });
  });
}

export async function updateCoupon(couponId, payload = {}, { actorId } = {}) {
  const id = Number(couponId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('couponId must be a positive integer.');
  }

  const existing = await AdCoupon.findByPk(id);
  if (!existing) {
    throw new NotFoundError('Coupon not found.');
  }

  const { fields, placementLinks } = sanitizeCouponPayload(payload, { partial: true, existing });

  return sequelize.transaction(async (transaction) => {
    if (Object.keys(fields).length) {
      await existing.update({ ...fields, updatedById: actorId ?? existing.updatedById }, { transaction });
    }
    await syncCouponPlacements(existing.id, placementLinks, { transaction });
    await existing.reload({ include: buildCouponInclude(true), transaction });
    return serializeCouponInstance(existing, { includePlacements: true });
  });
}

export async function getCoupon(couponId, { includePlacements = true, now = new Date() } = {}) {
  const id = Number(couponId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('couponId must be a positive integer.');
  }
  const coupon = await AdCoupon.findByPk(id, { include: buildCouponInclude(includePlacements) });
  if (!coupon) {
    throw new NotFoundError('Coupon not found.');
  }
  return serializeCouponInstance(coupon, { includePlacements, now });
}

export default {
  listCoupons,
  createCoupon,
  updateCoupon,
  getCoupon,
};
