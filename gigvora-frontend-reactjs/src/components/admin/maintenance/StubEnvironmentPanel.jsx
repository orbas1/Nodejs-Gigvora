import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const STATUS_STYLES = {
  connected: {
    label: 'Connected',
    tone: 'text-emerald-700',
    badge: 'border-emerald-200 bg-emerald-50',
    icon: CheckCircleIcon,
  },
  error: {
    label: 'Connection issue',
    tone: 'text-rose-700',
    badge: 'border-rose-200 bg-rose-50',
    icon: ExclamationTriangleIcon,
  },
  disabled: {
    label: 'Disabled',
    tone: 'text-slate-600',
    badge: 'border-slate-200 bg-slate-50',
    icon: NoSymbolIcon,
  },
};

function formatCheckedAt(value) {
  if (!value) {
    return 'Not yet checked';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not yet checked';
  }
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleString();
  }
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) {
    return 'Moments ago';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleString();
}

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'Live telemetry unavailable';
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours) {
    parts.push(`${hours}h`);
  }
  if (!parts.length && minutes) {
    parts.push(`${minutes}m`);
  }
  if (!parts.length) {
    parts.push('<1m');
  }
  return parts.join(' ');
}

function formatEventTimestamp(value, fallback = 'No upcoming events') {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ChipList({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.id || item.slug || item}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
        >
          <span>{item.name ?? item.slug ?? item}</span>
        </li>
      ))}
    </ul>
  );
}

ChipList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})])),
  emptyLabel: PropTypes.string,
};

ChipList.defaultProps = {
  items: [],
  emptyLabel: 'No data available',
};

function HeaderExample({ title, headers }) {
  const entries =
    headers && typeof headers === 'object'
      ? Object.entries(headers).filter(([key]) => key && key.length)
      : [];

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      {entries.length ? (
        <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-900/90 p-3 text-[11px] leading-relaxed text-slate-100 shadow-inner">
          {entries.map(([key, value]) => `${key}: ${value}`).join('\n')}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Headers mirror the required list.</p>
      )}
    </div>
  );
}

HeaderExample.propTypes = {
  title: PropTypes.string.isRequired,
  headers: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

HeaderExample.defaultProps = {
  headers: null,
};

function RequiredHeaders({ headers }) {
  const viewHeaders = headers?.view ?? [];
  const manageHeaders = headers?.manage ?? [];
  return (
    <dl className="space-y-2 text-xs text-slate-600">
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-400">View requests</dt>
        <dd className="mt-1 text-slate-600">{viewHeaders.join(', ') || 'x-roles'}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-400">Write requests</dt>
        <dd className="mt-1 text-slate-600">{manageHeaders.join(', ') || 'x-roles, x-user-id'}</dd>
      </div>
    </dl>
  );
}

RequiredHeaders.propTypes = {
  headers: PropTypes.shape({
    view: PropTypes.arrayOf(PropTypes.string),
    manage: PropTypes.arrayOf(PropTypes.string),
  }),
};

RequiredHeaders.defaultProps = {
  headers: null,
};

export default function StubEnvironmentPanel({ environment, loading, onRefresh }) {
  const statusKey = environment?.status ?? 'disabled';
  const status = STATUS_STYLES[statusKey] ?? STATUS_STYLES.disabled;
  const StatusIcon = status.icon;
  const metadata = environment?.metadata ?? {};
  const config = environment?.config ?? {};
  const allowedOrigins = metadata.allowedOrigins ?? config.allowedOrigins ?? [];
  const workspaces = metadata.availableWorkspaces ?? [];
  const scenarios = metadata.scenarios ?? [];
  const latency = metadata.latency ?? {};
  const workspaceSummary = metadata.workspaceSummary ?? {};
  const deployment = metadata.deployment ?? {};
  const telemetry = metadata.telemetry ?? {};
  const headerExamples = metadata.headerExamples ?? {};
  const message = environment?.message || environment?.error || 'Preview stub connectivity from the control plane.';
  const checkedAtLabel = formatCheckedAt(environment?.checkedAt);
  const uptimeLabel = telemetry.uptimeSeconds != null ? formatUptime(telemetry.uptimeSeconds) : 'Live telemetry unavailable';
  const totalEvents =
    typeof workspaceSummary.totalEvents === 'number'
      ? workspaceSummary.totalEvents
      : typeof telemetry.totalEvents === 'number'
        ? telemetry.totalEvents
        : null;
  const scenarioCount = telemetry.scenarioCount ?? scenarios.length ?? 0;
  const defaultWorkspaceSlug = workspaceSummary.defaultWorkspaceSlug;
  const defaultWorkspaceId = workspaceSummary.defaultWorkspaceId;
  const lastEventLabel = formatEventTimestamp(telemetry.lastEventStartsAt, 'Not recorded');
  const releaseChannel = deployment.releaseChannel || 'Not set';
  const region = deployment.region || 'Not set';
  const ownerTeam = deployment.ownerTeam || 'Not assigned';
  const buildLabel = deployment.buildNumber ? `Build ${deployment.buildNumber}` : null;

  const isDefaultWorkspace = (workspace) => {
    if (defaultWorkspaceId != null && workspace?.id != null) {
      return `${workspace.id}` === `${defaultWorkspaceId}`;
    }
    if (defaultWorkspaceSlug && workspace?.slug) {
      return workspace.slug === defaultWorkspaceSlug;
    }
    return false;
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft" id="integration-stub">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <span
            className={clsx(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
              status.badge,
              status.tone,
            )}
          >
            <StatusIcon className="h-4 w-4" aria-hidden="true" />
            {status.label}
          </span>
          <h2 className="text-2xl font-semibold text-slate-900">Integration & stub environment</h2>
          <p className="text-sm text-slate-600">
            {message}
          </p>
          <dl className="grid gap-4 text-xs text-slate-500 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Base URL</dt>
              <dd className="mt-1 break-all text-slate-700">{environment?.baseUrl || config.baseUrl || 'Not configured'}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Last check</dt>
              <dd className="mt-1 text-slate-700">{checkedAtLabel}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">API key</dt>
              <dd className="mt-1 text-slate-700">
                {config.requiresApiKey ? config.apiKeyPreview || 'Required' : 'Not required'}
              </dd>
            </div>
          </dl>
          <dl className="mt-4 grid gap-4 text-xs text-slate-500 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Release channel</dt>
              <dd className="mt-1 text-slate-700">{releaseChannel}</dd>
              {buildLabel ? <p className="mt-2 text-[11px] text-slate-500">{buildLabel}</p> : null}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Region</dt>
              <dd className="mt-1 text-slate-700">{region}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Uptime</dt>
              <dd className="mt-1 text-slate-700">{uptimeLabel}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Total events</dt>
              <dd className="mt-1 text-slate-700">{totalEvents != null ? totalEvents : 'Not available'}</dd>
            </div>
          </dl>
          <dl className="mt-4 grid gap-4 text-xs text-slate-500 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Scenario toggles</dt>
              <dd className="mt-1 text-slate-700">{scenarioCount}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Owner team</dt>
              <dd className="mt-1 text-slate-700">{ownerTeam}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Last event seeded</dt>
              <dd className="mt-1 text-slate-700">{lastEventLabel}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={clsx('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          Refresh status
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Allowed origins</h3>
          <ChipList items={allowedOrigins.map((origin) => ({ id: origin, name: origin }))} emptyLabel="Origins mirror runtime config." />
          <h3 className="pt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Required headers</h3>
          <RequiredHeaders headers={metadata.requiredHeaders} />
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Workspace catalogue</h3>
          {workspaces.length ? (
            <ul className="space-y-3">
              {workspaces.map((workspace) => (
                <li
                  key={workspace.id ?? workspace.slug ?? workspace.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">{workspace.name}</p>
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      {workspace.slug || workspace.id}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-slate-600 shadow">
                      {(workspace.upcomingEvents ?? 0).toLocaleString()} events
                    </span>
                    <span>Next: {formatEventTimestamp(workspace.nextEventStartsAt)}</span>
                    <span className="text-slate-400">{workspace.timezone}</span>
                  </div>
                  {isDefaultWorkspace(workspace) ? (
                    <span className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase text-emerald-700">
                      Default workspace
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Workspace fixtures load on demand.</p>
          )}
          <p className="text-xs text-slate-500">
            Default workspace:{' '}
            <span className="font-semibold text-slate-700">
              {workspaceSummary?.defaultWorkspace?.name || config.workspaceSlug || workspaceSummary?.defaultWorkspaceSlug || 'not set'}
            </span>
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Failure scenarios</h3>
            <ChipList items={scenarios} emptyLabel="Scenario toggles disabled." />
            <p className="mt-2 text-[11px] text-slate-500">{scenarioCount} active toggle{scenarioCount === 1 ? '' : 's'}.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latency profile</h3>
            <p className="text-xs text-slate-600">
              {latency?.minMs != null && latency?.maxMs != null
                ? `${latency.minMs}–${latency.maxMs} ms`
                : 'No latency injected'}
            </p>
            {metadata.defaults ? (
              <p className="mt-2 text-[11px] text-slate-500">
                Window {metadata.defaults.windowDays}d · Lookahead {metadata.defaults.lookaheadDays}d · Limit{' '}
                {metadata.defaults.limit}/{metadata.defaults.maxLimit}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Header examples</h3>
          <HeaderExample title="View request" headers={headerExamples.view} />
          <HeaderExample title="Write request" headers={headerExamples.manage} />
        </div>
      </div>
    </section>
  );
}

StubEnvironmentPanel.propTypes = {
  environment: PropTypes.shape({
    status: PropTypes.string,
    baseUrl: PropTypes.string,
    checkedAt: PropTypes.string,
    message: PropTypes.string,
    error: PropTypes.string,
    metadata: PropTypes.shape({
      allowedOrigins: PropTypes.arrayOf(PropTypes.string),
      availableWorkspaces: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        slug: PropTypes.string,
        timezone: PropTypes.string,
        upcomingEvents: PropTypes.number,
        nextEventStartsAt: PropTypes.string,
      })),
      scenarios: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})])),
      latency: PropTypes.shape({ minMs: PropTypes.number, maxMs: PropTypes.number }),
      defaults: PropTypes.shape({
        windowDays: PropTypes.number,
        lookaheadDays: PropTypes.number,
        limit: PropTypes.number,
        maxLimit: PropTypes.number,
      }),
      requiredHeaders: PropTypes.shape({
        view: PropTypes.arrayOf(PropTypes.string),
        manage: PropTypes.arrayOf(PropTypes.string),
      }),
      workspaceSummary: PropTypes.shape({
        totalWorkspaces: PropTypes.number,
        totalEvents: PropTypes.number,
        defaultWorkspaceSlug: PropTypes.string,
        defaultWorkspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        defaultWorkspace: PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          slug: PropTypes.string,
          name: PropTypes.string,
          timezone: PropTypes.string,
        }),
      }),
      deployment: PropTypes.shape({
        releaseChannel: PropTypes.string,
        region: PropTypes.string,
        buildNumber: PropTypes.string,
        ownerTeam: PropTypes.string,
        version: PropTypes.string,
      }),
      telemetry: PropTypes.shape({
        uptimeSeconds: PropTypes.number,
        scenarioCount: PropTypes.number,
        totalEvents: PropTypes.number,
        lastEventStartsAt: PropTypes.string,
        calculatedAt: PropTypes.string,
      }),
      headerExamples: PropTypes.shape({
        view: PropTypes.object, // eslint-disable-line react/forbid-prop-types
        manage: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      }),
    }),
    config: PropTypes.shape({
      baseUrl: PropTypes.string,
      allowedOrigins: PropTypes.arrayOf(PropTypes.string),
      workspaceSlug: PropTypes.string,
      requiresApiKey: PropTypes.bool,
      apiKeyPreview: PropTypes.string,
    }),
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

StubEnvironmentPanel.defaultProps = {
  environment: null,
  loading: false,
  onRefresh: undefined,
};
