import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

function decimalToNumber(value, precision = 2) {
  if (value == null) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(parseFloat(value.toFixed(precision))) : 0;
  }

  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Number.parseFloat(numeric.toFixed(precision));
}

export const AdminTreasuryPolicy = sequelize.define(
  'AdminTreasuryPolicy',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    policyName: { type: DataTypes.STRING(160), allowNull: false, defaultValue: 'Global treasury policy' },
    defaultCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    reserveTarget: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    minimumBalanceThreshold: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    autopayoutEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autopayoutWindowDays: { type: DataTypes.INTEGER, allowNull: true },
    autopayoutDayOfWeek: { type: DataTypes.STRING(16), allowNull: true },
    autopayoutTimeOfDay: { type: DataTypes.STRING(16), allowNull: true },
    invoiceGracePeriodDays: { type: DataTypes.INTEGER, allowNull: true },
    riskAppetite: { type: DataTypes.STRING(32), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    operationalContacts: { type: DataTypes.STRING(255), allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'admin_treasury_policies',
    underscored: true,
    indexes: [
      { fields: ['policy_name'] },
      { fields: ['default_currency'] },
    ],
  },
);

AdminTreasuryPolicy.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    policyName: plain.policyName,
    defaultCurrency: plain.defaultCurrency,
    reserveTarget: decimalToNumber(plain.reserveTarget),
    minimumBalanceThreshold: decimalToNumber(plain.minimumBalanceThreshold),
    autopayoutEnabled: Boolean(plain.autopayoutEnabled),
    autopayoutWindowDays: plain.autopayoutWindowDays ?? null,
    autopayoutDayOfWeek: plain.autopayoutDayOfWeek ?? null,
    autopayoutTimeOfDay: plain.autopayoutTimeOfDay ?? null,
    invoiceGracePeriodDays: plain.invoiceGracePeriodDays ?? null,
    riskAppetite: plain.riskAppetite ?? null,
    notes: plain.notes ?? null,
    operationalContacts: plain.operationalContacts ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdminFeeRule = sequelize.define(
  'AdminFeeRule',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    appliesTo: { type: DataTypes.STRING(64), allowNull: true },
    percentageRate: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
    flatAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    minimumAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    maximumAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: DataTypes.STRING(255), allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    effectiveFrom: { type: DataTypes.DATE, allowNull: true },
    effectiveTo: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'admin_fee_rules',
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['priority'] },
      { fields: ['applies_to'] },
    ],
  },
);

AdminFeeRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    appliesTo: plain.appliesTo ?? null,
    percentageRate: plain.percentageRate != null ? Number.parseFloat(plain.percentageRate) : null,
    flatAmount: plain.flatAmount != null ? decimalToNumber(plain.flatAmount) : null,
    currency: plain.currency,
    minimumAmount: plain.minimumAmount != null ? decimalToNumber(plain.minimumAmount) : null,
    maximumAmount: plain.maximumAmount != null ? decimalToNumber(plain.maximumAmount) : null,
    description: plain.description ?? null,
    tags: plain.tags ? plain.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    priority: plain.priority ?? 0,
    isActive: Boolean(plain.isActive),
    effectiveFrom: plain.effectiveFrom ? plain.effectiveFrom.toISOString() : null,
    effectiveTo: plain.effectiveTo ? plain.effectiveTo.toISOString() : null,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdminPayoutSchedule = sequelize.define(
  'AdminPayoutSchedule',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    scheduleType: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'weekly' },
    cadence: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'weekly' },
    dayOfWeek: { type: DataTypes.STRING(16), allowNull: true },
    dayOfMonth: { type: DataTypes.INTEGER, allowNull: true },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
    payoutWindow: { type: DataTypes.STRING(64), allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'draft' },
    nextRunOn: { type: DataTypes.DATE, allowNull: true },
    autoApprove: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fundingSource: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'admin_payout_schedules',
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['schedule_type'] },
    ],
  },
);

AdminPayoutSchedule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    scheduleType: plain.scheduleType,
    cadence: plain.cadence,
    dayOfWeek: plain.dayOfWeek ?? null,
    dayOfMonth: plain.dayOfMonth ?? null,
    leadTimeDays: plain.leadTimeDays ?? null,
    payoutWindow: plain.payoutWindow ?? null,
    status: plain.status,
    nextRunOn: plain.nextRunOn ? plain.nextRunOn.toISOString() : null,
    autoApprove: Boolean(plain.autoApprove),
    fundingSource: plain.fundingSource ?? null,
    notes: plain.notes ?? null,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdminEscrowAdjustment = sequelize.define(
  'AdminEscrowAdjustment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reference: { type: DataTypes.STRING(64), allowNull: false },
    adjustmentType: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'correction' },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    reason: { type: DataTypes.TEXT, allowNull: true },
    accountReference: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    requestedBy: { type: DataTypes.INTEGER, allowNull: true },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true },
    supportingDocumentUrl: { type: DataTypes.STRING(2048), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    effectiveOn: { type: DataTypes.DATE, allowNull: true },
    postedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'admin_escrow_adjustments',
    underscored: true,
    indexes: [
      { fields: ['reference'], unique: true },
      { fields: ['status'] },
      { fields: ['adjustment_type'] },
    ],
  },
);

AdminEscrowAdjustment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    reference: plain.reference,
    adjustmentType: plain.adjustmentType,
    amount: decimalToNumber(plain.amount),
    currency: plain.currency,
    reason: plain.reason ?? null,
    accountReference: plain.accountReference ?? null,
    status: plain.status,
    requestedBy: plain.requestedBy ?? null,
    approvedBy: plain.approvedBy ?? null,
    supportingDocumentUrl: plain.supportingDocumentUrl ?? null,
    notes: plain.notes ?? null,
    effectiveOn: plain.effectiveOn ? plain.effectiveOn.toISOString() : null,
    postedAt: plain.postedAt ? plain.postedAt.toISOString() : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  AdminTreasuryPolicy,
  AdminFeeRule,
  AdminPayoutSchedule,
  AdminEscrowAdjustment,
};
