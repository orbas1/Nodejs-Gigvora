import { formatRelativeTime } from '../../utils/date.js';

export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    const value = Number.parseFloat(amount) || 0;
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }
  return String(value)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const STATUS_TONES = {
  active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  in_escrow: 'text-blue-600 bg-blue-50 border-blue-200',
  funded: 'text-blue-600 bg-blue-50 border-blue-200',
  held: 'text-amber-600 bg-amber-50 border-amber-200',
  due_soon: 'text-amber-600 bg-amber-50 border-amber-200',
  disputed: 'text-rose-600 bg-rose-50 border-rose-200',
  overdue: 'text-rose-600 bg-rose-50 border-rose-200',
  paused: 'text-amber-600 bg-amber-50 border-amber-200',
  cancelled: 'text-slate-600 bg-slate-50 border-slate-200',
  refunded: 'text-rose-600 bg-rose-50 border-rose-200',
  released: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  default: 'text-slate-600 bg-slate-50 border-slate-200',
};

export function getStatusToneClasses(status) {
  const key = String(status ?? '').toLowerCase();
  return STATUS_TONES[key] ?? STATUS_TONES.default;
}

export function getRiskToneClasses(risk) {
  switch (risk) {
    case 'critical':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    default:
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function describeSchedule(date) {
  if (!date) {
    return 'Awaiting schedule';
  }
  return formatRelativeTime(date);
}

export function resolveCounterpartyName(counterparty) {
  if (!counterparty) {
    return null;
  }
  if (counterparty.displayName) {
    return counterparty.displayName;
  }
  const parts = [counterparty.firstName, counterparty.lastName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return counterparty.companyName ?? counterparty.email ?? counterparty.handle ?? null;
}

export function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
