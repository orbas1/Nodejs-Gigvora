import { Op, fn, col, literal } from 'sequelize';
import {
  IdentityVerification,
  IdentityVerificationEvent,
  Profile,
  User,
  ID_VERIFICATION_STATUSES,
  ID_VERIFICATION_EVENT_TYPES,
  sequelize,
} from '../models/index.js';
import { PlatformSetting } from '../models/platformSetting.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const IDENTITY_VERIFICATION_SETTINGS_KEY = 'identity_verification';
const STATUS_SET = new Set(ID_VERIFICATION_STATUSES);
const EVENT_TYPE_SET = new Set(ID_VERIFICATION_EVENT_TYPES);
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_LOOKBACK_DAYS = 180;
const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_ESCALATION_HOURS = 48;

const DEFAULT_SETTINGS = Object.freeze({
  providers: [
    {
      id: 'manual_review',
      name: 'Manual review',
      enabled: true,
      webhookUrl: '',
      apiKey: '',
      apiSecret: '',
      sandbox: true,
      riskPolicy: 'standard',
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
    },
  ],
  automation: {
    autoAssignOldest: true,
    autoRejectExpired: true,
    autoApproveLowRisk: false,
    escalationHours: DEFAULT_ESCALATION_HOURS,
    reminderHours: 24,
    riskTolerance: 0.25,
    notifyChannel: '',
  },
  documents: {
    individual: ['passport', 'government_id'],
    business: ['certificate_of_incorporation', 'utility_bill'],
    additionalNotes: '',
  },
  storage: {
    evidenceBucket: '',
    publicBaseUrl: '',
  },
});

function coerceString(value, { max = 500, required = false, fallback = '' } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError('A required field was not provided.');
    }
    return fallback;
  }
  const text = `${value}`.trim();
  if (!text) {
    if (required) {
      throw new ValidationError('A required field was not provided.');
    }
    return fallback;
  }
  return text.slice(0, max);
}

function coerceBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
}

function coerceNumber(value, { min, max, fallback = 0, precision } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let next = numeric;
  if (typeof min === 'number' && next < min) {
    next = min;
  }
  if (typeof max === 'number' && next > max) {
    next = max;
  }
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    next = Math.round(next * multiplier) / multiplier;
  }
  return next;
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    throw new ValidationError('An invalid date value was provided.');
  }
  return candidate;
}

function ensurePositiveInteger(value, label) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalizeStatusList(statuses) {
  if (!Array.isArray(statuses)) {
    if (!statuses) {
      return [];
    }
    statuses = [statuses];
  }
  const normalized = Array.from(
    new Set(
      statuses
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => STATUS_SET.has(value)),
    ),
  );
  return normalized;
}

function normalizeEventType(value) {
  if (!value) {
    throw new ValidationError('eventType is required.');
  }
  const eventType = `${value}`.trim().toLowerCase();
  if (!EVENT_TYPE_SET.has(eventType)) {
    throw new ValidationError(`eventType must be one of: ${ID_VERIFICATION_EVENT_TYPES.join(', ')}.`);
  }
  return eventType;
}

function serializeUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get({ plain: true });
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
    name: name || plain.email || null,
  };
}

function serializeProfile(profile) {
  if (!profile) {
    return null;
  }
  const plain = profile.get({ plain: true });
  return {
    id: plain.id,
    headline: plain.headline ?? null,
    location: plain.location ?? null,
    avatarSeed: plain.avatarSeed ?? null,
    availabilityStatus: plain.availabilityStatus ?? null,
  };
}

function serializeEvent(event) {
  if (!event) {
    return null;
  }
  const base = event.toPublicObject();
  const actor = serializeUser(event.actor);
  return {
    ...base,
    actor,
  };
}

function serializeVerification(record, { includeEvents = false } = {}) {
  if (!record) {
    return null;
  }
  const base = record.toPublicObject();
  base.user = serializeUser(record.user);
  base.reviewer = serializeUser(record.reviewer);
  base.profile = serializeProfile(record.profile);
  if (includeEvents) {
    const events = Array.isArray(record.events) ? record.events : [];
    base.events = events.map(serializeEvent);
  }
  return base;
}

async function readSettingsRecord(transaction) {
  const [record] = await PlatformSetting.findOrCreate({
    where: { key: IDENTITY_VERIFICATION_SETTINGS_KEY },
    defaults: { value: DEFAULT_SETTINGS },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  return record;
}

function mergeSettings(currentValue = {}, patch = {}) {
  const next = {
    providers: Array.isArray(currentValue.providers) ? [...currentValue.providers] : [...DEFAULT_SETTINGS.providers],
    automation: { ...DEFAULT_SETTINGS.automation, ...(currentValue.automation ?? {}) },
    documents: { ...DEFAULT_SETTINGS.documents, ...(currentValue.documents ?? {}) },
    storage: { ...DEFAULT_SETTINGS.storage, ...(currentValue.storage ?? {}) },
  };

  if (Array.isArray(patch.providers)) {
    next.providers = patch.providers.map((provider, index) => ({
      id: coerceString(provider.id ?? provider.slug ?? `provider-${index + 1}`, { max: 120, required: true }).toLowerCase(),
      name: coerceString(provider.name ?? provider.label ?? provider.id ?? `Provider ${index + 1}`, { max: 120, required: true }),
      enabled: coerceBoolean(provider.enabled, true),
      webhookUrl: coerceString(provider.webhookUrl ?? provider.webhookURL ?? '', { max: 500 }),
      apiKey: coerceString(provider.apiKey ?? '', { max: 255 }),
      apiSecret: coerceString(provider.apiSecret ?? '', { max: 255 }),
      sandbox: coerceBoolean(provider.sandbox, true),
      riskPolicy: coerceString(provider.riskPolicy ?? 'standard', { max: 120 }),
      allowedDocuments: Array.isArray(provider.allowedDocuments)
        ? provider.allowedDocuments.map((value) => coerceString(value, { max: 120 })).filter(Boolean)
        : [],
    }));
  }

  if (patch.automation) {
    next.automation = {
      ...next.automation,
      autoAssignOldest: coerceBoolean(patch.automation.autoAssignOldest, next.automation.autoAssignOldest),
      autoRejectExpired: coerceBoolean(patch.automation.autoRejectExpired, next.automation.autoRejectExpired),
      autoApproveLowRisk: coerceBoolean(patch.automation.autoApproveLowRisk, next.automation.autoApproveLowRisk),
      escalationHours: coerceNumber(patch.automation.escalationHours, {
        min: 1,
        max: 240,
        fallback: next.automation.escalationHours,
        precision: 0,
      }),
      reminderHours: coerceNumber(patch.automation.reminderHours, {
        min: 1,
        max: 240,
        fallback: next.automation.reminderHours,
        precision: 0,
      }),
      riskTolerance: coerceNumber(patch.automation.riskTolerance, {
        min: 0,
        max: 1,
        fallback: next.automation.riskTolerance,
        precision: 2,
      }),
      notifyChannel: coerceString(patch.automation.notifyChannel, { max: 120, fallback: next.automation.notifyChannel }),
    };
  }

  if (patch.documents) {
    next.documents = {
      ...next.documents,
      individual: Array.isArray(patch.documents.individual)
        ? patch.documents.individual.map((value) => coerceString(value, { max: 120 })).filter(Boolean)
        : next.documents.individual,
      business: Array.isArray(patch.documents.business)
        ? patch.documents.business.map((value) => coerceString(value, { max: 120 })).filter(Boolean)
        : next.documents.business,
      additionalNotes: coerceString(patch.documents.additionalNotes, { max: 1000, fallback: next.documents.additionalNotes }),
    };
  }

  if (patch.storage) {
    next.storage = {
      ...next.storage,
      evidenceBucket: coerceString(patch.storage.evidenceBucket, { max: 120, fallback: next.storage.evidenceBucket }),
      publicBaseUrl: coerceString(patch.storage.publicBaseUrl, { max: 2048, fallback: next.storage.publicBaseUrl }),
    };
  }

  return next;
}

export async function getIdentityVerificationSettings() {
  const record = await readSettingsRecord();
  const merged = mergeSettings(record.value ?? {}, {});
  return merged;
}

export async function updateIdentityVerificationSettings(patch = {}) {
  return sequelize.transaction(async (transaction) => {
    const record = await readSettingsRecord(transaction);
    const nextValue = mergeSettings(record.value ?? {}, patch ?? {});
    await record.update({ value: nextValue }, { transaction });
    return nextValue;
  });
}

export async function getIdentityVerificationOverview({ lookbackDays } = {}) {
  const sanitizedLookback = Math.min(
    Math.max(Number(lookbackDays) || DEFAULT_LOOKBACK_DAYS, 1),
    MAX_LOOKBACK_DAYS,
  );
  const windowStart = new Date(Date.now() - sanitizedLookback * 24 * 60 * 60 * 1000);
  const slaThreshold = new Date(Date.now() - DEFAULT_ESCALATION_HOURS * 60 * 60 * 1000);

  const [statusCountsRaw, providerCountsRaw, reviewerStatsRaw, recentEvents, openVerifications] = await Promise.all([
    IdentityVerification.count({ group: ['status'] }),
    IdentityVerification.count({ group: ['verificationProvider'] }),
    IdentityVerification.findAll({
      attributes: ['reviewerId', [fn('COUNT', col('IdentityVerification.id')), 'total']],
      where: { reviewerId: { [Op.ne]: null } },
      group: ['IdentityVerification.reviewerId'],
      order: [[literal('total'), 'DESC']],
      raw: true,
    }),
    IdentityVerificationEvent.findAll({
      where: { createdAt: { [Op.gte]: windowStart } },
      include: [
        { model: IdentityVerification, as: 'verification', attributes: ['id', 'fullName', 'status'] },
        { model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 12,
    }),
    IdentityVerification.findAll({
      where: {
        status: { [Op.in]: ['pending', 'submitted', 'in_review'] },
        submittedAt: { [Op.ne]: null },
      },
      attributes: ['id', 'fullName', 'status', 'submittedAt', 'verificationProvider', 'reviewerId'],
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'avatarSeed'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['submittedAt', 'ASC']],
      limit: 50,
    }),
  ]);

  const statusMap = new Map();
  (Array.isArray(statusCountsRaw) ? statusCountsRaw : []).forEach((row) => {
    const statusValue = (row.status ?? row[0]) ?? null;
    const countValue = Number(row.count ?? row[1]) || 0;
    if (statusValue == null) {
      return;
    }
    const key = typeof statusValue === 'string' ? statusValue : String(statusValue);
    statusMap.set(key, countValue);
  });
  const statusBreakdown = ID_VERIFICATION_STATUSES.map((status) => ({
    status,
    count: statusMap.get(status) || 0,
  }));

  const totalVerifications = statusBreakdown.reduce((sum, item) => sum + item.count, 0);

  const providerBreakdown = (Array.isArray(providerCountsRaw) ? providerCountsRaw : []).map((row) => {
    const providerValue = (row.verificationProvider ?? row[0]) ?? 'manual_review';
    const countValue = Number(row.count ?? row[1]) || 0;
    return {
      provider: typeof providerValue === 'string' ? providerValue : String(providerValue),
      count: countValue,
    };
  });

  const reviewerIds = reviewerStatsRaw.map((row) => row.reviewerId).filter(Boolean);
  const reviewers = reviewerIds.length
    ? await User.findAll({ where: { id: reviewerIds }, attributes: ['id', 'firstName', 'lastName', 'email'] })
    : [];
  const reviewerMap = new Map(reviewers.map((user) => [user.id, serializeUser(user)]));
  const reviewerBreakdown = reviewerStatsRaw.map((row) => ({
    reviewerId: row.reviewerId,
    reviewer: reviewerMap.get(row.reviewerId) ?? null,
    count: Number(row.total) || 0,
  }));

  const backlog = openVerifications.filter((item) => item.submittedAt && item.submittedAt < slaThreshold);

  const reviewDurations = await IdentityVerification.findAll({
    attributes: ['submittedAt', 'reviewedAt'],
    where: {
      submittedAt: { [Op.ne]: null },
      reviewedAt: { [Op.ne]: null },
      updatedAt: { [Op.gte]: windowStart },
    },
    limit: 5000,
  });
  const durationSeconds = reviewDurations
    .map((item) => {
      const submitted = item.submittedAt instanceof Date ? item.submittedAt : new Date(item.submittedAt);
      const reviewed = item.reviewedAt instanceof Date ? item.reviewedAt : new Date(item.reviewedAt);
      if (Number.isNaN(submitted.getTime()) || Number.isNaN(reviewed.getTime())) {
        return null;
      }
      return Math.max(0, (reviewed.getTime() - submitted.getTime()) / 1000);
    })
    .filter((value) => Number.isFinite(value));
  const averageReviewSeconds =
    durationSeconds.length > 0
      ? Math.round(durationSeconds.reduce((sum, value) => sum + value, 0) / durationSeconds.length)
      : null;

  const autoApprovedCount = await IdentityVerification.count({
    where: { status: 'verified', reviewerId: null },
  });

  return {
    totals: {
      total: totalVerifications,
      byStatus: statusBreakdown,
      byProvider: providerBreakdown,
      backlog: backlog.length,
      openQueue: openVerifications.length,
      autoApproved: autoApprovedCount,
    },
    reviewerBreakdown,
    recentActivity: recentEvents.map((event) => ({
      ...serializeEvent(event),
      verification: event.verification ? serializeVerification(event.verification) : null,
    })),
    openQueue: openVerifications.map((item) => serializeVerification(item)),
    metrics: {
      averageReviewSeconds,
      slaThresholdHours: DEFAULT_ESCALATION_HOURS,
      lookbackDays: sanitizedLookback,
    },
  };
}

export async function listIdentityVerifications({
  page,
  pageSize,
  statuses,
  provider,
  reviewerId,
  search,
  submittedFrom,
  submittedTo,
  sortBy,
  sortDirection,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const whereClause = {};

  const normalizedStatuses = normalizeStatusList(statuses);
  if (normalizedStatuses.length) {
    whereClause.status = { [Op.in]: normalizedStatuses };
  }
  if (provider) {
    whereClause.verificationProvider = coerceString(provider, { max: 120, fallback: provider }).toLowerCase();
  }
  if (reviewerId) {
    whereClause.reviewerId = ensurePositiveInteger(reviewerId, 'reviewerId');
  }
  if (submittedFrom || submittedTo) {
    const range = {};
    if (submittedFrom) {
      range[Op.gte] = coerceDate(submittedFrom);
    }
    if (submittedTo) {
      range[Op.lte] = coerceDate(submittedTo);
    }
    whereClause.submittedAt = range;
  }

  if (search) {
    const term = coerceString(search, { max: 255, fallback: '' });
    if (term) {
      const numericId = Number(term);
      const dialect = sequelize.getDialect();
      const likeComparator = typeof dialect === 'string' && dialect.toLowerCase().includes('mysql') ? Op.like : Op.iLike;
      whereClause[Op.or] = [
        { fullName: { [likeComparator]: `%${term}%` } },
        { verificationProvider: { [likeComparator]: `%${term}%` } },
      ];
      if (Number.isInteger(numericId)) {
        whereClause[Op.or].push({ id: numericId });
        whereClause[Op.or].push({ userId: numericId });
      }
    }
  }

  const direction = `${sortDirection}`.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = [];
  switch ((sortBy ?? '').toString()) {
    case 'status':
      order.push(['status', direction]);
      break;
    case 'reviewer':
      order.push(['reviewerId', direction]);
      break;
    case 'provider':
      order.push(['verificationProvider', direction]);
      break;
    case 'submittedAt':
      order.push(['submittedAt', direction]);
      break;
    default:
      order.push(['submittedAt', 'DESC']);
      order.push(['createdAt', 'DESC']);
  }

  const { rows, count } = await IdentityVerification.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'avatarSeed', 'availabilityStatus'] },
    ],
    order,
    limit: normalizedPageSize,
    offset,
    distinct: true,
  });

  const total =
    typeof count === 'number'
      ? count
      : Array.isArray(count)
      ? count.reduce((sum, entry) => {
          if (typeof entry === 'number') {
            return sum + entry;
          }
          const value = Number(entry?.count ?? entry?.[1]) || 0;
          return sum + value;
        }, 0)
      : 0;
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));

  return {
    data: rows.map((row) => serializeVerification(row)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      total,
      totalPages,
    },
  };
}

export async function getIdentityVerificationById(verificationId) {
  const id = ensurePositiveInteger(verificationId, 'verificationId');
  const record = await IdentityVerification.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'avatarSeed', 'availabilityStatus'] },
      {
        model: IdentityVerificationEvent,
        as: 'events',
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
      },
    ],
    order: [[{ model: IdentityVerificationEvent, as: 'events' }, 'createdAt', 'DESC']],
  });
  if (!record) {
    throw new NotFoundError('Identity verification record not found.');
  }
  return serializeVerification(record, { includeEvents: true });
}

function normalizeMetadata(input) {
  if (input == null) {
    return null;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('metadata must be an object.');
  }
  return { ...input };
}

export async function createIdentityVerification(payload = {}, { actorId, actorRole } = {}) {
  const userId = ensurePositiveInteger(payload.userId, 'userId');
  const profileId = ensurePositiveInteger(payload.profileId, 'profileId');

  const [user, profile] = await Promise.all([
    User.findByPk(userId),
    Profile.findByPk(profileId),
  ]);

  if (!user) {
    throw new NotFoundError('User not found for identity verification.');
  }
  if (!profile || profile.userId !== userId) {
    throw new ValidationError('profileId does not belong to the specified user.');
  }

  const status = payload.status ? coerceString(payload.status, { max: 60, required: true }).toLowerCase() : 'submitted';
  if (!STATUS_SET.has(status)) {
    throw new ValidationError(`status must be one of: ${ID_VERIFICATION_STATUSES.join(', ')}.`);
  }

  const verification = await sequelize.transaction(async (transaction) => {
    const provider = coerceString(payload.verificationProvider ?? 'manual_review', {
      max: 120,
      required: true,
    }).toLowerCase();
    const typeOfId = coerceString(payload.typeOfId, { max: 120, fallback: null });
    const idNumberLast4 = coerceString(payload.idNumberLast4, { max: 16, fallback: null });
    const issuingCountry = coerceString(payload.issuingCountry, { max: 4, fallback: null });
    const issuedAt = payload.issuedAt ? coerceDate(payload.issuedAt) : null;
    const expiresAt = payload.expiresAt ? coerceDate(payload.expiresAt) : null;
    const documentFrontKey = coerceString(payload.documentFrontKey, { max: 500, fallback: null });
    const documentBackKey = coerceString(payload.documentBackKey, { max: 500, fallback: null });
    const selfieKey = coerceString(payload.selfieKey, { max: 500, fallback: null });
    const fullName = coerceString(payload.fullName, { max: 255, required: true });
    const dateOfBirth = coerceDate(payload.dateOfBirth);
    if (!dateOfBirth) {
      throw new ValidationError('dateOfBirth is required.');
    }
    const addressLine1 = coerceString(payload.addressLine1, { max: 255, required: true });
    const addressLine2 = coerceString(payload.addressLine2, { max: 255, fallback: null });
    const city = coerceString(payload.city, { max: 120, required: true });
    const state = coerceString(payload.state, { max: 120, fallback: null });
    const postalCode = coerceString(payload.postalCode, { max: 40, required: true });
    const country = coerceString(payload.country, { max: 4, required: true });
    const reviewNotes = coerceString(payload.reviewNotes, { max: 2000, fallback: null });
    const declinedReason = coerceString(payload.declinedReason, { max: 2000, fallback: null });
    const reviewerId = payload.reviewerId ? ensurePositiveInteger(payload.reviewerId, 'reviewerId') : null;
    const submittedAt = payload.submittedAt ? coerceDate(payload.submittedAt) : new Date();
    const reviewedAt = payload.reviewedAt ? coerceDate(payload.reviewedAt) : null;
    const metadata = normalizeMetadata(payload.metadata);

    const created = await IdentityVerification.create(
      {
        userId,
        profileId,
        status,
        verificationProvider: provider,
        typeOfId,
        idNumberLast4,
        issuingCountry: issuingCountry ? issuingCountry.toUpperCase() : null,
        issuedAt,
        expiresAt,
        documentFrontKey,
        documentBackKey,
        selfieKey,
        fullName,
        dateOfBirth,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: country.toUpperCase(),
        reviewNotes,
        declinedReason,
        reviewerId,
        submittedAt,
        reviewedAt,
        metadata,
      },
      { transaction },
    );

    await IdentityVerificationEvent.create(
      {
        identityVerificationId: created.id,
        eventType: status === 'submitted' ? 'note' : 'status_change',
        actorId: actorId ?? null,
        actorRole: actorRole ?? 'admin',
        fromStatus: null,
        toStatus: status,
        note: coerceString(payload.initialNote ?? payload.reviewNotes ?? '', { max: 2000, fallback: null }),
        metadata: normalizeMetadata(payload.eventMetadata ?? null),
      },
      { transaction },
    );

    return created;
  });

  return getIdentityVerificationById(verification.id);
}

export async function updateIdentityVerification(
  verificationId,
  payload = {},
  { actorId, actorRole = 'admin' } = {},
) {
  const id = ensurePositiveInteger(verificationId, 'verificationId');
  const normalizedMetadata = payload.metadata ? normalizeMetadata(payload.metadata) : undefined;

  return sequelize.transaction(async (transaction) => {
    const record = await IdentityVerification.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'avatarSeed', 'availabilityStatus'] },
        { model: IdentityVerificationEvent, as: 'events', include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }] },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw new NotFoundError('Identity verification record not found.');
    }

    const updates = {};
    const events = [];

    if (payload.status) {
      const nextStatus = coerceString(payload.status, { max: 60, required: true }).toLowerCase();
      if (!STATUS_SET.has(nextStatus)) {
        throw new ValidationError(`status must be one of: ${ID_VERIFICATION_STATUSES.join(', ')}.`);
      }
      if (nextStatus !== record.status) {
        updates.status = nextStatus;
        if (nextStatus === 'verified' || nextStatus === 'rejected') {
          updates.reviewedAt = payload.reviewedAt ? coerceDate(payload.reviewedAt) : new Date();
        }
        events.push({
          eventType: 'status_change',
          fromStatus: record.status,
          toStatus: nextStatus,
          note: coerceString(payload.statusNote ?? '', { max: 2000, fallback: null }),
        });
      }
    }

    if (payload.reviewerId !== undefined) {
      const reviewerId = payload.reviewerId == null ? null : ensurePositiveInteger(payload.reviewerId, 'reviewerId');
      if (reviewerId !== record.reviewerId) {
        updates.reviewerId = reviewerId;
        events.push({
          eventType: 'assignment',
          note: reviewerId ? `Assigned to reviewer #${reviewerId}` : 'Reviewer cleared.',
          metadata: reviewerId ? { reviewerId } : {},
        });
      }
    }

    if (payload.reviewNotes !== undefined) {
      updates.reviewNotes = coerceString(payload.reviewNotes, { max: 2000, fallback: null });
    }
    if (payload.declinedReason !== undefined) {
      updates.declinedReason = coerceString(payload.declinedReason, { max: 2000, fallback: null });
    }
    if (payload.typeOfId !== undefined) {
      updates.typeOfId = coerceString(payload.typeOfId, { max: 120, fallback: null });
    }
    if (payload.idNumberLast4 !== undefined) {
      updates.idNumberLast4 = coerceString(payload.idNumberLast4, { max: 16, fallback: null });
    }
    if (payload.documentFrontKey !== undefined) {
      updates.documentFrontKey = coerceString(payload.documentFrontKey, { max: 500, fallback: null });
    }
    if (payload.documentBackKey !== undefined) {
      updates.documentBackKey = coerceString(payload.documentBackKey, { max: 500, fallback: null });
    }
    if (payload.selfieKey !== undefined) {
      updates.selfieKey = coerceString(payload.selfieKey, { max: 500, fallback: null });
    }
    if (payload.issuingCountry !== undefined) {
      const issuing = coerceString(payload.issuingCountry, { max: 4, fallback: null });
      updates.issuingCountry = issuing ? issuing.toUpperCase() : null;
    }
    if (payload.issuedAt !== undefined) {
      updates.issuedAt = payload.issuedAt ? coerceDate(payload.issuedAt) : null;
    }
    if (payload.expiresAt !== undefined) {
      updates.expiresAt = payload.expiresAt ? coerceDate(payload.expiresAt) : null;
    }
    if (payload.submittedAt !== undefined) {
      updates.submittedAt = payload.submittedAt ? coerceDate(payload.submittedAt) : null;
    }
    if (payload.fullName !== undefined) {
      updates.fullName = coerceString(payload.fullName, { max: 255, required: true });
    }
    if (payload.addressLine1 !== undefined) {
      updates.addressLine1 = coerceString(payload.addressLine1, { max: 255, required: true });
    }
    if (payload.addressLine2 !== undefined) {
      updates.addressLine2 = coerceString(payload.addressLine2, { max: 255, fallback: payload.addressLine2 ?? null });
    }
    if (payload.city !== undefined) {
      updates.city = coerceString(payload.city, { max: 120, required: true });
    }
    if (payload.state !== undefined) {
      updates.state = coerceString(payload.state, { max: 120, fallback: payload.state ?? null });
    }
    if (payload.postalCode !== undefined) {
      updates.postalCode = coerceString(payload.postalCode, { max: 40, required: true });
    }
    if (payload.country !== undefined) {
      const normalizedCountry = coerceString(payload.country, { max: 4, required: true });
      updates.country = normalizedCountry.toUpperCase();
    }
    if (normalizedMetadata !== undefined) {
      updates.metadata = normalizedMetadata;
    }

    if (Object.keys(updates).length) {
      await record.update(updates, { transaction });
    }

    if (payload.note) {
      events.push({ eventType: 'note', note: coerceString(payload.note, { max: 2000, required: true }) });
    }
    if (payload.documentRequest) {
      events.push({
        eventType: 'document_request',
        note: coerceString(payload.documentRequest.note ?? '', { max: 2000, fallback: null }),
        metadata: normalizeMetadata(payload.documentRequest.metadata ?? {}),
      });
    }
    if (payload.escalate) {
      events.push({
        eventType: 'escalation',
        note: coerceString(payload.escalate.note ?? 'Escalated for review', { max: 2000, fallback: 'Escalated for review' }),
        metadata: normalizeMetadata(payload.escalate.metadata ?? {}),
      });
    }

    await Promise.all(
      events.map((event) =>
        IdentityVerificationEvent.create(
          {
            identityVerificationId: record.id,
            eventType: normalizeEventType(event.eventType),
            actorId: actorId ?? null,
            actorRole,
            fromStatus: event.fromStatus ?? null,
            toStatus: event.toStatus ?? null,
            note: event.note ?? null,
            metadata: event.metadata ?? null,
          },
          { transaction },
        ),
      ),
    );

    await record.reload({
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'avatarSeed', 'availabilityStatus'] },
        { model: IdentityVerificationEvent, as: 'events', include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }] },
      ],
      order: [[{ model: IdentityVerificationEvent, as: 'events' }, 'createdAt', 'DESC']],
      transaction,
    });

    return serializeVerification(record, { includeEvents: true });
  });
}

export async function createIdentityVerificationEvent(
  verificationId,
  payload = {},
  { actorId, actorRole = 'admin' } = {},
) {
  const id = ensurePositiveInteger(verificationId, 'verificationId');
  const verification = await IdentityVerification.findByPk(id);
  if (!verification) {
    throw new NotFoundError('Identity verification record not found.');
  }

  const eventType = normalizeEventType(payload.eventType);
  if (eventType === 'status_change') {
    throw new ValidationError('Use the update endpoint to change verification status.');
  }

  const event = await IdentityVerificationEvent.create({
    identityVerificationId: id,
    eventType,
    actorId: actorId ?? null,
    actorRole,
    fromStatus: payload.fromStatus ?? null,
    toStatus: payload.toStatus ?? null,
    note: coerceString(payload.note, { max: 2000, required: eventType !== 'reminder' }),
    metadata: normalizeMetadata(payload.metadata ?? {}),
  });

  const fullEvent = await IdentityVerificationEvent.findByPk(event.id, {
    include: [
      { model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  return serializeEvent(fullEvent);
}

export default {
  getIdentityVerificationOverview,
  listIdentityVerifications,
  getIdentityVerificationById,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  getIdentityVerificationSettings,
  updateIdentityVerificationSettings,
};
