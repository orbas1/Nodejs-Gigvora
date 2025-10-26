import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { FunnelIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const STATUS_TONES = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  invited: 'bg-blue-100 text-blue-700 border-blue-200',
  suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  archived: 'bg-slate-200 text-slate-600 border-slate-300',
};

const RISK_TONES = {
  low: 'from-emerald-400/80 via-emerald-500/70 to-emerald-600/80 text-white',
  medium: 'from-amber-400/80 via-amber-500/70 to-amber-600/80 text-white',
  high: 'from-rose-400/80 via-rose-500/70 to-rose-600/80 text-white',
  critical: 'from-rose-600/90 via-rose-700/90 to-rose-800/90 text-white',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function RiskPill({ level, score }) {
  const gradient = RISK_TONES[level] ?? RISK_TONES.low;
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold', gradient)}>
      <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
      {level ? `${level.charAt(0).toUpperCase()}${level.slice(1)} risk` : 'Risk'}
      {typeof score === 'number' ? <span className="text-[11px] font-medium text-white/90">{score.toFixed(0)}</span> : null}
    </span>
  );
}

RiskPill.propTypes = {
  level: PropTypes.oneOf(['low', 'medium', 'high', 'critical']).isRequired,
  score: PropTypes.number,
};

RiskPill.defaultProps = {
  score: undefined,
};

export default function UserManagementTable({ users, loading, onAssignRoles, onViewUser }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [search, setSearch] = useState('');

  const statusCounts = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        const status = (user.status ?? 'unknown').toLowerCase();
        if (!accumulator[status]) accumulator[status] = 0;
        accumulator[status] += 1;
        accumulator.all += 1;
        return accumulator;
      },
      { all: 0 },
    );
  }, [users]);

  const segments = useMemo(() => {
    const segmentCounts = new Map();
    users.forEach((user) => {
      const userSegments = user.segments ?? user.audience ?? [];
      userSegments.forEach((segment) => {
        const count = segmentCounts.get(segment) ?? 0;
        segmentCounts.set(segment, count + 1);
      });
    });
    return Array.from(segmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([segment, count]) => ({ segment, count }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const status = (user.status ?? 'unknown').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }
      if (segmentFilter !== 'all') {
        const userSegments = user.segments ?? user.audience ?? [];
        if (!userSegments.includes(segmentFilter)) {
          return false;
        }
      }
      if (!query) return true;
      const haystack = `${user.name ?? ''} ${user.email ?? ''} ${(user.roles ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [users, statusFilter, segmentFilter, search]);

  const tableRows = filteredUsers.slice(0, 12);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">User Signals</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">Access governance spotlight</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Pinpoint at-risk accounts, execute bulk actions, and open detailed dossiers without losing command center context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FunnelIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people or roles"
              className="w-60 rounded-full border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button
            type="button"
            onClick={() => onAssignRoles?.(null)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" /> Bulk assign
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Status</h4>
          <div className="flex flex-col gap-2">
            {['all', ...Object.keys(statusCounts).filter((key) => key !== 'all')].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  'flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition',
                  statusFilter === status
                    ? 'border-blue-400 bg-blue-50/70 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <span className="capitalize">{status === 'all' ? 'All statuses' : status}</span>
                <span className="text-xs font-semibold text-slate-400">{statusCounts[status] ?? 0}</span>
              </button>
            ))}
          </div>

          <h4 className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Segments</h4>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSegmentFilter('all')}
              className={clsx(
                'flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition',
                segmentFilter === 'all'
                  ? 'border-blue-400 bg-blue-50/70 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span>All segments</span>
              <span className="text-xs font-semibold text-slate-400">{users.length}</span>
            </button>
            {segments.map(({ segment, count }) => (
              <button
                key={segment}
                type="button"
                onClick={() => setSegmentFilter(segment)}
                className={clsx(
                  'flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition',
                  segmentFilter === segment
                    ? 'border-blue-400 bg-blue-50/70 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <span>{segment}</span>
                <span className="text-xs font-semibold text-slate-400">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-blue-100/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Priority accounts</h4>
              <p className="text-xs text-slate-400">Sorted by risk and recent escalations.</p>
            </div>
            <p className="text-xs font-medium text-slate-400">{filteredUsers.length} results</p>
          </div>
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last active</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading governance signals…
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    No members match the selected filters.
                  </td>
                </tr>
              ) : (
                tableRows.map((user) => {
                  const status = (user.status ?? 'unknown').toLowerCase();
                  const badgeClass = STATUS_TONES[status] ?? 'bg-slate-200 text-slate-600 border-slate-300';
                  const riskLevel = (user.riskLevel ?? user.risk)?.toLowerCase() ?? 'low';
                  const riskScore = Number.isFinite(Number(user.riskScore)) ? Number(user.riskScore) : undefined;
                  const roleLabel = (user.roles ?? []).join(', ') || '—';
                  return (
                    <tr key={user.id ?? user.email} className="transition hover:bg-blue-50/40">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{user.name ?? user.email}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {(user.segments ?? user.audience ?? []).slice(0, 3).map((segment) => (
                              <span
                                key={segment}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                              >
                                {segment}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{roleLabel}</p>
                        {user.pendingAccess ? (
                          <p className="text-xs text-amber-600">Pending {user.pendingAccess}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <RiskPill level={riskLevel} score={riskScore} />
                        {user.riskReasons?.length ? (
                          <p className="mt-1 text-xs text-amber-600">{user.riskReasons[0]}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize', badgeClass)}>
                          <span className={clsx('h-2 w-2 rounded-full', badgeClass.includes('emerald') ? 'bg-emerald-500' : badgeClass.includes('blue') ? 'bg-blue-500' : badgeClass.includes('amber') ? 'bg-amber-500' : 'bg-slate-400')} />
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.lastActive ?? user.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAssignRoles?.(user)}
                            className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            Assign roles
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewUser?.(user)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            View dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

UserManagementTable.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      email: PropTypes.string,
      status: PropTypes.string,
      roles: PropTypes.arrayOf(PropTypes.string),
      riskLevel: PropTypes.string,
      riskScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      lastActive: PropTypes.string,
      updatedAt: PropTypes.string,
      audience: PropTypes.arrayOf(PropTypes.string),
      segments: PropTypes.arrayOf(PropTypes.string),
      pendingAccess: PropTypes.string,
      riskReasons: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  loading: PropTypes.bool,
  onAssignRoles: PropTypes.func,
  onViewUser: PropTypes.func,
};

UserManagementTable.defaultProps = {
  users: [],
  loading: false,
  onAssignRoles: undefined,
  onViewUser: undefined,
};
