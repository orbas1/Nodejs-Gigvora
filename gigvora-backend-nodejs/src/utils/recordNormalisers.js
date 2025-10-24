function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function toPlain(record) {
  if (!record) return null;
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (isPlainObject(record) || Array.isArray(record)) {
    return JSON.parse(JSON.stringify(record));
  }
  return record;
}

export function normaliseNumber(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normaliseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function pickAllowedFields(payload, allowedFields) {
  if (!payload) return {};
  return allowedFields.reduce((accumulator, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      accumulator[field] = payload[field];
    }
    return accumulator;
  }, {});
}

export function createScopedFinder(model, { scopeKey = 'workspaceId', errorFactory } = {}) {
  if (!model || typeof model.findOne !== 'function') {
    throw new Error('A Sequelize model with findOne must be provided.');
  }
  if (typeof errorFactory !== 'function') {
    throw new Error('errorFactory must be a function that returns an Error instance.');
  }

  return async function findScopedOrFail(id, scope = {}) {
    const where = { id };
    if (scopeKey && scope?.[scopeKey] != null) {
      where[scopeKey] = scope[scopeKey];
    }
    const record = await model.findOne({ where });
    if (!record) {
      throw errorFactory();
    }
    return record;
  };
}

export default {
  toPlain,
  normaliseNumber,
  normaliseDate,
  pickAllowedFields,
  createScopedFinder,
};
