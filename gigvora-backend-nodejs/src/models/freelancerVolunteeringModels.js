import { DataTypes } from 'sequelize';

import { sequelize } from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

function ensureModel(name, factory) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return factory();
}

const arrayOrEmpty = (value) => (Array.isArray(value) ? value : []);
const objectOrEmpty = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const toIso = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
const toNumber = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const VOLUNTEERING_APPLICATION_STATUSES = Object.freeze([
  'draft',
  'submitted',
  'interview',
  'offer',
  'accepted',
  'declined',
  'withdrawn',
]);

export const VOLUNTEERING_RESPONSE_STATUSES = Object.freeze([
  'awaiting_reply',
  'info_requested',
  'scheduled',
  'completed',
  'declined',
]);

export const VOLUNTEERING_CONTRACT_STATUSES = Object.freeze([
  'pending',
  'active',
  'completed',
  'cancelled',
]);

export const VOLUNTEERING_SPEND_CATEGORIES = Object.freeze([
  'travel',
  'materials',
  'software',
  'marketing',
  'other',
]);

export const FreelancerVolunteeringApplication = ensureModel(
  'FreelancerVolunteeringApplication',
  () =>
    sequelize.define(
      'FreelancerVolunteeringApplication',
      {
        freelancerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
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
        impactSummary: { type: DataTypes.TEXT('long'), allowNull: true },
        notes: { type: DataTypes.TEXT('long'), allowNull: true },
        coverImageUrl: { type: DataTypes.STRING(512), allowNull: true },
        metadata: { type: jsonType, allowNull: true },
      },
      {
        tableName: 'volunteering_applications',
        underscored: true,
        indexes: [
          { fields: ['freelancer_id', 'status', 'applied_at'] },
          { fields: ['freelancer_id', 'created_at'] },
        ],
      },
    ),
);

FreelancerVolunteeringApplication.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    title: plain.title,
    organizationName: plain.organizationName,
    focusArea: plain.focusArea ?? null,
    location: plain.location ?? null,
    remoteFriendly: Boolean(plain.remoteFriendly),
    skills: arrayOrEmpty(plain.skills),
    status: plain.status,
    appliedAt: toIso(plain.appliedAt),
    targetStartDate: toIso(plain.targetStartDate),
    hoursPerWeek: toNumber(plain.hoursPerWeek),
    impactSummary: plain.impactSummary ?? null,
    notes: plain.notes ?? null,
    coverImageUrl: plain.coverImageUrl ?? null,
    metadata: objectOrEmpty(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const FreelancerVolunteeringResponse = ensureModel(
  'FreelancerVolunteeringResponse',
  () =>
    sequelize.define(
      'FreelancerVolunteeringResponse',
      {
        applicationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'volunteering_applications', key: 'id' },
          onDelete: 'CASCADE',
        },
        freelancerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        responderName: { type: DataTypes.STRING(180), allowNull: true },
        responderEmail: { type: DataTypes.STRING(255), allowNull: true },
        status: {
          type: DataTypes.ENUM(...VOLUNTEERING_RESPONSE_STATUSES),
          allowNull: false,
          defaultValue: 'awaiting_reply',
        },
        respondedAt: { type: DataTypes.DATE, allowNull: true },
        nextSteps: { type: DataTypes.STRING(255), allowNull: true },
        message: { type: DataTypes.TEXT('long'), allowNull: true },
        attachments: { type: jsonType, allowNull: true },
        metadata: { type: jsonType, allowNull: true },
      },
      {
        tableName: 'volunteering_responses',
        underscored: true,
        indexes: [
          { fields: ['application_id', 'status'] },
          { fields: ['freelancer_id', 'status'] },
        ],
      },
    ),
);

FreelancerVolunteeringResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    applicationId: plain.applicationId,
    freelancerId: plain.freelancerId,
    responderName: plain.responderName ?? null,
    responderEmail: plain.responderEmail ?? null,
    status: plain.status,
    respondedAt: toIso(plain.respondedAt),
    nextSteps: plain.nextSteps ?? null,
    message: plain.message ?? null,
    attachments: arrayOrEmpty(plain.attachments),
    metadata: objectOrEmpty(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const FreelancerVolunteeringContract = ensureModel(
  'FreelancerVolunteeringContract',
  () =>
    sequelize.define(
      'FreelancerVolunteeringContract',
      {
        freelancerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
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
        impactNotes: { type: DataTypes.TEXT('long'), allowNull: true },
        agreementUrl: { type: DataTypes.STRING(512), allowNull: true },
        metadata: { type: jsonType, allowNull: true },
      },
      {
        tableName: 'volunteering_contracts',
        underscored: true,
        indexes: [
          { fields: ['freelancer_id', 'status', 'start_date'] },
          { fields: ['application_id'] },
        ],
      },
    ),
);

FreelancerVolunteeringContract.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    applicationId: plain.applicationId ?? null,
    title: plain.title,
    organizationName: plain.organizationName,
    status: plain.status,
    startDate: toIso(plain.startDate),
    endDate: toIso(plain.endDate),
    expectedHours: toNumber(plain.expectedHours),
    hoursCommitted: toNumber(plain.hoursCommitted),
    financialValue: toNumber(plain.financialValue),
    currencyCode: plain.currencyCode,
    impactNotes: plain.impactNotes ?? null,
    agreementUrl: plain.agreementUrl ?? null,
    metadata: objectOrEmpty(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

export const FreelancerVolunteeringSpend = ensureModel(
  'FreelancerVolunteeringSpend',
  () =>
    sequelize.define(
      'FreelancerVolunteeringSpend',
      {
        contractId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'volunteering_contracts', key: 'id' },
          onDelete: 'CASCADE',
        },
        freelancerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
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
        underscored: true,
        indexes: [
          { fields: ['contract_id', 'spent_at'] },
          { fields: ['freelancer_id'] },
        ],
      },
    ),
);

FreelancerVolunteeringSpend.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    contractId: plain.contractId,
    freelancerId: plain.freelancerId,
    description: plain.description,
    category: plain.category,
    amount: toNumber(plain.amount) ?? 0,
    currencyCode: plain.currencyCode,
    spentAt: toIso(plain.spentAt),
    receiptUrl: plain.receiptUrl ?? null,
    metadata: objectOrEmpty(plain.metadata),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

FreelancerVolunteeringApplication.hasMany(FreelancerVolunteeringResponse, {
  as: 'responses',
  foreignKey: 'applicationId',
});
FreelancerVolunteeringResponse.belongsTo(FreelancerVolunteeringApplication, {
  as: 'application',
  foreignKey: 'applicationId',
});

FreelancerVolunteeringApplication.hasMany(FreelancerVolunteeringContract, {
  as: 'contracts',
  foreignKey: 'applicationId',
});
FreelancerVolunteeringContract.belongsTo(FreelancerVolunteeringApplication, {
  as: 'application',
  foreignKey: 'applicationId',
});

FreelancerVolunteeringContract.hasMany(FreelancerVolunteeringSpend, {
  as: 'spendEntries',
  foreignKey: 'contractId',
});
FreelancerVolunteeringSpend.belongsTo(FreelancerVolunteeringContract, {
  as: 'contract',
  foreignKey: 'contractId',
});

