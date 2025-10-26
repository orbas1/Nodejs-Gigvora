import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldCheckIcon, SignalIcon, SparklesIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import analytics from '../../services/analytics.js';
import { useDataFetchingLayer } from '../../context/DataFetchingLayer.js';
import { useTheme } from '../../context/ThemeProvider.tsx';

const FEATURE_FLAG_BASE_PATH = '/admin/platform/feature-flags';

function buildFlagPath(flagKey) {
  return `${FEATURE_FLAG_BASE_PATH}/${encodeURIComponent(flagKey)}`;
}

function extractFlagPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (payload.flag && typeof payload.flag === 'object') {
    return payload.flag;
  }
  return payload;
}

function normaliseFlagPayload(payload) {
  const flag = extractFlagPayload(payload);
  if (!flag || typeof flag !== 'object') {
    return null;
  }
  const enabled = flag.enabled ?? (flag.status ? flag.status === 'active' : false);
  const status = flag.status ?? (enabled ? 'active' : 'disabled');
  return { ...flag, enabled, status };
}

function formatUpdatedAt(value) {
  if (!value) {
    return 'Never synced';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Never synced';
    }
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Never synced';
  }
}

export function FeatureFlagToggle({
  flagKey,
  label,
  description,
  audience,
  rollout,
  className,
  onChange,
}) {
  const { fetchResource, mutateResource, subscribe, buildKey } = useDataFetchingLayer();
  const { tokens, registerComponentTokens, removeComponentTokens, resolveComponentTokens } = useTheme();
  const [state, setState] = useState({ status: 'idle', enabled: false, error: null, flag: null });

  const resourcePath = useMemo(() => buildFlagPath(flagKey), [flagKey]);
  const cacheKey = useMemo(() => buildKey('GET', resourcePath, {}), [buildKey, resourcePath]);
  const themeTokens = useMemo(
    () => resolveComponentTokens('FeatureFlagToggle'),
    [resolveComponentTokens, tokens.colors.accent],
  );
  const accentColor = themeTokens.colors?.accent ?? 'var(--gv-color-accent)';

  useEffect(() => {
    registerComponentTokens('FeatureFlagToggle', {
      colors: {
        accent: tokens.colors.accent,
      },
    });
    return () => {
      removeComponentTokens('FeatureFlagToggle');
    };
  }, [registerComponentTokens, removeComponentTokens, tokens.colors.accent]);

  useEffect(() => {
    let mounted = true;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    fetchResource(resourcePath, {
      key: cacheKey,
      strategy: 'stale-while-revalidate',
      ttl: 1000 * 60 * 5,
      metadata: { featureFlag: flagKey, origin: 'FeatureFlagToggle' },
    })
      .then((data) => {
        if (!mounted) return;
        const flag = normaliseFlagPayload(data);
        if (!flag) {
          setState({
            status: 'error',
            enabled: false,
            error: 'Feature flag payload is unavailable.',
            flag: null,
          });
          return;
        }
        setState({ status: 'ready', enabled: Boolean(flag.enabled), error: null, flag });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({ status: 'error', enabled: false, error: error?.message ?? 'Unable to load flag', flag: null });
      });

    const unsubscribe = subscribe(cacheKey, (payload) => {
      if (!mounted) {
        return;
      }
      if (!payload?.data) {
        return;
      }
      const flag = normaliseFlagPayload(payload.data);
      if (!flag) {
        return;
      }
      setState((previous) => ({
        ...previous,
        status: previous.status === 'loading' ? 'ready' : previous.status,
        enabled: Boolean(flag.enabled),
        flag,
        error: null,
      }));
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [cacheKey, fetchResource, flagKey, resourcePath, subscribe]);

  const handleToggle = async () => {
    const nextEnabled = !state.enabled;
    setState((previous) => ({ ...previous, status: 'saving', enabled: nextEnabled, error: null }));
    try {
      await mutateResource(resourcePath, {
        method: 'PATCH',
        body: { enabled: nextEnabled },
        metadata: { featureFlag: flagKey, origin: 'FeatureFlagToggle' },
        invalidate: [cacheKey],
        optimisticUpdate: (updateCache) => {
          const snapshot = updateCache(cacheKey, (previous = {}) => {
            const current = normaliseFlagPayload(previous) ?? { key: flagKey };
            const updated = {
              ...current,
              enabled: nextEnabled,
              status: nextEnabled ? 'active' : 'disabled',
              updatedAt: new Date().toISOString(),
            };
            return { flag: updated };
          });
          return () => {
            updateCache(cacheKey, snapshot?.previous ?? null, { silent: true });
          };
        },
      });
      setState((previous) => ({
        ...previous,
        status: 'ready',
        error: null,
        flag: previous.flag
          ? {
              ...previous.flag,
              enabled: nextEnabled,
              status: nextEnabled ? 'active' : 'disabled',
              updatedAt: new Date().toISOString(),
            }
          : previous.flag,
      }));
      onChange?.(nextEnabled);
      analytics.track('feature_flag_toggled', {
        featureFlag: flagKey,
        enabled: nextEnabled,
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: 'error',
        enabled: !nextEnabled,
        error: error?.message ?? 'Unable to update feature flag',
      }));
    }
  };

  const statusBadge = useMemo(() => {
    if (state.status === 'loading') {
      return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Loading…</span>;
    }
    if (state.status === 'saving') {
      return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Updating…</span>;
    }
    if (state.status === 'error') {
      return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Action required</span>;
    }
    if (state.enabled) {
      return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>;
    }
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Disabled</span>;
  }, [state.enabled, state.status]);

  const toggleClasses = useMemo(
    () =>
      clsx(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        state.enabled ? 'border-transparent' : 'border-slate-200 bg-slate-200/80',
        state.enabled ? undefined : 'focus:ring-slate-400',
      ),
    [state.enabled],
  );
  const toggleStyle = useMemo(
    () => (state.enabled ? { backgroundColor: accentColor } : undefined),
    [accentColor, state.enabled],
  );

  return (
    <section
      className={clsx(
        'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-soft',
        state.enabled ? 'ring-1 ring-[var(--gv-color-accent)] ring-offset-2 ring-offset-white' : 'ring-0',
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 shadow-inner">
              {state.enabled ? <ShieldCheckIcon className="h-5 w-5" /> : <SignalIcon className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{label}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <dl className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <SparklesIcon className="h-4 w-4 text-slate-400" />
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Flag key</dt>
                <dd className="font-medium text-slate-600">{flagKey}</dd>
              </div>
            </div>
            {audience ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <SignalIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Audience</dt>
                  <dd className="font-medium text-slate-600">{audience}</dd>
                </div>
              </div>
            ) : null}
            {rollout ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Rollout</dt>
                  <dd className="font-medium text-slate-600">{rollout}</dd>
                </div>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="flex flex-col items-end gap-3">
          {statusBadge}
          <button
            type="button"
            role="switch"
            aria-checked={state.enabled}
            disabled={state.status === 'saving'}
            onClick={handleToggle}
            className={toggleClasses}
            style={toggleStyle}
          >
            <span
              className={clsx(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
                state.enabled ? 'translate-x-5' : 'translate-x-1',
              )}
            />
          </button>
          <p className="text-xs text-slate-400">Updated {formatUpdatedAt(state.flag?.updatedAt)}</p>
        </div>
      </div>
      {state.error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}
    </section>
  );
}

FeatureFlagToggle.propTypes = {
  flagKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  audience: PropTypes.string,
  rollout: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func,
};

FeatureFlagToggle.defaultProps = {
  description: 'Control rollout across personas, cohorts, and environments with linked analytics.',
  audience: null,
  rollout: null,
  className: undefined,
  onChange: undefined,
};

export default FeatureFlagToggle;
