import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cloneDeep, getNestedValue, setNestedValue } from '../utils/object.js';
import { createSchemaFromBlueprint, flattenErrors } from '../utils/ValidationSchemaLibrary.js';

const defaultConfig = {
  initialValues: {},
  validateOnBlur: true,
  validateOnChange: false,
  validateOnMount: false,
  enableReinitialize: true,
  resetOnSubmitSuccess: false,
  syncNormalizedValuesOnChange: true,
  trackTouchedOnChange: false,
  rethrowSubmitError: false,
  debugName: 'FormManager',
  schemaBlueprint: null,
  schemaBlueprintOptions: undefined,
  schemaOptions: undefined,
  schemaAsyncValidators: {},
  schemaMessageCatalog: null,
};

function toPath(name) {
  if (Array.isArray(name)) {
    return name;
  }
  return String(name)
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
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

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.warn('Unable to compare form values', error);
    return false;
  }
}

function shallowEqual(a = {}, b = {}) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  return keysA.every((key) => a[key] === b[key]);
}

function computeDirtyMap(fieldNames, initialValues, currentValues) {
  const dirtyMap = {};
  fieldNames.forEach((name) => {
    const path = toPath(name);
    const initialValue = getNestedValue(initialValues, path);
    const currentValue = getNestedValue(currentValues, path);
    dirtyMap[name] = !deepEqual(initialValue, currentValue);
  });
  return dirtyMap;
}

export default function useFormManager(userConfig = {}) {
  const {
    initialValues,
    validationSchema,
    schema: schemaProp,
    schemaBlueprint,
    schemaBlueprintOptions,
    schemaAsyncValidators,
    schemaMessageCatalog,
    schemaOptions: legacySchemaOptions,
    onSubmit,
    onChange,
    onValidate,
    onSubmitSuccess,
    onSubmitError,
    validateOnBlur,
    validateOnChange,
    validateOnMount,
    enableReinitialize,
    resetOnSubmitSuccess,
    syncNormalizedValuesOnChange,
    trackTouchedOnChange,
    rethrowSubmitError,
    debugName,
  } = { ...defaultConfig, ...userConfig };

  const blueprintSchema = useMemo(() => {
    if (!schemaBlueprint) {
      return null;
    }
    const blueprintOptions =
      schemaBlueprintOptions ?? legacySchemaOptions ?? undefined;
    try {
      return createSchemaFromBlueprint(schemaBlueprint, {
        asyncValidators: schemaAsyncValidators,
        schemaOptions: blueprintOptions,
        messageCatalog:
          schemaMessageCatalog ?? blueprintOptions?.messageCatalog ?? null,
      });
    } catch (error) {
      console.error('Failed to create schema from blueprint', error);
      return null;
    }
  }, [
    schemaBlueprint,
    schemaAsyncValidators,
    schemaBlueprintOptions,
    schemaMessageCatalog,
    legacySchemaOptions,
  ]);

  const schema = useMemo(
    () => schemaProp ?? validationSchema ?? blueprintSchema ?? null,
    [schemaProp, validationSchema, blueprintSchema],
  );

  const schemaDefaults = useMemo(
    () => (schema?.getInitialValues ? schema.getInitialValues() : {}),
    [schema],
  );

  const mergedInitialValues = useMemo(
    () => deepMerge(schemaDefaults, initialValues ?? {}),
    [schemaDefaults, initialValues],
  );

  const initialValuesRef = useRef(cloneDeep(mergedInitialValues));
  const [values, setValues] = useState(() => cloneDeep(initialValuesRef.current));
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitError, setLastSubmitError] = useState(null);
  const fieldRegistryRef = useRef(new Set(schema?.fieldNames ?? []));
  const [registeredFields, setRegisteredFields] = useState(() =>
    Array.from(fieldRegistryRef.current),
  );
  const valuesRef = useRef(values);
  const errorsRef = useRef(errors);
  const touchedRef = useRef(touched);
  const submitCountRef = useRef(submitCount);
  const warningsRef = useRef(warnings);
  const [dirtyFields, setDirtyFields] = useState({});
  const dirtyFieldsRef = useRef(dirtyFields);

  const onSubmitRef = useRef(onSubmit);
  const onChangeRef = useRef(onChange);
  const onValidateRef = useRef(onValidate);
  const onSubmitSuccessRef = useRef(onSubmitSuccess);
  const onSubmitErrorRef = useRef(onSubmitError);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  useEffect(() => {
    touchedRef.current = touched;
  }, [touched]);

  useEffect(() => {
    submitCountRef.current = submitCount;
  }, [submitCount]);

  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

  useEffect(() => {
    dirtyFieldsRef.current = dirtyFields;
  }, [dirtyFields]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onValidateRef.current = onValidate;
  }, [onValidate]);

  useEffect(() => {
    onSubmitSuccessRef.current = onSubmitSuccess;
  }, [onSubmitSuccess]);

  useEffect(() => {
    onSubmitErrorRef.current = onSubmitError;
  }, [onSubmitError]);

  useEffect(() => {
    if (!schema) {
      return;
    }
    let updated = false;
    schema.fieldNames?.forEach((name) => {
      if (!fieldRegistryRef.current.has(name)) {
        fieldRegistryRef.current.add(name);
        updated = true;
      }
    });
    if (updated) {
      setRegisteredFields(Array.from(fieldRegistryRef.current));
    }
  }, [schema]);

  const formId = useId();

  useEffect(() => {
    const registrySnapshot = Array.from(fieldRegistryRef.current);
    const computedDirty = computeDirtyMap(
      registrySnapshot,
      initialValuesRef.current,
      valuesRef.current,
    );
    if (!shallowEqual(dirtyFieldsRef.current, computedDirty)) {
      setDirtyFields(computedDirty);
    }
  }, [registeredFields, values]);

  const ensureFieldRegistered = useCallback((name) => {
    if (!name) {
      return;
    }
    if (!fieldRegistryRef.current.has(name)) {
      fieldRegistryRef.current.add(name);
      setRegisteredFields(Array.from(fieldRegistryRef.current));
    }
  }, []);

  useEffect(() => {
    if (!enableReinitialize) {
      return;
    }
    const nextValues = cloneDeep(mergedInitialValues);
    if (!deepEqual(initialValuesRef.current, nextValues)) {
      initialValuesRef.current = nextValues;
      setValues(cloneDeep(nextValues));
      setErrors({});
      setWarnings({});
      setTouched({});
      setSubmitCount(0);
    }
  }, [mergedInitialValues, enableReinitialize]);

  const setFieldError = useCallback(
    (name, error) => {
      ensureFieldRegistered(name);
      setErrors((prev) => {
        const next = { ...prev };
        if (!error || (Array.isArray(error) && error.length === 0)) {
          delete next[name];
        } else {
          next[name] = error;
        }
        return next;
      });
    },
    [ensureFieldRegistered],
  );

  const setFieldWarning = useCallback((name, warningMessages) => {
    ensureFieldRegistered(name);
    setWarnings((prev) => {
      const next = { ...prev };
      if (!warningMessages || warningMessages.length === 0) {
        delete next[name];
      } else {
        next[name] = warningMessages;
      }
      return next;
    });
  }, [ensureFieldRegistered]);

  const normalizeFieldValue = useCallback(
    (name, value, valuesSnapshot, context) => {
      if (!schema?.normalizeFieldValue) {
        return value;
      }
      try {
        return schema.normalizeFieldValue(name, value, valuesSnapshot, context);
      } catch (error) {
        console.warn(`Failed to normalize value for ${name}`, error);
        return value;
      }
    },
    [schema],
  );

  const validateField = useCallback(
    async (name, context = {}) => {
      if (!schema?.validateField) {
        setFieldError(name, null);
        setFieldWarning(name, null);
        return { valid: true, errors: [], warnings: [], value: getNestedValue(valuesRef.current, toPath(name)) };
      }
      ensureFieldRegistered(name);
      setIsValidating(true);
      try {
        const result = await schema.validateField(
          name,
          undefined,
          valuesRef.current,
          { ...context, touched: touchedRef.current, submitCount: submitCountRef.current },
        );
        setFieldError(name, result.errors);
        setFieldWarning(name, result.warnings);
        if (
          syncNormalizedValuesOnChange &&
          !deepEqual(getNestedValue(valuesRef.current, toPath(name)), result.value)
        ) {
          setValues((prev) => setNestedValue(prev, toPath(name), result.value));
        }
        onValidateRef.current?.({ field: name, ...result });
        return result;
      } catch (error) {
        console.error(`Validation failed for ${name}`, error);
        setFieldError(name, error.message ?? 'Validation failed.');
        setFieldWarning(name, null);
        return { valid: false, errors: [String(error.message ?? error)], warnings: [], value: getNestedValue(valuesRef.current, toPath(name)) };
      } finally {
        setIsValidating(false);
      }
    },
    [schema, ensureFieldRegistered, syncNormalizedValuesOnChange, setFieldError, setFieldWarning],
  );

  const setFieldValue = useCallback(
    (name, updater, options = {}) => {
      if (!name) {
        return Promise.resolve(null);
      }
      ensureFieldRegistered(name);
      const shouldTouch = options.touch ?? trackTouchedOnChange;
      const shouldValidate = options.validate ?? validateOnChange;
      setValues((prev) => {
        const path = toPath(name);
        const previousValue = getNestedValue(prev, path);
        const nextValue = typeof updater === 'function' ? updater(previousValue, prev) : updater;
        const normalized = normalizeFieldValue(name, nextValue, prev, { reason: 'change' });
        const next = setNestedValue(prev, path, normalized);
        if (shouldTouch) {
          setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
        }
        onChangeRef.current?.(name, normalized, next);
        return next;
      });
      return shouldValidate ? validateField(name, { reason: 'change' }) : Promise.resolve(null);
    },
    [ensureFieldRegistered, trackTouchedOnChange, validateOnChange, normalizeFieldValue, validateField],
  );

  const setValuesSilently = useCallback((nextValues) => {
    setValues(() => {
      const merged = schema?.normalizeValues ? schema.normalizeValues(nextValues) : nextValues;
      return cloneDeep(merged);
    });
  }, [schema]);

  const resetForm = useCallback(
    (nextState = null) => {
      const nextValues = nextState ? deepMerge(initialValuesRef.current, nextState) : cloneDeep(initialValuesRef.current);
      initialValuesRef.current = cloneDeep(nextValues);
      setValues(cloneDeep(nextValues));
      setErrors({});
      setWarnings({});
      setTouched({});
      setDirtyFields({});
      setIsSubmitting(false);
      setIsValidating(false);
      setSubmitCount(0);
      setLastSubmitError(null);
    },
    [],
  );

  const validateForm = useCallback(
    async (context = {}) => {
      if (!schema?.validate) {
        onValidateRef.current?.({ valid: true, errors: {}, values: valuesRef.current, warnings: {} });
        return { valid: true, errors: {}, values: valuesRef.current, warnings: {} };
      }
      setIsValidating(true);
      try {
        const result = await schema.validate(valuesRef.current, {
          ...context,
          touched: touchedRef.current,
          submitCount: submitCountRef.current,
        });
        setErrors(result.errors);
        setWarnings(result.warnings);
        if (syncNormalizedValuesOnChange && !deepEqual(valuesRef.current, result.values)) {
          setValues(result.values);
        }
        onValidateRef.current?.(result);
        return result;
      } catch (error) {
        console.error(`Form validation failed for ${debugName}`, error);
        const fallback = { valid: false, errors: { form: error.message ?? 'Validation failed.' }, warnings: {}, values: valuesRef.current };
        setErrors(fallback.errors);
        setWarnings({});
        onValidateRef.current?.(fallback);
        return fallback;
      } finally {
        setIsValidating(false);
      }
    },
    [schema, syncNormalizedValuesOnChange, debugName],
  );

  const handleSubmit = useCallback(
    async (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      setSubmitCount((count) => count + 1);
      setTouched((prevTouched) => {
        const next = { ...prevTouched };
        registeredFields.forEach((name) => {
          next[name] = true;
        });
        return next;
      });

      const validation = await validateForm({ reason: 'submit' });
      if (!validation.valid) {
        setLastSubmitError({ type: 'validation', errors: validation.errors });
        onSubmitErrorRef.current?.(validation.errors, validation);
        return { ok: false, errors: validation.errors, warnings: validation.warnings };
      }

      if (typeof onSubmitRef.current !== 'function') {
        console.warn(`No onSubmit handler provided for ${debugName}`);
        return { ok: true, values: validation.values };
      }

      setIsSubmitting(true);
      try {
        const result = await onSubmitRef.current(validation.values, {
          setFieldValue,
          setFieldError,
          setValues: setValuesSilently,
          resetForm,
          values: validation.values,
          errors: validation.errors,
        });
        setLastSubmitError(null);
        onSubmitSuccessRef.current?.(result, validation.values);
        if (resetOnSubmitSuccess) {
          resetForm();
        }
        return { ok: true, result, values: validation.values };
      } catch (error) {
        console.error(`Submit handler failed for ${debugName}`, error);
        setLastSubmitError(error);
        onSubmitErrorRef.current?.(error, validation);
        if (rethrowSubmitError) {
          throw error;
        }
        return { ok: false, error, values: validation.values };
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, registeredFields, debugName, resetOnSubmitSuccess, rethrowSubmitError, resetForm, setFieldValue, setFieldError, setValuesSilently],
  );

  const handleChange = useCallback(
    (eventOrName, value) => {
      if (typeof eventOrName === 'string') {
        return setFieldValue(eventOrName, value);
      }
      const event = eventOrName;
      const target = event?.target;
      if (!target || !target.name) {
        return Promise.resolve(null);
      }
      const { name, type } = target;
      let nextValue;
      if (type === 'checkbox') {
        nextValue = target.checked;
      } else if (type === 'number') {
        nextValue = target.value === '' ? '' : Number(target.value);
      } else if (type === 'file') {
        nextValue = target.files;
      } else {
        nextValue = target.value;
      }
      return setFieldValue(name, nextValue);
    },
    [setFieldValue],
  );

  const handleBlur = useCallback(
    (eventOrName) => {
      const name = typeof eventOrName === 'string' ? eventOrName : eventOrName?.target?.name;
      if (!name) {
        return Promise.resolve(null);
      }
      ensureFieldRegistered(name);
      setTouched((prev) => ({ ...prev, [name]: true }));
      return validateOnBlur ? validateField(name, { reason: 'blur' }) : Promise.resolve(null);
    },
    [ensureFieldRegistered, validateOnBlur, validateField],
  );

  useEffect(() => {
    if (validateOnMount) {
      validateForm({ reason: 'mount' });
    }
  }, [validateOnMount, validateForm]);

  const registerField = useCallback(
    (name, config = {}) => {
      ensureFieldRegistered(name);
      const fieldPath = toPath(name);
      const fieldId = config.id ?? `${formId}-${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
      const fieldValue = getNestedValue(values, fieldPath);
      const fieldError = errors[name];
      const fieldWarnings = warnings[name];
      return {
        name,
        id: fieldId,
        value: fieldValue ?? '',
        checked: config.type === 'checkbox' ? Boolean(fieldValue) : undefined,
        onChange: (event) => handleChange(event),
        onBlur: (event) => handleBlur(event),
        'aria-invalid': fieldError ? true : undefined,
        'aria-describedby': fieldError ? `${fieldId}-error` : config['aria-describedby'],
        error: fieldError,
        warnings: fieldWarnings,
        dirty: Boolean(dirtyFields[name]),
        touched: Boolean(touched[name]),
      };
    },
    [ensureFieldRegistered, formId, values, errors, warnings, handleChange, handleBlur, dirtyFields, touched],
  );

  const fieldMeta = useCallback(
    (name) => ({
      value: getNestedValue(valuesRef.current, toPath(name)),
      error: errorsRef.current[name],
      warnings: warningsRef.current[name],
      touched: Boolean(touchedRef.current[name]),
      dirty: Boolean(dirtyFieldsRef.current[name]),
    }),
    [],
  );

  const errorList = useMemo(() => flattenErrors(errors), [errors]);
  const warningList = useMemo(() => flattenErrors(warnings), [warnings]);
  const isDirty = useMemo(() => Object.values(dirtyFields).some(Boolean), [dirtyFields]);

  return {
    id: formId,
    values,
    errors,
    warnings,
    touched,
    dirtyFields,
    isDirty,
    isSubmitting,
    isValidating,
    submitCount,
    lastSubmitError,
    registeredFields,
    handleSubmit,
    handleChange,
    handleBlur,
    registerField,
    setFieldValue,
    setFieldError,
    setFieldWarning,
    setValues: setValuesSilently,
    setErrors,
    setWarnings,
    setTouched,
    resetForm,
    validateForm,
    validateField,
    fieldMeta,
    errorList,
    warningList,
    submit: handleSubmit,
  };
}
