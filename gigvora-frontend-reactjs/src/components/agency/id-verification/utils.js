export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(value) {
  if (value == null) {
    return '0';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric);
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function resolveName(user) {
  if (!user) return '—';
  if (user.name) return user.name;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return user.email ?? '—';
}

export function sanitizeCommaSeparated(value) {
  if (!value) {
    return undefined;
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(',');
}

export function parseWorkspaceId(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function normalizeDateTimeLocal(value) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}
