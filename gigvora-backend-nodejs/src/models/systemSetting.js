import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const SYSTEM_SETTING_VALUE_TYPES = ['json', 'string', 'number', 'boolean'];
const DEFAULT_ENVIRONMENT = 'global';

const normalizeSystemSettingKey = (key) =>
  String(key ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const normalizeEnvironmentScope = (scope) =>
  String(scope ?? DEFAULT_ENVIRONMENT)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || DEFAULT_ENVIRONMENT;

const coerceValueForType = (valueType, value) => {
  switch (valueType) {
    case 'boolean':
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        return ['1', 'true', 'yes', 'on'].includes(lowered);
      }
      return Boolean(value);
    case 'number': {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      const parsed = Number.parseFloat(String(value ?? ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    case 'string':
      return value == null ? '' : String(value);
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
        return {};
      }
  }
};

export const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'global' },
    description: { type: DataTypes.STRING(255), allowNull: true },
    environmentScope: { type: DataTypes.STRING(80), allowNull: false, defaultValue: DEFAULT_ENVIRONMENT },
    valueType: { type: DataTypes.ENUM(...SYSTEM_SETTING_VALUE_TYPES), allowNull: false, defaultValue: 'json' },
    isSensitive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    updatedBy: { type: DataTypes.STRING(255), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: 'system_settings',
    indexes: [
      { unique: true, fields: ['key', 'environmentScope'] },
      { fields: ['category'] },
      { fields: ['environmentScope'] },
    ],
  },
);

SystemSetting.addHook('beforeValidate', (setting) => {
  setting.key = normalizeSystemSettingKey(setting.key);
  setting.environmentScope = normalizeEnvironmentScope(setting.environmentScope);
  if (!SYSTEM_SETTING_VALUE_TYPES.includes(setting.valueType)) {
    setting.valueType = 'json';
  }
  setting.category = String(setting.category ?? 'global').trim().toLowerCase();
  setting.metadata = setting.metadata ?? {};
  setting.value = coerceValueForType(setting.valueType, setting.value);
  if (!setting.version || setting.version < 1) {
    setting.version = 1;
  }
});

SystemSetting.prototype.getTypedValue = function getTypedValue() {
  return coerceValueForType(this.valueType, this.value);
};

SystemSetting.prototype.toPublicObject = function toPublicObject({ revealSensitive = false } = {}) {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    category: plain.category,
    description: plain.description ?? null,
    environmentScope: plain.environmentScope ?? DEFAULT_ENVIRONMENT,
    valueType: plain.valueType,
    isSensitive: Boolean(plain.isSensitive),
    value: plain.isSensitive && !revealSensitive ? null : coerceValueForType(plain.valueType, plain.value),
    metadata: plain.metadata ?? {},
    updatedBy: plain.updatedBy ?? null,
    version: plain.version ?? 1,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SystemSetting.prototype.updateValue = async function updateValue(value, { updatedBy, metadata, valueType, isSensitive, description, incrementVersion = true } = {}) {
  const nextType = valueType && SYSTEM_SETTING_VALUE_TYPES.includes(valueType) ? valueType : this.valueType;
  const nextValue = coerceValueForType(nextType, value);
  const nextVersion = incrementVersion ? (this.version ?? 1) + 1 : this.version ?? 1;

  if (isSensitive !== undefined) {
    this.isSensitive = Boolean(isSensitive);
  }
  if (description !== undefined) {
    this.description = description;
  }

  this.valueType = nextType;
  this.value = nextValue;
  this.metadata = metadata ? { ...(this.metadata ?? {}), ...metadata } : this.metadata ?? {};
  this.updatedBy = updatedBy ?? this.updatedBy;
  this.version = nextVersion;

  await this.save();
  return this;
};

SystemSetting.ensureSetting = async function ensureSetting(key, {
  value,
  category = 'global',
  description,
  valueType = 'json',
  environmentScope = DEFAULT_ENVIRONMENT,
  isSensitive = false,
  metadata,
  updatedBy,
} = {}) {
  const normalisedKey = normalizeSystemSettingKey(key);
  const scope = normalizeEnvironmentScope(environmentScope);
  const initialType = SYSTEM_SETTING_VALUE_TYPES.includes(valueType) ? valueType : 'json';

  const [setting, created] = await SystemSetting.findOrCreate({
    where: { key: normalisedKey, environmentScope: scope },
    defaults: {
      key: normalisedKey,
      category,
      description,
      environmentScope: scope,
      valueType: initialType,
      isSensitive,
      value: coerceValueForType(initialType, value),
      metadata: metadata ?? {},
      updatedBy,
    },
  });

  if (!created) {
    if (category) {
      setting.category = category;
    }
    if (description !== undefined) {
      setting.description = description;
    }
    if (metadata) {
      setting.metadata = { ...(setting.metadata ?? {}), ...metadata };
    }
    if (value !== undefined) {
      await setting.updateValue(value, { valueType: initialType, updatedBy, isSensitive, description });
    } else if (isSensitive !== undefined) {
      setting.isSensitive = Boolean(isSensitive);
      await setting.save();
    }
  }

  return setting;
};

SystemSetting.resolveValue = async function resolveValue(key, { environmentScope = DEFAULT_ENVIRONMENT, fallback, revealSensitive = false } = {}) {
  const normalisedKey = normalizeSystemSettingKey(key);
  const scopesToCheck = [normalizeEnvironmentScope(environmentScope)];
  if (!scopesToCheck.includes(DEFAULT_ENVIRONMENT)) {
    scopesToCheck.push(DEFAULT_ENVIRONMENT);
  }

  const records = await SystemSetting.findAll({
    where: {
      key: normalisedKey,
      environmentScope: { [Op.in]: scopesToCheck },
    },
    order: [['environmentScope', 'DESC']],
  });

  const record = records.find((item) => item.environmentScope === scopesToCheck[0]) ?? records[0];
  if (!record) {
    return fallback;
  }

  const publicShape = record.toPublicObject({ revealSensitive });
  return publicShape.value ?? fallback;
};

SystemSetting.snapshot = async function snapshot({ environmentScope = DEFAULT_ENVIRONMENT, revealSensitive = false } = {}) {
  const records = await SystemSetting.findAll({ where: { environmentScope: normalizeEnvironmentScope(environmentScope) } });
  return records.map((record) => record.toPublicObject({ revealSensitive }));
};

export default SystemSetting;
