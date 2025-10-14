const state = {
  startedAt: new Date().toISOString(),
  http: {
    status: 'starting',
    port: null,
    updatedAt: new Date().toISOString(),
    reason: null,
  },
  dependencies: {},
  workers: {},
};

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

export function markHttpServerStarting() {
  state.http = {
    status: 'starting',
    port: null,
    updatedAt: new Date().toISOString(),
    reason: null,
  };
}

export function markHttpServerReady({ port } = {}) {
  state.http = {
    status: 'ready',
    port: port ?? state.http.port,
    updatedAt: new Date().toISOString(),
    reason: null,
  };
}

export function markHttpServerClosing({ reason } = {}) {
  state.http = {
    status: 'closing',
    port: state.http.port,
    updatedAt: new Date().toISOString(),
    reason: reason ?? null,
  };
}

export function markHttpServerStopped({ reason } = {}) {
  state.http = {
    status: 'stopped',
    port: state.http.port,
    updatedAt: new Date().toISOString(),
    reason: reason ?? null,
  };
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
  return JSON.parse(
    JSON.stringify({
      ...state,
    }),
  );
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
    http: { ...state.http },
    dependencies: { ...state.dependencies },
    workers: { ...state.workers },
  };
}
