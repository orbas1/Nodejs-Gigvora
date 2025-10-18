import { formatRelativeTime } from '../../utils/date.js';

export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(0)}`;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function formatTimeAgo(value) {
  if (!value) return '—';
  return formatRelativeTime(value);
}

export function optionLabelFor(value, options) {
  const match = options.find((option) => option.value === value);
  return match ? match.label : value;
}

export function safeNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function toComboboxOption(role) {
  if (!role) {
    return null;
  }
  return {
    id: role.id,
    name: role.title,
    subtitle: role.organization,
    location: role.location,
  };
}
