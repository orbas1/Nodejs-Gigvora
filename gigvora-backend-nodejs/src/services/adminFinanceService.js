import crypto from 'crypto';
import { Op, fn, col } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  AdminTreasuryPolicy,
  AdminFeeRule,
  AdminPayoutSchedule,
  AdminEscrowAdjustment,
  EscrowAccount,
  EscrowTransaction,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_TRANSACTION_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseDecimal(value, precision = 2) {
  if (value == null) {
    return 0;
  }
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number.parseFloat(numeric.toFixed(precision));
}

function normaliseCounts(rows, key) {
  return rows.reduce((acc, row) => {
    const label = row[key];
    if (!label) {
      return acc;
    }
    const countValue = row.count ?? row.dataValues?.count;
    acc[label] = Number.parseInt(countValue ?? 0, 10) || 0;
    return acc;
  }, {});
}

function ensureAllKeys(source, keys) {
  const result = {};
  keys.forEach((key) => {
    result[key] = source[key] ?? 0;
  });
  return result;
}

function coerceString(value) {
  if (value == null) {
    return undefined;
  }
  const text = `${value}`.trim();
  return text.length ? text : undefined;
}

function coerceNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function coerceInteger(value) {
  const numeric = coerceNumber(value);
  if (numeric == null) {
    return undefined;
  }
  const integer = Math.trunc(numeric);
  if (!Number.isInteger(integer)) {
    return undefined;
  }
  return integer;
}

function normaliseTags(value) {
  if (!value) {
    return undefined;
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  const tags = Array.from(
    new Set(
      source
        .map((item) => `${item}`.trim())
        .filter((item) => item.length > 0 && item.length <= 64),
    ),
  );
  if (!tags.length) {
    return undefined;
  }
  return tags.join(',');
}

function normaliseDate(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function buildDefaultTreasuryPolicy() {
  return {
    id: null,
    policyName: 'Global treasury policy',
    defaultCurrency: 'USD',
    reserveTarget: 0,
    minimumBalanceThreshold: 0,
    autopayoutEnabled: false,
    autopayoutWindowDays: null,
    autopayoutDayOfWeek: null,
    autopayoutTimeOfDay: null,
    invoiceGracePeriodDays: null,
    riskAppetite: null,
    notes: null,
    operationalContacts: null,
    updatedBy: null,
    createdAt: null,
    updatedAt: null,
  };
}

function generateAdjustmentReference() {
  return `ADJ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function getAdminFinanceDashboard(options = {}) {
  const lookbackDays = Number.isFinite(options.lookbackDays) && options.lookbackDays > 0 ? options.lookbackDays : 90;
  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const [policyRecord] = await AdminTreasuryPolicy.findAll({ order: [['updatedAt', 'DESC']], limit: 1 });

  const [
    feeRuleRecords,
    payoutScheduleRecords,
    adjustmentRecords,
    escrowAggregateRow,
    transactionsByStatusRows,
    accountsByStatusRows,
    recentTransactions,
  ] = await Promise.all([
    AdminFeeRule.findAll({ order: [['priority', 'ASC'], ['name', 'ASC']] }),
    AdminPayoutSchedule.findAll({ order: [['status', 'ASC'], ['name', 'ASC']] }),
    AdminEscrowAdjustment.findAll({ order: [['createdAt', 'DESC']], limit: 25 }),
    EscrowTransaction.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'grossVolume'],
        [fn('COALESCE', fn('SUM', col('feeAmount')), 0), 'fees'],
        [fn('COALESCE', fn('SUM', col('netAmount')), 0), 'netVolume'],
      ],
      where: { createdAt: { [Op.gte]: lookbackDate } },
      raw: true,
    }),
    EscrowTransaction.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    EscrowAccount.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('COALESCE', fn('SUM', col('pendingReleaseTotal')), 0), 'pendingTotal'],
      ],
      group: ['status'],
      raw: true,
    }),
    EscrowTransaction.findAll({
      include: [{ model: EscrowAccount, as: 'account', attributes: ['id', 'provider', 'currencyCode'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
  ]);

  const transactionsByStatus = ensureAllKeys(normaliseCounts(transactionsByStatusRows, 'status'), ESCROW_TRANSACTION_STATUSES);
  const accountsByStatus = ensureAllKeys(normaliseCounts(accountsByStatusRows, 'status'), ESCROW_ACCOUNT_STATUSES);
  const pendingReleaseTotal = accountsByStatusRows.reduce((sum, row) => sum + parseDecimal(row.pendingTotal ?? 0, 2), 0);

  const feeRules = feeRuleRecords.map((record) => record.toPublicObject());
  const payoutSchedules = payoutScheduleRecords.map((record) => record.toPublicObject());
  const adjustments = adjustmentRecords.map((record) => record.toPublicObject());
  const transactions = recentTransactions.map((record) => {
    const transaction = record.toPublicObject();
    const account = record.account ? record.account.toPublicObject() : null;
    return { ...transaction, account };
  });

  const policy = policyRecord ? policyRecord.toPublicObject() : buildDefaultTreasuryPolicy();

  const activeSchedules = payoutSchedules.filter((schedule) => schedule.status === 'active');

  return {
    refreshedAt: new Date().toISOString(),
    lookbackDays,
    treasuryPolicy: policy,
    summary: {
      grossEscrowVolume: parseDecimal(escrowAggregateRow?.grossVolume ?? 0, 2),
      escrowFees: parseDecimal(escrowAggregateRow?.fees ?? 0, 2),
      netEscrowVolume: parseDecimal(escrowAggregateRow?.netVolume ?? 0, 2),
      pendingReleaseTotal: parseDecimal(pendingReleaseTotal, 2),
      transactionsByStatus,
      accountsByStatus,
      activeScheduleCount: activeSchedules.length,
      activeAdjustmentCount: adjustments.filter((adjustment) => adjustment.status === 'pending').length,
    },
    feeRules,
    payoutSchedules,
    escrowAdjustments: adjustments,
    recentTransactions: transactions,
  };
}

export async function upsertTreasuryPolicy(payload = {}, actorId = null) {
  return sequelize.transaction(async (transaction) => {
    const updates = {
      policyName: coerceString(payload.policyName) ?? 'Global treasury policy',
      defaultCurrency: (coerceString(payload.defaultCurrency) ?? 'USD').toUpperCase(),
      reserveTarget: coerceNumber(payload.reserveTarget) ?? 0,
      minimumBalanceThreshold: coerceNumber(payload.minimumBalanceThreshold) ?? 0,
      autopayoutEnabled: Boolean(payload.autopayoutEnabled),
      autopayoutWindowDays: coerceInteger(payload.autopayoutWindowDays) ?? null,
      autopayoutDayOfWeek: coerceString(payload.autopayoutDayOfWeek) ?? null,
      autopayoutTimeOfDay: coerceString(payload.autopayoutTimeOfDay) ?? null,
      invoiceGracePeriodDays: coerceInteger(payload.invoiceGracePeriodDays) ?? null,
      riskAppetite: coerceString(payload.riskAppetite) ?? null,
      notes: coerceString(payload.notes) ?? null,
      operationalContacts: coerceString(payload.operationalContacts) ?? null,
      updatedBy: actorId ?? null,
    };

    const [existing] = await AdminTreasuryPolicy.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 1,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existing) {
      await existing.update(updates, { transaction });
      await existing.reload({ transaction });
      return existing.toPublicObject();
    }

    const created = await AdminTreasuryPolicy.create(updates, { transaction });
    return created.toPublicObject();
  });
}

function normaliseFeeRulePayload(payload = {}, actorId = null) {
  const percentageRate = coerceNumber(payload.percentageRate);
  const flatAmount = coerceNumber(payload.flatAmount);

  if (percentageRate == null && flatAmount == null) {
    throw new ValidationError('Provide either a percentage rate or a flat amount for the fee rule.');
  }

  return {
    name: coerceString(payload.name) ?? (() => {
      throw new ValidationError('name is required for the fee rule.');
    })(),
    appliesTo: coerceString(payload.appliesTo) ?? null,
    percentageRate: percentageRate ?? null,
    flatAmount: flatAmount ?? null,
    currency: (coerceString(payload.currency) ?? 'USD').toUpperCase(),
    minimumAmount: coerceNumber(payload.minimumAmount) ?? null,
    maximumAmount: coerceNumber(payload.maximumAmount) ?? null,
    description: coerceString(payload.description) ?? null,
    tags: normaliseTags(payload.tags) ?? null,
    priority: coerceInteger(payload.priority) ?? 0,
    isActive: payload.isActive === false ? false : true,
    effectiveFrom: normaliseDate(payload.effectiveFrom) ?? null,
    effectiveTo: normaliseDate(payload.effectiveTo) ?? null,
    updatedBy: actorId ?? null,
    createdBy: actorId ?? null,
  };
}

export async function createFeeRule(payload = {}, actorId = null) {
  const data = normaliseFeeRulePayload(payload, actorId);
  return sequelize.transaction(async (transaction) => {
    const rule = await AdminFeeRule.create(data, { transaction });
    return rule.toPublicObject();
  });
}

export async function updateFeeRule(feeRuleId, payload = {}, actorId = null) {
  if (!feeRuleId) {
    throw new ValidationError('feeRuleId is required.');
  }

  const rule = await AdminFeeRule.findByPk(feeRuleId);
  if (!rule) {
    throw new NotFoundError('Fee rule not found.');
  }

  const updates = { ...normaliseFeeRulePayload({ ...rule.get({ plain: true }), ...payload }, actorId) };
  updates.createdBy = rule.createdBy;

  await rule.update(updates);
  await rule.reload();
  return rule.toPublicObject();
}

export async function deleteFeeRule(feeRuleId) {
  if (!feeRuleId) {
    throw new ValidationError('feeRuleId is required.');
  }

  const rule = await AdminFeeRule.findByPk(feeRuleId);
  if (!rule) {
    throw new NotFoundError('Fee rule not found.');
  }

  if (rule.isActive) {
    throw new ValidationError('Deactivate the fee rule before deleting it.');
  }

  await rule.destroy();
  return { success: true };
}

function normalisePayoutSchedulePayload(payload = {}, actorId = null) {
  const scheduleType = coerceString(payload.scheduleType) ?? 'weekly';
  const cadence = coerceString(payload.cadence) ?? scheduleType;

  return {
    name: coerceString(payload.name) ?? (() => {
      throw new ValidationError('name is required for the payout schedule.');
    })(),
    scheduleType,
    cadence,
    dayOfWeek: coerceString(payload.dayOfWeek) ?? null,
    dayOfMonth: coerceInteger(payload.dayOfMonth) ?? null,
    leadTimeDays: coerceInteger(payload.leadTimeDays) ?? null,
    payoutWindow: coerceString(payload.payoutWindow) ?? null,
    status: coerceString(payload.status) ?? 'draft',
    nextRunOn: normaliseDate(payload.nextRunOn) ?? null,
    autoApprove: Boolean(payload.autoApprove),
    fundingSource: coerceString(payload.fundingSource) ?? null,
    notes: coerceString(payload.notes) ?? null,
    updatedBy: actorId ?? null,
    createdBy: actorId ?? null,
  };
}

export async function createPayoutSchedule(payload = {}, actorId = null) {
  const data = normalisePayoutSchedulePayload(payload, actorId);
  return sequelize.transaction(async (transaction) => {
    const schedule = await AdminPayoutSchedule.create(data, { transaction });
    return schedule.toPublicObject();
  });
}

export async function updatePayoutSchedule(payoutScheduleId, payload = {}, actorId = null) {
  if (!payoutScheduleId) {
    throw new ValidationError('payoutScheduleId is required.');
  }

  const schedule = await AdminPayoutSchedule.findByPk(payoutScheduleId);
  if (!schedule) {
    throw new NotFoundError('Payout schedule not found.');
  }

  const updates = { ...normalisePayoutSchedulePayload({ ...schedule.get({ plain: true }), ...payload }, actorId) };
  updates.createdBy = schedule.createdBy;

  await schedule.update(updates);
  await schedule.reload();
  return schedule.toPublicObject();
}

export async function deletePayoutSchedule(payoutScheduleId) {
  if (!payoutScheduleId) {
    throw new ValidationError('payoutScheduleId is required.');
  }

  const schedule = await AdminPayoutSchedule.findByPk(payoutScheduleId);
  if (!schedule) {
    throw new NotFoundError('Payout schedule not found.');
  }

  if (schedule.status === 'active') {
    throw new ValidationError('Pause the payout schedule before deleting it.');
  }

  await schedule.destroy();
  return { success: true };
}

function normaliseEscrowAdjustmentPayload(payload = {}, actorId = null) {
  const amount = coerceNumber(payload.amount);
  if (amount == null || amount === 0) {
    throw new ValidationError('Adjustment amount must be provided.');
  }

  return {
    reference: coerceString(payload.reference) ?? generateAdjustmentReference(),
    adjustmentType: coerceString(payload.adjustmentType) ?? 'correction',
    amount,
    currency: (coerceString(payload.currency) ?? 'USD').toUpperCase(),
    reason: coerceString(payload.reason) ?? null,
    accountReference: coerceString(payload.accountReference) ?? null,
    status: coerceString(payload.status) ?? 'pending',
    supportingDocumentUrl: coerceString(payload.supportingDocumentUrl) ?? null,
    notes: coerceString(payload.notes) ?? null,
    effectiveOn: normaliseDate(payload.effectiveOn) ?? null,
    postedAt: normaliseDate(payload.postedAt) ?? null,
    requestedBy: actorId ?? null,
    approvedBy: payload.approvedBy ?? null,
  };
}

export async function createEscrowAdjustment(payload = {}, actorId = null) {
  const data = normaliseEscrowAdjustmentPayload(payload, actorId);
  return sequelize.transaction(async (transaction) => {
    const adjustment = await AdminEscrowAdjustment.create(data, { transaction });
    return adjustment.toPublicObject();
  });
}

export async function updateEscrowAdjustment(adjustmentId, payload = {}, actorId = null) {
  if (!adjustmentId) {
    throw new ValidationError('adjustmentId is required.');
  }

  const adjustment = await AdminEscrowAdjustment.findByPk(adjustmentId);
  if (!adjustment) {
    throw new NotFoundError('Escrow adjustment not found.');
  }

  if (adjustment.status === 'posted') {
    throw new ValidationError('Posted adjustments cannot be modified.');
  }

  const updates = normaliseEscrowAdjustmentPayload({ ...adjustment.get({ plain: true }), ...payload }, actorId);
  updates.reference = adjustment.reference; // do not allow changing reference
  updates.requestedBy = adjustment.requestedBy ?? actorId ?? null;
  if (updates.status === 'approved' && !updates.postedAt) {
    updates.postedAt = new Date();
  }

  await adjustment.update(updates);
  await adjustment.reload();
  return adjustment.toPublicObject();
}

export async function deleteEscrowAdjustment(adjustmentId) {
  if (!adjustmentId) {
    throw new ValidationError('adjustmentId is required.');
  }

  const adjustment = await AdminEscrowAdjustment.findByPk(adjustmentId);
  if (!adjustment) {
    throw new NotFoundError('Escrow adjustment not found.');
  }

  if (['approved', 'posted'].includes(adjustment.status)) {
    throw new ValidationError('You can only delete pending or declined adjustments.');
  }

  await adjustment.destroy();
  return { success: true };
}

export default {
  getAdminFinanceDashboard,
  upsertTreasuryPolicy,
  createFeeRule,
  updateFeeRule,
  deleteFeeRule,
  createPayoutSchedule,
  updatePayoutSchedule,
  deletePayoutSchedule,
  createEscrowAdjustment,
  updateEscrowAdjustment,
  deleteEscrowAdjustment,
};
