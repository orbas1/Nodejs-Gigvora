export function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${Math.round(numeric * 100)}%`;
}

export function formatDate(value) {
  if (!value) {
    return 'Date TBC';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimelineDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return value ?? 'Upcoming';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value ?? '—';
  }
  if (numeric >= 1000000) {
    return `${(numeric / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return numeric.toString();
}

export function formatRelativeTime(value) {
  if (!value) {
    return 'moments ago';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) {
    return 'moments ago';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString();
}

export default {
  formatPercent,
  formatDate,
  formatTimelineDate,
  formatNumber,
  formatRelativeTime,
};
