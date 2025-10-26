import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const NAVIGATION_LOCALE_STATUSES = Object.freeze(['ga', 'beta', 'preview']);
export const NAVIGATION_DIRECTIONS = Object.freeze(['ltr', 'rtl']);

export const NavigationLocale = sequelize.define(
  'NavigationLocale',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(12), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(160), allowNull: false },
    nativeLabel: { type: DataTypes.STRING(160), allowNull: false },
    flag: { type: DataTypes.STRING(16), allowNull: true },
    region: { type: DataTypes.STRING(180), allowNull: true },
    coverage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: { type: DataTypes.ENUM(...NAVIGATION_LOCALE_STATUSES), allowNull: false, defaultValue: 'preview' },
    supportLead: { type: DataTypes.STRING(180), allowNull: true },
    lastUpdated: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    direction: { type: DataTypes.ENUM(...NAVIGATION_DIRECTIONS), allowNull: false, defaultValue: 'ltr' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'navigation_locales',
    indexes: [{ fields: ['sortOrder', 'code'] }],
  },
);

NavigationLocale.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const coverageValue = plain.coverage == null ? null : Number.parseFloat(plain.coverage);
  return {
    id: plain.id,
    code: plain.code,
    label: plain.label,
    nativeLabel: plain.nativeLabel,
    region: plain.region ?? '',
    flag: plain.flag ?? '',
    coverage: Number.isFinite(coverageValue) ? coverageValue : null,
    status: plain.status,
    supportLead: plain.supportLead ?? '',
    lastUpdated: plain.lastUpdated ? new Date(plain.lastUpdated).toISOString() : null,
    summary: plain.summary ?? '',
    direction: plain.direction ?? 'ltr',
    isDefault: Boolean(plain.isDefault),
    metadata: plain.metadata ?? {},
    sortOrder: Number.isFinite(plain.sortOrder) ? plain.sortOrder : 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NavigationPersona = sequelize.define(
  'NavigationPersona',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    personaKey: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(160), allowNull: false },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    focusAreas: { type: jsonType, allowNull: false, defaultValue: [] },
    metrics: { type: jsonType, allowNull: false, defaultValue: [] },
    primaryCta: { type: DataTypes.STRING(200), allowNull: true },
    defaultRoute: { type: DataTypes.STRING(2048), allowNull: true },
    timelineEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'navigation_personas',
    indexes: [{ fields: ['sortOrder', 'personaKey'] }],
  },
);

NavigationPersona.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  const normaliseMetrics = ensureArray(plain.metrics).map((metric) => ({
    label: metric?.label ?? '',
    value: metric?.value ?? '',
    trend: metric?.trend ?? null,
    positive: metric?.positive === true,
  }));
  return {
    id: plain.id,
    key: plain.personaKey,
    label: plain.label,
    icon: plain.icon ?? null,
    tagline: plain.tagline ?? '',
    focusAreas: ensureArray(plain.focusAreas).map((item) => `${item}`.trim()).filter(Boolean),
    metrics: normaliseMetrics,
    primaryCta: plain.primaryCta ?? '',
    defaultRoute: plain.defaultRoute ?? null,
    timelineEnabled: Boolean(plain.timelineEnabled),
    metadata: plain.metadata ?? {},
    sortOrder: Number.isFinite(plain.sortOrder) ? plain.sortOrder : 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const NavigationChromeConfig = sequelize.define(
  'NavigationChromeConfig',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    configKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    payload: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'navigation_chrome_configs',
  },
);

NavigationChromeConfig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.configKey,
    description: plain.description ?? '',
    payload: plain.payload ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  NavigationLocale,
  NavigationPersona,
  NavigationChromeConfig,
  sequelize,
};
