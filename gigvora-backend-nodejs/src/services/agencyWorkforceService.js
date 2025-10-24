import {
  AgencyAvailabilityEntry,
  AgencyCapacitySnapshot,
  AgencyGigDelegation,
  AgencyPayDelegation,
  AgencyProjectDelegation,
  AgencyWorkforceMember,
} from '../models/agencyWorkforceModels.js';
import { NotFoundError } from '../utils/errors.js';
import {
  createScopedFinder,
  normaliseDate,
  normaliseNumber,
  pickAllowedFields,
  toPlain,
} from '../utils/recordNormalisers.js';

function pickAllowed(source, fields) {
  return pickAllowedFields(source, fields);
}

const MEMBER_FIELDS = [
  'workspaceId',
  'fullName',
  'title',
  'email',
  'phone',
  'location',
  'employmentType',
  'status',
  'startDate',
  'endDate',
  'hourlyRate',
  'billableRate',
  'costCenter',
  'capacityHoursPerWeek',
  'allocationPercent',
  'benchAllocationPercent',
  'skills',
  'avatarUrl',
  'notes',
  'metadata',
];

const PAY_FIELDS = [
  'workspaceId',
  'memberId',
  'frequency',
  'amount',
  'currency',
  'status',
  'nextPayDate',
  'payoutMethod',
  'approverId',
  'memo',
  'metadata',
];

const PROJECT_FIELDS = [
  'workspaceId',
  'memberId',
  'projectId',
  'projectName',
  'clientName',
  'assignmentType',
  'status',
  'startDate',
  'endDate',
  'allocationPercent',
  'billableRate',
  'notes',
  'metadata',
];

const GIG_FIELDS = [
  'workspaceId',
  'memberId',
  'gigId',
  'gigName',
  'status',
  'deliverables',
  'startDate',
  'dueDate',
  'allocationPercent',
  'notes',
  'metadata',
];

const CAPACITY_FIELDS = [
  'workspaceId',
  'recordedFor',
  'totalHeadcount',
  'activeAssignments',
  'availableHours',
  'allocatedHours',
  'benchHours',
  'utilizationPercent',
  'notes',
  'metadata',
];

const AVAILABILITY_FIELDS = ['workspaceId', 'memberId', 'date', 'status', 'availableHours', 'reason', 'metadata'];

function serialiseMember(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    hourlyRate: normaliseNumber(plain.hourlyRate),
    billableRate: normaliseNumber(plain.billableRate),
    capacityHoursPerWeek: normaliseNumber(plain.capacityHoursPerWeek, 0),
    allocationPercent: normaliseNumber(plain.allocationPercent, 0),
    benchAllocationPercent: normaliseNumber(plain.benchAllocationPercent, 0),
    payDelegations: (plain.payDelegations ?? []).map(serialisePayDelegation),
    projectDelegations: (plain.projectDelegations ?? []).map(serialiseProjectDelegation),
    gigDelegations: (plain.gigDelegations ?? []).map(serialiseGigDelegation),
    availabilityEntries: (plain.availabilityEntries ?? []).map(serialiseAvailabilityEntry),
  };
}

function serialisePayDelegation(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    amount: normaliseNumber(plain.amount, 0),
  };
}

function serialiseProjectDelegation(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    allocationPercent: normaliseNumber(plain.allocationPercent, 0),
    billableRate: normaliseNumber(plain.billableRate),
  };
}

function serialiseGigDelegation(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    allocationPercent: normaliseNumber(plain.allocationPercent, 0),
  };
}

function serialiseCapacitySnapshot(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    totalHeadcount: normaliseNumber(plain.totalHeadcount, 0),
    activeAssignments: normaliseNumber(plain.activeAssignments, 0),
    availableHours: normaliseNumber(plain.availableHours, 0),
    allocatedHours: normaliseNumber(plain.allocatedHours, 0),
    benchHours: normaliseNumber(plain.benchHours, 0),
    utilizationPercent: normaliseNumber(plain.utilizationPercent, 0),
  };
}

function serialiseAvailabilityEntry(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    ...plain,
    availableHours: normaliseNumber(plain.availableHours, null),
  };
}

const findMemberOrFail = createScopedFinder(AgencyWorkforceMember, {
  errorFactory: () => new NotFoundError('Workforce member not found.'),
});

const findPayDelegationOrFail = createScopedFinder(AgencyPayDelegation, {
  errorFactory: () => new NotFoundError('Pay delegation not found.'),
});

const findProjectDelegationOrFail = createScopedFinder(AgencyProjectDelegation, {
  errorFactory: () => new NotFoundError('Project delegation not found.'),
});

const findGigDelegationOrFail = createScopedFinder(AgencyGigDelegation, {
  errorFactory: () => new NotFoundError('Gig delegation not found.'),
});

const findAvailabilityOrFail = createScopedFinder(AgencyAvailabilityEntry, {
  errorFactory: () => new NotFoundError('Availability record not found.'),
});

const findCapacitySnapshotOrFail = createScopedFinder(AgencyCapacitySnapshot, {
  errorFactory: () => new NotFoundError('Capacity snapshot not found.'),
});

function normaliseCurrency(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function resolveDelegationCurrency(delegation, fallbackCurrency = 'USD') {
  if (!delegation) return fallbackCurrency;
  const metadata = delegation.metadata ?? {};
  return (
    normaliseCurrency(delegation.currency) ||
    normaliseCurrency(delegation.currencyCode) ||
    normaliseCurrency(metadata.currency) ||
    normaliseCurrency(metadata.currencyCode) ||
    normaliseCurrency(metadata.billableCurrency) ||
    fallbackCurrency
  );
}

function detectBaseCurrency({ projectDelegations = [], payDelegations = [], fallback = 'USD' } = {}) {
  const payCurrency = payDelegations
    .map((delegation) => normaliseCurrency(delegation.currency))
    .find((currency) => currency);
  if (payCurrency) return payCurrency;

  const projectCurrency = projectDelegations
    .map((delegation) => resolveDelegationCurrency(delegation))
    .find((currency) => currency);
  return projectCurrency ?? fallback;
}

function buildCurrencyRates(currencyRates, baseCurrency) {
  const rates = Object.entries(currencyRates ?? {}).reduce((acc, [currency, rate]) => {
    const code = normaliseCurrency(currency);
    const numeric = normaliseNumber(rate);
    if (code && Number.isFinite(numeric)) {
      acc[code] = numeric;
    }
    return acc;
  }, {});
  if (!rates[baseCurrency]) {
    rates[baseCurrency] = 1;
  }
  return rates;
}

function convertToBaseCurrency(amount, currency, baseCurrency, currencyRates) {
  const numericAmount = normaliseNumber(amount);
  if (!Number.isFinite(numericAmount)) {
    return null;
  }
  const resolvedCurrency = normaliseCurrency(currency) ?? baseCurrency;
  if (resolvedCurrency === baseCurrency) {
    return numericAmount;
  }
  const factor = currencyRates[resolvedCurrency];
  if (factor == null) {
    return null;
  }
  return numericAmount * factor;
}

function computeBillableRateAverages(projectDelegations, { baseCurrency, currencyRates }) {
  const perCurrency = new Map();
  const unsupportedCurrencies = new Set();
  let baseSum = 0;
  let baseCount = 0;

  projectDelegations.forEach((delegation) => {
    const rate = normaliseNumber(delegation.billableRate);
    if (!Number.isFinite(rate)) {
      return;
    }
    const currency = resolveDelegationCurrency(delegation, baseCurrency);
    const entry = perCurrency.get(currency) ?? { sum: 0, count: 0 };
    entry.sum += rate;
    entry.count += 1;
    perCurrency.set(currency, entry);

    const converted = convertToBaseCurrency(rate, currency, baseCurrency, currencyRates);
    if (converted == null) {
      if (currency !== baseCurrency) {
        unsupportedCurrencies.add(currency);
      }
      return;
    }
    baseSum += converted;
    baseCount += 1;
  });

  const perCurrencyAverages = {};
  perCurrency.forEach((entry, currency) => {
    perCurrencyAverages[currency] = Number((entry.sum / entry.count).toFixed(2));
  });

  const average = baseCount > 0 ? Number((baseSum / baseCount).toFixed(2)) : null;

  return {
    baseCurrency,
    average,
    perCurrency: perCurrencyAverages,
    unsupportedCurrencies: Array.from(unsupportedCurrencies),
    samples: baseCount,
  };
}

function computeUtilizationForecast(capacitySnapshots, { lookbackPeriods = 6, forecastHorizon = 1 } = {}) {
  const samples = (capacitySnapshots ?? [])
    .map((snapshot) => ({
      recordedFor: snapshot.recordedFor,
      utilizationPercent: normaliseNumber(snapshot.utilizationPercent),
    }))
    .filter((entry) => Number.isFinite(entry.utilizationPercent))
    .sort((a, b) => new Date(a.recordedFor) - new Date(b.recordedFor))
    .slice(-lookbackPeriods);

  if (samples.length === 0) {
    return { forecastedUtilizationPercent: null, slopePerPeriod: 0, trend: 'flat', samples: 0 };
  }

  if (samples.length === 1) {
    const value = Number(samples[0].utilizationPercent.toFixed(2));
    return { forecastedUtilizationPercent: value, slopePerPeriod: 0, trend: 'flat', samples: 1 };
  }

  const xValues = samples.map((_, index) => index + 1);
  const yValues = samples.map((sample) => sample.utilizationPercent);

  const sumX = xValues.reduce((sum, value) => sum + value, 0);
  const sumY = yValues.reduce((sum, value) => sum + value, 0);
  const sumXY = xValues.reduce((sum, value, index) => sum + value * yValues[index], 0);
  const sumXX = xValues.reduce((sum, value) => sum + value * value, 0);
  const n = samples.length;

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;
  const nextX = xValues[xValues.length - 1] + forecastHorizon;
  let forecast = intercept + slope * nextX;
  if (!Number.isFinite(forecast)) {
    forecast = samples[samples.length - 1].utilizationPercent;
  }
  const boundedForecast = Math.min(100, Math.max(0, forecast));
  const slopePerPeriod = Number(slope.toFixed(4));
  const trend = slopePerPeriod > 0.5 ? 'upward' : slopePerPeriod < -0.5 ? 'downward' : 'flat';

  return {
    forecastedUtilizationPercent: Number(boundedForecast.toFixed(2)),
    slopePerPeriod,
    trend,
    samples: n,
  };
}

function computeSummary(
  { members, payDelegations, projectDelegations, gigDelegations, capacitySnapshots },
  { baseCurrency, currencyRates, forecastOptions } = {},
) {
  const totalMembers = members.length;
  const activeMembers = members.filter((member) => member.status === 'active').length;
  const onLeave = members.filter((member) => member.status === 'on_leave').length;
  const benchHours = members.reduce((total, member) => {
    const capacity = normaliseNumber(member.capacityHoursPerWeek, 0);
    const allocation = normaliseNumber(member.allocationPercent, 0) / 100;
    const bench = capacity * (1 - allocation);
    return total + (Number.isFinite(bench) ? bench : 0);
  }, 0);

  const activeProjectDelegations = projectDelegations.filter((delegation) =>
    ['active', 'in_progress'].includes(`${delegation.status}`.toLowerCase()),
  );
  const activeGigDelegations = gigDelegations.filter((delegation) =>
    ['in_delivery', 'review', 'active'].includes(`${delegation.status}`.toLowerCase()),
  );
  const totalActiveAssignments = activeProjectDelegations.length + activeGigDelegations.length;

  const upcomingPayouts = payDelegations.filter((delegation) => {
    const status = `${delegation.status}`.toLowerCase();
    if (!['scheduled', 'processing'].includes(status)) {
      return false;
    }
    if (!delegation.nextPayDate) {
      return false;
    }
    const next = new Date(delegation.nextPayDate);
    if (Number.isNaN(next.getTime())) {
      return false;
    }
    const today = new Date();
    const horizon = new Date();
    horizon.setDate(today.getDate() + 14);
    return next >= today && next <= horizon;
  }).length;

  const latestSnapshot = capacitySnapshots[0] ?? null;
  const utilization = latestSnapshot?.utilizationPercent ?? 0;

  const resolvedBaseCurrency = baseCurrency ||
    detectBaseCurrency({ projectDelegations, payDelegations, fallback: 'USD' });
  const resolvedRates = buildCurrencyRates(currencyRates, resolvedBaseCurrency);
  const billableRateSummary = computeBillableRateAverages(projectDelegations, {
    baseCurrency: resolvedBaseCurrency,
    currencyRates: resolvedRates,
  });
  const forecasting = computeUtilizationForecast(capacitySnapshots, forecastOptions);

  return {
    totalMembers,
    activeMembers,
    onLeave,
    totalActiveAssignments,
    benchHours: Number(benchHours.toFixed(2)),
    utilizationPercent: normaliseNumber(utilization, 0),
    upcomingPayouts,
    averageBillableRate: billableRateSummary.average,
    averageBillableRateCurrency: resolvedBaseCurrency,
    averageBillableRateBreakdown: billableRateSummary,
    forecasting,
  };
}

export async function getWorkforceDashboard({
  workspaceId,
  availabilityLimit,
  baseCurrency,
  currencyRates,
  forecastOptions,
} = {}) {
  const parsedAvailabilityLimit = Number.isFinite(Number(availabilityLimit))
    ? Number(availabilityLimit)
    : 30;
  const safeAvailabilityLimit = Math.max(5, Math.min(parsedAvailabilityLimit || 30, 120));
  const memberWhere = {};
  if (workspaceId != null) {
    memberWhere.workspaceId = workspaceId;
  }

  const members = await AgencyWorkforceMember.findAll({
    where: memberWhere,
    include: [
      { model: AgencyPayDelegation, as: 'payDelegations', separate: true, order: [['nextPayDate', 'ASC']] },
      { model: AgencyProjectDelegation, as: 'projectDelegations', separate: true, order: [['startDate', 'DESC']] },
      { model: AgencyGigDelegation, as: 'gigDelegations', separate: true, order: [['startDate', 'DESC']] },
      {
        model: AgencyAvailabilityEntry,
        as: 'availabilityEntries',
        separate: true,
        limit: safeAvailabilityLimit + 1,
        order: [['date', 'DESC']],
      },
    ],
    order: [['fullName', 'ASC']],
  });

  const capacitySnapshots = await AgencyCapacitySnapshot.findAll({
    where: workspaceId != null ? { workspaceId } : undefined,
    order: [['recordedFor', 'DESC']],
    limit: 24,
  });

  const availabilityMeta = new Map();
  const serialisedMembers = members.map((memberRecord) => {
    const serialised = serialiseMember(memberRecord);
    if (!serialised) return null;
    const entries = Array.isArray(serialised.availabilityEntries)
      ? [...serialised.availabilityEntries]
      : [];
    const hasMore = entries.length > safeAvailabilityLimit;
    if (hasMore) {
      serialised.availabilityEntries = entries.slice(0, safeAvailabilityLimit);
    }
    availabilityMeta.set(serialised.id, {
      hasMore,
      returned: serialised.availabilityEntries?.length ?? 0,
      totalFetched: entries.length,
      nextCursor: hasMore ? entries[safeAvailabilityLimit - 1]?.date ?? null : null,
    });
    return serialised;
  }).filter(Boolean);
  const payDelegations = serialisedMembers.flatMap((member) => member.payDelegations ?? []);
  const projectDelegations = serialisedMembers.flatMap((member) => member.projectDelegations ?? []);
  const gigDelegations = serialisedMembers.flatMap((member) => member.gigDelegations ?? []);
  const availabilityEntries = serialisedMembers.flatMap((member) => member.availabilityEntries ?? []);
  const serialisedCapacity = capacitySnapshots.map(serialiseCapacitySnapshot);

  const metrics = computeSummary({
    members: serialisedMembers,
    payDelegations,
    projectDelegations,
    gigDelegations,
    capacitySnapshots: serialisedCapacity,
  }, {
    baseCurrency,
    currencyRates,
    forecastOptions,
  });

  const availabilityByMember = availabilityEntries.reduce((acc, entry) => {
    const memberId = entry.memberId;
    if (!acc.has(memberId)) {
      acc.set(memberId, []);
    }
    acc.get(memberId).push(entry);
    return acc;
  }, new Map());

  const availability = Array.from(availabilityByMember.entries()).map(([memberId, entries]) => ({
    memberId,
    entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date)),
    hasMore: availabilityMeta.get(memberId)?.hasMore ?? false,
    nextCursor: availabilityMeta.get(memberId)?.nextCursor ?? null,
  }));

  const availabilityPagination = {
    perMemberLimit: safeAvailabilityLimit,
    membersWithAdditionalEntries: availability
      .filter((entry) => entry.hasMore)
      .map((entry) => ({ memberId: entry.memberId, nextCursor: entry.nextCursor })),
  };

  return {
    workspaceId: workspaceId ?? null,
    metrics,
    members: serialisedMembers,
    payDelegations,
    projectDelegations,
    gigDelegations,
    capacitySnapshots: serialisedCapacity,
    availability,
    availabilityPagination,
  };
}

export async function createWorkforceMember(payload) {
  const body = pickAllowed(payload, MEMBER_FIELDS);
  body.startDate = normaliseDate(body.startDate);
  body.endDate = normaliseDate(body.endDate);
  body.hourlyRate = normaliseNumber(body.hourlyRate, null);
  body.billableRate = normaliseNumber(body.billableRate, null);
  body.capacityHoursPerWeek = normaliseNumber(body.capacityHoursPerWeek, 0);
  body.allocationPercent = normaliseNumber(body.allocationPercent, 0);
  body.benchAllocationPercent = normaliseNumber(body.benchAllocationPercent, 0);
  const member = await AgencyWorkforceMember.create(body);
  return serialiseMember(member);
}

export async function updateWorkforceMember(memberId, payload, { workspaceId } = {}) {
  const member = await findMemberOrFail(memberId, { workspaceId });
  const updates = pickAllowed(payload, MEMBER_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.endDate) updates.endDate = normaliseDate(updates.endDate);
  if (Object.prototype.hasOwnProperty.call(updates, 'hourlyRate')) {
    updates.hourlyRate = normaliseNumber(updates.hourlyRate, null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'billableRate')) {
    updates.billableRate = normaliseNumber(updates.billableRate, null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'capacityHoursPerWeek')) {
    updates.capacityHoursPerWeek = normaliseNumber(updates.capacityHoursPerWeek, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'allocationPercent')) {
    updates.allocationPercent = normaliseNumber(updates.allocationPercent, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'benchAllocationPercent')) {
    updates.benchAllocationPercent = normaliseNumber(updates.benchAllocationPercent, 0);
  }
  await member.update(updates);
  const fresh = await AgencyWorkforceMember.findByPk(member.id, {
    include: [
      { model: AgencyPayDelegation, as: 'payDelegations', separate: true },
      { model: AgencyProjectDelegation, as: 'projectDelegations', separate: true },
      { model: AgencyGigDelegation, as: 'gigDelegations', separate: true },
      { model: AgencyAvailabilityEntry, as: 'availabilityEntries', separate: true },
    ],
  });
  return serialiseMember(fresh ?? member);
}

export async function deleteWorkforceMember(memberId, { workspaceId } = {}) {
  const member = await findMemberOrFail(memberId, { workspaceId });
  await member.destroy();
}

export async function createPayDelegation(payload) {
  const body = pickAllowed(payload, PAY_FIELDS);
  body.nextPayDate = normaliseDate(body.nextPayDate);
  body.amount = normaliseNumber(body.amount, 0);
  const record = await AgencyPayDelegation.create(body);
  return serialisePayDelegation(record);
}

export async function updatePayDelegation(id, payload, { workspaceId } = {}) {
  const record = await findPayDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, PAY_FIELDS);
  if (updates.nextPayDate) {
    updates.nextPayDate = normaliseDate(updates.nextPayDate);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'amount')) {
    updates.amount = normaliseNumber(updates.amount, 0);
  }
  await record.update(updates);
  return serialisePayDelegation(record);
}

export async function deletePayDelegation(id, { workspaceId } = {}) {
  const record = await findPayDelegationOrFail(id, { workspaceId });
  await record.destroy();
}

export async function createProjectDelegation(payload) {
  const body = pickAllowed(payload, PROJECT_FIELDS);
  body.startDate = normaliseDate(body.startDate);
  body.endDate = normaliseDate(body.endDate);
  body.allocationPercent = normaliseNumber(body.allocationPercent, 0);
  body.billableRate = normaliseNumber(body.billableRate, null);
  const record = await AgencyProjectDelegation.create(body);
  return serialiseProjectDelegation(record);
}

export async function updateProjectDelegation(id, payload, { workspaceId } = {}) {
  const record = await findProjectDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, PROJECT_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.endDate) updates.endDate = normaliseDate(updates.endDate);
  if (Object.prototype.hasOwnProperty.call(updates, 'allocationPercent')) {
    updates.allocationPercent = normaliseNumber(updates.allocationPercent, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'billableRate')) {
    updates.billableRate = normaliseNumber(updates.billableRate, null);
  }
  await record.update(updates);
  return serialiseProjectDelegation(record);
}

export async function deleteProjectDelegation(id, { workspaceId } = {}) {
  const record = await findProjectDelegationOrFail(id, { workspaceId });
  await record.destroy();
}

export async function createGigDelegation(payload) {
  const body = pickAllowed(payload, GIG_FIELDS);
  body.startDate = normaliseDate(body.startDate);
  body.dueDate = normaliseDate(body.dueDate);
  body.allocationPercent = normaliseNumber(body.allocationPercent, 0);
  const record = await AgencyGigDelegation.create(body);
  return serialiseGigDelegation(record);
}

export async function updateGigDelegation(id, payload, { workspaceId } = {}) {
  const record = await findGigDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, GIG_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.dueDate) updates.dueDate = normaliseDate(updates.dueDate);
  if (Object.prototype.hasOwnProperty.call(updates, 'allocationPercent')) {
    updates.allocationPercent = normaliseNumber(updates.allocationPercent, 0);
  }
  await record.update(updates);
  return serialiseGigDelegation(record);
}

export async function deleteGigDelegation(id, { workspaceId } = {}) {
  const record = await findGigDelegationOrFail(id, { workspaceId });
  await record.destroy();
}

export async function recordCapacitySnapshot(payload) {
  const body = pickAllowed(payload, CAPACITY_FIELDS);
  body.recordedFor = normaliseDate(body.recordedFor) ?? new Date();
  body.totalHeadcount = normaliseNumber(body.totalHeadcount, 0);
  body.activeAssignments = normaliseNumber(body.activeAssignments, 0);
  body.availableHours = normaliseNumber(body.availableHours, 0);
  body.allocatedHours = normaliseNumber(body.allocatedHours, 0);
  body.benchHours = normaliseNumber(body.benchHours, 0);
  body.utilizationPercent = normaliseNumber(body.utilizationPercent, 0);
  const record = await AgencyCapacitySnapshot.create(body);
  return serialiseCapacitySnapshot(record);
}

export async function updateCapacitySnapshot(id, payload, { workspaceId } = {}) {
  const record = await findCapacitySnapshotOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, CAPACITY_FIELDS);
  if (updates.recordedFor) {
    updates.recordedFor = normaliseDate(updates.recordedFor);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'totalHeadcount')) {
    updates.totalHeadcount = normaliseNumber(updates.totalHeadcount, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'activeAssignments')) {
    updates.activeAssignments = normaliseNumber(updates.activeAssignments, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'availableHours')) {
    updates.availableHours = normaliseNumber(updates.availableHours, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'allocatedHours')) {
    updates.allocatedHours = normaliseNumber(updates.allocatedHours, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'benchHours')) {
    updates.benchHours = normaliseNumber(updates.benchHours, 0);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'utilizationPercent')) {
    updates.utilizationPercent = normaliseNumber(updates.utilizationPercent, 0);
  }
  await record.update(updates);
  return serialiseCapacitySnapshot(record);
}

export async function deleteCapacitySnapshot(id, { workspaceId } = {}) {
  const record = await findCapacitySnapshotOrFail(id, { workspaceId });
  await record.destroy();
}

export async function createAvailabilityEntry(payload) {
  const body = pickAllowed(payload, AVAILABILITY_FIELDS);
  body.date = normaliseDate(body.date) ?? new Date();
  body.availableHours = normaliseNumber(body.availableHours, null);
  const record = await AgencyAvailabilityEntry.create(body);
  return serialiseAvailabilityEntry(record);
}

export async function updateAvailabilityEntry(id, payload, { workspaceId } = {}) {
  const record = await findAvailabilityOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, AVAILABILITY_FIELDS);
  if (updates.date) {
    updates.date = normaliseDate(updates.date);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'availableHours')) {
    updates.availableHours = normaliseNumber(updates.availableHours, null);
  }
  await record.update(updates);
  return serialiseAvailabilityEntry(record);
}

export async function deleteAvailabilityEntry(id, { workspaceId } = {}) {
  const record = await findAvailabilityOrFail(id, { workspaceId });
  await record.destroy();
}

export async function listMembers({ workspaceId, status } = {}) {
  const where = {};
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  if (status) {
    where.status = status;
  }
  const members = await AgencyWorkforceMember.findAll({
    where,
    order: [['fullName', 'ASC']],
  });
  return members.map(serialiseMember);
}

export async function listPayDelegations({ workspaceId, status } = {}) {
  const where = {};
  if (workspaceId != null) where.workspaceId = workspaceId;
  if (status) where.status = status;
  const records = await AgencyPayDelegation.findAll({
    where,
    order: [['nextPayDate', 'ASC']],
  });
  return records.map(serialisePayDelegation);
}

export async function listProjectDelegations({ workspaceId, status } = {}) {
  const where = {};
  if (workspaceId != null) where.workspaceId = workspaceId;
  if (status) where.status = status;
  const records = await AgencyProjectDelegation.findAll({
    where,
    order: [['startDate', 'DESC']],
  });
  return records.map(serialiseProjectDelegation);
}

export async function listGigDelegations({ workspaceId, status } = {}) {
  const where = {};
  if (workspaceId != null) where.workspaceId = workspaceId;
  if (status) where.status = status;
  const records = await AgencyGigDelegation.findAll({
    where,
    order: [['startDate', 'DESC']],
  });
  return records.map(serialiseGigDelegation);
}

export async function listCapacitySnapshots({ workspaceId } = {}) {
  const where = {};
  if (workspaceId != null) where.workspaceId = workspaceId;
  const records = await AgencyCapacitySnapshot.findAll({
    where,
    order: [['recordedFor', 'DESC']],
  });
  return records.map(serialiseCapacitySnapshot);
}

export async function listAvailabilityEntries({ workspaceId, memberId } = {}) {
  const where = {};
  if (workspaceId != null) where.workspaceId = workspaceId;
  if (memberId != null) where.memberId = memberId;
  const records = await AgencyAvailabilityEntry.findAll({
    where,
    order: [['date', 'DESC']],
  });
  return records.map(serialiseAvailabilityEntry);
}

export default {
  getWorkforceDashboard,
  createWorkforceMember,
  updateWorkforceMember,
  deleteWorkforceMember,
  createPayDelegation,
  updatePayDelegation,
  deletePayDelegation,
  createProjectDelegation,
  updateProjectDelegation,
  deleteProjectDelegation,
  createGigDelegation,
  updateGigDelegation,
  deleteGigDelegation,
  recordCapacitySnapshot,
  updateCapacitySnapshot,
  deleteCapacitySnapshot,
  createAvailabilityEntry,
  updateAvailabilityEntry,
  deleteAvailabilityEntry,
  listMembers,
  listPayDelegations,
  listProjectDelegations,
  listGigDelegations,
  listCapacitySnapshots,
  listAvailabilityEntries,
};

export const __internals = {
  serialiseMember,
  serialisePayDelegation,
  serialiseProjectDelegation,
  serialiseGigDelegation,
  serialiseCapacitySnapshot,
  serialiseAvailabilityEntry,
  normaliseCurrency,
  resolveDelegationCurrency,
  detectBaseCurrency,
  buildCurrencyRates,
  convertToBaseCurrency,
  computeBillableRateAverages,
  computeUtilizationForecast,
  computeSummary,
};
