export function formatCurrency(entry, fallbackCurrency = 'USD') {
  if (!entry) {
    return '—';
  }

  const amount = typeof entry === 'number' ? entry : entry.amount;
  const currency = (typeof entry === 'object' && entry.currency) || fallbackCurrency || 'USD';

  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '—';
  }

  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    });
    return formatter.format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value) * 100)}%`;
}

export function formatHours(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const hours = Number(value);
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hrs`;
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`.slice(0, 10);
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeInput(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
}

export function safeNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

export function normalizeLookup(list, fallback = []) {
  if (Array.isArray(list)) {
    return list;
  }
  if (list && typeof list === 'object') {
    return Object.values(list);
  }
  return fallback;
}
