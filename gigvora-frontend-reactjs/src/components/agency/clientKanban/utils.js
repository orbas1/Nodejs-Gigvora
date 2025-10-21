export const HEALTH_TONES = Object.freeze({
  healthy: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
  monitor: 'text-amber-700 bg-amber-100/80 border-amber-200',
  at_risk: 'text-rose-700 bg-rose-100/80 border-rose-200',
});

export const PRIORITY_TONES = Object.freeze({
  low: 'text-slate-600 bg-slate-100/80 border-slate-200',
  medium: 'text-blue-700 bg-blue-100/80 border-blue-200',
  high: 'text-amber-700 bg-amber-100/80 border-amber-200',
  critical: 'text-rose-700 bg-rose-100/80 border-rose-200',
});

export const RISK_TONES = Object.freeze({
  low: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
  medium: 'text-amber-700 bg-amber-100/80 border-amber-200',
  high: 'text-rose-700 bg-rose-100/80 border-rose-200',
});

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function formatCurrency(value, currency = 'USD') {
  if (value == null || value === '') {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: numeric < 1000 ? 2 : 0,
    }).format(numeric);
  } catch (error) {
    return `${numeric.toFixed(2)} ${currency || 'USD'}`;
  }
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export function formatRelative(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diffMs = date.getTime() - Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const absDiff = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (absDiff >= dayMs) {
    return formatter.format(Math.round(diffMs / dayMs), 'day');
  }
  return formatter.format(Math.round(diffMs / hourMs), 'hour');
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function parseTags(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function buildTagString(value) {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

export function isValidHexColor(value) {
  if (!value) {
    return false;
  }
  const trimmed = String(value).trim();
  if (trimmed.startsWith('var(')) {
    return true;
  }
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed);
}

export function normalizeExternalUrl(url) {
  if (!url) {
    return '';
  }
  const trimmed = String(url).trim();
  if (!trimmed) {
    return '';
  }
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
    const normalized = hasProtocol ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

export function buildTelHref(value) {
  if (!value) {
    return '';
  }
  const digits = String(value).replace(/[^+\d]/g, '');
  if (!digits) {
    return '';
  }
  return `tel:${digits}`;
}
