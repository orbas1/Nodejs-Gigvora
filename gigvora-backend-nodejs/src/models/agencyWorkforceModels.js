import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const AGENCY_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'vendor'];
export const AGENCY_MEMBER_STATUSES = ['active', 'on_leave', 'offboarded'];
export const AGENCY_PAY_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'milestone'];
export const AGENCY_PAY_STATUSES = ['scheduled', 'processing', 'sent', 'paused'];
export const AGENCY_ASSIGNMENT_TYPES = ['project', 'retainer', 'internal'];
export const AGENCY_ASSIGNMENT_STATUSES = ['planned', 'active', 'completed', 'on_hold'];
export const AGENCY_GIG_STATUSES = ['briefing', 'in_delivery', 'review', 'completed', 'on_hold'];
export const AGENCY_AVAILABILITY_STATUSES = ['available', 'partial', 'unavailable', 'on_leave'];

export const AgencyWorkforceMember = sequelize.define(
  'AgencyWorkforceMember',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(160), allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: true },
    email: { type: DataTypes.STRING(180), allowNull: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(60), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    employmentType: {
      type: DataTypes.ENUM(...AGENCY_EMPLOYMENT_TYPES),
      allowNull: false,
      defaultValue: 'contract',
    },
    status: {
      type: DataTypes.ENUM(...AGENCY_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    billableRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    costCenter: { type: DataTypes.STRING(80), allowNull: true },
    capacityHoursPerWeek: { type: DataTypes.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
    benchAllocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
    skills: { type: jsonType, allowNull: true },
    avatarUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_workforce_members',
    underscored: true,
    indexes: [
      { name: 'agency_workforce_members_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_workforce_members_status_idx', fields: ['status'] },
      { name: 'agency_workforce_members_employment_type_idx', fields: ['employment_type'] },
      { name: 'agency_workforce_members_full_name_idx', fields: ['full_name'] },
    ],
  },
);

export const AgencyPayDelegation = sequelize.define(
  'AgencyPayDelegation',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    frequency: { type: DataTypes.ENUM(...AGENCY_PAY_FREQUENCIES), allowNull: false, defaultValue: 'monthly' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...AGENCY_PAY_STATUSES), allowNull: false, defaultValue: 'scheduled' },
    nextPayDate: { type: DataTypes.DATE, allowNull: true },
    payoutMethod: { type: DataTypes.STRING(80), allowNull: true },
    approverId: { type: DataTypes.INTEGER, allowNull: true },
    memo: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_pay_delegations',
    underscored: true,
    indexes: [
      { name: 'agency_pay_delegations_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_pay_delegations_member_id_idx', fields: ['member_id'] },
      { name: 'agency_pay_delegations_status_idx', fields: ['status'] },
      { name: 'agency_pay_delegations_next_pay_date_idx', fields: ['next_pay_date'] },
    ],
  },
);

export const AgencyProjectDelegation = sequelize.define(
  'AgencyProjectDelegation',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    projectName: { type: DataTypes.STRING(180), allowNull: false },
    clientName: { type: DataTypes.STRING(160), allowNull: true },
    assignmentType: { type: DataTypes.ENUM(...AGENCY_ASSIGNMENT_TYPES), allowNull: false, defaultValue: 'project' },
    status: { type: DataTypes.ENUM(...AGENCY_ASSIGNMENT_STATUSES), allowNull: false, defaultValue: 'planned' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    billableRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_project_delegations',
    underscored: true,
    indexes: [
      { name: 'agency_project_delegations_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_project_delegations_member_id_idx', fields: ['member_id'] },
      { name: 'agency_project_delegations_status_idx', fields: ['status'] },
      { name: 'agency_project_delegations_start_date_idx', fields: ['start_date'] },
    ],
  },
);

export const AgencyGigDelegation = sequelize.define(
  'AgencyGigDelegation',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    gigName: { type: DataTypes.STRING(180), allowNull: false },
    status: { type: DataTypes.ENUM(...AGENCY_GIG_STATUSES), allowNull: false, defaultValue: 'briefing' },
    deliverables: { type: DataTypes.INTEGER, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_gig_delegations',
    underscored: true,
    indexes: [
      { name: 'agency_gig_delegations_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_gig_delegations_member_id_idx', fields: ['member_id'] },
      { name: 'agency_gig_delegations_status_idx', fields: ['status'] },
      { name: 'agency_gig_delegations_start_date_idx', fields: ['start_date'] },
    ],
  },
);

export const AgencyCapacitySnapshot = sequelize.define(
  'AgencyCapacitySnapshot',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    recordedFor: { type: DataTypes.DATEONLY, allowNull: false },
    totalHeadcount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeAssignments: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    availableHours: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    allocatedHours: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    benchHours: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    utilizationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_capacity_snapshots',
    underscored: true,
    indexes: [
      { name: 'agency_capacity_snapshots_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_capacity_snapshots_recorded_for_idx', fields: ['recorded_for'] },
    ],
  },
);

export const AgencyAvailabilityEntry = sequelize.define(
  'AgencyAvailabilityEntry',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM(...AGENCY_AVAILABILITY_STATUSES), allowNull: false, defaultValue: 'available' },
    availableHours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_availability_entries',
    underscored: true,
    indexes: [
      { name: 'agency_availability_entries_workspace_id_idx', fields: ['workspace_id'] },
      { name: 'agency_availability_entries_member_id_idx', fields: ['member_id'] },
      { name: 'agency_availability_entries_date_idx', fields: ['date'] },
    ],
  },
);

AgencyWorkforceMember.hasMany(AgencyPayDelegation, {
  as: 'payDelegations',
  foreignKey: 'memberId',
  onDelete: 'CASCADE',
});
AgencyPayDelegation.belongsTo(AgencyWorkforceMember, { as: 'member', foreignKey: 'memberId' });

AgencyWorkforceMember.hasMany(AgencyProjectDelegation, {
  as: 'projectDelegations',
  foreignKey: 'memberId',
  onDelete: 'CASCADE',
});
AgencyProjectDelegation.belongsTo(AgencyWorkforceMember, { as: 'member', foreignKey: 'memberId' });

AgencyWorkforceMember.hasMany(AgencyGigDelegation, {
  as: 'gigDelegations',
  foreignKey: 'memberId',
  onDelete: 'CASCADE',
});
AgencyGigDelegation.belongsTo(AgencyWorkforceMember, { as: 'member', foreignKey: 'memberId' });

AgencyWorkforceMember.hasMany(AgencyAvailabilityEntry, {
  as: 'availabilityEntries',
  foreignKey: 'memberId',
  onDelete: 'CASCADE',
});
AgencyAvailabilityEntry.belongsTo(AgencyWorkforceMember, { as: 'member', foreignKey: 'memberId' });

export default {
  AgencyWorkforceMember,
  AgencyPayDelegation,
  AgencyProjectDelegation,
  AgencyGigDelegation,
  AgencyCapacitySnapshot,
  AgencyAvailabilityEntry,
};
