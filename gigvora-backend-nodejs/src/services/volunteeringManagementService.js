import {
  sequelize,
  VolunteerApplication,
  VolunteerResponse,
  VolunteerContract,
  VolunteerContractSpend,
  VolunteerContractReview,
  Volunteering,
  User,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'volunteering:management';
const DASHBOARD_CACHE_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const APPLICATION_ACTIVE_STATUSES = new Set([
  'draft',
  'submitted',
  'in_review',
  'interview',
  'offered',
  'accepted',
]);

const CONTRACT_OPEN_STATUSES = new Set(['draft', 'awaiting_signature', 'active', 'on_hold']);
const CONTRACT_FINISHED_STATUSES = new Set(['completed', 'cancelled']);

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function coerceDate(value, label) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label ?? 'date'} must be a valid date.`);
  }
  return date;
}

function coerceDecimal(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError(`${label ?? 'amount'} must be a positive number.`);
  }
  return numeric;
}

function coerceHours(value, label = 'hours', { max = 168 } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > max) {
    throw new ValidationError(`${label} must be between 0 and ${max} hours.`);
  }
  return Math.round(numeric);
}

function toPlainUser(instance) {
  if (!instance) {
    return null;
  }
  const plain = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
  };
}

function hydrateResponse(instance) {
  const response = instance?.toPublicObject?.() ?? null;
  if (!response) {
    return null;
  }
  return {
    ...response,
    responder: toPlainUser(instance.get?.('responder') ?? instance.responder),
  };
}

function hydrateSpend(instance) {
  const spend = instance?.toPublicObject?.() ?? null;
  if (!spend) {
    return null;
  }
  return {
    ...spend,
    amount: spend.amount != null ? Number(spend.amount) : null,
    recordedBy: toPlainUser(instance.get?.('recordedBy') ?? instance.recordedBy),
  };
}

function hydrateReview(instance) {
  const review = instance?.toPublicObject?.() ?? null;
  if (!review) {
    return null;
  }
  return {
    ...review,
    reviewer: toPlainUser(instance.get?.('reviewer') ?? instance.reviewer),
  };
}

function hydrateContract(instance) {
  const contract = instance?.toPublicObject?.() ?? null;
  if (!contract) {
    return null;
  }
  const spendEntries = Array.isArray(instance?.spendEntries)
    ? instance.spendEntries.map(hydrateSpend).filter(Boolean)
    : [];
  const reviews = Array.isArray(instance?.reviews)
    ? instance.reviews.map(hydrateReview).filter(Boolean)
    : [];
  return {
    ...contract,
    spendEntries,
    reviews,
    owner: toPlainUser(instance.get?.('owner') ?? instance.owner),
  };
}

function hydrateApplication(instance) {
  const application = instance?.toPublicObject?.() ?? null;
  if (!application) {
    return null;
  }
  const roleInstance = instance.get?.('role') ?? instance.role;
  const responses = Array.isArray(instance?.responses)
    ? instance.responses.map(hydrateResponse).filter(Boolean)
    : [];
  const contract = hydrateContract(instance.get?.('contract') ?? instance.contract);

  return {
    ...application,
    role: roleInstance
      ? {
          id: roleInstance.id,
          title: roleInstance.title,
          organization: roleInstance.organization,
          location: roleInstance.location ?? null,
        }
      : null,
    responses,
    contract,
  };
}

function buildSummary(applications) {
  const totalApplications = applications.length;
  const openApplications = applications.filter((application) =>
    APPLICATION_ACTIVE_STATUSES.has(application.status),
  ).length;
  const outstandingRequests = applications.reduce((count, application) => {
    const requested = application.responses?.filter?.((response) => response.responseType === 'request_info') ?? [];
    return count + requested.length;
  }, 0);

  const contracts = applications
    .map((application) => (application.contract ? { contract: application.contract, application } : null))
    .filter(Boolean);

  const openContracts = [];
  const finishedContracts = [];
  const spendEntries = [];
  const totalsByCurrency = new Map();
  const allReviews = [];
  let ratingSum = 0;
  let ratingCount = 0;

  contracts.forEach(({ contract, application }) => {
    if (CONTRACT_OPEN_STATUSES.has(contract.status)) {
      openContracts.push({ ...contract, applicationId: application.id });
    }
    if (CONTRACT_FINISHED_STATUSES.has(contract.status)) {
      finishedContracts.push({ ...contract, applicationId: application.id });
    }

    if (Array.isArray(contract.spendEntries)) {
      contract.spendEntries.forEach((entry) => {
        spendEntries.push({ ...entry, contractId: contract.id, applicationId: application.id });
        const currency = entry.currencyCode ?? 'USD';
        const amount = Number(entry.amount ?? 0);
        if (!Number.isNaN(amount)) {
          totalsByCurrency.set(currency, Number((totalsByCurrency.get(currency) ?? 0) + amount));
        }
      });
    }

    if (Array.isArray(contract.reviews)) {
      contract.reviews.forEach((review) => {
        allReviews.push({ ...review, contractId: contract.id, applicationId: application.id });
        if (Number.isFinite(Number(review.rating))) {
          ratingSum += Number(review.rating);
          ratingCount += 1;
        }
      });
    }
  });

  const spendByCurrency = Object.fromEntries(
    Array.from(totalsByCurrency.entries()).map(([currency, amount]) => [currency, Number(amount.toFixed(2))]),
  );

  const averageRating = ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : null;

  return {
    summary: {
      totalApplications,
      openApplications,
      outstandingRequests,
      openContracts: openContracts.length,
      finishedContracts: finishedContracts.length,
      totalSpendEntries: spendEntries.length,
      spendByCurrency,
      averageReviewRating: averageRating,
    },
    openContracts,
    finishedContracts,
    spend: {
      entries: spendEntries,
      totalsByCurrency: spendByCurrency,
    },
    reviews: allReviews,
  };
}

async function loadManagementPayload(userId) {
  const applications = await VolunteerApplication.findAll({
    where: { userId },
    include: [
      { model: Volunteering, as: 'role' },
      {
        model: VolunteerResponse,
        as: 'responses',
        include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: VolunteerContract,
        as: 'contract',
        include: [
          { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: VolunteerContractSpend,
            as: 'spendEntries',
            include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
          {
            model: VolunteerContractReview,
            as: 'reviews',
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
        ],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      [{ model: VolunteerResponse, as: 'responses' }, 'respondedAt', 'DESC'],
      [{ model: VolunteerContract, as: 'contract' }, 'updatedAt', 'DESC'],
      [
        { model: VolunteerContract, as: 'contract' },
        { model: VolunteerContractSpend, as: 'spendEntries' },
        'incurredAt',
        'DESC',
      ],
      [
        { model: VolunteerContract, as: 'contract' },
        { model: VolunteerContractReview, as: 'reviews' },
        'createdAt',
        'DESC',
      ],
    ],
  });

  const hydratedApplications = applications.map(hydrateApplication).filter(Boolean);
  const summary = buildSummary(hydratedApplications);

  return {
    applications: hydratedApplications,
    ...summary,
  };
}

function invalidateCaches(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const managementKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });
  const dashboardKey = buildCacheKey(DASHBOARD_CACHE_NAMESPACE, { userId: normalizedUserId });
  appCache.delete(managementKey);
  appCache.delete(dashboardKey);
}

export async function getUserVolunteeringManagement(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (bypassCache) {
    return loadManagementPayload(normalizedUserId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => loadManagementPayload(normalizedUserId));
}

async function findApplicationOrThrow(userId, applicationId, transaction) {
  const application = await VolunteerApplication.findOne({
    where: { id: applicationId, userId },
    include: [
      { model: Volunteering, as: 'role' },
      {
        model: VolunteerResponse,
        as: 'responses',
        include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: VolunteerContract,
        as: 'contract',
        include: [
          { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: VolunteerContractSpend,
            as: 'spendEntries',
            include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
          {
            model: VolunteerContractReview,
            as: 'reviews',
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          },
        ],
      },
    ],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!application) {
    throw new NotFoundError('The requested volunteering application was not found.');
  }

  return application;
}

export async function createVolunteerApplication(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const {
    volunteeringRoleId,
    status = 'draft',
    motivation,
    availabilityStart,
    availabilityHoursPerWeek,
    submittedAt,
    decisionAt,
    notes,
    metadata,
  } = payload;

  if (!volunteeringRoleId) {
    throw new ValidationError('volunteeringRoleId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const role = await Volunteering.findByPk(volunteeringRoleId, { transaction });
    if (!role) {
      throw new ValidationError('Referenced volunteering role does not exist.');
    }

    const application = await VolunteerApplication.create(
      {
        userId: normalizedUserId,
        volunteeringRoleId,
        status,
        motivation: motivation ?? null,
        availabilityStart: coerceDate(availabilityStart, 'availabilityStart'),
        availabilityHoursPerWeek: coerceHours(availabilityHoursPerWeek, 'availabilityHoursPerWeek', { max: 168 }),
        submittedAt: coerceDate(submittedAt, 'submittedAt'),
        decisionAt: coerceDate(decisionAt, 'decisionAt'),
        notes: notes ?? null,
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await application.reload({
      include: [
        { model: Volunteering, as: 'role' },
        {
          model: VolunteerResponse,
          as: 'responses',
          include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateApplication(application);
  });
}

export async function updateVolunteerApplication(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { status, motivation, availabilityStart, availabilityHoursPerWeek, submittedAt, decisionAt, notes, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    await application.update(
      {
        status: status ?? application.status,
        motivation: motivation ?? application.motivation,
        availabilityStart:
          availabilityStart !== undefined ? coerceDate(availabilityStart, 'availabilityStart') : application.availabilityStart,
        availabilityHoursPerWeek:
          availabilityHoursPerWeek !== undefined
            ? coerceHours(availabilityHoursPerWeek, 'availabilityHoursPerWeek', { max: 168 })
            : application.availabilityHoursPerWeek,
        submittedAt: submittedAt !== undefined ? coerceDate(submittedAt, 'submittedAt') : application.submittedAt,
        decisionAt: decisionAt !== undefined ? coerceDate(decisionAt, 'decisionAt') : application.decisionAt,
        notes: notes !== undefined ? notes : application.notes,
        metadata: metadata !== undefined ? metadata : application.metadata,
      },
      { transaction },
    );

    await application.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateApplication(application);
  });
}

export async function createVolunteerResponse(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { responseType = 'message', message, requestedAction, respondedAt, metadata } = payload;

  if (!message || !message.trim()) {
    throw new ValidationError('message is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const response = await VolunteerResponse.create(
      {
        applicationId: application.id,
        responderId: normalizedUserId,
        responseType,
        message: message.trim(),
        requestedAction: requestedAction ?? null,
        respondedAt: coerceDate(respondedAt, 'respondedAt') ?? new Date(),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await response.reload({
      include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateResponse(response);
  });
}

export async function updateVolunteerResponse(userId, applicationId, responseId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { responseType, message, requestedAction, respondedAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const response = await VolunteerResponse.findOne({
      where: { id: responseId, applicationId },
      include: [{ model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!response) {
      throw new NotFoundError('The requested volunteering response was not found.');
    }

    await response.update(
      {
        responseType: responseType ?? response.responseType,
        message: message !== undefined ? message : response.message,
        requestedAction: requestedAction !== undefined ? requestedAction : response.requestedAction,
        respondedAt: respondedAt !== undefined ? coerceDate(respondedAt, 'respondedAt') : response.respondedAt,
        metadata: metadata !== undefined ? metadata : response.metadata,
      },
      { transaction },
    );

    await response.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateResponse(response);
  });
}

export async function deleteVolunteerResponse(userId, applicationId, responseId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const response = await VolunteerResponse.findOne({
      where: { id: responseId, applicationId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!response) {
      throw new NotFoundError('The requested volunteering response was not found.');
    }
    await response.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export async function upsertVolunteerContract(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const {
    status = 'draft',
    startDate,
    endDate,
    commitmentHours,
    hourlyRate,
    currencyCode,
    totalValue,
    spendToDate,
    notes,
    metadata,
  } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);

    const [contract] = await VolunteerContract.findOrCreate({
      where: { applicationId: application.id },
      defaults: {
        ownerId: normalizedUserId,
        status,
        startDate: coerceDate(startDate, 'startDate'),
        endDate: coerceDate(endDate, 'endDate'),
        commitmentHours: coerceHours(commitmentHours, 'commitmentHours', { max: 1000 }),
        hourlyRate: coerceDecimal(hourlyRate, 'hourlyRate'),
        currencyCode: currencyCode ?? null,
        totalValue: coerceDecimal(totalValue, 'totalValue'),
        spendToDate: coerceDecimal(spendToDate, 'spendToDate'),
        notes: notes ?? null,
        metadata: metadata ?? null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (contract.ownerId !== normalizedUserId) {
      await contract.update({ ownerId: normalizedUserId }, { transaction });
    }

    await contract.update(
      {
        status,
        startDate: startDate !== undefined ? coerceDate(startDate, 'startDate') : contract.startDate,
        endDate: endDate !== undefined ? coerceDate(endDate, 'endDate') : contract.endDate,
        commitmentHours:
          commitmentHours !== undefined
            ? coerceHours(commitmentHours, 'commitmentHours', { max: 1000 })
            : contract.commitmentHours,
        hourlyRate: hourlyRate !== undefined ? coerceDecimal(hourlyRate, 'hourlyRate') : contract.hourlyRate,
        currencyCode: currencyCode !== undefined ? (currencyCode ?? null) : contract.currencyCode,
        totalValue: totalValue !== undefined ? coerceDecimal(totalValue, 'totalValue') : contract.totalValue,
        spendToDate: spendToDate !== undefined ? coerceDecimal(spendToDate, 'spendToDate') : contract.spendToDate,
        notes: notes !== undefined ? notes : contract.notes,
        metadata: metadata !== undefined ? metadata : contract.metadata,
      },
      { transaction },
    );

    await contract.reload({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: VolunteerContractSpend,
          as: 'spendEntries',
          include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: VolunteerContractReview,
          as: 'reviews',
          include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateContract(contract);
  });
}

export async function recordVolunteerSpend(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { amount, currencyCode = 'USD', category = 'other', description, incurredAt, metadata } = payload;

  if (amount == null) {
    throw new ValidationError('amount is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const contract = await VolunteerContract.findOne({
      where: { applicationId: application.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) {
      throw new ValidationError('An active volunteering contract is required before recording spend.');
    }

    const spend = await VolunteerContractSpend.create(
      {
        contractId: contract.id,
        recordedById: normalizedUserId,
        amount: coerceDecimal(amount, 'amount'),
        currencyCode,
        category,
        description: description ?? null,
        incurredAt: coerceDate(incurredAt, 'incurredAt') ?? new Date(),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await spend.reload({
      include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateSpend(spend);
  });
}

export async function updateVolunteerSpend(userId, applicationId, spendId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { amount, currencyCode, category, description, incurredAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const spend = await VolunteerContractSpend.findOne({
      where: { id: spendId },
      include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!spend || spend.contractId == null) {
      throw new NotFoundError('The requested spend record was not found.');
    }
    const contract = await VolunteerContract.findOne({ where: { id: spend.contractId, applicationId: application.id }, transaction });
    if (!contract) {
      throw new NotFoundError('The requested spend record was not found.');
    }

    await spend.update(
      {
        amount: amount !== undefined ? coerceDecimal(amount, 'amount') : spend.amount,
        currencyCode: currencyCode !== undefined ? (currencyCode ?? null) : spend.currencyCode,
        category: category ?? spend.category,
        description: description !== undefined ? description : spend.description,
        incurredAt: incurredAt !== undefined ? coerceDate(incurredAt, 'incurredAt') : spend.incurredAt,
        metadata: metadata !== undefined ? metadata : spend.metadata,
      },
      { transaction },
    );

    await spend.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateSpend(spend);
  });
}

export async function deleteVolunteerSpend(userId, applicationId, spendId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const spend = await VolunteerContractSpend.findByPk(spendId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!spend) {
      throw new NotFoundError('The requested spend record was not found.');
    }
    await spend.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export async function createVolunteerReview(userId, applicationId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { rating, headline, feedback, visibility = 'private', publishedAt, metadata } = payload;

  if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
    throw new ValidationError('rating must be an integer between 1 and 5.');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const contract = await VolunteerContract.findOne({
      where: { applicationId: application.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) {
      throw new ValidationError('An active volunteering contract is required before leaving a review.');
    }

    const review = await VolunteerContractReview.create(
      {
        contractId: contract.id,
        reviewerId: normalizedUserId,
        rating,
        headline: headline ?? null,
        feedback: feedback ?? null,
        visibility,
        publishedAt: coerceDate(publishedAt, 'publishedAt'),
        metadata: metadata ?? null,
      },
      { transaction },
    );

    await review.reload({
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
    });

    invalidateCaches(normalizedUserId);
    return hydrateReview(review);
  });
}

export async function updateVolunteerReview(userId, applicationId, reviewId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const { rating, headline, feedback, visibility, publishedAt, metadata } = payload;

  return sequelize.transaction(async (transaction) => {
    const application = await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const review = await VolunteerContractReview.findOne({
      where: { id: reviewId },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!review) {
      throw new NotFoundError('The requested review was not found.');
    }

    const contract = await VolunteerContract.findOne({ where: { id: review.contractId, applicationId: application.id }, transaction });
    if (!contract) {
      throw new NotFoundError('The requested review was not found.');
    }

    await review.update(
      {
        rating: rating !== undefined ? Number(rating) : review.rating,
        headline: headline !== undefined ? headline : review.headline,
        feedback: feedback !== undefined ? feedback : review.feedback,
        visibility: visibility ?? review.visibility,
        publishedAt: publishedAt !== undefined ? coerceDate(publishedAt, 'publishedAt') : review.publishedAt,
        metadata: metadata !== undefined ? metadata : review.metadata,
      },
      { transaction },
    );

    await review.reload({ transaction });
    invalidateCaches(normalizedUserId);
    return hydrateReview(review);
  });
}

export async function deleteVolunteerReview(userId, applicationId, reviewId) {
  const normalizedUserId = normalizeUserId(userId);

  return sequelize.transaction(async (transaction) => {
    await findApplicationOrThrow(normalizedUserId, applicationId, transaction);
    const review = await VolunteerContractReview.findByPk(reviewId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!review) {
      throw new NotFoundError('The requested review was not found.');
    }
    await review.destroy({ transaction });
    invalidateCaches(normalizedUserId);
  });
}

export default {
  getUserVolunteeringManagement,
  createVolunteerApplication,
  updateVolunteerApplication,
  createVolunteerResponse,
  updateVolunteerResponse,
  deleteVolunteerResponse,
  upsertVolunteerContract,
  recordVolunteerSpend,
  updateVolunteerSpend,
  deleteVolunteerSpend,
  createVolunteerReview,
  updateVolunteerReview,
  deleteVolunteerReview,
};
