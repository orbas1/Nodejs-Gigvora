import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useDataFetchingLayer } from '../../context/DataFetchingLayer.js';
import { useTheme } from '../../context/ThemeProvider.tsx';
import analytics from '../../services/analytics.js';
import { formatRelativeTime } from '../../utils/date.js';
import { useSession } from '../../context/SessionContext.jsx';

const DEFAULT_ENDPOINT = '/platform/status/summary';
const ACK_STORAGE_KEY = 'gigvora:web:system-status-toast:v1';
const severityRank = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  'partial_outage': 3,
  outage: 4,
};

const severityConfig = {
  operational: {
    Icon: CheckCircleIcon,
    container: 'from-emerald-500 via-emerald-500 to-emerald-600 text-white',
    badge: 'bg-white/15 text-white',
    accent: 'text-emerald-100',
  },
  maintenance: {
    Icon: ClockIcon,
    container: 'from-amber-500 via-amber-500 to-orange-500 text-white',
    badge: 'bg-white/15 text-white',
    accent: 'text-amber-100',
  },
  degraded: {
    Icon: ExclamationTriangleIcon,
    container: 'from-amber-500 via-amber-500 to-rose-500 text-white',
    badge: 'bg-white/15 text-white',
    accent: 'text-amber-100',
  },
  partial_outage: {
    Icon: ShieldExclamationIcon,
    container: 'from-rose-500 via-rose-500 to-amber-500 text-white',
    badge: 'bg-white/20 text-white',
    accent: 'text-rose-100',
  },
  outage: {
    Icon: BoltIcon,
    container: 'from-rose-600 via-rose-500 to-red-500 text-white',
    badge: 'bg-white/20 text-white',
    accent: 'text-rose-100',
  },
};

function normaliseSeverity(value) {
  if (!value) return 'operational';
  const normalised = String(value)
    .toLowerCase()
    .replace(/[^a-z]+/g, '_');
  if (normalised === 'partial_outage') {
    return 'partial_outage';
  }
  if (normalised in severityRank) {
    return normalised;
  }
  if (normalised.includes('outage')) {
    return 'outage';
  }
  if (normalised.includes('maintenance')) {
    return 'maintenance';
  }
  if (normalised.includes('degrad')) {
    return 'degraded';
  }
  return 'operational';
}

function dedupeStrings(values = []) {
  const seen = new Set();
  values
    .filter((item) => typeof item === 'string' && item.trim())
    .forEach((item) => {
      seen.add(item.trim());
    });
  return Array.from(seen);
}

function normaliseIncident(incident) {
  if (!incident || typeof incident !== 'object') {
    return null;
  }
  const severity = normaliseSeverity(incident.severity ?? incident.impact ?? incident.status);
  const status = String(incident.status ?? incident.state ?? 'investigating').toLowerCase();
  const id = String(incident.id ?? incident.incidentId ?? incident.slug ?? incident.handle ?? '') || null;
  const title = incident.title ?? incident.name ?? 'System incident';
  const updatedAt = incident.updatedAt ?? incident.updated_at ?? incident.lastUpdatedAt ?? null;
  const startedAt = incident.startedAt ?? incident.started_at ?? incident.createdAt ?? null;
  const resolvedAt = incident.resolvedAt ?? incident.resolved_at ?? null;
  const services = dedupeStrings(
    (incident.services ?? incident.components ?? incident.impactedServices ?? []).map((item) =>
      typeof item === 'string' ? item : item?.name ?? item?.slug ?? null,
    ),
  );

  return {
    id,
    severity,
    status,
    title,
    updatedAt,
    startedAt,
    resolvedAt,
    services,
  };
}

function normaliseMaintenance(window = {}) {
  if (!window || typeof window !== 'object') {
    return null;
  }
  const status = String(window.status ?? window.state ?? 'scheduled').toLowerCase();
  const startsAt = window.startsAt ?? window.starts_at ?? window.startTime ?? window.start_at ?? null;
  const endsAt = window.endsAt ?? window.ends_at ?? window.endTime ?? window.end_at ?? null;
  const id = String(window.id ?? window.slug ?? window.handle ?? '') || null;
  const title = window.title ?? window.summary ?? 'Scheduled maintenance';
  const services = dedupeStrings(
    (window.services ?? window.components ?? window.impactedServices ?? []).map((item) =>
      typeof item === 'string' ? item : item?.name ?? item?.slug ?? null,
    ),
  );

  return {
    id,
    status,
    startsAt,
    endsAt,
    title,
    services,
  };
}

function normaliseStatusPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      severity: 'operational',
      summary: 'All systems operational',
      statusPageUrl: '/status',
      services: [],
      headline: 'All systems operational',
      incidents: [],
      maintenances: [],
      updatedAt: null,
      fingerprint: 'operational',
      source: null,
    };
  }

  const severity = normaliseSeverity(payload.severity ?? payload.status ?? payload.indicator);
  const summary = payload.summary ?? payload.description ?? payload.message ?? '';
  const headline = payload.headline ?? payload.title ?? summary ?? 'System update';
  const statusPageUrl = payload.statusPageUrl ?? payload.url ?? '/status';
  const updatedAt = payload.updatedAt ?? payload.updated_at ?? payload.lastUpdatedAt ?? payload.generatedAt ?? null;
  const incidents = Array.isArray(payload.incidents) ? payload.incidents.map(normaliseIncident).filter(Boolean) : [];
  const maintenances = Array.isArray(payload.maintenance)
    ? payload.maintenance.map(normaliseMaintenance).filter(Boolean)
    : Array.isArray(payload.maintenances)
      ? payload.maintenances.map(normaliseMaintenance).filter(Boolean)
      : [];

  const activeIncidents = incidents.filter((incident) =>
    !['resolved', 'completed'].includes(incident.status) && !incident.resolvedAt,
  );
  const upcomingMaintenance = maintenances.filter((window) => {
    if (!window.startsAt) return false;
    const start = new Date(window.startsAt);
    if (Number.isNaN(start.getTime())) {
      return false;
    }
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24; // within next 24 hours
  });

  const services = dedupeStrings([
    ...(payload.services ?? []),
    ...(payload.components ?? []),
    ...activeIncidents.flatMap((incident) => incident.services),
    ...upcomingMaintenance.flatMap((window) => window.services),
  ]);

  const fingerprint = [
    severity,
    updatedAt,
    activeIncidents.map((incident) => `${incident.id ?? incident.title}-${incident.updatedAt ?? incident.startedAt ?? ''}`).join('|'),
    upcomingMaintenance.map((window) => `${window.id ?? window.title}-${window.startsAt ?? ''}`).join('|'),
  ]
    .filter(Boolean)
    .join('::');

  return {
    severity,
    summary,
    headline: headline || 'System update',
    statusPageUrl,
    updatedAt,
    services,
    incidents: activeIncidents,
    maintenances: upcomingMaintenance,
    fingerprint: fingerprint || severity,
    source: payload.source ?? payload.provider ?? null,
  };
}

function loadAcknowledgement() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(ACK_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (!parsed.until || Number.isNaN(Date.parse(parsed.until))) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse system status acknowledgement', error);
    return null;
  }
}

function persistAcknowledgement(value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    if (!value) {
      window.localStorage.removeItem(ACK_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to persist system status acknowledgement', error);
  }
}

function createStatusCopy(status) {
  if (!status) {
    return {
      headline: 'All systems operational',
      body: 'Everything is humming along smoothly.',
      meta: null,
    };
  }

  if (status.incidents.length) {
    const primary = status.incidents[0];
    return {
      headline: primary.title ?? status.headline,
      body:
        status.summary ||
        primary.summary ||
        `We’re working through an issue impacting ${primary.services.length ? primary.services.join(', ') : 'core services'}.`,
      meta: primary.updatedAt ?? status.updatedAt,
    };
  }

  if (status.maintenances.length) {
    const window = status.maintenances[0];
    const startLabel = window.startsAt ? formatRelativeTime(window.startsAt) : 'soon';
    return {
      headline: window.title ?? status.headline,
      body:
        status.summary ||
        `Heads up: scheduled maintenance ${startLabel.includes('ago') ? 'is underway' : `begins ${startLabel}`}. We’ll keep downtime minimal.`,
      meta: window.startsAt ?? status.updatedAt,
    };
  }

  return {
    headline: status.headline,
    body: status.summary || 'All systems are operating normally.',
    meta: status.updatedAt,
  };
}

function shouldDisplayStatus(status, acknowledgement, minimumSeverity = 'degraded') {
  if (!status) {
    return false;
  }
  const severityValue = severityRank[status.severity] ?? 0;
  const threshold = severityRank[minimumSeverity] ?? 1;
  const hasActionableIncident = status.incidents.length > 0;
  const hasUpcomingMaintenance = status.maintenances.length > 0;
  const fingerprint = status.fingerprint;

  if (acknowledgement && acknowledgement.fingerprint === fingerprint) {
    const expiresAt = new Date(acknowledgement.until);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt > new Date()) {
      return false;
    }
  }

  return severityValue >= threshold || hasActionableIncident || hasUpcomingMaintenance;
}

export function SystemStatusToast({
  summaryEndpoint = DEFAULT_ENDPOINT,
  pollInterval = 1000 * 60 * 5,
  autoHideMinutes = 45,
  minSeverity = 'degraded',
  className,
  onNavigate,
  pinnedServices = [],
}) {
  const { fetchResource, subscribe, buildKey } = useDataFetchingLayer();
  const { tokens, resolveComponentTokens } = useTheme();
  let sessionContext;
  try {
    sessionContext = useSession();
  } catch (error) {
    sessionContext = { session: null };
  }
  const [status, setStatus] = useState(() => normaliseStatusPayload(null));
  const [isVisible, setIsVisible] = useState(false);
  const acknowledgementRef = useRef(null);
  const trackedFingerprintRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    acknowledgementRef.current = loadAcknowledgement();
  }, []);

  const cacheKey = useMemo(() => buildKey('GET', summaryEndpoint, {}), [buildKey, summaryEndpoint]);

  const themeTokens = useMemo(
    () => resolveComponentTokens('SystemStatusToast') ?? { colors: { accent: tokens.colors?.accent ?? '#6366f1' } },
    [resolveComponentTokens, tokens.colors?.accent],
  );

  const accentColor = themeTokens.colors?.accent ?? tokens.colors?.accent ?? '#6366f1';

  const evaluateStatus = useCallback(
    (payload, { trackView = false } = {}) => {
      const nextStatus = normaliseStatusPayload(payload);
      setStatus(nextStatus);
      const acknowledgement = acknowledgementRef.current;
      const show = shouldDisplayStatus(nextStatus, acknowledgement, minSeverity);
      setIsVisible(show);

      if (show && trackView && trackedFingerprintRef.current !== nextStatus.fingerprint) {
        trackedFingerprintRef.current = nextStatus.fingerprint;
        analytics.track('system_status_toast_viewed', {
          context: {
            severity: nextStatus.severity,
            services: nextStatus.services,
            source: nextStatus.source ?? 'unknown',
          },
          userId: sessionContext.session?.id ?? null,
        });
      }
    },
    [minSeverity, sessionContext.session?.id],
  );

  useEffect(() => {
    let mounted = true;
    fetchResource(summaryEndpoint, {
      key: cacheKey,
      strategy: 'stale-while-revalidate',
      ttl: pollInterval,
      metadata: {
        origin: 'SystemStatusToast',
      },
    })
      .then((payload) => {
        if (!mounted) return;
        evaluateStatus(payload, { trackView: true });
      })
      .catch((error) => {
        console.warn('Unable to fetch system status summary', error);
        if (mounted) {
          setIsVisible(false);
        }
      });

    const unsubscribe = subscribe(cacheKey, (payload) => {
      if (!mounted || !payload?.data) {
        return;
      }
      evaluateStatus(payload.data, { trackView: true });
    });

    if (pollInterval > 0 && typeof window !== 'undefined') {
      pollTimerRef.current = window.setInterval(() => {
        fetchResource(summaryEndpoint, {
          key: cacheKey,
          strategy: 'network-only',
          metadata: {
            origin: 'SystemStatusToast',
            reason: 'polling-refresh',
          },
        })
          .then((payload) => {
            evaluateStatus(payload, { trackView: true });
          })
          .catch((error) => {
            console.debug('System status poll failed', error);
          });
      }, pollInterval);
    }

    return () => {
      mounted = false;
      unsubscribe?.();
      if (pollTimerRef.current && typeof window !== 'undefined') {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [cacheKey, evaluateStatus, fetchResource, pollInterval, subscribe, summaryEndpoint]);

  const handleDismiss = useCallback(() => {
    if (!status) {
      setIsVisible(false);
      return;
    }
    const until = new Date(Date.now() + autoHideMinutes * 60 * 1000).toISOString();
    const acknowledgement = {
      until,
      fingerprint: status.fingerprint,
      severity: status.severity,
    };
    acknowledgementRef.current = acknowledgement;
    persistAcknowledgement(acknowledgement);
    setIsVisible(false);
    analytics.track('system_status_toast_dismissed', {
      context: {
        severity: status.severity,
        services: status.services,
        fingerprint: status.fingerprint,
      },
      userId: sessionContext.session?.id ?? null,
    });
  }, [autoHideMinutes, sessionContext.session?.id, status]);

  const handleNavigate = useCallback(() => {
    analytics.track('system_status_toast_open_status_page', {
      context: {
        severity: status.severity,
        services: status.services,
        fingerprint: status.fingerprint,
      },
      userId: sessionContext.session?.id ?? null,
    });
    if (onNavigate) {
      onNavigate(status.statusPageUrl, status);
      return;
    }
    if (status.statusPageUrl && typeof window !== 'undefined') {
      window.open(status.statusPageUrl, '_blank', 'noopener,noreferrer');
    }
  }, [onNavigate, sessionContext.session?.id, status]);

  const copy = useMemo(() => createStatusCopy(status), [status]);

  const severity = status?.severity ?? 'operational';
  const tone = severityConfig[severity] ?? severityConfig.operational;
  const ToneIcon = tone.Icon ?? CheckCircleIcon;
  const accentStyle = { '--accent-color': accentColor };
  const services = useMemo(() => {
    const merged = new Set([...(status?.services ?? []), ...pinnedServices]);
    return Array.from(merged).slice(0, 5);
  }, [pinnedServices, status?.services]);
  const maintenances = status?.maintenances ?? [];

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={clsx(
        'pointer-events-none fixed inset-x-0 bottom-6 z-[1050] flex justify-center px-4 sm:px-6',
        className,
      )}
      aria-live="assertive"
      role="status"
    >
      <div
        className={clsx(
          'pointer-events-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl',
          tone.container,
        )}
        style={accentStyle}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/15 shadow-inner">
            <ToneIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Platform status</p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-white">{copy.headline}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{copy.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/70">
              {services.map((service) => (
                <span key={service} className={clsx('rounded-full px-3 py-1 font-medium shadow-sm', tone.badge)}>
                  {service}
                </span>
              ))}
              {copy.meta ? (
                <span className={clsx('inline-flex items-center gap-1 rounded-full bg-black/15 px-3 py-1', tone.badge)}>
                  <ClockIcon className="h-4 w-4" aria-hidden="true" />
                  Updated {formatRelativeTime(copy.meta, { numeric: 'auto' })}
                </span>
              ) : null}
            </div>
            {maintenances.length ? (
              <p className="mt-3 rounded-2xl bg-black/15 px-3 py-2 text-xs leading-relaxed text-white/75">
                Maintenance window {formatRelativeTime(maintenances[0].startsAt, { numeric: 'auto' })} · Expected impact:{' '}
                {maintenances[0].services.length ? maintenances[0].services.join(', ') : 'Platform-wide'}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Dismiss system status</span>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className={clsx('text-xs font-medium uppercase tracking-wide', tone.accent)}>
            {status.source ? `Source · ${status.source}` : 'Live from operations center'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleNavigate}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-inner transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              View full status
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

SystemStatusToast.propTypes = {
  summaryEndpoint: PropTypes.string,
  pollInterval: PropTypes.number,
  autoHideMinutes: PropTypes.number,
  minSeverity: PropTypes.oneOf(Object.keys(severityRank)),
  className: PropTypes.string,
  onNavigate: PropTypes.func,
  pinnedServices: PropTypes.arrayOf(PropTypes.string),
};

export default SystemStatusToast;
