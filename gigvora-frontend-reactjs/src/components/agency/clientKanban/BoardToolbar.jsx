import PropTypes from 'prop-types';
import {
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, classNames, HEALTH_TONES } from './utils.js';

const PRESENCE_BADGES = Object.freeze({
  active: 'bg-emerald-400',
  recent: 'bg-sky-400',
  idle: 'bg-amber-400',
  offline: 'bg-slate-300',
});

function formatStatus(value) {
  if (!value) {
    return '';
  }
  return String(value)
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function Metric({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </div>
  );
}

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
};

export default function BoardToolbar({
  metrics,
  columnSummary,
  onCreateColumn,
  onCreateCard,
  onTogglePanel,
  panelOpen,
  collaborationSummary,
  onToggleFocusClient,
  focusClientMode,
  activeClient,
  canFocusClient,
}) {
  const focusLabel = focusClientMode
    ? 'Show all work'
    : activeClient?.name
      ? `Focus ${activeClient.name}`
      : 'Focus client';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreateCard}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accentDark"
          >
            <PlusIcon className="h-4 w-4" />
            Card
          </button>
          <button
            type="button"
            onClick={onCreateColumn}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Column
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFocusClient?.()}
            disabled={!canFocusClient}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              focusClientMode
                ? 'border-accent bg-accent text-white hover:bg-accentDark'
                : 'border-slate-200 bg-white text-slate-700 hover:border-accent hover:text-accent',
              !canFocusClient ? 'cursor-not-allowed opacity-50 hover:border-slate-200 hover:text-slate-500' : '',
            )}
          >
            <UserGroupIcon className="h-4 w-4" />
            {focusLabel}
          </button>
          <button
            type="button"
            onClick={onTogglePanel}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
            {panelOpen ? 'Hide' : 'Clients'}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Pipeline" value={formatCurrency(metrics.pipelineValue)} helper={`${metrics.totalActiveCards ?? 0} active`} />
        <Metric label="Due" value={metrics.dueSoon ?? 0} helper="Next 7 days" />
        <Metric label="Risk" value={metrics.atRisk ?? 0} helper="Needs attention" />
      </div>
      {collaborationSummary ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Collaborators</span>
            <span className="text-[11px] text-slate-500">
              {collaborationSummary.activeMembers ?? 0} active · {collaborationSummary.total ?? 0} total
            </span>
          </div>
          <div className="flex -space-x-2">
            {collaborationSummary.members.slice(0, 5).map((member) => {
              const presenceTone = PRESENCE_BADGES[member.presence] ?? PRESENCE_BADGES.offline;
              const title = member.presenceLabel
                ? `${member.name} · ${member.presenceLabel}`
                : member.role
                  ? `${member.name} · ${member.role}`
                  : member.name;
              return (
                <div key={member.key} className="relative">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      title={title}
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <span
                      title={title}
                      className={classNames(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold uppercase',
                        member.tone,
                      )}
                    >
                      {member.initials}
                    </span>
                  )}
                  <span
                    className={classNames(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white shadow-sm',
                      presenceTone,
                    )}
                    title={member.presenceLabel}
                  />
                </div>
              );
            })}
            {collaborationSummary.total > 5 ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
                +{collaborationSummary.total - 5}
              </span>
            ) : null}
          </div>
          {focusClientMode && activeClient ? (
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                <span className="text-xs font-semibold text-accent">Focusing {activeClient.name}</span>
                {activeClient.tier ? (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Tier {activeClient.tier}
                  </span>
                ) : null}
                {activeClient.healthStatus ? (
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      HEALTH_TONES[activeClient.healthStatus] ?? 'border-slate-200 bg-slate-100/80 text-slate-600',
                    )}
                  >
                    {formatStatus(activeClient.healthStatus)}
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">Updated {collaborationSummary.lastActivityLabel}</span>
            </div>
          ) : (
            <span className="ml-auto text-xs text-slate-500">
              Updated {collaborationSummary.lastActivityLabel}
            </span>
          )}
        </div>
      ) : null}
      {columnSummary?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {columnSummary.map((column) => (
            <span
              key={column.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {column.name}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {column.totalCards}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

BoardToolbar.propTypes = {
  metrics: PropTypes.shape({
    pipelineValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalActiveCards: PropTypes.number,
    dueSoon: PropTypes.number,
    atRisk: PropTypes.number,
  }),
  columnSummary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      totalCards: PropTypes.number,
    }),
  ),
  onCreateColumn: PropTypes.func,
  onCreateCard: PropTypes.func,
  onTogglePanel: PropTypes.func,
  panelOpen: PropTypes.bool,
  collaborationSummary: PropTypes.shape({
    members: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        role: PropTypes.string,
        initials: PropTypes.string.isRequired,
        tone: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        presence: PropTypes.string,
        presenceLabel: PropTypes.string,
      }),
    ),
    total: PropTypes.number,
    activeMembers: PropTypes.number,
    lastActivity: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    lastActivityLabel: PropTypes.string,
  }),
  onToggleFocusClient: PropTypes.func,
  focusClientMode: PropTypes.bool,
  activeClient: PropTypes.shape({ name: PropTypes.string }),
  canFocusClient: PropTypes.bool,
};

BoardToolbar.defaultProps = {
  metrics: {},
  columnSummary: [],
  panelOpen: true,
  collaborationSummary: null,
  onToggleFocusClient: undefined,
  focusClientMode: false,
  activeClient: null,
  canFocusClient: false,
};
