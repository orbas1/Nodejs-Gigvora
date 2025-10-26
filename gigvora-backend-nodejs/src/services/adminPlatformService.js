import { Op } from 'sequelize';
import models from '../models/index.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsContainer = models;
let sequelizeInstance = models.sequelize;
let log = logger.child({ component: 'adminPlatformService' });

function getModels() {
  modelsContainer = modelsContainer ?? models;
  return modelsContainer;
}

function getSequelize(strict = false) {
  const instance = sequelizeInstance ?? getModels()?.sequelize ?? models.sequelize;
  if (strict && (!instance || typeof instance.transaction !== 'function')) {
    throw new Error('Sequelize instance is not configured for adminPlatformService.');
  }
  return instance;
}

function getFeatureFlagModel() {
  const featureFlagModel = getModels()?.FeatureFlag;
  if (!featureFlagModel) {
    throw new Error('FeatureFlag model is not configured for adminPlatformService.');
  }
  return featureFlagModel;
}

function getFeatureFlagAssignmentModel() {
  const assignmentModel = getModels()?.FeatureFlagAssignment;
  if (!assignmentModel) {
    throw new Error('FeatureFlagAssignment model is not configured for adminPlatformService.');
  }
  return assignmentModel;
}

function getLikeOperator() {
  const dialect = getSequelize()?.getDialect?.() ?? 'postgres';
  return dialect === 'postgres' ? Op.iLike : Op.like;
}

function getStatusValues() {
  const values = getFeatureFlagModel()?.rawAttributes?.status?.values;
  return Array.isArray(values) ? values : [];
}

function getRolloutValues() {
  const values = getFeatureFlagModel()?.rawAttributes?.rolloutType?.values;
  return Array.isArray(values) ? values : [];
}

function getAudienceValues() {
  const values = getFeatureFlagAssignmentModel()?.rawAttributes?.audienceType?.values;
  return Array.isArray(values) ? values : [];
}

function reinitialiseLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'adminPlatformService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'adminPlatformService' });
  }
}

export function __setDependencies({ models: overrides, sequelize: sequelizeOverride, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? models;
  sequelizeInstance = sequelizeOverride ?? modelsContainer?.sequelize ?? models.sequelize;
  reinitialiseLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = models;
  sequelizeInstance = models.sequelize;
  reinitialiseLogger();
}

function normaliseKey(key) {
  if (!key) {
    return null;
  }
  const trimmed = `${key}`.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase();
}

function formatAssignment(record) {
  if (!record) {
    return null;
  }
  const plain =
    typeof record.toAssignmentConfig === 'function' ? record.toAssignmentConfig() : record.get({ plain: true });
  return {
    id: plain.id,
    audienceType: plain.audienceType,
    audienceValue: plain.audienceValue,
    rolloutPercentage: plain.rolloutPercentage == null ? null : Number(plain.rolloutPercentage),
    conditions: plain.conditions ?? null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function formatFlag(record, { includeAssignments = false } = {}) {
  if (!record) {
    return null;
  }
  const base = typeof record.toPublicObject === 'function' ? record.toPublicObject() : record.get({ plain: true });
  const assignments = includeAssignments
    ? (Array.isArray(record.assignments) ? record.assignments : []).map(formatAssignment)
    : undefined;
  const response = {
    ...base,
    enabled: base.status === 'active',
  };
  if (assignments !== undefined) {
    response.assignments = assignments;
  }
  return response;
}

function applyMetadata(existing = {}, next = undefined) {
  if (next === undefined) {
    return existing;
  }
  if (next === null) {
    return null;
  }
  if (typeof next !== 'object') {
    throw new ValidationError('metadata must be an object or null.');
  }
  return { ...existing, ...next };
}

function sanitiseAssignments(assignments) {
  if (!assignments) {
    return null;
  }
  if (!Array.isArray(assignments)) {
    throw new ValidationError('assignments must be an array.');
  }
  const audienceValues = getAudienceValues();
  return assignments.map((assignment) => {
    const type = `${assignment.audienceType ?? ''}`.trim().toLowerCase();
    if (!audienceValues.includes(type)) {
      throw new ValidationError(`Unsupported audience type: ${type}`);
    }
    const value = `${assignment.audienceValue ?? ''}`.trim();
    if (!value) {
      throw new ValidationError('audienceValue is required for each assignment.');
    }
    const rolloutPercentage = assignment.rolloutPercentage;
    if (rolloutPercentage != null && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      throw new ValidationError('rolloutPercentage must be between 0 and 100.');
    }
    const expiresAt = assignment.expiresAt ? new Date(assignment.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new ValidationError('expiresAt must be a valid date.');
    }
    return {
      audienceType: type,
      audienceValue: value,
      rolloutPercentage: rolloutPercentage == null ? null : Number(rolloutPercentage),
      conditions: assignment.conditions ?? null,
      expiresAt,
    };
  });
}

export async function listFeatureFlags({ status, search, limit = 25, offset = 0 } = {}) {
  const FeatureFlag = getFeatureFlagModel();
  const likeOperator = getLikeOperator();
  const statusValues = getStatusValues();
  const where = {};
  if (status && statusValues.includes(status)) {
    where.status = status;
  }
  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    where[Op.or] = [
      { key: { [likeOperator]: term } },
      { name: { [likeOperator]: term } },
      { description: { [likeOperator]: term } },
    ];
  }

  const pagination = {
    limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
    offset: Math.max(Number(offset) || 0, 0),
  };

  const { rows, count } = await FeatureFlag.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  return {
    flags: rows.map((row) => formatFlag(row)),
    pagination: {
      total: count,
      ...pagination,
    },
  };
}

export async function getFeatureFlag(flagKey) {
  const FeatureFlag = getFeatureFlagModel();
  const FeatureFlagAssignment = getFeatureFlagAssignmentModel();
  const key = normaliseKey(flagKey);
  if (!key) {
    throw new ValidationError('A feature flag key is required.');
  }

  const flag = await FeatureFlag.findOne({
    where: { key },
    include: [{ model: FeatureFlagAssignment, as: 'assignments' }],
  });

  if (!flag) {
    throw new NotFoundError(`Feature flag with key "${key}" was not found.`);
  }

  return formatFlag(flag, { includeAssignments: true });
}

export async function updateFeatureFlag(flagKey, payload = {}, actor = {}) {
  const sequelize = getSequelize(true);
  const FeatureFlag = getFeatureFlagModel();
  const FeatureFlagAssignment = getFeatureFlagAssignmentModel();
  const statusValues = getStatusValues();
  const rolloutValues = getRolloutValues();
  const key = normaliseKey(flagKey);
  if (!key) {
    throw new ValidationError('A feature flag key is required.');
  }
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('A payload object is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const flag = await FeatureFlag.findOne({
      where: { key },
      include: [{ model: FeatureFlagAssignment, as: 'assignments' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!flag) {
      throw new NotFoundError(`Feature flag with key "${key}" was not found.`);
    }

    const updates = {};

    if (payload.name != null) {
      const name = `${payload.name}`.trim();
      if (!name) {
        throw new ValidationError('name must be a non-empty string when provided.');
      }
      updates.name = name;
    }

    if (payload.description != null) {
      updates.description = `${payload.description}`.trim();
    }

    if (payload.status != null) {
      const status = `${payload.status}`.trim().toLowerCase();
      if (!statusValues.includes(status)) {
        throw new ValidationError(`Unsupported status value: ${status}`);
      }
      updates.status = status;
    }

    if (payload.enabled !== undefined) {
      updates.status = payload.enabled ? 'active' : 'disabled';
    }

    if (payload.rolloutType != null) {
      const rolloutType = `${payload.rolloutType}`.trim().toLowerCase();
      if (!rolloutValues.includes(rolloutType)) {
        throw new ValidationError(`Unsupported rollout type: ${rolloutType}`);
      }
      updates.rolloutType = rolloutType;
    }

    if (payload.rolloutPercentage !== undefined) {
      if (payload.rolloutPercentage == null) {
        updates.rolloutPercentage = null;
      } else {
        const percentage = Number(payload.rolloutPercentage);
        if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
          throw new ValidationError('rolloutPercentage must be a number between 0 and 100.');
        }
        updates.rolloutPercentage = Number(percentage.toFixed(2));
      }
    }

    if (payload.metadata !== undefined) {
      updates.metadata = applyMetadata(flag.metadata ?? {}, payload.metadata);
    }

    if (Object.keys(updates).length) {
      await flag.update(updates, { transaction });
      log.info({ flagKey: key, updates, actor }, 'Updated feature flag metadata.');
    }

    if (payload.assignments !== undefined) {
      const assignments = sanitiseAssignments(payload.assignments);
      await FeatureFlagAssignment.destroy({ where: { flagId: flag.id }, transaction });
      if (assignments && assignments.length) {
        await FeatureFlagAssignment.bulkCreate(
          assignments.map((assignment) => ({
            ...assignment,
            flagId: flag.id,
          })),
          { transaction },
        );
      }
      log.info(
        { flagKey: key, assignmentCount: assignments ? assignments.length : 0, actor },
        'Replaced feature flag assignments.',
      );
    }

    await flag.reload({ include: [{ model: FeatureFlagAssignment, as: 'assignments' }], transaction });
    return formatFlag(flag, { includeAssignments: true });
  });
}

export default {
  listFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
};
