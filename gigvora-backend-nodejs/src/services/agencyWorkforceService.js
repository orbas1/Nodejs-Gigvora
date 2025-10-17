import {
  AgencyAvailabilityEntry,
  AgencyCapacitySnapshot,
  AgencyGigDelegation,
  AgencyPayDelegation,
  AgencyProjectDelegation,
  AgencyWorkforceMember,
} from '../models/agencyWorkforceModels.js';
import { NotFoundError } from '../utils/errors.js';

function toPlain(record) {
  if (!record) return null;
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

function normaliseNumber(value, fallback = null) {
  if (value == null) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normaliseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function pickAllowed(source, fields) {
  return fields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      acc[field] = source[field];
    }
    return acc;
  }, {});
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

async function findMemberOrFail(memberId, { workspaceId } = {}) {
  const where = { id: memberId };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const member = await AgencyWorkforceMember.findOne({
    where,
  });
  if (!member) {
    throw new NotFoundError('Workforce member not found.');
  }
  return member;
}

async function findPayDelegationOrFail(id, { workspaceId } = {}) {
  const where = { id };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const record = await AgencyPayDelegation.findOne({ where });
  if (!record) {
    throw new NotFoundError('Pay delegation not found.');
  }
  return record;
}

async function findProjectDelegationOrFail(id, { workspaceId } = {}) {
  const where = { id };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const record = await AgencyProjectDelegation.findOne({ where });
  if (!record) {
    throw new NotFoundError('Project delegation not found.');
  }
  return record;
}

async function findGigDelegationOrFail(id, { workspaceId } = {}) {
  const where = { id };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const record = await AgencyGigDelegation.findOne({ where });
  if (!record) {
    throw new NotFoundError('Gig delegation not found.');
  }
  return record;
}

async function findAvailabilityOrFail(id, { workspaceId } = {}) {
  const where = { id };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const record = await AgencyAvailabilityEntry.findOne({ where });
  if (!record) {
    throw new NotFoundError('Availability record not found.');
  }
  return record;
}

async function findCapacitySnapshotOrFail(id, { workspaceId } = {}) {
  const where = { id };
  if (workspaceId != null) {
    where.workspaceId = workspaceId;
  }
  const record = await AgencyCapacitySnapshot.findOne({ where });
  if (!record) {
    throw new NotFoundError('Capacity snapshot not found.');
  }
  return record;
}

function computeSummary({ members, payDelegations, projectDelegations, gigDelegations, capacitySnapshots }) {
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

  const averageBillableRate = (() => {
    const rates = projectDelegations
      .map((delegation) => normaliseNumber(delegation.billableRate))
      .filter((value) => Number.isFinite(value));
    if (!rates.length) {
      return null;
    }
    return rates.reduce((sum, value) => sum + value, 0) / rates.length;
  })();

  return {
    totalMembers,
    activeMembers,
    onLeave,
    totalActiveAssignments,
    benchHours: Number(benchHours.toFixed(2)),
    utilizationPercent: normaliseNumber(utilization, 0),
    upcomingPayouts,
    averageBillableRate: averageBillableRate != null ? Number(averageBillableRate.toFixed(2)) : null,
  };
}

export async function getWorkforceDashboard({ workspaceId } = {}) {
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
        limit: 30,
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

  const serialisedMembers = members.map(serialiseMember);
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
  }));

  return {
    workspaceId: workspaceId ?? null,
    metrics,
    members: serialisedMembers,
    payDelegations,
    projectDelegations,
    gigDelegations,
    capacitySnapshots: serialisedCapacity,
    availability,
  };
}

export async function createWorkforceMember(payload) {
  const body = pickAllowed(payload, MEMBER_FIELDS);
  body.startDate = normaliseDate(body.startDate);
  body.endDate = normaliseDate(body.endDate);
  const member = await AgencyWorkforceMember.create(body);
  return serialiseMember(member);
}

export async function updateWorkforceMember(memberId, payload, { workspaceId } = {}) {
  const member = await findMemberOrFail(memberId, { workspaceId });
  const updates = pickAllowed(payload, MEMBER_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.endDate) updates.endDate = normaliseDate(updates.endDate);
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
  const record = await AgencyPayDelegation.create(body);
  return serialisePayDelegation(record);
}

export async function updatePayDelegation(id, payload, { workspaceId } = {}) {
  const record = await findPayDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, PAY_FIELDS);
  if (updates.nextPayDate) {
    updates.nextPayDate = normaliseDate(updates.nextPayDate);
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
  const record = await AgencyProjectDelegation.create(body);
  return serialiseProjectDelegation(record);
}

export async function updateProjectDelegation(id, payload, { workspaceId } = {}) {
  const record = await findProjectDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, PROJECT_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.endDate) updates.endDate = normaliseDate(updates.endDate);
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
  const record = await AgencyGigDelegation.create(body);
  return serialiseGigDelegation(record);
}

export async function updateGigDelegation(id, payload, { workspaceId } = {}) {
  const record = await findGigDelegationOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, GIG_FIELDS);
  if (updates.startDate) updates.startDate = normaliseDate(updates.startDate);
  if (updates.dueDate) updates.dueDate = normaliseDate(updates.dueDate);
  await record.update(updates);
  return serialiseGigDelegation(record);
}

export async function deleteGigDelegation(id, { workspaceId } = {}) {
  const record = await findGigDelegationOrFail(id, { workspaceId });
  await record.destroy();
}

export async function recordCapacitySnapshot(payload) {
  const body = pickAllowed(payload, CAPACITY_FIELDS);
  body.recordedFor = body.recordedFor ? body.recordedFor : new Date();
  const record = await AgencyCapacitySnapshot.create(body);
  return serialiseCapacitySnapshot(record);
}

export async function updateCapacitySnapshot(id, payload, { workspaceId } = {}) {
  const record = await findCapacitySnapshotOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, CAPACITY_FIELDS);
  if (updates.recordedFor) {
    updates.recordedFor = updates.recordedFor;
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
  const record = await AgencyAvailabilityEntry.create(body);
  return serialiseAvailabilityEntry(record);
}

export async function updateAvailabilityEntry(id, payload, { workspaceId } = {}) {
  const record = await findAvailabilityOrFail(id, { workspaceId });
  const updates = pickAllowed(payload, AVAILABILITY_FIELDS);
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
