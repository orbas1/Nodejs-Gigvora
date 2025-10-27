import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DEFAULT_RELATIVE_PATH = 'update_docs/release-management/active-release.json';

const PHASE_STATUSES = new Set(['pending', 'in_progress', 'complete', 'paused', 'blocked', 'attention']);
const CHECKLIST_STATUSES = new Set(['pending', 'in_progress', 'complete', 'blocked', 'attention']);
const MONITOR_STATUSES = new Set(['passing', 'warning', 'info', 'attention', 'failing', 'unknown']);

let cachedState = null;
let cachedStatePath = null;

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function toNumber(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  if (fallback === null) {
    return numeric;
  }
  return Math.max(0, Math.min(100, numeric));
}

function resolveStatePath() {
  const customPath = process.env.GIGVORA_RELEASE_STATE_PATH;
  const resolved = resolve(process.cwd(), customPath || DEFAULT_RELATIVE_PATH);
  return resolved;
}

function normalisePhase(phase, index) {
  const key = `${phase?.key ?? phase?.id ?? `phase-${index + 1}`}`;
  const status = (phase?.status || 'pending').toLowerCase();
  const normalisedStatus = PHASE_STATUSES.has(status) ? status : 'pending';

  return {
    key,
    name: phase?.name ?? key,
    status: normalisedStatus,
    owner: phase?.owner ?? null,
    summary: phase?.summary ?? null,
    startedAt: phase?.startedAt ?? null,
    completedAt: phase?.completedAt ?? null,
    coverage: toNumber(phase?.coverage, 0),
    health: phase?.health ?? null,
  };
}

function normaliseSegment(segment, index) {
  const key = `${segment?.key ?? segment?.id ?? `segment-${index + 1}`}`;
  return {
    key,
    name: segment?.name ?? key,
    status: (segment?.status ?? 'pending').toLowerCase(),
    coverage: toNumber(segment?.coverage ?? segment?.percentage, 0),
    owner: segment?.owner ?? null,
  };
}

function normaliseChecklistItem(item, index) {
  const key = `${item?.key ?? item?.id ?? `item-${index + 1}`}`;
  const status = (item?.status || 'pending').toLowerCase();
  const normalisedStatus = CHECKLIST_STATUSES.has(status) ? status : 'pending';

  return {
    key,
    name: item?.name ?? key,
    status: normalisedStatus,
    owner: item?.owner ?? null,
    summary: item?.summary ?? null,
    completedAt: item?.completedAt ?? null,
  };
}

function normaliseMonitor(monitor, id) {
  const status = (monitor?.status || 'unknown').toLowerCase();
  const normalisedStatus = MONITOR_STATUSES.has(status) ? status : 'unknown';
  const metrics = monitor?.metrics && typeof monitor.metrics === 'object' ? { ...monitor.metrics } : {};
  return {
    id,
    name: monitor?.name ?? id,
    description: monitor?.description ?? null,
    environment: monitor?.environment ?? 'production',
    status: normalisedStatus,
    lastSampleAt: monitor?.lastSampleAt ?? null,
    metrics,
    coverage: toNumber(monitor?.coverage, null),
    trend: monitor?.trend ?? null,
  };
}

function getDefaultState() {
  return {
    activeRelease: null,
    monitors: {},
    events: [],
    updatedAt: nowIso(),
  };
}

async function readState(path) {
  try {
    const content = await readFile(path, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return getDefaultState();
    }
    const release = parsed.activeRelease ?? null;
    const phases = Array.isArray(release?.phases) ? release.phases.map(normalisePhase) : [];
    const segments = Array.isArray(release?.segments) ? release.segments.map(normaliseSegment) : [];
    const checklist = Array.isArray(release?.checklist) ? release.checklist.map(normaliseChecklistItem) : [];
    const monitors = parsed.monitors && typeof parsed.monitors === 'object' ? parsed.monitors : {};
    const normalisedMonitors = Object.fromEntries(
      Object.entries(monitors).map(([id, monitor]) => [id, normaliseMonitor(monitor, id)]),
    );

    const events = Array.isArray(parsed.events) ? [...parsed.events] : [];

    return {
      activeRelease: release
        ? {
            id: release.id ?? null,
            name: release.name ?? null,
            version: release.version ?? null,
            owner: release.owner ?? null,
            phase: release.phase ?? null,
            startedAt: release.startedAt ?? null,
            targetCompletion: release.targetCompletion ?? null,
            releaseNotesRef: release.releaseNotesRef ?? release.changelogRef ?? null,
            phases,
            segments,
            checklist,
          }
        : null,
      monitors: normalisedMonitors,
      events,
      updatedAt: parsed.updatedAt ?? nowIso(),
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return getDefaultState();
    }
    throw error;
  }
}

async function persistState(state, path) {
  await mkdir(dirname(path), { recursive: true });
  const payload = {
    ...state,
    updatedAt: nowIso(),
  };
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`);
}

async function ensureState() {
  const statePath = resolveStatePath();
  if (cachedState && cachedStatePath === statePath) {
    return cachedState;
  }
  const state = await readState(statePath);
  cachedState = state;
  cachedStatePath = statePath;
  return state;
}

function ensureActiveRelease(state) {
  if (!state.activeRelease) {
    throw new Error('No active release has been configured.');
  }
}

export async function getReleaseState() {
  const state = await ensureState();
  return clone(state);
}

function deriveActivePhase(phases) {
  if (!Array.isArray(phases) || !phases.length) {
    return null;
  }
  const inProgress = phases.find((phase) => phase.status === 'in_progress');
  if (inProgress) {
    return inProgress.key;
  }
  const attention = phases.find((phase) => phase.status === 'attention');
  if (attention) {
    return attention.key;
  }
  const pending = phases.find((phase) => phase.status === 'pending');
  if (pending) {
    return pending.key;
  }
  const complete = phases[phases.length - 1];
  return complete?.key ?? null;
}

function computeChecklistSummary(checklist = []) {
  const total = checklist.length;
  const completed = checklist.filter((item) => item.status === 'complete').length;
  return { total, completed, items: checklist.map((item) => ({ ...item })) };
}

function statusToScore(status, mapping) {
  return mapping[status] ?? mapping.default;
}

function computeMonitorSnapshots(monitors = {}) {
  return Object.values(monitors).map((monitor) => ({ ...monitor }));
}

export async function getReleaseRolloutSnapshot() {
  const state = await ensureState();
  if (!state.activeRelease) {
    return {
      active: false,
      release: null,
      monitors: [],
      checklist: { total: 0, completed: 0, items: [] },
    };
  }

  const phases = state.activeRelease.phases.map((phase, index) => normalisePhase(phase, index));
  const segments = state.activeRelease.segments.map((segment, index) => normaliseSegment(segment, index));
  const checklist = state.activeRelease.checklist.map((item, index) => normaliseChecklistItem(item, index));
  const activePhase = state.activeRelease.phase ?? deriveActivePhase(phases);

  return {
    active: true,
    release: {
      id: state.activeRelease.id,
      name: state.activeRelease.name,
      version: state.activeRelease.version,
      owner: state.activeRelease.owner,
      phase: activePhase,
      startedAt: state.activeRelease.startedAt,
      targetCompletion: state.activeRelease.targetCompletion,
      releaseNotesRef: state.activeRelease.releaseNotesRef,
      phases,
      segments,
    },
    monitors: computeMonitorSnapshots(state.monitors),
    checklist: computeChecklistSummary(checklist),
  };
}

export async function upsertActiveRelease(payload) {
  const state = await ensureState();
  const release = state.activeRelease ?? {};

  const nextPhases = Array.isArray(payload?.phases)
    ? payload.phases.map((phase, index) => normalisePhase(phase, index))
    : release.phases ?? [];
  const nextSegments = Array.isArray(payload?.segments)
    ? payload.segments.map((segment, index) => normaliseSegment(segment, index))
    : release.segments ?? [];
  const nextChecklist = Array.isArray(payload?.checklist)
    ? payload.checklist.map((item, index) => normaliseChecklistItem(item, index))
    : release.checklist ?? [];

  state.activeRelease = {
    id: payload?.id ?? release.id ?? null,
    name: payload?.name ?? release.name ?? null,
    version: payload?.version ?? release.version ?? null,
    owner: payload?.owner ?? release.owner ?? null,
    phase: payload?.phase ?? release.phase ?? null,
    startedAt: payload?.startedAt ?? release.startedAt ?? null,
    targetCompletion: payload?.targetCompletion ?? release.targetCompletion ?? null,
    releaseNotesRef: payload?.releaseNotesRef ?? release.releaseNotesRef ?? null,
    phases: nextPhases,
    segments: nextSegments,
    checklist: nextChecklist,
  };

  state.updatedAt = nowIso();
  await persistState(state, resolveStatePath());
  cachedState = state;
  return clone(state.activeRelease);
}

export async function markReleasePhaseStatus(phaseKey, status, { actor = null, summary = null, coverage = null } = {}) {
  const state = await ensureState();
  ensureActiveRelease(state);

  const normalisedStatus = PHASE_STATUSES.has(status) ? status : 'pending';
  const target = state.activeRelease.phases.find((phase) => phase.key === phaseKey);
  if (!target) {
    throw new Error(`Unknown release phase: ${phaseKey}`);
  }

  const timestamp = nowIso();
  target.status = normalisedStatus;
  if (coverage != null) {
    target.coverage = toNumber(coverage, target.coverage ?? 0);
  }
  if (normalisedStatus === 'in_progress' && !target.startedAt) {
    target.startedAt = timestamp;
  }
  if (normalisedStatus === 'complete') {
    target.completedAt = timestamp;
    if (target.coverage == null) {
      target.coverage = 100;
    }
  }
  if (summary) {
    target.summary = summary;
  }

  state.events.push({
    id: `phase-${phaseKey}-${timestamp}`,
    type: 'phase_status',
    phase: phaseKey,
    status: normalisedStatus,
    actor,
    summary,
    timestamp,
  });
  state.activeRelease.phase = deriveActivePhase(state.activeRelease.phases);
  state.updatedAt = timestamp;
  await persistState(state, resolveStatePath());
  cachedState = state;
  return clone(target);
}

export async function markChecklistItemStatus(checklistKey, status, { actor = null, summary = null } = {}) {
  const state = await ensureState();
  ensureActiveRelease(state);

  const normalisedStatus = CHECKLIST_STATUSES.has(status) ? status : 'pending';
  const target = state.activeRelease.checklist.find((item) => item.key === checklistKey);
  if (!target) {
    throw new Error(`Unknown checklist item: ${checklistKey}`);
  }

  const timestamp = nowIso();
  target.status = normalisedStatus;
  if (summary) {
    target.summary = summary;
  }
  if (normalisedStatus === 'complete') {
    target.completedAt = timestamp;
  }

  state.events.push({
    id: `checklist-${checklistKey}-${timestamp}`,
    type: 'checklist_status',
    checklistKey,
    status: normalisedStatus,
    actor,
    summary,
    timestamp,
  });

  state.updatedAt = timestamp;
  await persistState(state, resolveStatePath());
  cachedState = state;
  return clone(target);
}

export async function recordMonitorSample(
  monitorId,
  { name = null, status = 'unknown', environment = 'production', metrics = {}, coverage = null, trend = null, description = null } = {},
) {
  if (!monitorId) {
    throw new Error('monitorId is required.');
  }
  const state = await ensureState();

  const timestamp = nowIso();
  const nextStatus = MONITOR_STATUSES.has(status) ? status : 'unknown';
  const existing = state.monitors[monitorId] ?? {};

  state.monitors[monitorId] = {
    id: monitorId,
    name: name ?? existing.name ?? monitorId,
    description: description ?? existing.description ?? null,
    environment: environment ?? existing.environment ?? 'production',
    status: nextStatus,
    lastSampleAt: timestamp,
    metrics: { ...existing.metrics, ...(metrics ?? {}) },
    coverage: coverage != null ? toNumber(coverage, existing.coverage ?? null) : existing.coverage ?? null,
    trend: trend ?? existing.trend ?? null,
  };

  state.events.push({
    id: `monitor-${monitorId}-${timestamp}`,
    type: 'monitor_sample',
    monitorId,
    status: nextStatus,
    metrics: state.monitors[monitorId].metrics,
    coverage: state.monitors[monitorId].coverage,
    timestamp,
  });

  state.updatedAt = timestamp;
  await persistState(state, resolveStatePath());
  cachedState = state;
  return clone(state.monitors[monitorId]);
}

export function resetReleaseStateCache() {
  cachedState = null;
  cachedStatePath = null;
}

export default {
  getReleaseState,
  getReleaseRolloutSnapshot,
  upsertActiveRelease,
  markReleasePhaseStatus,
  markChecklistItemStatus,
  recordMonitorSample,
  resetReleaseStateCache,
};
