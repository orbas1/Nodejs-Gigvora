import { forwardRef, useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';

const statusStyles = {
  default: 'border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200/60',
  success: 'border-emerald-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200/70',
  warning: 'border-amber-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200/60',
  error: 'border-rose-200 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-200/70',
};

const labelTone = {
  default: 'text-slate-900',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  error: 'text-rose-700',
};

const helperTone = {
  default: 'text-slate-500',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
};

const inputSpacing = 'w-full bg-transparent py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none';

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
  const generatedId = useId();
  const fieldId = id ?? rest.name ?? generatedId;
  const computedStatus = useMemo(() => {
    if (error) {
      return 'error';
    }
    return statusStyles[status] ? status : 'default';
  }, [error, status]);

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

  return (
    <div className={classNames('grid gap-2', className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className={classNames(
            'flex items-baseline justify-between text-sm font-medium',
            labelTone[computedStatus],
          )}
        >
          <span>{label}</span>
          {!required ? (
            <span className="text-xs font-normal uppercase tracking-wide text-slate-400">{optionalLabel}</span>
          ) : null}
        </label>
      ) : null}
      {description ? (
        <p className="text-sm text-slate-500">{description}</p>
      ) : null}
      <div
        className={classNames(
          'group relative flex items-stretch gap-2 rounded-3xl border bg-white/90 px-4 shadow-subtle transition-all duration-200 focus-within:shadow-soft backdrop-blur',
          isDense ? 'py-1' : 'py-1.5',
          statusStyles[computedStatus],
          rest.disabled ? 'bg-slate-100 text-slate-400' : '',
        )}
      >
        {leadingVisual ? (
          <span className="flex items-center text-slate-400" aria-hidden>
            {leadingVisual}
          </span>
        ) : null}
        {prefix ? (
          <span className="flex items-center text-sm font-medium text-slate-500">{prefix}</span>
        ) : null}
        <InputComponent
          id={fieldId}
          ref={ref}
          className={classNames(
            inputSpacing,
            isDense ? 'text-sm leading-tight' : 'leading-relaxed',
            inputClassName,
          )}
          aria-invalid={computedStatus === 'error' ? 'true' : undefined}
          aria-describedby={describedBy}
          rows={multiline ? rows : undefined}
          maxLength={maxLength}
          onChange={handleChange}
          {...inputProps}
        />
        {suffix ? (
          <span className="flex items-center text-sm font-medium text-slate-500">{suffix}</span>
        ) : null}
        {trailingVisual ? (
          <span className="flex items-center text-slate-400" aria-hidden>
            {trailingVisual}
          </span>
        ) : null}
      </div>
      {showCharacterCount && typeof characterCount === 'number' ? (
        <div className="flex justify-end text-xs text-slate-400">{characterCount}/{maxLength}</div>
      ) : null}
      {error ? (
        <p id={errorId} className={classNames('text-sm', helperTone.error)}>
          {error}
        </p>
      ) : null}
      {!error && successText ? (
        <p id={successId} className={classNames('text-sm', helperTone.success)}>
          {successText}
        </p>
      ) : null}
      {helperText ? (
        <p id={helperId} className={classNames('text-sm', helperTone[computedStatus])}>
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
  status: PropTypes.oneOf(['default', 'success', 'warning', 'error']),
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
  density: PropTypes.oneOf(['comfortable', 'compact']),
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
