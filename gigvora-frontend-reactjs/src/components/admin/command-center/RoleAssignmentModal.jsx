import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Dialog, Transition, Switch } from '@headlessui/react';
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

function aggregatePermissions(selectedIds, roleCatalog) {
  const aggregated = new Map();
  const risks = { score: 0, highestLevel: 'low' };
  const levelRanking = { low: 0, medium: 1, high: 2, critical: 3 };

  selectedIds.forEach((roleId) => {
    const role = roleCatalog.find((item) => item.id === roleId);
    if (!role) return;

    role.permissions?.forEach((permission) => {
      if (!permission?.id) return;
      const previous = aggregated.get(permission.id) ?? { ...permission, roles: [] };
      aggregated.set(permission.id, {
        ...previous,
        level: permission.level ?? previous.level ?? 'read',
        roles: [...previous.roles, role.name],
      });
    });

    const riskValue = Number(role.riskScore ?? 0);
    if (Number.isFinite(riskValue)) {
      risks.score += riskValue;
    }
    const currentLevel = role.riskLevel ?? 'low';
    if (levelRanking[currentLevel] > levelRanking[risks.highestLevel]) {
      risks.highestLevel = currentLevel;
    }
  });

  return {
    permissions: Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name)),
    riskScore: Math.max(risks.score, 0),
    highestRiskLevel: risks.highestLevel,
  };
}

function detectConflicts(selectedIds, roleCatalog) {
  const conflicts = [];
  const exclusiveGroups = new Map();

  selectedIds.forEach((roleId) => {
    const role = roleCatalog.find((item) => item.id === roleId);
    if (!role) return;
    const group = role.exclusiveGroup;
    if (!group) return;
    const existing = exclusiveGroups.get(group);
    if (existing) {
      conflicts.push({ group, roles: [existing.name, role.name] });
    } else {
      exclusiveGroups.set(group, role);
    }
  });

  return conflicts;
}

function RiskBadge({ level }) {
  const tone = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    critical: 'bg-rose-200 text-rose-900 border-rose-300',
  };
  const label = {
    low: 'Low',
    medium: 'Moderate',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold', tone[level] ?? tone.low)}>
      <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
      {label[level] ?? label.low} risk
    </span>
  );
}

RiskBadge.propTypes = {
  level: PropTypes.oneOf(['low', 'medium', 'high', 'critical']).isRequired,
};

export default function RoleAssignmentModal({
  open,
  user,
  availableRoles,
  initialAssignments,
  loading,
  onClose,
  onSubmit,
}) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(initialAssignments));
  const [notifyUser, setNotifyUser] = useState(true);
  const [scopeAllWorkspaces, setScopeAllWorkspaces] = useState(true);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setNotes('');
      setSearch('');
      setNotifyUser(true);
      setScopeAllWorkspaces(true);
      setSelectedRoles(new Set(initialAssignments));
      return;
    }
    setSelectedRoles(new Set(initialAssignments));
  }, [open, initialAssignments]);

  const catalog = useMemo(() => availableRoles ?? [], [availableRoles]);
  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((role) => role.name.toLowerCase().includes(query) || role.description?.toLowerCase().includes(query));
  }, [catalog, search]);

  const groupedRoles = useMemo(() => {
    return filteredRoles.reduce((groups, role) => {
      const category = role.category ?? 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(role);
      return groups;
    }, {});
  }, [filteredRoles]);

  const summary = useMemo(() => {
    const selectedIds = Array.from(selectedRoles);
    const { permissions, riskScore, highestRiskLevel } = aggregatePermissions(selectedIds, catalog);
    const conflicts = detectConflicts(selectedIds, catalog);
    const governanceWindows = catalog
      .filter((role) => selectedRoles.has(role.id) && Array.isArray(role.governanceWindows))
      .flatMap((role) => role.governanceWindows);

    const uniqueWindows = Array.from(new Set(governanceWindows));

    return {
      permissions,
      conflicts,
      riskScore,
      highestRiskLevel,
      governanceWindows: uniqueWindows,
    };
  }, [catalog, selectedRoles]);

  const handleToggleRole = (roleId) => {
    setSelectedRoles((current) => {
      const next = new Set(current);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (loading) return;
    onSubmit?.({
      roleIds: Array.from(selectedRoles),
      notifyUser,
      scopeAllWorkspaces,
      notes: notes.trim(),
    });
  };

  const selectedCount = selectedRoles.size;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (loading ? null : onClose?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-6xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
                <div className="flex flex-col border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-8 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
                        <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                      </span>
                      <div>
                        <Dialog.Title className="text-2xl font-semibold">
                          Assign roles {user?.name ? `for ${user.name}` : ''}
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-blue-100">
                          Configure granular access scopes, preview downstream permissions, and log governance notes.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <RiskBadge level={summary.highestRiskLevel} />
                      <p className="text-xs uppercase tracking-[0.35em] text-blue-200">
                        Total risk score · {summary.riskScore.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  {user?.email ? <p className="mt-4 text-xs text-blue-100">{user.email}</p> : null}
                </div>

                <div className="grid gap-10 px-8 py-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/60 p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <LockClosedIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Role catalog</h3>
                        </div>
                        <input
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search roles"
                          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 lg:w-64"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Select one or multiple roles. Conflicting assignments will surface automatically.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {Object.entries(groupedRoles).map(([category, roles]) => (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{category}</h4>
                            <p className="text-xs text-slate-400">
                              {roles.length} {roles.length === 1 ? 'role' : 'roles'}
                            </p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {roles.map((role) => {
                              const active = selectedRoles.has(role.id);
                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => handleToggleRole(role.id)}
                                  className={clsx(
                                    'flex h-full flex-col rounded-3xl border px-5 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                                    active
                                      ? 'border-blue-400 bg-blue-50/70 shadow-md shadow-blue-100'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-base font-semibold text-slate-900">{role.name}</p>
                                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{role.shortcode ?? role.id}</p>
                                    </div>
                                    {active ? (
                                      <CheckCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                                    ) : null}
                                  </div>
                                  <p className="mt-3 text-sm text-slate-600">{role.description}</p>
                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {role.riskLevel ? <RiskBadge level={role.riskLevel} /> : null}
                                    {role.segments?.map((segment) => (
                                      <span
                                        key={segment}
                                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                      >
                                        {segment}
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {filteredRoles.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                          No roles match “{search}”. Adjust your filters.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex h-full flex-col gap-6">
                    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Permission preview</h3>
                      <p className="text-xs text-slate-500">
                        Review the exact capabilities activated for this member. Permissions aggregate across every selected role.
                      </p>
                      <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                        {summary.permissions.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No permissions selected.
                          </p>
                        ) : (
                          summary.permissions.map((permission) => (
                            <div key={permission.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800">{permission.name}</p>
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{permission.level}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                              <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                                Enabled via {permission.roles.join(', ')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-700">
                        <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                        <p className="text-sm font-semibold">Governance safeguards</p>
                      </div>
                      {summary.conflicts.length > 0 ? (
                        <ul className="space-y-2 text-sm text-amber-800">
                          {summary.conflicts.map((conflict, index) => (
                            <li key={`${conflict.group}-${index}`}>
                              {conflict.roles.join(' and ')} cannot be combined. Choose one role per {conflict.group} track.
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-amber-800">No conflicts detected across the selected roles.</p>
                      )}
                      {summary.governanceWindows.length > 0 ? (
                        <p className="text-xs text-amber-700">
                          Governance windows: {summary.governanceWindows.join(', ')}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Controls</h3>
                      <div className="space-y-4 text-sm text-slate-600">
                        <Switch.Group as="div" className="flex items-center justify-between gap-3">
                          <span className="flex-1">
                            <Switch.Label className="font-semibold text-slate-800">Apply across every workspace</Switch.Label>
                            <Switch.Description className="text-xs text-slate-500">
                              When disabled, the assignment only affects the current workspace context.
                            </Switch.Description>
                          </span>
                          <Switch
                            checked={scopeAllWorkspaces}
                            onChange={setScopeAllWorkspaces}
                            className={clsx(
                              'relative inline-flex h-6 w-11 items-center rounded-full transition',
                              scopeAllWorkspaces ? 'bg-blue-600' : 'bg-slate-300',
                            )}
                          >
                            <span
                              className={clsx(
                                'inline-block h-5 w-5 transform rounded-full bg-white transition',
                                scopeAllWorkspaces ? 'translate-x-5' : 'translate-x-1',
                              )}
                            />
                          </Switch>
                        </Switch.Group>
                        <Switch.Group as="div" className="flex items-center justify-between gap-3">
                          <span className="flex-1">
                            <Switch.Label className="font-semibold text-slate-800">Notify the member</Switch.Label>
                            <Switch.Description className="text-xs text-slate-500">
                              Sends a branded summary detailing the updated responsibilities and next steps.
                            </Switch.Description>
                          </span>
                          <Switch
                            checked={notifyUser}
                            onChange={setNotifyUser}
                            className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition', notifyUser ? 'bg-blue-600' : 'bg-slate-300')}
                          >
                            <span className={clsx('inline-block h-5 w-5 transform rounded-full bg-white transition', notifyUser ? 'translate-x-5' : 'translate-x-1')} />
                          </Switch>
                        </Switch.Group>
                        <label className="block space-y-2 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">Governance notes</span>
                          <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={3}
                            placeholder="Document why the access change is required."
                            className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/80 px-8 py-6">
                  <div className="flex flex-col text-xs text-slate-500">
                    <span>{selectedCount} roles selected</span>
                    <span>Changes are logged in the compliance audit trail automatically.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onClose?.()}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Saving…' : 'Save assignments'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

RoleAssignmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  availableRoles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      permissions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          description: PropTypes.string,
          level: PropTypes.string,
        }),
      ),
      category: PropTypes.string,
      riskLevel: PropTypes.oneOf(['low', 'medium', 'high', 'critical']),
      riskScore: PropTypes.number,
      exclusiveGroup: PropTypes.string,
      governanceWindows: PropTypes.arrayOf(PropTypes.string),
      segments: PropTypes.arrayOf(PropTypes.string),
      shortcode: PropTypes.string,
    }),
  ),
  initialAssignments: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  loading: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

RoleAssignmentModal.defaultProps = {
  user: null,
  availableRoles: [],
  initialAssignments: [],
  loading: false,
  onClose: undefined,
  onSubmit: undefined,
};
