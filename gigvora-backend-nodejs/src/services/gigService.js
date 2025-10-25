import { Op } from 'sequelize';
import {
  sequelize,
  Gig,
  GigPackage,
  GigAddon,
  GigAvailabilitySlot,
  GigCustomRequest,
  GIG_STATUSES,
  GIG_VISIBILITY_OPTIONS,
} from '../models/index.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const PACKAGE_TIERS = ['basic', 'standard', 'premium'];
const PACKAGE_LABELS = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

function slugify(value) {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function ensureUniqueSlug(baseSlug, { excludeGigId, transaction } = {}) {
  if (!baseSlug) {
    return null;
  }
  const sanitized = slugify(baseSlug);
  if (!sanitized) {
    return null;
  }

  let candidate = sanitized;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Gig.findOne({
      where: excludeGigId
        ? { slug: candidate, id: { [Op.ne]: excludeGigId } }
        : { slug: candidate },
      transaction,
    });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${sanitized}-${suffix}`;
  }
}

function normalizeHexColor(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    throw new ValidationError('heroAccent must be a valid hex color (e.g. #3366FF).');
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function normalizeStatus(status) {
  if (!status) return 'draft';
  const normalized = status.toString().toLowerCase();
  if (!GIG_STATUSES.includes(normalized)) {
    throw new ValidationError(`status must be one of: ${GIG_STATUSES.join(', ')}.`);
  }
  return normalized;
}

function normalizeVisibility(value) {
  if (!value) return 'private';
  const normalized = value.toString().toLowerCase();
  if (!GIG_VISIBILITY_OPTIONS.includes(normalized)) {
    throw new ValidationError(`visibility must be one of: ${GIG_VISIBILITY_OPTIONS.join(', ')}.`);
  }
  return normalized;
}

function normalizeInteger(value, { min = null, max = null, fieldName }) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a number.`);
  }
  if (min != null && parsed < min) {
    throw new ValidationError(`${fieldName} must be greater than or equal to ${min}.`);
  }
  if (max != null && parsed > max) {
    throw new ValidationError(`${fieldName} must be less than or equal to ${max}.`);
  }
  return parsed;
}

function normalizeCurrency(value, fallback = 'USD') {
  if (!value) {
    return fallback;
  }
  const normalized = value.toString().trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new ValidationError('priceCurrency must be a three-letter ISO currency code.');
  }
  return normalized;
}

function normalizePrice(value, { fieldName }) {
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be greater than zero.`);
  }
  return Number(numeric.toFixed(2));
}

function sanitizeHighlights(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .slice(0, 12);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n\r]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 12);
  }
  throw new ValidationError('highlights must be provided as an array or newline separated string.');
}

function sanitizeDeliverables(value, { fieldName }) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n\r]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }
  throw new ValidationError(`${fieldName} must be provided as an array or newline separated string.`);
}

function resolvePackageTier(input, index) {
  if (input == null || input === '') {
    if (PACKAGE_TIERS[index]) {
      return PACKAGE_TIERS[index];
    }
    throw new ValidationError('Each package must specify a tier.');
  }

  const candidate = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  if (PACKAGE_TIERS.includes(candidate)) {
    return candidate;
  }

  if (PACKAGE_TIERS[index]) {
    return PACKAGE_TIERS[index];
  }

  throw new ValidationError(
    `package tier must be one of ${PACKAGE_TIERS.join(', ')}. Received "${input}".`,
  );
}

function sanitizeRequirementList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n\r]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }
  throw new ValidationError('requirements must be provided as an array or newline separated string.');
}

function normaliseOptionalDate(value, { fieldName }) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date.toISOString().split('T')[0];
}

function normalizeCustomRequestPayload(payload = {}, { gig, actorId }) {
  const requesterId = normalizeInteger(payload.requesterId ?? actorId, {
    min: 1,
    fieldName: 'requesterId',
  });
  if (!requesterId) {
    throw new ValidationError('requesterId is required for custom requests.');
  }

  const title = payload.title?.toString().trim();
  if (!title || title.length < 4) {
    throw new ValidationError('title must be at least four characters long.');
  }

  const summary = payload.summary?.toString().trim() || null;
  const packageTierRaw = payload.preferredPackageTier ?? payload.packageTier ?? payload.packageKey;
  const packageTier = packageTierRaw ? resolvePackageTier(packageTierRaw, 0) : null;

  if (packageTier && !gig.packages?.some((pkg) => pkg.packageKey === packageTier)) {
    throw new ValidationError('Selected package tier is not offered by this gig.');
  }

  let budgetAmount = null;
  let budgetCurrency = null;
  if (payload.budgetAmount != null && payload.budgetAmount !== '') {
    budgetAmount = normalizePrice(payload.budgetAmount, { fieldName: 'budgetAmount' });
    budgetCurrency = normalizeCurrency(payload.budgetCurrency ?? gig.budgetCurrency ?? 'USD');
  }

  const deliveryDays = payload.deliveryDays != null && payload.deliveryDays !== ''
    ? normalizeInteger(payload.deliveryDays, {
        min: 1,
        max: 365,
        fieldName: 'deliveryDays',
      })
    : null;

  const requirements = sanitizeRequirementList(payload.requirements ?? payload.requirementNotes);
  const preferredStartDate = normaliseOptionalDate(payload.preferredStartDate, {
    fieldName: 'preferredStartDate',
  });
  const communicationChannel = payload.communicationChannel
    ? payload.communicationChannel.toString().trim().slice(0, 120) || null
    : 'gigvora_chat';

  const metadata = payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {};
  metadata.source = metadata.source ?? 'marketplace';

  return {
    requesterId,
    title,
    summary,
    packageTier,
    budgetAmount,
    budgetCurrency,
    deliveryDays,
    requirements,
    preferredStartDate,
    communicationChannel,
    metadata,
  };
}

function normalizePackage(packageInput, index) {
  const providedTier = packageInput?.tier ?? packageInput?.packageKey ?? packageInput?.key ?? null;
  const tier = resolvePackageTier(providedTier, index);
  const name = packageInput?.name?.trim() || PACKAGE_LABELS[tier] || PACKAGE_LABELS.basic;
  const priceAmount = normalizePrice(packageInput?.priceAmount, {
    fieldName: `priceAmount for the ${name} package`,
  });
  const priceCurrency = normalizeCurrency(packageInput?.priceCurrency);
  const deliveryDays = normalizeInteger(packageInput?.deliveryDays, {
    min: 0,
    max: 120,
    fieldName: `deliveryDays for package ${name}`,
  });
  const revisionLimit = normalizeInteger(packageInput?.revisionLimit, {
    min: 0,
    max: 20,
    fieldName: `revisionLimit for package ${name}`,
  });
  const recommendedFor = packageInput?.recommendedFor?.trim() || null;
  const description = packageInput?.description?.trim() || null;
  const highlights = sanitizeHighlights(packageInput?.highlights);
  const deliverables = sanitizeDeliverables(packageInput?.deliverables, {
    fieldName: `deliverables for package ${name}`,
  });
  if (!deliverables.length) {
    throw new ValidationError(`At least one deliverable is required for the ${name} package.`);
  }

  return {
    packageKey: tier,
    tier,
    name,
    description,
    priceAmount,
    priceCurrency,
    deliveryDays,
    revisionLimit,
    highlights,
    deliverables,
    recommendedFor,
    isPopular: packageInput?.isPopular != null ? Boolean(packageInput.isPopular) : tier === 'standard',
    position: PACKAGE_TIERS.indexOf(tier) === -1 ? index : PACKAGE_TIERS.indexOf(tier),
  };
}

function normalizeAddOn(input, index) {
  const name = input?.name?.trim();
  if (!name) {
    throw new ValidationError(`Add-on #${index + 1} is missing a name.`);
  }
  const key = input?.key?.trim() || slugify(name) || `addon-${index + 1}`;
  const priceAmount = normalizePrice(input?.priceAmount, { fieldName: `priceAmount for add-on ${name}` });
  const priceCurrency = normalizeCurrency(input?.priceCurrency);
  const description = input?.description?.trim() || null;
  const deliveryDays =
    input?.deliveryDays == null || input.deliveryDays === ''
      ? null
      : normalizeInteger(input.deliveryDays, {
          min: 0,
          max: 120,
          fieldName: `deliveryDays for add-on ${name}`,
        });
  const metadata =
    input?.metadata && typeof input.metadata === 'object'
      ? { ...input.metadata }
      : null;

  return {
    addOnKey: key,
    name,
    description,
    priceAmount,
    priceCurrency,
    deliveryDays,
    isActive: input?.isActive !== false,
    position: index,
    metadata,
  };
}

function normalizeTime(value, fieldName) {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required for availability slots.`);
  }
  const trimmed = value.trim();
  if (!TIME_PATTERN.test(trimmed)) {
    throw new ValidationError(`${fieldName} must be in HH:MM 24h format.`);
  }
  return trimmed.length === 5 ? trimmed : trimmed.padStart(5, '0');
}

function normalizeDate(value, fieldName) {
  if (!value) {
    throw new ValidationError(`${fieldName} is required for availability slots.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date.toISOString().split('T')[0];
}

function normalizeAvailability(availabilityInput = {}) {
  const timezone = availabilityInput?.timezone?.trim() || 'UTC';
  const leadTimeDays = normalizeInteger(availabilityInput?.leadTimeDays ?? 2, {
    min: 0,
    max: 60,
    fieldName: 'availabilityLeadTimeDays',
  }) ?? 2;
  const slotsInput = Array.isArray(availabilityInput?.slots) ? availabilityInput.slots : [];

  const slots = slotsInput.map((slot, index) => {
    const slotDate = normalizeDate(slot?.date ?? slot?.slotDate, `date for availability slot ${index + 1}`);
    const startTime = normalizeTime(slot?.startTime, `startTime for availability slot ${index + 1}`);
    const endTime = normalizeTime(slot?.endTime, `endTime for availability slot ${index + 1}`);
    if (startTime >= endTime) {
      throw new ValidationError('Availability slot endTime must be after startTime.');
    }
    const capacity = normalizeInteger(slot?.capacity ?? 1, {
      min: 1,
      max: 20,
      fieldName: `capacity for availability slot ${index + 1}`,
    }) ?? 1;
    const notes = slot?.notes?.trim() || null;
    const isBookable = slot?.isBookable !== false;

    return {
      slotDate,
      startTime,
      endTime,
      capacity,
      isBookable,
      notes,
    };
  });

  return {
    timezone,
    leadTimeDays,
    slots,
  };
}

function normalizeBannerSettings(input = {}) {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const accentColor = input.accentColor ? normalizeHexColor(input.accentColor, '#4f46e5') : '#4f46e5';
  return {
    headline: input.headline?.trim() || null,
    subheadline: input.subheadline?.trim() || null,
    callToAction: input.callToAction?.trim() || null,
    badge: input.badge?.trim() || null,
    accentColor,
    backgroundStyle: input.backgroundStyle?.trim() || 'aurora',
    testimonial: input.testimonial?.trim() || null,
    testimonialAuthor: input.testimonialAuthor?.trim() || null,
    waitlistEnabled: Boolean(input.waitlistEnabled),
  };
}

function normalizeGigPayload(payload = {}, { actorId } = {}) {
  const ownerId = normalizeInteger(payload.ownerId ?? actorId, { fieldName: 'ownerId', min: 1 });
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create or update a gig.');
  }

  const title = payload.title?.trim();
  const description = payload.description?.trim();
  if (!title) {
    throw new ValidationError('title is required.');
  }
  if (!description) {
    throw new ValidationError('description is required.');
  }

  const status = normalizeStatus(payload.status ?? 'draft');
  const visibility = normalizeVisibility(payload.visibility ?? 'private');
  const targetMetric = normalizeInteger(payload.targetMetric, { min: 0, max: 500, fieldName: 'targetMetric' });
  const packagesInput = Array.isArray(payload.packages) ? payload.packages : [];
  if (!packagesInput.length) {
    throw new ValidationError('At least one pricing package is required.');
  }

  const uniquePackageKeys = new Set();
  const packages = packagesInput.map((pkg, index) => {
    const normalized = normalizePackage(pkg, index);
    if (uniquePackageKeys.has(normalized.packageKey)) {
      throw new ValidationError(`Duplicate package key detected: ${normalized.packageKey}`);
    }
    uniquePackageKeys.add(normalized.packageKey);
    return normalized;
  });

  const missingTiers = PACKAGE_TIERS.filter((tier) => !uniquePackageKeys.has(tier));
  if (missingTiers.length) {
    throw new ValidationError(
      `Packages must include the ${PACKAGE_TIERS.map((tier) => PACKAGE_LABELS[tier]).join(', ')} tiers. Missing: ${missingTiers
        .map((tier) => PACKAGE_LABELS[tier])
        .join(', ')}.`,
    );
  }

  packages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const addOnsInput = Array.isArray(payload.addOns) ? payload.addOns : [];
  const uniqueAddOnKeys = new Set();
  const addOns = addOnsInput.map((item, index) => {
    const normalized = normalizeAddOn(item, index);
    if (uniqueAddOnKeys.has(normalized.addOnKey)) {
      throw new ValidationError(`Duplicate add-on key detected: ${normalized.addOnKey}`);
    }
    uniqueAddOnKeys.add(normalized.addOnKey);
    return normalized;
  });

  const availability = normalizeAvailability(payload.availability);
  const bannerSettings = normalizeBannerSettings(payload.banner ?? payload.bannerSettings);
  const heroAccent = payload.heroAccent ? normalizeHexColor(payload.heroAccent) : null;

  return {
    gig: {
      ownerId,
      slug: payload.slug?.trim() || null,
      title,
      tagline: payload.tagline?.trim() || null,
      description,
      category: payload.category?.trim() || null,
      niche: payload.niche?.trim() || null,
      deliveryModel: payload.deliveryModel?.trim() || null,
      outcomePromise: payload.outcomePromise?.trim() || null,
      budget: payload.budget?.trim() || null,
      duration: payload.duration?.trim() || null,
      location: payload.location?.trim() || null,
      geoLocation: payload.geoLocation ?? null,
      heroAccent,
      targetMetric,
      status,
      visibility,
      bannerSettings,
      availabilityTimezone: availability.timezone,
      availabilityLeadTimeDays: availability.leadTimeDays,
    },
    packages,
    addOns,
    availability,
  };
}

function buildGigIncludeOptions() {
  return [
    { model: GigPackage, as: 'packages', separate: true, order: [['position', 'ASC']] },
    { model: GigAddon, as: 'addOns', separate: true, order: [['position', 'ASC']] },
    {
      model: GigAvailabilitySlot,
      as: 'availabilitySlots',
      separate: true,
      order: [
        ['slotDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
    },
  ];
}

export async function getGigDetail(gigId, { includeAssociations = true } = {}) {
  const id = normalizeInteger(gigId, { fieldName: 'gigId', min: 1 });
  if (!id) {
    throw new ValidationError('gigId must be a positive integer.');
  }
  const gig = await Gig.findByPk(id, {
    include: includeAssociations ? buildGigIncludeOptions() : undefined,
  });
  if (!gig) {
    throw new NotFoundError('Gig could not be found.');
  }
  return gig.toPublicObject();
}

async function ensureGigOwnership(gigId, ownerId) {
  const gig = await Gig.findByPk(gigId);
  if (!gig) {
    throw new NotFoundError('Gig could not be found.');
  }
  if (gig.ownerId && gig.ownerId !== ownerId) {
    throw new AuthorizationError('You do not have permission to modify this gig.');
  }
  return gig;
}

export async function listFreelancerGigs(ownerId, { limit = 10 } = {}) {
  const freelancerId = normalizeInteger(ownerId, { fieldName: 'freelancerId', min: 1 });
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  const gigs = await Gig.findAll({
    where: { ownerId: freelancerId },
    order: [
      ['status', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    limit,
    include: buildGigIncludeOptions(),
  });
  return gigs.map((gig) => gig.toPublicObject());
}

export async function createGigBlueprint(payload, { actorId } = {}) {
  const { gig: gigData, packages, addOns, availability } = normalizeGigPayload(payload, { actorId });

  return sequelize.transaction(async (transaction) => {
    const resolvedSlug = await ensureUniqueSlug(gigData.slug ?? gigData.title, { transaction });
    const gig = await Gig.create(
      {
        ...gigData,
        slug: resolvedSlug,
        ownerId: gigData.ownerId,
      },
      { transaction },
    );

    if (packages.length) {
      await GigPackage.bulkCreate(
        packages.map((pkg) => ({ ...pkg, gigId: gig.id })),
        { transaction },
      );
    }

    if (addOns.length) {
      await GigAddon.bulkCreate(
        addOns.map((addon) => ({ ...addon, gigId: gig.id })),
        { transaction },
      );
    }

    if (availability.slots.length) {
      await GigAvailabilitySlot.bulkCreate(
        availability.slots.map((slot) => ({ ...slot, gigId: gig.id })),
        { transaction },
      );
    }

    await gig.reload({ include: buildGigIncludeOptions(), transaction });
    return gig.toPublicObject();
  });
}

export async function updateGigBlueprint(gigId, payload, { actorId } = {}) {
  const id = normalizeInteger(gigId, { fieldName: 'gigId', min: 1 });
  const { gig: gigData, packages, addOns, availability } = normalizeGigPayload(payload, { actorId });

  return sequelize.transaction(async (transaction) => {
    const gig = await ensureGigOwnership(id, gigData.ownerId);

    if (gigData.slug) {
      gigData.slug = await ensureUniqueSlug(gigData.slug, { excludeGigId: gig.id, transaction });
    }

    await gig.update(
      {
        ...gigData,
        slug: gigData.slug ?? gig.slug,
      },
      { transaction },
    );

    await GigPackage.destroy({ where: { gigId: gig.id }, transaction });
    if (packages.length) {
      await GigPackage.bulkCreate(
        packages.map((pkg) => ({ ...pkg, gigId: gig.id })),
        { transaction },
      );
    }

    await GigAddon.destroy({ where: { gigId: gig.id }, transaction });
    if (addOns.length) {
      await GigAddon.bulkCreate(
        addOns.map((addon) => ({ ...addon, gigId: gig.id })),
        { transaction },
      );
    }

    await GigAvailabilitySlot.destroy({ where: { gigId: gig.id }, transaction });
    if (availability.slots.length) {
      await GigAvailabilitySlot.bulkCreate(
        availability.slots.map((slot) => ({ ...slot, gigId: gig.id })),
        { transaction },
      );
    }

    await gig.reload({ include: buildGigIncludeOptions(), transaction });
    return gig.toPublicObject();
  });
}

export async function publishGig(gigId, { actorId, visibility } = {}) {
  const id = normalizeInteger(gigId, { fieldName: 'gigId', min: 1 });
  const gig = await ensureGigOwnership(id, normalizeInteger(actorId, { fieldName: 'actorId', min: 1 }));

  const now = new Date();
  await gig.update(
    {
      status: 'published',
      visibility: visibility ? normalizeVisibility(visibility) : gig.visibility ?? 'public',
      publishedAt: gig.publishedAt ?? now,
    },
  );

  await gig.reload({ include: buildGigIncludeOptions() });
  return gig.toPublicObject();
}

export async function submitCustomGigRequest(gigId, payload, { actorId } = {}) {
  const id = normalizeInteger(gigId, { fieldName: 'gigId', min: 1 });
  if (!id) {
    throw new ValidationError('gigId must be a positive integer.');
  }

  const authenticatedId = normalizeInteger(actorId ?? payload?.requesterId, {
    fieldName: 'actorId',
    min: 1,
  });
  if (!authenticatedId) {
    throw new AuthorizationError('You must be signed in to submit a custom request.');
  }

  if (payload?.requesterId) {
    const requestedId = normalizeInteger(payload.requesterId, { fieldName: 'requesterId', min: 1 });
    if (requestedId !== authenticatedId) {
      throw new AuthorizationError('requesterId does not match the authenticated user.');
    }
  }

  const gig = await Gig.findByPk(id, {
    include: [{ model: GigPackage, as: 'packages', attributes: ['packageKey', 'tier', 'name'] }],
  });
  if (!gig) {
    throw new NotFoundError('Gig could not be found.');
  }
  if (!gig.customRequestEnabled) {
    throw new ValidationError('This gig is not currently accepting custom requests.');
  }

  const normalized = normalizeCustomRequestPayload({ ...payload, requesterId: authenticatedId }, {
    gig,
    actorId: authenticatedId,
  });

  return sequelize.transaction(async (transaction) => {
    const request = await GigCustomRequest.create(
      {
        gigId: gig.id,
        requesterId: normalized.requesterId,
        packageTier: normalized.packageTier,
        title: normalized.title,
        summary: normalized.summary,
        requirements: normalized.requirements,
        budgetAmount: normalized.budgetAmount,
        budgetCurrency: normalized.budgetCurrency,
        deliveryDays: normalized.deliveryDays,
        preferredStartDate: normalized.preferredStartDate,
        communicationChannel: normalized.communicationChannel,
        metadata: normalized.metadata,
        status: 'pending',
      },
      { transaction },
    );
    return request.toPublicObject();
  });
}

export const __testing = {
  slugify,
  normalizeGigPayload,
  normalizePackage,
  normalizeAddOn,
  normalizeAvailability,
  normalizeBannerSettings,
  normalizeHexColor,
  normalizeStatus,
  normalizeVisibility,
  normalizeInteger,
  normalizeCurrency,
  normalizePrice,
  sanitizeHighlights,
  sanitizeDeliverables,
  resolvePackageTier,
  sanitizeRequirementList,
  normalizeCustomRequestPayload,
};

export default {
  listFreelancerGigs,
  getGigDetail,
  createGigBlueprint,
  updateGigBlueprint,
  publishGig,
  submitCustomGigRequest,
};
