const STATUS_PRESETS = Object.freeze({
  notified: {
    key: 'notified',
    label: 'Live invitation',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  pending: {
    key: 'pending',
    label: 'Pending rotation',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  completed: {
    key: 'completed',
    label: 'Completed rotation',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  accepted: {
    key: 'accepted',
    label: 'Invitation accepted',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  declined: {
    key: 'declined',
    label: 'Invitation declined',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  expired: {
    key: 'expired',
    label: 'Invitation expired',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  dropped: {
    key: 'dropped',
    label: 'Manually removed',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  default: {
    key: 'default',
    label: 'Queued',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
  },
});

export function normalizeAutoAssignStatus(status) {
  if (typeof status !== 'string') {
    return 'default';
  }
  const normalised = status.trim().toLowerCase();
  return STATUS_PRESETS[normalised] ? normalised : 'default';
}

export function getAutoAssignStatusPreset(status) {
  const key = normalizeAutoAssignStatus(status);
  return STATUS_PRESETS[key] ?? STATUS_PRESETS.default;
}

export function formatAutoAssignStatus(status) {
  return getAutoAssignStatusPreset(status).label;
}

export const AUTO_ASSIGN_STATUS_PRESETS = STATUS_PRESETS;
