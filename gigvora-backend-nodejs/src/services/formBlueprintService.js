import { Op, fn, col, where as sequelizeWhere } from 'sequelize';
import {
  FormBlueprint,
  FormBlueprintStep,
  FormBlueprintField,
  FormBlueprintValidation,
} from '../models/formBlueprintModels.js';
import models from '../models/index.js';

const { ProviderWorkspace, User } = models;

function normaliseLimit(limit) {
  if (limit == null) {
    return undefined;
  }
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.min(parsed, 50);
}

function buildInclude({ includeSteps = false, includeFields = false } = {}) {
  const validationInclude = includeFields
    ? [{ model: FormBlueprintValidation, as: 'validations' }]
    : [];

  const stepInclude = includeSteps
    ? [
        {
          model: FormBlueprintStep,
          as: 'steps',
          include: includeFields
            ? [
                {
                  model: FormBlueprintField,
                  as: 'fields',
                  include: validationInclude,
                },
              ]
            : [],
        },
      ]
    : [];

  const include = [];
  include.push(...stepInclude);
  if (includeFields) {
    include.push({ model: FormBlueprintField, as: 'fields', include: validationInclude });
  }

  return include;
}

function buildOrderClauses({ includeSteps = false, includeFields = false } = {}) {
  const order = [['name', 'ASC']];
  if (includeSteps) {
    order.push([{ model: FormBlueprintStep, as: 'steps' }, 'orderIndex', 'ASC']);
    if (includeFields) {
      order.push([
        { model: FormBlueprintStep, as: 'steps' },
        { model: FormBlueprintField, as: 'fields' },
        'orderIndex',
        'ASC',
      ]);
    }
  }
  if (includeFields) {
    order.push([{ model: FormBlueprintField, as: 'fields' }, 'orderIndex', 'ASC']);
    order.push([
      { model: FormBlueprintField, as: 'fields' },
      { model: FormBlueprintValidation, as: 'validations' },
      'orderIndex',
      'ASC',
    ]);
  }
  return order;
}

function deriveFieldDefaults(blueprint) {
  const fields = [];
  if (blueprint.fields?.length) {
    fields.push(...blueprint.fields);
  }
  if (blueprint.steps?.length) {
    blueprint.steps.forEach((step) => {
      if (step.fields?.length) {
        fields.push(...step.fields);
      }
    });
  }

  const defaults = {};
  fields.forEach((field) => {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      defaults[field.name] = field.defaultValue;
    } else if (field.dataType === 'boolean') {
      defaults[field.name] = false;
    } else {
      defaults[field.name] = null;
    }
  });

  return defaults;
}

function toBlueprintResponse(blueprint, { includeSteps = false, includeFields = false } = {}) {
  if (!blueprint) {
    return null;
  }
  const payload = blueprint.toPublicObject({ includeSteps, includeFields });
  if (includeSteps || includeFields) {
    payload.initialValues = deriveFieldDefaults(payload);
  }
  return payload;
}

export async function listFormBlueprints({
  status,
  persona,
  includeSteps = false,
  includeFields = false,
  limit,
} = {}) {
  const where = {};
  if (status) {
    if (Array.isArray(status)) {
      where.status = { [Op.in]: status }; // status values validated by caller
    } else {
      where.status = status;
    }
  }
  if (persona) {
    where.persona = Array.isArray(persona) ? { [Op.in]: persona } : persona;
  }

  const include = buildInclude({ includeSteps, includeFields });
  const order = buildOrderClauses({ includeSteps, includeFields });

  const blueprints = await FormBlueprint.findAll({
    where,
    include,
    order,
    distinct: true,
    limit: normaliseLimit(limit),
  });

  return {
    count: blueprints.length,
    items: blueprints.map((blueprint) => toBlueprintResponse(blueprint, { includeSteps, includeFields })),
  };
}

export async function getFormBlueprintByKey(
  key,
  { includeSteps = true, includeFields = true, status } = {},
) {
  if (!key) {
    throw new Error('Blueprint key is required.');
  }
  const where = { key };
  if (status) {
    where.status = status;
  }
  const include = buildInclude({ includeSteps, includeFields });
  const order = buildOrderClauses({ includeSteps, includeFields });

  const blueprint = await FormBlueprint.findOne({
    where,
    include,
    order,
    distinct: true,
  });

  if (!blueprint) {
    return null;
  }

  const response = toBlueprintResponse(blueprint, { includeSteps, includeFields });
  response.initialValues = deriveFieldDefaults(response);
  return response;
}

function applyFieldNormalizers(field, value) {
  if (!field) {
    return value;
  }
  const normalizers = Array.isArray(field.normalizers)
    ? field.normalizers
    : Array.isArray(field.normalizers?.items)
    ? field.normalizers.items
    : [];

  return normalizers.reduce((current, normalizer) => {
    if (!normalizer) {
      return current;
    }
    const normaliserValue = typeof normalizer === 'string' ? normalizer : normalizer.type;
    switch (normaliserValue) {
      case 'trim':
        return typeof current === 'string' ? current.trim() : current;
      case 'toLowerCase':
        return typeof current === 'string' ? current.toLowerCase() : current;
      case 'toUpperCase':
        return typeof current === 'string' ? current.toUpperCase() : current;
      default:
        return current;
    }
  }, value);
}

function normaliseBoolean(value) {
  if (value === true || value === false) {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalised)) {
      return false;
    }
  }
  return Boolean(value);
}

function validateRequired(field, value) {
  if (field.dataType === 'boolean') {
    return normaliseBoolean(value) ? null : field.requiredMessage ?? field.message;
  }
  if (Array.isArray(value)) {
    return value.length ? null : field.message;
  }
  if (value === null || value === undefined) {
    return field.message;
  }
  if (typeof value === 'string') {
    return value.trim() ? null : field.message;
  }
  return null;
}

function validateMinLength(config, value, message) {
  if (value == null) {
    return null;
  }
  const candidate = typeof value === 'string' ? value : String(value);
  if (candidate.length >= config?.min) {
    return null;
  }
  return message ?? `Use at least ${config?.min ?? 0} characters.`;
}

function validateEnum(config, value, message) {
  if (value == null || value === '') {
    return null;
  }
  const options = Array.isArray(config?.options) ? config.options : [];
  if (!options.length) {
    return null;
  }
  return options.includes(value) ? null : message ?? 'Choose a value from the provided options.';
}

function validatePattern(config, value, message) {
  if (value == null || value === '') {
    return null;
  }
  const pattern = config?.pattern ? new RegExp(config.pattern, config.flags ?? '') : null;
  if (!pattern) {
    return null;
  }
  return pattern.test(String(value)) ? null : message ?? 'Value is not in the expected format.';
}

function validateEmail(value, message) {
  if (value == null || value === '') {
    return null;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value).trim()) ? null : message ?? 'Enter a valid email address.';
}

function validateUrl(config, value, message) {
  if (!value) {
    return null;
  }
  try {
    const candidate = String(value).trim();
    if (!candidate) {
      return null;
    }
    const parsed = new URL(candidate);
    if (!config?.allowProtocolRelative && !parsed.protocol) {
      throw new Error('missing protocol');
    }
    return null;
  } catch (error) {
    return message ?? 'Enter a valid URL.';
  }
}

function validatePasswordStrength(config, value, message) {
  if (value == null || value === '') {
    return null;
  }
  const candidate = String(value);
  const minLength = config?.minLength ?? 8;
  if (candidate.length < minLength) {
    return message ?? `Use at least ${minLength} characters.`;
  }
  if (config?.requireNumber && !/\d/.test(candidate)) {
    return message ?? 'Include at least one number.';
  }
  if (config?.requireLetter && !/[a-zA-Z]/.test(candidate)) {
    return message ?? 'Include at least one letter.';
  }
  if (config?.requireSymbol && !/[^\da-zA-Z]/.test(candidate)) {
    return message ?? 'Include at least one symbol.';
  }
  return null;
}

function validateMatchesField(config, value, context, message) {
  if (!config?.otherField) {
    return null;
  }
  const otherValue = context?.values?.[config.otherField];
  return value === otherValue ? null : message ?? 'Values do not match.';
}

function validateAccepted(value, message) {
  return normaliseBoolean(value) ? null : message ?? 'Please accept to continue.';
}

const BUILTIN_VALIDATORS = {
  required: ({ field, value, message }) => validateRequired(field, value, message),
  min_length: ({ config, value, message }) => validateMinLength(config, value, message),
  pattern: ({ config, value, message }) => validatePattern(config, value, message),
  email: ({ value, message }) => validateEmail(value, message),
  url: ({ config, value, message }) => validateUrl(config, value, message),
  enum: ({ config, value, message }) => validateEnum(config, value, message),
  password_strength: ({ config, value, message }) => validatePasswordStrength(config, value, message),
  matches_field: ({ config, value, context, message }) => validateMatchesField(config, value, context, message),
  accepted: ({ value, message }) => validateAccepted(value, message),
};

async function handleUniqueWorkspaceName(value) {
  if (!value) {
    return null;
  }
  const candidate = String(value).trim();
  if (!candidate) {
    return null;
  }
  const match = await ProviderWorkspace.findOne({
    where: sequelizeWhere(fn('LOWER', col('name')), candidate.toLowerCase()),
  });
  return match ? 'A workspace with this name already exists on Gigvora.' : null;
}

async function handleUniqueWorkspaceContact(value) {
  if (!value) {
    return null;
  }
  const candidate = String(value).trim().toLowerCase();
  if (!candidate) {
    return null;
  }
  const existing = await User.findOne({
    where: sequelizeWhere(fn('LOWER', col('email')), candidate),
  });
  return existing ? 'This email already manages a workspace on Gigvora.' : null;
}

function handleRecommendedToggle(value, message) {
  return normaliseBoolean(value)
    ? null
    : message ?? 'We recommend enabling this setting to protect your workspace.';
}

async function runValidationRule(field, rule, value, context) {
  const payload = {
    field,
    value,
    config: rule.config ?? {},
    message: rule.message,
    context,
  };

  const handler = BUILTIN_VALIDATORS[rule.type];
  if (handler) {
    return handler(payload);
  }

  switch (rule.type) {
    case 'unique_workspace_name':
      return handleUniqueWorkspaceName(value);
    case 'unique_workspace_contact':
      return handleUniqueWorkspaceContact(value);
    case 'recommended_toggle':
      return handleRecommendedToggle(value, rule.message);
    default:
      return null;
  }
}

function formatValidationOutput(field, messages, severity) {
  if (!messages.length) {
    return [];
  }
  return messages.map((message) => ({
    field: field.name,
    label: field.label,
    message,
    severity,
  }));
}

export async function validateFormBlueprintField(blueprintKey, fieldName, value, context = {}) {
  if (!blueprintKey) {
    throw new Error('Blueprint key is required.');
  }
  if (!fieldName) {
    throw new Error('Field name is required.');
  }

  const blueprint = await FormBlueprint.findOne({
    where: { key: blueprintKey },
    include: [{
      model: FormBlueprintField,
      as: 'fields',
      include: [{ model: FormBlueprintValidation, as: 'validations' }],
    }],
  });

  if (!blueprint) {
    throw new Error('Form blueprint not found.');
  }

  const field = blueprint.fields?.find((candidate) => candidate.name === fieldName);
  if (!field) {
    return {
      valid: true,
      value,
      errors: [],
      warnings: [],
    };
  }

  const normalisedValue = applyFieldNormalizers(field, value);
  const errors = [];
  const warnings = [];

  const rules = field.validations ?? [];
  for (const rule of rules) {
    const result = await runValidationRule(field, rule, normalisedValue, context);
    if (!result) {
      continue;
    }
    if ((rule.severity ?? 'error') === 'warning') {
      warnings.push(result);
      continue;
    }
    errors.push(result);
    if (rule.haltOnFail ?? true) {
      break;
    }
  }

  return {
    valid: errors.length === 0,
    value: normalisedValue,
    errors: formatValidationOutput(field, errors, 'error'),
    warnings: formatValidationOutput(field, warnings, 'warning'),
  };
}

export default {
  listFormBlueprints,
  getFormBlueprintByKey,
  validateFormBlueprintField,
};
