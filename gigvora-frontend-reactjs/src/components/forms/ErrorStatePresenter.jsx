import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { classNames } from '../../utils/classNames.js';
import { flattenErrors } from '../../utils/ValidationSchemaLibrary.js';

const toneStyles = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const sizeStyles = {
  sm: 'px-3 py-3 text-sm',
  md: 'px-4 py-4 text-sm',
  lg: 'px-5 py-5 text-base',
};

const toneIcons = {
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 1.5a8.5 8.5 0 1 0 8.5 8.5A8.51 8.51 0 0 0 10 1.5Zm.75 11.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-.75-7.25a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.598A1.75 1.75 0 0 1 16.768 18H3.232a1.75 1.75 0 0 1-1.492-3.303ZM10 7a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 7Zm0 7a1 1 0 1 0 .001 2.001A1 1 0 0 0 10 14Z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M18.5 10a8.5 8.5 0 1 1-8.5-8.5A8.51 8.51 0 0 1 18.5 10ZM9.25 7.25A.75.75 0 1 0 10.75 7a.75.75 0 0 0-1.5 0Zm0 2.5V14a.75.75 0 0 0 1.5 0v-4.25a.75.75 0 0 0-1.5 0Z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M17.03 6.72a.75.75 0 0 0-1.06-1.06l-6.47 6.47-2.47-2.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l7-7Z" />
      <path d="M10 1.5a8.5 8.5 0 1 0 8.5 8.5A8.51 8.51 0 0 0 10 1.5Z" />
    </svg>
  ),
};

function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normaliseErrors(errors, { fieldLabels, includeFieldName }) {
  if (!errors) {
    return [];
  }
  if (Array.isArray(errors)) {
    return errors
      .map((item) => normaliseErrors(item, { fieldLabels, includeFieldName }))
      .flat();
  }
  if (isObject(errors)) {
    return Object.entries(errors)
      .map(([field, detail]) => {
        const label = fieldLabels?.[field] ?? field;
        const messages = normaliseErrors(detail, { fieldLabels, includeFieldName });
        if (!messages.length) {
          return [];
        }
        if (!includeFieldName) {
          return messages;
        }
        return messages.map((message) => `${label}: ${message}`);
      })
      .flat();
  }
  return [String(errors)];
}

export default function ErrorStatePresenter({
  title,
  description,
  errors,
  fieldLabels,
  tone,
  size,
  showIcon,
  role,
  ariaLive,
  className,
  actions,
  includeFieldName,
  children,
  ...props
}) {
  const resolvedTone = toneStyles[tone] ? tone : 'error';
  const toneClassName = toneStyles[resolvedTone];
  const toneIcon = toneIcons[resolvedTone];
  const resolvedSize = sizeStyles[size] ? size : 'md';
  const sizeClassName = sizeStyles[resolvedSize];

  const flattenedErrors = useMemo(() => {
    const fieldAware = includeFieldName
      ? normaliseErrors(errors, { fieldLabels, includeFieldName: true })
      : flattenErrors(errors);
    const unique = Array.from(new Set(fieldAware.filter(Boolean)));
    return unique;
  }, [errors, fieldLabels, includeFieldName]);

  if (!flattenedErrors.length && !children && !description) {
    return null;
  }

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      data-tone={resolvedTone}
      data-size={resolvedSize}
      className={classNames(
        'flex gap-3 rounded-2xl border shadow-soft transition-shadow',
        toneClassName,
        sizeClassName,
        className,
      )}
      {...props}
    >
      {showIcon ? <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center">{toneIcon}</span> : null}
      <div className="min-w-0 flex-1 space-y-2">
        {title ? <p className="font-semibold tracking-tight text-current">{title}</p> : null}
        {description ? (
          <p className="text-sm/6 text-current/90">{description}</p>
        ) : null}
        {flattenedErrors.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm/6">
            {flattenedErrors.map((message) => (
              <li key={message} className="break-words">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
        {children}
        {actions ? <div className="flex flex-wrap gap-2 pt-2 text-sm">{actions}</div> : null}
      </div>
    </div>
  );
}

ErrorStatePresenter.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  errors: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  fieldLabels: PropTypes.objectOf(PropTypes.string),
  tone: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  role: PropTypes.string,
  ariaLive: PropTypes.oneOf(['assertive', 'polite', 'off']),
  className: PropTypes.string,
  actions: PropTypes.node,
  includeFieldName: PropTypes.bool,
  children: PropTypes.node,
};

ErrorStatePresenter.defaultProps = {
  title: null,
  description: null,
  errors: null,
  fieldLabels: null,
  tone: 'error',
  size: 'md',
  showIcon: true,
  role: 'alert',
  ariaLive: 'assertive',
  className: undefined,
  actions: null,
  includeFieldName: true,
  children: null,
};
