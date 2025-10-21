import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRuntimeHealth } from '../services/runtimeTelemetry.js';

const DEFAULT_REFRESH_INTERVAL = 45_000;

const SEVERITY_RANKING = {
  critical: 5,
  major: 4,
  high: 3,
  warning: 2,
  minor: 1,
  info: 0,
  healthy: 0,
};

function normaliseIssue(issue, fallbackService = 'platform') {
  if (!issue) {
    return null;
  }

  const severity = `${issue.severity ?? issue.level ?? issue.status ?? 'info'}`.toLowerCase();
  const service = `${issue.service ?? issue.component ?? fallbackService ?? 'platform'}`.trim();
  const message =
    issue.message ?? issue.description ?? issue.summary ?? issue.detail ?? 'Service reported an issue';
  const observedAt = issue.observedAt ?? issue.detectedAt ?? issue.updatedAt ?? issue.createdAt ?? null;
  const identifier =
    issue.id ?? issue.checkId ?? issue.alertId ?? issue.slug ?? `${service}:${message}`.slice(0, 80);

  return {
    id: `${identifier}`,
    service,
    severity,
    message,
    observedAt,
  };
}

function deriveHealthState(snapshot, { error } = {}) {
  const hasSnapshot = Boolean(snapshot);
  const issues = [];

  if (Array.isArray(snapshot?.checks)) {
    snapshot.checks.forEach((check) => {
      const normalised = normaliseIssue(check, check.service ?? check.name ?? 'runtime');
      if (normalised) {
        issues.push(normalised);
      }
    });
  }

  if (Array.isArray(snapshot?.incidents)) {
    snapshot.incidents.forEach((incident) => {
      const normalised = normaliseIssue(incident, incident.service ?? incident.area ?? 'runtime');
      if (normalised) {
        issues.push({ ...normalised, severity: normalised.severity || 'warning' });
      }
    });
  }

  if (Array.isArray(snapshot?.alerts)) {
    snapshot.alerts.forEach((alert) => {
      const normalised = normaliseIssue(alert, alert.service ?? 'runtime');
      if (normalised) {
        issues.push(normalised);
      }
    });
  }

  let level = hasSnapshot ? 'healthy' : 'unknown';
  let label = snapshot?.summary || snapshot?.status || (hasSnapshot ? 'All systems operational' : 'Awaiting snapshot');

  const highestSeverityScore = issues.reduce(
    (score, issue) => Math.max(score, SEVERITY_RANKING[issue.severity] ?? 0),
    0,
  );

  if (highestSeverityScore >= SEVERITY_RANKING.critical) {
    level = 'critical';
  } else if (highestSeverityScore >= SEVERITY_RANKING.high) {
    level = 'degraded';
  } else if (!issues.length && !hasSnapshot) {
    level = 'unknown';
  }

  let errorIssue = null;
  if (error) {
    errorIssue = normaliseIssue(
      {
        id: 'runtime-health-fetch',
        severity: hasSnapshot ? 'warning' : 'critical',
        message: error?.message || 'Unable to contact runtime telemetry service',
        service: 'runtime-health',
        observedAt: new Date().toISOString(),
      },
      'runtime-health',
    );
    issues.push(errorIssue);
    if (!hasSnapshot) {
      level = 'unavailable';
      label = errorIssue.message;
    } else if (level !== 'critical') {
      level = 'degraded';
      label = `Degraded – ${errorIssue.message}`;
    }
  }

  const affectedServices = Array.from(new Set(issues.map((issue) => issue.service).filter(Boolean)));

  return {
    level,
    label,
    issues,
    affectedServices,
    lastError: errorIssue ?? null,
  };
}

export default function useRuntimeHealthSnapshot({ refreshIntervalMs = DEFAULT_REFRESH_INTERVAL } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastErrorAt, setLastErrorAt] = useState(null);
  const [healthSummary, setHealthSummary] = useState(() => deriveHealthState(null));
  const [isStale, setIsStale] = useState(false);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasSnapshotRef = useRef(false);
  const lastSnapshotRef = useRef(null);
  const autoRefreshInterval = refreshIntervalMs > 0 ? refreshIntervalMs : null;

  const loadSnapshot = useCallback(
    async ({ quiet = false } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!quiet) {
        setError(null);
        if (hasSnapshotRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const payload = await fetchRuntimeHealth({}, { signal: controller.signal });
        if (!isMountedRef.current) {
          return;
        }
        setData(payload);
        lastSnapshotRef.current = payload;
        hasSnapshotRef.current = true;
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date().toISOString());
        setLastErrorAt(null);
        setHealthSummary(deriveHealthState(payload));
      } catch (err) {
        if (controller.signal.aborted || !isMountedRef.current) {
          return;
        }
        if (!quiet) {
          setError(err?.message || 'Failed to load runtime telemetry.');
          setLastErrorAt(new Date().toISOString());
          setHealthSummary(deriveHealthState(lastSnapshotRef.current, { error: err }));
        }
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadSnapshot({ quiet: false });

    if (autoRefreshInterval) {
      const timer = setInterval(() => {
        loadSnapshot({ quiet: true });
      }, autoRefreshInterval);
      return () => {
        isMountedRef.current = false;
        clearInterval(timer);
        abortControllerRef.current?.abort();
      };
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [loadSnapshot, autoRefreshInterval]);

  const refresh = useCallback(() => loadSnapshot({ quiet: false }), [loadSnapshot]);

  const staleThreshold = useMemo(() => {
    const baseInterval = autoRefreshInterval ?? DEFAULT_REFRESH_INTERVAL;
    return baseInterval * 1.5;
  }, [autoRefreshInterval]);

  useEffect(() => {
    if (!lastUpdated) {
      setIsStale(false);
      return undefined;
    }

    const lastUpdatedTime = new Date(lastUpdated).getTime();
    if (Number.isNaN(lastUpdatedTime)) {
      setIsStale(false);
      return undefined;
    }

    const evaluate = () => {
      const stale = Date.now() - lastUpdatedTime > staleThreshold;
      setIsStale(stale);
    };

    evaluate();

    const pollInterval = Math.min(
      Math.max(Math.floor(staleThreshold / 4), 5_000),
      Math.max(staleThreshold, 5_000),
    );

    const intervalId = setInterval(evaluate, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastUpdated, staleThreshold]);

  return {
    data,
    loading: hasSnapshotRef.current ? false : loading,
    refreshing: hasSnapshotRef.current ? refreshing : loading,
    error,
    lastUpdated,
    lastErrorAt,
    status: healthSummary.level,
    healthSummary,
    isStale,
    refresh,
  };
}

