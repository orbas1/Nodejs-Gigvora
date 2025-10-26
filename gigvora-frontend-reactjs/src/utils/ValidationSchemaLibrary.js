import { cloneDeep, getNestedValue, setNestedValue } from './object.js';
import { isNonEmpty, isValidEmail } from './validation.js';

const defaultSchemaOptions = {
  abortEarly: true,
  includeFieldNamesInErrorMessage: true,
  messageCatalog: null,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function deepMerge(target, source) {
  if (source == null) {
    return cloneDeep(target);
  }
  if (target == null) {
    return cloneDeep(source);
  }
  const output = Array.isArray(target) ? [...target] : { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      output[key] = [...value];
      return;
    }
    if (value && typeof value === 'object') {
      const base = Array.isArray(value) ? [] : output[key];
      output[key] = deepMerge(base ?? {}, value);
      return;
    }
    output[key] = value;
  });
  return output;
}

function toPath(name) {
  if (Array.isArray(name)) {
    return name;
  }
  return String(name)
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof structuredClone === 'function') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (error) {
      console.warn('Unable to compare values in ValidationSchemaLibrary', error);
    }
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.warn('Unable to compare values in ValidationSchemaLibrary', error);
    return false;
  }
}

function sentenceCase(value) {
  if (!value) {
    return '';
  }
  const spaced = String(value)
    .replace(/[A-Z]/g, (match) => ` ${match}`)
    .replace(/[-_]/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function createValidator(name, validate, meta = {}) {
  return {
    name,
    meta,
    async run(value, context) {
      return validate(value, context);
    },
  };
}

function resolveCatalogMessage(message, messageKey, fallback, messageCatalog) {
  if (typeof message === 'string' && messageCatalog?.[message]) {
    return messageCatalog[message];
  }
  if (typeof message === 'string') {
    return message;
  }
  if (messageKey && messageCatalog?.[messageKey]) {
    return messageCatalog[messageKey];
  }
  if (typeof fallback === 'string' && messageCatalog?.[fallback]) {
    return messageCatalog[fallback];
  }
  if (message != null) {
    return message;
  }
  return fallback;
}

function normaliseValidationResult(result, fallbackLabel, messageCatalog) {
  if (result == null || result === true) {
    return null;
  }
  if (result === false) {
    return { type: 'error', message: `${fallbackLabel} is invalid.` };
  }
  if (typeof result === 'string') {
    return {
      type: 'error',
      message: resolveCatalogMessage(result, null, `${fallbackLabel} is invalid.`, messageCatalog),
    };
  }
  if (typeof result === 'object') {
    const type = result.type ?? 'error';
    const message = resolveCatalogMessage(
      result.message,
      result.messageKey,
      `${fallbackLabel} is invalid.`,
      messageCatalog,
    );
    return { type, message };
  }
  return { type: 'error', message: `${fallbackLabel} is invalid.` };
}

function runNormalizers(field, value, context) {
  if (!field.normalizers.length) {
    return value;
  }
  return field.normalizers.reduce((current, normalizer) => {
    try {
      return normalizer(current, context);
    } catch (error) {
      console.warn(`Normalizer failed for ${field.name}`, error);
      return current;
    }
  }, value);
}

function normaliseFieldConfig(name, rawConfig) {
  let config = rawConfig;
  if (typeof config === 'function') {
    config = config();
  }
  if (Array.isArray(config)) {
    config = { validators: config };
  }
  if (config == null || typeof config !== 'object') {
    config = {};
  }
  const label = config.label ?? sentenceCase(name);
  return {
    name,
    label,
    defaultValue: cloneDeep(config.defaultValue),
    meta: config.meta ?? {},
    validators: ensureArray(config.validators),
    warningValidators: ensureArray(config.warnings),
    normalizers: ensureArray(config.normalizers),
  };
}

function createValidatorContext(field, values, context) {
  return {
    field,
    values,
    context,
    getValue(path) {
      return getNestedValue(values, toPath(path));
    },
  };
}

function formatFieldErrorMessage(field, message, options) {
  if (!options.includeFieldNamesInErrorMessage) {
    return message;
  }
  if (!message.toLowerCase().includes(field.label.toLowerCase())) {
    return `${field.label}: ${message}`;
  }
  return message;
}

export function createValidationSchema(descriptor = {}, schemaOptions = {}) {
  const options = { ...defaultSchemaOptions, ...schemaOptions };
  const fieldEntries = Object.entries(descriptor).map(([name, config]) => normaliseFieldConfig(name, config));
  const fieldMap = new Map(fieldEntries.map((field) => [field.name, field]));
  const defaults = fieldEntries.reduce((accumulator, field) => {
    if (field.defaultValue !== undefined) {
      return setNestedValue(accumulator, toPath(field.name), field.defaultValue);
    }
    return accumulator;
  }, {});

  function getField(name) {
    return fieldMap.get(name) ?? null;
  }

  function getInitialValues() {
    return cloneDeep(defaults);
  }

  function mergeWithDefaults(values = {}) {
    return deepMerge(getInitialValues(), values);
  }

  function normalizeFieldValue(name, value, values = {}, context = {}) {
    const field = getField(name);
    if (!field) {
      return value;
    }
    return runNormalizers(field, value, createValidatorContext(field, values, context));
  }

  function normalizeValues(values = {}, context = {}) {
    let next = values;
    fieldEntries.forEach((field) => {
      const path = toPath(field.name);
      const existing = getNestedValue(next, path);
      const normalized = runNormalizers(field, existing, createValidatorContext(field, next, context));
      if (!deepEqual(existing, normalized)) {
        next = setNestedValue(next, path, normalized);
      }
    });
    return next;
  }

  async function validateField(name, value, values = {}, context = {}) {
    const field = getField(name);
    if (!field) {
      return { valid: true, errors: [], warnings: [], value };
    }
    const path = toPath(name);
    const workingValues = value === undefined ? values : setNestedValue(values, path, value);
    const validatorContext = createValidatorContext(field, workingValues, context);
    const preparedValue = runNormalizers(field, getNestedValue(workingValues, path), validatorContext);
    const errors = [];
    const warnings = [];

    for (const validator of field.validators) {
      const result = await validator.run(preparedValue, validatorContext);
      const normalizedResult = normaliseValidationResult(result, field.label, options.messageCatalog);
      if (!normalizedResult) {
        continue;
      }
      if (normalizedResult.type === 'warning') {
        warnings.push(formatFieldErrorMessage(field, normalizedResult.message, options));
        continue;
      }
      errors.push(formatFieldErrorMessage(field, normalizedResult.message, options));
      if (options.abortEarly) {
        break;
      }
    }

    if (!errors.length && field.warningValidators.length) {
      for (const validator of field.warningValidators) {
        const result = await validator.run(preparedValue, validatorContext);
        const normalizedResult = normaliseValidationResult(
          result,
          field.label,
          options.messageCatalog,
        );
        if (!normalizedResult) {
          continue;
        }
        warnings.push(formatFieldErrorMessage(field, normalizedResult.message, options));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      value: preparedValue,
    };
  }

  async function validate(values = {}, context = {}) {
    let workingValues = mergeWithDefaults(values);
    const errors = {};
    const warnings = {};
    const fieldResults = {};

    for (const field of fieldEntries) {
      const path = toPath(field.name);
      const currentValue = getNestedValue(workingValues, path);
      const result = await validateField(field.name, currentValue, workingValues, context);
      fieldResults[field.name] = result;
      if (!deepEqual(currentValue, result.value)) {
        workingValues = setNestedValue(workingValues, path, result.value);
      }
      if (result.errors.length) {
        errors[field.name] = options.abortEarly || result.errors.length === 1 ? result.errors[0] : result.errors;
      }
      if (result.warnings.length) {
        warnings[field.name] = result.warnings;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      values: workingValues,
      errors,
      warnings,
      fieldResults,
    };
  }

  function listFieldNames() {
    return fieldEntries.map((field) => field.name);
  }

  return {
    fieldNames: listFieldNames(),
    getInitialValues,
    mergeWithDefaults,
    hasField: (name) => fieldMap.has(name),
    getField,
    normalizeFieldValue,
    normalizeValues,
    validate,
    validateField,
  };
}

export const validators = {
  required(message = 'This field is required.') {
    return createValidator('required', (value) => {
      if (Array.isArray(value)) {
        return value.length ? null : message;
      }
      if (typeof value === 'number') {
        return Number.isNaN(value) ? message : null;
      }
      if (!isNonEmpty(value)) {
        return message;
      }
      return null;
    });
  },
  email(message = 'Enter a valid email address.') {
    return createValidator('email', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      const candidate = typeof value === 'string' ? value.trim() : value;
      if (isValidEmail(candidate)) {
        return null;
      }
      if (EMAIL_REGEX.test(String(candidate))) {
        return null;
      }
      return message;
    });
  },
  minLength(min, message) {
    return createValidator('minLength', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      const candidate = typeof value === 'string' || Array.isArray(value) ? value : String(value ?? '');
      const length = candidate.length;
      if (length >= min) {
        return null;
      }
      return message ?? `Use at least ${min} characters.`;
    });
  },
  maxLength(max, message) {
    return createValidator('maxLength', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      const candidate = typeof value === 'string' || Array.isArray(value) ? value : String(value ?? '');
      if (candidate.length <= max) {
        return null;
      }
      return message ?? `Use ${max} characters or fewer.`;
    });
  },
  matchesField(otherField, message = 'Does not match.') {
    return createValidator('matchesField', (value, { values }) => {
      const otherValue = getNestedValue(values, toPath(otherField));
      if (value === otherValue) {
        return null;
      }
      return message;
    }, { otherField });
  },
  pattern(regexp, message = 'Value is not in the expected format.') {
    return createValidator('pattern', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      if (regexp.test(String(value))) {
        return null;
      }
      return message;
    }, { pattern: regexp });
  },
  url(message = 'Enter a valid URL.', { allowProtocolRelative = false } = {}) {
    return createValidator('url', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      try {
        const candidate = String(value).trim();
        const parsed = new URL(candidate);
        if (!allowProtocolRelative && !parsed.protocol) {
          throw new Error('missing protocol');
        }
        return null;
      } catch (error) {
        return message;
      }
    }, { allowProtocolRelative });
  },
  numberRange({ min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, inclusive = true, message } = {}) {
    return createValidator('numberRange', (value) => {
      if (value == null || value === '') {
        return null;
      }
      const candidate = Number(value);
      if (Number.isNaN(candidate)) {
        return message ?? 'Enter a valid number.';
      }
      if (inclusive) {
        if (candidate < min) {
          return message ?? `Enter a value greater than or equal to ${min}.`;
        }
        if (candidate > max) {
          return message ?? `Enter a value less than or equal to ${max}.`;
        }
        return null;
      }
      if (candidate <= min || candidate >= max) {
        return message ?? `Enter a value between ${min} and ${max}.`;
      }
      return null;
    }, { min, max, inclusive });
  },
  oneOf(options, message = 'Choose a permitted value.') {
    const allowed = new Set(options);
    return createValidator('oneOf', (value) => {
      if (value == null || value === '') {
        return null;
      }
      if (allowed.has(value)) {
        return null;
      }
      return message;
    }, { options });
  },
  custom(validator) {
    return createValidator('custom', (value, context) => validator(value, context));
  },
  passwordStrength({ minLength = 8, requireNumber = true, requireLetter = true, requireSymbol = false } = {}, message) {
    return createValidator('passwordStrength', (value) => {
      if (!isNonEmpty(value)) {
        return null;
      }
      const candidate = String(value);
      if (candidate.length < minLength) {
        return message ?? `Use at least ${minLength} characters.`;
      }
      if (requireNumber && !/\d/.test(candidate)) {
        return message ?? 'Include at least one number.';
      }
      if (requireLetter && !/[a-zA-Z]/.test(candidate)) {
        return message ?? 'Include at least one letter.';
      }
      if (requireSymbol && !/[^\da-zA-Z]/.test(candidate)) {
        return message ?? 'Include at least one symbol.';
      }
      return null;
    }, { minLength, requireNumber, requireLetter, requireSymbol });
  },
  booleanTrue(message = 'Please accept to continue.') {
    return createValidator('booleanTrue', (value) => {
      if (value === true) {
        return null;
      }
      if (typeof value === 'string') {
        const normalised = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalised)) {
          return null;
        }
      }
      return message;
    });
  },
};

export const normalizers = {
  trim() {
    return (value) => (typeof value === 'string' ? value.trim() : value);
  },
  toLowerCase() {
    return (value) => (typeof value === 'string' ? value.toLowerCase() : value);
  },
  toUpperCase() {
    return (value) => (typeof value === 'string' ? value.toUpperCase() : value);
  },
  toNumber(fallback = null) {
    return (value) => {
      if (value == null || value === '') {
        return fallback;
      }
      const candidate = Number(value);
      return Number.isNaN(candidate) ? fallback : candidate;
    };
  },
  toBoolean(defaultValue = false) {
    return (value) => {
      if (value == null || value === '') {
        return defaultValue;
      }
      if (typeof value === 'boolean') {
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
    };
  },
  uniqueArray() {
    return (value) => {
      if (!Array.isArray(value)) {
        return value;
      }
      return Array.from(new Set(value));
    };
  },
};

export function composeValidators(...fns) {
  const validatorsList = fns.flat().filter(Boolean);
  return validatorsList.map((validator, index) => {
    if (validator?.run) {
      return validator;
    }
    return createValidator(`composed-${index}`, validator);
  });
}

function collectBlueprintFields(blueprint) {
  if (!blueprint) {
    return [];
  }
  const fieldMap = new Map();
  if (Array.isArray(blueprint.fields)) {
    blueprint.fields.forEach((field) => {
      if (field?.name) {
        fieldMap.set(field.name, { ...field });
      }
    });
  }
  if (Array.isArray(blueprint.steps)) {
    blueprint.steps.forEach((step) => {
      const fields = Array.isArray(step?.fields) ? step.fields : [];
      const stepKey = step?.key ?? step?.stepKey ?? step?.step_key ?? null;
      fields.forEach((field) => {
        if (!field?.name) {
          return;
        }
        const nextField = { ...field };
        if (nextField.stepKey == null && nextField.step_key == null) {
          nextField.stepKey = stepKey;
        }
        fieldMap.set(nextField.name, nextField);
      });
    });
  }
  return Array.from(fieldMap.values());
}

function mapBlueprintNormalizer(identifier, field) {
  if (!identifier) {
    return null;
  }
  if (typeof identifier === 'function') {
    return identifier;
  }
  if (typeof identifier === 'string') {
    switch (identifier) {
      case 'trim':
        return normalizers.trim();
      case 'toLowerCase':
        return normalizers.toLowerCase();
      case 'toUpperCase':
        return normalizers.toUpperCase();
      case 'toNumber':
        return normalizers.toNumber();
      case 'toBoolean':
        return normalizers.toBoolean(field?.defaultValue ?? false);
      default:
        return null;
    }
  }
  if (typeof identifier === 'object' && identifier.type) {
    const { type, fallback, defaultValue } = identifier;
    switch (type) {
      case 'trim':
        return normalizers.trim();
      case 'toLowerCase':
        return normalizers.toLowerCase();
      case 'toUpperCase':
        return normalizers.toUpperCase();
      case 'toNumber':
        return normalizers.toNumber(fallback);
      case 'toBoolean':
        return normalizers.toBoolean(defaultValue ?? field?.defaultValue ?? false);
      default:
        return null;
    }
  }
  return null;
}

function resolveBlueprintMessage(rule, messageCatalog) {
  if (rule.message) {
    return rule.message;
  }
  if (rule.messageKey && messageCatalog?.[rule.messageKey]) {
    return messageCatalog[rule.messageKey];
  }
  if (messageCatalog?.[rule.type]) {
    return messageCatalog[rule.type];
  }
  return undefined;
}

const blueprintValidatorFactories = {
  required: (rule) => validators.required(rule.message),
  min_length: (rule) => validators.minLength(rule.config?.min ?? 0, rule.message),
  max_length: (rule) => validators.maxLength(rule.config?.max ?? Number.POSITIVE_INFINITY, rule.message),
  pattern: (rule) => {
    if (!rule.config?.pattern) {
      return null;
    }
    try {
      const regexp = new RegExp(rule.config.pattern, rule.config.flags ?? '');
      return validators.pattern(regexp, rule.message);
    } catch (error) {
      return null;
    }
  },
  email: (rule) => validators.email(rule.message),
  enum: (rule) => validators.oneOf(rule.config?.options ?? [], rule.message),
  number_range: (rule) =>
    validators.numberRange({
      min: rule.config?.min,
      max: rule.config?.max,
      inclusive: rule.config?.inclusive !== false,
      message: rule.message,
    }),
  matches_field: (rule) => validators.matchesField(rule.config?.otherField, rule.message),
  url: (rule) => validators.url(rule.message, rule.config ?? {}),
  password_strength: (rule) => validators.passwordStrength(rule.config ?? {}, rule.message),
  accepted: (rule) => validators.booleanTrue(rule.message),
  recommended_toggle: (rule, field) => {
    const toBool = normalizers.toBoolean(field?.defaultValue ?? true);
    return validators.custom((value) => {
      if (toBool(value)) {
        return null;
      }
      return { type: 'warning', message: rule.message ?? 'We recommend keeping this enabled.' };
    });
  },
};

export function createSchemaFromBlueprint(
  blueprint,
  { asyncValidators = {}, schemaOptions = {}, messageCatalog } = {},
) {
  if (!blueprint) {
    return null;
  }

  const fields = collectBlueprintFields(blueprint);
  if (!fields.length) {
    return null;
  }

  const descriptor = {};

  fields.forEach((field) => {
    const validatorsList = [];
    const warningValidators = [];
    const configuredNormalizers = Array.isArray(field.normalizers) ? field.normalizers : [];
    const mappedNormalizers = configuredNormalizers
      .map((identifier) => mapBlueprintNormalizer(identifier, field))
      .filter(Boolean);

    const hasBooleanNormalizer = configuredNormalizers.some((identifier) => {
      if (typeof identifier === 'string') {
        return identifier === 'toBoolean';
      }
      if (typeof identifier === 'object' && identifier?.type) {
        return identifier.type === 'toBoolean';
      }
      return false;
    });

    if (field.dataType === 'boolean' && !hasBooleanNormalizer) {
      mappedNormalizers.push(normalizers.toBoolean(field.defaultValue ?? false));
    }

    const rules = Array.isArray(field.validations) ? field.validations : [];
    rules.forEach((rule) => {
      const enrichedRule = (() => {
        const message = resolveBlueprintMessage(rule, messageCatalog);
        if (message === undefined) {
          return rule;
        }
        if (rule.message === message) {
          return rule;
        }
        return { ...rule, message };
      })();
      const severity = (rule.severity ?? 'error').toLowerCase();
      const factory = blueprintValidatorFactories[enrichedRule.type];
      let validator = factory ? factory(enrichedRule, field) : null;

      if (!validator && asyncValidators[enrichedRule.type]) {
        const asyncHandler = asyncValidators[enrichedRule.type];
        validator = validators.custom((value, context) =>
          asyncHandler({ rule: enrichedRule, field, value, context, blueprint }),
        );
      }

      if (!validator) {
        return;
      }

      if (enrichedRule.messageKey || enrichedRule.meta) {
        validator.meta = {
          ...validator.meta,
          ...(enrichedRule.meta ?? {}),
          ...(enrichedRule.messageKey ? { messageKey: enrichedRule.messageKey } : {}),
        };
      }

      if (severity === 'warning') {
        warningValidators.push(validator);
      } else {
        validatorsList.push(validator);
      }
    });

    descriptor[field.name] = {
      label: field.label,
      defaultValue: field.defaultValue,
      meta: {
        ...(field.meta ?? {}),
        component: field.component,
        helpText: field.helpText,
        options: field.options,
        analytics: field.analytics,
        placeholder: field.placeholder,
        stepKey: field.stepKey ?? field.step_key ?? null,
        visibility: field.visibility,
        metadata: field.metadata,
      },
      validators: validatorsList,
      warnings: warningValidators,
      normalizers: mappedNormalizers,
    };
  });

  return createValidationSchema(descriptor, {
    ...schemaOptions,
    messageCatalog,
  });
}

export function flattenErrors(errors) {
  if (!errors) {
    return [];
  }
  if (Array.isArray(errors)) {
    return errors.flatMap((item) => flattenErrors(item));
  }
  if (typeof errors === 'object') {
    return Object.values(errors).flatMap((value) => flattenErrors(value));
  }
  return [String(errors)];
}
