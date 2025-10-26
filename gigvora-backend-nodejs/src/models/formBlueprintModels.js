import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const FORM_BLUEPRINT_STATUSES = Object.freeze(['draft', 'active', 'deprecated']);

export const FormBlueprint = sequelize.define(
  'FormBlueprint',
  {
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    persona: { type: DataTypes.STRING(120), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.ENUM(...FORM_BLUEPRINT_STATUSES), allowNull: false, defaultValue: 'draft' },
    analyticsChannel: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'form_blueprints',
    underscored: true,
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['status'] },
      { fields: ['persona'] },
    ],
  },
);

export const FormBlueprintStep = sequelize.define(
  'FormBlueprintStep',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    stepKey: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    gatingRules: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'form_blueprint_steps',
    underscored: true,
    indexes: [
      { fields: ['blueprint_id', 'order_index'] },
      { unique: true, fields: ['blueprint_id', 'step_key'] },
    ],
  },
);

export const FormBlueprintField = sequelize.define(
  'FormBlueprintField',
  {
    blueprintId: { type: DataTypes.INTEGER, allowNull: false },
    stepId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: false },
    placeholder: { type: DataTypes.STRING(255), allowNull: true },
    helpText: { type: DataTypes.TEXT, allowNull: true },
    component: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'text' },
    dataType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'string' },
    required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    defaultValue: { type: DataTypes.TEXT, allowNull: true },
    options: { type: jsonType, allowNull: true },
    normalizers: { type: jsonType, allowNull: true },
    analytics: { type: jsonType, allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    visibility: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'form_blueprint_fields',
    underscored: true,
    indexes: [
      { fields: ['blueprint_id', 'order_index'] },
      { fields: ['step_id', 'order_index'] },
      { unique: true, fields: ['blueprint_id', 'name'] },
    ],
  },
);

export const FORM_BLUEPRINT_VALIDATION_SEVERITIES = Object.freeze(['error', 'warning']);

export const FormBlueprintValidation = sequelize.define(
  'FormBlueprintValidation',
  {
    fieldId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(120), allowNull: false },
    message: { type: DataTypes.STRING(255), allowNull: false },
    severity: {
      type: DataTypes.ENUM(...FORM_BLUEPRINT_VALIDATION_SEVERITIES),
      allowNull: false,
      defaultValue: 'error',
    },
    haltOnFail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    config: { type: jsonType, allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'form_blueprint_validations',
    underscored: true,
    indexes: [
      { fields: ['field_id', 'order_index'] },
      { fields: ['type'] },
    ],
  },
);

FormBlueprint.hasMany(FormBlueprintStep, { foreignKey: 'blueprintId', as: 'steps', onDelete: 'CASCADE' });
FormBlueprintStep.belongsTo(FormBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });

FormBlueprint.hasMany(FormBlueprintField, { foreignKey: 'blueprintId', as: 'fields', onDelete: 'CASCADE' });
FormBlueprintField.belongsTo(FormBlueprint, { foreignKey: 'blueprintId', as: 'blueprint' });

FormBlueprintStep.hasMany(FormBlueprintField, { foreignKey: 'stepId', as: 'fields', onDelete: 'SET NULL' });
FormBlueprintField.belongsTo(FormBlueprintStep, { foreignKey: 'stepId', as: 'step' });

FormBlueprintField.hasMany(FormBlueprintValidation, { foreignKey: 'fieldId', as: 'validations', onDelete: 'CASCADE' });
FormBlueprintValidation.belongsTo(FormBlueprintField, { foreignKey: 'fieldId', as: 'field' });

function safeJsonParse(value) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
}

function parseDefaultValue(field) {
  const raw = field.defaultValue;
  if (raw == null) {
    return raw;
  }

  const dataType = field.dataType ?? 'string';
  if (dataType === 'boolean') {
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (typeof raw === 'string') {
      const normalised = raw.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalised)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalised)) {
        return false;
      }
    }
    return Boolean(raw);
  }

  if (dataType === 'number' || dataType === 'integer') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }

  if (dataType === 'json') {
    return safeJsonParse(raw);
  }

  return raw;
}

FormBlueprint.prototype.toPublicObject = function toPublicObject({ includeSteps = true, includeFields = true } = {}) {
  const base = {
    id: this.id,
    key: this.key,
    name: this.name,
    description: this.description,
    persona: this.persona,
    version: this.version,
    status: this.status,
    analyticsChannel: this.analyticsChannel,
    metadata: safeJsonParse(this.metadata),
    settings: safeJsonParse(this.settings),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (includeSteps && this.steps) {
    base.steps = this.steps
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((step) => step.toPublicObject({ includeFields }));
  }

  if (includeFields && this.fields) {
    base.fields = this.fields
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((field) => field.toPublicObject());
  }

  return base;
};

FormBlueprintStep.prototype.toPublicObject = function toPublicObject({ includeFields = true } = {}) {
  const payload = {
    id: this.id,
    key: this.stepKey,
    title: this.title,
    description: this.description,
    order: this.orderIndex,
    gatingRules: safeJsonParse(this.gatingRules),
    metadata: safeJsonParse(this.metadata),
  };

  if (includeFields && this.fields) {
    payload.fields = this.fields
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((field) => field.toPublicObject());
  }

  return payload;
};

FormBlueprintField.prototype.toPublicObject = function toPublicObject() {
  return {
    id: this.id,
    name: this.name,
    label: this.label,
    placeholder: this.placeholder,
    helpText: this.helpText,
    component: this.component,
    dataType: this.dataType,
    required: this.required,
    defaultValue: parseDefaultValue(this),
    options: safeJsonParse(this.options),
    normalizers: safeJsonParse(this.normalizers) ?? [],
    analytics: safeJsonParse(this.analytics) ?? {},
    order: this.orderIndex,
    visibility: safeJsonParse(this.visibility),
    metadata: safeJsonParse(this.metadata),
    validations: this.validations
      ? this.validations
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((validation) => validation.toPublicObject())
      : [],
    stepKey: this.step ? this.step.stepKey : null,
  };
};

FormBlueprintValidation.prototype.toPublicObject = function toPublicObject() {
  return {
    id: this.id,
    type: this.type,
    message: this.message,
    severity: this.severity,
    haltOnFail: this.haltOnFail,
    config: safeJsonParse(this.config),
    order: this.orderIndex,
  };
};

export default {
  FormBlueprint,
  FormBlueprintStep,
  FormBlueprintField,
  FormBlueprintValidation,
  FORM_BLUEPRINT_STATUSES,
  FORM_BLUEPRINT_VALIDATION_SEVERITIES,
};
