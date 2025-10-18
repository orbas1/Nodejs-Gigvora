import { Op, fn, col } from 'sequelize';
import {
  Volunteering,
  VolunteerProgram,
  VolunteerShift,
  VolunteerAssignment,
  VOLUNTEER_ROLE_STATUSES,
  VOLUNTEER_SHIFT_STATUSES,
  VOLUNTEER_ASSIGNMENT_STATUSES,
  VOLUNTEER_PROGRAM_STATUSES,
  User,
} from '../models/index.js';
import { normaliseStringArray } from '../utils/string.js';

const DEFAULT_PAGE_SIZE = 20;

function parsePage(value) {
  const parsed = Number.parseInt(value ?? 1, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value) {
  const parsed = Number.parseInt(value ?? DEFAULT_PAGE_SIZE, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, 100);
}

function coerceStatus(value, validStatuses) {
  if (typeof value !== 'string') {
    return null;
  }
  const normalised = value.trim().toLowerCase();
  return validStatuses.find((status) => status === normalised) ?? null;
}

function normaliseTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .map((tag) => {
      if (typeof tag !== 'string') {
        return null;
      }
      const trimmed = tag.trim();
      return trimmed ? trimmed.slice(0, 120) : null;
    })
    .filter(Boolean);
}

function normaliseRequirementItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed ? { label: trimmed } : null;
      }
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!label) {
        return null;
      }
      const type = typeof item.type === 'string' ? item.type.trim().toLowerCase() : undefined;
      return {
        label: label.slice(0, 200),
        type: type && ['skill', 'check', 'note'].includes(type) ? type : undefined,
      };
    })
    .filter(Boolean);
}

function buildPaginationMeta(totalItems, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  return { page: currentPage, pageSize, totalPages, totalItems };
}

function computeLocationBucket(role) {
  const remoteType = typeof role.remoteType === 'string' ? role.remoteType.toLowerCase() : '';
  if (remoteType === 'remote') {
    return 'remote';
  }
  if (remoteType === 'hybrid') {
    return 'hybrid';
  }
  if (remoteType === 'onsite') {
    return 'onsite';
  }
  return role.location ? 'onsite' : 'unspecified';
}

function calculateAverageCommitment(roles) {
  if (!roles.length) {
    return 0;
  }
  const totals = roles.reduce(
    (acc, role) => {
      const hours = Number.parseFloat(role.commitmentHours ?? 0);
      if (Number.isFinite(hours) && hours > 0) {
        return { count: acc.count + 1, sum: acc.sum + hours };
      }
      return acc;
    },
    { count: 0, sum: 0 },
  );
  if (!totals.count) {
    return 0;
  }
  return totals.sum / totals.count;
}

function pickRecentRoles(roles) {
  return roles
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)
    .map((role) => ({
      id: role.id,
      title: role.title,
      organization: role.organization,
      status: role.status,
      updatedAt: role.updatedAt,
      publishedAt: role.publishedAt,
    }));
}

export async function getVolunteeringInsights() {
  const now = new Date();
  const upcomingCutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [statusRows, totalRoles, roles, upcomingShifts, tagRows] = await Promise.all([
    Volunteering.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    Volunteering.count(),
    Volunteering.findAll({
      attributes: [
        'id',
        'title',
        'organization',
        'status',
        'remoteType',
        'location',
        'commitmentHours',
        'accessRoles',
        'tags',
        'publishedAt',
        'updatedAt',
      ],
      order: [['updatedAt', 'DESC']],
    }),
    VolunteerShift.findAll({
      where: {
        shiftDate: { [Op.gte]: now },
        status: { [Op.notIn]: ['cancelled'] },
      },
      limit: 8,
      order: [
        ['shiftDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
      include: [
        {
          model: Volunteering,
          as: 'role',
          attributes: ['id', 'title', 'organization'],
        },
      ],
    }),
    Volunteering.findAll({
      attributes: [[fn('UNNEST', col('tags')), 'tag']],
      where: { tags: { [Op.ne]: null } },
      raw: true,
    }).catch(() => []),
  ]);

  const statusBreakdown = statusRows.reduce((acc, row) => {
    const key = row.status ?? 'draft';
    acc[key] = Number.parseInt(row.count, 10) || 0;
    return acc;
  }, {});

  const locationBreakdown = roles.reduce((acc, role) => {
    const bucket = computeLocationBucket(role);
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});

  const accessBreakdown = roles.reduce((acc, role) => {
    const access = normaliseStringArray(role.accessRoles);
    if (!access.length) {
      acc.open = (acc.open ?? 0) + 1;
    } else {
      access.forEach((item) => {
        acc[item] = (acc[item] ?? 0) + 1;
      });
    }
    return acc;
  }, {});

  const tagHighlights = tagRows
    .filter((row) => typeof row.tag === 'string' && row.tag.trim())
    .reduce((acc, row) => {
      const tag = row.tag.trim();
      acc.set(tag, (acc.get(tag) ?? 0) + 1);
      return acc;
    }, new Map());

  const upcoming = upcomingShifts.map((shift) => ({
    id: shift.id,
    title: shift.title,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    timezone: shift.timezone,
    location: shift.location,
    capacity: shift.capacity,
    volunteersNeeded: shift.capacity ? Math.max(shift.capacity - (shift.reserved ?? 0), 0) : null,
    status: shift.status,
    notes: shift.notes,
    role: shift.role
      ? {
          id: shift.role.id,
          title: shift.role.title,
          organization: shift.role.organization,
        }
      : null,
  }));

  const averageCommitment = calculateAverageCommitment(roles);

  return {
    totals: {
      roles: totalRoles,
      open: statusBreakdown.open ?? 0,
      draft: statusBreakdown.draft ?? 0,
      upcomingShifts: upcoming.length,
    },
    statusBreakdown,
    locationBreakdown,
    accessBreakdown,
    averageCommitmentHours: averageCommitment,
    upcomingShifts: upcoming,
    recentRoles: pickRecentRoles(roles),
    tagHighlights: Array.from(tagHighlights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
    lastUpdatedAt: new Date(),
  };
}

export async function listPrograms(options = {}) {
  const page = parsePage(options.page);
  const pageSize = parsePageSize(options.pageSize);
  const status = coerceStatus(options.status, VOLUNTEER_PROGRAM_STATUSES);
  const search = typeof options.search === 'string' ? options.search.trim() : '';

  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.name = { [Op.iLike ?? Op.like]: `%${search}%` };
  }

  const { rows, count } = await VolunteerProgram.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: Volunteering,
        as: 'roles',
        attributes: ['id'],
      },
      {
        model: VolunteerShift,
        as: 'shifts',
        attributes: ['id'],
      },
    ],
  });

  const items = rows.map((program) => ({
    id: program.id,
    name: program.name,
    status: program.status,
    summary: program.summary,
    location: program.location,
    tags: program.tags ?? [],
    startsAt: program.startsAt,
    endsAt: program.endsAt,
    maxVolunteers: program.maxVolunteers,
    contactEmail: program.contactEmail,
    contactPhone: program.contactPhone,
    roleCount: Array.isArray(program.roles) ? program.roles.length : 0,
    shiftCount: Array.isArray(program.shifts) ? program.shifts.length : 0,
    updatedAt: program.updatedAt,
  }));

  return {
    items,
    pagination: buildPaginationMeta(count, page, pageSize),
  };
}

export async function getProgram(programId) {
  const program = await VolunteerProgram.findByPk(programId, {
    include: [
      { model: Volunteering, as: 'roles' },
      { model: VolunteerShift, as: 'shifts' },
    ],
  });
  if (!program) {
    throw new Error('Program not found');
  }
  return program;
}

export async function createProgram(payload) {
  const tags = normaliseTags(payload.tags);
  return VolunteerProgram.create({
    name: payload.name.trim(),
    summary: payload.summary?.trim() || null,
    status: coerceStatus(payload.status, VOLUNTEER_PROGRAM_STATUSES) ?? 'draft',
    contactEmail: payload.contactEmail?.trim() || null,
    contactPhone: payload.contactPhone?.trim() || null,
    location: payload.location?.trim() || null,
    tags: tags.length ? tags : null,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
    endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
    maxVolunteers: Number.isFinite(payload.maxVolunteers)
      ? Number.parseInt(payload.maxVolunteers, 10)
      : payload.maxVolunteers === ''
      ? null
      : null,
  });
}

export async function updateProgram(programId, payload) {
  const program = await VolunteerProgram.findByPk(programId);
  if (!program) {
    throw new Error('Program not found');
  }
  const tags = normaliseTags(payload.tags);
  await program.update({
    name: payload.name?.trim() ?? program.name,
    summary: payload.summary?.trim() ?? program.summary,
    status: coerceStatus(payload.status, VOLUNTEER_PROGRAM_STATUSES) ?? program.status,
    contactEmail: payload.contactEmail?.trim() || null,
    contactPhone: payload.contactPhone?.trim() || null,
    location: payload.location?.trim() || null,
    tags: tags.length ? tags : null,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
    endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
    maxVolunteers: Number.isFinite(payload.maxVolunteers)
      ? Number.parseInt(payload.maxVolunteers, 10)
      : payload.maxVolunteers === ''
      ? null
      : program.maxVolunteers,
  });
  return program.reload();
}

export async function deleteProgram(programId) {
  const program = await VolunteerProgram.findByPk(programId);
  if (!program) {
    throw new Error('Program not found');
  }
  const roleCount = await Volunteering.count({ where: { programId } });
  if (roleCount > 0) {
    throw new Error('Program still has roles attached');
  }
  await VolunteerShift.destroy({ where: { programId } });
  await program.destroy();
}

function buildRolePayload(payload) {
  const status = coerceStatus(payload.status, VOLUNTEER_ROLE_STATUSES) ?? 'draft';
  const remoteType = typeof payload.remoteType === 'string' ? payload.remoteType.trim().toLowerCase() : null;
  const normalizedRemote = ['remote', 'hybrid', 'onsite'].includes(remoteType) ? remoteType : null;
  const commitmentHours = Number.parseFloat(payload.commitmentHours ?? payload.commitmentHoursPerWeek);
  const parsedCommitment = Number.isFinite(commitmentHours) ? commitmentHours : null;
  const spots = Number.parseInt(payload.spots ?? payload.capacity, 10);
  const parsedSpots = Number.isInteger(spots) && spots >= 0 ? spots : null;
  const tags = normaliseTags(payload.tags);
  const accessRoles = normaliseStringArray(payload.accessRoles);

  return {
    programId: payload.programId || null,
    title: payload.title.trim(),
    organization: payload.organization.trim(),
    summary: payload.summary?.trim() || null,
    description: payload.description?.trim() || null,
    location: payload.location?.trim() || null,
    status,
    remoteType: normalizedRemote,
    commitmentHours: parsedCommitment,
    applicationUrl: payload.applicationUrl?.trim() || null,
    applicationDeadline: payload.applicationDeadline ? new Date(payload.applicationDeadline) : null,
    spots: parsedSpots,
    skills: normaliseTags(payload.skills ?? payload.skillTags ?? []),
    requirements: normaliseRequirementItems(payload.requirements ?? payload.requirementItems ?? []),
    tags: tags.length ? tags : null,
    imageUrl: payload.imageUrl?.trim() || null,
    accessRoles: accessRoles.length ? accessRoles : null,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
  };
}

export async function listRoles(options = {}) {
  const page = parsePage(options.page);
  const pageSize = parsePageSize(options.pageSize);
  const status = coerceStatus(options.status, VOLUNTEER_ROLE_STATUSES);
  const programId = options.programId ? Number.parseInt(options.programId, 10) : null;
  const remoteType = typeof options.remoteType === 'string' ? options.remoteType.trim().toLowerCase() : null;
  const search = typeof options.search === 'string' ? options.search.trim() : '';

  const where = {};
  if (status) {
    where.status = status;
  }
  if (programId) {
    where.programId = programId;
  }
  if (remoteType && ['remote', 'hybrid', 'onsite'].includes(remoteType)) {
    where.remoteType = remoteType;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike ?? Op.like]: `%${search}%` } },
      { organization: { [Op.iLike ?? Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Volunteering.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: VolunteerProgram,
        as: 'program',
        attributes: ['id', 'name', 'status'],
      },
    ],
  });

  const items = rows.map((role) => ({
    id: role.id,
    title: role.title,
    organization: role.organization,
    status: role.status,
    remoteType: role.remoteType,
    location: role.location,
    commitmentHours: role.commitmentHours,
    spots: role.spots,
    tags: role.tags ?? [],
    program: role.program
      ? {
          id: role.program.id,
          name: role.program.name,
          status: role.program.status,
        }
      : null,
    publishedAt: role.publishedAt,
    updatedAt: role.updatedAt,
  }));

  return {
    items,
    pagination: buildPaginationMeta(count, page, pageSize),
  };
}

export async function getRole(roleId) {
  const role = await Volunteering.findByPk(roleId, {
    include: [
      {
        model: VolunteerProgram,
        as: 'program',
      },
      {
        model: VolunteerShift,
        as: 'shifts',
      },
    ],
  });
  if (!role) {
    throw new Error('Role not found');
  }
  return role;
}

export async function createRole(payload) {
  const role = await Volunteering.create(buildRolePayload(payload));
  return role.reload({
    include: [{ model: VolunteerProgram, as: 'program' }],
  });
}

export async function updateRole(roleId, payload) {
  const role = await Volunteering.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  const updates = buildRolePayload({ ...role.toJSON(), ...payload });
  await role.update(updates);
  return role.reload({ include: [{ model: VolunteerProgram, as: 'program' }] });
}

export async function deleteRole(roleId) {
  const role = await Volunteering.findByPk(roleId);
  if (!role) {
    return;
  }
  await VolunteerShift.destroy({ where: { roleId } });
  await role.destroy();
}

export async function publishRole(roleId) {
  const role = await Volunteering.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  await role.update({ status: 'open', publishedAt: new Date() });
  return role.reload();
}

function buildShiftPayload(payload) {
  const status = coerceStatus(payload.status, VOLUNTEER_SHIFT_STATUSES) ?? 'planned';
  const capacity = Number.parseInt(payload.capacity, 10);
  const reserved = Number.parseInt(payload.reserved, 10);
  return {
    programId: payload.programId || null,
    title: payload.title.trim(),
    shiftDate: payload.shiftDate,
    startTime: payload.startTime || null,
    endTime: payload.endTime || null,
    timezone: payload.timezone || null,
    location: payload.location?.trim() || null,
    requirements: normaliseRequirementItems(payload.requirements ?? []),
    capacity: Number.isInteger(capacity) && capacity >= 0 ? capacity : null,
    reserved: Number.isInteger(reserved) && reserved >= 0 ? reserved : null,
    status,
    notes: payload.notes?.trim() || null,
  };
}

export async function listShifts(roleId, options = {}) {
  const role = await Volunteering.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  const status = coerceStatus(options.status, VOLUNTEER_SHIFT_STATUSES);
  const startDate = options.startDate ? new Date(options.startDate) : null;
  const endDate = options.endDate ? new Date(options.endDate) : null;

  const where = { roleId };
  if (status) {
    where.status = status;
  }
  if (startDate) {
    where.shiftDate = { ...(where.shiftDate ?? {}), [Op.gte]: startDate };
  }
  if (endDate) {
    where.shiftDate = { ...(where.shiftDate ?? {}), [Op.lte]: endDate };
  }

  const shifts = await VolunteerShift.findAll({
    where,
    order: [
      ['shiftDate', 'ASC'],
      ['startTime', 'ASC'],
    ],
    include: [{ model: VolunteerAssignment, as: 'assignments' }],
  });

  return shifts.map((shift) => ({
    id: shift.id,
    title: shift.title,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    timezone: shift.timezone,
    location: shift.location,
    status: shift.status,
    capacity: shift.capacity,
    reserved: shift.reserved,
    notes: shift.notes,
    requirements: shift.requirements ?? [],
    assignments: Array.isArray(shift.assignments)
      ? shift.assignments.map((assignment) => ({
          id: assignment.id,
          volunteerId: assignment.volunteerId,
          fullName: assignment.fullName,
          email: assignment.email,
          phone: assignment.phone,
          status: assignment.status,
          checkInAt: assignment.checkInAt,
          checkOutAt: assignment.checkOutAt,
        }))
      : [],
  }));
}

export async function createShift(roleId, payload) {
  const role = await Volunteering.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  const shift = await VolunteerShift.create({ ...buildShiftPayload(payload), roleId, programId: payload.programId ?? role.programId });
  return shift;
}

export async function updateShift(roleId, shiftId, payload) {
  const shift = await VolunteerShift.findOne({ where: { id: shiftId, roleId } });
  if (!shift) {
    throw new Error('Shift not found');
  }
  await shift.update(buildShiftPayload({ ...shift.toJSON(), ...payload }));
  return shift.reload({ include: [{ model: VolunteerAssignment, as: 'assignments' }] });
}

export async function deleteShift(roleId, shiftId) {
  await VolunteerAssignment.destroy({ where: { shiftId } });
  await VolunteerShift.destroy({ where: { id: shiftId, roleId } });
}

function buildAssignmentPayload(payload) {
  const status = coerceStatus(payload.status, VOLUNTEER_ASSIGNMENT_STATUSES) ?? 'invited';
  return {
    volunteerId: payload.volunteerId || null,
    fullName: payload.fullName?.trim() || null,
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    status,
    notes: payload.notes?.trim() || null,
    checkInAt: payload.checkInAt ? new Date(payload.checkInAt) : null,
    checkOutAt: payload.checkOutAt ? new Date(payload.checkOutAt) : null,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
  };
}

export async function listAssignments(shiftId) {
  const assignments = await VolunteerAssignment.findAll({
    where: { shiftId },
    include: [{ model: User, as: 'volunteer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['updatedAt', 'DESC']],
  });
  return assignments.map((assignment) => ({
    id: assignment.id,
    volunteerId: assignment.volunteerId,
    fullName:
      assignment.fullName ||
      (assignment.volunteer ? `${assignment.volunteer.firstName} ${assignment.volunteer.lastName}`.trim() : null),
    email: assignment.email || assignment.volunteer?.email || null,
    phone: assignment.phone,
    status: assignment.status,
    checkInAt: assignment.checkInAt,
    checkOutAt: assignment.checkOutAt,
    notes: assignment.notes,
  }));
}

export async function createAssignment(shiftId, payload) {
  const shift = await VolunteerShift.findByPk(shiftId);
  if (!shift) {
    throw new Error('Shift not found');
  }
  const assignment = await VolunteerAssignment.create({ ...buildAssignmentPayload(payload), shiftId });
  return assignment;
}

export async function updateAssignment(shiftId, assignmentId, payload) {
  const assignment = await VolunteerAssignment.findOne({ where: { id: assignmentId, shiftId } });
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  await assignment.update(buildAssignmentPayload({ ...assignment.toJSON(), ...payload }));
  return assignment.reload({ include: [{ model: User, as: 'volunteer', attributes: ['id', 'firstName', 'lastName', 'email'] }] });
}

export async function deleteAssignment(shiftId, assignmentId) {
  await VolunteerAssignment.destroy({ where: { id: assignmentId, shiftId } });
}

export default {
  getVolunteeringInsights,
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  publishRole,
  listShifts,
  createShift,
  updateShift,
  deleteShift,
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
