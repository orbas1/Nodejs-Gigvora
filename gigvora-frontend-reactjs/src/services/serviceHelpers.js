export function resolveSignal(...candidates) {
  return candidates.find((candidate) => candidate != null);
}

function stringFromValue(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '';
    }
    return `${value}`;
  }
  if (typeof value === 'bigint') {
    return `${value}`;
  }
  if (typeof value === 'object' && 'id' in value) {
    return stringFromValue(value.id);
  }
  return `${value}`.trim();
}

export function requireIdentifier(value, label) {
  const normalised = stringFromValue(value);
  if (!normalised) {
    throw new Error(`${label} is required.`);
  }
  return normalised;
}

export function optionalString(value) {
  const normalised = stringFromValue(value);
  return normalised.length > 0 ? normalised : undefined;
}

export function buildWorkspaceContext({ workspaceId, workspaceSlug } = {}) {
  const context = {};
  const id = optionalString(workspaceId);
  if (id) {
    context.workspaceId = id;
  }
  const slug = optionalString(workspaceSlug);
  if (slug) {
    context.workspaceSlug = slug;
  }
  return context;
}

export function mergeWorkspace(payload = {}, workspaceContext = {}) {
  return { ...payload, ...buildWorkspaceContext(workspaceContext) };
}

export function buildParams(source = {}) {
  return Object.entries(source).reduce((accumulator, [key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) {
      return accumulator;
    }
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed.length === 0) {
        return accumulator;
      }
      accumulator[key] = trimmed;
      return accumulator;
    }
    accumulator[key] = rawValue;
    return accumulator;
  }, {});
}

export function buildRequestOptions({ params, signal, body, headers } = {}) {
  const options = {};
  if (params && Object.keys(params).length > 0) {
    const filteredParams = buildParams(params);
    if (Object.keys(filteredParams).length > 0) {
      options.params = filteredParams;
    }
  }
  if (signal) {
    options.signal = signal;
  }
  if (headers && Object.keys(headers).length > 0) {
    options.headers = headers;
  }
  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }
  return options;
}

function mergeIfObjects(base, extension) {
  if (
    base &&
    extension &&
    typeof base === 'object' &&
    typeof extension === 'object' &&
    !Array.isArray(base) &&
    !Array.isArray(extension)
  ) {
    return { ...base, ...extension };
  }
  return extension ?? base;
}

export function combineRequestOptions(overrides = {}, options = {}) {
  const { params: overrideParams, headers: overrideHeaders, body: overrideBody, signal: overrideSignal } = overrides;
  const {
    params: optionParams,
    headers: optionHeaders,
    body: optionBody,
    signal: optionSignal,
    ...restOptions
  } = options || {};

  const mergedParams = { ...(optionParams || {}), ...(overrideParams || {}) };
  const mergedHeaders = { ...(optionHeaders || {}), ...(overrideHeaders || {}) };
  const mergedBody = mergeIfObjects(optionBody, overrideBody);

  const requestOptions = buildRequestOptions({
    params: mergedParams,
    headers: mergedHeaders,
    body: mergedBody,
    signal: resolveSignal(overrideSignal, optionSignal),
  });

  return { ...restOptions, ...requestOptions };
}
