import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const SEVERITY_STYLES = {
  critical: {
    badge: 'border-rose-400 bg-rose-50 text-rose-700 shadow-[0_10px_30px_-15px_rgba(225,29,72,0.45)]',
    meter: 'from-rose-500 to-rose-700',
  },
  high: {
    badge: 'border-amber-400 bg-amber-50 text-amber-700 shadow-[0_10px_30px_-15px_rgba(217,119,6,0.5)]',
    meter: 'from-amber-400 to-amber-600',
  },
  medium: {
    badge: 'border-sky-400 bg-sky-50 text-sky-700 shadow-[0_10px_30px_-15px_rgba(14,165,233,0.4)]',
    meter: 'from-sky-400 to-sky-600',
  },
  low: {
    badge: 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_10px_30px_-15px_rgba(16,185,129,0.4)]',
    meter: 'from-emerald-400 to-emerald-600',
  },
};

const defaultRiskThresholds = {
  critical: 85,
  high: 60,
  medium: 35,
};

function formatRelativeTime(value) {
  if (!value) return '—';
  const input = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (!(input instanceof Date) || Number.isNaN(input.getTime())) return '—';
  const diff = input.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return diff >= 0 ? `in ${minutes}m` : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return diff >= 0 ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getRiskBand(score, thresholds = defaultRiskThresholds) {
  const numeric = Number.parseFloat(score);
  if (!Number.isFinite(numeric)) return 'low';
  if (numeric >= thresholds.critical) return 'critical';
  if (numeric >= thresholds.high) return 'high';
  if (numeric >= thresholds.medium) return 'medium';
  return 'low';
}

function calculateInsights(items, slaMinutes) {
  if (!Array.isArray(items) || !items.length) {
    return {
      pending: 0,
      breached: 0,
      avgSlaRemaining: '—',
      highRisk: 0,
    };
  }

  const pending = items.filter((item) => item.status === 'pending').length;
  let breached = 0;
  let totalRemaining = 0;
  let countRemaining = 0;
  let highRisk = 0;

  items.forEach((item) => {
    const submittedAt = item.submittedAt || item.createdAt;
    if (item.status === 'pending' && submittedAt && Number.isFinite(Number(slaMinutes))) {
      const deadline = new Date(submittedAt).getTime() + Number(slaMinutes) * 60000;
      const diff = deadline - Date.now();
      if (diff <= 0) {
        breached += 1;
      } else {
        totalRemaining += diff;
        countRemaining += 1;
      }
    }
    const riskScore = item.riskScore ?? item.moderationScore ?? item.metadata?.score;
    if (getRiskBand(riskScore) !== 'low') {
      highRisk += 1;
    }
  });

  const avgRemaining = countRemaining ? Math.round(totalRemaining / countRemaining / 60000) : null;
  const avgSlaRemaining = avgRemaining === null ? '—' : `${avgRemaining}m`;

  return {
    pending,
    breached,
    avgSlaRemaining,
    highRisk,
  };
}

function useFilteredItems({
  items,
  searchQuery,
  statusFilter,
  severityFilter,
  onlyBreaching,
  slaMinutes,
  riskThresholds,
}) {
  return useMemo(() => {
    if (!Array.isArray(items)) return [];
    const loweredQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      if (severityFilter.length && !severityFilter.includes(item.severity)) {
        return false;
      }

      if (onlyBreaching) {
        const submittedAt = item.submittedAt || item.createdAt;
        if (submittedAt && Number.isFinite(Number(slaMinutes))) {
          const deadline = new Date(submittedAt).getTime() + Number(slaMinutes) * 60000;
          if (deadline > Date.now()) {
            return false;
          }
        } else if (item.status !== 'breached') {
          return false;
        }
      }

      if (loweredQuery) {
        const content = [
          item.title,
          item.author?.name,
          item.channel,
          item.summary,
          item.excerpt,
          item.reason,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!content.includes(loweredQuery)) {
          return false;
        }
      }

      const riskScore = item.riskScore ?? item.moderationScore ?? item.metadata?.score;
      const riskBand = getRiskBand(riskScore, riskThresholds);
      if (severityFilter.length && !severityFilter.includes(riskBand)) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, severityFilter, onlyBreaching, slaMinutes, riskThresholds]);
}

function InsightCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-700 border-emerald-200',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-700 border-amber-200',
    rose: 'from-rose-500/20 to-rose-600/10 text-rose-700 border-rose-200',
    slate: 'from-slate-500/20 to-slate-600/10 text-slate-700 border-slate-200',
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-soft ${toneClasses[tone]}`}>
      <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-white/40" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 shadow-inner">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['emerald', 'amber', 'rose', 'slate']).isRequired,
};

export default function ContentApprovalQueue({
  items,
  loading,
  onApprove,
  onReject,
  onBulkAction,
  onEscalate,
  onAssign,
  guidelines,
  slaMinutes,
  lastUpdated,
  insights,
  selectedItemId,
  onItemSelect,
  riskThresholds,
  onRefresh,
  onOpenGuidelines,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [severityFilter, setSeverityFilter] = useState([]);
  const [onlyBreaching, setOnlyBreaching] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((previous) =>
      previous.filter((id) => items?.some((item) => item.id === id)),
    );
  }, [items]);

  const effectiveRiskThresholds = { ...defaultRiskThresholds, ...(riskThresholds || {}) };

  const filteredItems = useFilteredItems({
    items,
    searchQuery,
    statusFilter,
    severityFilter,
    onlyBreaching,
    slaMinutes,
    riskThresholds: effectiveRiskThresholds,
  });

  const activeItem = useMemo(() => {
    if (!filteredItems.length) return null;
    if (selectedItemId) {
      return filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0];
    }
    if (selectedIds.length) {
      return filteredItems.find((item) => item.id === selectedIds[0]) ?? filteredItems[0];
    }
    return filteredItems[0];
  }, [filteredItems, selectedItemId, selectedIds]);

  useEffect(() => {
    if (activeItem && onItemSelect) {
      onItemSelect(activeItem);
    }
  }, [activeItem, onItemSelect]);

  const metrics = useMemo(() => {
    if (insights) return insights;
    return calculateInsights(items, slaMinutes);
  }, [insights, items, slaMinutes]);

  const statusTabs = [
    { id: 'pending', name: 'Awaiting review' },
    { id: 'in_review', name: 'In progress' },
    { id: 'approved', name: 'Approved' },
    { id: 'rejected', name: 'Rejected' },
    { id: 'all', name: 'All submissions' },
  ];

  function toggleSeverity(severity) {
    setSeverityFilter((previous) =>
      previous.includes(severity)
        ? previous.filter((value) => value !== severity)
        : [...previous, severity],
    );
  }

  function handleSelectAll() {
    setSelectedIds(filteredItems.map((item) => item.id));
  }

  function handleSelectNone() {
    setSelectedIds([]);
  }

  function handleSelectItem(id) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }

  function handleBulk(action) {
    if (!onBulkAction || !selectedIds.length) return;
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    onBulkAction(action, selectedItems);
  }

  const selectedCount = selectedIds.length;

  return (
    <section className="space-y-8">
      <header className="grid gap-6 rounded-4xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">Content governance</p>
            <h1 className="text-3xl font-semibold">Approval control tower</h1>
            <p className="text-sm text-white/70">
              Prioritise sensitive submissions, enforce editorial standards, and accelerate turnaround with live SLA tracking,
              severity triage, and contextual guidance for reviewers.
            </p>
            {lastUpdated ? (
              <p className="text-xs text-white/60">Snapshot refreshed {formatRelativeTime(lastUpdated)}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3 text-sm text-white/70">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold backdrop-blur transition hover:bg-white/20"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh queue
            </button>
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              <span>Aligned with governance SLA of {slaMinutes ?? '—'} minutes</span>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <InsightCard icon={ClockIcon} label="Active submissions" value={metrics.pending} tone="emerald" />
          <InsightCard icon={ExclamationTriangleIcon} label="SLA breaches" value={metrics.breached} tone="rose" />
          <InsightCard icon={BoltIcon} label="High risk" value={metrics.highRisk} tone="amber" />
          <InsightCard icon={CheckCircleIcon} label="Avg time remaining" value={metrics.avgSlaRemaining} tone="slate" />
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Filters</p>
              <p className="mt-1 text-sm text-slate-600">Focus on severity, SLA risk, or keywords to streamline reviews.</p>
            </div>
            <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 shadow-inner">
              {statusTabs.map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 rounded-2xl px-3 py-1.5 transition ${
                      active
                        ? 'bg-slate-900 text-white shadow-soft'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
            <label className="block space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Search</span>
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search author, keywords, or channel"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <FunnelIcon className="pointer-events-none absolute right-4 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
            </label>
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Severity</p>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_OPTIONS.map((severity) => {
                  const active = severityFilter.includes(severity);
                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => toggleSeverity(severity)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          severity === 'critical'
                            ? 'bg-rose-500'
                            : severity === 'high'
                              ? 'bg-amber-500'
                              : severity === 'medium'
                                ? 'bg-sky-500'
                                : 'bg-emerald-500'
                        }`}
                      />
                      {severity}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-inner">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-amber-500" aria-hidden="true" /> Only SLA breaches
              </span>
              <input
                type="checkbox"
                checked={onlyBreaching}
                onChange={(event) => setOnlyBreaching(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-accent"
              />
            </label>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> Review playbook
              </div>
              <p>
                We triage by severity, then by SLA breach risk. High-risk submissions must be reviewed within 15 minutes, with
                clear rationale recorded for every outcome.
              </p>
              <button
                type="button"
                onClick={onOpenGuidelines}
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
              >
                Open full guidelines <ChevronDoubleRightIcon className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">Team load</p>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-sky-500" aria-hidden="true" /> Active reviewers
                  </span>
                  <span>{items?.reduce((acc, item) => acc + (item.reviewers?.length ?? 0), 0) ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Items per reviewer
                  </span>
                  <span>
                    {items && items.length
                      ? Math.max(1, Math.round(items.length / Math.max(1, items.reduce((acc, item) => acc + (item.reviewers?.length ?? 0), 0))))
                      : '—'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selectedCount > 0 && selectedCount === filteredItems.length}
                onChange={(event) => (event.target.checked ? handleSelectAll() : handleSelectNone())}
                aria-label="Select all"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-accent"
              />
              <span className="font-semibold text-slate-900">{selectedCount} selected</span>
              <span className="hidden text-xs text-slate-500 lg:inline">{filteredItems.length} items in view</span>
              {loading ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <ArrowPathIcon className="h-3 w-3 animate-spin" aria-hidden="true" /> Refreshing
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleBulk('approve')}
                disabled={!selectedCount}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" /> Approve selected
              </button>
              <button
                type="button"
                onClick={() => handleBulk('reject')}
                disabled={!selectedCount}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Reject selected
              </button>
              <button
                type="button"
                onClick={() => handleBulk('escalate')}
                disabled={!selectedCount}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> Escalate
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>Queue</span>
                <span>{filteredItems.length} in view</span>
              </div>
              <div className="max-h-[520px] space-y-2 overflow-y-auto p-4">
                {!filteredItems.length ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
                    <ExclamationCircleIcon className="mb-3 h-12 w-12 text-slate-300" aria-hidden="true" />
                    <p>No submissions match the current filters.</p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                      onClick={() => {
                        setSearchQuery('');
                        setSeverityFilter([]);
                        setStatusFilter('pending');
                        setOnlyBreaching(false);
                      }}
                    >
                      Reset filters <ArrowPathIcon className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}

                {filteredItems.map((item) => {
                  const riskScore = item.riskScore ?? item.moderationScore ?? item.metadata?.score;
                  const riskBand = getRiskBand(riskScore, effectiveRiskThresholds);
                  const severityStyle = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES[riskBand];
                  const slaDeadline = item.submittedAt
                    ? new Date(new Date(item.submittedAt).getTime() + Number(slaMinutes ?? 0) * 60000)
                    : null;
                  const slaStatus = slaDeadline ? formatRelativeTime(slaDeadline) : '—';
                  const isSelected = selectedIds.includes(item.id);
                  const isActive = activeItem?.id === item.id;
                  return (
                    <article
                      key={item.id}
                      className={`group relative cursor-pointer rounded-2xl border p-4 transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900/90 text-white shadow-[0_25px_60px_-35px_rgba(15,23,42,0.8)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft'
                      }`}
                      onClick={() => {
                        handleSelectItem(item.id);
                        onItemSelect?.(item);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                                severityStyle.badge
                              }`}
                            >
                              {item.severity}
                              <span className="hidden items-center gap-1 text-[0.65rem] uppercase tracking-widest sm:flex">
                                <BoltIcon className="h-3 w-3" aria-hidden="true" /> {riskBand}
                              </span>
                            </span>
                            <span className="text-xs uppercase tracking-[0.3em] text-white/70 group-hover:text-white/90">
                              {item.channel ?? item.channelSlug ?? 'unassigned'}
                            </span>
                          </div>
                          <h3 className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {item.title ?? 'Untitled submission'}
                          </h3>
                          <p className={`line-clamp-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                            {item.summary ?? item.excerpt ?? 'No summary provided.'}
                          </p>
                          <div className={`flex flex-wrap items-center gap-4 text-[11px] ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                            <span>{item.author?.name ?? 'Unknown author'}</span>
                            <span>Submitted {formatRelativeTime(item.submittedAt ?? item.createdAt)}</span>
                            <span>SLA {slaStatus}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 text-xs">
                          <input
                            type="checkbox"
                            onChange={() => handleSelectItem(item.id)}
                            checked={isSelected}
                            aria-label={`Select ${item.title ?? 'submission'}`}
                            className="h-4 w-4 rounded border-white/40 text-white focus:ring-white/60"
                          />
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                            Risk {Number.isFinite(Number(riskScore)) ? Math.round(Number(riskScore)) : '—'}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
                {activeItem ? (
                  <div className="space-y-6">
                    <header className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Preview</p>
                        <h2 className="text-xl font-semibold text-slate-900">{activeItem.title ?? 'Untitled submission'}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                            {activeItem.author?.name ?? 'Unknown author'}
                          </span>
                          <span>Submitted {formatDate(activeItem.submittedAt ?? activeItem.createdAt)}</span>
                          <span>SLA deadline {activeItem.submittedAt && slaMinutes ? formatDate(
                            new Date(new Date(activeItem.submittedAt).getTime() + Number(slaMinutes) * 60000),
                          ) : '—'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => onAssign?.(activeItem)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Assign reviewer
                        </button>
                        <button
                          type="button"
                          onClick={() => onEscalate?.(activeItem)}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
                        >
                          Escalate
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove?.(activeItem)}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject?.(activeItem)}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 transition hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    </header>

                    <div className="space-y-4 text-sm text-slate-700">
                      <p className="rounded-2xl bg-slate-50/80 p-4 text-slate-600">
                        {activeItem.summary ?? activeItem.excerpt ?? 'No summary available for this submission.'}
                      </p>
                      {Array.isArray(activeItem.flags) && activeItem.flags.length ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Signals detected</p>
                          <ul className="space-y-2">
                            {activeItem.flags.map((flag) => (
                              <li key={flag.code ?? flag.message} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                <span className="font-semibold uppercase tracking-wide text-amber-600">{flag.code ?? 'FLAG'}</span>
                                <p className="mt-1 text-amber-700">{flag.message ?? 'Flagged by moderation models.'}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {Array.isArray(activeItem.attachments) && activeItem.attachments.length ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Attachments</p>
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {activeItem.attachments.map((attachment) => (
                              <li key={attachment.id ?? attachment.url} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                <span className="truncate">
                                  {attachment.label ?? attachment.filename ?? 'Attachment'}
                                </span>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-accent hover:underline"
                                >
                                  Preview
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {Array.isArray(activeItem.timeline) && activeItem.timeline.length ? (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Activity timeline</p>
                          <ol className="space-y-2 text-xs">
                            {activeItem.timeline.map((event) => (
                              <li key={event.id ?? event.timestamp} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900">{event.actor ?? 'System'}</span>
                                  <span className="text-slate-500">{formatRelativeTime(event.timestamp)}</span>
                                </div>
                                <p className="mt-1 text-slate-600">{event.summary ?? 'Action recorded.'}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-sm text-slate-500">
                    <DocumentMagnifyingGlassIcon className="mb-3 h-12 w-12 text-slate-300" aria-hidden="true" />
                    <p>Select a submission from the queue to review details.</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
                <h3 className="text-sm font-semibold text-slate-900">Governance guidelines</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Surface policy references, editorial guardrails, and severity-specific escalations to keep reviewers aligned.
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {(guidelines ?? []).map((guide) => (
                    <li key={guide.id ?? guide.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{guide.title}</p>
                          <p className="text-xs text-slate-500">{guide.description}</p>
                        </div>
                        {guide.link ? (
                          <a
                            href={guide.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                          >
                            View <ChevronDoubleRightIcon className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                  {!guidelines?.length ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-xs text-slate-500">
                      Add governance guidelines to brief reviewers on policy expectations.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ContentApprovalQueue.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      summary: PropTypes.string,
      excerpt: PropTypes.string,
      author: PropTypes.shape({
        name: PropTypes.string,
        avatar: PropTypes.string,
      }),
      channel: PropTypes.string,
      channelSlug: PropTypes.string,
      submittedAt: PropTypes.string,
      createdAt: PropTypes.string,
      severity: PropTypes.oneOf(SEVERITY_OPTIONS),
      status: PropTypes.string,
      reviewers: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
        }),
      ),
      riskScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      moderationScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      metadata: PropTypes.shape({
        score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
      flags: PropTypes.arrayOf(
        PropTypes.shape({
          code: PropTypes.string,
          message: PropTypes.string,
        }),
      ),
      attachments: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string,
          filename: PropTypes.string,
          url: PropTypes.string,
        }),
      ),
      timeline: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          timestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]),
          summary: PropTypes.string,
          actor: PropTypes.string,
        }),
      ),
    }),
  ),
  loading: PropTypes.bool,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onBulkAction: PropTypes.func,
  onEscalate: PropTypes.func,
  onAssign: PropTypes.func,
  guidelines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      link: PropTypes.string,
    }),
  ),
  slaMinutes: PropTypes.number,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  insights: PropTypes.shape({
    pending: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    breached: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avgSlaRemaining: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    highRisk: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onItemSelect: PropTypes.func,
  riskThresholds: PropTypes.shape({
    critical: PropTypes.number,
    high: PropTypes.number,
    medium: PropTypes.number,
  }),
  onRefresh: PropTypes.func,
  onOpenGuidelines: PropTypes.func,
};

ContentApprovalQueue.defaultProps = {
  items: [],
  loading: false,
  onApprove: undefined,
  onReject: undefined,
  onBulkAction: undefined,
  onEscalate: undefined,
  onAssign: undefined,
  guidelines: [],
  slaMinutes: 30,
  lastUpdated: null,
  insights: null,
  selectedItemId: null,
  onItemSelect: undefined,
  riskThresholds: null,
  onRefresh: undefined,
  onOpenGuidelines: undefined,
};

