function createInitialHttpState() {
  return {
    status: 'starting',
    port: null,
    updatedAt: new Date().toISOString(),
    reason: null,
  };
}

function createInitialState() {
  return {
    startedAt: new Date().toISOString(),
    http: createInitialHttpState(),
    dependencies: {},
    workers: {},
  };
}

const state = createInitialState();

function deepClone(value) {
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch (error) {
      // Fallback to JSON strategy below.
    }
  }
  return JSON.parse(JSON.stringify(value));
}

function serializeError(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  const plain = {
    message: error.message || 'Unknown error',
    name: error.name,
  };
  if (error.stack) {
    plain.stack = error.stack;
  }
  if (error.code) {
    plain.code = error.code;
  }
  if (error.status || error.statusCode) {
    plain.status = error.status || error.statusCode;
  }
  if (error.details) {
    plain.details = error.details;
  }
  if (error.meta) {
    plain.meta = error.meta;
  }
  return plain;
}

function setStateSegment(collection, name, status, meta = {}) {
  const now = new Date().toISOString();
  collection[name] = {
    status,
    updatedAt: now,
    ...meta,
  };
}

function setHttpState(status, { port = state.http.port, reason = null } = {}) {
  state.http = {
    status,
    port,
    updatedAt: new Date().toISOString(),
    reason,
  };
}

export function markHttpServerStarting() {
  setHttpState('starting', { port: null, reason: null });
}

export function markHttpServerReady({ port } = {}) {
  setHttpState('ready', { port: port ?? state.http.port, reason: null });
}

export function markHttpServerClosing({ reason } = {}) {
  setHttpState('closing', { reason: reason ?? null });
}

export function markHttpServerStopped({ reason } = {}) {
  setHttpState('stopped', { reason: reason ?? null });
}

export function markHttpServerError(error, { port } = {}) {
  const reason = error?.message ?? 'Server error';
  const meta = serializeError(error);
  setHttpState('error', { port: port ?? state.http.port, reason });
  if (meta) {
    state.http.error = meta;
  } else {
    delete state.http.error;
  }
}

export function markDependencyHealthy(name, meta = {}) {
  setStateSegment(state.dependencies, name, 'ok', { ...meta, error: null });
}

export function markDependencyDegraded(name, error, meta = {}) {
  setStateSegment(state.dependencies, name, 'degraded', { ...meta, error: serializeError(error) });
}

export function markDependencyUnavailable(name, error, meta = {}) {
  setStateSegment(state.dependencies, name, 'error', { ...meta, error: serializeError(error) });
}

export function markDependencyDisabled(name, meta = {}) {
  setStateSegment(state.dependencies, name, 'disabled', { ...meta, error: null });
}

export function markWorkerHealthy(name, meta = {}) {
  setStateSegment(state.workers, name, 'ok', { ...meta, error: null });
}

export function markWorkerDegraded(name, error, meta = {}) {
  setStateSegment(state.workers, name, 'degraded', { ...meta, error: serializeError(error) });
}

export function markWorkerStopped(name, meta = {}) {
  setStateSegment(state.workers, name, 'stopped', { ...meta, error: null });
}

export function markWorkerFailed(name, error, meta = {}) {
  setStateSegment(state.workers, name, 'error', { ...meta, error: serializeError(error) });
}

export function getHealthState() {
  return deepClone(state);
}

function evaluateStatuses(records) {
  const values = Object.values(records);
  if (values.length === 0) {
    return 'ok';
  }
  if (values.some((entry) => entry.status === 'error')) {
    return 'error';
  }
  if (values.some((entry) => entry.status === 'degraded')) {
    return 'degraded';
  }
  return 'ok';
}

export function getOverallStatus() {
  if (state.http.status === 'error') {
    return 'error';
  }
  if (state.http.status === 'closing' || state.http.status === 'stopped') {
    return 'degraded';
  }
  if (state.http.status !== 'ready') {
    return 'starting';
  }
  const dependencyStatus = evaluateStatuses(state.dependencies);
  const workerStatus = evaluateStatuses(state.workers);
  if (dependencyStatus === 'error' || workerStatus === 'error') {
    return 'error';
  }
  if (dependencyStatus === 'degraded' || workerStatus === 'degraded') {
    return 'degraded';
  }
  return 'ok';
}

export function buildHealthReport() {
  return {
    status: getOverallStatus(),
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    http: deepClone(state.http),
    dependencies: deepClone(state.dependencies),
    workers: deepClone(state.workers),
  };
}

export function resetRuntimeHealthState() {
  const initial = createInitialState();
  state.startedAt = initial.startedAt;
  state.http = initial.http;
  state.dependencies = initial.dependencies;
  state.workers = initial.workers;
}
