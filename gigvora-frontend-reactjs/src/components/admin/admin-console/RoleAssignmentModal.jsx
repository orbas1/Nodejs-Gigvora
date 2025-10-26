import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { analytics } from '../../../services/analytics.js';

const ROLE_TOKENS = [
  { id: 'super-admin', label: 'Super admin', category: 'Governance', description: 'All-encompassing control including billing, trust, and platform settings.', risk: 'high' },
  { id: 'platform-admin', label: 'Platform admin', category: 'Operations', description: 'Administer day-to-day user management, workflows, and automations.', risk: 'medium' },
  { id: 'operations-admin', label: 'Operations admin', category: 'Operations', description: 'Coordinate onboarding, compliance, and support escalations.', risk: 'medium' },
  { id: 'trust-admin', label: 'Trust & safety', category: 'Security', description: 'Manage verification, disputes, and enforcement across the network.', risk: 'high' },
  { id: 'finance-admin', label: 'Finance', category: 'Finance', description: 'Handle escrow, payouts, refunds, and financial reporting.', risk: 'medium' },
  { id: 'mentor-admin', label: 'Mentor program', category: 'Growth', description: 'Guide mentor onboarding, match programs, and success metrics.', risk: 'low' },
  { id: 'support-admin', label: 'Support', category: 'Operations', description: 'Lead support pods, assign tickets, and enforce SLAs.', risk: 'low' },
  { id: 'compliance-admin', label: 'Compliance', category: 'Security', description: 'Maintain compliance workflows, audits, and regulatory exports.', risk: 'high' },
];

const RISK_TOKENS = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/40',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-400/40',
  high: 'bg-rose-500/10 text-rose-600 border-rose-400/40',
};

function formatRoleLabel(roleId) {
  if (!roleId) return '';
  return roleId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normaliseRoles(metadata) {
  if (!metadata) {
    return ROLE_TOKENS;
  }

  const catalogue = Array.isArray(metadata)
    ? metadata
    : metadata.availableRoles ?? metadata.roles ?? Object.values(metadata);

  if (!Array.isArray(catalogue) || !catalogue.length) {
    return ROLE_TOKENS;
  }

  return catalogue.map((role) => ({
    id: role.id ?? role.value ?? role.key ?? role.name ?? role,
    label: role.label ?? role.name ?? formatRoleLabel(role.id ?? role.value ?? role),
    category: role.category ?? role.group ?? 'Operations',
    description:
      role.description ??
      role.caption ??
      'Privileged controls aligned to compliance, operations, or finance mandates.',
    risk: role.risk ?? (role.sensitivity === 'critical' ? 'high' : role.sensitivity ?? 'medium'),
    recommended: role.recommended ?? false,
  }));
}

function buildGroupedRoles(roles, searchTerm) {
  const normalisedTerm = (searchTerm ?? '').trim().toLowerCase();
  const filtered = roles.filter((role) => {
    if (!normalisedTerm) return true;
    return (
      role.label.toLowerCase().includes(normalisedTerm) ||
      role.description.toLowerCase().includes(normalisedTerm)
    );
  });

  const grouped = new Map();
  filtered.forEach((role) => {
    const category = role.category ?? 'Operations';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(role);
  });

  return Array.from(grouped.entries()).map(([category, categoryRoles]) => ({
    category,
    roles: categoryRoles.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

function RiskPill({ level }) {
  const tone = RISK_TOKENS[level] ?? RISK_TOKENS.medium;
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
      <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

RiskPill.propTypes = {
  level: PropTypes.string,
};

RiskPill.defaultProps = {
  level: 'medium',
};

export default function RoleAssignmentModal({
  open,
  user,
  metadata,
  saving,
  onClose,
  onSubmit,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(() => user?.roles ?? []);
  const [primaryRole, setPrimaryRole] = useState(() => user?.primaryRole ?? user?.roles?.[0] ?? '');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedRoles(user?.roles ?? []);
      setPrimaryRole(user?.primaryRole ?? user?.roles?.[0] ?? '');
      setExpiresAt('');
      setNotes('');
      setAcknowledged(false);
    }
  }, [open, user?.roles, user?.primaryRole]);

  const catalogue = useMemo(() => normaliseRoles(metadata), [metadata]);

  const recommendedRoles = useMemo(() => {
    const recommendedFlags = new Set();
    const sourceRecommendations = metadata?.recommendedRoles ?? user?.recommendedRoles ?? [];
    sourceRecommendations.forEach((role) => recommendedFlags.add(String(role)));
    catalogue.forEach((role) => {
      if (role.recommended) {
        recommendedFlags.add(String(role.id));
      }
    });
    if (!recommendedFlags.size) {
      return catalogue.slice(0, 3);
    }
    return catalogue.filter((role) => recommendedFlags.has(String(role.id)));
  }, [catalogue, metadata?.recommendedRoles, user?.recommendedRoles]);

  const groupedRoles = useMemo(
    () => buildGroupedRoles(catalogue, searchTerm),
    [catalogue, searchTerm],
  );

  const toggleRole = useCallback(
    (roleId) => {
      setSelectedRoles((current) => {
        const next = new Set(current ?? []);
        if (next.has(roleId)) {
          next.delete(roleId);
        } else {
          next.add(roleId);
        }
        const result = Array.from(next);
        if (!result.includes(primaryRole)) {
          setPrimaryRole(result[0] ?? '');
        }
        return result;
      });
    },
    [primaryRole],
  );

  const canSubmit = selectedRoles.length > 0 && acknowledged && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    const payload = {
      roles: selectedRoles,
      primaryRole: primaryRole || selectedRoles[0],
      expiresAt: expiresAt || null,
      notes: notes.trim() || null,
    };
    analytics.track('admin.roles.save', {
      userId: user?.id ?? null,
      roles: payload.roles,
      primaryRole: payload.primaryRole,
      expiresAt: payload.expiresAt,
    });
    await onSubmit?.(payload);
    onClose?.();
  };

  const riskLevel = useMemo(() => {
    if (!selectedRoles.length) {
      return 'medium';
    }
    if (selectedRoles.some((roleId) => {
      const role = catalogue.find((item) => String(item.id) === String(roleId));
      return (role?.risk ?? 'medium') === 'high';
    })) {
      return 'high';
    }
    if (selectedRoles.some((roleId) => {
      const role = catalogue.find((item) => String(item.id) === String(roleId));
      return (role?.risk ?? 'medium') === 'medium';
    })) {
      return 'medium';
    }
    return 'low';
  }, [selectedRoles, catalogue]);

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-50" onClose={() => (saving ? null : onClose?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-2xl transition-all">
                <div className="flex flex-col gap-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <Dialog.Title className="text-2xl font-semibold text-slate-900">Assign roles & guardrails</Dialog.Title>
                    <p className="max-w-2xl text-sm text-slate-500">
                      Configure the exact access this teammate should have. Recommendations blend behavioural telemetry, compliance requirements, and the journeys outlined in user_experience.md.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <RiskPill level={riskLevel} />
                    <p className="text-xs text-slate-500">
                      Roles drive access to finance, trust, and governance controls. High-risk assignments trigger extra audit logging automatically.
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.2fr,0.8fr]">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Recommended roles</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {recommendedRoles.map((role) => {
                          const selected = selectedRoles.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => toggleRole(role.id)}
                              className={clsx(
                                'flex flex-col gap-2 rounded-3xl border px-4 py-3 text-left transition',
                                selected
                                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-blue-300',
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900">{role.label}</div>
                                {selected ? (
                                  <CheckCircleIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                                ) : (
                                  <SparklesIcon className="h-5 w-5 text-slate-300" aria-hidden="true" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{role.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">All roles</h3>
                        <div className="relative">
                          <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search roles"
                            className="w-64 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <ArrowTrendingUpIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {groupedRoles.map(({ category, roles }) => (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-900">{category}</h4>
                              <span className="text-xs text-slate-400">{roles.length} roles</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {roles.map((role) => {
                                const selected = selectedRoles.includes(role.id);
                                return (
                                  <label
                                    key={role.id}
                                    className={clsx(
                                      'flex cursor-pointer flex-col gap-2 rounded-3xl border px-4 py-3 transition',
                                      selected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300',
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                                        <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                                        checked={selected}
                                        onChange={() => toggleRole(role.id)}
                                      />
                                    </div>
                                    <RiskPill level={role.risk ?? 'medium'} />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                      <h3 className="text-sm font-semibold text-slate-900">Role summary</h3>
                      <p className="mt-2 text-xs text-slate-500">
                        Selected roles control the experiences, analytics, and governance surfaces this teammate can reach.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-slate-600">
                        {selectedRoles.length === 0 ? (
                          <li className="text-xs text-slate-400">Choose at least one role to continue.</li>
                        ) : null}
                        {selectedRoles.map((roleId) => {
                          const role = catalogue.find((item) => String(item.id) === String(roleId));
                          return (
                            <li
                              key={roleId}
                              className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm"
                            >
                              <span className="font-semibold text-slate-900">{role?.label ?? formatRoleLabel(roleId)}</span>
                              <button
                                type="button"
                                onClick={() => toggleRole(roleId)}
                                className="rounded-full bg-slate-900/10 p-1 text-slate-500 hover:text-slate-900"
                              >
                                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Primary role
                        <select
                          value={primaryRole}
                          onChange={(event) => setPrimaryRole(event.target.value)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">Select primary role</option>
                          {selectedRoles.map((roleId) => {
                            const role = catalogue.find((item) => String(item.id) === String(roleId));
                            return (
                              <option key={roleId} value={roleId}>
                                {role?.label ?? formatRoleLabel(roleId)}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Expiration (optional)
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(event) => setExpiresAt(event.target.value)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Notes for audit trail
                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          rows={4}
                          placeholder="Document the business reason, partner approvals, or ticket references."
                          className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <input
                          type="checkbox"
                          checked={acknowledged}
                          onChange={(event) => setAcknowledged(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                        />
                        I confirm these assignments comply with legal, privacy, and trust guidelines.
                      </label>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ShieldCheckIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                        Audit preview
                      </div>
                      <p className="text-xs text-slate-500">
                        A signed audit event will be stored with persona, acting admin, timestamp, and justification. Access revocations automatically notify affected teams and update analytics funnels.
                      </p>
                      <ul className="space-y-2 text-xs text-slate-500">
                        <li>• Roles: {selectedRoles.join(', ') || '—'}</li>
                        <li>• Primary: {primaryRole || '—'}</li>
                        <li>• Expires: {expiresAt ? new Date(expiresAt).toLocaleString() : 'No expiry set'}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-8 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    Changes trigger alerts in the governance timeline and notify finance if payout permissions change.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onClose?.()}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
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
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    primaryRole: PropTypes.string,
    recommendedRoles: PropTypes.arrayOf(PropTypes.string),
  }),
  metadata: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({
      availableRoles: PropTypes.array,
      roles: PropTypes.array,
      recommendedRoles: PropTypes.array,
    }),
  ]),
  saving: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

RoleAssignmentModal.defaultProps = {
  user: null,
  metadata: null,
  saving: false,
  onClose: undefined,
  onSubmit: undefined,
};
