import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PLATFORM_SETTING_VALUE_TYPES = Object.freeze(['json', 'string', 'number', 'boolean']);
export const PLATFORM_SETTING_CATEGORIES = Object.freeze([
  'general',
  'branding',
  'security',
  'notifications',
  'integrations',
  'compliance',
]);

function normaliseKey(key) {
  if (typeof key !== 'string') {
    return '';
  }
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '.');
}

function normaliseEnvironment(environment) {
  if (typeof environment !== 'string' || environment.trim().length === 0) {
    return 'global';
  }
  const normalised = environment.trim().toLowerCase();
  return ['global', 'development', 'staging', 'production', 'test'].includes(normalised)
    ? normalised
    : 'global';
}

function normaliseCategory(category) {
  const trimmed = typeof category === 'string' ? category.trim().toLowerCase() : 'general';
  return PLATFORM_SETTING_CATEGORIES.includes(trimmed) ? trimmed : 'general';
}

function normaliseTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return Array.from(
    new Set(
      tags
        .map((tag) => `${tag}`.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length <= 40),
    ),
  );
}

function defaultValueForType(valueType) {
  switch (valueType) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'json':
    default:
      return {};
  }
}

function coerceValueForType(value, valueType) {
  switch (valueType) {
    case 'string':
      return value == null ? '' : `${value}`;
    case 'number': {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
      throw new TypeError('PlatformSetting value must be numeric');
    }
    case 'boolean':
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      if (typeof value === 'string') {
        const normalised = value.trim().toLowerCase();
        return ['true', '1', 'yes', 'enabled'].includes(normalised);
      }
      return Boolean(value);
    case 'json':
    default:
      if (value == null) {
        return {};
      }
      if (typeof value === 'object') {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new TypeError('PlatformSetting value must be JSON serializable');
      }
  }
}

export const PlatformSetting = sequelize.define(
  'PlatformSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: 'platform_settings_key_scope',
      validate: {
        is: /^[a-z0-9_.:-]+$/i,
        len: [1, 160],
      },
      set(value) {
        this.setDataValue('key', normaliseKey(value));
      },
    },
    environmentScope: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'global',
      set(value) {
        this.setDataValue('environmentScope', normaliseEnvironment(value));
      },
    },
    category: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'general',
      set(value) {
        this.setDataValue('category', normaliseCategory(value));
      },
    },
    description: { type: DataTypes.STRING(500), allowNull: true },
    valueType: {
      type: DataTypes.ENUM(...PLATFORM_SETTING_VALUE_TYPES),
      allowNull: false,
      defaultValue: 'json',
      validate: { isIn: [PLATFORM_SETTING_VALUE_TYPES] },
    },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
    isEditable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isSensitive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    lockedAt: { type: DataTypes.DATE, allowNull: true },
    lockedBy: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: 'platform_settings',
    indexes: [
      { unique: true, fields: ['key', 'environmentScope'] },
      { fields: ['category'] },
    ],
  },
);

PlatformSetting.addHook('beforeValidate', (setting) => {
  const key = normaliseKey(setting.key);
  setting.key = key;
  setting.environmentScope = normaliseEnvironment(setting.environmentScope);
  setting.category = normaliseCategory(setting.category);
  setting.tags = normaliseTags(setting.tags);

  const valueType = PLATFORM_SETTING_VALUE_TYPES.includes(setting.valueType)
    ? setting.valueType
    : 'json';
  setting.valueType = valueType;

  if (setting.value == null) {
    setting.value = defaultValueForType(valueType);
  } else if (valueType !== 'json') {
    setting.value = coerceValueForType(setting.value, valueType);
  }
});

PlatformSetting.prototype.getTypedValue = function getTypedValue() {
  return coerceValueForType(this.value, this.valueType);
};

PlatformSetting.prototype.updateValue = async function updateValue(newValue, { updatedBy } = {}) {
  if (!this.isEditable) {
    throw new Error('Platform setting is locked and cannot be modified');
  }

  const coerced = coerceValueForType(newValue, this.valueType);
  this.value = coerced;
  this.version += 1;
  if (updatedBy) {
    this.updatedBy = updatedBy;
  }
  await this.save();
  return this;
};

PlatformSetting.prototype.toPublicObject = function toPublicObject({ revealSensitive = false } = {}) {
  const plain = this.get({ plain: true });
  const value = this.isSensitive && !revealSensitive ? null : coerceValueForType(plain.value, plain.valueType);
  return {
    id: plain.id,
    key: plain.key,
    environmentScope: plain.environmentScope,
    category: plain.category,
    description: plain.description ?? '',
    valueType: plain.valueType,
    value,
    hasValue: plain.value != null,
    isEditable: Boolean(plain.isEditable),
    isSensitive: Boolean(plain.isSensitive),
    tags: normaliseTags(plain.tags),
    metadata: plain.metadata ?? {},
    updatedBy: plain.updatedBy ?? null,
    version: plain.version,
    lockedAt: plain.lockedAt ?? null,
    lockedBy: plain.lockedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

PlatformSetting.findByKey = async function findByKey(key, { environment } = {}) {
  const normalisedKey = normaliseKey(key);
  if (!normalisedKey) {
    return null;
  }

  const environmentScope = normaliseEnvironment(environment);
  return PlatformSetting.findOne({
    where: {
      key: normalisedKey,
      environmentScope: { [Op.in]: [environmentScope, 'global'] },
    },
    order: [['environmentScope', 'DESC'], ['updatedAt', 'DESC']],
  });
};

PlatformSetting.ensureSetting = async function ensureSetting(key, { value, ...attributes } = {}) {
  const normalisedKey = normaliseKey(key);
  if (!normalisedKey) {
    throw new Error('Platform settings require a valid key');
  }

  const [setting] = await PlatformSetting.findOrCreate({
    where: { key: normalisedKey, environmentScope: normaliseEnvironment(attributes.environmentScope) },
    defaults: {
      ...attributes,
      key: normalisedKey,
      value: value ?? defaultValueForType(attributes.valueType ?? 'json'),
    },
  });

  if (value !== undefined) {
    await setting.updateValue(value, { updatedBy: attributes.updatedBy });
  }

  return setting;
};

export default PlatformSetting;
