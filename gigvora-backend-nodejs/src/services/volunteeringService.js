import { Op } from 'sequelize';
import {
  VolunteeringApplication,
  VolunteeringResponse,
  VolunteeringContract,
  VolunteeringSpend,
  VOLUNTEERING_APPLICATION_STATUSES,
  VOLUNTEERING_RESPONSE_STATUSES,
  VOLUNTEERING_CONTRACT_STATUSES,
  VOLUNTEERING_SPEND_CATEGORIES,
} from '../models/volunteeringModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

function normaliseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item != null && item !== '').map((item) => `${item}`.trim()).filter(Boolean);
}

function ensureStatus(value, allowed, fieldName) {
  if (!value) {
    return allowed[0];
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function ensureOwned(record, freelancerId, message = 'Resource not found.') {
  if (!record || Number(record.freelancerId) !== Number(freelancerId)) {
    throw new NotFoundError(message);
  }
  return record;
}

function toPlainApplication(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  plain.hoursPerWeek = parseNumber(plain.hoursPerWeek);
  plain.skills = normaliseArray(Array.isArray(plain.skills) ? plain.skills : []);
  if (plain.responses) {
    plain.responses = plain.responses.map((response) => toPlainResponse(response));
  }
  if (plain.contracts) {
    plain.contracts = plain.contracts.map((contract) => toPlainContract(contract));
  }
  return plain;
}

function toPlainResponse(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  if (plain.attachments && !Array.isArray(plain.attachments)) {
    plain.attachments = [];
  }
  return plain;
}

function toPlainSpend(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  plain.amount = parseNumber(plain.amount) ?? 0;
  return plain;
}

function toPlainContract(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  plain.expectedHours = parseNumber(plain.expectedHours);
  plain.hoursCommitted = parseNumber(plain.hoursCommitted);
  plain.financialValue = parseNumber(plain.financialValue);
  if (plain.spendEntries) {
    plain.spendEntries = plain.spendEntries.map((entry) => toPlainSpend(entry));
  }
  return plain;
}

function computeMetrics({ applications = [], contracts = [], spendEntries = [] }) {
  const activeApplications = applications.filter((application) =>
    !['declined', 'withdrawn'].includes(application.status ?? ''),
  ).length;
  const interviewsScheduled = applications.reduce((total, application) => {
    const scheduled = application.responses?.filter((response) => response.status === 'scheduled').length ?? 0;
    return total + scheduled;
  }, 0);
  const openContracts = contracts.filter((contract) => ['pending', 'active'].includes(contract.status ?? ''));
  const finishedContracts = contracts.filter((contract) => contract.status === 'completed');
  const hoursCommitted = contracts.reduce((total, contract) => total + (parseNumber(contract.hoursCommitted) ?? 0), 0);
  const totals = spendEntries.reduce(
    (accumulator, entry) => {
      const amount = parseNumber(entry.amount) ?? 0;
      accumulator.lifetime += amount;
      const spentAt = parseDate(entry.spentAt);
      if (spentAt && spentAt.getFullYear() === new Date().getFullYear()) {
        accumulator.yearToDate += amount;
      }
      return accumulator;
    },
    { lifetime: 0, yearToDate: 0 },
  );

  return {
    activeApplications,
    interviewsScheduled,
    openContracts: openContracts.length,
    finishedContracts: finishedContracts.length,
    hoursCommitted,
    totalSpend: totals.lifetime,
    yearToDateSpend: totals.yearToDate,
  };
}

async function loadWorkspace(freelancerId) {
  const [applications, contracts] = await Promise.all([
    VolunteeringApplication.findAll({
      where: { freelancerId },
      order: [
        ['appliedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: VolunteeringResponse,
          as: 'responses',
          separate: true,
          order: [
            ['respondedAt', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        },
        {
          model: VolunteeringContract,
          as: 'contracts',
          include: [
            {
              model: VolunteeringSpend,
              as: 'spendEntries',
              separate: true,
              order: [
                ['spentAt', 'DESC'],
                ['createdAt', 'DESC'],
              ],
            },
          ],
        },
      ],
    }),
    VolunteeringContract.findAll({
      where: { freelancerId },
      order: [
        ['startDate', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: VolunteeringSpend,
          as: 'spendEntries',
          separate: true,
          order: [
            ['spentAt', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        },
      ],
    }),
  ]);

  const plainApplications = applications.map((application) => toPlainApplication(application));
  const plainContracts = contracts.map((contract) => toPlainContract(contract));
  const spendEntries = plainContracts.flatMap((contract) => contract.spendEntries ?? []);

  const metrics = computeMetrics({
    applications: plainApplications,
    contracts: plainContracts,
    spendEntries,
  });

  return {
    freelancerId,
    metrics,
    applications: plainApplications,
    contracts: {
      open: plainContracts.filter((contract) => ['pending', 'active'].includes(contract.status ?? '')),
      finished: plainContracts.filter((contract) => contract.status === 'completed'),
    },
    spend: {
      entries: spendEntries.sort((a, b) => {
        const dateA = parseDate(b.spentAt)?.getTime() ?? 0;
        const dateB = parseDate(a.spentAt)?.getTime() ?? 0;
        return dateA - dateB;
      }),
      totals: {
        lifetime: metrics.totalSpend,
        yearToDate: metrics.yearToDateSpend,
      },
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      statusOptions: VOLUNTEERING_APPLICATION_STATUSES,
      responseStatusOptions: VOLUNTEERING_RESPONSE_STATUSES,
      contractStatusOptions: VOLUNTEERING_CONTRACT_STATUSES,
      spendCategories: VOLUNTEERING_SPEND_CATEGORIES,
    },
  };
}

export async function getVolunteeringWorkspace(freelancerId) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required to load volunteering workspace.');
  }
  return loadWorkspace(freelancerId);
}

export async function createApplication(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new ValidationError('Freelancer context is required.');
  }
  const title = payload.title?.trim();
  const organizationName = payload.organizationName?.trim();
  if (!title) {
    throw new ValidationError('An application title is required.');
  }
  if (!organizationName) {
    throw new ValidationError('Please provide the organisation name.');
  }
  const status = ensureStatus(payload.status ?? 'draft', VOLUNTEERING_APPLICATION_STATUSES, 'Application status');

  const application = await VolunteeringApplication.create({
    freelancerId,
    title,
    organizationName,
    focusArea: payload.focusArea?.trim() || null,
    location: payload.location?.trim() || null,
    remoteFriendly: payload.remoteFriendly !== false,
    skills: normaliseArray(payload.skills),
    status,
    appliedAt: parseDate(payload.appliedAt) ?? new Date(),
    targetStartDate: parseDate(payload.targetStartDate),
    hoursPerWeek: parseNumber(payload.hoursPerWeek),
    impactSummary: payload.impactSummary?.trim() || null,
    notes: payload.notes?.trim() || null,
    coverImageUrl: payload.coverImageUrl?.trim() || null,
    metadata: payload.metadata ?? null,
  });

  return toPlainApplication(application);
}

export async function updateApplication(freelancerId, applicationId, patch = {}) {
  if (!freelancerId || !applicationId) {
    throw new ValidationError('freelancerId and applicationId are required.');
  }
  const application = await VolunteeringApplication.findByPk(applicationId);
  ensureOwned(application, freelancerId, 'Application not found.');

  const updates = {};
  if (patch.title !== undefined) {
    const trimmed = patch.title?.trim();
    if (!trimmed) {
      throw new ValidationError('Application title cannot be empty.');
    }
    updates.title = trimmed;
  }
  if (patch.organizationName !== undefined) {
    const trimmed = patch.organizationName?.trim();
    if (!trimmed) {
      throw new ValidationError('Organisation name cannot be empty.');
    }
    updates.organizationName = trimmed;
  }
  if (patch.focusArea !== undefined) {
    updates.focusArea = patch.focusArea?.trim() || null;
  }
  if (patch.location !== undefined) {
    updates.location = patch.location?.trim() || null;
  }
  if (patch.remoteFriendly !== undefined) {
    updates.remoteFriendly = Boolean(patch.remoteFriendly);
  }
  if (patch.skills !== undefined) {
    updates.skills = normaliseArray(patch.skills);
  }
  if (patch.status !== undefined) {
    updates.status = ensureStatus(patch.status, VOLUNTEERING_APPLICATION_STATUSES, 'Application status');
  }
  if (patch.appliedAt !== undefined) {
    updates.appliedAt = parseDate(patch.appliedAt);
  }
  if (patch.targetStartDate !== undefined) {
    updates.targetStartDate = parseDate(patch.targetStartDate);
  }
  if (patch.hoursPerWeek !== undefined) {
    updates.hoursPerWeek = parseNumber(patch.hoursPerWeek);
  }
  if (patch.impactSummary !== undefined) {
    updates.impactSummary = patch.impactSummary?.trim() || null;
  }
  if (patch.notes !== undefined) {
    updates.notes = patch.notes?.trim() || null;
  }
  if (patch.coverImageUrl !== undefined) {
    updates.coverImageUrl = patch.coverImageUrl?.trim() || null;
  }
  if (patch.metadata !== undefined) {
    updates.metadata = patch.metadata;
  }

  await application.update(updates);
  return toPlainApplication(application);
}

export async function deleteApplication(freelancerId, applicationId) {
  if (!freelancerId || !applicationId) {
    throw new ValidationError('freelancerId and applicationId are required.');
  }
  const application = await VolunteeringApplication.findByPk(applicationId);
  ensureOwned(application, freelancerId, 'Application not found.');
  await application.destroy();
  return { deleted: true };
}

export async function createResponse(freelancerId, applicationId, payload = {}) {
  if (!freelancerId || !applicationId) {
    throw new ValidationError('freelancerId and applicationId are required.');
  }
  const application = await VolunteeringApplication.findByPk(applicationId);
  ensureOwned(application, freelancerId, 'Application not found.');

  const status = ensureStatus(payload.status ?? 'awaiting_reply', VOLUNTEERING_RESPONSE_STATUSES, 'Response status');

  const response = await VolunteeringResponse.create({
    applicationId,
    freelancerId,
    responderName: payload.responderName?.trim() || null,
    responderEmail: payload.responderEmail?.trim() || null,
    status,
    respondedAt: parseDate(payload.respondedAt) ?? new Date(),
    nextSteps: payload.nextSteps?.trim() || null,
    message: payload.message?.trim() || null,
    attachments: Array.isArray(payload.attachments) ? payload.attachments.slice(0, 10) : [],
    metadata: payload.metadata ?? null,
  });

  return toPlainResponse(response);
}

export async function updateResponse(freelancerId, responseId, patch = {}) {
  if (!freelancerId || !responseId) {
    throw new ValidationError('freelancerId and responseId are required.');
  }
  const response = await VolunteeringResponse.findByPk(responseId);
  ensureOwned(response, freelancerId, 'Response not found.');

  const updates = {};
  if (patch.responderName !== undefined) {
    updates.responderName = patch.responderName?.trim() || null;
  }
  if (patch.responderEmail !== undefined) {
    updates.responderEmail = patch.responderEmail?.trim() || null;
  }
  if (patch.status !== undefined) {
    updates.status = ensureStatus(patch.status, VOLUNTEERING_RESPONSE_STATUSES, 'Response status');
  }
  if (patch.respondedAt !== undefined) {
    updates.respondedAt = parseDate(patch.respondedAt);
  }
  if (patch.nextSteps !== undefined) {
    updates.nextSteps = patch.nextSteps?.trim() || null;
  }
  if (patch.message !== undefined) {
    updates.message = patch.message?.trim() || null;
  }
  if (patch.attachments !== undefined) {
    updates.attachments = Array.isArray(patch.attachments) ? patch.attachments.slice(0, 10) : [];
  }
  if (patch.metadata !== undefined) {
    updates.metadata = patch.metadata;
  }

  await response.update(updates);
  return toPlainResponse(response);
}

export async function deleteResponse(freelancerId, responseId) {
  if (!freelancerId || !responseId) {
    throw new ValidationError('freelancerId and responseId are required.');
  }
  const response = await VolunteeringResponse.findByPk(responseId);
  ensureOwned(response, freelancerId, 'Response not found.');
  await response.destroy();
  return { deleted: true };
}

async function ensureApplicationOwnership(applicationId, freelancerId) {
  if (!applicationId) {
    return null;
  }
  const application = await VolunteeringApplication.findByPk(applicationId);
  if (!application || Number(application.freelancerId) !== Number(freelancerId)) {
    throw new ValidationError('The referenced volunteering application does not exist.');
  }
  return application;
}

export async function createContract(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new ValidationError('Freelancer context is required.');
  }
  const title = payload.title?.trim();
  const organizationName = payload.organizationName?.trim();
  if (!title) {
    throw new ValidationError('Contract title is required.');
  }
  if (!organizationName) {
    throw new ValidationError('Organisation name is required.');
  }
  const applicationId = payload.applicationId ?? null;
  if (applicationId) {
    await ensureApplicationOwnership(applicationId, freelancerId);
  }
  const status = ensureStatus(payload.status ?? 'pending', VOLUNTEERING_CONTRACT_STATUSES, 'Contract status');

  const contract = await VolunteeringContract.create({
    freelancerId,
    applicationId,
    title,
    organizationName,
    status,
    startDate: parseDate(payload.startDate) ?? new Date(),
    endDate: parseDate(payload.endDate),
    expectedHours: parseNumber(payload.expectedHours),
    hoursCommitted: parseNumber(payload.hoursCommitted),
    financialValue: parseNumber(payload.financialValue),
    currencyCode: payload.currencyCode?.trim() || 'USD',
    impactNotes: payload.impactNotes?.trim() || null,
    agreementUrl: payload.agreementUrl?.trim() || null,
    metadata: payload.metadata ?? null,
  });

  return toPlainContract(contract);
}

export async function updateContract(freelancerId, contractId, patch = {}) {
  if (!freelancerId || !contractId) {
    throw new ValidationError('freelancerId and contractId are required.');
  }
  const contract = await VolunteeringContract.findByPk(contractId);
  ensureOwned(contract, freelancerId, 'Contract not found.');

  const updates = {};
  if (patch.applicationId !== undefined) {
    if (patch.applicationId) {
      await ensureApplicationOwnership(patch.applicationId, freelancerId);
      updates.applicationId = patch.applicationId;
    } else {
      updates.applicationId = null;
    }
  }
  if (patch.title !== undefined) {
    const trimmed = patch.title?.trim();
    if (!trimmed) {
      throw new ValidationError('Contract title cannot be empty.');
    }
    updates.title = trimmed;
  }
  if (patch.organizationName !== undefined) {
    const trimmed = patch.organizationName?.trim();
    if (!trimmed) {
      throw new ValidationError('Organisation name cannot be empty.');
    }
    updates.organizationName = trimmed;
  }
  if (patch.status !== undefined) {
    updates.status = ensureStatus(patch.status, VOLUNTEERING_CONTRACT_STATUSES, 'Contract status');
  }
  if (patch.startDate !== undefined) {
    updates.startDate = parseDate(patch.startDate);
  }
  if (patch.endDate !== undefined) {
    updates.endDate = parseDate(patch.endDate);
  }
  if (patch.expectedHours !== undefined) {
    updates.expectedHours = parseNumber(patch.expectedHours);
  }
  if (patch.hoursCommitted !== undefined) {
    updates.hoursCommitted = parseNumber(patch.hoursCommitted);
  }
  if (patch.financialValue !== undefined) {
    updates.financialValue = parseNumber(patch.financialValue);
  }
  if (patch.currencyCode !== undefined) {
    updates.currencyCode = patch.currencyCode?.trim() || 'USD';
  }
  if (patch.impactNotes !== undefined) {
    updates.impactNotes = patch.impactNotes?.trim() || null;
  }
  if (patch.agreementUrl !== undefined) {
    updates.agreementUrl = patch.agreementUrl?.trim() || null;
  }
  if (patch.metadata !== undefined) {
    updates.metadata = patch.metadata;
  }

  await contract.update(updates);
  return toPlainContract(contract);
}

export async function deleteContract(freelancerId, contractId) {
  if (!freelancerId || !contractId) {
    throw new ValidationError('freelancerId and contractId are required.');
  }
  const contract = await VolunteeringContract.findByPk(contractId);
  ensureOwned(contract, freelancerId, 'Contract not found.');
  await contract.destroy();
  return { deleted: true };
}

export async function createSpend(freelancerId, contractId, payload = {}) {
  if (!freelancerId || !contractId) {
    throw new ValidationError('freelancerId and contractId are required.');
  }
  const contract = await VolunteeringContract.findByPk(contractId);
  ensureOwned(contract, freelancerId, 'Contract not found.');

  const description = payload.description?.trim();
  if (!description) {
    throw new ValidationError('Please provide a description for the spend entry.');
  }
  const amount = parseNumber(payload.amount);
  if (amount == null || amount < 0) {
    throw new ValidationError('Amount must be a positive number.');
  }
  const category = ensureStatus(
    payload.category ?? 'other',
    VOLUNTEERING_SPEND_CATEGORIES,
    'Spend category',
  );

  const spend = await VolunteeringSpend.create({
    contractId,
    freelancerId,
    description,
    category,
    amount,
    currencyCode: payload.currencyCode?.trim() || contract.currencyCode || 'USD',
    spentAt: parseDate(payload.spentAt) ?? new Date(),
    receiptUrl: payload.receiptUrl?.trim() || null,
    metadata: payload.metadata ?? null,
  });

  return toPlainSpend(spend);
}

export async function updateSpend(freelancerId, spendId, patch = {}) {
  if (!freelancerId || !spendId) {
    throw new ValidationError('freelancerId and spendId are required.');
  }
  const spend = await VolunteeringSpend.findByPk(spendId);
  ensureOwned(spend, freelancerId, 'Spend entry not found.');

  const updates = {};
  if (patch.description !== undefined) {
    const trimmed = patch.description?.trim();
    if (!trimmed) {
      throw new ValidationError('Spend description cannot be empty.');
    }
    updates.description = trimmed;
  }
  if (patch.category !== undefined) {
    updates.category = ensureStatus(patch.category, VOLUNTEERING_SPEND_CATEGORIES, 'Spend category');
  }
  if (patch.amount !== undefined) {
    const amount = parseNumber(patch.amount);
    if (amount == null || amount < 0) {
      throw new ValidationError('Amount must be a positive number.');
    }
    updates.amount = amount;
  }
  if (patch.currencyCode !== undefined) {
    updates.currencyCode = patch.currencyCode?.trim() || 'USD';
  }
  if (patch.spentAt !== undefined) {
    updates.spentAt = parseDate(patch.spentAt);
  }
  if (patch.receiptUrl !== undefined) {
    updates.receiptUrl = patch.receiptUrl?.trim() || null;
  }
  if (patch.metadata !== undefined) {
    updates.metadata = patch.metadata;
  }

  await spend.update(updates);
  return toPlainSpend(spend);
}

export async function deleteSpend(freelancerId, spendId) {
  if (!freelancerId || !spendId) {
    throw new ValidationError('freelancerId and spendId are required.');
  }
  const spend = await VolunteeringSpend.findByPk(spendId);
  ensureOwned(spend, freelancerId, 'Spend entry not found.');
  await spend.destroy();
  return { deleted: true };
}

export async function summariseVolunteeringSpend(freelancerId, { since } = {}) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  const where = { freelancerId };
  if (since) {
    const date = parseDate(since);
    if (date) {
      where.spentAt = { [Op.gte]: date };
    }
  }
  const entries = await VolunteeringSpend.findAll({ where });
  const totals = entries.reduce(
    (accumulator, entry) => {
      const amount = parseNumber(entry.amount) ?? 0;
      accumulator.total += amount;
      accumulator.byCategory[entry.category] = (accumulator.byCategory[entry.category] ?? 0) + amount;
      return accumulator;
    },
    { total: 0, byCategory: {} },
  );

  return {
    total: totals.total,
    byCategory: totals.byCategory,
    count: entries.length,
  };
}

export default {
  getVolunteeringWorkspace,
  createApplication,
  updateApplication,
  deleteApplication,
  createResponse,
  updateResponse,
  deleteResponse,
  createContract,
  updateContract,
  deleteContract,
  createSpend,
  updateSpend,
  deleteSpend,
  summariseVolunteeringSpend,
};
