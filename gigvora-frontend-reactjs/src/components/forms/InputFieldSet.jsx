import { forwardRef, useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';
import { DEFAULT_COMPONENT_TOKENS } from '@shared-contracts/domain/platform/component-tokens.js';

const INPUT_STATUS_OPTIONS = Object.keys(DEFAULT_COMPONENT_TOKENS.inputFieldSet.statuses).filter(
  (status) => status !== 'disabled',
);
const INPUT_DENSITY_OPTIONS = Object.keys(DEFAULT_COMPONENT_TOKENS.inputFieldSet.density);

const InputFieldSet = forwardRef(function InputFieldSet(
  {
    id,
    label,
    description,
    helperText,
    status = 'default',
    error,
    successText,
    optionalLabel = 'Optional',
    required,
    multiline = false,
    rows = 4,
    leadingVisual,
    trailingVisual,
    prefix,
    suffix,
    className,
    showCounter = false,
    value,
    maxLength,
    density = 'comfortable',
    inputClassName,
    type = 'text',
    onChange,
    ...rest
  },
  ref,
) {
  const { tokens: fieldTokens } = useComponentTokens('inputFieldSet');
  const statuses = fieldTokens?.statuses ?? {};
  const densityTokens = fieldTokens?.density ?? {};
  const containerClass = fieldTokens?.container ?? 'grid gap-2';
  const descriptionClass = fieldTokens?.description ?? '';
  const optionalLabelClass = fieldTokens?.optionalLabel ?? '';
  const labelBaseClass = fieldTokens?.labelBase ?? '';
  const shellBaseClass = fieldTokens?.shell ?? '';
  const inputBaseClass = fieldTokens?.input ?? '';
  const counterClass = fieldTokens?.counter ?? '';
  const helperBaseClass = fieldTokens?.helperText ?? '';
  const successBaseClass = fieldTokens?.successText ?? '';
  const errorBaseClass = fieldTokens?.errorText ?? '';
  const prefixClass = fieldTokens?.prefix ?? '';
  const suffixClass = fieldTokens?.suffix ?? '';
  const visualClass = fieldTokens?.visual ?? '';

  const generatedId = useId();
  const fieldId = id ?? rest.name ?? generatedId;
  const computedStatus = useMemo(() => {
    if (error) {
      return 'error';
    }
    return statuses[status] ? status : 'default';
  }, [error, status, statuses]);

  const statusTokens = statuses[computedStatus] ?? statuses.default ?? {};
  const disabledTokens = rest.disabled ? statuses.disabled ?? {} : {};

  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const successId = successText && !error ? `${fieldId}-success` : undefined;

  const describedBy = [helperId, errorId, successId].filter(Boolean).join(' ') || undefined;
  const InputComponent = multiline ? 'textarea' : 'input';
  const isDense = density === 'compact';

  const defaultLength = typeof rest.defaultValue === 'string' ? rest.defaultValue.length : 0;
  const [internalCount, setInternalCount] = useState(() =>
    typeof value === 'string' ? value.length : defaultLength,
  );

  useEffect(() => {
    if (typeof value === 'string') {
      setInternalCount(value.length);
    }
  }, [value]);

  const handleChange = (event) => {
    if (showCounter) {
      setInternalCount(event.target.value.length);
    }
    if (typeof onChange === 'function') {
      onChange(event);
    }
  };

  const characterCount = typeof value === 'string' ? value.length : internalCount;
  const showCharacterCount = showCounter && typeof maxLength === 'number';

  const inputProps = multiline ? rest : { ...rest, type };

  const shellClassName = classNames(
    shellBaseClass,
    statusTokens.shell,
    disabledTokens.shell,
    isDense ? densityTokens?.compact?.shell : densityTokens?.comfortable?.shell,
  );

  const labelClassName = classNames(labelBaseClass, statusTokens.label);
  const helperClassName = classNames(helperBaseClass, statusTokens.helper, rest.disabled ? disabledTokens.helper : '');
  const successClassName = classNames(
    successBaseClass,
    statuses.success?.helper ?? statuses.default?.helper,
  );
  const errorClassName = classNames(errorBaseClass, statuses.error?.helper ?? statusTokens.helper);
  const inputClassNameResolved = classNames(
    inputBaseClass,
    isDense ? densityTokens?.compact?.input : densityTokens?.comfortable?.input,
    rest.disabled ? disabledTokens.input : '',
    inputClassName,
  );

  return (
    <div className={classNames(containerClass, className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className={labelClassName}
        >
          <span>{label}</span>
          {!required ? (
            <span className={optionalLabelClass}>{optionalLabel}</span>
          ) : null}
        </label>
      ) : null}
      {description ? (
        <p className={descriptionClass}>{description}</p>
      ) : null}
      <div
        className={classNames(shellClassName, isDense ? '' : '')}
      >
        {leadingVisual ? (
          <span className={classNames(visualClass)} aria-hidden>
            {leadingVisual}
          </span>
        ) : null}
        {prefix ? (
          <span className={prefixClass}>{prefix}</span>
        ) : null}
        <InputComponent
          id={fieldId}
          ref={ref}
          className={inputClassNameResolved}
          aria-invalid={computedStatus === 'error' ? 'true' : undefined}
          aria-describedby={describedBy}
          rows={multiline ? rows : undefined}
          maxLength={maxLength}
          onChange={handleChange}
          {...inputProps}
        />
        {suffix ? (
          <span className={suffixClass}>{suffix}</span>
        ) : null}
        {trailingVisual ? (
          <span className={classNames(visualClass)} aria-hidden>
            {trailingVisual}
          </span>
        ) : null}
      </div>
      {showCharacterCount && typeof characterCount === 'number' ? (
        <div className={counterClass}>{characterCount}/{maxLength}</div>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClassName}>
          {error}
        </p>
      ) : null}
      {!error && successText ? (
        <p id={successId} className={successClassName}>
          {successText}
        </p>
      ) : null}
      {helperText ? (
        <p id={helperId} className={helperClassName}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

InputFieldSet.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  description: PropTypes.node,
  helperText: PropTypes.node,
  status: PropTypes.oneOf(INPUT_STATUS_OPTIONS),
  error: PropTypes.node,
  successText: PropTypes.node,
  optionalLabel: PropTypes.string,
  required: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  leadingVisual: PropTypes.node,
  trailingVisual: PropTypes.node,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  className: PropTypes.string,
  showCounter: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxLength: PropTypes.number,
  density: PropTypes.oneOf(INPUT_DENSITY_OPTIONS),
  inputClassName: PropTypes.string,
  type: PropTypes.string,
  onChange: PropTypes.func,
};

InputFieldSet.defaultProps = {
  id: undefined,
  label: null,
  description: null,
  helperText: null,
  status: 'default',
  error: null,
  successText: null,
  optionalLabel: 'Optional',
  required: false,
  multiline: false,
  rows: 4,
  leadingVisual: null,
  trailingVisual: null,
  prefix: null,
  suffix: null,
  className: '',
  showCounter: false,
  value: undefined,
  maxLength: undefined,
  density: 'comfortable',
  inputClassName: '',
  type: 'text',
  onChange: undefined,
};

export default InputFieldSet;
