import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const VOLUNTEERING_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'interview',
  'offer',
  'accepted',
  'declined',
  'withdrawn',
];

export const VOLUNTEERING_RESPONSE_STATUSES = [
  'awaiting_reply',
  'info_requested',
  'scheduled',
  'completed',
  'declined',
];

export const VOLUNTEERING_CONTRACT_STATUSES = ['pending', 'active', 'completed', 'cancelled'];

export const VOLUNTEERING_SPEND_CATEGORIES = ['travel', 'materials', 'software', 'marketing', 'other'];

export const VolunteeringApplication = sequelize.define(
  'VolunteeringApplication',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    organizationName: { type: DataTypes.STRING(180), allowNull: false },
    focusArea: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(180), allowNull: true },
    remoteFriendly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    skills: { type: jsonType, allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEERING_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    appliedAt: { type: DataTypes.DATE, allowNull: true },
    targetStartDate: { type: DataTypes.DATE, allowNull: true },
    hoursPerWeek: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    impactSummary: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    coverImageUrl: { type: DataTypes.STRING(512), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteering_applications',
  },
);

export const VolunteeringResponse = sequelize.define(
  'VolunteeringResponse',
  {
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'volunteering_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    responderName: { type: DataTypes.STRING(180), allowNull: true },
    responderEmail: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...VOLUNTEERING_RESPONSE_STATUSES),
      allowNull: false,
      defaultValue: 'awaiting_reply',
    },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    nextSteps: { type: DataTypes.STRING(255), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteering_responses',
  },
);

export const VolunteeringContract = sequelize.define(
  'VolunteeringContract',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'volunteering_applications', key: 'id' },
      onDelete: 'SET NULL',
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    organizationName: { type: DataTypes.STRING(180), allowNull: false },
    status: {
      type: DataTypes.ENUM(...VOLUNTEERING_CONTRACT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    expectedHours: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    hoursCommitted: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    financialValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currencyCode: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    impactNotes: { type: DataTypes.TEXT, allowNull: true },
    agreementUrl: { type: DataTypes.STRING(512), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteering_contracts',
  },
);

export const VolunteeringSpend = sequelize.define(
  'VolunteeringSpend',
  {
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'volunteering_contracts', key: 'id' },
      onDelete: 'CASCADE',
    },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.ENUM(...VOLUNTEERING_SPEND_CATEGORIES),
      allowNull: false,
      defaultValue: 'other',
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    spentAt: { type: DataTypes.DATE, allowNull: true },
    receiptUrl: { type: DataTypes.STRING(512), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'volunteering_spend_entries',
  },
);

VolunteeringApplication.hasMany(VolunteeringResponse, {
  foreignKey: 'applicationId',
  as: 'responses',
});
VolunteeringResponse.belongsTo(VolunteeringApplication, {
  foreignKey: 'applicationId',
  as: 'application',
});

VolunteeringApplication.hasMany(VolunteeringContract, {
  foreignKey: 'applicationId',
  as: 'contracts',
});
VolunteeringContract.belongsTo(VolunteeringApplication, {
  foreignKey: 'applicationId',
  as: 'application',
});

VolunteeringContract.hasMany(VolunteeringSpend, {
  foreignKey: 'contractId',
  as: 'spendEntries',
});
VolunteeringSpend.belongsTo(VolunteeringContract, {
  foreignKey: 'contractId',
  as: 'contract',
});

export async function syncVolunteeringModels(options = {}) {
  const syncOptions = { alter: false, ...options };
  await VolunteeringApplication.sync(syncOptions);
  await VolunteeringResponse.sync(syncOptions);
  await VolunteeringContract.sync(syncOptions);
  await VolunteeringSpend.sync(syncOptions);
}

export default {
  VolunteeringApplication,
  VolunteeringResponse,
  VolunteeringContract,
  VolunteeringSpend,
  VOLUNTEERING_APPLICATION_STATUSES,
  VOLUNTEERING_RESPONSE_STATUSES,
  VOLUNTEERING_CONTRACT_STATUSES,
  VOLUNTEERING_SPEND_CATEGORIES,
  syncVolunteeringModels,
};
