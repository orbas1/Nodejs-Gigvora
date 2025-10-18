export function formatCurrency(cents, currency = 'USD') {
  if (cents == null || Number.isNaN(Number(cents))) {
    return '—';
  }
  const amount = Number(cents) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value, options = {}) {
  if (value == null || value === '') {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', options).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value))}%`;
}

export function formatDate(value, { withTime = false } = {}) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }
  const options = withTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  try {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    return `${date.toISOString()}`;
  }
}

export function parseCurrencyToCents(input) {
  if (input == null || input === '') {
    return null;
  }
  const numeric = Number.parseFloat(input);
  if (Number.isNaN(numeric)) {
    throw new Error('Enter a valid currency amount.');
  }
  return Math.round(numeric * 100);
}

export function parseInteger(input, { allowNull = true } = {}) {
  if (input == null || input === '') {
    if (allowNull) {
      return null;
    }
    throw new Error('Value is required.');
  }
  const numeric = Number.parseInt(input, 10);
  if (Number.isNaN(numeric)) {
    throw new Error('Enter a valid number.');
  }
  return numeric;
}

export function parseFloatValue(input, { allowNull = true } = {}) {
  if (input == null || input === '') {
    if (allowNull) {
      return null;
    }
    throw new Error('Value is required.');
  }
  const numeric = Number.parseFloat(input);
  if (Number.isNaN(numeric)) {
    throw new Error('Enter a valid number.');
  }
  return numeric;
}

export function parsePercent(input, { allowNull = true } = {}) {
  if (input == null || input === '') {
    return allowNull ? null : 0;
  }
  const numeric = Number.parseFloat(input);
  if (Number.isNaN(numeric)) {
    throw new Error('Enter a valid percentage.');
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function parseBoolean(input) {
  if (typeof input === 'boolean') {
    return input;
  }
  if (input == null) {
    return false;
  }
  const normalized = String(input).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
}

export function parseList(input) {
  if (Array.isArray(input)) {
    return input.map((value) => String(value).trim()).filter(Boolean);
  }
  if (typeof input !== 'string') {
    return [];
  }
  return input
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function listToMultiline(list) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }
  return list.join('\n');
}

export function safeJsonParse(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }
  try {
    const parsed = JSON.parse(input);
    return parsed;
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

export function jsonToTextarea(value) {
  if (value == null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

export function minutesToDuration(minutes) {
  if (minutes == null) {
    return '—';
  }
  const value = Number(minutes);
  if (!Number.isFinite(value)) {
    return '—';
  }
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  if (hours <= 0) {
    return `${remaining}m`;
  }
  if (remaining === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remaining}m`;
}

export function bytesToSize(bytes) {
  if (bytes == null) {
    return '—';
  }
  const value = Number(bytes);
  if (!Number.isFinite(value)) {
    return `${bytes}`;
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function ensureDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

export function formatStatus(value) {
  if (!value) {
    return '—';
  }
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseDateInput(value, { allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new Error('Date is required.');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date.');
  }
  return date.toISOString();
}
