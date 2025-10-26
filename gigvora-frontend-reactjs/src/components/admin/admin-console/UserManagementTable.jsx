import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ROW_HEIGHT = 72;
const OVERSCAN = 6;
const DEFAULT_SEGMENTS = [
  { id: 'ops', label: 'Ops-critical', filters: { status: 'active', risk: 'high' } },
  { id: 'security', label: 'Security review', filters: { twoFactor: false, risk: 'medium' } },
  { id: 'mentors', label: 'Mentor onboarding', filters: { role: 'mentor-admin', status: 'invited' } },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'active', label: 'Active' },
  { id: 'invited', label: 'Invited' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'archived', label: 'Archived' },
];

const DEFAULT_RISK_OPTIONS = [
  { id: 'all', label: 'All risk levels' },
  { id: 'low', label: 'Low', tone: 'emerald' },
  { id: 'medium', label: 'Medium', tone: 'amber' },
  { id: 'high', label: 'High', tone: 'rose' },
];

const TWO_FACTOR_OPTIONS = [
  { id: 'all', label: 'All 2FA' },
  { id: 'enabled', label: 'Enabled' },
  { id: 'disabled', label: 'Disabled' },
];

function useVirtualisedRows(items) {
  const scrollContainerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(ROW_HEIGHT * 8);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return () => {};
    }

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    setViewportHeight(element.clientHeight || ROW_HEIGHT * 8);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(element);
    }

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect?.();
    };
  }, []);

  const { startIndex, endIndex, offsetTop } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
    );
    const offset = start * ROW_HEIGHT;
    return { startIndex: start, endIndex: end, offsetTop: offset };
  }, [scrollTop, viewportHeight, items.length]);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const totalHeight = items.length * ROW_HEIGHT;

  return {
    scrollContainerRef,
    visibleItems,
    offsetTop,
    totalHeight,
  };
}

function StatusBadge({ status }) {
  const normalised = (status ?? 'unknown').toLowerCase();
  const toneMap = {
    active: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/40',
    invited: 'bg-blue-500/10 text-blue-600 ring-blue-500/40',
    suspended: 'bg-amber-500/10 text-amber-600 ring-amber-500/40',
    archived: 'bg-slate-500/10 text-slate-600 ring-slate-500/40',
  };
  const tone = toneMap[normalised] ?? 'bg-slate-500/10 text-slate-600 ring-slate-500/40';
  const label = normalised.charAt(0).toUpperCase() + normalised.slice(1);
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1', tone)}>
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: 'unknown',
};

function RiskBadge({ risk }) {
  const normalised = (risk ?? 'low').toLowerCase();
  const toneMap = {
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/40',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-400/40',
    high: 'bg-rose-500/10 text-rose-600 border-rose-400/40',
  };
  const tone = toneMap[normalised] ?? toneMap.low;
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
      <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {normalised.charAt(0).toUpperCase() + normalised.slice(1)}
    </span>
  );
}

RiskBadge.propTypes = {
  risk: PropTypes.string,
};

RiskBadge.defaultProps = {
  risk: 'low',
};

function VerificationBadge({ verified, twoFactorEnabled, twoFactorMethod }) {
  const identityBadge = verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
      <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
      <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
      Identity pending
    </span>
  );

  const methodLabel = twoFactorMethod ? twoFactorMethod.toUpperCase() : '';
  const twoFactorBadge = twoFactorEnabled ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
      <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {`2FA ${methodLabel || 'ENABLED'}`}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
      <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
      2FA disabled
    </span>
  );

  return <div className="flex flex-wrap items-center gap-1">{identityBadge}{twoFactorBadge}</div>;
}

VerificationBadge.propTypes = {
  verified: PropTypes.bool,
  twoFactorEnabled: PropTypes.bool,
  twoFactorMethod: PropTypes.string,
};

VerificationBadge.defaultProps = {
  verified: false,
  twoFactorEnabled: true,
  twoFactorMethod: 'email',
};

function useSavedSegments(customSegments) {
  return useMemo(() => {
    if (!customSegments) {
      return DEFAULT_SEGMENTS;
    }
    const merged = Array.isArray(customSegments) ? customSegments : DEFAULT_SEGMENTS;
    return merged.length ? merged : DEFAULT_SEGMENTS;
  }, [customSegments]);
}

function useRiskOptions(riskLevels) {
  return useMemo(() => {
    if (!Array.isArray(riskLevels) || riskLevels.length === 0) {
      return DEFAULT_RISK_OPTIONS;
    }
    const unique = Array.from(
      new Set(
        riskLevels
          .map((level) => (typeof level === 'string' ? level.trim().toLowerCase() : null))
          .filter(Boolean),
      ),
    );
    if (unique.length === 0) {
      return DEFAULT_RISK_OPTIONS;
    }
    return [
      DEFAULT_RISK_OPTIONS[0],
      ...unique.map((level) => ({
        id: level,
        label: level.charAt(0).toUpperCase() + level.slice(1),
        tone: level === 'high' ? 'rose' : level === 'medium' ? 'amber' : 'emerald',
      })),
    ];
  }, [riskLevels]);
}

function resolveRiskToneClass(tone) {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-500';
    case 'amber':
      return 'bg-amber-500';
    case 'rose':
      return 'bg-rose-500';
    default:
      return 'bg-slate-900';
  }
}

function RowActions({ user, onOpenRoleModal, onInspectUser, onChangeStatus }) {
  const status = (user.status ?? 'active').toLowerCase();
  const nextStatus = status === 'active' ? 'suspended' : 'active';
  const statusLabel = status === 'active' ? 'Suspend' : 'Reinstate';
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onChangeStatus?.(user, nextStatus)}
        className={clsx(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
          status === 'active'
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
        )}
      >
        {statusLabel}
      </button>
      <button
        type="button"
        onClick={() => onChangeStatus?.(user, 'archived')}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
      >
        Archive
      </button>
      <button
        type="button"
        onClick={() => onOpenRoleModal?.(user)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
      >
        Manage roles
      </button>
      <button
        type="button"
        onClick={() => onInspectUser?.(user)}
        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700"
      >
        Open profile
      </button>
    </div>
  );
}

RowActions.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onOpenRoleModal: PropTypes.func,
  onInspectUser: PropTypes.func,
  onChangeStatus: PropTypes.func,
};

RowActions.defaultProps = {
  onOpenRoleModal: undefined,
  onInspectUser: undefined,
  onChangeStatus: undefined,
};

export default function UserManagementTable({
  items,
  loading,
  error,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onOpenRoleModal,
  onInspectUser,
  onChangeStatus,
  onExport,
  pagination,
  onPageChange,
  roleOptions,
  segments,
  onApplySegment,
  onBulkAction,
  riskLevels,
}) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
  const { scrollContainerRef, visibleItems, offsetTop, totalHeight } = useVirtualisedRows(items);

  useEffect(() => {
    setSearchDraft(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft !== filters.search) {
        onFiltersChange?.({ search: searchDraft });
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft, filters.search, onFiltersChange]);

  const computedRoleOptions = useMemo(() => {
    if (Array.isArray(roleOptions) && roleOptions.length) {
      return [{ id: 'all', label: 'All roles' }, ...roleOptions.map((role) => ({
        id: role.id ?? role.value ?? role,
        label: role.label ?? role.name ?? role,
      }))];
    }
    const derivedRoles = new Set();
    items.forEach((item) => {
      (item.roles ?? []).forEach((role) => derivedRoles.add(role));
    });
    return ['all', ...Array.from(derivedRoles)].map((role) => ({ id: role, label: role === 'all' ? 'All roles' : role }));
  }, [roleOptions, items]);

  const savedSegments = useSavedSegments(segments);
  const riskOptions = useRiskOptions(riskLevels);

  const selectedSet = useMemo(() => new Set((selectedIds ?? []).map(String)), [selectedIds]);
  const allVisibleSelected = visibleItems.every((item) => selectedSet.has(String(item.id)));

  const toggleSelectAll = useCallback(() => {
    if (!visibleItems.length) {
      return;
    }
    if (allVisibleSelected) {
      const remaining = (selectedIds ?? []).filter((identifier) => !visibleItems.some((item) => String(item.id) === String(identifier)));
      onSelectionChange?.(remaining);
    } else {
      const merged = new Set(selectedIds ?? []);
      visibleItems.forEach((item) => merged.add(String(item.id)));
      onSelectionChange?.(Array.from(merged));
    }
  }, [visibleItems, allVisibleSelected, onSelectionChange, selectedIds]);

  const toggleUserSelection = useCallback(
    (user) => {
      const identifier = String(user.id);
      const next = new Set(selectedIds ?? []);
      if (next.has(identifier)) {
        next.delete(identifier);
      } else {
        next.add(identifier);
      }
      onSelectionChange?.(Array.from(next));
    },
    [selectedIds, onSelectionChange],
  );

  const handleSort = useCallback(
    (field) => {
      const direction = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
      onSortChange?.({ field, direction });
    },
    [sort.field, sort.direction, onSortChange],
  );

  const handlePageChange = useCallback(
    (delta) => {
      if (!pagination) return;
      const nextOffset = Math.max(0, (pagination.offset ?? 0) + delta * (pagination.limit ?? 25));
      onPageChange?.({ offset: nextOffset });
    },
    [pagination, onPageChange],
  );

  const handleApplySegment = useCallback(
    (segment) => {
      onApplySegment?.(segment);
      if (segment?.filters) {
        onFiltersChange?.(segment.filters);
      }
    },
    [onApplySegment, onFiltersChange],
  );

  const hasSelection = (selectedIds?.length ?? 0) > 0;

  const exportDisabled = loading || !items.length;

  const totalRowsHeight = totalHeight || (loading ? ROW_HEIGHT * 6 : ROW_HEIGHT * Math.max(1, items.length));

  return (
    <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-lg shadow-blue-100/20">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">Workspace directory</h3>
          <p className="text-sm text-slate-500">
            Filter by risk, persona, or verification status. Bulk assign roles, export reports, and open detailed profiles without leaving the console.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by name, email, company, or role"
              className="w-72 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <FunnelIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={() => onExport?.()}
            disabled={exportDisabled}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <div className="flex items-center gap-2">
          <span>Status</span>
          <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onFiltersChange?.({ status: option.id })}
                className={clsx(
                  'rounded-full px-3 py-1 text-[11px] transition',
                  filters.status === option.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Role</span>
          <select
            value={filters.role ?? 'all'}
            onChange={(event) => onFiltersChange?.({ role: event.target.value })}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {computedRoleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>Risk</span>
          <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
            {riskOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onFiltersChange?.({ risk: option.id })}
                className={clsx(
                  'rounded-full px-3 py-1 text-[11px] transition',
                  filters.risk === option.id
                    ? `${resolveRiskToneClass(option.tone)} text-white shadow-sm`
                    : 'text-slate-600 hover:bg-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>2FA</span>
          <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
            {TWO_FACTOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onFiltersChange?.({ twoFactor: option.id })}
                className={clsx(
                  'rounded-full px-3 py-1 text-[11px] transition',
                  filters.twoFactor === option.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Segments</span>
          <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
            {savedSegments.map((segmentOption) => (
              <button
                key={segmentOption.id}
                type="button"
                onClick={() => handleApplySegment(segmentOption)}
                className="rounded-full px-3 py-1 text-[11px] text-slate-600 transition hover:bg-white"
              >
                {segmentOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-6 mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <div role="table" className="px-2 pb-4">
        <div role="rowgroup" className="sticky top-0 z-10 rounded-[28px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <div className="grid grid-cols-[48px,1.4fr,0.9fr,0.9fr,0.9fr,0.9fr,0.9fr] items-center gap-4">
            <div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                  onChange={toggleSelectAll}
                  checked={visibleItems.length > 0 && allVisibleSelected}
                  aria-label="Select all visible users"
                />
              </label>
            </div>
            <button type="button" onClick={() => handleSort('name')} className="text-left uppercase tracking-wide">
              User
            </button>
            <button type="button" onClick={() => handleSort('verification')} className="text-left uppercase tracking-wide">
              Verification
            </button>
            <button type="button" onClick={() => handleSort('roles')} className="text-left uppercase tracking-wide">
              Roles
            </button>
            <button type="button" onClick={() => handleSort('risk')} className="text-left uppercase tracking-wide">
              Risk
            </button>
            <button type="button" onClick={() => handleSort('status')} className="text-left uppercase tracking-wide">
              Status
            </button>
            <button type="button" onClick={() => handleSort('activity')} className="text-left uppercase tracking-wide">
              Activity
            </button>
          </div>
        </div>
        <div role="rowgroup" className="relative">
          <div
            ref={scrollContainerRef}
            className="max-h-[26rem] overflow-y-auto rounded-[28px]"
          >
            <div style={{ height: totalRowsHeight }} className="relative">
              <div
                style={{ transform: `translateY(${offsetTop}px)` }}
                className="absolute inset-x-0 top-0"
              >
                {loading && !items.length ? (
                  <div className="grid grid-cols-[48px,1.4fr,0.9fr,0.9fr,0.9fr,0.9fr,0.9fr] items-center gap-4 px-4 py-6 text-sm text-slate-500">
                    Loading directory…
                  </div>
                ) : null}
                {!loading && items.length === 0 ? (
                  <div className="grid grid-cols-[48px,1.4fr,0.9fr,0.9fr,0.9fr,0.9fr,0.9fr] items-center gap-4 px-4 py-6 text-sm text-slate-500">
                    No users match the current filters.
                  </div>
                ) : null}
                {visibleItems.map((user) => {
                  const identifier = String(user.id);
                  const selected = selectedSet.has(identifier);
                  const riskLevelRaw =
                    typeof user.riskLevel === 'string'
                      ? user.riskLevel
                      : typeof user.risk?.level === 'string'
                        ? user.risk.level
                        : typeof user.risk === 'string'
                          ? user.risk
                          : null;
                  const riskLevel = riskLevelRaw ? `${riskLevelRaw}`.toLowerCase() : 'low';
                  const lastSeen = user.lastSeenAt ?? user.lastLoginAt ?? user.updatedAt ?? user.createdAt;
                  const verified = Boolean(user.verified ?? user.identityVerified ?? user.identity?.status === 'verified');
                  const persona = user.persona ?? user.userType ?? 'member';
                  const activityLabel = lastSeen
                    ? new Date(lastSeen).toLocaleString()
                    : user.status === 'invited'
                    ? 'Awaiting activation'
                    : 'No activity recorded';
                  return (
                    <div
                      key={identifier}
                      role="row"
                      className={clsx(
                        'grid grid-cols-[48px,1.4fr,0.9fr,0.9fr,0.9fr,0.9fr,0.9fr] items-center gap-4 border-b border-slate-100 px-4 py-4 text-sm transition',
                        selected ? 'bg-blue-50/60' : 'bg-white',
                      )}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleUserSelection(user)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                          aria-label={`Select ${user.firstName ?? ''} ${user.lastName ?? ''}`}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {(user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()) || user.email}
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                          {persona}
                        </div>
                      </div>
                      <div>
                        <VerificationBadge
                          verified={verified}
                          twoFactorEnabled={user.twoFactorEnabled !== false}
                          twoFactorMethod={user.twoFactorMethod}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles ?? []).slice(0, 4).map((role) => (
                          <span key={`${identifier}-${role}`} className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                            {role}
                          </span>
                        ))}
                        {(user.roles?.length ?? 0) > 4 ? (
                          <span className="text-xs text-slate-400">+{user.roles.length - 4}</span>
                        ) : null}
                      </div>
                      <div>
                        <RiskBadge risk={riskLevel} />
                      </div>
                      <div>
                        <StatusBadge status={user.status} />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500">{activityLabel}</div>
                        <RowActions
                          user={user}
                          onOpenRoleModal={onOpenRoleModal}
                          onInspectUser={onInspectUser}
                          onChangeStatus={onChangeStatus}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {Math.min((pagination?.offset ?? 0) + 1, pagination?.total ?? 0)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min((pagination?.offset ?? 0) + (pagination?.limit ?? 0), pagination?.total ?? 0)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{pagination?.total ?? items.length}</span>
          </span>
          {hasSelection ? (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {selectedIds.length} selected
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onBulkAction?.('activate')}
            disabled={!hasSelection}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlusIcon className="h-4 w-4" aria-hidden="true" /> Activate
          </button>
          <button
            type="button"
            onClick={() => onBulkAction?.('suspend')}
            disabled={!hasSelection}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Suspend
          </button>
          <button
            type="button"
            onClick={() => onBulkAction?.('archive')}
            disabled={!hasSelection}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserMinusIcon className="h-4 w-4" aria-hidden="true" /> Archive
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(-1)}
              disabled={!pagination || ((pagination?.offset ?? 0) <= 0)}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={
                !pagination ||
                ((pagination?.offset ?? 0) + (pagination?.limit ?? 0) >= (pagination?.total ?? items.length))
              }
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UserManagementTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.string,
    riskLevel: PropTypes.string,
    riskScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    riskSummary: PropTypes.string,
    risk: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        level: PropTypes.string,
        score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        summary: PropTypes.string,
        assessedAt: PropTypes.string,
        factors: PropTypes.array,
      }),
    ]),
    userType: PropTypes.string,
    identityVerified: PropTypes.bool,
    twoFactorEnabled: PropTypes.bool,
    twoFactorMethod: PropTypes.string,
  })),
  loading: PropTypes.bool,
  error: PropTypes.string,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    role: PropTypes.string,
    risk: PropTypes.string,
    twoFactor: PropTypes.string,
  }),
  onFiltersChange: PropTypes.func,
  sort: PropTypes.shape({
    field: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc']),
  }),
  onSortChange: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onSelectionChange: PropTypes.func,
  onOpenRoleModal: PropTypes.func,
  onInspectUser: PropTypes.func,
  onChangeStatus: PropTypes.func,
  onExport: PropTypes.func,
  pagination: PropTypes.shape({
    offset: PropTypes.number,
    limit: PropTypes.number,
    total: PropTypes.number,
  }),
  onPageChange: PropTypes.func,
  roleOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ id: PropTypes.string, value: PropTypes.string, label: PropTypes.string, name: PropTypes.string }),
    ]),
  ),
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      filters: PropTypes.object,
    }),
  ),
  onApplySegment: PropTypes.func,
  onBulkAction: PropTypes.func,
  riskLevels: PropTypes.arrayOf(PropTypes.string),
};

UserManagementTable.defaultProps = {
  items: [],
  loading: false,
  error: '',
  filters: { search: '', status: 'all', role: 'all', risk: 'all', twoFactor: 'all' },
  onFiltersChange: undefined,
  sort: { field: 'activity', direction: 'desc' },
  onSortChange: undefined,
  selectedIds: [],
  onSelectionChange: undefined,
  onOpenRoleModal: undefined,
  onInspectUser: undefined,
  onChangeStatus: undefined,
  onExport: undefined,
  pagination: null,
  onPageChange: undefined,
  roleOptions: undefined,
  segments: undefined,
  onApplySegment: undefined,
  onBulkAction: undefined,
  riskLevels: undefined,
};
